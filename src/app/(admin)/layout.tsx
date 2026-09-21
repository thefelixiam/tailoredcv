import Link from "next/link";
import { getCurrentUser, logout } from "@/lib/session";
export default async function AdminLayout({ children }: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    return (<>
      <header className="border-b border-zinc-200 bg-white print:hidden">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Tailored<span className="text-orange-600">CV</span>
          </Link>
          {user ? (<>
              <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900">
                Dashboard
              </Link>
              <Link href="/profile" className="text-sm text-zinc-600 hover:text-zinc-900">
                Profile
              </Link>
              <Link href="/jobs" className="text-sm text-zinc-600 hover:text-zinc-900">
                Applications
              </Link>
              <span className="ml-auto text-sm text-zinc-500">{user.email}</span>
              <form action={logout}>
                <button type="submit" className="text-sm text-zinc-600 hover:text-zinc-900">
                  Sign out
                </button>
              </form>
            </>) : (<Link href="/login" className="ml-auto text-sm text-zinc-600 hover:text-zinc-900">
              Sign in
            </Link>)}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 print:m-0 print:max-w-none print:p-0">{children}</main>
    </>);
}
