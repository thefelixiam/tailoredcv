import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getDb } from "./db";
export const SESSION_COOKIE = "cv_tailor_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export interface PublicUser {
    id: string;
    email: string;
}
function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}
function rowToUser(row: {
    id: string;
    email: string;
}): PublicUser {
    return { id: row.id, email: row.email };
}
export function findUserByEmail(db: Database.Database, email: string): PublicUser | null {
    const row = db
        .prepare("SELECT id, email FROM users WHERE email = ?")
        .get(email.toLowerCase()) as {
        id: string;
        email: string;
    } | undefined;
    return row ? rowToUser(row) : null;
}
export async function registerUser(db: Database.Database, email: string, password: string): Promise<PublicUser> {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        throw new Error("Invalid email address.");
    }
    if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
    }
    if (findUserByEmail(db, normalized)) {
        throw new Error("An account with this email already exists.");
    }
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    db.prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)").run(id, normalized, passwordHash, new Date().toISOString());
    return { id, email: normalized };
}
export async function verifyLogin(db: Database.Database, email: string, password: string): Promise<PublicUser> {
    const row = db
        .prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
        .get(email.trim().toLowerCase()) as {
        id: string;
        email: string;
        password_hash: string;
    } | undefined;
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
        throw new Error("Invalid email or password.");
    }
    return rowToUser(row);
}
export function createSession(db: Database.Database, userId: string): {
    token: string;
    expiresAt: Date;
} {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(hashToken(token), userId, expiresAt.toISOString());
    return { token, expiresAt };
}
export function getSessionUser(db: Database.Database, token: string | undefined): PublicUser | null {
    if (!token)
        return null;
    const row = db
        .prepare(`SELECT u.id AS id, u.email AS email, s.expires_at AS expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`)
        .get(hashToken(token)) as {
        id: string;
        email: string;
        expires_at: string;
    } | undefined;
    if (!row)
        return null;
    if (new Date(row.expires_at).getTime() < Date.now()) {
        db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
        return null;
    }
    return rowToUser(row);
}
export function destroySession(db: Database.Database, token: string): void {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}
export function getSessionUserFromDefaultDb(token: string | undefined): PublicUser | null {
    return getSessionUser(getDb(), token);
}
