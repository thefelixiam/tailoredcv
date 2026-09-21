import type { Job, MatchEvidence, MatchResult, RequirementMatch, ScoredItem, UserProfile, } from "../domain/types";
import { normalizeSkillList, skillDisplayName } from "../skills/taxonomy";
export interface Matcher {
    match(profile: UserProfile, job: Job): MatchResult;
}
export const deterministicMatcher: Matcher = {
    match: (profile, job) => matchProfileToJob(profile, job),
};
export const MATCHING_WEIGHTS = {
    requirement: { required: 10, preferred: 4 },
    score: { required: 3, preferred: 1 },
    evidence: {
        technology: 3,
        achievement: 2,
        tag: 1,
    },
} as const;
interface SkillHit {
    skillId: string;
    weight: number;
    evidence: MatchEvidence[];
    contributions: Map<string, {
        score: number;
        via: string[];
    }>;
}
function weightOf(kind: "required" | "preferred"): number {
    return MATCHING_WEIGHTS.requirement[kind];
}
function addContribution(hit: SkillHit, key: string, score: number, via: string): void {
    const entry = hit.contributions.get(key) ?? { score: 0, via: [] };
    entry.score += score;
    if (!entry.via.includes(via))
        entry.via.push(via);
    hit.contributions.set(key, entry);
}
export function matchProfileToJob(profile: UserProfile, job: Job): MatchResult {
    const normalized: UserProfile = {
        ...profile,
        skills: normalizeSkillList(profile.skills),
        experience: profile.experience.map((e) => ({
            ...e,
            technologies: normalizeSkillList(e.technologies),
            tags: normalizeSkillList(e.tags),
            achievements: e.achievements.map((a) => ({ ...a, tags: normalizeSkillList(a.tags) })),
        })),
        projects: profile.projects.map((p) => ({
            ...p,
            technologies: normalizeSkillList(p.technologies),
            tags: normalizeSkillList(p.tags),
            achievements: p.achievements.map((a) => ({ ...a, tags: normalizeSkillList(a.tags) })),
        })),
    };
    const req = job.requirements;
    const hits = new Map<string, SkillHit>();
    const ensure = (skillId: string, kind: "required" | "preferred"): SkillHit => {
        let hit = hits.get(skillId);
        if (!hit) {
            hit = { skillId, weight: weightOf(kind), evidence: [], contributions: new Map() };
            hits.set(skillId, hit);
        }
        else if (kind === "required") {
            hit.weight = weightOf("required");
        }
        return hit;
    };
    const E = MATCHING_WEIGHTS.evidence;
    const skillSet = new Set(normalized.skills);
    const collect = (skillId: string, kind: "required" | "preferred", visit: (hit: SkillHit) => void): void => {
        visit(ensure(skillId, kind));
    };
    for (const skillId of req.requiredSkills) {
        collect(skillId, "required", (hit) => {
            if (skillSet.has(skillId)) {
                hit.evidence.push({ type: "skill", refId: "profile-skills", label: "Listed in profile skills" });
            }
        });
    }
    for (const skillId of req.preferredSkills) {
        collect(skillId, "preferred", (hit) => {
            if (skillSet.has(skillId)) {
                hit.evidence.push({ type: "skill", refId: "profile-skills", label: "Listed in profile skills" });
            }
        });
    }
    for (const exp of normalized.experience) {
        for (const skillId of [...req.requiredSkills, ...req.preferredSkills]) {
            const hit = hits.get(skillId);
            if (!hit)
                continue;
            const key = `experience:${exp.id}`;
            if (exp.technologies.includes(skillId)) {
                hit.evidence.push({ type: "experience", refId: exp.id, label: `${exp.role} at ${exp.company}` });
                addContribution(hit, key, hit.weight * E.technology, "technologies");
            }
            const taggedAchievements = exp.achievements.filter((a) => a.tags.includes(skillId));
            for (const a of taggedAchievements.slice(0, 2)) {
                hit.evidence.push({ type: "achievement", refId: a.id, label: `"${truncate(a.text, 80)}" (${exp.company})` });
                addContribution(hit, key, hit.weight * E.achievement, "achievements");
            }
            if (exp.tags.includes(skillId) && !exp.technologies.includes(skillId)) {
                hit.evidence.push({ type: "experience", refId: exp.id, label: `${exp.role} at ${exp.company}` });
                addContribution(hit, key, hit.weight * E.tag, "tags");
            }
        }
    }
    for (const project of normalized.projects) {
        for (const skillId of [...req.requiredSkills, ...req.preferredSkills]) {
            const hit = hits.get(skillId);
            if (!hit)
                continue;
            const key = `project:${project.id}`;
            if (project.technologies.includes(skillId)) {
                hit.evidence.push({ type: "project", refId: project.id, label: project.name });
                addContribution(hit, key, hit.weight * E.technology, "technologies");
            }
            const tagged = project.achievements.filter((a) => a.tags.includes(skillId));
            for (const a of tagged.slice(0, 2)) {
                hit.evidence.push({ type: "achievement", refId: a.id, label: `"${truncate(a.text, 80)}" (${project.name})` });
                addContribution(hit, key, hit.weight * E.achievement, "achievements");
            }
            if (project.tags.includes(skillId) && !project.technologies.includes(skillId)) {
                hit.evidence.push({ type: "project", refId: project.id, label: project.name });
                addContribution(hit, key, hit.weight * E.tag, "tags");
            }
        }
    }
    for (const hit of hits.values()) {
        const seen = new Set<string>();
        hit.evidence = hit.evidence.filter((e) => {
            const k = `${e.type}:${e.refId}:${e.label}`;
            if (seen.has(k))
                return false;
            seen.add(k);
            return true;
        });
    }
    const requirements: RequirementMatch[] = [];
    for (const skillId of req.requiredSkills) {
        requirements.push(toRequirementMatch(hits.get(skillId), skillId, "required"));
    }
    for (const skillId of req.preferredSkills) {
        if (req.requiredSkills.includes(skillId))
            continue;
        requirements.push(toRequirementMatch(hits.get(skillId), skillId, "preferred"));
    }
    const experience = scoreItems(normalized.experience.map((e) => ({ kind: "experience" as const, id: e.id })), hits);
    const projects = scoreItems(normalized.projects.map((p) => ({ kind: "project" as const, id: p.id })), hits);
    const scoreWeights = MATCHING_WEIGHTS.score;
    let total = 0;
    let covered = 0;
    for (const r of requirements) {
        const w = scoreWeights[r.kind];
        total += w;
        if (r.status === "matched")
            covered += w;
    }
    const profileToJobScore = total === 0 ? 0 : Math.round((covered / total) * 100);
    return {
        jobId: job.id,
        profileToJobScore,
        requirements,
        experience,
        projects,
        missingSkills: requirements.filter((r) => r.status === "missing").map((r) => r.skillId),
    };
}
function toRequirementMatch(hit: SkillHit | undefined, skillId: string, kind: "required" | "preferred"): RequirementMatch {
    return {
        skillId,
        kind,
        status: hit && hit.evidence.length > 0 ? "matched" : "missing",
        evidence: hit?.evidence ?? [],
    };
}
function scoreItems(items: {
    kind: "experience" | "project";
    id: string;
}[], hits: Map<string, SkillHit>): ScoredItem[] {
    const scored: ScoredItem[] = items.map(({ kind, id }) => {
        const key = `${kind}:${id}`;
        let score = 0;
        const matchedSkills: string[] = [];
        const viaAll = new Set<string>();
        for (const hit of hits.values()) {
            const c = hit.contributions.get(key);
            if (c) {
                score += c.score;
                matchedSkills.push(hit.skillId);
                c.via.forEach((v) => viaAll.add(v));
            }
        }
        matchedSkills.sort();
        return { kind, id, score, matchedSkills, reasons: buildReasons(kind, matchedSkills, viaAll) };
    });
    scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    return scored;
}
function buildReasons(kind: "experience" | "project", matchedSkills: string[], via: Set<string>): string[] {
    if (matchedSkills.length === 0)
        return [];
    const names = matchedSkills.map(skillDisplayName).join(", ");
    const reasons = [`Matches ${names}`];
    const channels: string[] = [];
    if (via.has("technologies"))
        channels.push(kind === "experience" ? "listed technologies" : "project technologies");
    if (via.has("achievements"))
        channels.push("tagged achievements");
    if (via.has("tags"))
        channels.push("tags");
    if (channels.length > 0)
        reasons.push(`Demonstrated via ${channels.join(" + ")}`);
    return reasons;
}
function truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max - 1) + "…" : text;
}
