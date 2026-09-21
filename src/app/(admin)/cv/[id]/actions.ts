"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { applyCvOverrides } from "@/lib/cv/config";
import { deleteCvVariant, getCvVariant, saveCvVariant } from "@/lib/cv/store";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";
export async function updateVariantAction(variantId: string, patch: unknown): Promise<{
    ok: boolean;
    error?: string;
}> {
    const user = await requireUser();
    const db = getDb();
    const existing = getCvVariant(db, user.id, variantId);
    if (!existing)
        return { ok: false, error: "CV not found." };
    try {
        saveCvVariant(db, user.id, applyCvOverrides(existing, patch));
    }
    catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Could not update CV." };
    }
    revalidatePath(`/cv/${variantId}`);
    return { ok: true };
}
export async function deleteVariantAction(variantId: string): Promise<void> {
    const user = await requireUser();
    const db = getDb();
    const existing = getCvVariant(db, user.id, variantId);
    const jobId = existing?.jobId;
    deleteCvVariant(db, user.id, variantId);
    redirect(jobId ? `/jobs/${jobId}` : "/jobs");
}
