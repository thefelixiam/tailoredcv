import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import type { Job, JobRequirements } from "../domain/types";
import { analyzeJobDescription } from "./ollamaParser";
interface JobRow {
    id: string;
    user_id: string;
    title: string;
    raw_description: string;
    requirements_json: string;
    analyzer: string | null;
    created_at: string;
    updated_at: string;
}
function rowToJob(row: JobRow): Job {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        rawDescription: row.raw_description,
        requirements: JSON.parse(row.requirements_json) as JobRequirements,
        analyzer: row.analyzer ?? "deterministic",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function validateRawDescription(raw: string): string {
    const text = raw.trim();
    if (text.length < 20)
        throw new Error("Job description is too short.");
    if (text.length > 100000)
        throw new Error("Job description is too long (max 100k characters).");
    return text;
}
export async function createJob(db: Database.Database, userId: string, rawDescription: string, title?: string): Promise<Job> {
    const raw = validateRawDescription(rawDescription);
    const { requirements, analyzer } = await analyzeJobDescription(raw);
    const now = new Date().toISOString();
    const row: JobRow = {
        id: randomUUID(),
        user_id: userId,
        title: title?.trim() || requirements.title || "Untitled position",
        raw_description: raw,
        requirements_json: JSON.stringify(requirements),
        analyzer,
        created_at: now,
        updated_at: now,
    };
    db.prepare("INSERT INTO jobs (id, user_id, title, raw_description, requirements_json, analyzer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(row.id, row.user_id, row.title, row.raw_description, row.requirements_json, row.analyzer, row.created_at, row.updated_at);
    return rowToJob(row);
}
export function getJob(db: Database.Database, userId: string, jobId: string): Job | null {
    const row = db.prepare("SELECT * FROM jobs WHERE id = ? AND user_id = ?").get(jobId, userId) as JobRow | undefined;
    return row ? rowToJob(row) : null;
}
export function listJobs(db: Database.Database, userId: string): Job[] {
    const rows = db
        .prepare("SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC")
        .all(userId) as JobRow[];
    return rows.map(rowToJob);
}
export async function updateJob(db: Database.Database, userId: string, jobId: string, patch: {
    title?: string;
    rawDescription?: string;
}): Promise<Job> {
    const existing = getJob(db, userId, jobId);
    if (!existing)
        throw new Error("Job not found.");
    const raw = patch.rawDescription !== undefined ? validateRawDescription(patch.rawDescription) : existing.rawDescription;
    const { requirements, analyzer } = await analyzeJobDescription(raw);
    const title = patch.title !== undefined ? patch.title.trim() || requirements.title : existing.title;
    db.prepare("UPDATE jobs SET title = ?, raw_description = ?, requirements_json = ?, analyzer = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(title, raw, JSON.stringify(requirements), analyzer, new Date().toISOString(), jobId, userId);
    const updated = getJob(db, userId, jobId);
    if (!updated)
        throw new Error("Job not found.");
    return updated;
}
export function deleteJob(db: Database.Database, userId: string, jobId: string): void {
    db.prepare("DELETE FROM jobs WHERE id = ? AND user_id = ?").run(jobId, userId);
}
export function getMyJob(userId: string, jobId: string): Job | null {
    return getJob(getDb(), userId, jobId);
}
export function listMyJobs(userId: string): Job[] {
    return listJobs(getDb(), userId);
}
