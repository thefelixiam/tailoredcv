import Link from "next/link";
import { notFound } from "next/navigation";
import { skillDisplayName } from "@/lib/skills/taxonomy";
import { getDb } from "@/lib/db";
import { getJob } from "@/lib/jobs/store";
import { matchProfileToJob } from "@/lib/matching/engine";
import { getMyProfile } from "@/lib/profiles";
import { requireUser } from "@/lib/session";
import { createVariantAction } from "./actions";
import { deleteJobAction } from "../actions";
export default async function JobReviewPage({ params }: {
    params: {
        id: string;
    };
}) {
    const user = await requireUser();
    const job = getJob(getDb(), user.id, params.id);
    if (!job)
        notFound();
    const profile = getMyProfile(user.id);
    const match = matchProfileToJob(profile, job);
    const req = job.requirements;
    const expById = new Map(profile.experience.map((e) => [e.id, e]));
    const projById = new Map(profile.projects.map((p) => [p.id, p]));
    const required = match.requirements.filter((r) => r.kind === "required");
    const preferred = match.requirements.filter((r) => r.kind === "preferred");
    return (<div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {req.seniority !== "unknown" && <span className="mr-2 rounded-full bg-zinc-100 px-2 py-0.5">{req.seniority}</span>}
            {req.yearsOfExperience !== null && <span className="mr-2 rounded-full bg-zinc-100 px-2 py-0.5">{req.yearsOfExperience}+ years</span>}
            Profile-to-job match: <strong>{match.profileToJobScore}%</strong>{" "}
            <span className="text-zinc-400">(share of recognized requirements evidenced by your profile)</span>{" "}
            <span className="rounded-full bg-zinc-100 px-2 py-0.5" title="Which analyzer extracted the requirements">
              {job.analyzer === "deterministic" ? "rule-based analysis" : `AI analysis (${job.analyzer})`}
            </span>
          </p>
        </div>
        <form action={deleteJobAction.bind(null, job.id)}>
          <button type="submit" className="text-sm text-red-600 hover:underline">Delete</button>
        </form>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-semibold">Required</h2>
          {required.length === 0 && <p className="text-sm text-zinc-500">None detected.</p>}
          <ul className="mt-2 space-y-1 text-sm">
            {required.map((r) => (<li key={r.skillId} className={r.status === "matched" ? "text-zinc-800" : "text-zinc-400"}>
                <span className="mr-2">{r.status === "matched" ? "✓" : "✗"}</span>
                {skillDisplayName(r.skillId)}
                {r.status === "missing" && <span className="ml-2 text-xs">(not in your profile — will not be claimed)</span>}
              </li>))}
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-semibold">Preferred</h2>
          {preferred.length === 0 && <p className="text-sm text-zinc-500">None detected.</p>}
          <ul className="mt-2 space-y-1 text-sm">
            {preferred.map((r) => (<li key={r.skillId} className={r.status === "matched" ? "text-zinc-800" : "text-zinc-400"}>
                <span className="mr-2">{r.status === "matched" ? "✓" : "✗"}</span>
                {skillDisplayName(r.skillId)}
              </li>))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Selected experience</h2>
        <ul className="mt-2 space-y-3">
          {match.experience.filter((s) => s.score > 0).map((s) => {
            const exp = expById.get(s.id);
            if (!exp)
                return null;
            return (<li key={s.id} className="rounded-md border border-zinc-100 p-3 text-sm">
                <p className="font-medium">✓ {exp.role} at {exp.company}</p>
                {s.reasons.map((r) => (<p key={r} className="mt-0.5 text-zinc-600">{r}</p>))}
              </li>);
        })}
          {match.experience.every((s) => s.score === 0) && (<p className="text-sm text-zinc-500">No experience matches this job yet — add relevant technologies to your profile.</p>)}
        </ul>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Selected projects</h2>
        <ul className="mt-2 space-y-3">
          {match.projects.filter((s) => s.score > 0).map((s) => {
            const proj = projById.get(s.id);
            if (!proj)
                return null;
            return (<li key={s.id} className="rounded-md border border-zinc-100 p-3 text-sm">
                <p className="font-medium">✓ {proj.name}</p>
                {s.reasons.map((r) => (<p key={r} className="mt-0.5 text-zinc-600">{r}</p>))}
              </li>);
        })}
          {match.projects.every((s) => s.score === 0) && (<p className="text-sm text-zinc-500">No projects match this job.</p>)}
        </ul>
      </section>

      <div className="flex items-center gap-4">
        <form action={createVariantAction.bind(null, job.id)}>
          <button type="submit" className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700">
            Generate CV preview →
          </button>
        </form>
        <Link href="/jobs" className="text-sm text-zinc-600 hover:underline">Back to applications</Link>
      </div>
    </div>);
}
