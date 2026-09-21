"use server";
import { redirect } from "next/navigation";
import { createSession, registerUser, verifyLogin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
export async function loginAction(formData: FormData): Promise<void> {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    let userId: string;
    try {
        userId = (await verifyLogin(getDb(), email, password)).id;
    }
    catch {
        redirect("/login?error=" + encodeURIComponent("Invalid email or password."));
    }
    const { token, expiresAt } = createSession(getDb(), userId);
    setSessionCookie(token, expiresAt);
    redirect("/dashboard");
}
export async function registerAction(formData: FormData): Promise<void> {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    let userId: string;
    try {
        userId = (await registerUser(getDb(), email, password)).id;
    }
    catch (e) {
        redirect("/login?error=" + encodeURIComponent(e instanceof Error ? e.message : "Registration failed."));
    }
    const { token, expiresAt } = createSession(getDb(), userId);
    setSessionCookie(token, expiresAt);
    redirect("/profile");
}
