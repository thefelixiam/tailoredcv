"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { flattenProfileIssues, saveMyProfile, type FieldIssue } from "@/lib/profiles";
import { requireUser } from "@/lib/session";
export async function saveProfileAction(input: unknown): Promise<{
    ok: boolean;
    error?: string;
    fieldErrors?: FieldIssue[];
}> {
    const user = await requireUser();
    try {
        saveMyProfile(user.id, input);
    }
    catch (e) {
        if (e instanceof z.ZodError) {
            const fieldErrors = flattenProfileIssues(e);
            if (fieldErrors.length > 0)
                return { ok: false, fieldErrors };
        }
        return { ok: false, error: e instanceof Error ? e.message : "Could not save profile." };
    }
    revalidatePath("/profile");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { ok: true };
}
