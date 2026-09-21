export type SkillCategory = "language" | "frontend" | "backend" | "mobile" | "data" | "devops" | "cloud" | "testing" | "tooling" | "practice";
export interface SkillDefinition {
    id: string;
    displayName: string;
    aliases: string[];
    category: SkillCategory;
    related: string[];
}
const S = (id: string, displayName: string, category: SkillCategory, aliases: string[] = [], related: string[] = []): SkillDefinition => ({ id, displayName, aliases, category, related });
export const SKILLS: SkillDefinition[] = [
    S("typescript", "TypeScript", "language", ["ts"], ["javascript"]),
    S("javascript", "JavaScript", "language", ["js", "es6", "es2015", "es2015+"], ["typescript"]),
    S("python", "Python", "language", ["py"], []),
    S("java", "Java", "language", [], ["kotlin", "spring"]),
    S("kotlin", "Kotlin", "language", [], ["java", "android"]),
    S("swift", "Swift", "language", [], ["ios"]),
    S("go", "Go", "language", ["golang"], []),
    S("rust", "Rust", "language", [], []),
    S("csharp", "C#", "language", ["c#", "c sharp", "csharp", ".net c#"], ["dotnet"]),
    S("php", "PHP", "language", [], ["laravel"]),
    S("ruby", "Ruby", "language", [], ["rails"]),
    S("sql", "SQL", "language", ["sql queries", "relational sql"], ["postgresql", "mysql"]),
    S("react", "React", "frontend", ["react.js", "reactjs", "react js"], ["nextjs", "typescript"]),
    S("nextjs", "Next.js", "frontend", ["next.js", "next js", "nextjs"], ["react", "typescript"]),
    S("vue", "Vue", "frontend", ["vue.js", "vuejs", "nuxt", "nuxt.js"], []),
    S("angular", "Angular", "frontend", ["angular.js", "angularjs"], ["typescript"]),
    S("svelte", "Svelte", "frontend", ["sveltekit", "svelte kit"], []),
    S("html", "HTML", "frontend", ["html5"], ["css"]),
    S("css", "CSS", "frontend", ["css3"], ["html", "tailwind"]),
    S("tailwind", "Tailwind CSS", "frontend", ["tailwindcss", "tailwind css"], ["css"]),
    S("redux", "Redux", "frontend", ["redux toolkit", "rtk"], ["react"]),
    S("accessibility", "Accessibility", "frontend", ["a11y", "wcag", "accessible"], []),
    S("nodejs", "Node.js", "backend", ["node.js", "node js", "node"], ["express", "typescript"]),
    S("express", "Express", "backend", ["express.js", "expressjs"], ["nodejs"]),
    S("django", "Django", "backend", [], ["python"]),
    S("fastapi", "FastAPI", "backend", ["fast api"], ["python"]),
    S("spring", "Spring", "backend", ["spring boot", "springboot"], ["java"]),
    S("dotnet", ".NET", "backend", ["dotnet", ".net", "asp.net", "aspnet", "c#.net"], ["csharp"]),
    S("laravel", "Laravel", "backend", [], ["php"]),
    S("rails", "Rails", "backend", ["ruby on rails", "ror"], ["ruby"]),
    S("graphql", "GraphQL", "backend", [], ["rest", "apollo"]),
    S("rest", "REST APIs", "backend", ["rest", "rest api", "rest apis", "restful", "restful apis"], ["graphql"]),
    S("grpc", "gRPC", "backend", ["grpc"], ["microservices"]),
    S("microservices", "Microservices", "backend", ["micro services", "micro-service"], ["grpc", "kubernetes"]),
    S("websockets", "WebSockets", "backend", ["websocket", "web sockets", "socket.io", "socketio"], []),
    S("react-native", "React Native", "mobile", ["reactnative", "react native"], ["react"]),
    S("flutter", "Flutter", "mobile", [], ["dart"]),
    S("android", "Android", "mobile", [], ["kotlin"]),
    S("ios", "iOS", "mobile", [], ["swift"]),
    S("postgresql", "PostgreSQL", "data", ["postgres", "psql"], ["sql"]),
    S("mysql", "MySQL", "data", [], ["sql"]),
    S("mongodb", "MongoDB", "data", ["mongo"], []),
    S("redis", "Redis", "data", [], []),
    S("elasticsearch", "Elasticsearch", "data", ["elasticsearch", "elk"], []),
    S("kafka", "Kafka", "data", ["apache kafka"], []),
    S("data-modeling", "Data Modeling", "data", ["data modelling", "schema design"], ["sql"]),
    S("docker", "Docker", "devops", [], ["kubernetes"]),
    S("kubernetes", "Kubernetes", "devops", ["k8s", "kubernettes"], ["docker"]),
    S("terraform", "Terraform", "devops", [], []),
    S("cicd", "CI/CD", "devops", ["ci/cd", "ci cd", "continuous integration", "continuous delivery", "github actions", "gitlab ci", "jenkins"], []),
    S("linux", "Linux", "devops", ["unix", "bash", "shell scripting"], []),
    S("aws", "AWS", "cloud", ["amazon web services"], []),
    S("gcp", "Google Cloud", "cloud", ["gcp", "google cloud platform", "google cloud"], []),
    S("azure", "Azure", "cloud", ["microsoft azure"], []),
    S("serverless", "Serverless", "cloud", ["aws lambda", "cloud functions"], ["aws"]),
    S("testing", "Testing", "testing", ["unit testing", "integration testing", "e2e testing", "end-to-end testing", "test automation"], ["jest", "playwright"]),
    S("jest", "Jest", "testing", ["vitest"], ["testing"]),
    S("playwright", "Playwright", "testing", [], ["testing"]),
    S("cypress", "Cypress", "testing", [], ["testing"]),
    S("selenium", "Selenium", "testing", [], ["testing"]),
    S("git", "Git", "tooling", [], []),
    S("figma", "Figma", "tooling", [], []),
    S("storybook", "Storybook", "tooling", [], ["react"]),
    S("agile", "Agile", "practice", ["scrum", "kanban"], []),
    S("system-design", "System Design", "practice", ["system architecture", "software architecture", "distributed systems"], ["microservices"]),
    S("performance", "Performance Optimization", "practice", ["performance tuning", "web performance", "optimization"], []),
    S("security", "Security", "practice", ["application security", "owasp", "oauth", "oauth2"], []),
    S("mentoring", "Mentoring", "practice", ["mentorship"], []),
];
const aliasToId = new Map<string, string>();
function canonicalForm(value: string): string {
    return value
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[._\-+/]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
for (const skill of SKILLS) {
    aliasToId.set(canonicalForm(skill.id), skill.id);
    aliasToId.set(canonicalForm(skill.displayName), skill.id);
    for (const alias of skill.aliases) {
        const key = canonicalForm(alias);
        if (!aliasToId.has(key))
            aliasToId.set(key, skill.id);
    }
}
export function normalizeSkillId(raw: string): string | null {
    const key = canonicalForm(raw.trim());
    if (!key)
        return null;
    return aliasToId.get(key) ?? null;
}
export function normalizeSkillList(raw: string[]): string[] {
    const seen = new Set<string>();
    for (const item of raw) {
        const id = normalizeSkillId(item);
        if (id)
            seen.add(id);
    }
    return [...seen];
}
const skillById: Map<string, SkillDefinition> = new Map(SKILLS.map((s) => [s.id, s]));
export function getSkill(id: string): SkillDefinition | undefined {
    return skillById.get(id);
}
export function skillDisplayName(id: string): string {
    return getSkill(id)?.displayName ?? id;
}
export function skillSpellings(id: string): string[] {
    const skill = getSkill(id);
    if (!skill)
        return [id];
    return [skill.displayName, ...skill.aliases];
}
