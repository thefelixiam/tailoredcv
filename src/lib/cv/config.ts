import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { CvConfiguration, CvSection, Job, MatchResult, ResolvedCv, UserProfile, } from "../domain/types";
import { skillDisplayName } from "../skills/taxonomy";
import { defaultTemplateId, isValidTemplateId } from "./templates";
export const CV_LIMITS = {
    maxExperience: 4,
    maxProjects: 3,
    maxAchievementsPerItem: 3,
    maxSkills: 16,
} as const;
export function buildCvConfiguration(profile: UserProfile, job: Job, match: MatchResult, templateId: string = defaultTemplateId()): CvConfiguration {
    const jobSkillOrder = [...job.requirements.requiredSkills, ...job.requirements.preferredSkills];
    const rank = new Map(jobSkillOrder.map((id, i) => [id, i]));
    const selectedExperience = match.experience
        .filter((s) => s.score > 0)
        .slice(0, CV_LIMITS.maxExperience)
        .map((s) => {
        const exp = profile.experience.find((e) => e.id === s.id);
        const achievementIds = (exp?.achievements ?? [])
            .filter((a) => a.tags.some((t) => jobSkillOrder.includes(t)))
            .slice(0, CV_LIMITS.maxAchievementsPerItem)
            .map((a) => a.id);
        return { experienceId: s.id, achievementIds };
    });
    const selectedProjects = match.projects
        .filter((s) => s.score > 0)
        .slice(0, CV_LIMITS.maxProjects)
        .map((s) => {
        const proj = profile.projects.find((p) => p.id === s.id);
        const achievementIds = (proj?.achievements ?? [])
            .filter((a) => a.tags.some((t) => jobSkillOrder.includes(t)))
            .slice(0, CV_LIMITS.maxAchievementsPerItem)
            .map((a) => a.id);
        return { projectId: s.id, achievementIds };
    });
    const evidenced = new Set<string>();
    for (const r of match.requirements) {
        if (r.status === "matched")
            evidenced.add(r.skillId);
    }
    const inProfile = (id: string): boolean => profile.skills.includes(id) ||
        profile.experience.some((e) => e.technologies.includes(id) ||
            e.tags.includes(id) ||
            e.achievements.some((a) => a.tags.includes(id))) ||
        profile.projects.some((p) => p.technologies.includes(id) ||
            p.tags.includes(id) ||
            p.achievements.some((a) => a.tags.includes(id)));
    const selectedSkills = [...evidenced]
        .filter(inProfile)
        .sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999))
        .slice(0, CV_LIMITS.maxSkills);
    const includedSections: CvSection[] = ["summary", "experience", "projects", "skills", "education", "certifications", "languages"];
    return {
        id: randomUUID(),
        userId: profile.userId,
        jobId: job.id,
        templateId: isValidTemplateId(templateId) ? templateId : defaultTemplateId(),
        summary: composeSummary(profile, selectedSkills),
        selectedExperience,
        selectedProjects,
        selectedSkills,
        includedSections,
        includedEducation: profile.education.map((e) => e.id),
        includedCertifications: profile.certifications.map((c) => c.id),
        includedLanguages: profile.languages.map((l) => l.name),
        updatedAt: new Date().toISOString(),
    };
}
export function composeSummary(profile: UserProfile, selectedSkills: string[]): string {
    if (profile.summary.trim())
        return profile.summary.trim();
    const top = selectedSkills.slice(0, 4).map(skillDisplayName);
    const title = profile.title.trim();
    if (title && top.length > 0)
        return `${title} focused on ${top.join(", ")}.`;
    if (title)
        return title;
    if (top.length > 0)
        return `Professional experience in ${top.join(", ")}.`;
    return "";
}
export function resolveCv(profile: UserProfile, config: CvConfiguration, match: MatchResult): ResolvedCv {
    const matchByExp = new Map(match.experience.map((s) => [s.id, s]));
    const matchByProj = new Map(match.projects.map((s) => [s.id, s]));
    const jobSkills = new Set([
        ...match.requirements.filter((r) => r.status === "matched").map((r) => r.skillId),
    ]);
    const evidencedSkills = new Set<string>(profile.skills);
    for (const e of profile.experience) {
        e.technologies.forEach((t) => evidencedSkills.add(t));
        e.tags.forEach((t) => evidencedSkills.add(t));
        e.achievements.forEach((a) => a.tags.forEach((t) => evidencedSkills.add(t)));
    }
    for (const p of profile.projects) {
        p.technologies.forEach((t) => evidencedSkills.add(t));
        p.tags.forEach((t) => evidencedSkills.add(t));
        p.achievements.forEach((a) => a.tags.forEach((t) => evidencedSkills.add(t)));
    }
    const toTech = (ids: string[]) => ids.map((id) => ({ id, displayName: skillDisplayName(id), matched: jobSkills.has(id) }));
    const experience = config.selectedExperience.flatMap((sel) => {
        const exp = profile.experience.find((e) => e.id === sel.experienceId);
        if (!exp)
            return [];
        const scored = matchByExp.get(exp.id);
        return [
            {
                id: exp.id,
                company: exp.company,
                role: exp.role,
                startDate: exp.startDate,
                endDate: exp.endDate,
                location: exp.location,
                description: exp.description,
                achievements: sel.achievementIds.flatMap((aid) => {
                    const a = exp.achievements.find((x) => x.id === aid);
                    if (!a)
                        return [];
                    return [{ id: a.id, text: a.text, matchedSkills: a.tags.filter((t) => jobSkills.has(t)) }];
                }),
                technologies: toTech(exp.technologies),
                matchedSkills: scored?.matchedSkills ?? [],
            },
        ];
    });
    const projects = config.selectedProjects.flatMap((sel) => {
        const p = profile.projects.find((x) => x.id === sel.projectId);
        if (!p)
            return [];
        const scored = matchByProj.get(p.id);
        return [
            {
                id: p.id,
                name: p.name,
                description: p.description,
                role: p.role,
                technologies: toTech(p.technologies),
                links: p.links.filter((l) => /^https?:\/\/.+\..+/.test(l.url)),
                achievements: sel.achievementIds.flatMap((aid) => {
                    const a = p.achievements.find((x) => x.id === aid);
                    if (!a)
                        return [];
                    return [{ id: a.id, text: a.text, matchedSkills: a.tags.filter((t) => jobSkills.has(t)) }];
                }),
                matchedSkills: scored?.matchedSkills ?? [],
            },
        ];
    });
    return {
        fullName: profile.fullName,
        title: profile.title,
        location: profile.location,
        email: profile.email,
        phone: profile.phone,
        website: profile.website,
        github: profile.github,
        linkedin: profile.linkedin,
        photo: profile.photo,
        summary: config.summary,
        experience,
        projects,
        skills: config.selectedSkills
            .filter((id) => evidencedSkills.has(id))
            .map((id) => ({
            id,
            displayName: skillDisplayName(id),
            matched: jobSkills.has(id),
        })),
        education: config.includedEducation.flatMap((id) => profile.education.filter((e) => e.id === id)),
        certifications: config.includedCertifications.flatMap((id) => profile.certifications.filter((c) => c.id === id)),
        languages: profile.languages.filter((l) => config.includedLanguages.includes(l.name)),
        includedSections: config.includedSections,
    };
}
export const cvConfigPatchSchema = z.object({
    templateId: z.string().min(1).optional(),
    summary: z.string().max(5000).optional(),
    selectedExperience: z
        .array(z.object({ experienceId: z.string().min(1), achievementIds: z.array(z.string().min(1)).default([]) }))
        .optional(),
    selectedProjects: z
        .array(z.object({ projectId: z.string().min(1), achievementIds: z.array(z.string().min(1)).default([]) }))
        .optional(),
    selectedSkills: z.array(z.string().min(1)).optional(),
    includedSections: z
        .array(z.enum(["summary", "experience", "projects", "skills", "education", "certifications", "languages"]))
        .optional(),
    includedEducation: z.array(z.string().min(1)).optional(),
    includedCertifications: z.array(z.string().min(1)).optional(),
    includedLanguages: z.array(z.string().min(1)).optional(),
});
export type CvConfigPatch = z.infer<typeof cvConfigPatchSchema>;
export function applyCvOverrides(config: CvConfiguration, patch: unknown): CvConfiguration {
    const p = cvConfigPatchSchema.parse(patch);
    const capAchievements = <T extends {
        achievementIds: string[];
    }>(items: T[]): T[] => items
        .slice(0, Math.max(CV_LIMITS.maxExperience, CV_LIMITS.maxProjects))
        .map((item) => ({ ...item, achievementIds: item.achievementIds.slice(0, CV_LIMITS.maxAchievementsPerItem) }));
    return {
        ...config,
        templateId: p.templateId && isValidTemplateId(p.templateId) ? p.templateId : config.templateId,
        summary: p.summary !== undefined ? p.summary : config.summary,
        selectedExperience: p.selectedExperience
            ? capAchievements(p.selectedExperience).slice(0, CV_LIMITS.maxExperience)
            : config.selectedExperience,
        selectedProjects: p.selectedProjects
            ? capAchievements(p.selectedProjects).slice(0, CV_LIMITS.maxProjects)
            : config.selectedProjects,
        selectedSkills: p.selectedSkills ? [...new Set(p.selectedSkills)].slice(0, CV_LIMITS.maxSkills) : config.selectedSkills,
        includedSections: p.includedSections ?? config.includedSections,
        includedEducation: p.includedEducation ?? config.includedEducation,
        includedCertifications: p.includedCertifications ?? config.includedCertifications,
        includedLanguages: p.includedLanguages ?? config.includedLanguages,
        updatedAt: new Date().toISOString(),
    };
}
