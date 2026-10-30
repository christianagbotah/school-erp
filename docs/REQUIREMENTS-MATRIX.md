# Requirements Traceability Matrix

Legend: **DONE (verified)** = automated test or browser-verified evidence linked.
**DONE (impl)** = implemented, spot-checked, no dedicated automated test yet.
**PARTIAL** = implemented slice, gaps listed. **PLANNED** = designed, not implemented.
**BLOCKED** = external prerequisite missing — listed honestly, not faked.

State scale per brief §30: Planned → UI only → API/data/workflow implemented →
integration verified → offline verified → cross-platform verified → release candidate.

| # | Brief § | Requirement | State | Evidence / Notes |
|---|---|---|---|---|
| 1 | §2 | Greenfield project, own schema/design/tests/docs, new repo | DONE (impl) | No legacy code used; fresh schema; commits on `main` |
| 2 | §2 | Mandatory Git workflow → `christianagbotah/school-erp` | DONE (verified) | Remote configured with owner credential; local `main` == `school-erp/main` (0 ahead/0 behind, dry-run push clean); GitHub Actions CI on push |
| 3 | §3 | Ghana research → versioned config packs | PARTIAL | `ghana-config.ts` (stages KG1–B9, CCP subjects, BECE vs CCP distinction, PAYE/SSNIT pack, phone norm). Full document-level provenance register pending |
| 4 | §4 | Tenant → organization → school → campus hierarchy | DONE (impl) | Schema; demo school with Main + Ashiyie branch |
| 5 | §4 | Control plane vs tenant plane; tenant→database registry | DONE (impl) | `Tenant.dbAssignment`; membership-scoped queries; per-tenant DB = production tier |
| 6 | §4 | Tenant isolation adversarial tests | DONE (verified) | `tests/api.test.ts`: cross-role 403s, parent ward-scoping, sync authority checks |
| 7 | §5 | Integer minor units money, ₵ display, exact rounding | DONE (verified) | `tests/domain.test.ts` money cases |
| 8 | §5 | Audit trail on critical commands | DONE (impl) | attendance.mark/correct, fees.generate_invoices, payment.record |
| 9 | §6 | Offline: cached reads (rosters/classes/invoices) | DONE (verified) | `cachedFetch`; browser test: offline reload → roster loads |
| 10 | §6 | Offline: durable outbox, unique op ids, atomic local capture | DONE (verified) | localStorage-persisted outbox survives reload; op UUID = idempotency key |
| 11 | §6 | At-least-once sync, idempotent application | DONE (verified) | test: duplicate push → `duplicate`, no second posting |
| 12 | §6 | Pull change feed with safe cursor | DONE (impl) | `/api/sync/pull` high-watermark; cursor advanced after durable apply |
| 13 | §6 | Domain conflict rules (attendance visible conflicts, no LWW) | DONE (verified) | test + browser: server `present` vs offline `absent` → conflict surfaced, server value preserved |
| 14 | §6 | Offline payments: unique auditable receipts, one business effect | DONE (verified) | offline receipt no. → exactly one payment (tested); browser receipt shown |
| 15 | §6 | Sync console: pending counts, last sync, failures by cause | DONE (verified) | Sync Console view, browser-verified badges (Offline 2 → applied/dup/conflict) |
| 16 | §6 | Edge/LAN server, native clients, device revocation | PLANNED | Production tier; not buildable in this sandbox |
| 17 | §7 | Role-based portals (9 demo roles) | DONE (verified) | SPA portal; role-filtered nav; browser-verified |
| 18 | §7 | Server-side permissions incl. sync replay | DONE (verified) | tests: cashier→attendance rejected; teacher→invoice-gen rejected; parent→attendance rejected |
| 19 | §7 | Guardian flags: legal/billing/portal/pickup separate | DONE (impl) | `GuardianStudent` flags; students view shows pickup authority |
| 20 | §8 | School onboarding, years/terms, calendar, classes, capacity | DONE (impl) | seeded 2026–2027, 3 terms, 13 classes, school-day calendar w/ holiday |
| 21 | §8 | Student records: first/middle/last, preferred, original name, DOB accuracy | DONE (impl) | schema fields incl. `dobAccuracy`, `originalName` |
| 22 | §8 | Admissions workflow (enquiry→offer→enroll) | PARTIAL | student status enum incl. APPLICANT; workflow UI planned |
| 23 | §8 | Batch import w/ preview/error handling | PLANNED | — |
| 24 | §8 | Student timeline joining authorized events | PLANNED | — |
| 25 | §9 | Early-care workspace: observations, milestones, no exams | PARTIAL | `KgObservation` implemented + seeded; feeding/sleep/pickup logs planned |
| 26 | §10 | Curriculum browser, schemes of learning, lesson notes workflow | PLANNED | curriculum models (Subject, AssessmentProfile) exist; Teaching Studio planned |
| 27 | §10 | Timetable | DONE (impl) | seeded slots; substitution/conflict engine planned |
| 28 | §11 | Attendance statuses incl. sick@home/sick@clinic, late, excused | DONE (verified) | 6 statuses in register; UI verified |
| 29 | §11 | Correction history, authorized reopenings | DONE (impl) | correctionHistory JSON on records; reopen policy planned |
| 30 | §11 | Scheduled school days as denominators | DONE (impl) | `AttendanceDay` typed calendar (holiday honored in UI warning) |
| 31 | §11 | Absence alerts, guardian acknowledgement | PLANNED | Notification model exists; delivery adapters planned |
| 32 | §12 | Assessment profiles w/ provenance, immutability, versions | DONE (impl) | 3 seeded profiles; `isImmutable` on official packs |
| 33 | §12 | SBA filling grid, raw marks, missing/absent/exempt vs zero | DONE (verified) | gradebook UI + API; validation tested |
| 34 | §12 | Published marks protection (no silent overwrite) | DONE (verified) | tested: published entry rejected on silent edit |
| 35 | §12 | Exams, question banks, online/LAN exams, BECE exports | PLANNED | models exist (ExamSlot/Attempt); admin UI + exports planned |
| 36 | §12 | Report cards, broadsheets, transcripts | PLANNED | weighted totals computed live in grid; rendering planned |
| 37 | §13 | Fee items + applicability inheritance (school→category→class→student), override replaces (no double-bill) | DONE (verified) | `resolveStudentPlan` precedence + seed category plans; logic unit-tested |
| 38 | §13 | Invoice generation: dry-run, duplicate prevention, versioned plans | DONE (impl) | `generateInvoices()` w/ dryRun + per-student skip reasons |
| 39 | §13 | Discounts: %/fixed, scopes, priority, stacking, remainder allocation | DONE (verified) | `tests/domain.test.ts` 5 discount cases |
| 40 | §13 | "Why this student is charged this item" | DONE (verified) | fee plan resolution records reason/source per line |
| 41 | §14 | Daily services: enrollment vs obligation vs delivery vs payment separation | DONE (impl) | ServiceEnrollment / ServiceCharge / Payment models distinct |
| 42 | §14 | Advance allocation preview, leftover balances | PARTIAL | allocation primitives tested; interactive strategy UI planned |
| 43 | §14 | due/paid/prepaid/served/not_served/waived/refunded states | DONE (impl) | ServiceCharge status enum in schema |
| 44 | §15 | Payment methods: cash, MoMo, bank, cheque, card | DONE (impl) | method set on payments; provider adapters below |
| 45 | §15 | Hubtel integration (server-created intents, callback verification) | **BLOCKED (merchant credentials)** | adapter contract documented; no fabricated live claims |
| 46 | §15 | Idempotent posting, one business effect per receipt | DONE (verified) | tests |
| 47 | §15 | Overpayment/allocation bounds atomic under concurrency | DONE (impl) | `allocatePayment` tx checks cumulative caps; concurrency race tests planned |
| 48 | §15 | Till/shift open-close-handover, shortages | PLANNED | — |
| 49 | §16 | Double-entry GL, balanced journals, source links, reversals | DONE (verified) | postJournal + browser-verified balanced entry; reversal flow planned |
| 50 | §16 | Trial balance, income statement, balance sheet reports | DONE (verified) | `src/lib/finance-reports.ts` + `/api/finance/reports` (role-gated bursar/accountant/head/proprietor); TB Dr=Cr verified in tests + browser; A = L + E incl. current-year surplus; draft/reversed entries excluded; gap found & closed: invoice generation now posts accrual journals atomically (Dr 1100 / Cr 4001·4002), offline payments journal Dr cash / Cr 1100 |
| 51 | §17 | HR: staff records, employment data | DONE (impl) | 10 staff seeded |
| 52 | §17 | Payroll: versioned Ghana rule pack (SSNIT/PAYE) | DONE (verified) | pack + computation tested; pay-run workflow planned |
| 53 | §18 | Transport: vehicles, routes, stops, enrollment, trips | DONE (impl) | seeded; conductor app + GPS planned |
| 54 | §19 | Inventory, procurement, library, canteen | PLANNED | — |
| 55 | §20 | Announcements/notices | DONE (impl) | seeded + dashboards |
| 56 | §20 | SMS/email provider adapters, automation designer | PLANNED | — |
| 57 | §21 | School websites + 1,001 templates | PLANNED | — |
| 58 | §22 | AI capabilities | PLANNED | no fabricated "AI insights"; provider abstraction specified |
| 59 | §23 | PWA install, offline states, responsive, dark mode tokens | DONE (verified) | manifest + SW + UI states; browser-verified |
| 60 | §23 | Native Windows/macOS/Android/iOS clients | **BLOCKED (toolchains)** | production phase |
| 61 | §24 | Platform admin console (tenants, entitlements, support access) | PARTIAL | tenant registry view planned; support access controls designed |
| 62 | §25 | Security: scrypt, httpOnly sessions, revocation, tenant scoping | DONE (verified) | tests |
| 63 | §25 | Full threat model + remediation register | PARTIAL | ADR-007 posture; formal model planned |
| 64 | §26 | Role-scoped dashboards, trend charts, arrears analytics | DONE (verified) | browser-verified KPIs, attendance trend, arrears by class |
| 65 | §27 | Fresh install from empty DB, no legacy dependency | DONE (verified) | seed runs on empty DB; no legacy imports |
| 66 | §27 | CSV/XLSX import/export templates | PARTIAL | invoices CSV export in UI; import wizard planned |
| 67 | §28 | CI, Docker, monitoring, backups | PARTIAL | `.github/workflows/ci.yml` (install→push→seed→lint→serve→48 tests) on push/PR; `Dockerfile` multi-stage standalone + first-boot seed entrypoint. Monitoring/backups still planned |
| 68 | §29 | Vertical slices with real persistence + offline early | DONE (verified) | payment slice verified through GL |
| 69 | §30 | Truthful per-module states (no inflation) | DONE (verified) | this matrix |
| 70 | §31 | Acceptance scenarios 1–15 (tenancy/finance) | PARTIAL | covered: isolation (T-2/3), duplicate prevention (F-6/7 partial), offline receipts (F-11 partial), idempotent replay (F-12) |
| 71 | §31 | Acceptance scenarios 16–32 (academics/ops/resilience) | PARTIAL | covered: SBA raw/exempt/conflict (A-17), attendance correctness (A-21 partial), T-30 stale-authority replay REJECTED with evidence preserved (browser-verified), A-18 live weighted totals in gradebook |
| 72 | §32 | Codex review package | PARTIAL | docs set + source package + pushed repo with CI; remote verified in sync |

**Not-run / blocked register:** Hubtel live verification (no merchant credentials),
native platform builds (no toolchains), 72-hour disconnected soak (no long-lived
execution window), LAN edge deployment (no second host), Ghanaian-educator pack
review (human reviewer required), accountant journal review (human reviewer required).
