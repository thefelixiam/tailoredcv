import { requireUser } from "@/lib/session";
import { createJobAction } from "../actions";
export default async function NewJobPage({ searchParams }: {
    searchParams: {
        error?: string;
    };
}) {
    await requireUser();
    return (<div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New application</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Paste the job description. The original text is always preserved; requirements are extracted deterministically.
        </p>
      </div>

      {searchParams.error && (<p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>)}

      <form action={createJobAction} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Job title (optional — detected automatically)</span>
          <input name="title" className="w-full rounded-md border border-zinc-300 px-3 py-2" placeholder="Senior Frontend Developer"/>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Job description</span>
          <textarea name="rawDescription" required rows={16} className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs" placeholder={"Paste the full job posting here…\n\nRequirements:\n- …\n\nNice to have:\n- …"}/>
        </label>
        <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          Analyze job →
        </button>
      </form>
    </div>);
}
