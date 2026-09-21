import Link from "next/link";
import { notFound } from "next/navigation";
import { CvEditor } from "@/components/CvEditor";
import { ScaleToFit } from "@/components/ScaleToFit";
import { CvRenderer } from "@/components/cv/CvRenderer";
import { getMyCvVariant } from "@/lib/cv/store";
import { resolveCv } from "@/lib/cv/config";
import { getMyJob } from "@/lib/jobs/store";
import { matchProfileToJob } from "@/lib/matching/engine";
import { getMyProfile } from "@/lib/profiles";
import { requireUser } from "@/lib/session";
import { deleteVariantAction } from "./actions";
export default async function CvPreviewPage({ params }: {
    params: {
        id: string;
    };
}) {
    const user = await requireUser();
    const config = getMyCvVariant(user.id, params.id);
    if (!config)
        notFound();
    const profile = getMyProfile(user.id);
    const job = getMyJob(user.id, config.jobId);
    if (!job)
        notFound();
    const match = matchProfileToJob(profile, job);
    const resolved = resolveCv(profile, config, match);
    return (<div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">CV preview</h1>
          <p className="text-sm text-zinc-600">
            Tailored for <Link href={`/jobs/${job.id}`} className="font-medium text-orange-700 hover:underline">{job.title}</Link> ·{" "}
            {match.profileToJobScore}% profile-to-job match
          </p>
        </div>
        <a href={`/api/cv/${config.id}/pdf`} className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500">
          Download A4 PDF
        </a>
        <form action={deleteVariantAction.bind(null, config.id)}>
          <button type="submit" className="text-sm text-red-600 hover:underline">Delete</button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="print:hidden">
          <CvEditor variantId={config.id} initial={config} profile={profile} match={match}/>
        </div>
        <div className="overflow-x-auto rounded-lg bg-zinc-200 p-4 print:overflow-visible print:bg-white print:p-0">
          <div className="mx-auto max-w-[210mm] shadow-2xl print:shadow-none">
            <ScaleToFit>
              <CvRenderer templateId={config.templateId} cv={resolved}/>
            </ScaleToFit>
          </div>
        </div>
      </div>
    </div>);
}
