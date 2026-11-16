import type { ResolvedCv } from "@/lib/domain/types";
import { humanizeDate } from "@/lib/dates";
export function formatRange(start: string, end: string | null): string {
    const s = humanizeDate(start);
    const e = end ? humanizeDate(end) : "";
    if (s && e)
        return `${s} — ${e}`;
    if (s)
        return `${s} — Present`;
    return e || "";
}
export type ContactKind = "location" | "email" | "phone" | "website" | "github" | "linkedin";
export interface ContactItem {
    kind: ContactKind;
    label: string;
    href?: string;
}
export function contactItems(cv: ResolvedCv): ContactItem[] {
    const items: ContactItem[] = [];
    if (cv.location)
        items.push({ kind: "location", label: cv.location });
    if (cv.email)
        items.push({ kind: "email", label: cv.email, href: `mailto:${cv.email}` });
    if (cv.phone)
        items.push({ kind: "phone", label: cv.phone, href: `tel:${cv.phone.replace(/\s+/g, "")}` });
    if (cv.website)
        items.push({ kind: "website", label: shortUrl(cv.website), href: cv.website });
    if (cv.github)
        items.push({ kind: "github", label: contactHandle(cv.github), href: cv.github });
    if (cv.linkedin)
        items.push({ kind: "linkedin", label: contactHandle(cv.linkedin), href: cv.linkedin });
    return items;
}
function shortUrl(url: string): string {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
function contactHandle(url: string): string {
    try {
        const parsed = new URL(url);
        const segments = parsed.pathname.split("/").filter(Boolean);
        const last = segments.length > 0 ? decodeURIComponent(segments[segments.length - 1]) : "";
        return last || shortUrl(url);
    }
    catch {
        return shortUrl(url);
    }
}
export function hasSection(cv: ResolvedCv, section: string): boolean {
    return cv.includedSections.includes(section as (typeof cv.includedSections)[number]);
}
