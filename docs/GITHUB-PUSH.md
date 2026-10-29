# Publishing This Workspace to github.com/christianagbotah/school-erp

## Current state (honest)

- The target repository `https://github.com/christianagbotah/school-erp.git` **exists and is empty** (verified: `git ls-remote` returns no refs; the web page shows "This repository is empty").
- This development environment has **no write credentials** for that repository:
  - No SSH keys present (`~/.ssh` does not exist; `ssh` binary not available).
  - No GitHub token in the environment.
  - HTTPS push therefore fails authentication.
- Per the master brief §2: work continued locally, commits preserved, and **no push
  was made elsewhere and no remote SHA is claimed**.

## Local commit history (this milestone)

All commits are on branch `main` in this workspace:

```
fb0603c fix(marks): primary assessment profiles match upper+lower primary stages; matrix evidence update
3d88e07 docs: README, architecture record (ADRs), requirements traceability matrix, GitHub push instructions
d0a8d40 fix(security+finance): parent/student scoping on search (isolation gap found by tests), collision-safe payment refs under concurrency, demo family naming; 29 tests passing
9efcb7c feat(offline): PWA service worker shell, cached reads, offline auth continuation; end-to-end verified: offline capture → durable outbox → sync → visible domain conflicts; cashier payment posts balanced double-entry journal
35c65da feat(ui): role-based SPA portal — login, dashboards, attendance register with offline queue, SBA gradebook, cashier collections with offline receipts, fees, students, sync console
3a18cef feat(api): tenancy-scoped domain APIs + offline sync push/pull with idempotency and domain conflict rules; Ghana config pack; money utils; fee engine
38cbbf1 feat(schema): complete iEduPro domain schema — control plane, tenancy, academics, fees, finance, assessment, transport, HR, sync
9750e49 Initial commit

```

## How the owner publishes (5 minutes)

1. Open this workspace and download the **source package**:
   `download/school-erp-source.zip` (with `SHA256SUMS.txt`).
2. Unzip it on your own machine:
   ```bash
   unzip school-erp-source.zip -d school-erp
   cd school-erp
   ```
3. Point it at the required repository and push:
   ```bash
   git remote add origin https://github.com/christianagbotah/school-erp.git
   git push -u origin main          # or: git push -u origin master
   ```
   You will authenticate with your GitHub credentials (PAT/credential helper).
4. Verify the remote head:
   ```bash
   git ls-remote origin | head
   # copy the reported SHA here as the published checkpoint
   ```

## Alternative: add Z.ai as a collaborator

If you want this environment to push directly in future sessions:
1. GitHub → the repository → Settings → Collaborators → add the account your Z.ai
   workspace authenticates as, **or**
2. Provide a fine-grained personal access token scoped to **only this repository**
   with **Contents: Read and write** through the workspace's secret mechanism.
   Never paste tokens into chat or source files.

## Reproducibility on a fresh clone

```bash
bun install
bun run db:push
bunx tsx scripts/seed.ts
bun run dev
bun test tests/domain.test.ts tests/api.test.ts   # 29/29 passing
```
