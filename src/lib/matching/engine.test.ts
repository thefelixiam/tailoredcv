import { describe, expect, it } from "vitest";
import type { Job, UserProfile } from "../domain/types";
import { emptyProfile } from "../domain/types";
import { matchProfileToJob } from "./engine";
function fixtureProfile(): UserProfile {
    return {
        ...emptyProfile("u1"),
        fullName: "Dev Example",
        skills: ["react", "typescript", "rest", "testing"],
        experience: [
            {
                id: "exp-frontend",
                company: "Company A",
                role: "Frontend Developer",
                startDate: "2021-01",
                endDate: null,
                location: "",
                description: "",
                technologies: ["react", "typescript", "nextjs"],
                tags: [],
                achievements: [
                    { id: "ach-components", text: "Built reusable React components", tags: ["react", "typescript"] },
                    { id: "ach-api", text: "Integrated REST APIs", tags: ["rest"] },
                ],
            },
            {
                id: "exp-backend",
                company: "Company B",
                role: "Python Developer",
                startDate: "2019-01",
                endDate: "2020-12",
                location: "",
                description: "",
                technologies: ["python", "django"],
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
            {
                id: "proj-dash",
                name: "Analytics Dashboard",
                description: "",
                role: "",
                technologies: ["python"],
                tags: [],
                links: [],
                achievements: [],
            },
        ],
    };
}
function fixtureJob(): Job {
    return {
        id: "job1",
        userId: "u1",
        title: "Senior Frontend Developer",
        rawDescription: "raw",
        analyzer: "deterministic",
        requirements: {
            title: "Senior Frontend Developer",
            seniority: "senior",
            requiredSkills: ["react", "typescript", "nextjs"],
            preferredSkills: ["rest", "testing", "aws"],
            yearsOfExperience: 5,
            education: [],
            languages: [],
            domainKeywords: [],
            responsibilities: [],
        },
        createdAt: "",
        updatedAt: "",
    };
}
describe("matching engine", () => {
    it("marks evidenced skills matched and reports missing ones", () => {
        const result = matchProfileToJob(fixtureProfile(), fixtureJob());
        const byId = new Map(result.requirements.map((r) => [r.skillId, r]));
        expect(byId.get("react")?.status).toBe("matched");
        expect(byId.get("react")?.kind).toBe("required");
        expect(byId.get("react")?.evidence.length).toBeGreaterThan(0);
        expect(byId.get("testing")?.status).toBe("matched");
        expect(byId.get("aws")?.status).toBe("missing");
        expect(byId.get("aws")?.evidence).toEqual([]);
        expect(result.missingSkills).toEqual(["aws"]);
    });
    it("distinguishes required vs preferred evidence", () => {
        const result = matchProfileToJob(fixtureProfile(), fixtureJob());
        const kinds = new Map(result.requirements.map((r) => [r.skillId, r.kind]));
        expect(kinds.get("nextjs")).toBe("required");
        expect(kinds.get("rest")).toBe("preferred");
    });
    it("ranks relevant experience and projects first with explanations", () => {
        const result = matchProfileToJob(fixtureProfile(), fixtureJob());
        expect(result.experience[0].id).toBe("exp-frontend");
        expect(result.experience[0].matchedSkills).toEqual(expect.arrayContaining(["react", "typescript", "nextjs", "rest"]));
        expect(result.experience[0].reasons.length).toBeGreaterThan(0);
        expect(result.experience[result.experience.length - 1].id).toBe("exp-backend");
        expect(result.projects[0].id).toBe("proj-saas");
        expect(result.projects[0].matchedSkills).toEqual(["nextjs", "react", "typescript"]);
    });
    it("computes the profile-to-job score from weighted coverage", () => {
        const result = matchProfileToJob(fixtureProfile(), fixtureJob());
        expect(result.profileToJobScore).toBe(92);
    });
    it("scores zero with an empty profile and matches nothing", () => {
        const result = matchProfileToJob(emptyProfile("u1"), fixtureJob());
        expect(result.profileToJobScore).toBe(0);
        expect(result.missingSkills).toHaveLength(6);
        expect(result.experience).toEqual([]);
    });
    it("is deterministic", () => {
        const a = matchProfileToJob(fixtureProfile(), fixtureJob());
        const b = matchProfileToJob(fixtureProfile(), fixtureJob());
        expect(a).toEqual(b);
    });
    it("matches raw profile strings via normalization", () => {
        const profile: UserProfile = {
            ...emptyProfile("u1"),
            skills: ["React.js"],
            experience: [
                {
                    id: "exp-1",
                    company: "C",
                    role: "Dev",
                    startDate: "",
                    endDate: null,
                    location: "",
                    description: "",
                    technologies: ["Next JS"],
                    tags: ["RESTful APIs"],
                    achievements: [],
                },
            ],
            projects: [],
        };
        const result = matchProfileToJob(profile, fixtureJob());
        const byId = new Map(result.requirements.map((r) => [r.skillId, r]));
        expect(byId.get("react")?.status).toBe("matched");
        expect(byId.get("nextjs")?.status).toBe("matched");
        expect(byId.get("rest")?.status).toBe("matched");
    });
    it("keeps evidence from same-named achievements under different parents", () => {
        const profile: UserProfile = {
            ...emptyProfile("u1"),
            skills: [],
            experience: [
                {
                    id: "exp-a",
                    company: "A",
                    role: "Dev",
                    startDate: "",
                    endDate: null,
                    location: "",
                    description: "",
                    technologies: [],
                    tags: [],
                    achievements: [{ id: "shared", text: "Did React things", tags: ["react"] }],
                },
                {
                    id: "exp-b",
                    company: "B",
                    role: "Dev",
                    startDate: "",
                    endDate: null,
                    location: "",
                    description: "",
                    technologies: [],
                    tags: [],
                    achievements: [{ id: "shared", text: "Did React things", tags: ["react"] }],
                },
            ],
            projects: [],
        };
        const result = matchProfileToJob(profile, fixtureJob());
        const react = result.requirements.find((r) => r.skillId === "react");
        expect(react?.evidence.filter((e) => e.type === "achievement")).toHaveLength(2);
    });
    it("upgrades a skill listed as both required and preferred to required weight", () => {
        const job: Job = {
            ...fixtureJob(),
            requirements: { ...fixtureJob().requirements, requiredSkills: ["react"], preferredSkills: ["react"] },
        };
        const result = matchProfileToJob(fixtureProfile(), job);
        expect(result.requirements.filter((r) => r.skillId === "react")).toHaveLength(1);
        expect(result.requirements.find((r) => r.skillId === "react")?.kind).toBe("required");
    });
});
