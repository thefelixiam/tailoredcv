export interface TemplateMeta {
    id: string;
    name: string;
    description: string;
}
export const TEMPLATES: TemplateMeta[] = [
    {
        id: "midnight",
        name: "Midnight",
        description: "Dark premium developer-portfolio CV: navy/charcoal, coral accent.",
    },
    {
        id: "light",
        name: "Paper",
        description: "Clean light single-column CV for conservative readers and print.",
    },
];
export function getTemplate(id: string): TemplateMeta | undefined {
    return TEMPLATES.find((t) => t.id === id);
}
export function defaultTemplateId(): string {
    return "light";
}
export function isValidTemplateId(id: string): boolean {
    return TEMPLATES.some((t) => t.id === id);
}
