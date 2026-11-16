import type { Metadata } from "next";
import "./globals.css";
import "./cv-print.css";
export const metadata: Metadata = {
    title: "Tailored CV",
    description: "Portfolio and job-specific CVs generated from one master profile — nothing invented.",
};
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) {
    return (<html lang="en">
      <body>{children}</body>
    </html>);
}
