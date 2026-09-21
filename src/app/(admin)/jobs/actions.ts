"use server";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { createJob, deleteJob } from "@/lib/jobs/store";
import { requireUser } from "@/lib/session";
export async function createJobAction(formData: FormData): Promise<void> {
    const user = await requireUser();
    const title = String(formData.get("title") ?? "");
    const raw = String(formData.get("rawDescription") ?? "");
    let id: string;
    try {
        id = (await createJob(getDb(), user.id, raw, title || undefined)).id;
    }
    catch (e) {
        redirect("/jobs/new?error=" + encodeURIComponent(e instanceof Error ? e.message : "Could not analyze job."));
    }
    redirect(`/jobs/${id}`);
}
export async function deleteJobAction(jobId: string): Promise<void> {
    const user = await requireUser();
    deleteJob(getDb(), user.id, jobId);
    redirect("/jobs");
}
