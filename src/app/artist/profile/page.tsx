import { getCurrentArtist } from "@/lib/auth";
import ProfileForm from "./ProfileForm";

export default async function ArtistProfilePage() {
  const { artist } = await getCurrentArtist();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <ProfileForm artist={artist} />
    </div>
  );
}
