import { requireUser } from "@/lib/session";
import { getMyProfile } from "@/lib/profiles";
import { ProfileForm } from "@/components/ProfileForm";
export default async function ProfilePage() {
    const user = await requireUser();
    const profile = getMyProfile(user.id);
    return (<div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Master profile</h1>
        <p className="mt-1 text-sm text-zinc-600">
          The factual source of truth. CVs only ever select from what you enter here — nothing is invented.
        </p>
      </div>
      <ProfileForm initial={profile}/>
    </div>);
}
