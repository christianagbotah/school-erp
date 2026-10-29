# Publishing This Workspace to github.com/christianagbotah/school-erp

## Current state

- The repository receives direct pushes from this workspace on `main`
  (credentials provided by the owner on 30 October 2026 — see git history).
- Commit convention: conventional commits (`feat:`, `fix:`, `docs:`, …) with
  scope tags (`feat(payroll):`, `fix(security):` …).

## Security notes for the owner

- If a personal access token was shared to enable these pushes, rotate it after
  initial setup and replace it with a fine-grained token scoped to **only this
  repository** with **Contents: Read and write** (or add a collaborator account).
- Never paste tokens into chat or source files. This workspace stores the
  credential in the local git remote config only — it is never committed to
  the repository.

## How the owner publishes / pulls

```bash
git clone https://github.com/christianagbotah/school-erp.git
cd school-erp
bun install
bun run db:push
bunx tsx scripts/seed.ts
bunx tsx scripts/seed-extras.ts   # salaries, timetables, SBA marks, notifications
bun run dev                       # http://localhost:3000
bun test tests/domain.test.ts tests/api.test.ts   # 33/33 passing (server must be up)
```

## Reproducibility on a fresh clone

Same as above — the main seed resets demo data; `seed-extras` enriches
incrementally and is safe to re-run.
