"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import FormatCard from "./FormatCard";
import { ARTIST_ERRORS, parseJsonResponse, toFriendlyMessage } from "@/lib/errors";
import {
  ADD_ON_TYPES,
  FORMATS,
  INTERVIEW_QUESTIONS,
  formatMoney,
  type AddOnType,
  type FormatId,
} from "@/lib/constants";

type ArtistInfo = {
  name: string;
  artist_name: string;
  email: string;
  phone: string;
  city: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  spotify: string;
  soundcloud: string;
  apple_music: string;
  bio: string;
};

type MusicInfo = {
  song_title: string;
  artist_name: string;
  spotify_url: string;
  apple_music_url: string;
  youtube_url: string;
  soundcloud_url: string;
  audio_file_url: string;
  instrumental_file_url: string;
  lyrics: string;
  performance_notes: string;
  explicit_content: boolean;
};

type PrepInfo = {
  performance_vibe: string;
  special_requests: string;
  height: string;
  broll_preference: string;
  production_notes: string;
};

const STEPS = [
  "You",
  "Your Format",
  "Your Sound",
  "The Details",
  "Level Up",
  "Terms",
  "Review",
] as const;

const emptyArtist: ArtistInfo = {
  name: "",
  artist_name: "",
  email: "",
  phone: "",
  city: "",
  instagram: "",
  tiktok: "",
  youtube: "",
  spotify: "",
  soundcloud: "",
  apple_music: "",
  bio: "",
};

const emptyMusic: MusicInfo = {
  song_title: "",
  artist_name: "",
  spotify_url: "",
  apple_music_url: "",
  youtube_url: "",
  soundcloud_url: "",
  audio_file_url: "",
  instrumental_file_url: "",
  lyrics: "",
  performance_notes: "",
  explicit_content: false,
};

const emptyPrep: PrepInfo = {
  performance_vibe: "",
  special_requests: "",
  height: "",
  broll_preference: "",
  production_notes: "",
};

/** Everything worth surviving a trip to Stripe and back. */
type Draft = {
  artist: ArtistInfo;
  format: FormatId | null;
  music: MusicInfo;
  prep: PrepInfo;
  addOns: AddOnType[];
  interview: Record<string, string>;
  termsAccepted: boolean;
};

export const APPLY_DRAFT_KEY = "minit-made:apply-draft";

/**
 * Reads the saved draft. Returns null on the server and for a corrupt payload —
 * a bad draft must never be able to block the form.
 */
function readDraft(): Partial<Draft> | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(APPLY_DRAFT_KEY);
    return saved ? (JSON.parse(saved) as Partial<Draft>) : null;
  } catch {
    return null;
  }
}

/**
 * Which step to open on. Stripe's cancel URL carries `?step=review`; a bare
 * index works too. Read straight off the URL rather than through
 * useSearchParams so /apply stays statically rendered with no Suspense boundary.
 */
function readStep(): number {
  if (typeof window === "undefined") return 0;
  const raw = new URLSearchParams(window.location.search).get("step");
  if (!raw) return 0;
  const byName = STEPS.findIndex((s) => s.toLowerCase() === raw.toLowerCase());
  const index = byName >= 0 ? byName : Number(raw);
  return Number.isInteger(index) && index >= 0 && index < STEPS.length ? index : 0;
}

/**
 * True once the client has taken over from the server-rendered HTML.
 * useSyncExternalStore rather than a mount effect: restoring a draft by calling
 * setState inside an effect triggers a cascading re-render of the whole wizard.
 */
const subscribeToNothing = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );
}

export default function ApplyClient() {
  const [step, setStep] = useState(readStep);
  const [artist, setArtist] = useState<ArtistInfo>(() => ({ ...emptyArtist, ...readDraft()?.artist }));
  const [format, setFormat] = useState<FormatId | null>(() => readDraft()?.format ?? null);
  const [batch, setBatch] = useState<{ shoot_date: string; location: string } | null>(null);
  const [music, setMusic] = useState<MusicInfo>(() => ({ ...emptyMusic, ...readDraft()?.music }));
  const [prep, setPrep] = useState<PrepInfo>(() => ({ ...emptyPrep, ...readDraft()?.prep }));
  const [addOns, setAddOns] = useState<AddOnType[]>(() => readDraft()?.addOns ?? []);
  const [interview, setInterview] = useState<Record<string, string>>(() => readDraft()?.interview ?? {});
  const [termsAccepted, setTermsAccepted] = useState(() => readDraft()?.termsAccepted ?? false);
  const [pricing, setPricing] = useState<{
    base_price: number;
    add_ons_total: number;
    total_price: number;
    catalog?: { type: AddOnType; price: number }[];
  } | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Draft persistence. Stripe's cancel URL sends artists back here mid-application,
   * and a refresh or an accidental back is just as easy to hit — without this,
   * seven steps of typing are gone. sessionStorage rather than localStorage so a
   * shared phone doesn't hand the next person someone else's contact details.
   */
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    try {
      const draft: Draft = { artist, format, music, prep, addOns, interview, termsAccepted };
      sessionStorage.setItem(APPLY_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Storage blocked or full (private browsing) — the form still works.
    }
  }, [hydrated, artist, format, music, prep, addOns, interview, termsAccepted]);

  useEffect(() => {
    if (!format) return;
    const ac = new AbortController();
    fetch(`/api/batches?format=${format}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => setBatch(d.batch ?? null))
      .catch(() => {
        if (!ac.signal.aborted) setBatch(null);
      });
    return () => ac.abort();
  }, [format]);

  // Toggling add-ons fires concurrent requests; without cancelling, a stale
  // response can land last and show a total that undercounts the add-ons.
  useEffect(() => {
    if (!format) return;
    const ac = new AbortController();
    fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, addOns }),
      signal: ac.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        if (ac.signal.aborted) return;
        setPricing(d.error ? null : d);
        setPricingError(d.error ? ARTIST_ERRORS.pricingUnavailable : null);
        setPricingLoading(false);
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setPricing(null);
        setPricingError(ARTIST_ERRORS.pricingUnavailable);
        setPricingLoading(false);
      });
    return () => ac.abort();
  }, [format, addOns]);

  /**
   * What's still missing on this step, by the label the artist actually sees.
   * A disabled Continue with no explanation is a dead end — the error copy said
   * "fill in anything marked with *" and nothing marked which.
   */
  const missing = useMemo(() => {
    const need = (value: string, label: string) => (value.trim() ? null : label);
    switch (step) {
      case 0:
        return [
          need(artist.name, "Legal Name"),
          need(artist.artist_name, "Artist Name"),
          need(artist.email, "Email"),
          need(artist.phone, "Phone"),
          need(artist.city, "City"),
          need(artist.instagram, "Instagram"),
          need(artist.tiktok, "TikTok"),
        ].filter(Boolean) as string[];
      case 1:
        return format ? [] : ["a format"];
      case 2:
        return [need(music.song_title, "Song Title"), need(music.artist_name, "Track Artist")].filter(
          Boolean
        ) as string[];
      case 5:
        return termsAccepted ? [] : ["the terms"];
      default:
        return [];
    }
  }, [step, artist, format, music, termsAccepted]);

  const canNext = missing.length === 0;

  async function uploadFile(file: File, bucket: string, field: "audio_file_url" | "instrumental_file_url") {
    setUploading(field);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", bucket);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await parseJsonResponse(res, ARTIST_ERRORS.uploadFailed);
      setMusic((m) => ({ ...m, [field]: String(data.url) }));
    } catch (e) {
      setError(toFriendlyMessage(e, ARTIST_ERRORS.uploadFailed));
    } finally {
      setUploading(null);
    }
  }

  function toggleAddOn(id: AddOnType) {
    // Flag loading here rather than in the effect: the total is about to change.
    setPricingLoading(true);
    setAddOns((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  function selectFormat(id: FormatId) {
    setPricingLoading(true);
    setFormat(id);
  }

  async function submitAndPay() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist,
          format,
          music,
          prep,
          addOns,
          interview: addOns.includes("interview") ? interview : undefined,
          termsAccepted,
        }),
      });
      const data = await parseJsonResponse(res, ARTIST_ERRORS.checkoutFailed);
      if (!data.url) throw new Error("missing checkout url");
      window.location.href = String(data.url);
    } catch (e) {
      setError(toFriendlyMessage(e, ARTIST_ERRORS.checkoutFailed));
      setSubmitting(false);
    }
  }

  /**
   * The draft lives in sessionStorage and the opening step comes from the URL,
   * so neither is knowable while rendering on the server. Returning the shell
   * until hydration keeps the server and client trees identical — restoring
   * during render instead produced a hydration mismatch that React resolves by
   * throwing away the subtree and re-rendering it.
   */
  if (!hydrated) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16" aria-busy="true">
        <div className="mb-10">
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-gold w-0" />
          </div>
        </div>
        <div className="space-y-4" aria-hidden="true">
          <div className="h-8 w-1/2 rounded bg-surface" />
          <div className="h-40 rounded-xl bg-surface" />
          <div className="h-40 rounded-xl bg-surface" />
        </div>
      </main>
    );
  }

  /** Enter submits the step: advance, or pay on the last one. */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canNext) return;
    if (step < STEPS.length - 1) setStep((sIdx) => sIdx + 1);
    else void submitAndPay();
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
      <form onSubmit={handleSubmit} noValidate>
      <div className="mb-10">
        {/* Mobile: a single readable step marker. Desktop: the full trail. */}
        <div className="flex sm:hidden items-baseline justify-between text-xs mb-2">
          <span className="text-gold font-semibold">{STEPS[step]}</span>
          <span className="text-neutral-500">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <div className="hidden sm:flex justify-between text-xs text-neutral-500 mb-2">
          {STEPS.map((s, i) => (
            <span key={s} className={i === step ? "text-gold font-semibold" : ""}>
              {s}
            </span>
          ))}
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gold transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-300 text-sm">
          {error}
        </div>
      )}

      {step === 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Tell Us Who You Are</h2>
          <Field label="Legal Name *">
            <input className="input" value={artist.name} onChange={(e) => setArtist({ ...artist, name: e.target.value })} />
          </Field>
          <Field label="Artist Name *">
            <input className="input" value={artist.artist_name} onChange={(e) => setArtist({ ...artist, artist_name: e.target.value })} />
          </Field>
          <Field label="Email *">
            <input type="email" className="input" value={artist.email} onChange={(e) => setArtist({ ...artist, email: e.target.value })} />
          </Field>
          <Field label="Phone *">
            <input className="input" value={artist.phone} onChange={(e) => setArtist({ ...artist, phone: e.target.value })} />
          </Field>
          <Field label="City *">
            <input className="input" value={artist.city} onChange={(e) => setArtist({ ...artist, city: e.target.value })} />
          </Field>
          <Field label="Instagram *">
            <input className="input" value={artist.instagram} onChange={(e) => setArtist({ ...artist, instagram: e.target.value })} />
          </Field>
          <Field label="TikTok *">
            <input className="input" value={artist.tiktok} onChange={(e) => setArtist({ ...artist, tiktok: e.target.value })} />
          </Field>
          <Field label="YouTube">
            <input className="input" value={artist.youtube} onChange={(e) => setArtist({ ...artist, youtube: e.target.value })} />
          </Field>
          <Field label="Spotify">
            <input className="input" value={artist.spotify} onChange={(e) => setArtist({ ...artist, spotify: e.target.value })} />
          </Field>
          <Field label="SoundCloud">
            <input className="input" value={artist.soundcloud} onChange={(e) => setArtist({ ...artist, soundcloud: e.target.value })} />
          </Field>
          <Field label="Apple Music">
            <input className="input" value={artist.apple_music} onChange={(e) => setArtist({ ...artist, apple_music: e.target.value })} />
          </Field>
          <Field label="Bio">
            <textarea className="input" rows={3} value={artist.bio} onChange={(e) => setArtist({ ...artist, bio: e.target.value })} />
          </Field>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Pick Your Lane</h2>
          <p className="text-neutral-400 text-sm mb-4">
            However you show up, we&apos;re filming it. Watch each one, then pick your lane — we&apos;ll
            take care of the rest.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {FORMATS.map((f) => (
              <FormatCard
                key={f.id}
                name={f.name}
                description={f.description}
                poster={f.poster}
                video={f.video}
                selected={format === f.id}
                onSelect={() => selectFormat(f.id)}
              />
            ))}
          </div>
          {format && (
            <div className="card p-4 mt-4">
              {batch ? (
                <p className="text-sm">
                  You&apos;re looking at <strong>{batch.shoot_date}</strong> in <strong>{batch.location}</strong>. We&apos;ll confirm your exact time once you&apos;re in.
                </p>
              ) : (
                <p className="text-sm text-neutral-400">
                  We&apos;re lining up the next round for this one — apply now and you&apos;ll be first to hear the date.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Bring Your Sound</h2>
          <Field label="Song Title *">
            <input className="input" value={music.song_title} onChange={(e) => setMusic({ ...music, song_title: e.target.value })} />
          </Field>
          <Field label="Artist Name (on track) *">
            <input className="input" value={music.artist_name} onChange={(e) => setMusic({ ...music, artist_name: e.target.value })} />
          </Field>
          <p className="text-xs text-neutral-500 pt-2">Reference links (optional)</p>
          <Field label="Spotify URL">
            <input className="input" value={music.spotify_url} onChange={(e) => setMusic({ ...music, spotify_url: e.target.value })} />
          </Field>
          <Field label="Apple Music URL">
            <input className="input" value={music.apple_music_url} onChange={(e) => setMusic({ ...music, apple_music_url: e.target.value })} />
          </Field>
          <Field label="YouTube URL">
            <input className="input" value={music.youtube_url} onChange={(e) => setMusic({ ...music, youtube_url: e.target.value })} />
          </Field>
          <Field label="SoundCloud URL">
            <input className="input" value={music.soundcloud_url} onChange={(e) => setMusic({ ...music, soundcloud_url: e.target.value })} />
          </Field>
          <p className="text-xs text-neutral-500 pt-2">Production files</p>
          <Field label="Audio File (for production reference)">
            <input
              type="file"
              accept="audio/*"
              className="input"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "music-submissions", "audio_file_url")}
            />
            {uploading === "audio_file_url" && <p className="text-xs text-gold mt-1">Uploading…</p>}
            {music.audio_file_url && <p className="text-xs text-green-400 mt-1">Uploaded ✓</p>}
          </Field>
          <Field label="Instrumental File">
            <input
              type="file"
              accept="audio/*"
              className="input"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "music-submissions", "instrumental_file_url")}
            />
            {uploading === "instrumental_file_url" && <p className="text-xs text-gold mt-1">Uploading…</p>}
            {music.instrumental_file_url && <p className="text-xs text-green-400 mt-1">Uploaded ✓</p>}
          </Field>
          <Field label="Lyrics">
            <textarea className="input" rows={5} value={music.lyrics} onChange={(e) => setMusic({ ...music, lyrics: e.target.value })} />
          </Field>
          <Field label="Performance Notes">
            <textarea className="input" rows={3} value={music.performance_notes} onChange={(e) => setMusic({ ...music, performance_notes: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={music.explicit_content} onChange={(e) => setMusic({ ...music, explicit_content: e.target.checked })} />
            This track contains explicit content
          </label>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Dial In The Details</h2>
          <Field label="Performance Vibe">
            <input className="input" value={prep.performance_vibe} onChange={(e) => setPrep({ ...prep, performance_vibe: e.target.value })} />
          </Field>
          <Field label="Special Requests">
            <textarea className="input" rows={3} value={prep.special_requests} onChange={(e) => setPrep({ ...prep, special_requests: e.target.value })} />
          </Field>
          <Field label="Height (for framing)">
            <input className="input" value={prep.height} onChange={(e) => setPrep({ ...prep, height: e.target.value })} />
          </Field>
          <Field label="B-Roll Preference">
            <textarea className="input" rows={2} value={prep.broll_preference} onChange={(e) => setPrep({ ...prep, broll_preference: e.target.value })} />
          </Field>
          <Field label="Additional Production Notes">
            <textarea className="input" rows={2} value={prep.production_notes} onChange={(e) => setPrep({ ...prep, production_notes: e.target.value })} />
          </Field>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Level Up Your Moment</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {ADD_ON_TYPES.map((a) => {
              const price = pricing?.catalog?.find((c) => c.type === a.id)?.price;
              return (
                <label
                  key={a.id}
                  className={`card p-4 flex items-center justify-between gap-3 cursor-pointer ${addOns.includes(a.id) ? "border-gold" : ""}`}
                >
                  <span className="min-w-0">
                    <span className="block">{a.label}</span>
                    {price !== undefined && (
                      <span className="block text-xs text-neutral-500 mt-0.5">{formatMoney(price)}</span>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    className="shrink-0 w-5 h-5"
                    checked={addOns.includes(a.id)}
                    onChange={() => toggleAddOn(a.id)}
                  />
                </label>
              );
            })}
          </div>

          {pricingError ? (
            <p className="text-sm text-red-400 pt-2">{pricingError}</p>
          ) : pricing ? (
            <p className={`text-sm pt-2 transition-opacity ${pricingLoading ? "opacity-50" : "text-neutral-400"}`}>
              Running total:{" "}
              <span className="text-gold font-semibold">{formatMoney(pricing.total_price)}</span>{" "}
              <span className="text-neutral-600">
                ({formatMoney(pricing.base_price)} performance
                {pricing.add_ons_total > 0 ? ` + ${formatMoney(pricing.add_ons_total)} add-ons` : ""})
              </span>
            </p>
          ) : null}

          {addOns.includes("interview") && (
            <div className="card p-5 mt-6 space-y-4">
              <h3 className="font-bold text-gold">Interview Questions</h3>
              {INTERVIEW_QUESTIONS.map((q) => (
                <Field key={q.key} label={q.question}>
                  <textarea
                    className="input"
                    rows={2}
                    value={interview[q.key] ?? ""}
                    onChange={(e) => setInterview({ ...interview, [q.key]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
          )}
        </section>
      )}

      {step === 5 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Terms &amp; Consent</h2>
          <div className="card p-5 text-sm text-neutral-300 space-y-3 max-h-72 overflow-y-auto">
            <p>By proceeding you consent to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Being recorded during your performance</li>
              <li>Use of your name, likeness, and voice for promotional/distribution purposes</li>
              <li>Taking full responsibility for music rights on your submitted material</li>
              <li>Taking full responsibility for the content of your performance</li>
              <li>A non-refundable purchase policy</li>
              <li>Cancellation policy: 7+ days before your shoot allows rebooking; less than 7 days forfeits the booking</li>
            </ul>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1" />
            I confirm I have the necessary rights and permissions to perform and submit this music, and I accept the terms above.
          </label>
        </section>
      )}

      {step === 6 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Review</h2>
          <div className="card p-5 space-y-2 text-sm">
            <p><span className="text-neutral-500">Artist:</span> {artist.artist_name} ({artist.name})</p>
            <p><span className="text-neutral-500">Email:</span> {artist.email}</p>
            <p><span className="text-neutral-500">Format:</span> {FORMATS.find((f) => f.id === format)?.name}</p>
            <p><span className="text-neutral-500">When/Where:</span> {batch ? `${batch.shoot_date} — ${batch.location}` : "We'll be in touch"}</p>
            <p><span className="text-neutral-500">Song:</span> {music.song_title}</p>
            <p><span className="text-neutral-500">Add-ons:</span> {addOns.length ? addOns.map((a) => ADD_ON_TYPES.find((d) => d.id === a)?.label).join(", ") : "None"}</p>
          </div>
          <div className="card p-5 space-y-1 text-sm">
            <div className="flex justify-between"><span>Base performance</span><span>{pricing ? formatMoney(pricing.base_price) : "—"}</span></div>
            <div className="flex justify-between"><span>Add-ons</span><span>{pricing ? formatMoney(pricing.add_ons_total) : "—"}</span></div>
            <div className="flex justify-between font-bold text-gold text-base pt-2 border-t border-border mt-2">
              <span>Total</span><span>{pricing ? formatMoney(pricing.total_price) : "—"}</span>
            </div>
          </div>
          {pricingError && <p className="text-sm text-red-400">{pricingError}</p>}
          <button
            type="submit"
            disabled={submitting || !pricing || pricingLoading}
            className="btn-gold w-full text-lg"
          >
            {submitting
              ? "Taking you to payment…"
              : pricingLoading
                ? "Checking pricing…"
                : "Proceed to Payment"}
          </button>
        </section>
      )}

      {missing.length > 0 && (
        <p className="mt-8 text-sm text-neutral-500" role="status">
          Still needed: <span className="text-neutral-300">{missing.join(", ")}</span>
        </p>
      )}

      <div className="flex justify-between mt-4">
        <button
          type="button"
          onClick={() => setStep((sIdx) => Math.max(0, sIdx - 1))}
          disabled={step === 0}
          className="border border-border rounded-lg px-5 py-2 text-sm disabled:opacity-30"
        >
          Back
        </button>
        {step < STEPS.length - 1 && (
          <button type="submit" disabled={!canNext} className="btn-gold">
            Continue
          </button>
        )}
      </div>
      </form>
    </main>
  );
}

/**
 * Associates the label with the control it names.
 *
 * The label used to be a plain sibling, so every field in this seven-step form
 * was announced as unlabelled and tapping a label did not focus its input — a
 * real cost on mobile, which is where this audience is. cloneElement keeps all
 * 28 call sites unchanged.
 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  // Some fields carry status text after the control (upload progress), so only
  // the first element is the thing the label names.
  const [control, ...rest] = Children.toArray(children);
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-neutral-400 mb-1">
        {label}
      </label>
      {isValidElement<{ id?: string }>(control) ? cloneElement(control, { id }) : control}
      {rest}
    </div>
  );
}
