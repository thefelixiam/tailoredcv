import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tailored CV",
  description: "Create a job-specific CV from your existing professional experience.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Tailored<span className="text-orange-600">CV</span>
            </Link>
            <Link href="/profile" className="text-sm text-zinc-600 hover:text-zinc-900">
              Profile
            </Link>
            <Link href="/jobs" className="text-sm text-zinc-600 hover:text-zinc-900">
              Applications
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
