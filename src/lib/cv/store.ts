import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import type { CvConfiguration } from "../domain/types";
import { getJob } from "../jobs/store";
import { isValidTemplateId } from "./templates";
interface CvRow {
    id: string;
    user_id: string;
    job_id: string;
    template_id: string;
    config_json: string;
    created_at: string;
    updated_at: string;
}
function rowToConfig(row: CvRow): CvConfiguration {
    return JSON.parse(row.config_json) as CvConfiguration;
}
export function saveCvVariant(db: Database.Database, userId: string, config: CvConfiguration): CvConfiguration {
    if (!isValidTemplateId(config.templateId))
        throw new Error("Unknown template.");
    if (config.userId !== userId)
        throw new Error("Cross-user write denied.");
    if (!getJob(db, userId, config.jobId))
        throw new Error("Unknown job.");
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO cv_variants (id, user_id, job_id, template_id, config_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET template_id = excluded.template_id, config_json = excluded.config_json, updated_at = excluded.updated_at`).run(config.id || randomUUID(), userId, config.jobId, config.templateId, JSON.stringify(config), now, now);
    return config;
}
export function getCvVariant(db: Database.Database, userId: string, variantId: string): CvConfiguration | null {
    const row = db
        .prepare("SELECT * FROM cv_variants WHERE id = ? AND user_id = ?")
        .get(variantId, userId) as CvRow | undefined;
    return row ? rowToConfig(row) : null;
}
export function listCvVariantsForJob(db: Database.Database, userId: string, jobId: string): CvConfiguration[] {
    const rows = db
        .prepare("SELECT * FROM cv_variants WHERE job_id = ? AND user_id = ? ORDER BY updated_at DESC")
        .all(jobId, userId) as CvRow[];
    return rows.map(rowToConfig);
}
export function deleteCvVariant(db: Database.Database, userId: string, variantId: string): void {
    db.prepare("DELETE FROM cv_variants WHERE id = ? AND user_id = ?").run(variantId, userId);
}
export function getMyCvVariant(userId: string, variantId: string): CvConfiguration | null {
    return getCvVariant(getDb(), userId, variantId);
}
export interface VariantWithJob {
    config: CvConfiguration;
    jobTitle: string;
}
export function listMyVariants(userId: string): VariantWithJob[] {
    const db = getDb();
    const rows = db
        .prepare(`SELECT v.config_json AS config_json, j.title AS job_title
       FROM cv_variants v JOIN jobs j ON j.id = v.job_id
       WHERE v.user_id = ? ORDER BY v.updated_at DESC`)
        .all(userId) as {
        config_json: string;
        job_title: string;
    }[];
    return rows.map((r) => ({ config: JSON.parse(r.config_json) as CvConfiguration, jobTitle: r.job_title }));
}
