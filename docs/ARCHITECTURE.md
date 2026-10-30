# iEduPro Architecture Record

Greenfield architecture for the School ERP project. Decisions follow the master brief
(§5: "a practical starting recommendation; improve or replace components when research
demonstrates a better fit, documenting the decision").

## ADR-001 — Application platform: Next.js 16 App Router (full-stack)

**Decision.** One TypeScript application — Next.js 16 App Router — providing both the
role-based web portal (single-page client at `/`) and the versioned JSON API
(`/api/*`), sharing types, validation and domain libraries.

**Why not NestJS + separate frontend (brief's suggested starting point).** The execution
environment runs a single Next.js service on one port with one exposed route; a second
process (NestJS) cannot be deployed here. Keeping one deployable preserves the brief's
actual requirements — explicit domain boundaries, a versioned API, typed data access —
which are enforced through the module layout: `src/lib/*` (domain), `src/app/api/*`
(interface), `src/components/views/*` (presentation). A future split to a standalone
API service is mechanical: domain libraries are framework-free (Prisma + pure
functions) except the thin route handlers.

**Consequences.** Vertical slices ship faster; one process to secure, back up and
monitor. API versioning starts at `/api` (v1 implicit); breaking changes will move to
`/api/v1/*` before the first external consumer.

## ADR-002 — Storage: Prisma + SQLite here; PostgreSQL per-tenant in production

**Decision.** The schema is written against Prisma with SQLite for this environment,
with two planes:

- **Control plane** — `Tenant` (with `dbAssignment` = the authoritative
  tenant→database registry), `User`, `Membership` (role + scope), `Session`, `AuditLog`.
- **Tenant plane** — every operational model carries `tenantId`; isolation is enforced
  in every query by deriving allowed tenant IDs from authenticated memberships
  (never from a client-supplied `tenant_id`).

**Production design (per brief §4).** One dedicated operational PostgreSQL database per
customer/school-group tenant; branches share the customer's database with
campus/class/assignment scopes. The `dbAssignment` registry field and per-table
`tenantId` keys make that migration a routing change (per-tenant `PrismaClient`
instantiation) rather than a schema rewrite.

**Consequences.** The demo is fully functional today and the isolation logic
(membership-derived scoping, tested adversarially in `tests/api.test.ts`) carries over
verbatim. PostgreSQL RLS will be layered as defence-in-depth when the production
database tier is stood up.

## ADR-003 — Money: integer pesewas, no floats

All amounts are integer minor units (pesewas). Formatting is display-only
(`src/lib/money.ts`). Invoice-wide discounts allocate across lines with largest-remainder
distribution so Σ(line discounts) == policy amount, exactly (tested). Weighted SBA
totals compute in integer space. Posting amount mismatches are impossible by
construction between parse and storage.

## ADR-004 — Offline-first: app shell SW + cached reads + durable outbox

**Decision.** Three layers, all demonstrated end-to-end in the browser:

1. **Reads** — `cachedFetch`: network-first with a 7-day localStorage cache; teachers
   see previously downloaded rosters/classes offline.
2. **Writes** — durable outbox (Zustand persisted to localStorage): every offline
   capture gets a UUID operation id; the queue survives reloads.
3. **Sync** — `/api/sync/push` is at-least-once with idempotent application
   (operation id = idempotency key → duplicates return the original result);
   `/api/sync/pull` is an ordered change feed with an explicit cursor the client
   advances only after durable local application.

**Conflict rules are domain-specific (per brief §6/§7).** Attendance: competing
authorized edits are returned as visible `conflict` results with both values and stay
in the outbox for review — never last-write-wins (tested + browser-verified).
Payments: posted entries are immutable; an offline receipt number maps to exactly one
payment; duplicate pushes return the original, never a second posting (tested).
Replayed authority is checked server-side on every operation (a cashier pushing an
attendance op is `rejected`, tested).

**Honest limitations.** localStorage is not the encrypted native database the brief
requires for production clients; a Flutter/SQLite client with OS-keystore protection is
the production path (planned). Reconnection sync is foreground-driven (the brief
itself notes browser background execution cannot be relied on).

## ADR-005 — Accounting: double-entry from day one

`postJournal()` writes immutable balanced entries (Dr Σ == Cr Σ enforced; rejected
otherwise) with source-module references (e.g. `payment:<id>`) and GL accounts seeded
per school (1000 Cash, 1010 Bank, 1020 MoMo, 1100 Fees Receivable, 4001 Tuition
Revenue …). Fee payments post Dr cash-method account / Cr fees receivable — cash
collected is not fabricated as revenue. Period locks, bank reconciliation and the
full chart-of-accounts maintenance UI are planned next-phase work.

**Accrual completion (30 Oct 2026).** `postJournalOn(tx, …)` allows journaling
inside a caller's transaction. Invoice generation now posts the accrual entry
atomically with each invoice (Dr 1100 Accounts Receivable / Cr revenue accounts
from `FeeItem.revenueAccountCode`, seeded 4001 tuition / 4002 other), so revenue
exists in the ledger when earned, not when cash arrives. Offline-synced payments
post the same entries as the online cashier route (Dr cash-method / Cr 1100),
keeping the GL complete for disconnected collections. Financial statements
(`src/lib/finance-reports.ts`, pure logic) derive the trial balance, income
statement and balance sheet strictly from **posted** entries: draft and reversed
journals never appear, the trial balance exposes out-of-balance ledgers honestly,
and the balance sheet carries the current-year surplus (revenue less expenses to
date) inside equity — A = L + E is asserted in tests and browser-verified.

## ADR-006 — Assessment: profiles preserve provenance; early years never get exams

Assessment profiles carry `provenance` (`official_nacca | official_waec | school`) and
versioned component weights. KG defaults to observation records (`KgObservation`) —
no exam percentages for early years, per NaCCA KG guidance. Raw marks are preserved
with `maxScore`; `status` distinguishes missing/absent/exempt/incomplete from a genuine
zero; published marks reject silent overwrite (tested). WAEC BECE 30/70 continuous/
external weighting is recorded as reference in the profile notes and is deliberately
NOT applied to internal term reports.

## ADR-007 — Identity: global users, tenant-scoped memberships

Users exist in the control plane; roles are granted per tenant with scope
(school/campus/class/student/route/till). A phone number or email never implies
access to another tenant (tested via parent scoping: a parent searching sees only
linked wards — exactly one student — never the directory). Guardian links carry
separate flags for legal relationship, billing responsibility, portal access and
pickup authority.

## Security posture

- scrypt password hashing (no plaintext, no reversible storage)
- httpOnly session cookies, 7-day expiry, server-side revocation on logout
- every API route derives allowed tenant IDs from authenticated memberships and
  403s cross-tenant ids (tested)
- role checks per route (`requireRole`), authority re-checked on every offline replay
- audit log on attendance marking/correction, invoice generation and payment posting
  (before/after JSON, actor, reason)
- unbalanced journals rejected; allocation cannot exceed payment or invoice totals
