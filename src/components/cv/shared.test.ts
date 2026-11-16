import { describe, expect, it } from "vitest";
import type { ResolvedCv } from "@/lib/domain/types";
import { contactItems } from "./shared";
function cvWith(contacts: Partial<ResolvedCv>): ResolvedCv {
    return {
        fullName: "Dev Example",
        title: "",
        location: "",
        email: "",
        phone: "",
        website: "",
        github: "",
        linkedin: "",
        photo: "",
        summary: "",
        experience: [],
        projects: [],
        skills: [],
        education: [],
        certifications: [],
        languages: [],
        includedSections: [],
        ...contacts,
    };
}
describe("contactItems", () => {
    it("separates location from links and collapses social URLs to handles", () => {
        const items = contactItems(cvWith({
            location: "Example City, EX",
            email: "dev@example.com",
            phone: "+49 170 000",
            website: "https://example.dev/portfolio/",
            github: "https://github.com/example-dev",
            linkedin: "https://www.linkedin.com/in/example-dev-12345678",
        }));
        expect(items.map((i) => i.kind)).toEqual(["location", "email", "phone", "website", "github", "linkedin"]);
        expect(items[0]).toEqual({ kind: "location", label: "Example City, EX" });
        expect(items[1].href).toBe("mailto:dev@example.com");
        expect(items[2].href).toBe("tel:+49170000");
        expect(items[3]).toMatchObject({ label: "example.dev/portfolio" });
        expect(items[4]).toMatchObject({ label: "example-dev", href: "https://github.com/example-dev" });
        expect(items[5].label).toBe("example-dev-12345678");
    });
    it("omits empty fields", () => {
        expect(contactItems(cvWith({ email: "a@b.co" })).map((i) => i.kind)).toEqual(["email"]);
        expect(contactItems(cvWith({}))).toEqual([]);
    });
});
