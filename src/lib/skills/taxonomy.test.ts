import { describe, expect, it } from "vitest";
import { getSkill, normalizeSkillId, normalizeSkillList, skillDisplayName, } from "./taxonomy";
describe("skill taxonomy", () => {
    it("normalizes React spelling variants to one canonical ID", () => {
        for (const variant of ["React", "react", "REACT", "React.js", "ReactJS", "reactjs", "react js"]) {
            expect(normalizeSkillId(variant)).toBe("react");
        }
    });
    it("normalizes other common alias variants", () => {
        expect(normalizeSkillId("TS")).toBe("typescript");
        expect(normalizeSkillId("Node.js")).toBe("nodejs");
        expect(normalizeSkillId("node")).toBe("nodejs");
        expect(normalizeSkillId("K8s")).toBe("kubernetes");
        expect(normalizeSkillId("Postgres")).toBe("postgresql");
        expect(normalizeSkillId("CI/CD")).toBe("cicd");
        expect(normalizeSkillId("Next.js")).toBe("nextjs");
        expect(normalizeSkillId("a11y")).toBe("accessibility");
    });
    it("returns null for unknown skills instead of inventing one", () => {
        expect(normalizeSkillId("COBOL-on-the-blockchain")).toBeNull();
        expect(normalizeSkillId("")).toBeNull();
        expect(normalizeSkillId("   ")).toBeNull();
    });
    it("deduplicates normalized lists and keeps custom skills", () => {
        expect(normalizeSkillList(["React", "react.js", "ReactJS", "TypeScript", "ts", "Unknown X"])).toEqual([
            "react",
            "typescript",
            "Unknown X",
        ]);
        expect(normalizeSkillList(["Custom Tool", "custom tool", "CUSTOM TOOL"])).toEqual(["Custom Tool"]);
        expect(normalizeSkillList(["C", "C++"])).toEqual(["C", "C++"]);
    });
    it("resolves display names and definitions", () => {
        expect(skillDisplayName("react")).toBe("React");
        expect(skillDisplayName("nextjs")).toBe("Next.js");
        expect(getSkill("rest")?.displayName).toBe("REST APIs");
    });
});
