# School ERP — New-project master development prompt for Z.ai

Prepared for Christian Agbotah, Lightworld Technologies Ltd., Ghana. Research checkpoint: 29 October 2026, Africa/Accra.

**Project name:** School ERP. **Public application/product name:** iEduPro. **Project directory/repository slug:** `school-erp`.

**Required GitHub repository for all source, commits and pushes:** https://github.com/christianagbotah/school-erp.git

**Delivery mandate:** Act as the fully responsible full-stack developer and engineering team. Build the complete application to enterprise-grade, production-ready quality, regularly commit and push verified progress, and continue autonomously through all implementation phases. Deliver the finished release candidate for the final Codex review before live production release.

**How to use:** Give Z.ai this entire file as a replacement for the earlier brief. Start a completely new project named **School ERP**, building the application branded **iEduPro** from scratch. This is one continuous product brief. The numbered sections are implementation responsibilities, not separate prompts requiring a new approval after each section. Implement and verify the complete basic-school product, then bring the final review package back to Codex before production.

---

## BEGIN MASTER PROMPT

## 1. Your mission, authority and creative freedom

Act as the principal product architect, Ghana education researcher, full-stack engineering lead, designer, database architect, offline synchronization engineer, finance systems engineer, AI/ML lead, QA lead and release engineer for the new **School ERP** project. The application must be branded **iEduPro**, owned by **Lightworld Technologies Ltd., Ghana**.

You are the **fully responsible full-stack developer**, with ownership of frontend, backend, database, integrations, native clients, offline/edge systems, AI, security, testing, infrastructure and documentation. Implement all of these yourself using the capabilities available in your environment; do not leave backend, accounting, synchronization or deployment engineering as instructions for the owner to hire somebody else to finish. The required outcome is an integrated, enterprise-grade, production-ready product, with evidence for its readiness.

Build a complete, modern education operating system. Our immediate delivery is Ghanaian crèche, nursery, kindergarten, primary and junior high school through **Basic 9/JHS 3**, including public and private schools, single schools, school groups and schools with branches. Design the underlying platform to support later SHS, technical/vocational and tertiary expansion without rebuilding its foundations. The current completion target is the full basic-school product; do not dilute it by prematurely claiming that an unimplemented university module is finished.

This brief is a **minimum functional foundation, not a ceiling**. Research comparable modern products, Ghanaian operations, current technologies and real user needs. Discover and implement valuable capabilities beyond this list. You have freedom over visual design, component systems, workflows and well-justified technical improvements. Do not restrict the product to an admin dashboard template, any previous application's interface, a particular colour palette, a fashionable framework, or a narrow list of modules.

Make thoughtful implementation decisions and keep working through the entire full-stack scope. Build working screens, APIs, business rules, migrations, local data stores, synchronization, jobs, integrations, reports, native clients, tests, deployment assets and documentation. Do not deliver a collection of mock screens or stop after a foundation phase.

Maintain an innovation register: problem, proposed capability, user benefit, dependencies, implementation status and verification. Add worthwhile features as completed vertical slices. Preserve accounting integrity, tenant isolation, child privacy, truthful status reporting and the final production review described below as product requirements.

Use realistic assumptions when a routine choice is missing. Record consequential assumptions and continue independent work. Escalate only a missing decision that materially prevents correct implementation. Missing credentials or external tools must block the affected live integration, not unrelated development.

### Continuous ownership and execution

Treat this entire brief as **one continuous implementation assignment**. Do not stop at a phase boundary, an initial prototype, the end of a module, a plan, a scaffold, a passing frontend build or a progress summary. Complete the current work, verify it, commit and push it, and immediately proceed to the next dependency-ready task without waiting for another “go on” message.

Use this loop throughout: **research/design as needed → implement the complete vertical slice → test and inspect → fix defects → update documentation and the requirements matrix → commit → push → verify the remote SHA → continue**. Progress updates are informational; they are not requests for permission to keep building. Make routine engineering decisions and resolve ordinary bugs, integration failures and test failures independently.

Continue until the complete agreed basic-school scope and its enterprise-readiness checks are implemented and verified, then prepare the final review package. Do not announce completion because one development phase passed. Do not weaken validations, disable security, delete meaningful tests or substitute mocks simply to clear a gate. Fix the underlying issue and rerun the relevant checks.

Only an actual external prerequisite, an execution/session limit, a material decision with no sound assumption, or the final production-release gate may require a handoff. Preserve a precise committed checkpoint, distinguish verified from blocked work and continue every independent task available. A single missing credential is not a reason to abandon the rest of the product. Do not promise background execution that your environment cannot perform; make resumption straightforward and continue from the checkpoint rather than starting over.

## 2. Start a completely new project: School ERP

This is a **greenfield build**, not a continuation, modernization, rebrand, branch, fork or migration of the existing iEduPro application. Reusing the product name **iEduPro** does not mean reusing that application's codebase.

The owner has already created the new **School ERP** repository: **https://github.com/christianagbotah/school-erp.git**. Use this repository in a fresh project directory named **`school-erp`**. Clone only this new repository; if it is empty, initialize the application there, and if it contains initial README/licence/configuration commits, preserve them. Do not overwrite its history or create another repository. If a local directory with that name already exists, inspect it and choose a safe fresh checkout rather than overwriting unrelated work. Do not clone, branch from, import or modify any previous iEduPro, iEduPro Next, SchoolManager or CodeIgniter application. Leave previous projects, databases, deployments and credentials untouched.

The new project must have its own architecture, source code, schema, migrations, UI/design system, tests, documentation, environment configuration, seed data, build pipelines and deployment resources. Start with new empty operational databases and fabricated demonstration data. Do not copy a previous school's records, secrets, business configuration or database dumps into the new application.

Use these naming conventions consistently:

| Item | Required name or convention |
|---|---|
| Project/workspace | **School ERP** |
| Project directory and repository slug | **`school-erp`** |
| Required GitHub repository | **https://github.com/christianagbotah/school-erp.git** |
| Application name shown to schools and users | **iEduPro** |
| Owner | **Lightworld Technologies Ltd.** |
| Development resources | New, separately named databases, storage locations, services and environments for this project. |

The functional requirements and school/branch database arrangement in this brief are product decisions for the new build. They do not require access to any earlier code, diagrams, frozen specifications or implementation. Research and design the new system independently; old application parity is not an acceptance requirement.

Choose a modern stack based on the full requirements, particularly durable offline use, financial correctness, cross-platform clients and maintainability. Section 5 offers a starting recommendation, not an inherited codebase or mandatory framework lock-in. Document your choices and implement the complete system.

### Mandatory Git workflow

- Set **`origin`** to **`https://github.com/christianagbotah/school-erp.git`**, or the equivalent authenticated SSH remote **`git@github.com:christianagbotah/school-erp.git`**.
- Every development commit must belong to this project's checkout/history, and every push must target a branch of **`christianagbotah/school-erp`**. Do not send any School ERP work to another repository or create an alternative project remote.
- Verify the fetch and push remotes before the first push and whenever a workspace/session is resumed. Do not silently continue using an old repository configuration.
- Commit meaningful, verified increments and push them regularly: after each completed vertical slice or substantial validated change, and before any session handoff. Do not defer all commits/pushes until the end or leave the implementation only in a temporary sandbox. Include source, schema migrations, tests, configuration examples and review documentation while excluding secrets, actual school records and generated dependencies.
- Use appropriate branches/PRs in this same repository, preserve its existing commits, respect branch protection, and never force-push or overwrite history merely to publish a checkpoint.
- Confirm each successful push by reading the remote branch SHA and comparing it with the intended local commit. Report the repository, branch, full commit SHA, checks run and actual push status.
- If Z.ai does not yet have write authentication for this repository, continue independent local work, preserve commits and a complete source package, and state the exact access issue. Do not push elsewhere or describe an unpushed commit as available on GitHub. Never request or expose tokens in source code or logs.

The required repository is already supplied. There is no need to ask the owner to create or choose another one.

This brief replaces the earlier instruction to build on an existing iEduPro repository. It authorizes development through the whole basic-school scope without a STOP after every phase. Final production release still waits for Codex review and the owner's release authorization.

## 3. Research Ghana education before encoding policy

Distinguish the responsibilities of GES/MoE, NaCCA, WAEC, NaSIA and Social Welfare/ECCD authorities. Do not attribute all educational rules to GES or treat a school management convention as a national law.

Use current official sources, dated curricula, assessment frameworks and circulars. Section 34 supplies a starting source register. Recheck it when implementing; a website upload date is not necessarily the document's effective date. Read the actual relevant documents, not only search snippets. Keep a research log recording issuer, title, URL, publication/version date, effective period, grade/subject coverage, retrieved date, relevant page and any uncertainty.

The research must produce usable, versioned **Ghana education configuration packs**, not just a prose summary. Model grade levels, subjects, learning areas, strands, sub-strands, content standards, indicators, exemplars, competencies, assessment methods, performance descriptors, report structures and applicable policy versions. Map imported content to source pages. Respect content licences; store references or obtain permission where redistribution is restricted.

Key curriculum indicators by curriculum version, subject/learning area, grade and indicator code; a bare code string need not be globally unique. Validate imported references before a teacher or AI can cite them as verified. Preserve the historical subject identity when names or curricula change instead of mechanically equating old BDT/ICT results with new Career Technology/Computing results.

### School stages and configurable categories

| Product stage | Initial Ghana scope | Required distinction |
|---|---|---|
| Early care | Crèche, day care and nursery levels configured by the school | Care and developmental records; do not invent a universal NaCCA crèche syllabus or fixed nursery labels/age rules. |
| Kindergarten | KG 1 and KG 2 | Integrated, play-based learning and developmental/indicator assessment. |
| Lower primary | Basic 1–3 | Applicable standards-based curriculum and assessment profile. |
| Upper primary | Basic 4–6 | Applicable standards-based curriculum and assessment profile. |
| JHS | Basic 7–9, also displayed as JHS 1–3 | Common Core Programme, school assessment and BECE preparation/records. |

School billing categories such as **Pre-school, Lower Primary, Upper Primary and JHS** must be configurable groupings. A category is not a class, a branch, or a curriculum stage. Schools can include crèche/nursery/KG differently in their own billing categories without corrupting the academic model.

Support Ghana national curriculum, school enrichment and licensed alternative/international curriculum profiles where a private school needs them. Keep their provenance and grading separate. Never manufacture an accredited curriculum or imply that private schools are exempt from applicable national requirements.

### Important research conclusions to preserve

- NaCCA's formal basic-school structure covers KG 1–2, B1–6 and B7–9. Crèche/nursery need a separate early-care model. The revised ECCD policy addresses a wider childhood-development span; that does not make every covered age a formal school grade.
- Government-authored ECCD standards also provide developmental guidance for ages 0–3. Use these to support caregivers and observations, not to refuse admission, rank babies or create reward/sanction systems from milestone scores.
- KG teaching is integrated. NaCCA's KG teacher resource pack describes observation-based assessment and says not to use end-of-month/end-of-term paper-and-pencil tests. Default KG to observations, checklists, portfolios and developmental reports, rather than routing it through the primary/JHS timed examination workflow. Verify later KG assessment tools when building the pack.
- JHS CCP learning areas and BECE examination subjects are related but not identical sets. For example, Physical Education and Health appears in the CCP; do not automatically make every curriculum learning area a BECE paper. Verify which subjects and language options apply to each school/candidate/year.
- Primary and CCP source documents also use different proficiency bands. Store the exact applicable scale and its evidence rather than applying a universal five-band scheme to KG–B9.
- Current WAEC material describes school-candidate BECE continuous assessment at **30%** and external examination at **70%**. This is not a universal weighting for every school's internal term report. Preserve raw scores, maxima, normalized components, the applicable rule and official results separately.
- There is no basis in this brief for calling one configurable KG–JHS GPA scale a compulsory national standard. Support school-defined GPA/averages where wanted, applicable NaCCA proficiency descriptors, raw marks and WAEC result fields as distinct reporting modes.
- Some official legacy pages retain old subject names or dates. OWOP withdrawal information also differs between an older curriculum page and later public statements. Keep historical offerings and resolve current activation using dated authoritative guidance. Do not silently delete a subject or rewrite a past report.
- Externally supplied assessments have NaCCA provider/instrument approval requirements. Support provider certification, instrument-specific approval, versions and verification evidence. Do not market AI-generated questions as NaCCA-approved; confirm the rules applying to any shared/commercial AI assessment service.

Create a policy conflict register. Ship verified rule packs and transparent school-configurable policies; do not label an unresolved assumption as an official national rule. Obtain a Ghana educator/assessment review of the packs as part of the final acceptance package.

## 4. Tenancy, school groups and database ownership

Build **SaaS-capable software**. SaaS describes the delivery/business model; it does not require unrelated schools to share one database. Commercial plans can be finalized later. Keep student-fee collection, platform subscription billing and a school's own accounting separate.

Our preferred default for new customers in this brief is:

> **One dedicated operational PostgreSQL database per independent school customer or school-group tenant. Branches belonging to that same customer share its operational database. Unrelated school customers have separate databases.**

Implement this arrangement from the first schema/provisioning design in the new project. Do not create one database per class, category or physical branch. Design controlled customer mobility and future deployment tiers without introducing unnecessary shared-pool complexity into the initial dedicated-database implementation.

Retain the meaningful hierarchy:

**Tenant/customer → organization/legal entity → school/academic institution → campus/physical branch.**

- A normal independent school has one tenant, one organization, one school and one or more campuses.
- A school group can contain several legal organizations and academic schools within one customer database. Each school can keep its own calendar, grading, fee schedules and principal.
- A physical annex/branch of one school is normally a campus; a separately governed academic institution can be a school under the group. Make this distinction explicit during onboarding.
- Sharing a database does not grant every branch access to every other branch's records. Enforce organization, school, campus, class, assignment and relationship scopes.
- A distinct legal entity retains its own accounting books, payroll obligations and tax identity. Group consolidation must not collapse those ledgers.

| Example | Operational database arrangement |
|---|---|
| Independent School A, one site | Dedicated customer database A. |
| School A, main campus and two branches | All three sites use customer database A, with scoped campus records and permitted consolidated reporting. |
| Unrelated School B | Dedicated customer database B. |
| Customer group with several schools | One dedicated tenant database by default; separate organizations/schools/campuses and accounting scopes inside it. |
| Future alternative deployment tier | Add an optional shared pool or dedicated cluster only through a documented, tested design that preserves isolation and stable customer IDs; dedicated databases remain the default. |

### Control plane and tenant plane

Use a separate platform/control database for customer registration, authoritative database assignments, identity/membership routing, provisioning, entitlements and operational metadata. Keep pupils' school records, marks, detailed finance, health notes and other operational PII in the tenant plane. Define the minimal identity metadata actually needed centrally; do not make unverifiable claims that authentication records can never contain personal information.

Create one authoritative tenant-to-database registry, for example **`platform.tenant_database_assignments`**, in the new control plane. Enforce one active primary assignment, assignment history, schema version and controlled relocation. Derive tenant authority from authenticated membership and trusted routing, not an arbitrary client `tenant_id` or host header.

Implement transaction-local PostgreSQL RLS and least-privilege database roles. API users must not inherit migration/BYPASSRLS privileges or own tenant tables. Validate record relationships at database and application boundaries. Cross-database references require explicit application contracts; do not invent PostgreSQL foreign keys across databases.

Tenant context must cover APIs, jobs, exports, imports, caches, file storage, search, AI retrieval, notifications, reports and synchronization. Use bounded connection pools, safe context cleanup and connection-reuse tests. Retain equivalent isolation safeguards in dedicated databases as defence in depth.

Provisioning must create the database, migrate schema, seed verified references, create scoped roles, configure backups/storage, link the registry and run readiness checks. Build fleet migration orchestration with canary tenants, retries, failure isolation, schema-version tracking and rollback/runbooks.

Deliver tested customer export, restore, offboarding and controlled database relocation. Client/device replicas and campus edge databases are replicas/operational nodes of the same customer, not new commercial tenants.

## 5. Technical implementation principles

Select a modern stack for this fresh project. The following is a practical starting recommendation; improve or replace components when research demonstrates a better fit, documenting the decision and delivering equivalent capabilities:

- Next.js/React/TypeScript for the responsive web application, school websites and installable PWA.
- NestJS/TypeScript modular backend with explicit domain boundaries and a versioned API.
- PostgreSQL for authoritative operational storage, with a well-designed typed data-access/repository layer such as Kysely/pg or an appropriate alternative.
- Redis and durable workers for queues, scheduled work and transient coordination, never as the only accounting record.
- Flutter with durable local storage for Android, iOS, Windows and macOS applications, or another justified cross-platform approach that demonstrably meets the same offline/native requirements.
- An isolated Python service or worker for ML/optimization when useful. Do not force ordinary CRUD into a second backend merely to claim multiple languages.
- Object storage for documents/media, tenant-scoped retrieval/search and an appropriate observability stack.

Choose current supported releases using official documentation, validate compatibility and pin reproducible dependencies in the new project's lockfiles. Do not blindly install a version mentioned in an old prompt.

Use a modular monolith initially where practical. Isolate AI, integrations, synchronization and background work behind clear contracts; split services only when justified. Shared API/domain rules must not be reimplemented inconsistently in five clients.

Use integer minor units or exact decimals for money, explicit currency, deliberate rounding, server transactions and database constraints. Display Ghana cedi as **₵**, with clear spacing, thousands separators and two decimal places. ISO currency codes may be stored internally or used in provider APIs. Store timestamps with zone-aware semantics and business dates separately. Default to **Africa/Accra**, Ghana phone normalization and an academic-year display such as **2026–2027**.

Every critical command needs authorization, validation, idempotency, an audit trail, transactional domain updates and reliable event delivery. Use a transactional outbox and idempotent consumers where workflows cross modules. No financial event should disappear because a notification job fails.

Create ERDs, state diagrams for important workflows, OpenAPI contracts, generated/client-safe types, migration scripts and repository-level quality checks. Do not turn the system into a generic entity editor that cannot express real school rules.

## 6. Offline-first operation is a core product capability

An offline badge, cached dashboard, localStorage cache or manual export/import is insufficient. Implement a durable **local-first data and command system**, with automatic recovery and a visible manual Sync action.

### Three operating conditions

1. **Connected:** authorized local operations remain responsive; durable changes synchronize with the authoritative services.
2. **Internet outage with school LAN available:** staff can use an installed school/campus edge service for shared attendance, admissions, daily collections, POS, records and approved local exams. Demonstrate this deployment, including local discovery/pairing, authenticated connectivity and safe handover back to cloud connectivity.
3. **A fully disconnected device:** a previously authorized teacher, cashier, conductor or other user continues the permitted downloaded workflows using its own durable local store, then syncs later.

Use these scenarios to choose a concrete replication model. Define ownership/writer authority for every important aggregate. Do not create uncontrolled multi-master PostgreSQL replication or two competing ledgers. Edge authority, device command capture and cloud finalization must have an explicit contract, including how authority transfers after a failure.

Native clients should use a transactional local database such as SQLite/Drift with appropriate encryption and OS-keystore protection. The PWA needs IndexedDB or another supported durable browser database, a versioned service worker, controlled asset/data caching and quota/eviction handling. Do not claim browser storage has the same guarantees as an encrypted native database. Check current browser support and provide capability diagnostics and recovery guidance.

### Offline workflow matrix

Document and implement read, create, edit, approve, print and sync capabilities per role/module/platform. At minimum:

| Workflow | Required disconnected behaviour |
|---|---|
| Attendance | Download assigned rosters; capture/revise authorized marks; retain who/when/where; sync with conflict review. |
| Lessons and learning resources | Prepare notes, record delivery/reflection and use downloaded resources. |
| Assessment | Capture assigned raw marks and observations; preserve versions; upload evidence later. |
| Approved school/local exams | Download authorized packages and schedules; save/resume attempts durably; synchronize answers and submission evidence. |
| Admissions/student changes | Capture permitted records and uploads with globally unique IDs; resolve duplicates/references during sync. |
| Cash/daily fee/POS receipts | Record the actual local cash transaction, issue a unique auditable offline receipt, show pending reconciliation, and post it once after validation. |
| Inventory | Capture authorized receipts/issues/counts under an explicit stock-conflict policy. |
| Transport | Use the assigned manifest, record boarding/alighting/handovers/incidents and capture GPS where available. |
| HR/payroll/accounting | Prepare authorized inputs, drafts and local work; execute only offline-authorized postings/approvals, with clear status and later reconciliation. |
| Messages | Draft/queue messages; send and update delivery status after the relevant channel becomes reachable. |

Remote bank/MoMo settlement, cloud AI calls, internet messages and another device's unsynchronized information cannot become live facts without connectivity. Show **recorded locally**, **pending provider verification**, **synchronized** or **conflict** accurately. A parent must not see stale GPS presented as a live bus location. A cached balance must identify its last synchronization time and pending local changes.

### Synchronization protocol

- Globally unique IDs, operation IDs, device IDs, authenticated membership context and explicit schema/protocol versions.
- Atomic local transaction for a business change plus its outbox command. App termination or power loss must not acknowledge an undurable operation.
- At-least-once transport with idempotent application and deduplication. Never promise magical exactly-once network delivery; demonstrate one business effect for repeated delivery.
- Entity/base versions, dependencies and domain validation; server-derived ownership and permission checks on every replay.
- Transactional server change feed, tenant/device/scope-bound opaque cursors, ordered paging, acknowledgement, resumable pull/push and attachment queues.
- Design and document a correct cursor protocol in this new project. Sequence allocation alone is not a safe commit-order cursor: test transactions committing out of order so a client cannot advance past an unseen committed change. Define a correct publication/high-watermark scheme.
- Backoff, jitter, bounded batches, compression, partial failure isolation, dead-letter handling, poison-operation diagnostics and safe retry.
- Durable tombstones with a documented retention/rebootstrap policy, including devices offline beyond retention.
- Large file checksums, resumable uploads, file permissions and no premature deletion of evidence.
- Persist pulled changes and the corresponding cursor atomically. Never advance the cursor before durable application.
- Apply permission-scope removals and changes as well as additions. A teacher reassigned away from a class must not retain its current records indefinitely.
- Separate local storage, queues, search and caches by authenticated tenant, user/membership and applicable scope. School switching/logout must not show a previous customer's data.
- Offline leases for authorized users/devices, local lock/re-authentication, clock-tamper handling, device revocation, secure key handling and bounded offline retention. Revocation takes effect remotely when the device reconnects; do not claim guaranteed immediate remote wiping of a disconnected device.
- Reject unauthorized posting without silently discarding captured evidence of actual cash received or child handovers. Define restricted evidence recovery/review and explicit resolution before local cleanup can destroy unresolved evidence. Recovering evidence must not give a revoked user new posting or viewing rights.
- Consistent reconnection behaviour on foreground, app launch, network recovery and manual sync. Browser/iOS background execution is constrained; core correctness must not depend on a background sync API always running.
- Safe app/schema upgrades while unsent commands exist, mixed client versions, tenant relocation and edge/cloud failover.

### Conflict rules are domain-specific

Never use universal last-write-wins for money, marks, child handovers, stock or approvals.

- Posted money entries are immutable. Corrections are linked reversals/credit notes/reallocations with approvals; duplicates return the original result.
- Concurrent spending of the same advance balance needs reservation, bounded offline authority or a visible reconciliation queue. Do not create globally available funds twice.
- Attendance has a natural uniqueness boundary and correction history; resolve competing authorized edits visibly.
- Marks have ownership, moderation and publication locks; a late offline mark must not silently overwrite a published result.
- Stock must expose oversubscription/negative-stock exceptions under policy; never invent missing units.
- Student identity conflicts and relationship changes require a controlled merge/review process.
- Transport manifests and handover events preserve conflicting evidence and alert authorized staff.
- Conflicts must be understandable to nontechnical staff, with the original values, proposed changes, actor and resolution history.

Deliver a sync operations console showing pending counts, last success, failures by cause, authorized retry/review actions and edge/node health. Logs must help resolve a school outage without exposing another school's data.

## 7. All users need purpose-built portals

Build tailored home pages, task flows and permissions. A role is not merely the admin dashboard with menu items hidden. Enforce permissions server-side and during sync, using real teaching assignments, guardian links, cashier shifts and route assignments.

| Portal/role | Core responsibilities |
|---|---|
| Platform owner/operator | Customers, tenant provisioning, health, versions, support, entitlements, backups, integration readiness and safe support access. |
| Proprietor/group management/board | Authorized school/branch consolidation, budgets, outcomes and approvals. |
| Headteacher/school administrator | Admissions, structure, staff, school operations, exceptions, policies and reporting. |
| Academic head/HOD/exam officer | Curriculum, timetables, lesson review, assessment, moderation, SBA, result publication and candidate records. |
| Teacher/class teacher | Today's classes, attendance, lessons, evidence, marks, assignments, messages and intervention follow-up. |
| Parent/guardian/sponsor | Authorized wards, balances, payment, receipts, development/results, attendance, consent, transport and communication. |
| Student | Appropriate learning activities, materials, assignments, timetable, published results, online/offline exams and messages. |
| Cashier/authorized collector | Quick search/collection, daily fees, receipts, own shift/till, settlement and correction requests. |
| Accountant/bursar | Receivables, accounting, budgets, reconciliation, expenses, approvals, reporting and permitted payroll. |
| Auditor | Read-only evidence, audit filters, reconciliation trails and permitted exports; no implicit posting power. |
| HR/payroll officer | Staff files, leave/attendance, pay preparation and controlled payroll administration. |
| Driver | Assigned vehicle/trip, route instructions and safe trip-state actions. |
| Conductor/bus attendant | Assigned rider manifest, boarding/alighting, authorized collection/handover and incidents. |
| Transport manager | Fleet, routes, schedules, maintenance, staff, fares, safety and route performance. |
| Storekeeper/procurement officer | Requisitions, suppliers, receipts, issues, transfers, stock and purchasing. |
| Librarian | Catalogue, borrowing, returns, inventory and member services. |
| Caterer/canteen/POS user | Meal entitlement, service delivery, kitchen stock and permitted sales/collections. |
| Nurse/welfare/safeguarding officer | Restricted wellbeing, incidents, authorized care records and intervention workflows. |
| Non-teaching staff | Own profile, attendance/shifts, leave, payslips, notices and job-specific tasks. |
| Applicant/visitor/public website user | Admissions, enquiries, public information and approved event services. |

Allow configurable combinations of roles and delegated authority without turning every staff member into an administrator. Include account/profile management, secure sign-in/recovery, invitations, onboarding, device/session management, MFA for sensitive roles and account history.

Use verified relationships, multiple guardians per learner and separate flags for legal relationship, billing responsibility, portal access and pickup authority. Shared contact details must not automatically grant access. Support custody/access restrictions and multiple children while showing only authorized records. Define cross-school account/membership behaviour explicitly; never infer access to another tenant from a phone number.

## 8. School setup, student records and admissions

Implement:

- Tenant/group/organization/school/campus onboarding; names, contacts, logos, addresses, regulator identifiers, licence evidence, renewal reminders and readiness checklist.
- Academic years and typed periods (terms, semesters and future blocks), working weeks, holidays, special school days, half days and closure calendars.
- Stages, categories, classes, sections/streams, shifts/full-day programs, rooms, capacities and promotion paths.
- Admission enquiries, applications, attachments, assessments/interviews, offers, waiting list, admission fees, approval and enrollment.
- Re-admission, transfers, withdrawals, graduation, promotion/repetition and historical class/campus assignments.
- Student/person records with **first name, middle name and last name**, preferred/display name, original imported name, date-of-birth accuracy and configurable identifiers.
- Guardian selection/linking before relationship details; duplicate detection, contact history, emergency contacts, sponsors and restricted notes.
- Houses, clubs, teams, extracurricular activities, elected responsibilities and event participation.
- Document collection, expiry/verification, photo upload/camera capture, IDs/QR cards, configurable forms and batch imports with preview/error handling.
- A student record timeline joining authorized academic, attendance, finance, transport and welfare events without giving every role access to all of them.

Enrollment determines the applicable school/class/campus/period and policy versions. Do not store the current class on the person as if past reports should change when the learner is promoted.

## 9. Early care, nursery and kindergarten

Provide a purpose-built care/early-learning workspace:

- Safe arrival/departure and authorized pickup, late pickup, absence and emergency contacts.
- Configurable developmental domains, milestones, observations, portfolios, photos and educator narratives.
- Age-appropriate play/learning plans, routines and parent communication.
- Feeding, sleep/rest, toileting and supplies records where the centre uses them; allergy/authorized-care alerts with restricted access.
- Caregiver assignments, room/group capacity, schedules and handovers.
- KG integrated themes, curriculum indicators, evidence-based progress and home learning suggestions.
- Printable and digital progress reports without forcing an exam percentage or GPA onto babies or KG children.
- Centre policy/licensing/inspection evidence and renewal reminders using actual recorded dates.

Use the Ghana 0–3 ECCD standards to support care planning and developmental tracking. Do not turn those standards into caregiver-performance scores, admission exclusions, or reward/sanction systems for children, educators or caregivers.

Do not use an AI model to diagnose development, invent health advice or determine a child's eligibility. Assist educators with drafts and evidence summaries that they review.

## 10. Curriculum, teaching and lesson notes

Build a full **Teaching Studio**:

- Versioned curriculum browser with grade/subject/strand/sub-strand/content-standard/indicator references and useful Ghana terminology.
- Schemes of learning/work by year, term and week; pacing, coverage and missed-lesson tracking.
- Teacher lesson notes/plans with objectives, prior knowledge, indicator codes, resources/TLMs, activities, differentiation, inclusion, assessment and reflection.
- Appropriate lesson phases for the relevant pack, such as starter, main activities and plenary/reflection; allow school-defined formats and period lengths.
- Draft → submit → review/return → revise → approve → deliver → reflect/reuse, with HOD/head feedback and version history.
- Offline drafting, evidence capture and curriculum/resource downloads.
- Assignments, homework, practical/project tasks, group activities, rubrics, marking/feedback, deadlines and revision.
- Resource library, reusable plans, school-approved collaboration and contextual AI assistance.
- Timetables accounting for teacher availability/workload, rooms, breaks, shifts, specialist periods and conflicts; substitution and timetable change notices.
- Curriculum coverage and learner mastery dashboards with drill-down to actual evidence.
- CPD/PLC planning, staff coaching and lesson observation workflows where relevant.

AI-generated lessons must cite the curriculum references used, remain editable and clearly indicate draft/review status. A generated citation must resolve to a real source/indicator. Public repositories and AI providers must never become an uncontrolled channel for private learner records.

## 11. Attendance, timekeeping and wellbeing

Support student daily/session/subject attendance and staff attendance/shifts. Include school-configurable statuses such as present, absent, late, excused, **sick at home** and **sick at clinic**, with appropriate reporting mappings.

Include late arrival/early departure, pickup records, leave requests, substitute teachers, correction requests, explanations/evidence, date locks and authorized reopenings. Use actual scheduled school days as denominators. Handle holidays, mid-term admission/withdrawal, shifts, transfers and approved non-school days correctly.

Support manual registers, bulk marking, QR/RFID or device integrations through adapters, and accessible alternatives. Biometric options, if added, require a justified school policy and privacy review rather than being a default requirement.

Generate actionable absence/punctuality alerts, guardian acknowledgements, follow-up cases and trend reports. Queue notifications reliably during outages. Attendance, meal delivery, transport usage and bill generation must be related through explicit policy, not assumed to be identical events.

Include restricted safeguarding/incident/counselling workflows, consent, contact escalation and audit. Provide human-reviewed intervention suggestions without labelling a child from an opaque risk score.

## 12. Assessment, SBA, examinations and results

Deliver the entire assessment lifecycle with separate profiles for early-care/KG observation, primary assessment, JHS school assessment and BECE records.

### SBA and gradebook

- Configure official verified and school-defined assessment profiles with applicability/effective dates, components, raw maxima, weights, minimum evidence, rounding and performance descriptors.
- Preserve national profiles as immutable source versions; school-defined variants/copies must not overwrite the original profile or its official provenance.
- Capture class exercises, tests, homework, projects, practicals, portfolios, participation/observations and other pack-supported categories.
- Provide efficient **SBA filling grids** by teacher/class/subject/period, keyboard entry, bulk import, validation and offline autosave.
- Retain raw marks and maxima; show exactly how normalized components and final totals are computed.
- Represent missing, absent, exempt, incomplete and unsubmitted separately from a genuine zero.
- Handle moderated marks, reassessment, late submission, resits, special accommodations and authorized correction history.
- Use decimal-safe calculations and tested boundary/rounding rules; do not compute official published marks with floating-point accidents.
- Support school-requested GPA, averages, proficiency/descriptor reports and raw-score reports as distinct policy modes. Never relabel a locally estimated grade as an official WAEC result.

### Exam creation and administration

- Question banks with curriculum mapping, difficulty/cognitive demand, item type, marking scheme/rubric, provenance, rights and moderation.
- Blueprints/tables of specification, balanced question selection, randomization, reusable exams, practical/oral/project assessment and accommodations.
- Internal exams, mocks, revision/practice activities, schedules, rooms, invigilators, seating, attendance and secure paper generation.
- Student online examinations with durable autosave/resume, accessible navigation, question flagging, submission evidence, controlled attempt policy and explicit offline eligibility.
- A LAN examination mode for an internet-disconnected school, and authorized device packages for appropriate lower-stakes offline activities.
- Keep answer keys out of student-delivered packages. Client clocks and local storage are not trustworthy exam security authorities. Define expiry, timers, attempt ownership, tampering signals and dispute/recovery procedures.
- Distinguish school-authorized high-stakes/online-only assessments from activities suitable for disconnected attempts. Do not claim that client-side anti-cheating guarantees exam integrity.
- Automatic objective marking, human marking for written/practical work, moderation, appeal and controlled result publication.

For externally supplied assessments, model supplier certification, instrument-specific approval identifier, approved version, validity, verification source/time and supporting records. Where the NaCASP framework applies, require verification of current provider certification and approval of the specific instrument/version before procurement or administration; an absent, expired or unverified approval is not permission to administer. Changing an approved instrument must not retain an approval claim automatically. Separate a teacher's internal draft from a distributed/commercial instrument; confirm current regulatory applicability before offering a shared assessment marketplace.

### Results and external exam support

- Draft → submit → validate → moderate → approve → publish → controlled correction workflow.
- Report cards, cumulative records, transcripts, broadsheets, SBA sheets, promotion reports, conduct/attendance and approved teacher/head comments.
- Class/subject/campus/school summaries; configurable ranking/ties or ranking disabled, subject exemptions and historical snapshots.
- JHS candidate identity/subject/language records, recognized-school/final-year eligibility under the relevant year's rules, bona fide enrollment history, required continuous-assessment records, transferred cumulative/CASS evidence, CASS preparation and official-result imports. Flag missing evidence; never fabricate scores. Distinguish a private-school pupil from WAEC's separate private-candidate entry route.
- Versioned export adapters for actual current WAEC/GES templates where available, with sample validation and traceable mapping. Do not fabricate an API, claim a CSV is accepted without checking, or label preparation as successful official submission.
- Reports available through authorized portals, secure verification links/QR where appropriate, print/PDF and permitted spreadsheet exports.

## 13. Fee structures, billing and discounts

Build a policy-driven fee engine that supports ordinary school fees and daily/weekly services without maintaining contradictory balances.

### Fee definitions and applicability

Allow admission/registration, tuition, development, examination, PTA, books, uniforms, ICT, activities, boarding, meals, water, classes, transport and any authorized custom item. Each has its own applicability, timing, accounting mapping, discount rules and approval basis. A school decides the lawful/approved charges applicable to its setting; public-school onboarding must not automatically activate a private-school tuition schedule.

Configure schedules at school, campus, category, class, section/program and individual-student level. Support inheritance with explicit precedence, effective dates and conflict detection. A specific override replaces the intended inherited rule; it must not accidentally bill both. Show a simulation and **why this student is charged this item** before publishing.

Support termly, annual, monthly, weekly, daily, selected weekdays, per-trip, per-session, once-only and installment schedules. Use school calendars, service enrollment, eligibility, proration/rounding and explicit absence/refund policy. Support one school charging water weekly and another charging it daily. Do not let one hardcoded cadence drive every service.

Fee-plan versioning must preserve invoices already issued. Provide dry-run bulk generation, duplicate prevention, approval/publishing, reminders, due dates, late-fee policies where allowed, arrears carry-forward and controlled adjustments.

### Student invoices and discounts

- Itemized student invoices, statements, installment/payment plans, credit notes, debit adjustments and sponsor billing.
- Fixed-amount or percentage discounts at fee item, selected items, invoice or student-policy level.
- Sibling, staff-child, scholarship, bursary, hardship, merit, negotiated and early-payment policies.
- Eligibility, expiry, caps, precedence, stacking/exclusivity, application order and approval limits.
- Preview the calculation. Distinguish discount, subsidy/sponsor receivable, write-off, refund and payment.
- Correct rounding allocation for an invoice-wide discount across fee lines.
- Post-invoice concessions use the appropriate credit/adjustment workflow; never silently rewrite a paid invoice or posted ledger history.
- Store actor, reason, evidence, approval and the precise rule/version applied.

## 14. Daily fees, meals, water, classes and advance payments

Deliver a fast daily-collection workspace for lunch/feeding, **breakfast**, extra classes, water, transport and custom services.

Model separately:

1. Service enrollment/entitlement.
2. Scheduled or actual charge/obligation.
3. Service delivery/usage.
4. Money received and allocation.
5. Advance/unallocated funds or receivable balance.

Support prepaid service balances and permitted credit arrangements without confusing a debt with a wallet. Specify whether a balance is restricted by student, item, school and purpose. This is an accounting balance, not automatically a regulated stored-money product.

Provide **one payment input** for an advance amount, then a visible automatic allocation across chosen days/items using a configurable strategy. Show the preview, per-item/day amounts, leftovers, arrears application and resulting balances. Permit authorized correction/reallocation and avoid consuming a service balance twice during offline use.

Handle partial-day attendance, opting out, school closure, missed service, service cancellation, refund/credit policy, insufficient funds, explicit credit limits and retroactive correction. A weekly water charge must be created once for its defined billing period, even if a student is marked present repeatedly.

Daily records and reports must distinguish **due, paid, prepaid, outstanding, served, not served, waived and refunded** by item. Lunch/feeding and extra classes cannot share one undifferentiated due/payment figure.

Cashier, teacher collector, caterer and conductor permissions must reflect assigned duties and collection limits. Build student search, class/group entry, QR/ID lookup, clear receipt printing and student/guardian views. Integrate meal counts with canteen planning and inventory without turning every attendance mark into automatic food consumption.

## 15. Payments, cashier settlement and refunds

Support cash, bank transfer/deposit, cheque with clearance status, card and mobile money through approved providers. Use **Hubtel as an initial Ghana integration**, behind replaceable provider adapters.

### Electronic payments

Use server-created payment intents, unique references, amount/currency/payer/student/invoice validation, verified provider status, idempotent posting and a receipt after the applicable confirmation. A browser redirect, uploaded screenshot or client success callback alone must not mark an invoice paid.

Implement the provider's current documented callback-authentication/status-verification mechanism; do not invent a signature header. Record immutable raw-provider event evidence with appropriate redaction, deduplicate callbacks, accept valid retries, and reconcile missing/out-of-order callbacks through supported status queries.

Track initiated, pending, verified, failed, expired, reversed, refunded and disputed states as appropriate. Distinguish payment acceptance, provider settlement, provider fees, net bank credit and school allocation. Never retry a timed-out transfer blindly.

Current public Hubtel examples are not proof that a merchant has live collection or salary-disbursement access. Inspect the actual merchant-enabled contracts, credentials, limits, verification method and settlement behaviour. Implement adapters and sandbox/contract tests while access is pending, and label live verification accurately.

### In-person collection and cashiers

- Fast student/invoice lookup, arrears/current-item selection, split allocation and multiple methods where allowed.
- Full, partial and sponsor payments; sibling/family payments with explicit allocation.
- Unidentified deposits, overpayments, advance balances, allocation/reallocation and refund requests.
- Unique school/branch/device/series-safe receipts; local offline identifiers cannot collide across cashiers. Preserve original receipt history when a final reference is assigned.
- Till/shift opening, float, cash-in/out, collection register, expected-versus-counted cash, method totals, handover and deposits.
- Cashier → supervisor/accountant settlement/verification, shortages/overages, reopen/close permissions and audit.
- **Modification requests** for corrections, reallocation, void/reversal and receipt changes with reason, before/after evidence and separate authorization.
- Controlled post-settlement correction; a cashier cannot erase a transaction to make a till balance.
- Thermal/A4 printing, email/SMS delivery where configured, reprint history and accessible receipt views.

Refunds may be full or partial and must trace original allocations, discounts, services, provider states and accounting effects. Use compensating entries and reconcile actual cash/bank/MoMo movement. Keep refund authorization separate from the person receiving cash where school policy requires it.

Enforce allocation, refund and reversal limits atomically across concurrent commands: cumulative allocations cannot exceed available funds, and cumulative refunds cannot exceed the refundable original amount. Test competing online/offline allocations and simultaneous refund requests; idempotency alone does not stop two different requests from overspending the same balance.

## 16. Full finance and accounting

Implement a real, auditable **double-entry accounting system**, integrated with all operational modules. A revenue dashboard is not a general ledger.

Required capabilities:

- Configurable chart of accounts and accounting policies, fiscal years, periods and opening balances.
- Separate books by legal entity; school/campus/department/fund/project/cost-centre dimensions and controlled consolidation.
- Immutable posted journal entries, balanced debits/credits, source-document links, posting dates, approvals and reversals.
- Student/service receivables, sponsor receivables, customer advances/unearned balances and deferred revenue where the adopted policy requires it.
- Cash/bank/MoMo/provider clearing accounts; collection fees, settlement matching and reconciliation.
- Accounts payable, supplier invoices, purchase orders, goods receipts, accruals, payments and credit notes.
- Expenses, petty cash, requisitions, reimbursement, cash advances and retirement/liquidation.
- Budgets, commitments/encumbrances where used, department allocations and variance analysis.
- Payroll liabilities, statutory liabilities, staff loans/advances and salary disbursement reconciliation.
- Inventory valuation, fixed assets, depreciation, disposal and impairment/adjustments under the selected policy.
- Donations/grants/restricted funds and projects where a school uses them.
- Bank-statement imports, matching rules, unresolved items and authorized reconciliation completion.
- Trial balance, general ledger, income/expenditure or profit/loss, balance sheet, cash flow, aged receivables/payables, fee arrears, budgets and consolidated reports.
- Drill-down from every material financial report to source documents and journal lines; all exports honor scopes and approvals.

Document journal mappings with worked examples for invoice, discount, advance payment, service consumption, receipt allocation, provider settlement/fee, refund, bad-debt write-off, procurement, stock issue, payroll and interbranch transfer. Cash collected is not automatically revenue; consuming an advance is not a second payment.

Reject unbalanced or duplicate postings. Use balanced compound entries and transaction boundaries. Period locks apply to offline replay too; route late events into an authorized adjustment process rather than rewriting a closed period. Never fix reconciliation by directly changing a balance column.

Configure applicable taxes/levies using verified, effective-dated rules and the school's actual status; do not blindly apply retail taxes to all education charges. Retain original documents and approvals under configured retention policies. Require an accountant-reviewed set of expected journals and financial statements in the final acceptance package.

## 17. HR, staff administration and payroll

Implement staff recruitment/onboarding, contracts, positions/departments, teaching/non-teaching classification, qualifications, documents, attendance/shifts, leave, holidays, performance/CPD, disciplinary records with restricted access, advances/loans, benefits and separation.

Payroll must include salary structures, recurring/one-off earnings, allowances, overtime, unpaid leave, deductions, benefits, pension contributions, PAYE, arrears/retro adjustments, final settlements, payslips and accounting entries. Use configurable residency/worker categories and verified Ghana statutory treatment where relevant.

Build **effective-dated payroll rule packs** with source links, effective periods, tax bands, pension bases/rates/limits, benefits treatment, rounding and reviewer approval. Save the exact rule version and input snapshot with a pay run. A later SSNIT/GRA update must not silently recalculate an old approved payslip.

Workflow: HR changes → payroll preview/validation → authorized review → approval/lock → disbursement instructions → pending/failed/paid reconciliation → payslips/statutory exports → period close. Preserve separate maker/checker authority according to school policy.

Support bank and MoMo disbursement adapters, including Hubtel where the merchant has the required enabled service. Build beneficiary verification, batch totals, duplicate prevention, status queries, partial failure handling, retry authorization and settlement proof. A Hubtel product announcement is not evidence of a public bulk-payroll API or live direct PAYE/SSNIT remittance.

Provide export/import paths for verified current GRA, SSNIT and Tier 2/trustee workflows. Distinguish preparing a return, paying a liability and confirmation by the authority. Where public-school staff are paid centrally, support staff records and reconciliation/import of centrally administered payroll rather than pretending the school controls the government payroll system.

Staff self-service includes profile changes, payslips, leave, attendance, documents, bank/MoMo change requests and approvals. Protect salary and identity data from ordinary staff, students and unrelated administrators.

## 18. Complete transport and fleet management

Build transport as an operational and safety system, integrated with enrollment, billing, attendance, payroll, inventory and accounting.

- Vehicle register, ownership/lease, capacity, seats, accessibility, documents, inspection/insurance/licence expiry and attachments.
- Drivers/conductors, qualifications, availability, shifts, assignments, incident records and leave cover.
- Route planning, stops, map/geocoordinates and useful Ghana landmark/address descriptions; zones, ordered stops, schedules and estimated times.
- Morning/afternoon directions, multiple trips, one-way/return subscriptions, ad hoc authorized riders and route changes.
- Student/guardian transport enrollment, stop assignment, effective dates, authorized collectors and pickup instructions.
- Capacity checks, waiting lists, seat assignments where useful, replacement vehicles and staff reassignment.
- Trip manifests, boarding/alighting, no-show, missed stop, transfer, handover and trip completion with actor/time/evidence.
- Offline conductor application, downloadable assigned manifest, durable event capture and later conflict-aware sync.
- GPS integration where enabled, last-fix timestamps, stale/offline state, parent access limited to the appropriate trip, and history/retention controls.
- Geofenced/approaching-stop alerts, delays, route interruption, breakdown and emergency communication with retry/delivery evidence.
- Authorized handover verification and end-of-trip vehicle sweep; unmatched riders and incomplete handovers remain visible until resolved.
- Fuel, odometer, maintenance schedules, work orders, parts/tyres, repairs, breakdowns, vendor costs and fleet availability.
- Fare rules by route/zone/stop/direction/distance or subscription, daily/weekly/monthly/term charging, discounts, usage-based adjustments and reconciliation.
- Trip sheets, utilization, punctuality, route costs/profitability where appropriate and safety/incident reports.
- Routing/ETA optimization with interpretable constraints; never claim an optimized route without checking school hours, capacity and pickup/handover requirements.

Provide driver-safe interaction patterns. A conductor sees assigned routes/riders, not the school's full pupil directory. When connectivity fails, record what happened locally; do not claim a parent or another device received an alert until delivery is confirmed.

## 19. Inventory, procurement, assets, library and canteen

### Inventory/procurement

Support stores/locations, item categories, SKUs/barcodes, units and conversions, opening stock, receipts, issues, returns, transfers, counts, adjustments, damaged/lost/expired stock, reorder levels and stock valuation. Include uniforms, stationery, textbooks, food, cleaning supplies, vehicle parts and other school materials.

Implement requisition → approval → sourcing/quotation → purchase order → partial/full receipt → supplier invoice/matching → payment, with returns/credit notes. Record who received/issued goods and which department/student/vehicle consumed them. Inventory and accounting must reconcile under the selected costing policy. Prevent silent overwrite of competing offline issues.

### Fixed assets/facilities

Asset register, tags, purchase/capitalization details, custodians, location transfers, depreciation, condition, maintenance, warranties, stocktake and disposal. Include room/equipment reservations, facilities defects and maintenance tasks.

### Library

Bibliographic records, copies/barcodes, member eligibility, borrowing/reservation/renewal/returns, overdue/lost/damaged items, school-configurable fines, stocktake and authorized digital resources. Integrate any billed fine with finance once.

### Canteen/POS and boarding where used

Meal plans, menus/allergy flags with restricted access, feeding entitlements, service counts, kitchen requisitions, recipe/unit consumption where useful, POS sales, receipts, stock and cash close. Add boarding/hostel rooms, beds, allocations, roll calls, leave/return and supplies for schools offering boarding.

## 20. Communications, workflow automation and support

Implement in-app, push, email and SMS through provider adapters, with school templates, audience scopes, delivery status, retries, costs/quotas and opt-out/preferences where applicable. Consider Hubtel/Arkesel/Nalo according to verified capability and school choice; do not couple the whole product to one messaging vendor.

Support notices, school calendar/events, parent-teacher communication, appointments, circular acknowledgements, consent forms, polls, complaints, support tickets and emergency broadcasts to authorized audiences.

Build a usable automation/rules designer: trigger → scoped condition → delay/schedule → action → approval if needed → execution history. Examples include absence follow-up, fee reminders, failed payment review, expiring bus documents, missing lesson plans, payroll preparation and low-stock requests.

Actions must be idempotent, tenant-scoped, cancellable where appropriate, rate-limited and observable. Support dry-run/preview, quiet hours, deduplication, escalation and timezone-aware schedules. Do not repeatedly notify a family whose payment has already reconciled. Preserve a human approval step for high-impact money, marks, disclosure and disciplinary actions.

## 21. Dynamic school websites and 1,001 templates

Every school can operate a beautiful dynamic public website, with group/campus pages where useful and secure links into the appropriate portals. Build the website engine and content system as part of the application, not as a detached static demo.

Deliver a gallery of **at least 1,001 genuinely selectable, working website template presets**, with extensibility beyond that number. Reusable sections and a schema-driven renderer are encouraged; 1,001 duplicated codebases are unnecessary. However, changing a name or colour alone does not create a substantively different template.

Each counted template must have a stable identifier, meaningful layout/section composition, supported page types, preview/thumbnail, category/style metadata, editable tokens/content and a valid renderable manifest. Track structural fingerprints and meaningful visual differences. Clearly distinguish complete templates, layout presets and palette variations; do not inflate the template count with empty cards or duplicate colour swaps.

The gallery should cover varied educational identities: early years, modern private schools, public/community schools, faith-based schools, traditional/formal institutions, arts/STEM/technical identities, inclusive schools, school groups and future higher-education presentation needs.

Build a **visual page/site builder** supporting:

- Drag/reorder sections, responsive grids, typography, colour, spacing, menus, header/footer, components and reusable design tokens.
- Deep editing of text, images/video, buttons, forms, galleries, testimonials, staff, programmes, facilities and page composition.
- Custom pages, navigation, blogs/news, admissions, vacancies, events, downloads, contact/map, policy pages and public calendars.
- Draft/review/preview/publish, scheduling, version history, autosave, rollback and staging preview by device size.
- Template switching with content mapping/backup; never discard a school's published information silently.
- School-owned custom domains and platform subdomains, certificate/domain readiness and correct tenant routing.
- SEO, metadata, sitemap, redirects, canonical URLs, structured data where suitable, accessibility and performance.
- Multilingual content and appropriate Ghanaian-language support, including editable translations.
- Branding, uploaded logos/photos, rights/provenance for supplied assets and reusable media libraries.
- Public admissions/enquiry forms connected to actual workflows, spam controls and clear confirmation states.
- Privacy/consent and publication controls for pupil photos, achievements and identifiable records.
- Analytics based on appropriate consent and school settings; public visitors must not receive tenant operational data.
- Safe extensibility/custom blocks, with no untrusted arbitrary script execution in the admin or another school's site.

Lazy-load gallery assets and preview renders. Validate all 1,001 manifests and run automated desktop/mobile render checks; add stratified visual/accessibility review and document its coverage. Template generation must be reproducible and include quality/deduplication reports. Do not claim every template has been manually reviewed unless it has.

Keep public-site publication and the management application decoupled enough that an operational outage or content edit does not expose private data. Offline editors may save drafts; public publication completes when the server confirms it.

## 22. Advanced AI and machine learning

Build useful, demonstrable AI capabilities, not static “AI insights” cards or an unrestricted chatbot bolted onto every page. Combine deterministic rules, optimization, retrieval and trained models where each is appropriate.

Implement and evaluate capabilities such as:

- Curriculum-grounded lesson planning, differentiated activities, TLM suggestions and scheme-of-learning assistance.
- Question/blueprint/rubric drafting with source mapping and human moderation; no false official-approval claims.
- Teacher-assisted marking/feedback drafts and report comments, with editable evidence and oversight.
- Learner mastery analysis, targeted practice and parent/teacher learning support appropriate to age and permissions.
- Attendance and disengagement pattern detection with explainable intervention recommendations.
- Enrollment, meal-demand, inventory and cash-flow forecasting where data quality supports it.
- Collection/anomaly detection for duplicate receipts, suspicious reversals, settlement mismatches and payroll exceptions.
- Timetable and transport/route optimization with hard operational constraints and comparisons to a baseline.
- OCR/document extraction and import mapping with confidence, human correction and a source image trail.
- Natural-language reporting that translates to validated, permission-scoped report/query contracts; no unrestricted SQL from an LLM.
- A role-aware assistant for parents, pupils and staff, answering from authorized school information with traceable sources.
- Voice/search/accessibility assistance and appropriate Twi/Ewe/other language support after quality evaluation.
- Website/admissions content assistance and translation drafts with school review.

### Data and model engineering

Maintain data contracts, feature definitions, provenance, missing-data policy, training pipelines, model/version registry, reproducible evaluation, monitoring, rollback and cost/latency metrics. Define an appropriate baseline and acceptance metric for each model. Use time-aware splits for forecasting, guard against target leakage and evaluate groups/errors relevant to the use case.

If real authorized training data is insufficient, deliver the pipeline, a clearly labelled synthetic test dataset and an honest rules/baseline mode. Do not present fabricated performance, test-on-training metrics or synthetic predictions as validated school intelligence. Any “trained model” claim requires the dataset description, training run, held-out evaluation and actual saved model artifact.

RAG must filter tenant/role/relationship access **before retrieval**, including vector stores, caches and citations. Treat uploaded documents and retrieved content as untrusted data, not instructions. Add prompt-injection and data-exfiltration tests. Tools exposed to AI use the same domain authorization, validation and approval rules as the UI.

Keep school-specific models/embeddings and private records isolated. Cross-school training or use of child data for an external provider requires an appropriate documented data-use basis and explicit controls; it must not happen silently. Define retention, provider configuration, deletion/export handling and operational logs without copying pupil PII into routine telemetry.

Human review governs published grades, admissions decisions, disciplinary action, sensitive disclosures, fees/write-offs and payment execution. A risk score is a support signal, not an automatic reason to penalize a pupil or exclude a family.

Support provider abstraction, deterministic fallback, disabled/opt-out modes, per-school limits and useful offline behaviour. Cache authorized references, run suitable small local models/rules where practical, and queue cloud-only requests honestly. Do not pretend a cloud model is available offline or download a large model without a visible resource decision.

## 23. Cross-platform delivery and user experience

Deliver functioning **web/PWA, Windows, macOS, Android and iOS** clients using shared API/domain contracts and appropriate platform interfaces. A responsive website alone does not satisfy the native-platform requirement, and an uncompiled shell is not a verified native application.

Provide installers/build outputs where the environment permits, platform-specific CI jobs, signing/notarization/store configuration instructions and truthful verification status. iOS/macOS compilation/signing requires the appropriate Apple toolchain/accounts; do not claim signed release artifacts without actually producing them. Make unsigned/test builds and release prerequisites explicit.

All relevant roles must be able to complete their appropriate tasks on their intended devices. Optimize phone flows for parents, teachers and conductors; optimize cashier/accountant desktop flows for speed, keyboard entry and printing. Share design tokens and behaviour, not awkward identical layouts on every screen.

Design requirements:

- A distinctive, polished design system with large readable text, coherent spacing, clear hierarchy and accessible contrast.
- Mobile-first forms and task-focused cards; usable tables with purposeful responsive behaviour.
- Collapsible navigation, keyboard access, useful search/command actions, visible focus and pointer cursors for interactive controls.
- Consistent field labels/value spacing; clean single-row filters/actions on desktop and an orderly mobile layout.
- Clickable date controls, reliable dropdown layering, correct modals/drawers and logical focus return.
- Add/edit forms with matching capabilities, meaningful defaults, validation, unsaved-change protection and no simultaneous conflicting forms.
- Upload/camera/file selection for avatars/logos/documents; do not force users to type URLs for ordinary files.
- Clear loading, empty, validation, error/retry, denied, offline, pending-sync and conflict states.
- Search/filter/sort/pagination and permitted CSV/XLSX/PDF/print exports where useful, retaining current filter/scope context.
- Appropriate bulk actions with preview/confirmation/audit, undo or reversible archive where practical.
- Localized amounts/dates and readable receipt/report layouts; support dark/light/system themes if they remain accessible.
- Useful help/onboarding and plain-language labels; keep backend/deployment implementation details out of normal school workflows.

Test touch, keyboard, screen readers, slow devices/networks, screen resizing, rotated screens, print and native permission denial. No dummy success messages, hidden mock APIs or hardcoded chart values in production.

## 24. Platform administration and SaaS operations

Provide customer onboarding/provisioning, tenant lifecycle, organization/school/campus management, configuration defaults, module entitlements, deployment/schema status, storage/AI/integration usage, device/edge health and customer support.

Implement plan/licensing infrastructure and an **optional** platform subscription lifecycle so the business can choose subscription, annual licence, managed/private deployment or another commercial offering. Design this independently for School ERP, record commercial assumptions and keep the business model configurable.

Platform subscription ledgers and merchant settlement must remain separate from school/student accounts. Trial/expiry/overdue handling should be explicit and configurable, with read/export and sensible offline grace rules. A school should not lose historical records or child-safety functions because a subscription state changes without a planned policy.

Support support-ticket escalation, tenant-scoped diagnostics, audit of operator access and time-limited delegated support. Do not give platform staff unrestricted silent access to learner marks, health files, payroll and bank details. Include backup restore requests, data export, incident handling and offboarding.

## 25. Security, privacy and governance

Implement least privilege, secure session lifecycle, rate limiting, credential protection, CSRF/XSS/SSRF/injection controls, secure uploads, dependency updates and audited admin actions. Secrets belong in protected environment/secret stores, not source, generated files, frontend bundles or screenshots.

Model actual controller/processor responsibilities, school privacy contacts, DPC registration evidence, processing purposes, notices, retention, consent/authority where applicable, data requests, corrections, export and lawful deletion/archival. Obtain a Ghana-specific privacy review; a technical checklist is not a certification of legal compliance.

Apply strict child/guardian relationship scopes, restricted health/safeguarding access, protected salary records, encrypted transport and appropriate at-rest/local protection. A guardian's portal access is not unlimited access to another guardian's personal data. Public school websites publish only approved public fields.

Audit high-impact events with actor/membership, scope, device, time, source, reason and changes. Keep audit content readable and protected against ordinary mutation. Avoid copying entire sensitive payloads into logs. Apply retention and access rules to backups, exports, AI traces and offline replicas as well as the main database.

Complete a threat model covering cross-tenant access, guardian linking, hostile offline devices, stale permissions, payment/webhook replay, malicious imports, exam leakage, public-site content, AI retrieval and support impersonation. Verify security behaviour with executable tests and remediation evidence.

## 26. Reporting and analytics

Build role-scoped dashboards, report filters, scheduled reports and a controlled report builder. Cover enrollment/admissions, attendance/punctuality, curriculum/lessons, SBA/results, promotion, arrears/collections/daily services, cashier settlement, finance/statutory preparation, payroll/HR, fleet/trips, inventory/procurement/assets, library, wellbeing and website/admissions conversion.

Provide school/branch/category/class/student and permitted group comparisons. Distinguish school academic periods from accounting periods and collection business dates. Show the period, filters, data freshness and whether offline/unreconciled work is included.

All totals must reconcile to operational records and the ledger as appropriate. Reports must not silently count cancelled documents, duplicate callbacks, withdrawn students or unscheduled school days. Keep historical policy snapshots and drill-down evidence. Provide accessible charts and usable CSV/XLSX/PDF/print output with permission-aware export logging.

## 27. Fresh setup, school data onboarding and portability

The application must install and operate fully from empty databases. No earlier application, source code, database dump, migration project or legacy parity matrix is required to build or accept School ERP.

Provide a guided fresh-school setup, useful configuration presets, fabricated demonstration schools and resettable non-production seed data. Every module must be usable through its own setup screens and workflows rather than requiring a data import.

Also build ordinary product-level CSV/XLSX import and export tools so a future customer can bring authorized school records into the new system. These are onboarding capabilities, not instructions to build on the previous iEduPro application. Any source-specific migration adapter is a separately scoped future integration if the owner later supplies and authorizes a source.

Provide documented import templates for students, guardians, enrollment, staff, subjects, opening balances, inventory and appropriate historical marks. Support column mapping, preview, validation, duplicate checks, sanitized fixtures, row-level errors, batch IDs, idempotent/resumable processing and rollback/reconciliation. Protect relationship, scope and policy-version integrity. Separate feeding/lunch and extra-class obligations/payments by service; never turn an ambiguous imported total into invented money.

Name splitting must preserve the original full name and route ambiguous multi-part names to review; do not pretend the middle token is always a middle name. Reconcile missing/duplicate persons and relationship IDs without silently reassigning a child.

Export complete authorized customer records in documented usable formats for audit, backup, portability and offboarding. Test a round trip using fabricated data without requiring any previous project's schema or code.

## 28. Infrastructure, deployment and reliability

Prepare reproducible local development, CI/test and staging environments with migrations and non-sensitive seeds. Include native-client build jobs and integration contracts. Design separately named deployment resources for School ERP and confirm hosting capacity before deployment; do not assume an old application's database, service, path, domain or port belongs to this project. Leave existing services untouched.

Provide appropriate Nginx/reverse-proxy, process/service management, TLS, worker scheduling, environment templates, health/readiness probes, structured logs and alerts. Supply Docker-based development and/or native service deployment assets appropriate to the chosen production architecture. Avoid imposing Kubernetes or a large microservice estate without a clear operational reason.

Backups must cover tenant/control databases, object storage, configuration and required keys. Define recovery objectives, encrypted/offsite storage, restore drills, tenant-level restore and point-in-time recovery where supported. Test that a restored tenant cannot leak or overwrite another tenant and that old offline commands are handled safely after restore.

Provide migration canaries, rollback/forward-fix strategy, app/DB compatibility, edge updates, school-hours scheduling, no-data-loss restart behaviour and job recovery. Monitor API/database/queue health, sync lag, edge availability, backup freshness, payment reconciliation and critical business exceptions.

Set and test performance budgets on a declared reference environment. Suggested initial targets: responsive local attendance/cashier interaction, p95 under 500 ms for ordinary connected reads at agreed load, and asynchronous generation for large reports. Replace guesses with measured budgets covering realistic student counts, concurrent collectors, attachments and reconnect bursts. Record baseline, test method, hardware and actual results.

## 29. Implementation sequence — keep going until the product is complete

Create a requirements traceability matrix and a dependency-aware implementation plan in the repository. Use phases to organize work, not to reduce the agreed final scope or require a new user prompt after each phase.

Recommended sequence, adaptable after initial research and greenfield architecture design:

1. Check out `christianagbotah/school-erp` in a fresh School ERP workspace, verify its remote and initial history, research requirements, choose the stack, and document the new architecture and release plan.
2. Tenant routing/provisioning, identity/scopes, audit, data protection and real local/edge sync foundations.
3. School structure, people/admissions/enrollment, academic periods, student/guardian portals.
4. Fee engine, daily services, discounts, advances, accounting primitives and cashier/payment vertical slices.
5. Attendance, Teaching Studio, curriculum packs, SBA/exams/results and learner activities.
6. Procurement/inventory/assets/library/canteen/boarding, HR/payroll and complete finance controls/reports.
7. Full transport/fleet/driver/conductor/guardian journeys.
8. Communications/automation, website CMS/builder and the 1,001-template gallery.
9. AI capabilities/pipelines, remaining platform operations, cross-platform parity, school-data onboarding/export verification and reliability hardening.
10. Full end-to-end UAT, independent reviews, review package for Codex and correction rounds.

Deliver vertical slices with real persistence and offline behaviour early. For example, parent payment must reach provider verification, one ledger effect, cashier/accountant visibility and a receipt; it is not finished when a “Pay” button opens a modal.

Use parallel engineering/research if your environment supports it, with clear ownership and integration checks. Prevent overlapping implementations, interface drift and agents repeatedly rewriting the same files.

Keep durable project state: source commit/branch, requirements matrix, decisions, migrations applied, actual tests, blocked external prerequisites, next actions and continuation instructions. If the execution environment/session ends, leave a precise resumable checkpoint rather than claiming the project is complete. On resumption, inspect state and continue the plan without restarting the project.

When a phase passes its relevant checks, automatically start the next phase. Do not wait for the owner or Codex to approve each development milestone. Codex's final review is for the complete release candidate; use internal verification and defect correction to keep progressing toward it. Before a handoff, push the current safe checkpoint, verify the remote SHA and record the first unfinished task so the next execution resumes immediately.

## 30. Definition of done and truthful reporting

### Enterprise-grade and production-ready delivery contract

“Enterprise-grade” and “production-ready” describe demonstrated behaviour, not a UI style or a label. The completed release candidate must satisfy all of the following:

1. **Complete full-stack workflows:** every required module and portal works end to end against real persistence and domain services, with no placeholder actions, hidden mock backends or unfinished manual engineering steps.
2. **Financial and academic integrity:** double-entry journals reconcile, concurrent allocations/refunds are bounded, provider events post once, and marks/SBA/publication preserve source evidence and approved policy versions.
3. **Secure customer separation:** tenant/branch/relationship authorization, least privilege, session/device controls, protected uploads, privacy boundaries and audit trails pass positive and adversarial tests across every channel.
4. **Operational offline reliability:** disconnected devices and school LAN/edge operation survive restarts, conflicting work, reconnect bursts, stale authority, version upgrades and recovery without silent data loss or duplicate business effects.
5. **Maintainable implementation:** clear module contracts, schema constraints, repeatable migrations, pinned dependencies, useful error handling, code review and meaningful automated tests support continued development.
6. **Measured performance and scale:** test realistic multi-school workloads, report/queue behaviour, connection limits, native/local responsiveness and recovery bursts against declared budgets. Record measured results and remediation.
7. **Deployable and recoverable operation:** a clean environment can build, migrate, seed, start and operate the system using the documented tooling; monitoring, backup/restore drills, incident diagnosis and upgrade/rollback procedures are verified.
8. **Usable cross-platform product:** all required roles can complete their intended web/native tasks with accessible layouts, clear error/offline states, correct printing/files and appropriate device permissions; platform build/test status is evidenced.
9. **Verified integrations and AI:** actual provider contracts and reconciliation are tested to the access level available; model claims have reproducible evaluation, privacy isolation, human oversight and useful fallbacks.
10. **Reviewable release:** complete source and documentation are pushed to the required GitHub repository, CI/check results and exact remote commits are recorded, and all defects/external prerequisites are visible in the Codex Review Package.

Resolve release-blocking defects before presenting the product as production-ready. Source-only clients, unrun critical tests and unverified live dependencies remain explicitly blocked items; they do not become passing evidence because documentation was written. Build and validate in production-like staging throughout development. Actual live release follows the final review/authorization process in section 32, without requiring intermediate approval to continue normal implementation.

Track every module with evidence-based states such as:

**Planned → UI only → API/data/workflow implemented → integration verified → offline verified where applicable → cross-platform verified → release candidate reviewed.**

Use an explicit `NOT RUN` or `BLOCKED: prerequisite` where evidence is missing. Do not call source-only Flutter files a working iOS app, written tests passing tests, a mock integration live integration, an accessible homepage a complete product, or a source archive a deployed system.

For each completed workflow provide:

- Working permission-scoped UI and API, constraints, migrations and background/integration effects.
- Useful positive and negative validation, error/recovery behaviour and audit.
- Offline/local durability and reconnection evidence where applicable.
- Seed/demo scenario and automated or documented UAT evidence.
- Correct reports/exports and cross-module reconciliations.
- No remaining placeholder action or hidden fake data in the production path.

Missing merchant credentials, Apple signing access, a regulator template, representative real training data or a production toolchain are real external prerequisites. Complete independent code/contract tests and list the exact remaining verification. Do not hide the limitation, block unrelated work, or enable a fake success path to make a dashboard green.

## 31. Mandatory acceptance scenarios

Create executable acceptance coverage and repeatable human walkthroughs for at least the following. Use fabricated demo schools/persons, not a copied production pupil directory.

### Tenancy and authority

1. Provision independent Schools A and B into separate databases; two branches of A share A's database with correct scope/consolidation.
2. A user cannot read, mutate, export, retrieve through AI, receive a notification from or sync B's data by changing identifiers, cursor, hostname, attachment key or queued command.
3. Parent sees linked wards only; teacher sees assigned classes/subjects; conductor sees assigned routes; cashier sees the correct till/collection scope; auditor cannot post.
4. Connection reuse, background jobs, expired roles, school switching and support access preserve isolation.
5. Move a test tenant between approved database assignments with preserved IDs, validated records, safe cursor/rebootstrap behaviour and documented rollback.

### Fees and finance

6. Configure category-level tuition, a class override and a student concession; preview and generate invoices once with the expected inheritance.
7. Apply item/invoice percentage and fixed discounts, a scholarship and a post-payment concession; expected receivables and journals reconcile.
8. Charge water once weekly while lunch is daily and transport per subscribed direction; repeated attendance generation creates no duplicates.
9. Enter one advance amount and allocate it across days/items, leaving a visible balance. Reverse/cancel one service without duplicating funds or revenue.
10. Preserve separate feeding and extra-class dues/payments; reconcile fabricated data-entry/import fixtures by student, item, due and payment without requiring any previous application's columns.
11. Accept cash offline on two devices with unique receipts; restart both; replay their commands repeatedly; reconcile one business effect per actual receipt.
12. Process duplicate/delayed/out-of-order provider callbacks, a browser success without verification, an amount mismatch and a provider timeout; never incorrectly mark paid or execute a duplicate transfer.
13. Handle partial payment, family allocation, unallocated deposit, overpayment, provider fee/settlement, partial refund and correction after cashier close.
14. Complete cashier count/handover/settlement with shortage and approval, and trace the final balance to cash/bank/MoMo clearing and GL.
15. Close a financial period, then replay an old offline entry and refund; use the controlled adjustment path with balanced journals.

### Academics and care

16. Produce KG observation/progress records without a forced end-term timed exam; create valid primary and JHS assessment profiles separately.
17. Enter SBA raw marks with a missing mark, zero, exemption, absent learner, rounding boundary and teacher conflict; moderate, publish and correct through authorized history.
18. Generate report/broadsheet totals from saved policy versions, retain raw JHS/CASS data and keep official external results distinct from estimates.
19. Draft/review/deliver a curriculum-linked lesson offline; reconnect without losing notes or approving a draft silently.
20. Take an eligible school/LAN/offline exam, terminate/restart mid-attempt, preserve answers and submission evidence, and reject unauthorized expiry/attempt/key access.
21. Recompute attendance correctly for holidays, sick-at-home/clinic, late admissions, withdrawals and shifts; verify guardian notification and access scope.

### Operations and platforms

22. Run a bus trip offline, log boarding/alighting and a handover exception, show stale GPS honestly, reconcile events and complete a vehicle sweep.
23. Complete requisition/purchase/partial receipt/issue/return, stock count and accounting reconciliation with a competing offline issue.
24. Calculate an approved Ghana payroll fixture under a versioned rule pack, process a partial disbursement failure, and reconcile payslip/statutory liabilities without double payment.
25. Demonstrate each primary role's meaningful journey on its intended web/native platforms with real persistence, permitted printing/files and error recovery.
26. Render all 1,001 distinct valid website presets, customize a site, publish a confirmed version, switch/restore safely and prove public pages cannot reveal operational pupil data.
27. Install into empty databases and complete fresh-school onboarding. Import a fabricated CSV/XLSX batch twice safely; reconcile names, enrollment, balances and marks; recover a failed batch and verify authorized export without an old application dependency.

### Resilience and AI

28. Survive 72 hours disconnected, app/process restarts and reconnect bursts; recover durable queued work with understandable conflict resolution.
29. Handle slow/flapping connections, partial sync, crash between server commit and acknowledgement, out-of-order commit sequences, schema upgrades and tombstone retention expiry without skipped/duplicate effects. Partition cloud and edge while each is reachable by different clients; attempt concurrent collection/advance consumption and authority handover. Prove stale authority cannot finalize competing postings and all actual cash receipts remain recoverable for reconciliation.
30. Revoke a device/change teacher or guardian access, then reconnect; reject unauthorized posting, preserve denied cash/handover evidence for restricted resolution, and apply the scope-removal/local cleanup policy safely.
31. Demonstrate an actual backup restore and recovery of queued work under the documented restore/authority policy.
32. Evaluate each claimed ML model against a declared baseline on held-out data; test AI tenant leakage, fabricated citations and prompt injection; show a useful provider-offline fallback.

These scenarios supplement normal unit, integration, security, accessibility, UI and performance coverage. They do not replace exploration by Ghanaian school staff, an accountant and representative guardians/teachers/cashiers/conductors.

## 32. Required handoff to Codex for independent review

Before production, deliver a reviewable release candidate and a **Codex Review Package** containing:

1. Repository URL, branch, exact pushed commit SHA, tags and clean reproduction instructions.
2. Product/module inventory and requirements-to-code/test traceability, clearly distinguishing incomplete or externally blocked items.
3. Updated architecture documents/ADRs, ERDs, authority boundaries, API specification and state transitions.
4. Tenancy/database routing, provisioning, isolation, fleet migrations, backup/restore and customer mobility evidence.
5. Offline protocol, role/platform capability matrix, edge deployment, conflict rules, security/lease policy and real outage/recovery evidence.
6. Ghana curriculum/assessment packs, research register, policy conflicts and educator-review findings.
7. Fee/daily-service/discount/advance rules, worked journals, expected accounting fixtures and accountant-review findings.
8. Payment/payroll integration contracts, sandbox/live verification status, reconciliation evidence and remaining merchant/provider prerequisites.
9. Native/web build artifacts or exact unrun build steps/prerequisites; platform-specific test results and signing/store status.
10. Empty-database installation/fresh-school setup evidence, import/export templates, fabricated fixtures, reconciliation outputs and recovery evidence.
11. Website builder/template manifests, valid-template count, deduplication and render/accessibility evidence.
12. AI model/data documentation, training artifacts, evaluation, privacy boundaries, cost/fallback behaviour and real limitations.
13. Security/privacy threat model, scans and remediation, role matrix, audit examples and incident/readiness notes.
14. Exact commands and unedited result summaries for tests/builds, with dates, environment, failures, skips and `NOT RUN` items.
15. Seeded demonstration environment, every role's walkthrough and securely delivered non-production test-account setup.
16. Deployment/operations runbooks, monitored performance, backup recovery objectives and release/rollback checklist.
17. A prioritized defect/limitation register; known gaps must not disappear behind a percentage-complete claim.

Push all implementation and review documentation to **https://github.com/christianagbotah/school-erp.git**, following the mandatory Git workflow in section 2. Do not leave the result only in a temporary Z.ai sandbox. If write access is unavailable, preserve the local commits and a complete source package with checksums and clearly state that it is not pushed; never substitute another repository or invent a remote commit.

Codex will examine architecture, security, offline correctness, financial invariants, Ghana education behaviour, native builds and end-to-end operations, then supply corrections. Apply those corrections and rerun the relevant checks until the release candidate is accepted. **Do not deploy over live school operations, migrate a production database or declare production approval before this review and the owner's final release authorization.** Local and staging work should continue autonomously within the task.

## 33. Start now and keep ownership

Begin by checking out **https://github.com/christianagbotah/school-erp.git** into a fresh `school-erp` workspace and verifying its fetch/push remote. Initialize the new application there, report the selected stack, save the plan/requirements matrix and implement the first complete vertical slice branded **iEduPro**. Commit and push all progress to this repository. Continue through the entire basic-school product, making justified improvements and adding useful features beyond this brief. Do not resume the previous iEduPro codebase or its unfinished tasks.

Own the delivery as a full-stack developer through the finished enterprise-grade release candidate. Keep building, testing, correcting, committing and pushing without stopping between phases or waiting for repeated continuation instructions. The intended final handoff is the complete verified application and Codex Review Package, with any genuine external prerequisites identified precisely.

Do not respond only with another proposal. Do not stop after listing technologies, creating a dashboard, generating database models or passing a frontend build. Build, integrate, verify, document and prepare the full review package. Keep the work resumable and the status honest.

## 34. Official research starting register and evidence limitations

These sources were located/reviewed for this brief on **29 October 2026**. Some official origins intermittently timed out while their indexed documents remained discoverable. Fetch and validate the actual applicable document/version during implementation. This is a grounded starting brief, not a claim that every subject document or legal obligation has already been audited.

| Source | Official URL | Use and verification note |
|---|---|---|
| NaCCA curriculum development/structure | https://nacca.gov.gh/curriculum/ | KG/primary/JHS structure; treat older implementation notes as historical where superseded. |
| NaCCA standards-based curriculum downloads | https://nacca.gov.gh/learning-areas-subjects/new-standards-based-curriculum-2019/ | Subject/grade curricula; import explicit versions, not one universal subject list. |
| NaCCA KG curriculum | https://nacca.gov.gh/wp-content/uploads/2019/06/KG-Curriculum.pdf | Integrated KG learning, content standards and indicators; confirm newer assessment tools. |
| NaCCA KG teacher resource pack | https://nacca.gov.gh/wp-content/uploads/2019/06/Teacher-Resource-Pack-KG.pdf | Observation-based KG assessment; see printed p.25 for the paper-and-pencil examination distinction. |
| NaCCA primary teacher resource pack | https://nacca.gov.gh/wp-content/uploads/2019/06/TEACHER-RESOURCE-PACK-P1-P6.pdf | Lesson planning and scheme/indicator links; printed pp.37–38 discuss lesson phases. |
| NaCCA CCP downloads | https://nacca.gov.gh/common-core-programme-ccp/ | B7–B9 learning areas and subject documents. |
| NaCCA CCP English curriculum | https://www.nacca.gov.gh/wp-content/uploads/2023/06/ENGLISH-LANGUAGE.pdf | A 2021 curriculum document; printed pp.xxi–xxii illustrate why proficiency profiles need a documented stage/version. |
| NaCCA national assessment framework | https://nacca.gov.gh/wp-content/uploads/2025/11/National-Pre-Tertiary-Learning-Assessment-Framework_-24062020.pdf | The document is from 2020 despite the upload path. Compare stage-specific descriptors with later tools/circulars. |
| WAEC current BECE school information | https://waecgh.org/home/bece-school/ | BECE components and current subject overview; check annual notices for actual dates and procedures. |
| WAEC BECE guidelines effective from 2024 | https://waecgh.org/wp-content/uploads/2024/05/2024-BECE-GUIDELINES-SCHEME-AND-STRUCTURE.pdf | Regulations, CASS and examination scheme; inspect current amendments/templates before export/submission work. |
| WAEC candidate registration statement, 27 March 2024 | https://waecgh.org/2024/03/27/press-statement-on-the-registration-of-candidates/ | School-candidate eligibility, transfer/CASS evidence and identity validation; confirm current annual requirements. |
| NaCCA assessment-service framework, 2026 | https://nacca.gov.gh/nacasp/guidelines.html | Provider certification and instrument approval are distinct; record applicability/version/verification, including for external assessment services. |
| NaCCA August 2026 notice landing page | https://nacca.gov.gh/use-of-unapproved-assessment-items/ | Original notice is image-based and was not fully extracted here; retrieve the original before relying on its exact wording. |
| MoGCSP revised ECCD policy | https://www.mogcsp.gov.gh/mdocs-posts/early-childhood-care-development-eccd-policy/ | Official policy posting; policy year 2025, posted in 2026. |
| MoGCSP ECCD policy launch | https://www.mogcsp.gov.gh/securing-childrens-tomorrow-today-ghana-launches-revised-eccd-policy/ | Wider developmental context; not a formal grade/subject list. |
| Government-authored ECCD policy at UNICEF | https://www.unicef.org/ghana/documents/early-childhood-care-development-eccd-policy | Accessible policy reference and child-development context. |
| MoGCSP/UNICEF ECCD standards, 2018 | https://www.unicef.org/ghana/media/2031/file/Early%20Childhood%20Care%20and%20Development%20Standards.pdf | Guidance for ages 0–3; printed pp.3–4 and 19–25 distinguish supportive developmental monitoring from admission/reward/sanction decisions. |
| NaSIA licensing and FAQ | https://www.nasia.gov.gh/school-licensing/ ; https://www.nasia.gov.gh/faq/ | School regulation and nursery distinction; older/newer renewal descriptions differ, so use actual applicable documents/certificate dates. |
| MoGCSP Social Welfare | https://www.mogcsp.gov.gh/department-of-social-welfare/ | Early-care/day-care oversight context; verify relevant local authority requirements. |
| Ghana DPC compliance | https://dpc.gov.gh/compliance/ | Controller/processor governance, privacy and security readiness. |
| Data Protection Act 2012, Act 843 | https://dpc.gov.gh/wp-content/uploads/2025/05/Data-Protection-Act-2012-Act-843.pdf | Child/health-data and processing safeguards; obtain applicable professional review. |
| GRA PAYE | https://gra.gov.gh/domestic-tax/tax-types/paye/ | Employer/payroll treatment; validate effective periods and relevant amendments. |
| SSNIT employer obligations | https://www.ssnit.org.gh/become-an-employer/ | Pension administration, reports and remittance records. |
| SSNIT 2026 insurable-earnings notice | https://www.ssnit.org.gh/wp-content/uploads/2026/01/Public-Notice-Min-Max-Insurable.pdf | Evidence that payroll bases/limits change with effective dates. |
| NPRA contribution guidelines | https://npra.gov.gh/assets/documents/Guidelines-for-the-payment-of-contributions.pdf | Tier 2 contribution/reporting workflow; verify applicability/current amendments. |
| Hubtel developer portal | https://developers.hubtel.com/ | Collections/transfers and current merchant documentation entrypoint. |
| Hubtel official checkout SDK | https://github.com/hubtel/hubtel-web-merchant-checkout-sdk | Checkout integration reference; not proof of a live salary/statutory-remittance API. |
| Flutter supported platforms | https://docs.flutter.dev/reference/supported-platforms | Verify selected SDK/OS targets and platform build toolchains. |
| Browser Background Synchronization API | https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API | Browser availability is limited; foreground/manual sync must also be correct. |

For later SHS/TVET/tertiary expansion, research the applicable NaCCA secondary frameworks, CTVET qualifications/competency-based assessment, GTEC/institutional requirements and each institution's own credit/grading/examination regulations. Do not assume university programmes share one GES curriculum or that extending a class-number enum implements higher education. Keep extension contracts for courses/programmes, credits/contact hours, prerequisites, registration, semesters, industrial attachment and institution-specific assessment, while completing the basic-school workflows above first.

## END MASTER PROMPT
