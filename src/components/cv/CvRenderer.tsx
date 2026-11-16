import type { ResolvedCv } from "@/lib/domain/types";
import { MidnightCv } from "./MidnightCv";
import { PaperCv } from "./PaperCv";
export function CvRenderer({ templateId, cv }: {
    templateId: string;
    cv: ResolvedCv;
}) {
    switch (templateId) {
        case "light":
            return <PaperCv cv={cv}/>;
        case "midnight":
        default:
            return <MidnightCv cv={cv}/>;
    }
}
