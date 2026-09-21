import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeJobDescription, extractJsonPayload, groundLlmOutput, isOllamaReachable, } from "./ollamaParser";
afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OLLAMA_ENABLED;
});
describe("extractJsonPayload", () => {
    it("unwraps markdown fences", () => {
        expect(extractJsonPayload('```json\n{"a": 1}\n```')).toBe('{"a": 1}');
    });
    it("cuts surrounding prose", () => {
        expect(extractJsonPayload('Here you go: {"a": 1} hope it helps')).toBe('{"a": 1}');
    });
});
describe("groundLlmOutput", () => {
    it("drops unknown skill IDs and spelling variants normalize", () => {
        const req = groundLlmOutput({
            title: "Frontend Dev",
            seniority: "senior",
            requiredSkills: ["React.js", "quantum-surgery", "K8s"],
            preferredSkills: ["react", "AWS"],
            yearsOfExperience: 5,
            education: [],
            languages: ["English"],
            domainKeywords: [],
            responsibilities: ["Build things"],
        });
        expect(req.requiredSkills).toEqual(["kubernetes", "react"]);
        expect(req.preferredSkills).toEqual(["aws"]);
        expect(req.seniority).toBe("senior");
        expect(req.yearsOfExperience).toBe(5);
    });
    it("is lenient on enums but rejects non-objects", () => {
        expect(groundLlmOutput({ seniority: "wizard" }).seniority).toBe("unknown");
        expect(() => groundLlmOutput("not json at all")).toThrow();
        expect(() => groundLlmOutput(null)).toThrow();
    });
});
describe("analyzeJobDescription", () => {
    it("uses the deterministic parser when Ollama is disabled", async () => {
        const { requirements, analyzer } = await analyzeJobDescription("Requirements:\n- React and TypeScript");
        expect(analyzer).toBe("deterministic");
        expect(requirements.requiredSkills).toEqual(expect.arrayContaining(["react", "typescript"]));
    });
    it("falls back when Ollama is enabled but unreachable", async () => {
        process.env.OLLAMA_ENABLED = "true";
        expect(await isOllamaReachable("http://localhost:9", 500)).toBe(false);
        const { requirements, analyzer } = await analyzeJobDescription("Requirements:\n- React");
        expect(analyzer).toBe("deterministic");
        expect(requirements.requiredSkills).toContain("react");
    });
    it("uses grounded Ollama output when the server responds", async () => {
        process.env.OLLAMA_ENABLED = "true";
        vi.stubGlobal("fetch", vi.fn(async (url: string) => {
            if (String(url).endsWith("/api/tags"))
                return { ok: true };
            return {
                ok: true,
                json: async () => ({
                    message: {
                        content: JSON.stringify({
                            title: "Backend Dev",
                            seniority: "mid",
                            requiredSkills: ["Go", "postgres"],
                            preferredSkills: ["Docker"],
                            yearsOfExperience: 3,
                            education: [],
                            languages: [],
                            domainKeywords: [],
                            responsibilities: [],
                        }),
                    },
                }),
            };
        }));
        const { requirements, analyzer } = await analyzeJobDescription("irrelevant text");
        expect(analyzer).toMatch(/^ollama:/);
        expect(requirements.title).toBe("Backend Dev");
        expect(requirements.requiredSkills).toEqual(["go", "postgresql"]);
        expect(requirements.preferredSkills).toEqual(["docker"]);
    });
    it("falls back when Ollama returns garbage", async () => {
        process.env.OLLAMA_ENABLED = "true";
        vi.stubGlobal("fetch", vi.fn(async (url: string) => {
            if (String(url).endsWith("/api/tags"))
                return { ok: true };
            return { ok: true, json: async () => ({ message: { content: "definitely not json{{{" } }) };
        }));
        const { analyzer } = await analyzeJobDescription("Requirements:\n- React");
        expect(analyzer).toBe("deterministic");
    });
});
