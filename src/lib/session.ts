import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, createSession, destroySession, getSessionUserFromDefaultDb, type PublicUser, } from "@/lib/auth";
import { getDb } from "@/lib/db";
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
    const token = cookies().get(SESSION_COOKIE)?.value;
    return getSessionUserFromDefaultDb(token);
});
export async function requireUser(): Promise<PublicUser> {
    const user = await getCurrentUser();
    if (!user)
        redirect("/login");
    return user;
}
export function setSessionCookie(token: string, expiresAt: Date): void {
    cookies().set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
        secure: process.env.NODE_ENV === "production",
    });
}
export function clearSessionCookie(): void {
    cookies().delete(SESSION_COOKIE);
}
export async function logout(): Promise<void> {
    "use server";
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (token)
        destroySession(getDb(), token);
    clearSessionCookie();
    redirect("/login");
}
