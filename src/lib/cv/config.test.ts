import { describe, expect, it } from "vitest";
import type { Job, UserProfile } from "../domain/types";
import { emptyProfile } from "../domain/types";
import { matchProfileToJob } from "../matching/engine";
import { applyCvOverrides, buildCvConfiguration, composeSummary, resolveCv } from "./config";
function profile(): UserProfile {
    return {
        ...emptyProfile("u1"),
        fullName: "Dev Example",
        title: "Software Developer",
        summary: "Developer with a passion for clean UIs.",
        skills: ["react", "typescript", "python"],
        experience: [
            {
                id: "exp-frontend",
                company: "Company A",
                role: "Frontend Developer",
                startDate: "2021-01",
                endDate: null,
                location: "",
                description: "",
                technologies: ["react", "typescript"],
                tags: [],
                achievements: [
                    { id: "ach-ui", text: "Built reusable React components", tags: ["react", "typescript"] },
                    { id: "ach-api", text: "Integrated REST APIs", tags: ["rest"] },
                ],
            },
            {
                id: "exp-data",
                company: "Company B",
                role: "Data Engineer",
                startDate: "2019-01",
                endDate: "2020-12",
                location: "",
                description: "",
                technologies: ["python"],
                tags: [],
                achievements: [{ id: "ach-etl", text: "Built ETL pipelines", tags: ["python"] }],
            },
        ],
        projects: [
            {
                id: "proj-saas",
                name: "SaaS Platform",
                description: "",
                role: "",
                technologies: ["react", "typescript", "nextjs"],
                tags: [],
                links: [],
                achievements: [],
            },
        ],
    };
}
function job(): Job {
    return {
        id: "job1",
        userId: "u1",
        title: "Frontend Developer",
        rawDescription: "raw",
        analyzer: "deterministic",
        requirements: {
            title: "Frontend Developer",
            seniority: "mid",
            requiredSkills: ["react", "typescript"],
            preferredSkills: ["rest", "aws"],
            yearsOfExperience: null,
            education: [],
            languages: [],
            domainKeywords: [],
            responsibilities: [],
        },
        createdAt: "",
        updatedAt: "",
    };
}
describe("CV configuration", () => {
    it("selects relevant content and filters achievements to matched ones", () => {
        const p = profile();
        const j = job();
        const config = buildCvConfiguration(p, j, matchProfileToJob(p, j));
        expect(config.selectedExperience.map((e) => e.experienceId)).toEqual(["exp-frontend"]);
        expect(config.selectedExperience[0].achievementIds).toEqual(["ach-ui", "ach-api"]);
        expect(config.selectedProjects).toEqual([{ projectId: "proj-saas", achievementIds: [] }]);
    });
    it("never selects missing skills", () => {
        const p = profile();
        const config = buildCvConfiguration(p, job(), matchProfileToJob(p, job()));
        expect(config.selectedSkills).toEqual(["react", "typescript", "rest"]);
        expect(config.selectedSkills).not.toContain("aws");
        expect(config.selectedSkills).not.toContain("python");
    });
    it("uses the user's own summary verbatim", () => {
        expect(composeSummary(profile(), ["react"])).toBe("Developer with a passion for clean UIs.");
    });
    it("composes a deterministic fallback summary from profile facts only", () => {
        const p = { ...profile(), summary: "" };
        expect(composeSummary(p, ["react", "typescript"])).toBe("Software Developer focused on React, TypeScript.");
        expect(composeSummary({ ...p, title: "" }, [])).toBe("");
    });
    it("resolveCv drops IDs that do not exist in the profile", () => {
        const p = profile();
        const j = job();
        const match = matchProfileToJob(p, j);
        const config = buildCvConfiguration(p, j, match);
        config.selectedExperience.push({ experienceId: "ghost-company", achievementIds: ["ghost-ach"] });
        config.selectedProjects.push({ projectId: "ghost-project", achievementIds: ["ghost-ach"] });
        config.selectedSkills.push("aws");
        const resolved = resolveCv(p, config, match);
        expect(resolved.experience.map((e) => e.id)).toEqual(["exp-frontend"]);
        expect(resolved.projects.map((x) => x.id)).toEqual(["proj-saas"]);
        expect(resolved.skills.find((s) => s.id === "aws")).toBeUndefined();
    });
    it("applies user overrides and rejects unknown templates", () => {
        const p = profile();
        const j = job();
        const config = buildCvConfiguration(p, j, matchProfileToJob(p, j));
        expect(config.templateId).toBe("light");
        const updated = applyCvOverrides(config, {
            templateId: "nope",
            summary: "Custom summary.",
            selectedProjects: [],
        });
        expect(updated.templateId).toBe("light");
        expect(updated.summary).toBe("Custom summary.");
        expect(updated.selectedProjects).toEqual([]);
        expect(applyCvOverrides(config, { templateId: "midnight" }).templateId).toBe("midnight");
    });
    it("keeps tag-only evidenced skills in the selection", () => {
        const p: UserProfile = {
            ...emptyProfile("u1"),
            experience: [
                {
                    id: "exp-1",
                    company: "C",
                    role: "Dev",
                    startDate: "",
                    endDate: null,
                    location: "",
                    description: "",
                    technologies: [],
                    tags: ["rest"],
                    achievements: [],
                },
            ],
            projects: [],
        };
        const config = buildCvConfiguration(p, job(), matchProfileToJob(p, job()));
        expect(config.selectedSkills).toContain("rest");
    });
    it("caps oversized overrides to layout-safe limits", () => {
        const p = profile();
        const j = job();
        const config = buildCvConfiguration(p, j, matchProfileToJob(p, j));
        const updated = applyCvOverrides(config, {
            selectedExperience: Array.from({ length: 20 }, (_, i) => ({ experienceId: `e${i}`, achievementIds: ["a", "b", "c", "d", "e"] })),
            selectedSkills: Array.from({ length: 40 }, (_, i) => `s${i}`),
        });
        expect(updated.selectedExperience).toHaveLength(4);
        expect(updated.selectedExperience[0].achievementIds).toHaveLength(3);
        expect(updated.selectedSkills).toHaveLength(16);
    });
    it("respects project achievement selection and language visibility", () => {
        const p: UserProfile = {
            ...profile(),
            languages: [
                { name: "English", level: "Fluent" },
                { name: "German", level: "B2" },
            ],
        };
        const j = job();
        const match = matchProfileToJob(p, j);
        const config = buildCvConfiguration(p, j, match);
        expect(config.includedLanguages).toEqual(["English", "German"]);
        const limited = applyCvOverrides(config, { includedLanguages: ["English"] });
        expect(resolveCv(p, limited, match).languages.map((l) => l.name)).toEqual(["English"]);
    });
});
