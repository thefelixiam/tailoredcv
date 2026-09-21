import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Create a job-specific CV from your existing experience.
        </h1>
        <p className="max-w-2xl text-zinc-600">
          Maintain one master profile, paste a job description, and get a tailored CV that
          selects and prioritizes your real experience — never invents it.
        </p>
      </section>

      <ol className="grid gap-3 sm:grid-cols-2">
        {[
          ["1. Build your profile", "Add experience, projects, skills and education once.", "/profile"],
          ["2. Add a job", "Paste the job description you want to target.", "/jobs/new"],
          ["3. Review the match", "See why each item was selected, then adjust.", "/jobs"],
          ["4. Preview & export", "Choose a template and download an A4 PDF.", "/jobs"],
        ].map(([title, body, href]) => (
          <li key={title} className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{body}</p>
            <Link href={href} className="mt-2 inline-block text-sm font-medium text-orange-700 hover:underline">
              Open →
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
