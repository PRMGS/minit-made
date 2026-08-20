"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Subscribes to a media query without a mount effect, so no setState-in-effect
 * cascade. Server snapshot is the conservative answer in both uses below.
 */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

type Props = {
  name: string;
  description: string;
  poster?: string;
  video?: string;
  selected: boolean;
  onSelect: () => void;
};

/**
 * A format choice with a moving preview.
 *
 * Format names are in-house language — "Hanging Mic" and "Running Gun" tell an
 * artist who has never shot with us nothing at all, and picking the wrong one is
 * a paid mistake nobody notices until the shoot. So the card leads with footage
 * and lets the name label it, rather than the other way round.
 *
 * Playback follows the input device: hover on a mouse, in-view on a phone, which
 * is the behaviour this audience already knows from every feed they use. Reduced
 * motion pins it to the still. Missing assets fall back rather than 404 into a
 * broken frame — there is no footage wired up yet, so today every card lands on
 * the placeholder and still reads as deliberate.
 */
export default function FormatCard({ name, description, poster, video, selected, onSelect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);

  const [active, setActive] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  const canHover = useMediaQuery("(hover: hover)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const showVideo = Boolean(video) && !videoFailed && !reducedMotion;
  const showPoster = Boolean(poster) && !posterFailed;

  // Touch devices have no hover, so the visible card is the one that plays.
  useEffect(() => {
    if (canHover || reducedMotion || !showVideo) return;
    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.intersectionRatio > 0.6),
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canHover, reducedMotion, showVideo]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (active) {
      // Autoplay can still be refused (low power mode); fall back to the still.
      void el.play().catch(() => setVideoFailed(true));
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [active]);

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      onMouseEnter={() => canHover && setActive(true)}
      onMouseLeave={() => canHover && setActive(false)}
      onFocus={() => canHover && setActive(true)}
      onBlur={() => canHover && setActive(false)}
      className={`card overflow-hidden text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
        selected ? "border-gold" : "hover:border-neutral-600"
      }`}
    >
      <div className="relative aspect-video bg-black overflow-hidden">
        {showVideo && (
          <video
            ref={videoRef}
            src={video}
            poster={showPoster ? poster : undefined}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              active ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {showPoster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            onError={() => setPosterFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              active && showVideo ? "opacity-0" : "opacity-100"
            }`}
          />
        )}

        {!showPoster && !showVideo && (
          <div className="hero-bg absolute inset-0 flex items-center justify-center">
            <span className="relative z-10 text-[0.65rem] uppercase tracking-[0.18em] text-neutral-500">
              Preview coming
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black to-transparent" />

        {showVideo && !active && (
          <span className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-full bg-black/70 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-neutral-300">
            {canHover ? "Hover to play" : "Preview"}
          </span>
        )}

        {selected && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-gold px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-black">
            Selected
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gold">{name}</h3>
        <p className="mt-1 text-sm text-neutral-400">{description}</p>
      </div>
    </button>
  );
}
