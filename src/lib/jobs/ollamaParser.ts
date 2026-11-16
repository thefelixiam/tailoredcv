import { z } from "zod";
import type { JobRequirements, Seniority } from "../domain/types";
import { SKILLS, normalizeSkillId } from "../skills/taxonomy";
import { parseJobDescription, type JobParser } from "./parser";
const SENIORITIES = ["intern", "junior", "mid", "senior", "staff", "lead", "unknown"] as const;
const llmOutputSchema = z.object({
    title: z.string().max(120).default(""),
    seniority: z.enum(SENIORITIES).catch("unknown"),
    requiredSkills: z.array(z.string()).default([]),
    preferredSkills: z.array(z.string()).default([]),
    yearsOfExperience: z.number().int().min(0).max(30).nullable().default(null),
    education: z.array(z.string()).default([]),
    languages: z.array(z.string()).default([]),
    domainKeywords: z.array(z.string()).default([]),
    responsibilities: z.array(z.string().max(300)).max(12).default([]),
});
export interface OllamaOptions {
    host?: string;
    model?: string;
    timeoutMs?: number;
}
export function ollamaHost(): string {
    return (process.env.OLLAMA_HOST ?? "http://localhost:11434").replace(/\/$/, "");
}
export function ollamaModel(): string {
    return process.env.OLLAMA_MODEL ?? "llama3.1";
}
export function isOllamaEnabled(): boolean {
    return process.env.OLLAMA_ENABLED === "true";
}
export async function isOllamaReachable(host: string = ollamaHost(), timeoutMs = 2000): Promise<boolean> {
    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
            const res = await fetch(`${host}/api/tags`, { signal: ctrl.signal });
            return res.ok;
        }
        finally {
            clearTimeout(timer);
        }
    }
    catch {
        return false;
    }
}
function taxonomyIdList(): string {
    return SKILLS.map((s) => s.id).join(", ");
}
function buildPrompt(raw: string): string {
    return [
        "Extract structured requirements from the job description below.",
        "Return ONLY a JSON object with this exact shape (no prose, no markdown fences):",
        '{"title": string, "seniority": "intern"|"junior"|"mid"|"senior"|"staff"|"lead"|"unknown",',
        ' "requiredSkills": string[], "preferredSkills": string[], "yearsOfExperience": number|null,',
        ' "education": string[], "languages": string[], "domainKeywords": string[], "responsibilities": string[]}',
        "Rules:",
        `- requiredSkills and preferredSkills must contain ONLY canonical skill IDs from this list: ${taxonomyIdList()}.`,
        "- Map spelling variants (e.g. React.js, K8s, Postgres) to the canonical ID. Omit anything not on the list.",
        "- A skill in both lists counts as required; list it once under requiredSkills.",
        "- seniority: pick the single best fit, or unknown.",
        "- yearsOfExperience: integer 0-30 or null.",
        "- Keep each responsibility under 300 characters, at most 12.",
        "- responsibilities: list ONLY duties explicitly stated in the description; use an empty array when none are stated — never invent duties.",
        "",
        "Job description:",
        raw.slice(0, 20000),
    ].join("\n");
}
export function extractJsonPayload(text: string): string {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced)
        return fenced[1].trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start)
        return text.slice(start, end + 1);
    return text.trim();
}
function toCanonicalIds(ids: string[]): string[] {
    const out: string[] = [];
    for (const raw of ids) {
        const id = normalizeSkillId(String(raw));
        if (id && !out.includes(id))
            out.push(id);
    }
    return out;
}
export function groundLlmOutput(data: unknown): JobRequirements {
    const parsed = llmOutputSchema.parse(data);
    const requiredSkills = toCanonicalIds(parsed.requiredSkills).sort();
    const preferredSkills = toCanonicalIds(parsed.preferredSkills)
        .filter((id) => !requiredSkills.includes(id))
        .sort();
    return {
        title: parsed.title.trim().slice(0, 120),
        seniority: parsed.seniority as Seniority,
        requiredSkills,
        preferredSkills,
        yearsOfExperience: parsed.yearsOfExperience,
        education: parsed.education.map((s) => s.trim()).filter(Boolean),
        languages: parsed.languages.map((s) => s.trim()).filter(Boolean),
        domainKeywords: parsed.domainKeywords.map((s) => s.trim()).filter(Boolean),
        responsibilities: parsed.responsibilities.map((s) => s.trim()).filter((s) => s.length > 3),
    };
}
export async function parseWithOllama(raw: string, opts: OllamaOptions = {}): Promise<JobRequirements> {
    const host = opts.host ?? ollamaHost();
    const model = opts.model ?? ollamaModel();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 60000);
    try {
        const res = await fetch(`${host}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: ctrl.signal,
            body: JSON.stringify({
                model,
                stream: false,
                format: "json",
                messages: [
                    { role: "system", content: "You extract structured job requirements as JSON. Output JSON only." },
                    { role: "user", content: buildPrompt(raw) },
                ],
            }),
        });
        if (!res.ok)
            throw new Error(`Ollama responded with status ${res.status}.`);
        const body = (await res.json()) as {
            message?: {
                content?: string;
            };
        };
        const content = body.message?.content ?? "";
        return groundLlmOutput(JSON.parse(extractJsonPayload(content)));
    }
    finally {
        clearTimeout(timer);
    }
}
export const ollamaParser: JobParser = {
    parse: (raw) => parseJobDescription(raw),
};
export interface AnalysisResult {
    requirements: JobRequirements;
    analyzer: string;
}
export async function analyzeJobDescription(raw: string, opts: OllamaOptions = {}): Promise<AnalysisResult> {
    const model = opts.model ?? ollamaModel();
    if (isOllamaEnabled() && (await isOllamaReachable(opts.host))) {
        try {
            return { requirements: await parseWithOllama(raw, opts), analyzer: `ollama:${model}` };
        }
        catch {
        }
    }
    return { requirements: parseJobDescription(raw), analyzer: "deterministic" };
}
