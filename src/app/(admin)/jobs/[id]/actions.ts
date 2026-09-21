"use server";
import { redirect } from "next/navigation";
import { buildCvConfiguration } from "@/lib/cv/config";
import { saveCvVariant } from "@/lib/cv/store";
import { getDb } from "@/lib/db";
import { getJob } from "@/lib/jobs/store";
import { matchProfileToJob } from "@/lib/matching/engine";
import { getMyProfile } from "@/lib/profiles";
import { requireUser } from "@/lib/session";
export async function createVariantAction(jobId: string): Promise<void> {
    const user = await requireUser();
    const db = getDb();
    const job = getJob(db, user.id, jobId);
    if (!job)
        redirect("/jobs");
    const profile = getMyProfile(user.id);
    const match = matchProfileToJob(profile, job);
    const config = buildCvConfiguration(profile, job, match);
    saveCvVariant(db, user.id, config);
    redirect(`/cv/${config.id}`);
}
