import Database from "better-sqlite3";
import { findUserByEmail } from "./auth";
import { getDb } from "./db";
import { getProfile } from "./profiles";
import type { UserProfile } from "./domain/types";
import { getSkill, skillDisplayName } from "./skills/taxonomy";
import { humanizeDate } from "./dates";
export interface PortfolioSkillGroup {
    label: string;
    skills: string[];
}
export interface PortfolioExperience {
    role: string;
    company: string;
    period: string;
    location: string;
    description: string;
    bullets: string[];
}
export interface PortfolioProject {
    name: string;
    desc: string;
    role: string;
    stack: string;
    link: string;
}
export interface PortfolioEducation {
    school: string;
    period: string;
    note: string;
}
export interface PortfolioCertification {
    name: string;
    issuer: string;
    year: string;
}
export interface PortfolioView {
    name: string;
    title: string;
    location: string;
    email: string;
    phone: string;
    website: string;
    github: string;
    linkedin: string;
    summary: string;
    roles: string[];
    skillGroups: PortfolioSkillGroup[];
    experience: PortfolioExperience[];
    projects: PortfolioProject[];
    education: PortfolioEducation[];
    certifications: PortfolioCertification[];
    languages: string[];
    publishable: boolean;
}
const CATEGORY_LABELS: Record<string, string> = {
    language: "Languages",
    frontend: "Frontend",
    backend: "Backend",
    mobile: "Mobile",
    data: "Data",
    devops: "DevOps",
    cloud: "Cloud",
    testing: "Testing",
    tooling: "Tools",
    practice: "Practices",
};
function formatPeriod(start: string, end: string | null): string {
    const s = humanizeDate(start);
    const e = end ? humanizeDate(end) : "Present";
    if (s)
        return `${s} — ${e}`;
    return e === "Present" ? "" : e;
}
export function buildPortfolioView(profile: UserProfile): PortfolioView {
    const byCategory = new Map<string, string[]>();
    for (const id of profile.skills) {
        const def = getSkill(id);
        const label = def ? (CATEGORY_LABELS[def.category] ?? def.category) : "Other";
        const list = byCategory.get(label) ?? [];
        list.push(skillDisplayName(id));
        byCategory.set(label, list);
    }
    const topSkills = profile.skills.slice(0, 6).map(skillDisplayName);
    const roles = [
        profile.title,
        ...(topSkills.length ? [topSkills.join(" · ")] : []),
    ].filter(Boolean);
    return {
        name: profile.fullName,
        title: profile.title,
        location: profile.location,
        email: profile.email,
        phone: profile.phone,
        website: profile.website,
        github: profile.github,
        linkedin: profile.linkedin,
        summary: profile.summary,
        roles,
        skillGroups: [...byCategory.entries()].map(([label, skills]) => ({ label, skills })),
        experience: profile.experience.map((e) => ({
            role: e.role,
            company: e.company,
            period: formatPeriod(e.startDate, e.endDate),
            location: e.location,
            description: e.description,
            bullets: e.achievements.map((a) => a.text),
        })),
        projects: profile.projects.map((p) => ({
            name: p.name,
            desc: p.description,
            role: p.role,
            stack: p.technologies.map(skillDisplayName).join(" · "),
            link: p.links[0]?.url ?? "",
        })),
        education: profile.education.map((e) => ({
            school: e.school,
            period: [e.startYear, e.endYear].filter(Boolean).join(" — "),
            note: [e.degree, e.field].filter(Boolean).join(", "),
        })),
        certifications: profile.certifications.map((c) => ({
            name: c.name,
            issuer: c.issuer,
            year: c.year,
        })),
        languages: profile.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)),
        publishable: Boolean(profile.fullName.trim() && (profile.experience.length > 0 || profile.projects.length > 0)),
    };
}
export function getPortfolioOwnerId(db: Database.Database): string | null {
    const pinned = process.env.PORTFOLIO_USER_EMAIL?.trim().toLowerCase();
    if (pinned) {
        const user = findUserByEmail(db, pinned);
        if (user)
            return user.id;
    }
    const row = db.prepare("SELECT id FROM users ORDER BY created_at ASC LIMIT 1").get() as {
        id: string;
    } | undefined;
    return row?.id ?? null;
}
export function getPortfolioView(): PortfolioView | null {
    const db = getDb();
    const ownerId = getPortfolioOwnerId(db);
    if (!ownerId)
        return null;
    const view = buildPortfolioView(getProfile(db, ownerId));
    return view.publishable ? view : null;
}
