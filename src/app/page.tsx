import type { Metadata } from "next";
import "./portfolio.css";
import { CopyEmail, Reveal, ThemeInitScript, ThemeToggle, TypedRoles } from "@/components/portfolio/chrome";
import { getPortfolioView } from "@/lib/portfolio";
export const metadata: Metadata = {
    title: "Portfolio",
    description: "Portfolio — projects, experience and stack.",
};
export const dynamic = "force-dynamic";
function safeUrl(url: string): string {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "#";
    }
    catch {
        return "#";
    }
}
function safeMailto(email: string): string {
    const e = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? `mailto:${e}` : "#";
}
function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}
export default function PortfolioPage() {
    const view = getPortfolioView();
    if (!view) {
        return (<div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold">Portfolio not published yet</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Add your name plus experience or projects to the master profile to publish this page.
        </p>
      </div>);
    }
    const firstName = view.name.split(/\s+/)[0] ?? view.name;
    const showProjects = view.projects.length > 0;
    return (<>
      <ThemeInitScript />
      <div className="pf">
        <a className="skip-link" href="#pf-main">
          Skip to content
        </a>

        <nav className="pf-nav no-print" aria-label="Primary">
          <div className="nav-inner">
            <div className="logo">
              <a href="#">{firstName.toLowerCase()}@dev</a>
              <span>:~$</span>
            </div>
            <div className="nav-links">
              <a href="#pf-stack">stack</a>
              <a href="#pf-experience">work</a>
              {showProjects && <a href="#pf-projects">projects</a>}
              <a href="#pf-contact">contact</a>
            </div>
            <ThemeToggle />
          </div>
        </nav>

        <main id="pf-main">
          <div className="wrap">
            <header className="hero">
              <div>
                <div>
                  <span className="prompt" aria-hidden="true">
                    $
                  </span>{" "}
                  whoami
                </div>
                <h1>{view.name}</h1>
                <div className="subtitle" aria-hidden="true">
                  <TypedRoles roles={view.roles}/>
                </div>
                <p className="sr-only">{view.title}</p>
                <div className="meta">
                  <b>{view.title}</b>
                  {view.location && (<>
                      <br />
                      <span aria-hidden="true">📍</span> {view.location}
                    </>)}
                  {view.email && (<>
                      <br />
                      <span aria-hidden="true">✉️</span> {view.email}
                    </>)}
                  {view.phone && (<>
                      <br />
                      <span aria-hidden="true">📞</span> {view.phone}
                    </>)}
                </div>
                {view.summary && <p style={{ color: "var(--muted)", maxWidth: "60ch" }}>{view.summary}</p>}
                <div className="cta no-print">
                  {view.website && (<a className="btn secondary" href={safeUrl(view.website)} target="_blank" rel="noopener">
                      website ↗
                    </a>)}
                  {view.github && (<a className="btn secondary" href={safeUrl(view.github)} target="_blank" rel="noopener">
                      github ↗
                    </a>)}
                  {view.linkedin && (<a className="btn secondary" href={safeUrl(view.linkedin)} target="_blank" rel="noopener">
                      linkedin ↗
                    </a>)}
                  {view.email && <CopyEmail email={view.email}/>}
                </div>
              </div>
              <div className="avatar-box">
                <div className="avatar-initials" aria-hidden="true">
                  {initials(view.name)}
                </div>
                <div className="status">{view.title || view.name}</div>
              </div>
            </header>

            {view.skillGroups.length > 0 && (<Reveal id="pf-stack">
                <h2>stack</h2>
                <div>
                  {view.skillGroups.map((g) => (<div key={g.label}>
                      <div className="group-label">{g.label}</div>
                      <div className="tags">
                        {g.skills.map((s) => (<span key={s} className="tag">
                            {s}
                          </span>))}
                      </div>
                    </div>))}
                </div>
              </Reveal>)}

            {view.experience.length > 0 && (<Reveal id="pf-experience">
                <h2>work</h2>
                <div>
                  {view.experience.map((job, i) => (<div key={`${job.company}-${job.role}-${i}`} className="card">
                      {job.period && <span className="period">{job.period}</span>}
                      <h3>{job.role}</h3>
                      <div className="where">
                        @ {job.company}
                        {job.location ? ` · ${job.location}` : ""}
                      </div>
                      {job.description
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, k) => (<p key={k} className="desc">
                            {line}
                          </p>))}
                      {job.bullets.length > 0 && (<ul>
                          {job.bullets.map((b, j) => (<li key={j}>{b}</li>))}
                        </ul>)}
                    </div>))}
                </div>
              </Reveal>)}

            {showProjects && (<Reveal id="pf-projects">
                <h2>projects</h2>
                <div className="proj-grid">
                  {view.projects.map((p) => (<div key={p.name} className="card">
                      <h3>
                        {p.link ? (<a href={safeUrl(p.link)} target="_blank" rel="noopener">
                            {p.name} <span aria-hidden="true">↗</span>
                          </a>) : (p.name)}
                      </h3>
                      {p.role && <div className="where">{p.role}</div>}
                      {p.desc && <p>{p.desc}</p>}
                      {p.stack && <div className="stack">{p.stack}</div>}
                    </div>))}
                </div>
              </Reveal>)}

            {(view.education.length > 0 || view.languages.length > 0) && (<Reveal id="pf-education">
                <h2>education</h2>
                <div>
                  {view.education.map((e, i) => (<div key={`${e.school}-${i}`} className="card">
                      {e.period && <span className="period">{e.period}</span>}
                      <h3>{e.school}</h3>
                      {e.note && <div className="where">{e.note}</div>}
                    </div>))}
                  {view.languages.length > 0 && (<>
                      <div className="group-label">Languages</div>
                      <div className="tags">
                        {view.languages.map((l) => (<span key={l} className="tag">
                            {l}
                          </span>))}
                      </div>
                    </>)}
                </div>
              </Reveal>)}

            {view.certifications.length > 0 && (<Reveal id="pf-certifications">
                <h2>certifications</h2>
                <div>
                  {view.certifications.map((c, i) => (<div key={`${c.name}-${i}`} className="card">
                      {c.year && <span className="period">{c.year}</span>}
                      <h3>{c.name}</h3>
                      {c.issuer && <div className="where">{c.issuer}</div>}
                    </div>))}
                </div>
              </Reveal>)}

            <footer id="pf-contact">
              <div>
                <span className="prompt" aria-hidden="true">
                  $
                </span>{" "}
                cat contact.txt
              </div>
              <div className="links">
                {view.email && <a href={safeMailto(view.email)}>{view.email}</a>}
                {view.phone && <a href={`tel:${view.phone.replace(/\s+/g, "")}`}>{view.phone}</a>}
                {view.website && (<a href={safeUrl(view.website)} target="_blank" rel="noopener">
                    website
                  </a>)}
                {view.github && (<a href={safeUrl(view.github)} target="_blank" rel="noopener">
                    github
                  </a>)}
                {view.linkedin && (<a href={safeUrl(view.linkedin)} target="_blank" rel="noopener">
                    linkedin
                  </a>)}
              </div>
              <div style={{ marginTop: "12px" }}>
                © {new Date().getFullYear()} {view.name} — generated from the TailoredCV master profile.
              </div>
            </footer>
          </div>
        </main>
      </div>
    </>);
}
