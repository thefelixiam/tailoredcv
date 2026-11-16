import { NextResponse, type NextRequest } from "next/server";
import puppeteer, { type Browser } from "puppeteer";
import { SESSION_COOKIE, getSessionUserFromDefaultDb } from "@/lib/auth";
import { getMyCvVariant } from "@/lib/cv/store";
import { getMyJob } from "@/lib/jobs/store";
export async function GET(request: NextRequest, { params }: {
    params: {
        id: string;
    };
}) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const user = getSessionUserFromDefaultDb(token);
    if (!user || !token) {
        return new NextResponse("Unauthorized", { status: 401 });
    }
    const config = getMyCvVariant(user.id, params.id);
    if (!config) {
        return new NextResponse("Not found", { status: 404 });
    }
    const job = getMyJob(user.id, config.jobId);
    const configured = process.env.APP_URL?.replace(/\/$/, "");
    const requestOrigin = new URL(request.url).origin;
    const requestHostname = new URL(request.url).hostname;
    const origin = configured ?? requestOrigin;
    if (!configured && !["localhost", "127.0.0.1", "[::1]"].includes(requestHostname)) {
        return new NextResponse("PDF rendering is not configured (set APP_URL).", { status: 500 });
    }
    const hostname = new URL(origin).hostname;
    let browser: Browser | null = null;
    try {
        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        await page.setCookie({
            name: SESSION_COOKIE,
            value: token,
            domain: hostname,
            path: "/",
        });
        const response = await page.goto(`${origin}/cv/${config.id}/print`, {
            waitUntil: "networkidle0",
            timeout: 30000,
        });
        if (!response?.ok()) {
            return new NextResponse("Could not render CV", { status: 502 });
        }
        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: true,
        });
        const slug = (job?.title ?? "cv")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "cv";
        return new NextResponse(Buffer.from(pdf), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="cv-${slug}.pdf"`,
                "Content-Length": String(pdf.length),
            },
        });
    }
    catch (e) {
        console.error("PDF generation failed", e);
        return new NextResponse("PDF generation failed", { status: 500 });
    }
    finally {
        await browser?.close();
    }
}
