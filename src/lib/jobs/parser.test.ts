import { describe, expect, it } from "vitest";
import { detectSkillMentions, parseJobDescription } from "./parser";
const JD = `Senior Frontend Developer (React)

We are hiring a Senior Frontend Developer to join our SaaS platform team.

Requirements:
- 5+ years of experience with React and TypeScript
- Strong experience with Next.js and REST APIs
- Bachelor's degree in Computer Science or equivalent experience
- Fluent English

Nice to have:
- Experience with AWS is a plus
- Familiarity with testing and Playwright would be great

Responsibilities:
- Build reusable UI components
- Collaborate with designers in Figma
`;
describe("job parser", () => {
    it("extracts title, seniority and years of experience", () => {
        const req = parseJobDescription(JD);
        expect(req.title).toContain("Senior Frontend Developer");
        expect(req.seniority).toBe("senior");
        expect(req.yearsOfExperience).toBe(5);
    });
    it("separates required from preferred skills", () => {
        const req = parseJobDescription(JD);
        expect(req.requiredSkills).toEqual(expect.arrayContaining(["react", "typescript", "nextjs", "rest"]));
        expect(req.preferredSkills).toEqual(expect.arrayContaining(["aws", "testing", "playwright"]));
        expect(req.requiredSkills).not.toContain("aws");
        expect(req.preferredSkills).not.toContain("react");
    });
    it("normalizes alias spellings to canonical IDs", () => {
        const req = parseJobDescription("Requirements:\n- React.js, ReactJS, Node.js, CI/CD");
        expect(req.requiredSkills).toEqual(expect.arrayContaining(["react", "nodejs", "cicd"]));
        expect(req.requiredSkills.filter((s) => s === "react")).toHaveLength(1);
    });
    it("treats a structureless skill list as required", () => {
        const req = parseJobDescription("We need someone with Python, Django and PostgreSQL experience.");
        expect(req.requiredSkills).toEqual(expect.arrayContaining(["python", "django", "postgresql"]));
    });
    it("does not match ordinary English words as skills", () => {
        const mentions = detectSkillMentions("You will go far. The rest of the team is great.");
        const ids = mentions.map((m) => m.skillId);
        expect(ids).not.toContain("go");
        expect(ids).not.toContain("rest");
    });
    it("matches disambiguated forms of generic tokens", () => {
        const req = parseJobDescription("Requirements:\n- Golang services\n- REST APIs and RESTful design");
        expect(req.requiredSkills).toEqual(expect.arrayContaining(["go", "rest"]));
    });
    it("extracts education, languages, domains and responsibilities", () => {
        const req = parseJobDescription(JD);
        expect(req.education.join(" ")).toContain("bachelor");
        expect(req.languages).toContain("english");
        expect(req.domainKeywords).toContain("saas");
        expect(req.responsibilities.length).toBeGreaterThan(0);
        expect(req.responsibilities[0]).toContain("reusable UI components");
    });
    it("never overlaps required and preferred", () => {
        const req = parseJobDescription(JD + "\nWe use React daily. AWS knowledge helps.");
        const overlap = req.requiredSkills.filter((s) => req.preferredSkills.includes(s));
        expect(overlap).toEqual([]);
    });
    it("does not mistake ordinary words for Next.js or Node.js", () => {
        expect(detectSkillMentions("What you will do next is collaborate with design.").map((m) => m.skillId)).not.toContain("nextjs");
        expect(detectSkillMentions("You will maintain compute nodes in the cluster.").map((m) => m.skillId)).not.toContain("nodejs");
        expect(parseJobDescription("Requirements:\n- Node.js services").requiredSkills).toContain("nodejs");
        expect(parseJobDescription("Requirements:\n- Next.js apps").requiredSkills).toContain("nextjs");
    });
    it("matches separator variants and version spellings", () => {
        const req = parseJobDescription("Requirements:\n- REST-API design\n- ES2015 and HTML");
        expect(req.requiredSkills).toEqual(expect.arrayContaining(["rest", "javascript", "html"]));
    });
    it("classifies inline single-line requirement lists", () => {
        const req = parseJobDescription("Requirements: React, TypeScript and Python.");
        expect(req.requiredSkills).toEqual(expect.arrayContaining(["react", "typescript", "python"]));
    });
    it("does not treat 'surplus' as a preferred cue", () => {
        const req = parseJobDescription("Requirements:\n- Python\nWe have a surplus of applicants.");
        expect(req.requiredSkills).toContain("python");
        expect(req.preferredSkills).not.toContain("python");
    });
    it("lets required win when a skill is mentioned both ways", () => {
        const req = parseJobDescription("Requirements:\n- Must have React experience\nNice to have:\n- React familiarity is a plus");
        expect(req.requiredSkills).toContain("react");
        expect(req.preferredSkills).not.toContain("react");
    });
    it("resets the zone at responsibility headings", () => {
        const req = parseJobDescription("Nice to have:\n- AWS\nResponsibilities:\n- Build React apps");
        expect(req.preferredSkills).toContain("react");
        expect(req.requiredSkills).not.toContain("react");
    });
    it("prefers senior over staff and skips boilerplate titles", () => {
        expect(parseJobDescription("Senior Staff Engineer\nRequirements:\n- Go").seniority).toBe("senior");
        expect(parseJobDescription("Job Description\nSenior Backend Developer\nRequirements:\n- Go").title).toContain("Senior Backend");
    });
    it("handles empty input without crashing", () => {
        const req = parseJobDescription("");
        expect(req.requiredSkills).toEqual([]);
        expect(req.preferredSkills).toEqual([]);
        expect(req.seniority).toBe("unknown");
    });
});
