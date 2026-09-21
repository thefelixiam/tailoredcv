"use client";
import { useState, useTransition } from "react";
import type { UserProfile } from "@/lib/domain/types";
import { normalizeSkillId } from "@/lib/skills/taxonomy";
import { saveProfileAction } from "@/app/(admin)/profile/actions";
const inputCls = "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";
const labelCls = "block text-sm";
const hintCls = "mb-1 block text-zinc-600";
function Field({ label, error, children }: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (<label className={`${labelCls}${error ? " field-error" : ""}`}>
      <span className={hintCls}>{label}</span>
      {children}
      {error && (<span className="mt-1 block text-xs text-red-600" role="alert">
          {error}
        </span>)}
    </label>);
}
function CommaField({ label, value, onChange, error }: {
    label: string;
    value: string[];
    onChange: (v: string[]) => void;
    error?: string;
}) {
    const [text, setText] = useState(value.join(", "));
    const recognized = value.filter((v) => normalizeSkillId(v));
    const unknown = value.filter((v) => !normalizeSkillId(v));
    return (<div className={error ? "field-error" : undefined}>
      <label className={labelCls}>
        <span className={hintCls}>{label} (comma-separated)</span>
        <input className={inputCls} value={text} aria-invalid={Boolean(error)} onChange={(e) => {
            setText(e.target.value);
            onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
        }} placeholder="React, TypeScript, …"/>
      </label>
      {error && (<p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>)}
      {(recognized.length > 0 || unknown.length > 0) && (<div className="mt-1 flex flex-wrap gap-1 text-xs">
          {recognized.map((v) => (<span key={v} className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">✓ {v}</span>))}
          {unknown.map((v) => (<span key={v} className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">? {v} (unrecognized)</span>))}
        </div>)}
    </div>);
}
interface Ach {
    id: string;
    text: string;
    tags: string[];
}
function AchievementsEditor({ value, onChange, basePath, fieldErrors, }: {
    value: Ach[];
    onChange: (v: Ach[]) => void;
    basePath: string;
    fieldErrors: Record<string, string | undefined>;
}) {
    return (<div className="space-y-2">
      {value.map((a, i) => {
            const textError = fieldErrors[`${basePath}.${i}.text`];
            return (<div key={i} className={`rounded-md border border-zinc-200 p-2${textError ? " field-error" : ""}`}>
            <textarea className={inputCls} rows={2} value={a.text} aria-label="Achievement" aria-invalid={Boolean(textError)} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder="Built reusable React components serving 40k users"/>
            {textError && (<p className="mt-1 text-xs text-red-600" role="alert">
                {textError}
              </p>)}
          <div className="mt-2 flex items-end gap-2">
            <div className="flex-1">
              <CommaField label="Tags" value={a.tags} onChange={(tags) => onChange(value.map((x, j) => (j === i ? { ...x, tags } : x)))}/>
            </div>
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-red-600">
              Remove
            </button>
            </div>
          </div>);
        })}
      <button type="button" onClick={() => onChange([...value, { id: "", text: "", tags: [] }])} className="rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-xs text-zinc-600">
        + Add achievement
      </button>
    </div>);
}
export function ProfileForm({ initial }: {
    initial: UserProfile;
}) {
    const [profile, setProfile] = useState<UserProfile>(initial);
    const [pending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
    const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => setProfile((p) => ({ ...p, [key]: value }));
    const fe = (path: string) => fieldErrors[path];
    const save = () => startTransition(async () => {
        const result = await saveProfileAction(profile);
        if (result.ok) {
            setFieldErrors({});
            setMessage("Profile saved.");
        }
        else if (result.fieldErrors?.length) {
            setFieldErrors(Object.fromEntries(result.fieldErrors.map((f) => [f.path, f.message])));
            setMessage(null);
        }
        else {
            setMessage(`Error: ${result.error}`);
        }
    });
    return (<div className="space-y-6">
      {message && <p role="status" className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm">{message}</p>}

      <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Personal</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" error={fe("fullName")}><input className={inputCls} value={profile.fullName} onChange={(e) => set("fullName", e.target.value)}/></Field>
          <Field label="Professional title" error={fe("title")}><input className={inputCls} value={profile.title} onChange={(e) => set("title", e.target.value)}/></Field>
          <Field label="Location" error={fe("location")}><input className={inputCls} value={profile.location} onChange={(e) => set("location", e.target.value)}/></Field>
          <Field label="Email" error={fe("email")}><input className={inputCls} value={profile.email} onChange={(e) => set("email", e.target.value)}/></Field>
          <Field label="Phone" error={fe("phone")}><input className={inputCls} value={profile.phone} onChange={(e) => set("phone", e.target.value)}/></Field>
          <Field label="Website" error={fe("website")}><input className={inputCls} value={profile.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…"/></Field>
          <Field label="GitHub" error={fe("github")}><input className={inputCls} value={profile.github} onChange={(e) => set("github", e.target.value)} placeholder="https://github.com/…"/></Field>
          <Field label="LinkedIn" error={fe("linkedin")}><input className={inputCls} value={profile.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/…"/></Field>
          <Field label="Photo URL" error={fe("photo")}><input className={inputCls} value={profile.photo} onChange={(e) => set("photo", e.target.value)} placeholder="https://…/photo.jpg"/></Field>
        </div>
        <Field label="Summary" error={fe("summary")}>
          <textarea className={inputCls} rows={4} value={profile.summary} onChange={(e) => set("summary", e.target.value)} placeholder="2–4 sentences about your experience and focus."/>
        </Field>
      </section>

      <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Skills</h2>
        <CommaField label="Skills" value={profile.skills} onChange={(v) => set("skills", v)}/>
      </section>

      <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Experience</h2>
        {profile.experience.map((exp, i) => (<div key={i} className="space-y-3 rounded-md border border-zinc-200 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Company" error={fe(`experience.${i}.company`)}><input className={inputCls} value={exp.company} onChange={(e) => set("experience", profile.experience.map((x, j) => (j === i ? { ...x, company: e.target.value } : x)))}/></Field>
              <Field label="Role" error={fe(`experience.${i}.role`)}><input className={inputCls} value={exp.role} onChange={(e) => set("experience", profile.experience.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}/></Field>
              <Field label="Start date" error={fe(`experience.${i}.startDate`)}><input className={inputCls} value={exp.startDate} onChange={(e) => set("experience", profile.experience.map((x, j) => (j === i ? { ...x, startDate: e.target.value } : x)))} placeholder="2021-03"/></Field>
              <Field label="End date (empty = present)" error={fe(`experience.${i}.endDate`)}>
                <input className={inputCls} value={exp.endDate ?? ""} onChange={(e) => set("experience", profile.experience.map((x, j) => (j === i ? { ...x, endDate: e.target.value || null } : x)))} placeholder="2024-01"/>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Location" error={fe(`experience.${i}.location`)}><input className={inputCls} value={exp.location} onChange={(e) => set("experience", profile.experience.map((x, j) => (j === i ? { ...x, location: e.target.value } : x)))}/></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Description" error={fe(`experience.${i}.description`)}>
                  <textarea className={inputCls} rows={2} value={exp.description} onChange={(e) => set("experience", profile.experience.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}/>
                </Field>
              </div>
            </div>
            <CommaField label="Technologies" value={exp.technologies} onChange={(v) => set("experience", profile.experience.map((x, j) => (j === i ? { ...x, technologies: v } : x)))}/>
            <CommaField label="Tags" value={exp.tags} onChange={(v) => set("experience", profile.experience.map((x, j) => (j === i ? { ...x, tags: v } : x)))}/>
            <div>
              <span className="mb-1 block text-sm text-zinc-600">Achievements</span>
              <AchievementsEditor value={exp.achievements} basePath={`experience.${i}.achievements`} fieldErrors={fieldErrors} onChange={(v) => set("experience", profile.experience.map((x, j) => (j === i ? { ...x, achievements: v } : x)))}/>
            </div>
            <button type="button" onClick={() => set("experience", profile.experience.filter((_, j) => j !== i))} className="text-xs text-red-600">
              Remove this experience
            </button>
          </div>))}
        <button type="button" onClick={() => set("experience", [...profile.experience, { id: "", company: "", role: "", startDate: "", endDate: null, location: "", description: "", achievements: [], technologies: [], tags: [] }])} className="rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-600">
          + Add experience
        </button>
      </section>

      <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Projects</h2>
        {profile.projects.map((proj, i) => (<div key={i} className="space-y-3 rounded-md border border-zinc-200 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" error={fe(`projects.${i}.name`)}><input className={inputCls} value={proj.name} onChange={(e) => set("projects", profile.projects.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}/></Field>
              <Field label="Your role" error={fe(`projects.${i}.role`)}><input className={inputCls} value={proj.role} onChange={(e) => set("projects", profile.projects.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}/></Field>
              <div className="sm:col-span-2">
                <Field label="Description" error={fe(`projects.${i}.description`)}>
                  <textarea className={inputCls} rows={2} value={proj.description} onChange={(e) => set("projects", profile.projects.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}/>
                </Field>
              </div>
            </div>
            <CommaField label="Technologies" value={proj.technologies} onChange={(v) => set("projects", profile.projects.map((x, j) => (j === i ? { ...x, technologies: v } : x)))}/>
            <CommaField label="Tags" value={proj.tags} onChange={(v) => set("projects", profile.projects.map((x, j) => (j === i ? { ...x, tags: v } : x)))}/>
            <div>
              <span className="mb-1 block text-sm text-zinc-600">Achievements</span>
              <AchievementsEditor value={proj.achievements} basePath={`projects.${i}.achievements`} fieldErrors={fieldErrors} onChange={(v) => set("projects", profile.projects.map((x, j) => (j === i ? { ...x, achievements: v } : x)))}/>
            </div>
            <button type="button" onClick={() => set("projects", profile.projects.filter((_, j) => j !== i))} className="text-xs text-red-600">
              Remove this project
            </button>
          </div>))}
        <button type="button" onClick={() => set("projects", [...profile.projects, { id: "", name: "", description: "", role: "", technologies: [], tags: [], links: [], achievements: [] }])} className="rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-600">
          + Add project
        </button>
      </section>

      <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Education</h2>
        {profile.education.map((ed, i) => (<div key={i} className="grid gap-3 sm:grid-cols-3">
            <Field label="School" error={fe(`education.${i}.school`)}><input className={inputCls} value={ed.school} onChange={(e) => set("education", profile.education.map((x, j) => (j === i ? { ...x, school: e.target.value } : x)))}/></Field>
            <Field label="Degree" error={fe(`education.${i}.degree`)}><input className={inputCls} value={ed.degree} onChange={(e) => set("education", profile.education.map((x, j) => (j === i ? { ...x, degree: e.target.value } : x)))}/></Field>
            <Field label="Field" error={fe(`education.${i}.field`)}><input className={inputCls} value={ed.field} onChange={(e) => set("education", profile.education.map((x, j) => (j === i ? { ...x, field: e.target.value } : x)))}/></Field>
            <Field label="Start year" error={fe(`education.${i}.startYear`)}><input className={inputCls} value={ed.startYear} onChange={(e) => set("education", profile.education.map((x, j) => (j === i ? { ...x, startYear: e.target.value } : x)))}/></Field>
            <Field label="End year" error={fe(`education.${i}.endYear`)}><input className={inputCls} value={ed.endYear} onChange={(e) => set("education", profile.education.map((x, j) => (j === i ? { ...x, endYear: e.target.value } : x)))}/></Field>
            <div className="flex items-end">
              <button type="button" onClick={() => set("education", profile.education.filter((_, j) => j !== i))} className="text-xs text-red-600">Remove</button>
            </div>
          </div>))}
        <button type="button" onClick={() => set("education", [...profile.education, { id: "", school: "", degree: "", field: "", startYear: "", endYear: "" }])} className="rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-600">
          + Add education
        </button>
      </section>

      <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Certifications</h2>
        {profile.certifications.map((c, i) => (<div key={i} className="grid gap-3 sm:grid-cols-4">
            <Field label="Name" error={fe(`certifications.${i}.name`)}><input className={inputCls} value={c.name} onChange={(e) => set("certifications", profile.certifications.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}/></Field>
            <Field label="Issuer" error={fe(`certifications.${i}.issuer`)}><input className={inputCls} value={c.issuer} onChange={(e) => set("certifications", profile.certifications.map((x, j) => (j === i ? { ...x, issuer: e.target.value } : x)))}/></Field>
            <Field label="Year" error={fe(`certifications.${i}.year`)}><input className={inputCls} value={c.year} onChange={(e) => set("certifications", profile.certifications.map((x, j) => (j === i ? { ...x, year: e.target.value } : x)))}/></Field>
            <div className="flex items-end">
              <button type="button" onClick={() => set("certifications", profile.certifications.filter((_, j) => j !== i))} className="text-xs text-red-600">Remove</button>
            </div>
          </div>))}
        <button type="button" onClick={() => set("certifications", [...profile.certifications, { id: "", name: "", issuer: "", year: "" }])} className="rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-600">
          + Add certification
        </button>
      </section>

      <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Languages</h2>
        {profile.languages.map((l, i) => (<div key={i} className="grid gap-3 sm:grid-cols-3">
            <Field label="Language" error={fe(`languages.${i}.name`)}><input className={inputCls} value={l.name} onChange={(e) => set("languages", profile.languages.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}/></Field>
            <Field label="Level" error={fe(`languages.${i}.level`)}><input className={inputCls} value={l.level} onChange={(e) => set("languages", profile.languages.map((x, j) => (j === i ? { ...x, level: e.target.value } : x)))} placeholder="Fluent, B2, Native…"/></Field>
            <div className="flex items-end">
              <button type="button" onClick={() => set("languages", profile.languages.filter((_, j) => j !== i))} className="text-xs text-red-600">Remove</button>
            </div>
          </div>))}
        <button type="button" onClick={() => set("languages", [...profile.languages, { name: "", level: "" }])} className="rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-600">
          + Add language
        </button>
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <button onClick={save} disabled={pending} className="rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-zinc-700 disabled:opacity-50">
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>);
}
