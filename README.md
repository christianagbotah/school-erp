# School ERP — iEduPro

**Product:** iEduPro · **Project:** School ERP · **Owner:** Lightworld Technologies Ltd., Ghana
**Target repository:** https://github.com/christianagbotah/school-erp.git
**Research checkpoint:** 29 October 2026 (Africa/Accra)

A complete, offline-first school management platform for Ghanaian basic schools —
crèche, nursery, kindergarten, primary and JHS (Basic 1–9) — built as a greenfield
project with its own schema, design system, tests and documentation.

## What is implemented and verified (this milestone)

| Area | Status | Evidence |
|---|---|---|
| Multi-tenant data model (control plane + tenant plane, 50+ tables) | **Implemented** | `prisma/schema.prisma` |
| Auth: scrypt password hashing, server sessions, role memberships | **Implemented + tested** | `tests/api.test.ts` (auth cases) |
| Role-based portals (headteacher, teacher, cashier, bursar, parent, student, proprietor) | **Implemented + browser-verified** | Single-page portal at `/` |
| Students, guardians, enrollment, classes, stages (NaCCA KG1–B9) | **Implemented + seeded** (205 students) | `scripts/seed.ts` |
| Attendance: daily register, 6 Ghana statuses, correction history | **Implemented + tested** | API + UI |
| Offline-first: service worker shell, cached reads, durable outbox, idempotent sync, visible conflicts | **Implemented + browser-verified** (offline → queue → sync → conflict review) | `public/sw.js`, `src/lib/client-sync.ts` |
| Fee engine: applicability inheritance (school→category→class→student), invoice generation with duplicate prevention, discounts with exact remainder allocation | **Implemented + tested** (pure-logic tests) | `src/lib/fee-engine.ts`, `tests/domain.test.ts` |
| Payments & cashier: posting, allocation with overpayment protection, offline receipts with idempotency keys, collision-safe refs | **Implemented + tested + browser-verified** (₵940 receipt → balanced journal) | `src/app/api/fees/payments` |
| Double-entry accounting: immutable balanced journals, GL accounts, posted evidence | **Implemented + verified** (Dr 1000 / Cr 1100) | `postJournal()` |
| SBA gradebook: profiles (KG observation / primary / JHS CCP), raw marks, weighted totals, missing/absent/exempt distinction, published-marks protection | **Implemented + tested** | `/api/marks` |
| KG observation records (no exam percentages for early years) | **Implemented + seeded** | `KgObservation` model |
| Transport: vehicles, routes, stops, enrollment, trips | **Implemented + seeded** | schema + seed |
| Payroll: versioned Ghana rule pack (SSNIT 13%/5%/5%, GRA PAYE bands) | **Implemented (rule pack + computation, tested); pay-run workflow = next phase** | `ghana-config.ts` |
| Ghana education config: stages, subjects, BECE flag distinctions, phone normalization, ₵ formatting | **Implemented** | `src/lib/ghana-config.ts`, `src/lib/money.ts` |
| PWA: manifest, icons, installable, offline badge | **Implemented** | `public/manifest.webmanifest` |

## Honest status of NOT-yet-implemented scope (from the master brief)

These are **planned, not claimed as done**: examination administration UI (models exist),
report card generation, transport conductor app, inventory/procurement, library, canteen,
full payroll pay-run workflow, communications providers (SMS/email adapters), the 1,001
website templates, native Flutter clients, LAN/edge server deployment, AI features,
waived/refunded daily-service states, arrears reminders, timetabling engine, admissions
workflow UI, HR leave management, bank reconciliation, and full Hubtel integration
(merchant credentials not available in this environment — explicitly BLOCKED, not faked).

See `docs/REQUIREMENTS-MATRIX.md` for the traceability matrix with per-module states.

## Run it

```bash
bun install
bun run db:push          # apply schema
bunx tsx scripts/seed.ts # demo school (fabricated data, no real records)
bun run dev              # http://localhost:3000
bun test tests/domain.test.ts tests/api.test.ts   # 29 tests
bun run lint
```

### Demo accounts (password `Demo1234!`)

| Role | Email |
|---|---|
| Headteacher | head@lightworld.edu.gh |
| Academic head | academics@lightworld.edu.gh |
| Teacher | teacher@lightworld.edu.gh |
| Bursar | bursar@lightworld.edu.gh |
| Cashier | cashier@lightworld.edu.gh |
| Parent (Kwabena Frimpong → ward Kofi Frimpong) | parent@lightworld.edu.gh |
| Student (Kofi Frimpong) | student@lightworld.edu.gh |
| Proprietor | proprietor@lightworld.edu.gh |
| Platform operator | admin@lightworldtech.com |

## Architecture (see `docs/ARCHITECTURE.md`)

- **Next.js 16 App Router** single-page portal at `/` (sandbox exposes one route) with versioned JSON APIs under `/api/*`
- **Prisma + SQLite** in this environment; every tenant-plane table carries `tenantId` and all queries are membership-scoped (dedicated-database-per-tenant is the production design — registry model `Tenant.dbAssignment` is in place)
- **Money**: integer pesewas everywhere; ₵ display; exact remainder allocation
- **Offline**: SW app shell + `cachedFetch` reads + durable localStorage outbox + operation-ID idempotency + domain conflict rules (attendance conflicts surfaced, never LWW)
- **Accounting**: immutable balanced journal entries; posting failures never roll back captured money

## Repository status

Work is committed locally on `main` (7 commits at this milestone). The target GitHub
repository exists but is **empty**, and this environment has **no push credentials**
(no SSH keys, no tokens). Per the master brief §2, work continued locally with a
complete source package rather than pushing elsewhere or fabricating a remote SHA.
See `docs/GITHUB-PUSH.md` for the exact owner procedure to publish these commits.
