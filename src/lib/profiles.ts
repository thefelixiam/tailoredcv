import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb } from "./db";
import { emptyProfile, type UserProfile } from "./domain/types";
import { normalizeSkillList } from "./skills/taxonomy";
const optionalId = z.preprocess((v) => (v === "" ? undefined : v), z.string().min(1).optional());
export interface FieldIssue {
    path: string;
    message: string;
}
export function flattenProfileIssues(error: unknown): FieldIssue[] {
    if (!(error instanceof z.ZodError))
        return [];
    return error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
    }));
}
function isBlankRow(row: unknown): boolean {
    if (typeof row !== "object" || row === null)
        return true;
    return Object.entries(row).every(([key, value]) => {
        if (key === "id")
            return true;
        if (Array.isArray(value))
            return value.length === 0;
        return value === "" || value === null || value === undefined;
    });
}
function skipBlankRows<T>(items: T[] | undefined): T[] {
    return (items ?? []).filter((item) => !isBlankRow(item));
}
const achievementSchema = z.object({
    id: optionalId,
    text: z.string().trim().min(1, "Achievement text is required.").max(2000),
    tags: z.array(z.string()).default([]),
});
const experienceSchema = z.object({
    id: optionalId,
    company: z.string().trim().min(1, "Company is required.").max(200),
    role: z.string().trim().min(1, "Role is required.").max(200),
    startDate: z.string().trim().max(50).default(""),
    endDate: z.string().trim().max(50).nullable().default(null),
    location: z.string().trim().max(200).default(""),
    description: z.string().trim().max(5000).default(""),
    achievements: z.array(achievementSchema).default([]),
    technologies: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
});
const projectLinkSchema = z.object({
    label: z.string().trim().max(100).default(""),
    url: z.string().trim().max(500).default(""),
}).refine((l) => l.url === "" || /^https?:\/\/.+\..+/.test(l.url), {
    message: "Project link must be a valid http(s) URL or empty.",
});
const projectSchema = z.object({
    id: optionalId,
    name: z.string().trim().min(1, "Project name is required.").max(200),
    description: z.string().trim().max(5000).default(""),
    role: z.string().trim().max(200).default(""),
    technologies: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    links: z.array(projectLinkSchema).default([]),
    achievements: z.array(achievementSchema).default([]),
});
const urlOrEmpty = z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\/.+\..+/.test(v), { message: "Must be a valid http(s) URL or empty." });
export const profileInputSchema = z.object({
    fullName: z.string().trim().max(200).default(""),
    title: z.string().trim().max(200).default(""),
    location: z.string().trim().max(200).default(""),
    email: z.string().trim().max(200).default(""),
    phone: z.string().trim().max(50).default(""),
    website: urlOrEmpty.default(""),
    github: urlOrEmpty.default(""),
    linkedin: urlOrEmpty.default(""),
    photo: urlOrEmpty.default(""),
    summary: z.string().trim().max(5000).default(""),
    skills: z.array(z.string()).default([]),
    experience: z.array(experienceSchema).default([]),
    projects: z.array(projectSchema).default([]),
    education: z
        .array(z.object({
        id: optionalId,
        school: z.string().trim().min(1, "School is required.").max(200),
        degree: z.string().trim().max(200).default(""),
        field: z.string().trim().max(200).default(""),
        startYear: z.string().trim().max(10).default(""),
        endYear: z.string().trim().max(10).default(""),
    }))
        .default([]),
    certifications: z
        .array(z.object({
        id: optionalId,
        name: z.string().trim().min(1, "Certification name is required.").max(200),
        issuer: z.string().trim().max(200).default(""),
        year: z.string().trim().max(10).default(""),
    }))
        .default([]),
    languages: z
        .array(z.object({
        name: z.string().trim().min(1, "Language name is required.").max(100),
        level: z.string().trim().max(100).default(""),
    }))
        .default([]),
});
export type ProfileInput = z.input<typeof profileInputSchema>;
function withIds<T extends {
    id?: string;
}>(items: T[]): (T & {
    id: string;
})[] {
    return items.map((item) => ({ ...item, id: item.id && item.id.trim() ? item.id : randomUUID() }));
}
export function normalizeProfileInput(userId: string, input: unknown): UserProfile {
    const raw = (input ?? {}) as Record<string, unknown>;
    const dropBlankAchievements = (items: unknown[] | undefined) => skipBlankRows(items).map((item) => {
        if (typeof item !== "object" || item === null || !("achievements" in item))
            return item;
        const entry = item as Record<string, unknown>;
        const cleanedEntry = { ...entry, achievements: skipBlankRows(entry.achievements as unknown[] | undefined) } as Record<string, unknown>;
        if ("links" in entry)
            cleanedEntry.links = skipBlankRows(entry.links as unknown[] | undefined);
        return cleanedEntry;
    });
    const cleaned = {
        ...raw,
        experience: dropBlankAchievements(raw.experience as unknown[] | undefined),
        projects: dropBlankAchievements(raw.projects as unknown[] | undefined),
        education: skipBlankRows(raw.education as unknown[] | undefined),
        certifications: skipBlankRows(raw.certifications as unknown[] | undefined),
        languages: skipBlankRows(raw.languages as unknown[] | undefined),
    };
    const parsed = profileInputSchema.parse(cleaned);
    return {
        userId,
        fullName: parsed.fullName,
        title: parsed.title,
        location: parsed.location,
        email: parsed.email,
        phone: parsed.phone,
        website: parsed.website,
        github: parsed.github,
        linkedin: parsed.linkedin,
        photo: parsed.photo,
        summary: parsed.summary,
        skills: normalizeSkillList(parsed.skills),
        experience: withIds(parsed.experience).map((e) => ({
            ...e,
            technologies: normalizeSkillList(e.technologies),
            tags: normalizeSkillList(e.tags),
            achievements: withIds(e.achievements).map((a) => ({ ...a, tags: normalizeSkillList(a.tags) })),
        })),
        projects: withIds(parsed.projects).map((p) => ({
            ...p,
            technologies: normalizeSkillList(p.technologies),
            tags: normalizeSkillList(p.tags),
            achievements: withIds(p.achievements).map((a) => ({ ...a, tags: normalizeSkillList(a.tags) })),
        })),
        education: withIds(parsed.education),
        certifications: withIds(parsed.certifications),
        languages: parsed.languages,
    };
}
export function getProfile(db: Database.Database, userId: string): UserProfile {
    const row = db.prepare("SELECT json FROM profiles WHERE user_id = ?").get(userId) as {
        json: string;
    } | undefined;
    if (!row)
        return emptyProfile(userId);
    return JSON.parse(row.json) as UserProfile;
}
export function saveProfile(db: Database.Database, userId: string, input: unknown): UserProfile {
    const profile = normalizeProfileInput(userId, input);
    db.prepare(`INSERT INTO profiles (user_id, json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at`).run(userId, JSON.stringify(profile), new Date().toISOString());
    return profile;
}
export function getMyProfile(userId: string): UserProfile {
    return getProfile(getDb(), userId);
}
export function saveMyProfile(userId: string, input: unknown): UserProfile {
    return saveProfile(getDb(), userId, input);
}
