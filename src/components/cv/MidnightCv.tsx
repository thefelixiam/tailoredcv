import type { ResolvedCv } from "@/lib/domain/types";
import { contactItems, formatRange, hasSection, type ContactItem } from "./shared";
export function MidnightCv({ cv }: {
    cv: ResolvedCv;
}) {
    const contacts = contactItems(cv);
    const location = contacts.find((c) => c.kind === "location");
    const links = contacts.filter((c) => c.kind !== "location");
    return (<div className="cv-page bg-[#0c1424] font-sans text-white">
      
      <header className="cv-block">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[28px] font-extrabold leading-none tracking-tight">{cv.fullName}</h1>
            {cv.title && <p className="mt-1.5 text-[15px] font-semibold tracking-wide text-[#ff6b4a]">{cv.title}</p>}
          </div>
          {cv.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cv.photo} alt="" referrerPolicy="no-referrer" className="h-[80px] w-[80px] shrink-0 rounded-full border border-white/20 object-cover"/>
          ) : (<div className="mt-1 hidden shrink-0 grid-cols-2 gap-1.5 sm:grid" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (<span key={i} className={`block h-2.5 w-2.5 ${i === 0 ? "bg-[#ff6b4a]" : "border border-white/25"}`}/>))}
            </div>)}
        </div>
        {location && (<p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {location.label}
          </p>)}
        {links.length > 0 && (<div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12px]">
            {links.map((l) => (<span key={l.kind} className="inline-flex items-baseline gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {linkServiceLabel(l)}
                </span>
                <a href={l.href} className="text-slate-200 underline decoration-slate-700 underline-offset-4 hover:text-white hover:decoration-slate-400">
                  {l.label}
                </a>
              </span>))}
          </div>)}
        <div className="mt-3 h-px bg-white/10"/>
      </header>

      {hasSection(cv, "summary") && cv.summary && (<section className="cv-block mt-4">
          <SectionTitle>Profile</SectionTitle>
          <p className="mt-2 max-w-[62ch] text-[12.5px] leading-relaxed text-slate-300">{cv.summary}</p>
        </section>)}

      {hasSection(cv, "experience") && cv.experience.length > 0 && (<section className="mt-4">
          <SectionTitle>Experience</SectionTitle>
          <div className="mt-1">
            {cv.experience.map((exp) => (<article key={exp.id} className="cv-block border-b border-white/10 py-3 last:border-b-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[14px] font-bold">
                    {exp.role} <span className="font-normal text-slate-400">@ {exp.company}</span>
                  </h3>
                  <p className="text-[11px] tracking-wide text-slate-400">{formatRange(exp.startDate, exp.endDate)}</p>
                </div>
                {exp.location && <p className="mt-0.5 text-[11px] text-slate-400">{exp.location}</p>}
                {exp.description && <p className="mt-1.5 max-w-[68ch] text-[12px] leading-relaxed text-slate-300">{exp.description}</p>}
                {exp.achievements.length > 0 && (<ul className="mt-2 space-y-1">
                    {exp.achievements.map((a) => (<li key={a.id} className="flex gap-2 text-[12px] leading-relaxed text-slate-200">
                        <span className="mt-[7px] h-1 w-1 shrink-0 bg-[#ff6b4a]" aria-hidden="true"/>
                        <span>{a.text}</span>
                      </li>))}
                  </ul>)}
                {exp.technologies.length > 0 && (<div className="mt-2 flex flex-wrap gap-1.5">
                    {exp.technologies.map((t) => (<TechPill key={t.id} dimmed={!t.matched}>{t.displayName}</TechPill>))}
                  </div>)}
              </article>))}
          </div>
        </section>)}

      {hasSection(cv, "projects") && cv.projects.length > 0 && (<section className="mt-4">
          <SectionTitle>Projects</SectionTitle>
          <div className="mt-2 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {cv.projects.map((p) => (<article key={p.id} className="cv-block">
                <h3 className="text-[13px] font-bold">
                  {p.links[0]?.url ? (<a href={p.links[0].url} className="hover:text-[#ff6b4a]">{p.name}</a>) : (p.name)}
                  {p.role && <span className="ml-2 font-normal text-slate-400">· {p.role}</span>}
                </h3>
                {p.description && <p className="mt-1 text-[12px] leading-relaxed text-slate-300">{p.description}</p>}
                {p.achievements.length > 0 && (<ul className="mt-1.5 space-y-1">
                    {p.achievements.map((a) => (<li key={a.id} className="flex gap-2 text-[12px] leading-relaxed text-slate-200">
                        <span className="mt-[7px] h-1 w-1 shrink-0 bg-[#ff6b4a]" aria-hidden="true"/>
                        <span>{a.text}</span>
                      </li>))}
                  </ul>)}
                {p.technologies.length > 0 && (<div className="mt-2 flex flex-wrap gap-1.5">
                    {p.technologies.map((t) => (<TechPill key={t.id} dimmed={!t.matched}>{t.displayName}</TechPill>))}
                  </div>)}
              </article>))}
          </div>
        </section>)}

      {hasSection(cv, "skills") && cv.skills.length > 0 && (<section className="mt-4">
          <SectionTitle>Skills</SectionTitle>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cv.skills.map((s) => (<TechPill key={s.id} accent={s.matched}>{s.displayName}</TechPill>))}
          </div>
        </section>)}

      {hasSection(cv, "education") && cv.education.length > 0 && (<section className="mt-4">
          <SectionTitle>Education</SectionTitle>
          <ul className="mt-2 space-y-1.5">
            {cv.education.map((e) => (<li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 text-[12.5px]">
                <span>
                  <strong>{e.school}</strong>
                  {(e.degree || e.field) && <span className="text-slate-400"> — {[e.degree, e.field].filter(Boolean).join(", ")}</span>}
                </span>
                {(e.startYear || e.endYear) && (<span className="text-[11px] text-slate-400">{[e.startYear, e.endYear].filter(Boolean).join(" — ")}</span>)}
              </li>))}
          </ul>
        </section>)}

      {hasSection(cv, "certifications") && cv.certifications.length > 0 && (<section className="mt-4">
          <SectionTitle>Certifications</SectionTitle>
          <ul className="mt-2 space-y-1 text-[12.5px] text-slate-200">
            {cv.certifications.map((c) => (<li key={c.id}>
                <strong>{c.name}</strong>
                {c.issuer && <span className="text-slate-400"> — {c.issuer}</span>}
                {c.year && <span className="text-slate-400"> ({c.year})</span>}
              </li>))}
          </ul>
        </section>)}

      {hasSection(cv, "languages") && cv.languages.length > 0 && (<section className="mt-4">
          <SectionTitle>Languages</SectionTitle>
          <p className="mt-2 text-[12.5px] text-slate-200">
            {cv.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(" · ")}
          </p>
        </section>)}
    </div>);
}
function linkServiceLabel(l: ContactItem): string {
    switch (l.kind) {
        case "email":
            return "Email";
        case "phone":
            return "Phone";
        case "website":
            return "Web";
        case "github":
            return "GitHub";
        case "linkedin":
            return "LinkedIn";
        default:
            return "";
    }
}
function SectionTitle({ children }: {
    children: React.ReactNode;
}) {
    return (<h2 className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.18em] text-[#ff6b4a]">
      {children}
      <span className="h-px flex-1 bg-white/10" aria-hidden="true"/>
    </h2>);
}
function TechPill({ children, accent, dimmed }: {
    children: React.ReactNode;
    accent?: boolean;
    dimmed?: boolean;
}) {
    return (<span className={`rounded-sm border px-2 py-0.5 text-[11px] leading-relaxed ${accent ? "border-[#ff6b4a]/60 text-[#ffb59f]" : "border-white/15 text-slate-300"} ${dimmed ? "opacity-60" : ""}`}>
      {children}
    </span>);
}
