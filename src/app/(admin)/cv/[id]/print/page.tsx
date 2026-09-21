import { notFound } from "next/navigation";
import { CvRenderer } from "@/components/cv/CvRenderer";
import { resolveCv } from "@/lib/cv/config";
import { getMyCvVariant } from "@/lib/cv/store";
import { getMyJob } from "@/lib/jobs/store";
import { matchProfileToJob } from "@/lib/matching/engine";
import { getMyProfile } from "@/lib/profiles";
import { requireUser } from "@/lib/session";
export default async function CvPrintPage({ params }: {
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
    const resolved = resolveCv(profile, config, matchProfileToJob(profile, job));
    return (<div className="mx-auto w-full max-w-[210mm]">
      <CvRenderer templateId={config.templateId} cv={resolved}/>
    </div>);
}
