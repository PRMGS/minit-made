import { getCrewOrNull } from "@/lib/auth";
import { SUPPORT_EMAIL } from "@/lib/errors";
import CrewProfileForm from "./CrewProfileForm";
import SignOutButton from "./SignOutButton";

export default async function CrewProfilePage() {
  const { crew, email } = await getCrewOrNull();

  // Previously this rendered "Loading…" forever for anyone without a crew row —
  // the exact state a new crew member is in between signing up and being added.
  if (!crew) {
    return (
      <div className="space-y-6 max-w-sm">
        <h1 className="text-2xl font-bold">Almost Set Up</h1>
        <p className="text-sm text-neutral-300">
          You&apos;re signed in as <strong>{email}</strong>, but that address isn&apos;t on the crew
          list yet. Ask whoever added you to check the email matches, then reload this page.
        </p>
        <p className="text-sm text-neutral-500">
          Still stuck? Reach us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-gold">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-sm">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <CrewProfileForm crew={crew} />
      <SignOutButton />
    </div>
  );
}
