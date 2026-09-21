"use client";
import { useEffect, useRef, useState } from "react";
const THEME_KEY = "ta-theme";
function currentTheme(): "light" | "dark" {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
export function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    useEffect(() => {
        setTheme(currentTheme());
    }, []);
    const toggle = () => {
        const next = currentTheme() === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
            localStorage.setItem(THEME_KEY, next);
        }
        catch {
        }
        setTheme(next);
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "light" ? "#f7f5f0" : "#0d1117");
    };
    return (<button className="btn secondary" type="button" style={{ marginLeft: "auto" }} aria-pressed={theme === "light"} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} title="Toggle dark / light theme" onClick={toggle}>
      {theme === "dark" ? "☀ light" : "☾ dark"}
    </button>);
}
export function ThemeInitScript() {
    return (<script dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("ta-theme");if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="dark";}`,
        }}/>);
}
export function TypedRoles({ roles }: {
    roles: string[];
}) {
    const [text, setText] = useState("");
    useEffect(() => {
        if (roles.length === 0)
            return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setText(roles[0]);
            return;
        }
        let ri = 0;
        let ci = 0;
        let del = false;
        let timer: ReturnType<typeof setTimeout>;
        const tick = () => {
            const word = roles[ri];
            setText(word.slice(0, ci));
            if (!del && ci < word.length) {
                ci++;
                timer = setTimeout(tick, 55);
            }
            else if (!del) {
                del = true;
                timer = setTimeout(tick, 1400);
            }
            else if (ci > 0) {
                ci--;
                timer = setTimeout(tick, 28);
            }
            else {
                del = false;
                ri = (ri + 1) % roles.length;
                timer = setTimeout(tick, 300);
            }
        };
        timer = setTimeout(tick, 0);
        return () => clearTimeout(timer);
    }, [roles]);
    return (<>
      <span>{text}</span>
      <span className="caret" aria-hidden="true"/>
    </>);
}
export function Reveal({ id, children }: {
    id?: string;
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        if (!("IntersectionObserver" in window)) {
            el.classList.add("visible");
            return;
        }
        const io = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    io.unobserve(entry.target);
                }
            }
        }, { threshold: 0.12 });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return (<section id={id} ref={ref} className="reveal">
      {children}
    </section>);
}
export function CopyEmail({ email }: {
    email: string;
}) {
    const [toast, setToast] = useState<string | null>(null);
    useEffect(() => {
        if (!toast)
            return;
        const t = setTimeout(() => setToast(null), 2200);
        return () => clearTimeout(t);
    }, [toast]);
    const copy = () => {
        const done = () => setToast("email copied: " + email);
        const fallback = () => {
            try {
                const ta = document.createElement("textarea");
                ta.value = email;
                ta.setAttribute("readonly", "");
                ta.style.position = "absolute";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                ta.remove();
                done();
            }
            catch {
                setToast(email);
            }
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(email).then(done).catch(fallback);
        }
        else {
            fallback();
        }
    };
    return (<>
      <button className="btn secondary" type="button" onClick={copy}>
        copy email
      </button>
      <span className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">
        {toast}
      </span>
    </>);
}
