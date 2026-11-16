"use client";
import { useState, useTransition } from "react";
import type { CvConfiguration, MatchResult, UserProfile } from "@/lib/domain/types";
import { TEMPLATES } from "@/lib/cv/templates";
import { skillDisplayName } from "@/lib/skills/taxonomy";
import { updateVariantAction } from "@/app/(admin)/cv/[id]/actions";
const SECTIONS: {
    id: CvConfiguration["includedSections"][number];
    label: string;
}[] = [
    { id: "summary", label: "Summary" },
    { id: "experience", label: "Experience" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
    { id: "education", label: "Education" },
    { id: "certifications", label: "Certifications" },
    { id: "languages", label: "Languages" },
];
export function CvEditor({ variantId, initial, profile, match, }: {
    variantId: string;
    initial: CvConfiguration;
    profile: UserProfile;
    match: MatchResult;
}) {
    const [config, setConfig] = useState<CvConfiguration>(initial);
    const [pending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const expScore = new Map(match.experience.map((s) => [s.id, s]));
    const projScore = new Map(match.projects.map((s) => [s.id, s]));
    const selectedExp = new Map(config.selectedExperience.map((s) => [s.experienceId, s]));
    const selectedProj = new Map(config.selectedProjects.map((s) => [s.projectId, s]));
    const jobSkillIds = new Set(match.requirements.filter((r) => r.status === "matched").map((r) => r.skillId));
    const toggleExperience = (id: string, on: boolean) => setConfig((c) => ({
        ...c,
        selectedExperience: on
            ? [...c.selectedExperience, { experienceId: id, achievementIds: [] }]
            : c.selectedExperience.filter((s) => s.experienceId !== id),
    }));
    const toggleAchievement = (expId: string, achId: string, on: boolean) => setConfig((c) => ({
        ...c,
        selectedExperience: c.selectedExperience.map((s) => s.experienceId === expId
            ? { ...s, achievementIds: on ? [...s.achievementIds, achId] : s.achievementIds.filter((a) => a !== achId) }
            : s),
    }));
    const toggleProject = (id: string, on: boolean) => setConfig((c) => ({
        ...c,
        selectedProjects: on
            ? [...c.selectedProjects, { projectId: id, achievementIds: [] }]
            : c.selectedProjects.filter((s) => s.projectId !== id),
    }));
    const toggleProjectAchievement = (projectId: string, achId: string, on: boolean) => setConfig((c) => ({
        ...c,
        selectedProjects: c.selectedProjects.map((s) => s.projectId === projectId
            ? { ...s, achievementIds: on ? [...s.achievementIds, achId] : s.achievementIds.filter((a) => a !== achId) }
            : s),
    }));
    const toggleSkill = (id: string, on: boolean) => setConfig((c) => ({
        ...c,
        selectedSkills: on ? [...c.selectedSkills, id] : c.selectedSkills.filter((s) => s !== id),
    }));
    const save = () => startTransition(async () => {
        const result = await updateVariantAction(variantId, {
            templateId: config.templateId,
            summary: config.summary,
            selectedExperience: config.selectedExperience,
            selectedProjects: config.selectedProjects,
            selectedSkills: config.selectedSkills,
            includedSections: config.includedSections,
            includedEducation: config.includedEducation,
            includedCertifications: config.includedCertifications,
            includedLanguages: config.includedLanguages,
        });
        setMessage(result.ok ? "Saved — preview updated." : `Error: ${result.error}`);
    });
    const skillCandidates = [...new Set([...config.selectedSkills, ...profile.skills])];
    return (<div className="space-y-4">
      {message && <p role="status" className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm">{message}</p>}

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Template</h2>
        <div className="mt-2 space-y-1">
          {TEMPLATES.map((t) => (<label key={t.id} className="flex cursor-pointer items-start gap-2 text-sm">
              <input type="radio" name="template" checked={config.templateId === t.id} onChange={() => setConfig((c) => ({ ...c, templateId: t.id }))} className="mt-1"/>
              <span>
                <strong>{t.name}</strong>
                <span className="block text-xs text-zinc-500">{t.description}</span>
              </span>
            </label>))}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Summary</h2>
        <textarea rows={4} value={config.summary} onChange={(e) => setConfig((c) => ({ ...c, summary: e.target.value }))} className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"/>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Experience</h2>
        <div className="mt-2 space-y-3">
          {profile.experience.map((exp) => {
            const sel = selectedExp.get(exp.id);
            const scored = expScore.get(exp.id);
            return (<div key={exp.id} className="rounded-md border border-zinc-100 p-2 text-sm">
                <label className="flex cursor-pointer items-start gap-2">
                  <input type="checkbox" checked={!!sel} onChange={(e) => toggleExperience(exp.id, e.target.checked)} className="mt-1"/>
                  <span>
                    <strong>{exp.role} at {exp.company}</strong>
                    {scored && scored.matchedSkills.length > 0 && (<span className="block text-xs text-zinc-500">
                        Matched: {scored.matchedSkills.map(skillDisplayName).join(", ")}
                      </span>)}
                    {scored && scored.matchedSkills.length === 0 && (<span className="block text-xs text-zinc-400">No job skills evidenced</span>)}
                  </span>
                </label>
                {sel && exp.achievements.length > 0 && (<div className="ml-6 mt-1 space-y-1">
                    {exp.achievements.map((a) => (<label key={a.id} className="flex cursor-pointer items-start gap-2 text-xs text-zinc-600">
                        <input type="checkbox" checked={sel.achievementIds.includes(a.id)} onChange={(e) => toggleAchievement(exp.id, a.id, e.target.checked)} className="mt-0.5"/>
                        <span>{a.text}</span>
                      </label>))}
                  </div>)}
              </div>);
        })}
          {profile.experience.length === 0 && <p className="text-xs text-zinc-500">No experience in your profile yet.</p>}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Projects</h2>
        <div className="mt-2 space-y-2">
          {profile.projects.map((p) => {
            const sel = selectedProj.get(p.id);
            const scored = projScore.get(p.id);
            return (<div key={p.id} className="rounded-md border border-zinc-100 p-2 text-sm">
                <label className="flex cursor-pointer items-start gap-2">
                  <input type="checkbox" checked={!!sel} onChange={(e) => toggleProject(p.id, e.target.checked)} className="mt-1"/>
                  <span>
                    <strong>{p.name}</strong>
                    {scored && scored.matchedSkills.length > 0 && (<span className="block text-xs text-zinc-500">
                        Matched: {scored.matchedSkills.map(skillDisplayName).join(", ")}
                      </span>)}
                  </span>
                </label>
                {sel && p.achievements.length > 0 && (<div className="ml-6 mt-1 space-y-1">
                    {p.achievements.map((a) => (<label key={a.id} className="flex cursor-pointer items-start gap-2 text-xs text-zinc-600">
                        <input type="checkbox" checked={sel.achievementIds.includes(a.id)} onChange={(e) => toggleProjectAchievement(p.id, a.id, e.target.checked)} className="mt-0.5"/>
                        <span>{a.text}</span>
                      </label>))}
                  </div>)}
              </div>);
        })}
          {profile.projects.length === 0 && <p className="text-xs text-zinc-500">No projects in your profile yet.</p>}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Skills</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {skillCandidates.map((id) => (<label key={id} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 text-xs">
              <input type="checkbox" checked={config.selectedSkills.includes(id)} onChange={(e) => toggleSkill(id, e.target.checked)}/>
              {skillDisplayName(id)}
              {jobSkillIds.has(id) && <span className="text-emerald-600">✓</span>}
            </label>))}
          {skillCandidates.length === 0 && <p className="text-xs text-zinc-500">No skills yet.</p>}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Sections</h2>
        <div className="mt-2 flex flex-wrap gap-3">
          {SECTIONS.map((s) => (<label key={s.id} className="flex cursor-pointer items-center gap-1.5 text-sm">
              <input type="checkbox" checked={config.includedSections.includes(s.id)} onChange={(e) => setConfig((c) => ({
                ...c,
                includedSections: e.target.checked
                    ? [...c.includedSections, s.id]
                    : c.includedSections.filter((x) => x !== s.id),
            }))}/>
              {s.label}
            </label>))}
        </div>
      </section>

      <button onClick={save} disabled={pending} className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>);
}
