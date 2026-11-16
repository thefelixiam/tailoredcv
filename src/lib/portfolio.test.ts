import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerUser } from "./auth";
import { openTestDb } from "./db";
import { emptyProfile } from "./domain/types";
import { buildPortfolioView, getPortfolioOwnerId } from "./portfolio";
import { saveProfile } from "./profiles";
let dir: string;
let db: Database.Database;
beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "cvt-pf-"));
    db = openTestDb(join(dir, "test.db"));
});
afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
});
describe("buildPortfolioView", () => {
    it("maps profile facts without inventing any", () => {
        const profile = {
            ...emptyProfile("u1"),
            fullName: "Dev Example",
            title: "Software Developer",
            location: "Berlin",
            email: "dev@example.com",
            summary: "Builds things.",
            skills: ["react", "typescript", "python"],
            experience: [
                {
                    id: "e1",
                    company: "Acme",
                    role: "Frontend Dev",
                    startDate: "2022-03",
                    endDate: null,
                    location: "Remote",
                    description: "Did stuff.",
                    technologies: ["react"],
                    tags: [],
                    achievements: [{ id: "a1", text: "Shipped X", tags: ["react"] }],
                },
            ],
            projects: [
                {
                    id: "p1",
                    name: "Side",
                    description: "A thing.",
                    role: "Author",
                    technologies: ["python"],
                    tags: [],
                    links: [{ label: "GitHub", url: "https://github.com/x/y" }],
                    achievements: [],
                },
            ],
            education: [{ id: "ed1", school: "TU", degree: "B.Sc.", field: "CS", startYear: "2015", endYear: "2019" }],
            certifications: [{ id: "c1", name: "AWS Developer", issuer: "Amazon", year: "2023" }],
            languages: [{ name: "English", level: "Fluent" }],
            phone: "+49 170 000",
            website: "https://example.dev",
        };
        const view = buildPortfolioView(profile);
        expect(view.name).toBe("Dev Example");
        expect(view.roles[0]).toBe("Software Developer");
        expect(view.skillGroups.flatMap((g) => g.skills)).toEqual(["React", "TypeScript", "Python"]);
        expect(view.experience[0].period).toBe("Mar 2022 — Present");
        expect(view.experience[0].bullets).toEqual(["Shipped X"]);
        expect(view.projects[0].stack).toBe("Python");
        expect(view.education[0].note).toBe("B.Sc., CS");
        expect(view.certifications).toEqual([{ name: "AWS Developer", issuer: "Amazon", year: "2023" }]);
        expect(view.phone).toBe("+49 170 000");
        expect(view.website).toBe("https://example.dev");
        expect(view.languages).toEqual(["English (Fluent)"]);
        expect(view.publishable).toBe(true);
    });
    it("is not publishable without a name and content", () => {
        expect(buildPortfolioView(emptyProfile("u1")).publishable).toBe(false);
        expect(buildPortfolioView({ ...emptyProfile("u1"), fullName: "Solo" }).publishable).toBe(false);
    });
});
describe("getPortfolioOwnerId", () => {
    it("returns null with no users, else the earliest user", async () => {
        expect(getPortfolioOwnerId(db)).toBeNull();
        const a = await registerUser(db, "a@example.com", "s3cret-password");
        await registerUser(db, "b@example.com", "s3cret-password");
        saveProfile(db, a.id, { fullName: "A" });
        expect(getPortfolioOwnerId(db)).toBe(a.id);
    });
});
