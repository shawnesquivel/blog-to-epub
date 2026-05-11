# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 16 application (frontend + API in one process). No database, Docker, or external services required.

### Key commands

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Build | `npm run build` |
| Type check | `npx tsc --noEmit` |

### Non-obvious notes

- **Lint**: Next.js 16 removed the `next lint` subcommand. The `npm run lint` script in `package.json` still references it but will fail. Use `npx tsc --noEmit` for type checking instead.
- **No `.env` needed**: The app has zero secrets or environment variables. It fetches articles from public URLs at runtime.
- **API test**: `curl -X POST http://localhost:3000/api/convert -H "Content-Type: application/json" -d '{"url":"https://example.com/article"}'` returns an EPUB binary.
- **Turbopack**: Dev server uses Turbopack by default (configured in `next.config.ts`).
- The `python_backend/` directory and root `requirements.txt` are legacy/reference only — not needed for the active app.
