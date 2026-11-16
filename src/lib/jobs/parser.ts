import type { JobRequirements, Seniority } from "../domain/types";
import { SKILLS, skillSpellings } from "../skills/taxonomy";
export interface JobParser {
    parse(raw: string): JobRequirements;
}
export const deterministicParser: JobParser = {
    parse: (raw) => parseJobDescription(raw),
};
type Zone = "required" | "preferred" | "neutral";
const REQUIRED_HEADINGS = [
    "requirements",
    "required",
    "must have",
    "must-have",
    "qualifications",
    "what you'll need",
    "what you need",
    "essential",
    "minimum qualifications",
    "basic qualifications",
    "what we're looking for",
];
const PREFERRED_HEADINGS = [
    "nice to have",
    "nice-to-have",
    "preferred",
    "bonus",
    "a plus",
    "desired",
    "would be great",
    "pluses",
    "preferred qualifications",
];
const RESPONSIBILITY_HEADINGS = [
    "responsibilities",
    "what you'll do",
    "what you will do",
    "your role",
    "the role",
    "about the role",
    "key responsibilities",
];
function headingZone(line: string): Zone | null {
    const clean = line
        .toLowerCase()
        .replace(/^[\s•\-\*\d.)\]]+/, "")
        .replace(/:.*$/, "")
        .replace(/[\s]+$/, "")
        .trim();
    if (!clean || clean.length > 60)
        return null;
    if (PREFERRED_HEADINGS.some((h) => clean === h || clean.startsWith(h + " ")))
        return "preferred";
    if (REQUIRED_HEADINGS.some((h) => clean === h || clean.startsWith(h + " ")))
        return "required";
    return null;
}
function responsibilityHeading(line: string): boolean {
    const clean = line
        .toLowerCase()
        .replace(/^[\s•\-\*\d.)\]]+/, "")
        .replace(/:.*$/, "")
        .replace(/[\s]+$/, "")
        .trim();
    if (!clean || clean.length > 60)
        return false;
    return RESPONSIBILITY_HEADINGS.some((h) => clean === h || clean.startsWith(h + " "));
}
interface ZonedLine {
    text: string;
    zone: Zone;
    inResponsibilities: boolean;
}
export function splitZones(raw: string): ZonedLine[] {
    const lines = raw.split(/\r?\n/);
    let zone: Zone = "neutral";
    let inResp = false;
    return lines.map((text) => {
        const z = headingZone(text);
        if (z) {
            zone = z;
            inResp = false;
            return { text, zone, inResponsibilities: false };
        }
        if (responsibilityHeading(text)) {
            zone = "neutral";
            inResp = true;
            return { text, zone, inResponsibilities: false };
        }
        if (z === null && inResp && text.trim() === "") {
        }
        return { text, zone, inResponsibilities: inResp };
    });
}
function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const AMBIGUOUS: Record<string, {
    caseSensitiveWord?: string;
    phrases: string[];
}> = {
    go: { caseSensitiveWord: "Go", phrases: ["golang"] },
    rest: { caseSensitiveWord: "REST", phrases: ["rest api", "rest apis", "restful", "restful apis"] },
};
function toFlexiblePattern(spelling: string): string {
    const flexible = escapeRegExp(spelling.trim()).replace(/[\s._\-/]+/g, "[\\s._\\-/]*");
    const lettersOnly = spelling.replace(/[^a-zA-Z]/g, "");
    const plural = lettersOnly.length >= 5 && !/[sx]$/i.test(lettersOnly) ? "s?" : "";
    return `${flexible}${plural}`;
}
function skillPatterns(skillId: string): RegExp[] {
    const out: RegExp[] = [];
    const override = AMBIGUOUS[skillId];
    if (override) {
        if (override.caseSensitiveWord) {
            out.push(new RegExp(`(?<![\\w+#.])${escapeRegExp(override.caseSensitiveWord)}(?![\\w+#])`));
        }
        for (const phrase of override.phrases) {
            out.push(new RegExp(`(?<![\\w+#.])${toFlexiblePattern(phrase)}(?![\\w+#])`, "i"));
        }
        return out;
    }
    for (const spelling of skillSpellings(skillId)) {
        out.push(new RegExp(`(?<![\\w+#.])${toFlexiblePattern(spelling)}(?![\\w+#])`, "i"));
    }
    return out;
}
const PATTERNS: Map<string, RegExp[]> = new Map(SKILLS.map((s) => [s.id, skillPatterns(s.id)]));
export interface SkillMention {
    skillId: string;
    zone: Zone;
    sentence: string;
}
function sentencesOf(line: string): string[] {
    return line
        .split(/(?<=[.!?;])\s+|\s*[•●▪]\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
}
const PREFERRED_CUES = ["nice to have", "nice-to-have", "preferred", "bonus", "a plus", "desired", "ideally", "familiarity", "familiar with"];
const REQUIRED_CUES = ["must have", "must-have", "required", "requirement", "essential", "minimum", "at least", "proficient", "expert"];
function cueRegex(cue: string): RegExp {
    return new RegExp(`\\b${escapeRegExp(cue)}\\b`, "i");
}
const PREFERRED_CUE_RES = PREFERRED_CUES.map(cueRegex);
const REQUIRED_CUE_RES = REQUIRED_CUES.map(cueRegex);
function cueKind(sentence: string): Zone | null {
    const hasPreferred = PREFERRED_CUE_RES.some((re) => re.test(sentence));
    const hasRequired = REQUIRED_CUE_RES.some((re) => re.test(sentence));
    if (hasRequired)
        return "required";
    if (hasPreferred)
        return "preferred";
    return null;
}
export function detectSkillMentions(raw: string): SkillMention[] {
    const mentions: SkillMention[] = [];
    const seen = new Set<string>();
    for (const line of splitZones(raw)) {
        for (const sentence of sentencesOf(line.text)) {
            for (const [skillId, patterns] of PATTERNS) {
                if (!patterns.some((re) => re.test(sentence)))
                    continue;
                const key = `${skillId}::${sentence.toLowerCase()}`;
                if (seen.has(key))
                    continue;
                seen.add(key);
                mentions.push({ skillId, zone: line.zone, sentence });
            }
        }
    }
    return mentions;
}
function classifySkill(zones: Zone[], cues: (Zone | null)[], docHasZones: boolean): "required" | "preferred" {
    for (const cue of cues) {
        if (cue === "required")
            return "required";
    }
    for (const cue of cues) {
        if (cue === "preferred")
            return "preferred";
    }
    if (zones.includes("required"))
        return "required";
    if (zones.includes("preferred"))
        return "preferred";
    return docHasZones ? "preferred" : "required";
}
const SENIORITY_PATTERNS: [
    RegExp,
    Seniority
][] = [
    [/\bintern(ship)?\b/i, "intern"],
    [/\bjunior\b/i, "junior"],
    [/\bjr\.?\b/i, "junior"],
    [/\bmid[-\s]?level\b/i, "mid"],
    [/\btech?n?ical\s+lead\b/i, "lead"],
    [/\bteam\s+lead\b/i, "lead"],
    [/\blead\s+(developer|engineer)\b/i, "lead"],
    [/\bsr\.?\b/i, "senior"],
    [/\bsenior\b/i, "senior"],
    [/\bstaff\b/i, "staff"],
    [/\bprincipal\b/i, "staff"],
];
export function detectSeniority(raw: string): Seniority {
    for (const [re, level] of SENIORITY_PATTERNS) {
        if (re.test(raw))
            return level;
    }
    return "unknown";
}
export function detectYearsOfExperience(raw: string): number | null {
    const matches = [
        ...raw.matchAll(/(\d+)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp\b)/gi),
        ...raw.matchAll(/experience\s*(?:of\s+)?(\d+)\s*\+?\s*(?:years?|yrs?)/gi),
    ];
    let max: number | null = null;
    for (const m of matches) {
        const n = parseInt(m[1], 10);
        if (Number.isFinite(n) && n <= 30 && (max === null || n > max))
            max = n;
    }
    return max;
}
const EDUCATION_KEYWORDS = [
    "bachelor",
    "master's degree",
    "masters degree",
    "master degree",
    "phd",
    "ph.d",
    "computer science",
    "software engineering degree",
    "relevant degree",
    "equivalent experience",
];
export function detectEducation(raw: string): string[] {
    const lower = raw.toLowerCase();
    return EDUCATION_KEYWORDS.filter((k) => lower.includes(k));
}
const LANGUAGE_NAMES = [
    "english",
    "german",
    "french",
    "spanish",
    "polish",
    "dutch",
    "italian",
    "portuguese",
    "ukrainian",
    "czech",
    "swedish",
    "norwegian",
];
export function detectLanguages(raw: string): string[] {
    return LANGUAGE_NAMES.filter((lang) => LANGUAGE_RES.get(lang)?.test(raw));
}
const DOMAINS: {
    id: string;
    patterns: string[];
}[] = [
    { id: "saas", patterns: ["saas", "software as a service"] },
    { id: "fintech", patterns: ["fintech", "financial services", "banking", "payments"] },
    { id: "ecommerce", patterns: ["e-commerce", "ecommerce", "online retail"] },
    { id: "healthcare", patterns: ["healthcare", "health tech", "medtech"] },
    { id: "gaming", patterns: ["gaming", "video games"] },
    { id: "edtech", patterns: ["edtech", "e-learning", "online education"] },
    { id: "machine-learning", patterns: ["machine learning", "artificial intelligence", "\\bml\\b", "\\bai\\b"] },
    { id: "cybersecurity", patterns: ["cybersecurity", "cyber security", "infosec"] },
    { id: "blockchain", patterns: ["blockchain", "web3", "crypto"] },
    { id: "iot", patterns: ["iot", "internet of things", "embedded"] },
    { id: "devtools", patterns: ["developer tools", "devtools", "dx "] },
    { id: "media", patterns: ["streaming", "video platform", "media"] },
];
export function detectDomains(raw: string): string[] {
    return DOMAINS.filter(({ id }) => DOMAIN_RES.get(id)?.some((re) => re.test(raw))).map((d) => d.id);
}
const TITLE_BOILERPLATE = /^(job description|job posting|about the role|the role|the position|position overview|job overview|join us)\b/i;
const LANGUAGE_RES: Map<string, RegExp> = new Map(LANGUAGE_NAMES.map((lang) => [lang, new RegExp(`\\b${lang}\\b`, "i")]));
const DOMAIN_RES: Map<string, RegExp[]> = new Map(DOMAINS.map((d) => [d.id, d.patterns.map((p) => new RegExp(`(?<![\\w])${p}(?![\\w])`, "i"))]));
export function detectTitle(raw: string): string {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const hired = raw.match(/(?:hiring|looking for|seeking|join us as)\s+(?:a|an|our)?\s*([^.\n]{3,80})/i);
    if (hired)
        return hired[1].trim().slice(0, 120);
    const meaningful = lines.find((l) => !TITLE_BOILERPLATE.test(l)) ?? "";
    return meaningful.slice(0, 120);
}
export function detectResponsibilities(raw: string): string[] {
    const out: string[] = [];
    for (const line of splitZones(raw)) {
        if (!line.inResponsibilities)
            continue;
        const bullet = line.text.replace(/^[\s•\-\*\d.)\]]+/, "").trim();
        if (bullet.length > 3 && headingZone(line.text) === null) {
            out.push(bullet.slice(0, 300));
        }
        if (out.length >= 12)
            break;
    }
    return out;
}
export function parseJobDescription(raw: string): JobRequirements {
    const text = raw.trim();
    const mentions = detectSkillMentions(text);
    const docHasZones = splitZones(text).some((l) => l.zone !== "neutral");
    const bySkill = new Map<string, {
        zones: Zone[];
        cues: (Zone | null)[];
    }>();
    for (const m of mentions) {
        const entry = bySkill.get(m.skillId) ?? { zones: [], cues: [] };
        entry.zones.push(m.zone);
        entry.cues.push(cueKind(m.sentence));
        bySkill.set(m.skillId, entry);
    }
    const requiredSkills: string[] = [];
    const preferredSkills: string[] = [];
    for (const [skillId, info] of bySkill) {
        if (classifySkill(info.zones, info.cues, docHasZones) === "required") {
            requiredSkills.push(skillId);
        }
        else {
            preferredSkills.push(skillId);
        }
    }
    requiredSkills.sort();
    preferredSkills.sort();
    return {
        title: detectTitle(text),
        seniority: detectSeniority(text),
        requiredSkills,
        preferredSkills,
        yearsOfExperience: detectYearsOfExperience(text),
        education: detectEducation(text),
        languages: detectLanguages(text),
        domainKeywords: detectDomains(text),
        responsibilities: detectResponsibilities(text),
    };
}
