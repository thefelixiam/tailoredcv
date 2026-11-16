import Link from "next/link";
import { getDb } from "@/lib/db";
import { listJobs } from "@/lib/jobs/store";
import { matchProfileToJob } from "@/lib/matching/engine";
import { getMyProfile } from "@/lib/profiles";
import { requireUser } from "@/lib/session";
export default async function JobsPage() {
    const user = await requireUser();
    const profile = getMyProfile(user.id);
    const jobs = listJobs(getDb(), user.id);
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="mt-1 text-sm text-zinc-600">One job → one analysis → tailored CV variants.</p>
        </div>
        <Link href="/jobs/new" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          + New application
        </Link>
      </div>

      {jobs.length === 0 ? (<p className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
          No applications yet. Paste your first job description to see how your profile matches.
        </p>) : (<ul className="space-y-3">
          {jobs.map((job) => {
                const match = matchProfileToJob(profile, job);
                return (<li key={job.id} className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex-1">
                  <Link href={`/jobs/${job.id}`} className="font-semibold hover:underline">
                    {job.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {job.requirements.requiredSkills.length} required · {job.requirements.preferredSkills.length} preferred ·{" "}
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span title="Share of recognized job requirements evidenced by your profile" className={`rounded-full px-3 py-1 text-sm font-medium ${match.profileToJobScore >= 60
                        ? "bg-emerald-50 text-emerald-700"
                        : match.profileToJobScore >= 30
                            ? "bg-amber-50 text-amber-700"
                            : "bg-zinc-100 text-zinc-600"}`}>
                  {match.profileToJobScore}% match
                </span>
                <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-orange-700 hover:underline">
                  Review →
                </Link>
              </li>);
            })}
        </ul>)}
    </div>);
}
