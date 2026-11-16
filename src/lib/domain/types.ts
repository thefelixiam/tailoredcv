export interface Achievement {
    id: string;
    text: string;
    tags: string[];
}
export interface ExperienceEntry {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    location: string;
    description: string;
    achievements: Achievement[];
    technologies: string[];
    tags: string[];
}
export interface ProjectLink {
    label: string;
    url: string;
}
export interface Project {
    id: string;
    name: string;
    description: string;
    role: string;
    technologies: string[];
    tags: string[];
    links: ProjectLink[];
    achievements: Achievement[];
}
export interface EducationEntry {
    id: string;
    school: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
}
export interface Certification {
    id: string;
    name: string;
    issuer: string;
    year: string;
}
export interface LanguageEntry {
    name: string;
    level: string;
}
export interface UserProfile {
    userId: string;
    fullName: string;
    title: string;
    location: string;
    email: string;
    phone: string;
    website: string;
    github: string;
    linkedin: string;
    photo: string;
    summary: string;
    skills: string[];
    experience: ExperienceEntry[];
    projects: Project[];
    education: EducationEntry[];
    certifications: Certification[];
    languages: LanguageEntry[];
}
export function emptyProfile(userId: string): UserProfile {
    return {
        userId,
        fullName: "",
        title: "",
        location: "",
        email: "",
        phone: "",
        website: "",
        github: "",
        linkedin: "",
        photo: "",
        summary: "",
        skills: [],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        languages: [],
    };
}
export type Seniority = "intern" | "junior" | "mid" | "senior" | "staff" | "lead" | "unknown";
export interface JobRequirements {
    title: string;
    seniority: Seniority;
    requiredSkills: string[];
    preferredSkills: string[];
    yearsOfExperience: number | null;
    education: string[];
    languages: string[];
    domainKeywords: string[];
    responsibilities: string[];
}
export interface Job {
    id: string;
    userId: string;
    title: string;
    rawDescription: string;
    requirements: JobRequirements;
    analyzer: string;
    createdAt: string;
    updatedAt: string;
}
export type RequirementKind = "required" | "preferred";
export type RequirementStatus = "matched" | "missing";
export interface MatchEvidence {
    type: "skill" | "experience" | "achievement" | "project";
    refId: string;
    label: string;
}
export interface RequirementMatch {
    skillId: string;
    kind: RequirementKind;
    status: RequirementStatus;
    evidence: MatchEvidence[];
}
export interface ScoredItem {
    kind: "experience" | "project";
    id: string;
    score: number;
    matchedSkills: string[];
    reasons: string[];
}
export interface MatchResult {
    jobId: string;
    profileToJobScore: number;
    requirements: RequirementMatch[];
    experience: ScoredItem[];
    projects: ScoredItem[];
    missingSkills: string[];
}
export interface SelectedExperience {
    experienceId: string;
    achievementIds: string[];
}
export interface SelectedProject {
    projectId: string;
    achievementIds: string[];
}
export type CvSection = "summary" | "experience" | "projects" | "skills" | "education" | "certifications" | "languages";
export interface CvConfiguration {
    id: string;
    userId: string;
    jobId: string;
    templateId: string;
    summary: string;
    selectedExperience: SelectedExperience[];
    selectedProjects: SelectedProject[];
    selectedSkills: string[];
    includedSections: CvSection[];
    includedEducation: string[];
    includedCertifications: string[];
    includedLanguages: string[];
    updatedAt: string;
}
export interface ResolvedAchievement {
    id: string;
    text: string;
    matchedSkills: string[];
}
export interface ResolvedTech {
    id: string;
    displayName: string;
    matched: boolean;
}
export interface ResolvedExperience {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    location: string;
    description: string;
    achievements: ResolvedAchievement[];
    technologies: ResolvedTech[];
    matchedSkills: string[];
}
export interface ResolvedProject {
    id: string;
    name: string;
    description: string;
    role: string;
    technologies: ResolvedTech[];
    links: ProjectLink[];
    achievements: ResolvedAchievement[];
    matchedSkills: string[];
}
export interface ResolvedCv {
    fullName: string;
    title: string;
    location: string;
    email: string;
    phone: string;
    website: string;
    github: string;
    linkedin: string;
    photo: string;
    summary: string;
    experience: ResolvedExperience[];
    projects: ResolvedProject[];
    skills: {
        id: string;
        displayName: string;
        matched: boolean;
    }[];
    education: EducationEntry[];
    certifications: Certification[];
    languages: LanguageEntry[];
    includedSections: CvSection[];
}
