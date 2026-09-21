import Link from "next/link";
import { listMyVariants } from "@/lib/cv/store";
import { TEMPLATES, getTemplate } from "@/lib/cv/templates";
import { listMyJobs } from "@/lib/jobs/store";
import { matchProfileToJob } from "@/lib/matching/engine";
import { getMyProfile } from "@/lib/profiles";
import { requireUser } from "@/lib/session";
import { createVariantAction } from "../jobs/[id]/actions";
function profileCompleteness(profile: ReturnType<typeof getMyProfile>): {
    percent: number;
    missing: string[];
} {
    const checks: [
        string,
        boolean
    ][] = [
        ["name", profile.fullName.trim().length > 0],
        ["title", profile.title.trim().length > 0],
        ["contact", profile.email.trim().length > 0 || profile.location.trim().length > 0],
        ["summary", profile.summary.trim().length > 0],
        ["skills", profile.skills.length > 0],
        ["experience", profile.experience.length > 0],
        ["projects", profile.projects.length > 0],
        ["education", profile.education.length > 0],
    ];
    const done = checks.filter(([, ok]) => ok).length;
    return {
        percent: Math.round((done / checks.length) * 100),
        missing: checks.filter(([, ok]) => !ok).map(([label]) => label),
    };
}
export default async function DashboardPage() {
    const user = await requireUser();
    const profile = getMyProfile(user.id);
    const completeness = profileCompleteness(profile);
    const jobs = listMyJobs(user.id);
    const matches = new Map(jobs.map((j) => [j.id, matchProfileToJob(profile, j)]));
    const variants = listMyVariants(user.id);
    return (<div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Generate tailored CVs from your master profile.</p>
        </div>
        <Link href="/" className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50">
          View portfolio
        </Link>
        <Link href="/jobs/new" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          + New application
        </Link>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Master profile — {completeness.percent}% complete</h2>
          <Link href="/profile" className="text-sm font-medium text-orange-700 hover:underline">
            Edit →
          </Link>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-orange-600" style={{ width: `${completeness.percent}%` }}/>
        </div>
        {completeness.missing.length > 0 && (<p className="mt-2 text-xs text-zinc-500">Missing: {completeness.missing.join(", ")}</p>)}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Generate a CV</h2>
          <Link href="/jobs" className="text-sm text-zinc-600 hover:underline">
            All applications →
          </Link>
        </div>
        {jobs.length === 0 ? (<p className="mt-2 text-sm text-zinc-600">
            No jobs yet. <Link href="/jobs/new" className="font-medium text-orange-700 hover:underline">Paste a job description</Link> to generate your first tailored CV.
          </p>) : (<ul className="mt-3 space-y-2">
            {jobs.map((job) => (<li key={job.id} className="flex flex-wrap items-center gap-3 rounded-md border border-zinc-100 p-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                    {job.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {matches.get(job.id)?.profileToJobScore ?? 0}% match ·{" "}
                    {matches.get(job.id)?.missingSkills.length ?? 0} missing skills
                  </p>
                </div>
                <form action={createVariantAction.bind(null, job.id)}>
                  <button type="submit" className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700">
                    Generate CV →
                  </button>
                </form>
              </li>))}
          </ul>)}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Your CVs ({variants.length})</h2>
        {variants.length === 0 ? (<p className="mt-2 text-sm text-zinc-600">No CVs generated yet.</p>) : (<ul className="mt-3 space-y-2">
            {variants.map(({ config, jobTitle }) => (<li key={config.id} className="flex flex-wrap items-center gap-3 rounded-md border border-zinc-100 p-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/cv/${config.id}`} className="font-medium hover:underline">
                    {jobTitle}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {getTemplate(config.templateId)?.name ?? config.templateId} · {config.selectedExperience.length} roles ·{" "}
                    {config.selectedProjects.length} projects
                  </p>
                </div>
                <Link href={`/cv/${config.id}`} className="text-xs font-medium text-orange-700 hover:underline">
                  Preview
                </Link>
                <a href={`/api/cv/${config.id}/pdf`} className="text-xs font-medium text-orange-700 hover:underline">
                  PDF
                </a>
              </li>))}
          </ul>)}
      </section>

      <p className="text-xs text-zinc-400">
        Templates available: {TEMPLATES.map((t) => t.name).join(", ")} — switch any time in the CV preview.
      </p>
    </div>);
}
