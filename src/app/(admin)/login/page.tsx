import { loginAction, registerAction } from "./actions";
export default function LoginPage({ searchParams }: {
    searchParams: {
        error?: string;
    };
}) {
    return (<div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in to TailoredCV</h1>
        <p className="mt-1 text-sm text-zinc-600">Your profile and applications stay private to your account.</p>
      </div>

      {searchParams.error && (<p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>)}

      <form action={loginAction} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Sign in</h2>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Email</span>
          <input name="email" type="email" required autoComplete="email" className="w-full rounded-md border border-zinc-300 px-3 py-2"/>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Password</span>
          <input name="password" type="password" required autoComplete="current-password" className="w-full rounded-md border border-zinc-300 px-3 py-2"/>
        </label>
        <button type="submit" className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          Sign in
        </button>
      </form>

      <form action={registerAction} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Create an account</h2>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Email</span>
          <input name="email" type="email" required autoComplete="email" className="w-full rounded-md border border-zinc-300 px-3 py-2"/>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Password (min. 8 characters)</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="w-full rounded-md border border-zinc-300 px-3 py-2"/>
        </label>
        <button type="submit" className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">
          Create account
        </button>
      </form>
    </div>);
}
