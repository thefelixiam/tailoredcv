import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSession, destroySession, getSessionUser, registerUser, verifyLogin } from "./auth";
import { openTestDb } from "./db";
import { flattenProfileIssues, getProfile, normalizeProfileInput, saveProfile } from "./profiles";
let dir: string;
let db: Database.Database;
beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "cvt-"));
    db = openTestDb(join(dir, "test.db"));
});
afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
});
describe("auth", () => {
    it("registers, logs in, and resolves sessions", async () => {
        const user = await registerUser(db, "dev@example.com", "s3cret-password");
        expect(user.email).toBe("dev@example.com");
        const loggedIn = await verifyLogin(db, "dev@example.com", "s3cret-password");
        expect(loggedIn.id).toBe(user.id);
        const { token } = createSession(db, user.id);
        expect(getSessionUser(db, token)?.id).toBe(user.id);
        destroySession(db, token);
        expect(getSessionUser(db, token)).toBeNull();
    });
    it("rejects duplicates, bad emails, short passwords and wrong credentials", async () => {
        await registerUser(db, "dev@example.com", "s3cret-password");
        await expect(registerUser(db, "dev@example.com", "another-password")).rejects.toThrow();
        await expect(registerUser(db, "not-an-email", "s3cret-password")).rejects.toThrow();
        await expect(registerUser(db, "new@example.com", "short")).rejects.toThrow();
        await expect(verifyLogin(db, "dev@example.com", "wrong")).rejects.toThrow();
        await expect(verifyLogin(db, "nobody@example.com", "s3cret-password")).rejects.toThrow();
        expect(getSessionUser(db, undefined)).toBeNull();
        expect(getSessionUser(db, "bogus")).toBeNull();
    });
});
describe("profiles", () => {
    it("returns an empty profile for new users and round-trips saved data", async () => {
        const user = await registerUser(db, "dev@example.com", "s3cret-password");
        expect(getProfile(db, user.id).experience).toEqual([]);
        const saved = saveProfile(db, user.id, {
            fullName: "Dev Example",
            title: "Software Developer",
            skills: ["React", "react.js", "TypeScript"],
            experience: [
                {
                    company: "Example",
                    role: "Software Developer",
                    technologies: ["React", "Node.js"],
                    achievements: [{ text: "Built reusable React components", tags: ["react", "typescript", "frontend"] }],
                },
            ],
        });
        expect(saved.skills).toEqual(["react", "typescript"]);
        expect(saved.experience[0].technologies).toEqual(["react", "nodejs"]);
        expect(saved.experience[0].achievements[0].tags).toEqual(["react", "typescript"]);
        expect(saved.experience[0].id).toBeTruthy();
        expect(saved.experience[0].achievements[0].id).toBeTruthy();
        expect(getProfile(db, user.id)).toEqual(saved);
    });
    it("keeps profiles isolated per user", async () => {
        const a = await registerUser(db, "a@example.com", "s3cret-password");
        const b = await registerUser(db, "b@example.com", "s3cret-password");
        saveProfile(db, a.id, { fullName: "User A" });
        expect(getProfile(db, b.id).fullName).toBe("");
    });
    it("normalizeProfileInput is pure and validates", () => {
        expect(() => normalizeProfileInput("u", { website: "not a url" })).toThrow();
        expect(() => normalizeProfileInput("u", { experience: [{ company: "", role: "x" }] })).toThrow();
    });
    it("accepts empty-string IDs on new rows and assigns stable IDs", () => {
        const profile = normalizeProfileInput("u", {
            certifications: [{ id: "", name: "AWS Developer", issuer: "Amazon", year: "2023" }],
            experience: [
                {
                    id: "",
                    company: "Acme",
                    role: "Dev",
                    achievements: [{ id: "", text: "Shipped X", tags: [] }],
                },
            ],
        });
        expect(profile.certifications[0].id).toMatch(/.+/);
        expect(profile.certifications[0].name).toBe("AWS Developer");
        expect(profile.experience[0].id).toMatch(/.+/);
        expect(profile.experience[0].achievements[0].id).toMatch(/.+/);
    });
    it("skips completely blank rows instead of failing validation", () => {
        const profile = normalizeProfileInput("u", {
            experience: [{ id: "", company: "", role: "", startDate: "", endDate: null, location: "", description: "", achievements: [], technologies: [], tags: [] }],
            certifications: [{ id: "", name: "", issuer: "", year: "" }],
            languages: [{ name: "", level: "" }],
        });
        expect(profile.experience).toEqual([]);
        expect(profile.certifications).toEqual([]);
        expect(profile.languages).toEqual([]);
    });
    it("validates the photo URL per field", () => {
        expect(normalizeProfileInput("u", { photo: "https://example.com/me.jpg" }).photo).toBe("https://example.com/me.jpg");
        expect(normalizeProfileInput("u", { photo: "" }).photo).toBe("");
        let caught: unknown;
        try {
            normalizeProfileInput("u", { photo: "not a url" });
        }
        catch (e) {
            caught = e;
        }
        expect(flattenProfileIssues(caught)).toEqual([
            { path: "photo", message: "Must be a valid http(s) URL or empty." },
        ]);
    });
    it("flattenProfileIssues reports dotted per-field paths", () => {
        let caught: unknown;
        try {
            normalizeProfileInput("u", { experience: [{ company: "", role: "Dev" }] });
        }
        catch (e) {
            caught = e;
        }
        const issues = flattenProfileIssues(caught);
        expect(issues).toEqual([{ path: "experience.0.company", message: "Company is required." }]);
        expect(flattenProfileIssues(new Error("boom"))).toEqual([]);
    });
});
