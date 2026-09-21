# TailoredCV

Public portfolio plus job-specific CVs, generated from one master profile. The profile is the source of truth: the app selects and prioritizes your real experience per job description — it never invents facts.

## Quickstart

```bash
npm install
npm run dev      # http://localhost:3000
```

Open the app, create an account, fill in your profile, paste a job description, review the match, generate the CV, download the A4 PDF. Your public portfolio lives at `/`.

## Scripts

| Command            | What it does                              |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Start the dev server                      |
| `npm run build`    | Production build                          |
| `npm run start`    | Serve the production build                |
| `npm run test`     | Run the vitest suite                      |
| `npm run typecheck`| TypeScript check                          |
| `npm run lint`     | ESLint                                     |

## Configuration (all optional)

Copy `.env.example` to `.env` to override defaults:

| Variable               | Default                    | What it does                              |
| ---------------------- | -------------------------- | ----------------------------------------- |
| `CV_TAILOR_DATA_DIR`   | `./data`                   | SQLite directory (auto-created)           |
| `APP_URL`              | request origin (localhost) | Base URL for PDF rendering in production  |
| `PORTFOLIO_USER_EMAIL` | earliest user              | Whose profile the public portfolio shows  |
| `OLLAMA_ENABLED`       | unset (off)                | `true` enables Ollama job analysis        |
| `OLLAMA_HOST`          | `http://localhost:11434`   | Ollama server address                     |
| `OLLAMA_MODEL`         | `llama3.1`                 | Model for job analysis                    |
| `SEED_PASSWORD`        | random, printed            | Demo password for `npm run seed`          |

Job analysis is deterministic by default and stays working with zero setup. Ollama, when enabled and reachable, proposes taxonomy-grounded requirements with automatic fallback to the deterministic parser.

## Data

SQLite lives in `./data/` (gitignored). Nothing leaves your machine unless you enable Ollama (local) — there are no cloud calls, no tracking, no accounts beyond your own login.
