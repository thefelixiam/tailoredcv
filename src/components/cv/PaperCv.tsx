import type { ResolvedCv } from "@/lib/domain/types";
import { contactItems, formatRange, hasSection, type ContactItem } from "./shared";
export function PaperCv({ cv }: {
    cv: ResolvedCv;
}) {
    const contacts = contactItems(cv);
    const location = contacts.find((c) => c.kind === "location");
    const links = contacts.filter((c) => c.kind !== "location");
    return (<div className="cv-page bg-white font-sans text-zinc-900">
      <header className="cv-block">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[28px] font-extrabold leading-none tracking-tight">{cv.fullName}</h1>
            {cv.title && <p className="mt-1.5 text-[14px] font-semibold text-[#c2410c]">{cv.title}</p>}
          </div>
          {cv.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cv.photo} alt="" referrerPolicy="no-referrer" className="h-[80px] w-[80px] shrink-0 rounded-full border border-zinc-200 object-cover"/>
          )}
        </div>
        {location && (<p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {location.label}
          </p>)}
        {links.length > 0 && (<div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12px]">
            {links.map((l) => (<span key={l.kind} className="inline-flex items-baseline gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  {linkServiceLabel(l)}
                </span>
                <a href={l.href} className="text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 hover:decoration-zinc-500">
                  {l.label}
                </a>
              </span>))}
          </div>)}
        <div className="mt-2.5 h-0.5 w-12 bg-[#c2410c]"/>
      </header>

      {hasSection(cv, "summary") && cv.summary && (<section className="cv-block mt-4">
          <SectionTitle>Profile</SectionTitle>
          <p className="mt-1.5 max-w-[68ch] text-[12.5px] leading-relaxed text-zinc-700">{cv.summary}</p>
        </section>)}

      {hasSection(cv, "experience") && cv.experience.length > 0 && (<section className="mt-4">
          <SectionTitle>Experience</SectionTitle>
          {cv.experience.map((exp) => (<article key={exp.id} className="cv-block mt-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[13.5px] font-bold">{exp.role} — {exp.company}</h3>
                <p className="text-[11px] text-zinc-500">{formatRange(exp.startDate, exp.endDate)}</p>
              </div>
              {exp.location && <p className="text-[11px] text-zinc-500">{exp.location}</p>}
              {exp.description && <p className="mt-1 max-w-[70ch] text-[12px] leading-relaxed text-zinc-700">{exp.description}</p>}
              {exp.achievements.length > 0 && (<ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[12px] leading-relaxed text-zinc-800">
                  {exp.achievements.map((a) => (<li key={a.id}>{a.text}</li>))}
                </ul>)}
              {exp.technologies.length > 0 && (<p className="mt-1.5 text-[11.5px] text-zinc-500">
                  {exp.technologies.map((t, i) => (<span key={t.id}>
                      {i > 0 && " · "}
                      {t.matched ? (<strong className="text-zinc-800">{t.displayName}</strong>) : (t.displayName)}
                    </span>))}
                </p>)}
            </article>))}
        </section>)}

      {hasSection(cv, "projects") && cv.projects.length > 0 && (<section className="mt-4">
          <SectionTitle>Projects</SectionTitle>
          {cv.projects.map((p) => (<article key={p.id} className="cv-block mt-2">
              <h3 className="text-[13px] font-bold">
                {p.links[0]?.url ? <a href={p.links[0].url}>{p.name}</a> : p.name}
                {p.role && <span className="ml-2 font-normal text-zinc-500">· {p.role}</span>}
              </h3>
              {p.description && <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-700">{p.description}</p>}
              {p.achievements.length > 0 && (<ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px] text-zinc-800">
                  {p.achievements.map((a) => (<li key={a.id}>{a.text}</li>))}
                </ul>)}
              {p.technologies.length > 0 && (<p className="mt-1 text-[11.5px] text-zinc-500">
                  {p.technologies.map((t, i) => (<span key={t.id}>
                      {i > 0 && " · "}
                      {t.matched ? (<strong className="text-zinc-800">{t.displayName}</strong>) : (t.displayName)}
                    </span>))}
                </p>)}
            </article>))}
        </section>)}

      {hasSection(cv, "skills") && cv.skills.length > 0 && (<section className="mt-4">
          <SectionTitle>Skills</SectionTitle>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-zinc-600">
            {cv.skills.map((s, i) => (<span key={s.id}>
                {i > 0 && " · "}
                {s.matched ? <strong className="text-zinc-900">{s.displayName}</strong> : s.displayName}
              </span>))}
          </p>
        </section>)}

      {hasSection(cv, "education") && cv.education.length > 0 && (<section className="mt-4">
          <SectionTitle>Education</SectionTitle>
          <ul className="mt-1.5 space-y-1 text-[12.5px]">
            {cv.education.map((e) => (<li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  <strong>{e.school}</strong>
                  {(e.degree || e.field) && <span className="text-zinc-600"> — {[e.degree, e.field].filter(Boolean).join(", ")}</span>}
                </span>
                {(e.startYear || e.endYear) && (<span className="text-[11px] text-zinc-500">{[e.startYear, e.endYear].filter(Boolean).join(" — ")}</span>)}
              </li>))}
          </ul>
        </section>)}

      {hasSection(cv, "certifications") && cv.certifications.length > 0 && (<section className="mt-4">
          <SectionTitle>Certifications</SectionTitle>
          <ul className="mt-1.5 space-y-0.5 text-[12.5px]">
            {cv.certifications.map((c) => (<li key={c.id}>
                <strong>{c.name}</strong>
                {c.issuer && <span className="text-zinc-600"> — {c.issuer}</span>}
                {c.year && <span className="text-zinc-500"> ({c.year})</span>}
              </li>))}
          </ul>
        </section>)}

      {hasSection(cv, "languages") && cv.languages.length > 0 && (<section className="mt-4">
          <SectionTitle>Languages</SectionTitle>
          <p className="mt-1.5 text-[12.5px]">{cv.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(" · ")}</p>
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
    return (<h2 className="border-b border-zinc-200 pb-1 text-[12px] font-bold uppercase tracking-[0.14em] text-zinc-900">
      {children}
    </h2>);
}
