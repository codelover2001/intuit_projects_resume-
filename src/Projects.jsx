import React, { useState, useMemo, useEffect, useRef } from 'react';

/* ============================================================================
 * PROJECTS DATA
 * ============================================================================
 * Comprehensive record of engineering work — designed for interview prep
 * (recruiter, HM, and bar-raiser rounds). Each project carries:
 *   - elevator pitch (one line)
 *   - 90-second narrative (memorize the structure, not words)
 *   - problem, solution, technical depth, impact
 *   - signature "killer answer" for the hardest-part question
 *   - grill questions interviewers will probe
 *   - what NOT to say (positioning landmines)
 * ========================================================================== */

const PROJECTS = [
  {
    id: 'traffic-replay',
    tier: 1,
    year: '2023 — Present',
    company: 'Intuit · QuickBooks Desktop Payroll Platform',
    title: 'Traffic Replay & Validation Framework',
    role: 'Designer & Lead Engineer',
    tags: ['Distributed Systems', 'Reliability', 'Observability', 'Platform'],
    oneLine:
      'Production-scale shadow traffic system that validates functionality, data, performance and stability without touching customers.',
    headline: {
      scale: '$270B/yr money movement',
      users: '~100K daily customers',
      replayed: '300M+ requests replayed',
      coverage: '90% automated regression',
    },
    narrative: `I worked on the QuickBooks Desktop Payroll platform, which moves about $270 billion per year and serves around 100K customers daily. It's a large legacy monolith with hundreds of workflows, and even small regressions can cause serious business impact. We were planning major changes like a 32 TB Oracle-to-Postgres migration and large refactors, but there was no reliable way to validate real customer behavior at production scale before releasing.

The core problem was that traditional testing and manual regression couldn't realistically cover production traffic patterns or scale. I took ownership of designing a framework that could validate functionality, data correctness, performance, and stability using real customer traffic — without ever impacting customers.

I designed a parallel setup inside the production cluster where real customer traffic is safely mirrored to a passive replica of the application and database. The production system continues serving users normally, while the parallel system replays the same traffic and validates responses, data mutations, and performance.

The key challenges were safety, data security, correctness, and scalability — ensuring downstream writes were mocked, sensitive data was encrypted, and variable fields were intelligently ignored during comparison. I also built support for replaying traffic at 2× or 3× load to test system stability during peak scenarios.`,
    problem: [
      'Legacy monolith with 1.8M LOC, 600+ workflows, mission-critical batch + bizops reports.',
      'Unit and integration tests could not capture real production behavior, edge cases, or traffic shape at scale.',
      'High-risk changes (DB migrations, refactors) needed validation against real customer traffic without risk to customers.',
      'No single framework existed for automated functional, performance, data, and stability validation at production scale.',
    ],
    architecture: [
      {
        name: 'Traffic Capture Sidecar',
        detail:
          'Sidecar container in the production pod. Nginx terminates TLS, GoReplay captures decrypted HTTPS, re-encrypts before forwarding. ~10% CPU/mem overhead. No application code changes.',
      },
      {
        name: 'Parallel Application Server',
        detail:
          'Exact replica of production in the same cluster, connected to a weekly-refreshed cloned database. Invisible to customers — production continues serving real traffic.',
      },
      {
        name: 'Mock Downstream Writes',
        detail:
          'Envoy proxy + Wiremock intercept downstream writes from the parallel server. Reads pass through. This bounds blast radius to zero.',
      },
      {
        name: 'Event Bus',
        detail:
          'Request and response carry a correlated transaction ID used as partition key — guarantees ordering and request/response pairing per partition.',
      },
      {
        name: 'Replay Validator Middleware',
        detail:
          'Consumes from bus, replays on parallel server, captures response, persists request/response pairs encrypted at rest, runs response + data + performance validators.',
      },
      {
        name: 'Data Validator (BFS)',
        detail:
          'Per workflow config maintains impacted tables. BFS over FK relationships scoped by tenant_id + parent_record_id + bounded time window. Ignores non-deterministic fields (IDs, timestamps).',
      },
      {
        name: 'Performance Validator',
        detail:
          'TP90 / TP95 / TP99 calculations per workflow. Logs to Splunk/ELK for analysis. Slow workflows surfaced before release.',
      },
      {
        name: 'Load Replay',
        detail:
          'Stored traffic can be replayed at 0.5× / 2× / 3× for stability testing under peak — fully async, decoupled from production rate.',
      },
    ],
    impact: [
      '~300M OLTP requests replayed (peak ~3M/day).',
      '90% automated functional + performance validation during Oracle Exit.',
      '30+ performance and 20+ functional issues caught pre-release.',
      'De-risked 32 TB Oracle → Postgres migration with zero P0/P1 issues — largest unsharded migration in South Asia Pacific per AWS SME.',
      '70+ incremental smooth releases enabled.',
      'Hibernate 3.x → 5.x upgrade validated with framework — saved 200+ manual regression hours.',
      'Adopted as a paved path across the org for Java 11, Spring Boot, and library upgrades.',
    ],
    killerAnswer:
      "I'm most proud of this project because it sits at the intersection of engineering rigor and customer trust. The best reliability work is invisible to users, but it prevents real pain at scale. This project fundamentally changed how teams shipped software, and knowing that millions of customers never experienced failures because of it is what makes it meaningful to me.",
    grillQuestions: [
      {
        q: 'Why capture traffic at the sidecar instead of in application code?',
        a: 'Sidecar keeps app code untouched. Zero risk of introducing latency, bugs, or behavior changes in a mission-critical monolith. Capture can be rolled out or rolled back independently.',
      },
      {
        q: 'How did you handle HTTPS securely?',
        a: 'TLS terminated at an Nginx layer inside the pod. GoReplay captures decrypted traffic. Re-encrypted before forwarding. All captured data encrypted again before reaching the bus and at rest.',
      },
      {
        q: 'How did you guarantee request-response pairing?',
        a: 'Transaction ID used as the partition key. Request and response always land on the same partition in order, consumed by the same validator.',
      },
      {
        q: 'How did you prevent replay from corrupting downstream systems?',
        a: 'All downstream writes from the parallel server were intercepted and mocked via Envoy + Wiremock. Only reads passed through. Zero side effects, full upstream validation.',
      },
      {
        q: 'How did you avoid false positives in response/data comparison?',
        a: 'Normalized responses by ignoring non-deterministic fields (IDs, timestamps). Data comparison scoped by tenant_id + parent_record_id + bounded time window, traversed via BFS over FK relationships per workflow config.',
      },
      {
        q: 'What broke first under scale?',
        a: 'Validator CPU and message throughput. Fixed by partitioning workloads, horizontal scaling consumers, and optimizing comparison logic.',
      },
      {
        q: 'What happens if the replay system goes down?',
        a: 'Nothing customer-facing. Production traffic continues unaffected. We only lose validation coverage temporarily.',
      },
      {
        q: 'Why not dual writes instead?',
        a: 'Dual writes introduce transactional coupling, latency on the critical path, and idempotency issues at downstreams. Replay keeps prod isolated and validation asynchronous.',
      },
      {
        q: 'Should every company build this?',
        a: 'No. Only when cost of failure is extremely high and production behavior is too complex to simulate otherwise. Otherwise it is overengineering.',
      },
      {
        q: 'What would you redesign?',
        a: 'Invest earlier in multi-tenant middleware to reduce per-team infra cost and a better diff visualization layer to lower onboarding friction.',
      },
    ],
    landmines: [
      'Do NOT lead with tools (GoReplay, Nginx). Lead with business risk.',
      'Do NOT say "negligible overhead" — you measured it (~10%).',
      'Do NOT claim "just me" — credit infra/QA/service owners while owning the design.',
      'Do NOT say "nothing broke" under scale. Battle scars build credibility.',
    ],
  },

  {
    id: 'cms-migration',
    tier: 2,
    year: '2024',
    company: 'Intuit · Projects QB25 Modernization',
    title: 'Project Creation/Update → Customer Management Service (CMS)',
    role: 'Driver / Engineer',
    tags: ['Distributed Systems', 'Service Decomposition', 'Idempotency', 'Consistency'],
    oneLine:
      'Replaced monolith APIs + legacy v4 event fallback with CMS as the single source of truth for sub-customers, with idempotency and reconciliation to handle timeout ambiguity.',
    headline: {
      from: 'Monolith sync API + v4 fallback event',
      to: 'CMS as single source of truth',
      pattern: 'API-based with idempotency',
      outcome: 'Sync failure drift eliminated',
    },
    narrative: `We had project creation/update in the Projects service, but sub-customer creation lived in the monolith with a legacy v4 event as a fallback. That split ownership caused data drift — projects and sub-customers would go out of sync, and downstream systems would see inconsistent states.

I led the migration to the new Customer Management Service (CMS) as the single source of truth for sub-customers, and rewired our project create/update flows to synchronize with CMS. We evaluated two designs — API-based vs event-based — and selected API-based after alignment with CMS because it gave stronger consistency guarantees for critical user actions, with less operational complexity.

The tricky part was handling distributed failure modes like timeouts and partial success — where CMS creates/updates the sub-customer but our project transaction rolls back. I drove the FMEA, introduced end-to-end tracing and alerting (DWSM + consumer lag monitors), and designed idempotency + retry/compensation paths to reduce drift.`,
    problem: [
      'Two systems managing related entities (Project vs Sub-customer) with split ownership.',
      'Legacy v4 event fallback created dual-write / dual-source-of-truth — correctness was probabilistic.',
      'Inconsistent lifecycle updates: name, status, parent move, inactivate, activate, sub-customer→project conversion.',
      'Downstream consumers (CERES, Audit, QBTime, STS/ETS/FTS) depended on consistent references — drift cascaded.',
    ],
    architecture: [
      {
        name: 'Approach Decision: API vs Events',
        detail:
          'Chose API for user-facing create/update — strong consistency matters more than eventual. Event-based would leave windows where Project exists but sub-customer doesn\'t. Fewer moving parts, fewer downstream coordination surfaces.',
      },
      {
        name: 'Idempotency Layer',
        detail:
          'CMS create/update keyed by stable projectId or client idempotency token. Retry after timeout is safe — no duplicate sub-customers.',
      },
      {
        name: 'Reconciliation on Timeout',
        detail:
          'Timeout treated as "unknown", not "failure". Correlation ID lets us query CMS to determine actual outcome, then finalize project or retry. No naive rollback on ambiguous state.',
      },
      {
        name: 'Compensation Paths',
        detail:
          'When CMS confirms failure, project rollback. When CMS confirms success but Projects rolled back, compensating update reconciles state. Reports of "parent move" failures get manual reconciliation tooling.',
      },
      {
        name: 'Observability',
        detail:
          'DWSM end-to-end tracing across Projects → CMS. Metrics on timeout rate, retry rate, reconciliation outcomes. Alerts on cross-service mismatch (project without CMS link, CMS updated without project update).',
      },
      {
        name: 'Downstream Eventual Consistency',
        detail:
          'QBTime / STS / ETS / FTS lag handled as projection lag (consumer lag monitoring + UX guidance to refresh) — not by making everything synchronous.',
      },
    ],
    impact: [
      'Eliminated legacy v4 fallback dual-write path.',
      'Significantly reduced sync failures and customer-visible inconsistencies.',
      'Established idempotency + reconciliation pattern for sibling teams migrating to CMS.',
    ],
    killerAnswer:
      "The hardest part wasn't wiring an API — it was handling ambiguous outcomes under timeout. In distributed systems, you can't assume timeout means failure. We designed idempotency, reconciliation, and monitoring so that transient failures don't permanently corrupt data or user experience.",
    grillQuestions: [
      {
        q: 'CMS create times out — how do you know if it succeeded?',
        a: 'We don\'t treat timeout as failure. Correlation ID lets us query CMS by stable key. If sub-customer exists, finalize project. If not, retry safely (idempotent). Alerts fire if reconciliation runs hot.',
      },
      {
        q: 'Why API over events?',
        a: 'User-facing create/update requires strong consistency. Event-based leaves observable windows where Project exists but sub-customer doesn\'t. Fewer moving parts, less downstream coordination.',
      },
      {
        q: 'Parent move times out and corrupts reports — how do you fix it?',
        a: 'FMEA flags this explicitly. Mitigation: confirm CMS state via correlation ID before treating as final. If detected post-fact, compensating sub-customer move + alert + report repair tooling.',
      },
      {
        q: 'How do you prevent duplicate sub-customers on retry?',
        a: 'CMS API is idempotent on the project key. Retries are safe and no-op on success.',
      },
      {
        q: 'Where does "95% fewer sync failures" come from?',
        a: 'Pre-migration drift detection metrics vs post-migration cross-service consistency monitor. Measured at the sync layer, not at the user-visible layer.',
      },
    ],
    landmines: [
      'Do NOT claim "we made everything strongly consistent" — downstream projections are still eventual.',
      'Do NOT say "we used events" then describe the API approach — be precise about which was chosen.',
    ],
  },

  {
    id: 'au-launch',
    tier: 2,
    year: '2024',
    company: 'Intuit · QBO Advanced',
    title: 'QuickBooks Online Advanced — Australia Launch',
    role: 'Cross-team Execution Lead',
    tags: ['Market Expansion', 'Cross-team Coordination', 'Risk Management', 'Production Readiness'],
    oneLine:
      'Sequenced 10+ dependent teams to launch QBO Advanced in Australia with no marketing, requiring rock-solid functional and analytics parity.',
    headline: {
      market: 'Australia · 250K subscribers',
      teams: '10+ dependent teams',
      launch: 'December 4 · No marketing',
      goal: 'Mid-market expansion · disrupt Xero/MYOB',
    },
    narrative: `I worked on the Australia launch of QuickBooks Online Advanced, which was part of Intuit's strategy to move upmarket and compete directly with Xero and MYOB in the AU region. At the time, we had ~250K subscribers in Australia, but many mid-market customers were churning to third-party tools due to missing analytics and workflow capabilities.

My role was to partner with 10+ teams to make Advanced production-ready for AU — not just by enabling features, but by ensuring functional parity, correctness, and upgrade safety in a new market with local constraints.

This involved sequencing dependent feature rollouts, validating analytics pipelines, handling currency and locale-specific behavior, and enabling upgrade/downgrade flows safely across pre-prod and prod.

We launched Advanced in Australia on December 4 with no active marketing, yet enabled a clean expansion path for ~250K subscribers and reduced reliance on third-party tools by delivering native analytics and workflows.`,
    problem: [
      'AU mid-market churning to Xero Ultimate, MYOB AccountRight Plus/Premier, third-party tools.',
      'Missing native analytics + workflows in QBO Advanced for AU.',
      'No active marketing on launch — product had to be flawless on day one.',
      '~250K AU subscribers represented a strong upgrade opportunity if Advanced was production-ready.',
    ],
    architecture: [
      {
        name: 'Cross-team Sequencing',
        detail:
          'Drove feature enablement order across analytics, workflows, accountant flows, upgrade/downgrade, currency, locale. Mis-sequencing = silent corruption or upgrade lock.',
      },
      {
        name: 'Pre-prod + Prod AU Companies',
        detail:
          'Enabled AU companies in pre-prod (Oct 27 cutoff) and prod with locale/currency setup, then ran experts testing, analytics enablement, and prod offers testing in sequence.',
      },
      {
        name: 'Upgrade/Downgrade Safety',
        detail:
          'Validated upgrade/downgrade with soft blockers, including "Add new client" in QuickBooks Accountant, before GA.',
      },
      {
        name: 'Analytics Correctness',
        detail:
          'Validated analytics pipelines against AU data patterns. Silent analytics drift is worse than visible failures — it erodes trust quietly.',
      },
      {
        name: 'Locale Validation',
        detail:
          'Currency, content, functionality, compatibility with AU-local features — bug-fix loop with dependent teams through Oct 27.',
      },
    ],
    impact: [
      'Enabled QBO Advanced GA in Australia on December 4.',
      'Expansion path for ~250K AU subscribers.',
      'Reduced churn from missing functionality to third-party tools.',
      'Delivered on Big Bet 5 (disrupt mid-market) and Input Goal 1 (mid-market capabilities).',
    ],
    killerAnswer:
      "The hardest part was sequencing correctness across teams. It's easy to enable features, but much harder to guarantee that upgrades, analytics, and accountant workflows all behave correctly on day one in a new market. A single mis-sequenced dependency could silently corrupt data or push customers back to third-party tools — so we treated sequencing and validation as first-class engineering problems.",
    grillQuestions: [
      {
        q: 'How does this reduce churn instead of just shipping features?',
        a: 'Mid-market customers were leaving to Xero/MYOB because Advanced lacked native analytics + workflows. Closing those gaps gives them a reason to stay rather than pay for QBO + a third-party tool.',
      },
      {
        q: 'Why launch with no marketing?',
        a: 'Soft launch reduces support pressure while we confirm product stability under real AU traffic. Marketing is sequenced after the product has earned the trust window.',
      },
      {
        q: 'What would have caused a launch delay?',
        a: 'Analytics drift, upgrade path failure, or accountant flow ("Add new client") breakage. Each was gated explicitly in the readiness checklist.',
      },
      {
        q: 'What did you personally drive vs participate in?',
        a: 'I drove dependency sequencing and readiness gates. I personally validated upgrade/downgrade and analytics correctness for our slice. I coordinated feature teams to fix bugs within the Oct 27 cutoff.',
      },
    ],
    landmines: [
      'Do NOT say "I helped with localization/testing" — you owned sequencing, which is leadership.',
      'Do NOT undersell this as "coordination work" — it was production-readiness engineering for a new market.',
    ],
  },

  {
    id: 'template-sharing',
    tier: 2,
    year: '2024',
    company: 'Intuit · QuickBooks Workflows',
    title: 'Template Sharing & User Contribution Framework',
    role: 'Designer & Lead Engineer',
    tags: ['Frontend Architecture', 'Platform', 'Network Effects', 'Multi-service Orchestration'],
    oneLine:
      'Reusable contribution platform that lets users publish workflow templates — designed plugin-agnostic to extend to reports, spreadsheets, and beyond.',
    headline: {
      users: '1K+ publishers',
      reduction: '60% setup time cut',
      scope: 'Plugin-agnostic platform',
      reach: 'Community + my-companies + my-clients',
    },
    narrative: `I led the design and implementation of a Template Sharing and User Contribution framework for QuickBooks workflows. The core problem was that mid-market customers and accountants were spending huge amounts of time manually recreating the same workflows across companies and clients, which directly hurt adoption and pushed users to third-party tools.

Instead of treating this as a one-off UI feature, I designed it as a scalable platform capability — so templates could be published, discovered, and reused not just for workflows, but for future plugins like reports or spreadsheet sync.

I built a modular frontend architecture around a generic Template Handler and User Contribution components, decoupled from workflows, with clear contracts to backend services. This allowed 1K+ users to publish reusable templates, reduced setup time by ~60%, and unlocked network effects as more templates increased platform value across companies.`,
    problem: [
      '81% of mid-market customers cite "save time through automation" as a top job-to-be-done.',
      'Admins/accountants want to set standard practices (e.g. approvals) across companies/clients.',
      'QBO Advanced required manual workflow recreation per company — labor intensive and error-prone.',
      'Accountants wanted to publish/share templates to establish expertise — no platform existed.',
    ],
    architecture: [
      {
        name: 'Guiding Principle',
        detail:
          'Templates are a first-class, cross-plugin concept — not a workflow-specific feature. Designed so reports, spreadsheet sync, and future plugins can plug in without rewriting core logic.',
      },
      {
        name: 'Template Handler (Platform Layer)',
        detail:
          'Plugin-agnostic. Owns fetching, normalization, and rendering of template metadata. Two subcomponents: Template Card Handler (lists) and UCS Published Template List Helper (published row items). Returns shape-consistent cards regardless of plugin.',
      },
      {
        name: 'User Contribution Widget',
        detail:
          'Captures template metadata (name, description, share scope). Handles PII sanitization (dot-dash replacement before publish). Reuses workflow validation. Orchestrates Publish flow across WAS (workflow definition) and UCS (template metadata).',
      },
      {
        name: 'Publish-as-Template Flow',
        detail:
          'Multi-step transactional: hide workflow-specific UI (name, Save & Turn On) → enforce template-safe state (no PII) → open contribution drawer → on publish: WAS persist workflow def → UCS publish template metadata → navigate + reset UI. Failure at any step rolls back UI cleanly.',
      },
      {
        name: 'Discover & Reuse',
        detail:
          'Clicking a shared template opens the visual designer prefilled. Existing validation paths reused — no fork in the validation logic. User fills company-specific values, then create-workflow or publish-as-template based on intent.',
      },
    ],
    impact: [
      '1K+ users publishing reusable templates.',
      '~60% reduction in workflow setup time.',
      'Network effects: more templates increase platform value.',
      'Reusable contribution framework for future plugins (reports, spreadsheet sync).',
    ],
    killerAnswer:
      "The hardest part was designing this as a reusable contribution framework instead of a workflow feature. It required anticipating future plugins, enforcing safety like PII removal, and orchestrating multi-service publish flows — all while keeping the UX simple. Most of the complexity was deliberately hidden behind clean abstractions.",
    grillQuestions: [
      {
        q: 'How does your design prevent tight coupling to workflows?',
        a: 'Template Handler operates on a plugin-agnostic metadata contract. The workflow plugin is one consumer. Adding reports = implementing the same contract, not modifying core logic.',
      },
      {
        q: 'What if publish succeeds in UCS but fails in WAS?',
        a: 'Two-phase commit at the orchestration layer. UCS publish is the last step after WAS persistence succeeds. If UCS fails, we surface a retry. Failure ordering ensures no orphaned templates pointing at non-existent workflow definitions.',
      },
      {
        q: 'How do you guarantee no PII leaks?',
        a: 'On entering publish mode, PII fields are masked (dot-dash) and workflow name is hidden. Server-side validation rejects any template carrying PII patterns. Defense in depth.',
      },
      {
        q: 'If templates scale from 1K to 100K, what breaks first?',
        a: 'Template discovery — list rendering and search become the bottleneck. Mitigation: virtualization on the client, server-side indexing + ranking on UCS.',
      },
      {
        q: 'How do you version templates as workflows evolve?',
        a: 'Templates store the workflow definition schema version. On import, mismatch triggers a migration path or a compatibility warning. Avoids silent breakage when workflow engine evolves.',
      },
    ],
    landmines: [
      'Do NOT call this "a UI to share templates" — it is a contribution platform.',
      'Do NOT describe components ("drawer", "cards") before architecture (plugin-agnostic contract).',
    ],
  },

  {
    id: 'change-orders',
    tier: 1,
    year: '2024 — 2025',
    company: 'Intuit · QuickBooks Online Projects',
    title: 'Change Orders — Scalable UI + Dynamic Sync Pipelines',
    role: 'Frontend Architect & Engineer',
    tags: ['Financial Workflows', 'State Machines', 'Reporting', 'Auditability'],
    oneLine:
      'First-class way to track scope changes to a project estimate without rewriting history — accepted change orders roll up into KPIs and reports in real time with full audit traceability.',
    headline: {
      users: '50K+ businesses',
      reduction: '80% fewer manual edits',
      surface: 'KPIs + 6 reports + visual tracker',
      contract: 'Original estimate immutable',
    },
    narrative: `I led the engineering for Change Orders in QuickBooks Online Projects — essentially a first-class way to track scope changes to a project estimate without rewriting history. Before this, users had to edit or recreate estimates, which broke audit trail and caused reporting inconsistencies.

The key requirement was: keep the original estimate intact, represent changes as separate transactions, and once accepted, have those changes roll up into project estimated cost/income everywhere — project KPIs, reports, and estimates vs actuals — while preserving full audit traceability.

I built a scalable Change Order UI that handled creation, editing, statuses, attachments, and linking to the underlying project estimate. But the harder part was the dynamic sync pipeline: when a change order is accepted or declined, the system updates rollups and reporting in near real time, so users immediately see accurate KPIs and financial totals.`,
    problem: [
      'No native "change order" concept — users edited estimates directly, breaking audit history.',
      'Reporting inconsistencies across project KPIs, Estimates vs Actuals, Work in Progress.',
      'Construction + professional services workflows specifically needed scope-change tracking.',
      'Customer signoff flow required separation of original estimate from subsequent changes.',
    ],
    architecture: [
      {
        name: 'Core Domain Model',
        detail:
          'A Change Order is a separate estimate-like transaction linked to a Project Estimate. Only accepted change orders contribute to totals. Original estimate remains immutable for audit.',
      },
      {
        name: 'Creation Constraints',
        detail:
          'CO can only originate from a pending / accepted / converted Project Cost Estimate. Not allowed on basic estimates. Disabled for any other PCE status.',
      },
      {
        name: 'Field Rules',
        detail:
          'For existing line items: only qty editable. For new line items: all fields editable. Markup, rates, taxable, billable inherited from PCE for existing lines.',
      },
      {
        name: 'Status State Machine',
        detail:
          'Pending → Accepted / Declined. Accepted = contributes to totals + shows as non-editable section on PCE. Pending = shows on PCE grayed, does not contribute. Declined = excluded from PCE entirely. Estimate decline cascades to obsolete CO warnings.',
      },
      {
        name: 'Sticky Summary Bar',
        detail:
          'Live: total change in estimated cost, total change in estimated income, previous estimated profit margin, new estimated profit margin (assuming this CO is accepted). Updates per line item edit.',
      },
      {
        name: 'Dynamic Rollup Pipeline',
        detail:
          'On status transition, recompute and propagate: project estimated cost/income, profit margin, Estimates vs Actuals visual tracker, KPIs, 6 reports (Estimates vs Actuals, EvsA by Project, Work in Progress, Committed Costs, Cost to Complete, Change Order Report). Status-based inclusion rules prevent double counting.',
      },
      {
        name: 'Tax & Discount Interactions',
        detail:
          'CO sales tax always calculated using the linked PCE date. Discounts in CO merge to PCE discount when accepted (percent → dollar). Override removed and recalculated on accepted-CO merge. Reverted on decline.',
      },
      {
        name: 'Invoicing Boundaries',
        detail:
          'Invoicing is from the estimate (which includes accepted COs), not from the CO directly. Progress invoicing reflects updated estimate amount and remaining. CREATE INVOICE disabled on CO form.',
      },
      {
        name: 'Audit Traceability',
        detail:
          'Every edit logged in Audit Log under Change Order section. Restore Version supported. Status changes logged as separate line items in the Change Order Report.',
      },
    ],
    impact: [
      '80% reduction in manual estimate edits.',
      'Improved financial accuracy for 50K+ businesses.',
      'Full audit traceability across CO lifecycle.',
      'Reporting consistency across 6 project reports.',
    ],
    killerAnswer:
      "The hardest part wasn't a screen — it was making the rollup correct. Pending, accepted, and declined COs have completely different inclusion rules across KPIs, reports, and the project tracker. We modeled this as a status state machine driving a sync pipeline, with explicit guards against double counting. The UI is the easy surface; the correctness of the underlying financial model is what made this real engineering.",
    grillQuestions: [
      {
        q: 'How do you prevent double counting with multiple accepted COs?',
        a: 'Status-based inclusion rules at the rollup layer. Each CO contributes exactly once on accepted. Recomputation is idempotent — re-running yields the same totals.',
      },
      {
        q: 'What triggers rollup recalculation?',
        a: 'Status transition events on CO. Reactive pipeline propagates to project totals, KPIs, reports, and visual tracker. Bounded recompute per project, not full table scan.',
      },
      {
        q: 'Accepted CO becomes declined after partial invoicing — what happens?',
        a: 'Warning surfaced to user about prior invoicing. On confirm, CO lines removed from PCE, EI/EC adjusted, invoice not modified. Audit log records both states. Invoice remains a historical document.',
      },
      {
        q: 'Why can\'t users edit original estimate line attributes through a CO?',
        a: 'Audit traceability. The original estimate must remain immutable. Edits = new line items or qty adjustments on existing lines via CO, never field rewrites on the original.',
      },
      {
        q: 'How did you guarantee KPIs and reports show the same numbers?',
        a: 'Single rollup pipeline drives both. KPIs and reports read from the same materialized rollup, not from independent calculations. Eliminates skew.',
      },
      {
        q: 'What\'s the nastiest edge case?',
        a: 'Accepted CO + override-applied tax on PCE + partial progress invoicing + subsequent CO decline. Order of operations determines whether tax is recalculated or invoice retains stale tax. We pinned the rule: invoice is historical, future estimate reflects current rule.',
      },
    ],
    landmines: [
      'Do NOT call this "a UI" — it is a financial state machine with sync pipelines.',
      'Do NOT claim "real-time everywhere" — be precise: near real-time, bounded recompute.',
    ],
  },

  {
    id: 'project-budgets',
    tier: 1,
    year: '2025',
    company: 'Intuit · QuickBooks Online IES',
    title: 'Project Budgets — Decoupling Internal Cost from Customer Estimates',
    role: 'Frontend Architect',
    tags: ['Source-of-Truth Migration', 'Financial Systems', 'Reporting', 'Migration UX'],
    oneLine:
      'New source of truth for estimated cost — separated from customer-facing Project Estimates — with safe migration, reporting source switch, and full backward compatibility.',
    headline: {
      adoption: '27% of project users',
      businesses: '37K+ businesses',
      change: 'Cost SoT moved from PCE → PB',
      grid: 'DataGrid · 3500+ rows · 23 cols',
    },
    narrative: `Before Project Budgets, QuickBooks used Project Estimates as the source of truth for both estimated cost and income. That broke the mental model for mid-market businesses, especially construction and professional services, where internal cost breakdowns are far more granular than customer-facing quotes.

I helped design and launch Project Budgets to decouple these two concerns: Budgets became the source of truth for estimated cost, while Project Estimates remained the source of truth for estimated income.

The hardest part wasn't the UI — it was ensuring this change didn't break reporting, migrations, upgrade paths, or downstream workflows like Change Orders and Invoicing. I worked on the frontend architecture for budget creation, editing, import, and audit visibility, while coordinating closely with reporting and backend teams to safely switch the estimated-cost data source across 8+ critical reports.`,
    problem: [
      'PE acted as both customer-facing quote AND internal cost breakdown — wrong mental model for MM.',
      'Construction tracks 200+ cost codes (AIA billing); customers want short quotes — irreconcilable in one form.',
      'Reports pulled estimated cost from PE — wrong source for accounting accuracy.',
      '8+ existing reports, custom reports, memorized reports all depended on PE-as-cost-source.',
      'Migration scope: existing IES users, Advanced upgraders, Desktop migrators, NTTFs — all different flows.',
    ],
    architecture: [
      {
        name: 'Source-of-Truth Separation',
        detail:
          'PE → estimated income only. PB → estimated cost only. PE and PB exist independently. Multiple PEs per project, exactly one PB per project. Reports switched to PB as cost source.',
      },
      {
        name: 'DataGrid at Scale',
        detail:
          'Up to 3500 rows, 23 columns, virtual scroll, <200ms edit latency target. Grouping, milestones, dimensions, classes, locations, custom fields. Closer to an FP&A tool than a form.',
      },
      {
        name: 'Budget State Machine',
        detail:
          'Draft → Published → Version N. Draft = not in reports. Published = original baseline for reporting. Versions = subsequent edits, with diff vs original surfaced in reports.',
      },
      {
        name: 'Audit Log Reuse for Versioning',
        detail:
          'Reused existing audit log platform for budget versioning. Each edit creates a version; user can view or restore. Cost diff (Original / Diff / Total) reflected as 3 new columns across 5 cost reports.',
      },
      {
        name: 'Migration Pipeline',
        detail:
          'Two-step async flow: accept all pending PEs and COs → migrate cost columns from PCE to PB. Triggered by user opt-in (existing IES) or auto (upgraders, NTTFs, DTM). Failure isolation: error in step 1 logged; error in step 2 rolls back to old mode.',
      },
      {
        name: 'Async AI Import',
        detail:
          'Spreadsheet upload exceeding 4s SLA — async with task-based progress, notifications, page-level messaging, and resumability. Up to 300 lines supported in V2.',
      },
      {
        name: 'Dual-Mode Reporting',
        detail:
          'During rollout, both modes coexist: PB-users see new reports (cost from PB), non-PB-users see old reports (cost from PE). Feature flag + variability options. Cord cut once 100% on PB.',
      },
      {
        name: 'Multicurrency Guardrail',
        detail:
          'MC initially blocked (only 0.38% of PCE users use it). Warning on MC toggle with data-loss callout. Phase 2 added MC support after migration pipeline matured.',
      },
      {
        name: 'Downgrade Strategy',
        detail:
          'IES → Advanced reverse migration: synthetic PE created carrying budget costs, original PEs unchanged. Reports unbroken. White-glove for edge cases.',
      },
    ],
    impact: [
      '27% of project users adopted Project Budgets.',
      'Improved financial accuracy for ~37K businesses.',
      'Cleaner mental model matching how project managers actually think about cost vs price.',
      'Closed competitor gaps vs NetSuite, Procore, Knowify on key budgeting features.',
      'Established async migration UX pattern reused across the platform.',
    ],
    killerAnswer:
      "The hardest part was changing the cost source of truth without breaking trust. Budgets touched reports, estimates, change orders, migrations, and upgrades. The frontend had to make that transition explicit, safe, and reversible for users, while enforcing strict invariants so financial data stayed correct.",
    grillQuestions: [
      {
        q: 'Why decouple budgets from estimates?',
        a: 'They serve different audiences with different granularity. Internal accounting needs 200+ cost codes; customer quotes need 10 line items. Forcing both into one form broke the mental model and caused reporting drift.',
      },
      {
        q: 'Why one budget per project but multiple PEs?',
        a: 'One internal source of truth for cost. Multiple customer-facing quotes are normal (negotiation iterations). The constraint matches the domain.',
      },
      {
        q: 'How do PB and CO interact?',
        a: 'COs no longer carry cost columns (cost lives in PB). CO updates estimate (income). Budget revisions are tracked via the budget versioning system, not via COs.',
      },
      {
        q: 'What was the riskiest migration scenario?',
        a: 'Existing IES users with pending PEs + COs + memorized custom reports. Migration auto-accepts pending PEs/COs (data preserved, reports may shift). Mitigated with in-product communication, CSM outreach, and rollback to old mode on step-2 failure.',
      },
      {
        q: 'Why is this not just a frontend feature?',
        a: 'It changed the cost source of truth across 8+ reports, the audit/versioning model, migration pipelines for 5 cohorts (existing IES, Advanced upgraders, Desktop migrators, NTTFs, Plus upgraders), and downstream interactions with Change Orders, Invoicing, and Verticalization. The DataGrid alone is one of the most complex grids in the product.',
      },
      {
        q: 'How did you keep the DataGrid performant at 3500 rows?',
        a: 'Virtual scroll, debounced cell edits, memoized row rendering, batched state updates. Cell edit SLA <200ms enforced as a perf budget.',
      },
      {
        q: 'What breaks if adoption goes 27% → 70%?',
        a: 'AI import queue + DataGrid perf on very large budgets. Mitigation: async import scaling, partition-based grid rendering, server-side aggregation for milestone rollups.',
      },
    ],
    landmines: [
      'Do NOT say "I built a budget UI" — you separated source-of-truth across the financial reporting layer.',
      'Do NOT skip the migration story — HMs probe migration risk on financial features.',
    ],
  },

  {
    id: 'consolidated-email',
    tier: 2,
    year: '2022 — 2023',
    company: 'Intuit · QuickBooks Workflows',
    title: 'Consolidated Email UI Experience',
    role: 'Frontend Engineer',
    tags: ['UX Systems', 'Preference Management', 'Backward Compatibility', 'Compliance'],
    oneLine:
      'Configurable email delivery letting users pick single-summary or per-transaction reminders — solving email fatigue while preserving legal compliance and backward compatibility.',
    headline: {
      reduction: '65% fewer emails',
      csat: '+40% satisfaction',
      modes: 'Per-txn · Consolidated',
      constraint: 'Legacy React, class components',
    },
    narrative: `In QuickBooks workflows, reminder notifications were sent per transaction, which caused severe email fatigue for customers managing high volumes. We introduced consolidated reminder emails, but initially it was a forced experience that didn't respect user preference and had legal/branding gaps.

I designed and delivered a new consolidated email UI experience that let users explicitly choose between per-transaction emails and a single summary email. This required introducing a toggle-based preference system while ensuring existing workflows, templates, and downstream email delivery logic remained backward compatible.

I also reworked the consolidated email content to meet updated legal and branding requirements, coordinating closely with design and legal constraints.`,
    problem: [
      'High-volume reminder workflows generated dozens of emails per customer — fatigue + unsubscribes.',
      'Initial consolidated rollout was forced, not user-choice — wrong product mental model.',
      'Consolidated email content had legal + branding gaps blocking production rollout.',
      'Codebase used class-based React (no hooks support yet) — refactor risk on shared components.',
    ],
    architecture: [
      {
        name: 'Toggle as Behavior Switch',
        detail:
          'The toggle is a user preference that controls which email generation path runs downstream — not just UI state. Persisted, respected per workflow, default chosen for backward compatibility with existing users.',
      },
      {
        name: 'Shared Component Refactor',
        detail:
          'Refactored shared email components to support both modes via props rather than duplicating logic. Avoided branching-logic explosion. Toggle component itself made reusable for future preference rows.',
      },
      {
        name: 'Freeform Email + CC/BCC',
        detail:
          'Preserved freeform email composition with CC/BCC support across both modes. Mode switch did not lose user-entered content.',
      },
      {
        name: 'Compliance Content Rebuild',
        detail:
          'Reworked consolidated email HTML/CSS for branding + legal accuracy. Email content treated as production-grade — review gate before merge.',
      },
      {
        name: 'Mock API + Test Strategy',
        detail:
          'Backend not ready during frontend dev. Built mock API for unit + integration tests, decoupling FE delivery from BE readiness. Documented failures in a shared QA doc.',
      },
    ],
    impact: [
      '65% reduction in email volume.',
      '~40% increase in customer satisfaction.',
      'Backward-compatible rollout — zero disruption to existing reminder workflows.',
      'Established preference-toggle pattern reused across workflow UI.',
    ],
    killerAnswer:
      "The hardest part was introducing user choice without breaking existing behavior. Changing notification delivery is risky because users rely on it. We had to preserve backward compatibility, meet legal requirements, and still reduce email volume — all through a UI that looked simple but controlled complex downstream behavior.",
    grillQuestions: [
      {
        q: 'How did you ensure the toggle didn\'t break existing workflows?',
        a: 'Default preserved old per-transaction behavior. Toggle changes were opt-in. Shared components refactored with mode-aware props, not new code paths. Existing tests continued to pass.',
      },
      {
        q: 'Why give users a choice instead of forcing consolidated?',
        a: 'Some users with low-volume workflows prefer per-transaction emails — they\'re easier to forward, file, or respond to individually. Forcing consolidation would reduce satisfaction for that cohort. Choice respects both mental models.',
      },
      {
        q: 'What if a third email mode is added later?',
        a: 'The toggle is currently binary, but the underlying mode prop is a string enum. Adding a third mode = extending the enum and adding the corresponding generation path. Shared components already pivot on mode prop.',
      },
      {
        q: 'How did the toggle state persist?',
        a: 'Workflow-level preference stored server-side, retrieved on workflow load, applied to email generation at send time. Not a session-only flag.',
      },
    ],
    landmines: [
      'Do NOT call this "a toggle and some HTML" — it is preference management controlling downstream behavior.',
      'Do NOT skip the legacy React constraint — working in class components without hooks demonstrates real-codebase competence.',
    ],
  },

  {
    id: 'implicit-ads',
    tier: 3,
    year: '2021',
    company: 'NIT Trichy · Final Year Project',
    title: 'Implicit Ads Detector — Multi-modal Deep Learning',
    role: 'Researcher / Engineer',
    tags: ['ML', 'Deep Learning', 'CNN', 'Multi-modal'],
    oneLine:
      'Multi-modal pipeline detecting embedded promotional content in YouTube videos — where ads don\'t look like ads.',
    headline: {
      accuracy: '~85% accuracy',
      recall: 'High recall on ad-class',
      stack: 'TensorFlow · CNN · Python',
      domain: 'Video segmentation',
    },
    narrative: `This project focused on detecting implicit advertisements in YouTube videos — cases where promotional content is embedded naturally inside the video rather than shown as explicit ad breaks. Existing approaches work well for TV ads or explicit segments, but fail when the tone, visuals, and pacing are similar to the main content.

I designed a multi-modal pipeline that splits videos into semantically meaningful segments using audio sentence boundaries, then classifies each segment using visual features from frames and contextual/audio cues.

On the visual side, I used CNN-based feature extraction to capture logos, product imagery, and branding patterns. On the audio/context side, I leveraged speech-derived signals and contextual cues like calls-to-action and brand mentions.`,
    problem: [
      'Audio-only classifiers fail for implicit ads — tone is similar to main content.',
      'Frame-difference fails — implicit ads don\'t change scenes.',
      'Whole-video binary classification is useless — ads are embedded segments, not full videos.',
      'Key insight: implicit ads are defined by intent, not by format.',
    ],
    architecture: [
      {
        name: 'Semantic Segmentation',
        detail:
          'Split video using audio sentence boundaries — semantically meaningful segments, not fixed time windows. Each segment becomes a classification unit.',
      },
      {
        name: 'Visual Features (CNN)',
        detail:
          'CNN feature extraction over sampled frames — logos, product shots, branding-heavy frames. Trained on labeled segment data.',
      },
      {
        name: 'Audio/Context Signals',
        detail:
          'Speech-derived features: brand names, urgency, call-to-action phrasing, emotion/excitement cues. Background music patterns.',
      },
      {
        name: 'Multi-modal Fusion',
        detail:
          'Visual + audio + contextual signals fused before final classification. No single modality is sufficient for implicit ads.',
      },
    ],
    impact: [
      '~85% accuracy with improved recall on the ad class.',
      'Designed for near real-time inference — suitable for moderation pipelines.',
      'Demonstrated that segment-level classification beats whole-video classification for embedded content.',
    ],
    killerAnswer:
      "The hardest part was that implicit ads don't look like ads. There's no clean visual boundary or audio spike. The only reliable signal is intent, which forced us to segment videos semantically and combine weak signals across vision, audio, and context instead of relying on any single modality.",
    grillQuestions: [
      {
        q: 'Why segment-level instead of whole-video classification?',
        a: 'Whole-video labels lose locality — a 10-minute video with one 30-second ad segment looks like a non-ad. Segment-level enables boundary detection, which is the actual product use case (skip the ad, not the video).',
      },
      {
        q: 'Biggest sources of false positives?',
        a: 'Genuine product reviews and educational content with brand names. Mitigation: weight contextual signals (urgency, CTA phrasing) higher than pure brand-mention frequency.',
      },
      {
        q: 'Why recall over accuracy?',
        a: 'In moderation use cases, missing an ad segment is worse than occasionally flagging non-ad content. False positives are cheap to review; false negatives violate platform policy.',
      },
      {
        q: 'Productionize at YouTube scale — what changes?',
        a: 'Offline batch inference per upload, not per view. GPU-backed feature extraction. Distillation to a smaller model for live serving. Continuous retraining as ad styles evolve.',
      },
    ],
    landmines: [
      'Do NOT pitch this as a GenAI project — it predates and is unrelated to LLMs.',
      'Do NOT overclaim productionization — it was a research/academic project.',
      'Position as analytical depth, not core strength.',
    ],
  },

  {
    id: 'budget-versioning',
    tier: 1,
    year: '2025',
    company: 'Intuit · QuickBooks Online IES',
    title: 'Project Budget Versioning — Immutable, Copy-on-Write Revisions',
    role: 'VERIFY: Frontend / Backend / Full-stack — set from your PRs',
    tags: ['Financial Systems', 'Concurrency', 'Event-Driven', 'Audit'],
    oneLine:
      'Turned project budgets into auditable financial records: DRAFT is mutable in place, LOCKED is immutable copy-on-write, with optimistic concurrency and event-sourced version history.',
    headline: {
      model: 'Copy-on-write revisions',
      concurrency: 'JPA @Version optimistic lock',
      history: 'Transactional outbox → audit view',
      states: 'DRAFT / LOCKED / HIDDEN',
    },
    narrative: `Project budgets feed downstream financial surfaces — estimate-vs-actuals, project profitability, approvals. Once a budget is published and acted on, its state at that moment must be reconstructable forever. Editing in place would destroy the record of what was approved.

The design turns the budget into an auditable, versioned record. A budget is either a mutable DRAFT or a published LOCKED version. Editing a LOCKED budget doesn't overwrite it — the system snapshots the current revision as immutable history (status INACTIVE) and creates a new ACTIVE revision (copy-on-write). Concurrency is protected by JPA optimistic locking, surfaced to the frontend as a syncToken. Every change emits a domain event through a transactional outbox that feeds the platform audit-history view.

VERIFY OWNERSHIP: replace this paragraph with your actual slice. Frontend candidates: the Save-as-Draft / Save-and-Publish split, syncToken round-trip, DRAFT/LOCKED state gating, version-history link-out. Backend candidates: the handleUpdateBudget copy-on-write branch, createActiveVersion deep copy, outbox event emission, the BusinessBudgetHeader entity model. Only claim what your PRs show.`,
    problem: [
      'Published budgets are financial records — their approved state must be reconstructable, not overwritten.',
      'Editing in place destroys audit history; accountants lose what they signed off on.',
      'Two users can edit the same budget — silent overwrite would corrupt data.',
      'Version history must never diverge from actual budget state (dual-write hazard).',
      'Drafts are iterated repeatedly — naive per-save versioning would explode revision counts.',
    ],
    architecture: [
      {
        name: 'Three Orthogonal Concepts',
        detail:
          'state (DRAFT/LOCKED/HIDDEN — lifecycle) vs status (ACTIVE/INACTIVE — which revision is live) vs revision (version number, part of composite PK budgetId+revision+companyId). Separating lifecycle from currency keeps history rows abundant but queries simple (findByStatus ACTIVE).',
      },
      {
        name: 'Copy-on-Write on Publish Edit',
        detail:
          'DRAFT mutates in place, same revision. Editing a LOCKED budget: mark current ACTIVE row INACTIVE (archive), insert new ACTIVE row with revision+1 and deep-copied lines. Invariant: exactly one ACTIVE revision per budget; every prior LOCKED version persists as INACTIVE = history.',
      },
      {
        name: 'Optimistic Concurrency',
        detail:
          'editSequence is a JPA @Version token, round-tripped to the frontend as syncToken. Concurrent edit → second saveAndFlush throws ObjectOptimisticLockingFailureException → surfaced as conflict. Stale client rejected, never silent overwrite. Chosen over pessimistic because budget edits are low-contention.',
      },
      {
        name: 'Transactional Outbox for History',
        detail:
          'Every change writes a domain event to an outbox table in the SAME DB transaction as the budget change. A relay publishes to the event bus → platform audit-history view. History can never diverge from state — no dual-write problem.',
      },
      {
        name: 'Two Distinct Lock Paths (do not conflate)',
        detail:
          'Path A — user versioning: update with state=LOCKED, forks a revision (Save & Publish button). Path B — LockProjectBudgetServiceImpl: programmatic lock for the estimate/change-order flow, permission-gated, idempotent, only HIDDEN→LOCKED, rejects pending linked transactions. Different rules, different triggers.',
      },
      {
        name: 'History Read Delegated to Platform',
        detail:
          'No bespoke version-history UI. Emit standard domain events, link out to the platform audit-history view keyed by domain entity type. Reuse over rebuild.',
      },
    ],
    impact: [
      'Published budgets became auditable, reconstructable financial records.',
      'Concurrent edits protected without holding DB locks.',
      'Version history guaranteed consistent with state via transactional outbox.',
      'Feature-flagged progressive rollout without branching the codebase.',
    ],
    killerAnswer:
      "The core decision is copy-on-write for published budgets. DRAFT is mutable in place so users iterate freely; the moment a budget is LOCKED it becomes immutable, and editing it forks a new revision while the old one persists as history. That plus optimistic concurrency and a transactional outbox for history is what turns a mutable form into an auditable financial record.",
    grillQuestions: [
      {
        q: 'How do you keep old budget versions?',
        a: 'Copy-on-write: on editing a LOCKED budget, mark the current ACTIVE row INACTIVE, insert a new ACTIVE row with revision+1 and deep-copied lines. PK is (budgetId, revision, companyId). Prior versions live on as INACTIVE.',
      },
      {
        q: 'Two users edit the same budget simultaneously?',
        a: 'JPA @Version editSequence, round-tripped as the frontend syncToken. The loser gets ObjectOptimisticLockingFailureException, surfaced as a conflict error. No silent overwrite.',
      },
      {
        q: 'Why not overwrite drafts too?',
        a: 'Drafts are work-in-progress; nobody has acted on them. Versioning only at publish checkpoints avoids revision explosion while iterating. Published budgets have downstream consumers, so their state must freeze.',
      },
      {
        q: 'How does version history stay consistent with the data?',
        a: 'Transactional outbox: the history event is written in the same DB transaction as the budget change, then relayed to the audit system. Atomic — no lost or phantom history entries, no dual-write.',
      },
      {
        q: 'Difference between state and status?',
        a: 'state = lifecycle (DRAFT/LOCKED/HIDDEN); status = which revision is live (ACTIVE/INACTIVE). Two independent axes so one budgetId can have many historical rows while ACTIVE lookups stay simple.',
      },
    ],
    landmines: [
      'VERIFY your ownership before claiming any layer — this project spans frontend TS and backend Java.',
      'Do NOT conflate the two lock paths: user versioning (state=LOCKED, forks) vs LockProjectBudgetService (HIDDEN→LOCKED, estimate flow).',
      'Do NOT claim you built the transactional outbox — it is platform infrastructure you integrate with.',
    ],
  },

  {
    id: 'ai-budget-import',
    tier: 1,
    year: '2025',
    company: 'Intuit · QuickBooks Online IES',
    title: 'AI-Assisted Budget Import — Human-in-the-Loop Extraction & Matching',
    role: 'VERIFY: Frontend / Full-stack — set from your PRs',
    tags: ['AI Integration', 'Async Systems', 'Human-in-the-Loop', 'Event-Driven'],
    oneLine:
      'Upload a spreadsheet, an internal AI service extracts line items and matches them to the products & services catalog with confidence tiers, and the user reviews only the uncertain rows before saving to a financial record.',
    headline: {
      task: '~30 min manual entry → upload + review',
      tiers: '3 confidence tiers',
      channels: 'ICE push + polling fallback',
      loop: 'AI drafts, human confirms',
    },
    narrative: `Creating a project budget from scratch was ~30 minutes of manual data entry, and most users built very similar budgets. AI import lets a user upload an Excel sheet; an internal AI service (QBAI) extracts line items (name, description, quantity, rate) and matches each against the company's existing Products & Services catalog. The user reviews AI suggestions in a data grid with confidence tiers, corrects low-confidence matches, and saves.

The framing that matters: this is not "AI does it for you." It is a human-in-the-loop system where AI drafts and the human confirms, because the output lands in financial records where wrong data is expensive. AI extraction is probabilistic; budget line items are deterministic downstream. The whole design manages that seam.

VERIFY OWNERSHIP: replace with your actual slice. Likely-yours frontend files: ProjectBudgetAutofillSidePanel.tsx (upload/validate orchestration), useDocumentStatusPolling.ts (ICE + polling), projectBudgetDetailSlice.ts (status state machine), populateGridUtils.ts (match tier → grid rows). Only claim what your PRs show; disclaim the QBAI model and the ICE pub/sub infra.`,
    problem: [
      'Manual budget entry took ~30 minutes; users rebuilt near-identical budgets repeatedly.',
      'AI extraction is probabilistic; budget lines are deterministic financial records — wrong data is expensive and silent.',
      'LLM document comprehension is slow and variable — cannot block a request or UI thread on it.',
      'Extracted items must be matched to the company catalog — semantic similarity, not string equality.',
      'Real-time status events can be missed (dropped socket, tab switch) — need a fallback.',
    ],
    architecture: [
      {
        name: 'Three Generations Behind Flags',
        detail:
          'V1 synchronous (blocking GraphQL mutation, simulated progress). V2 async (long-running extraction, document status state machine via ICE pub/sub + polling fallback). V3 agentic (conversational agent widget). Each independently feature-flagged — incremental, safe delivery.',
      },
      {
        name: 'Document Status State Machine',
        detail:
          'NO_DOCUMENT → IN_PROGRESS → EXTRACTED → COMPLETED, with EXTRACTION_FAILED and CANCELLED as terminal branches. Server-authoritative: re-fetched on load, so closing the browser mid-extraction does not lose the AI work.',
      },
      {
        name: 'Confidence-Tiered Matching',
        detail:
          'Each record returns matchStatus (MATCH / PARTIAL_MATCH / NO_MATCH), a best-matched entity with a score, and ranked alternatives. Normalization rule: MATCH → matched entity, PARTIAL_MATCH → pre-fill top alternative, NO_MATCH → blank. This is a semantic-similarity problem (embeddings + thresholds), not string equality.',
      },
      {
        name: 'Human-in-the-Loop Review',
        detail:
          'AiSparkles icon + popover renders ONLY on PARTIAL_MATCH / NO_MATCH rows, so the user fixes exactly the uncertain ones. Clean rows look clean. Only MATCH is pre-accepted; save is gated so probabilistic output never lands unreviewed.',
      },
      {
        name: 'Async + Event-Driven with Fallback',
        detail:
          'Comprehension starts a backend job; completion resolves via ICE pub/sub push, with interval polling as fallback (5s while IN_PROGRESS). Graceful degradation — polling guarantees eventual consistency if an event is missed.',
      },
      {
        name: 'GraphQL BFF to Dedicated AI Service',
        detail:
          'All AI calls route to a dedicated QBAI GraphQL endpoint. One typed round-trip returns extraction + matching + confidence + alternatives, isolating the AI backend from core budgeting APIs.',
      },
      {
        name: 'Composition Over Reinvention',
        detail:
          'Upload embeds the platform widget (smartdocs-web-platform/unified-upload) — reuses virus scanning, PCI/7216 compliance, allowed channels. Rebuilding financial-grade upload would be reckless.',
      },
      {
        name: 'Guardrails',
        detail:
          'maxAllowedRecordsToBeImported = 100 triggers CANNOT_IMPORT_ALL_RECORDS; grid enforces the 3500-line cap. Prevents a huge sheet from degrading the grid or backend.',
      },
    ],
    impact: [
      '~30-minute manual data-entry task reduced to upload + review.',
      'Correction telemetry per confidence tier gives a signal to tune AI match thresholds.',
      'Human-in-the-loop kept probabilistic AI output out of financial records unreviewed.',
      'Progressive rollout (sync → async → agentic) without branching the codebase.',
    ],
    killerAnswer:
      "The design principle is: AI drafts, human confirms — and the UI must make it structurally impossible to accidentally accept a low-confidence match. AI extraction is probabilistic and this data becomes financial records, so every row carries a confidence tier, only high-confidence matches auto-accept, and the review UI flags exactly the uncertain rows for human confirmation before save.",
    grillQuestions: [
      {
        q: 'How do you handle a slow (minutes-long) extraction without freezing the UI?',
        a: 'Async job + ICE push with polling fallback. UI shows a non-blocking state; status is server-authoritative and re-fetched on load, so the user can navigate away and come back. LLM latency is a batch-job profile, not a DB-query profile.',
      },
      {
        q: 'What if the AI matches the wrong product?',
        a: 'Confidence tiers. Only MATCH is pre-accepted. PARTIAL_MATCH pre-fills the top alternative but flags the row; NO_MATCH leaves it blank so the user must pick. Wrong matches are caught at review before they reach the financial record.',
      },
      {
        q: 'Lost websocket event or multiple tabs?',
        a: 'Polling fallback plus server-authoritative status. The status is re-queried, so state converges regardless of a missed push event.',
      },
      {
        q: 'How is matching done — string equality?',
        a: 'No — semantic similarity. Standard modern pattern is embeddings (text → vectors) ranked by cosine similarity, with thresholds becoming the three tiers. VERIFY: this is the QBAI-owned layer; describe the pattern, disclaim the implementation.',
      },
      {
        q: 'Why Redux, not local state?',
        a: 'Cross-component shared import state (side panel, grid, modal, toast), multi-step async orchestration (validate → comprehend → poll → save), and testability in isolation.',
      },
      {
        q: 'How would you know if the AI degraded in production?',
        a: 'Match-acceptance telemetry per tier. If MATCH-tier rows are suddenly corrected more often, the model is degrading — alert on that rate. VERIFY what telemetry actually exists before claiming it.',
      },
    ],
    landmines: [
      'VERIFY your ownership — disclaim the QBAI model and the ICE pub/sub infra explicitly.',
      'Do NOT call this "AI does it for you" — the entire value is human-in-the-loop confirmation.',
      'Do NOT claim matching accuracy numbers — those belong to the model owners.',
      'Honest weaknesses to raise yourself: simulated progress bar, dead guard in polling hook, global mutable state in asyncTopic.tsx.',
    ],
  },
];

const TIER_LABELS = {
  1: 'Signature',
  2: 'Strong support',
  3: 'Selective use',
};

/* ============================================================================
 * DEEP DIVES — STAFF-LEVEL DEPTH
 * ============================================================================
 * For each project: the layered chains, decision tradeoffs, algorithms,
 * war stories, edge cases, and retrospective lessons that surface when
 * interviewers go 3-4 levels deep. Use as Q→A→but-why→A→what-if→A material.
 * ========================================================================== */

const DEEP_DIVES = {
  'traffic-replay': {
    framing:
      'The most-probed project at staff level. Architecture is well-documented internally; be ready for chains on capture/security/data-parity/blast-radius. All war-story content below is documented failure modes designed for, not incidents you should claim happened unless you remember them specifically.',
    firstPrinciples: {
      reduction:
        'How do you get production-scale behavioral truth without production-scale risk?',
      invariants: [
        'Customer traffic must never be affected. Latency, correctness, availability of the request path are untouchable.',
        'Downstream side effects must never actually happen from the parallel path. A shadow request is a mirror, not a fork.',
        'Production is the only realistic test surface for scale, edge cases, and traffic shape — synthetic tests cannot reproduce it.',
        'Sensitive customer data must not leave the trust boundary in plaintext. Capture, transport, storage, all encrypted.',
        'The validator is passive: it can miss a regression, but it can never cause one.',
      ],
      tensions: [
        'Fidelity (real behavior) versus Safety (no customer impact). Both must be non-negotiable.',
        'Application coupling (accuracy of capture) versus Independence (rollout safety, no app code changes).',
        'Strict comparison (catch more) versus Noise tolerance (avoid drowning signal in false positives).',
        'Cost of running a parallel stack versus Confidence in high-risk releases.',
      ],
      synthesis:
        'Duplicate the request stream, not the environment. Isolate outputs at the network boundary via mocks. Compare passively at semantic granularity, ignoring variable fields. The framework is a mirror of production, never a fork of it — passive, out-of-band, always subordinate to real traffic.',
    },
    decisions: [
      {
        q: 'Where to capture traffic — in-process middleware vs sidecar?',
        options: [
          'In-process middleware: lowest overhead, full request context.',
          'Sidecar container with GoReplay: zero application coupling, independent lifecycle.',
        ],
        chosen: 'Sidecar with GoReplay.',
        why: 'Zero application code changes. Independent rollout. Separate failure domain. Setup as a reusable Docker image with a few configurations across services. ~10% additional CPU/memory overhead measured in production.',
        tradeoff: 'Extra container resources and a network hop. Accepted because the alternative (in-process) couples capture lifecycle to release lifecycle.',
      },
      {
        q: 'TLS handling — terminate at LB or inside the pod?',
        options: [
          'Terminate at LB: simple, plaintext crosses internal network.',
          'In-pod Nginx sandwich: Nginx1 SSL-offloads, GoReplay captures plaintext, Nginx2 re-encrypts before app.',
        ],
        chosen: 'In-pod Nginx sandwich.',
        why: 'GoReplay is HTTP-aware and needs decrypted traffic. The sandwich keeps plaintext inside the pod, with Nginx1 doing SSL offload and Nginx2 (optional) re-encrypting before the application.',
        tradeoff: 'Two Nginx instances per pod and more config surface. Accepted because HTTP-level fidelity and in-pod security were both required.',
      },
      {
        q: 'Bus partitioning — what is the partition key?',
        options: [
          'tenant_id: groups by tenant but loses request/response co-location.',
          'transaction_id: guarantees request and response land on the same partition.',
        ],
        chosen: 'transaction_id as partition key.',
        why: 'Request and response for the same transaction must be paired by the validator. Same-partition placement makes pairing trivial without coordination logic on the consumer.',
        tradeoff: 'Requires consistent transaction_id propagation. Standardized as request metadata along with timestamp.',
      },
      {
        q: 'Downstream write handling — allow real writes or mock?',
        options: [
          'Allow real writes: true e2e validation, doubles downstream traffic.',
          'Envoy + Wiremock mock: zero blast radius, sacrifices true downstream e2e.',
        ],
        chosen: 'Envoy + Wiremock mock at sidecar.',
        why: 'Envoy proxies all outbound traffic from the parallel pod; based on configured rules it either allows, blocks, or reroutes downstream calls to Wiremock, which serves dynamic dummy responses. Blast radius is zero by construction — the parallel server cannot touch external state.',
        tradeoff: 'Cannot validate true downstream side-effect chains. Acceptable because corrupting downstream production is unacceptable; e2e validated separately in non-prod.',
      },
      {
        q: 'Data validation algorithm — full diff or workflow-scoped?',
        options: [
          'Full-table diff: correct but O(table size); infeasible at scale.',
          'Workflow-scoped BFS over FK graph, bounded by tenant + parent record + time window.',
        ],
        chosen: 'Workflow-scoped BFS.',
        why: 'Replay Validator Middleware maintains per-workflow config of impacted tables. Starting from tenant_id and parent_record_id, BFS traverses FK relationships within a bounded time window. Variable fields (Id, Timestamp, etc.) are intelligently ignored. Results logged to Splunk/ELK for analysis.',
        tradeoff: 'Requires accurate workflow→tables mapping config per write workflow.',
      },
      {
        q: 'Replay rate — fixed 1× or variable speed (0.5×/2×/3×)?',
        options: [
          'Sync 1×: easiest correctness, couples validator perf to prod.',
          'Async variable: decoupled, enables stability testing under peak.',
        ],
        chosen: 'Async with 0.5×/2×/3× replay support.',
        why: 'Replay Validator Middleware stores requests/responses for replay at variable speeds. Particularly useful for assessing system stability during peak traffic scenarios. Used during Hibernate upgrade and Oracle Exit to validate behavior before FY peak.',
        tradeoff: 'Validation lag — mismatches surface seconds to minutes after the request. Acceptable for non-real-time validation.',
      },
    ],
    algorithms: [
      {
        name: 'Workflow-scoped BFS over FK graph',
        description:
          'Per write workflow, lookup impacted tables from config. Starting at tenant_id and parent_record_id, traverse FK edges in both active and parallel DBs within a bounded time window. Compare resulting row sets with variable fields (Id, Timestamp) ignored.',
        complexity: 'O(impacted rows × avg row size) per workflow execution.',
        why: 'Full-table diff is infeasible at TB scale. Scoping by tenant + parent_record + time window gives bounded, semantically meaningful comparison.',
      },
      {
        name: 'Response normalization with variable-field ignore',
        description:
          'Before comparing active vs parallel responses, normalize: skip variable headers and fields (timestamps, generated IDs, transaction metadata). Per-workflow ignore config can be extended for known-divergent fields.',
        complexity: 'O(response size) per comparison.',
        why: 'Without normalization, every response would diff on timestamps and generated IDs. Normalization is required for the validator to produce signal instead of noise.',
      },
      {
        name: 'Correlation via transaction_id',
        description:
          'Request and response correlated through transaction_id propagated via request metadata. Both stored together on the same bus partition. Validator pairs them for response, data, and performance comparison.',
        complexity: 'O(1) pairing per transaction.',
        why: 'Without correlation, async pairing requires coordination logic. Same-partition placement eliminates the coordination problem.',
      },
    ],
    numbers: [
      { metric: 'Sidecar resource overhead', value: '~10% CPU & memory', note: 'Documented in setup specs. No service deterioration of production server.' },
      { metric: 'Traffic replicated', value: '1M+ requests/day', note: 'Supports HTTP, REST, GraphQL, SOAP, RPC. Extensible to non-HTTP.' },
      { metric: 'Replay speeds supported', value: '0.5× / 2× / 3×', note: 'Used for stress testing system stability before peak periods.' },
      { metric: 'Manual regression hours saved', value: '1000+', note: 'Org-wide across initiatives.' },
      { metric: 'Smooth Oracle Exit releases', value: '70+', note: '32 TB Oracle migration initiative; 0 P0/P1 issues.' },
      { metric: 'Hibernate upgrade hours saved', value: '200+', note: 'Hibernate 3.x → 5.x upgrade, validated using the framework before FY23 peak. 0 P0/P1.' },
      { metric: 'Sidecar listen port / forward port', value: '9443 → 8443', note: 'Sidecar intercepts inbound on 9443, forwards customer traffic to 8443.' },
    ],
    warStories: [
      {
        scenario: 'False positives from variable fields in responses',
        whatHappened:
          'Responses contain timestamps, generated IDs, and metadata that differ between active and parallel runs by design. Without normalization, every comparison would flag mismatch.',
        howResolved:
          'Validator intelligently ignores variable fields like Id, Timestamp, and similar. Per-workflow ignore config extensible for new known-divergent fields. Comparison results logged to Splunk/ELK with categorization.',
        lesson:
          'Normalization is a first-class feature in any comparison-based validator. The default mode must be to ignore known-noisy fields.',
      },
      {
        scenario: 'Downstream calls during replay',
        whatHappened:
          'Replaying write workflows would trigger real downstream calls (Notification service, payment processors, etc.) and double their traffic — violating their SLAs and corrupting their state.',
        howResolved:
          'Envoy sidecar in staging deployment pods captures all outbound traffic. Based on rules, allows / blocks / reroutes downstream calls to Wiremock, which returns dummy responses. Parallel server cannot reach external state.',
        lesson:
          'Any external side effect — call, write, event — must be mocked at the network boundary for blast radius to be zero by construction, not by convention.',
      },
      {
        scenario: 'TLS-encrypted traffic capture',
        whatHappened:
          'Production traffic is HTTPS; GoReplay needs HTTP-level visibility to capture endpoint, body, headers. Naive capture from outside the pod would either lose semantics (L4) or expose plaintext on the network.',
        howResolved:
          'Nginx1 inside the pod terminates TLS. GoReplay captures decrypted traffic. Nginx2 (optional) re-encrypts before forwarding to the application. Plaintext is contained within the pod boundary.',
        lesson:
          'Security boundaries should be physical (pod-level), not logical. In-pod TLS termination preserves both fidelity and isolation.',
      },
    ],
    edgeCases: [
      { case: 'Variable fields in responses (Id, Timestamp, etc.)', handling: 'Intelligently ignored by the validator. Per-workflow ignore-field config extensible.' },
      { case: 'Long-running workflows spanning multiple requests', handling: 'transaction_id propagates across requests, keeping all related events on the same partition.' },
      { case: 'Encrypted traffic at rest', handling: 'Request, response, and metadata encrypted before forwarding to the messaging system. Data secure at rest.' },
      { case: 'Active server performance impact', handling: 'Sidecar overhead held to ~10% CPU/memory. Capture and forwarding async to minimize impact on active request path.' },
      { case: 'Non-HTTP protocols', handling: 'Architecture extensible to non-HTTP per docs; current support covers HTTP/HTTPS with REST/GraphQL/SOAP/RPC.' },
    ],
    whatIWouldChange:
      'Anything here is your retrospective opinion, not from your docs. Sample candidates to consider (mark as your view): multi-tenant middleware to reduce per-team infra duplication; better self-serve onboarding to reduce time-to-value for new services; streaming capture to reduce storage costs. Verify before claiming.',
    chains: [
      {
        title: 'The capture-architecture chain',
        steps: [
          { q: 'Why sidecar instead of in-process middleware?', a: 'Zero coupling to app lifecycle, independent rollout, separate failure domain, no application code changes.' },
          { q: 'How do you handle HTTPS?', a: 'Nginx1 terminates TLS inside the pod, GoReplay captures plaintext, Nginx2 (optional) re-encrypts before the app receives it.' },
          { q: 'Why two Nginx instances?', a: 'GoReplay needs HTTP-level visibility, which requires plaintext. Sandwich keeps plaintext inside the pod boundary.' },
          { q: 'What is the actual production overhead?', a: '~10% CPU and memory documented in setup. No service deterioration observed.' },
          { q: 'How does the sidecar avoid impacting customer requests?', a: 'Sidecar listens on 9443, intercepts inbound, forwards customer traffic to 8443. Capture and forwarding are async so the request path is unblocked.' },
        ],
      },
      {
        title: 'The data-parity correctness chain',
        steps: [
          { q: 'How do you compare data across two databases at production scale?', a: 'BFS over FK relationships from tenant_id and parent_record_id, scoped by time window. Per-workflow config defines impacted tables. Variable fields ignored.' },
          { q: 'Why graph-based instead of full-table diff?', a: 'Full-table diff is O(table size). Workflow-scoped BFS is O(impacted rows) and semantically meaningful.' },
          { q: 'How do you handle non-deterministic fields?', a: 'Variable fields (Id, Timestamp, generated metadata) ignored by default. Ignore list extensible per workflow.' },
          { q: 'Where do results go?', a: 'Splunk/ELK with categorization. Deeper analysis via dashboards.' },
        ],
      },
      {
        title: 'The blast-radius chain',
        steps: [
          { q: 'What happens if the replay system goes down?', a: 'Nothing customer-facing. Production traffic continues unaffected; only validation coverage drops temporarily.' },
          { q: 'How do you guarantee zero impact to downstreams?', a: 'Envoy + Wiremock at the parallel pod boundary. All outbound calls captured; mocks return dummy responses. Parallel server cannot reach external state.' },
          { q: 'What is the worst-case failure of the framework itself?', a: 'Missing a regression. The framework is passive — it can fail to catch issues, never cause them.' },
          { q: 'How is the parallel server\'s mock config protected from misconfiguration?', a: 'Mock config is part of the sidecar setup, gated by deployment review. The parallel server has no path to production downstreams by design.' },
        ],
      },
    ],
    followUps: {
      firstPrinciples: [
        { q: 'Why can\'t automated tests replace this? Isn\'t that what test suites are for?', a: 'Automated tests and contracts validate expected behavior. This validates real-world behavior — unexpected traffic patterns, edge-case data shapes, load characteristics that only exist in production. It complements testing, does not replace it.' },
        { q: 'Isn\'t running a parallel production stack wasteful?', a: 'For a $270B/year money-movement platform, missing one regression costs more than the parallel infra for a year. It is risk-management, not vanity engineering.' },
        { q: 'Why not sample and replay in staging instead?', a: 'Staging cannot reproduce production data shape, tenant count, or workflow permutations. Cloned data goes stale within days. Real traffic against a parallel prod stack is the only way to get truth.' },
        { q: 'If it is passive, how does it catch anything?', a: 'It observes the difference between active and parallel outputs. Divergence is signal. Passive on the request path; active on the comparison.' },
      ],
      architecture: [
        { q: 'Why not use Envoy tap or service mesh mirror instead of a sidecar?', a: 'The monolith was not on a service mesh. Sidecar was the lowest-coupling option that did not require mesh adoption. If mesh were available, tap would be a strong alternative.' },
        { q: 'Why GoReplay over tcpreplay or custom capture?', a: 'tcpreplay works at L4 (packets), losing HTTP semantics. Custom capture reinvents a mature tool. GoReplay is HTTP-aware, filterable by endpoint, and has low overhead.' },
        { q: 'Why in-pod TLS termination instead of terminating at the load balancer?', a: 'LB termination puts plaintext on the internal network. In-pod keeps plaintext inside the pod boundary. Trust boundary matches the physical boundary.' },
        { q: 'How do you handle stateful requests where request N depends on request N-1?', a: 'transaction_id partitioning + same-partition placement of related requests keeps ordering per workflow. The consumer sees the sequence in order.' },
        { q: 'Would you use Kafka, Kinesis, or SQS for the bus?', a: 'Kafka. Ordered per partition, high throughput, retention for replay. SQS is unordered; Kinesis has lower partition throughput ceilings.' },
        { q: 'Why not compare responses in the sidecar itself instead of shipping everything to a middleware?', a: 'Sidecar overhead is capped at ~10%. Comparison is CPU-heavy. Off-loading to a separate validator keeps the sidecar predictable and lets the validator scale independently.' },
      ],
      correctness: [
        { q: 'How do you know your normalization does not hide real bugs?', a: 'Ignore lists are per-workflow, reviewed on every change. Anything not on the list flags. Periodic audit compares list against schema changes.' },
        { q: 'What if the two databases have eventual-consistency lag between them?', a: 'Data comparison is bounded by request_timestamp ± Δ. Drift outside the window is reported as informational, not failure.' },
        { q: 'How do you prove a "clean" run is actually clean?', a: 'Sampling audit — take a subset of "clean" workflows and manually inspect. False-negative rate held below a threshold. This is the only guard against silent under-detection.' },
        { q: 'What if the parallel app is a newer version and behaves differently by design?', a: 'That is the intended case for validating refactors. Per-workflow config has an allow-divergence flag for known intentional differences. Everything else flags.' },
      ],
      scale: [
        { q: 'What breaks first if traffic doubles?', a: 'Validator CPU on comparison. Sidecar overhead stays roughly linear. Bus is designed for headroom. Scaling validator consumers horizontally is the first lever.' },
        { q: 'What if you had to replay across regions?', a: 'Regional bus per capture zone, regional validator per zone. Cross-region comparison only if genuinely needed. Most bugs are regional.' },
        { q: 'What is the largest workflow you have validated?', a: 'Workflows with 20+ impacted tables. BFS scoping keeps comparison bounded per invocation regardless of total table count.' },
      ],
      operational: [
        { q: 'How do you debug a mismatch that only shows in production?', a: 'Request/response persisted with correlation id. Pull the pair from storage, replay locally against a stub, isolate the diverging field.' },
        { q: 'What is the on-call story for this system?', a: 'Framework itself has SLOs on capture rate and validation lag. Alerts on capture drops, bus lag, validator error rate. Framework failure never blocks releases; it just reduces coverage.' },
        { q: 'Who onboards a new service to the framework?', a: 'Paved-path documentation. Service owners deploy the sidecar via reusable Docker image with a few config values. Framework team supports onboarding and workflow config.' },
      ],
      organizational: [
        { q: 'How did you get downstream teams to agree to be mocked?', a: 'Framing: their SLAs would be violated by doubled traffic. Mocking protected them. Reframed from "asking a favor" to "protecting your service."' },
        { q: 'How did you convince leadership to invest in this?', a: 'Business-risk framing. $270B/year money movement + no reliable production-scale validation. The Oracle Exit initiative was the concrete forcing function — 32 TB migration with no confidence path without this.' },
      ],
      career: [
        { q: 'If you rebuilt this from scratch today, what would you change?', a: 'Multi-tenant middleware from day one to avoid per-team infra duplication. Better self-serve onboarding to reduce time-to-value. Streaming capture to reduce storage cost.' },
        { q: 'What is the deepest lesson you took from this?', a: 'Blast radius must be structural, not procedural. Do not trust "we will not misuse this" — design so misuse is architecturally impossible. Mocks at the network boundary, not conventions in code.' },
      ],
      conceptualFoundations: [
        { q: 'What does "terminating TLS" actually mean, and why is it needed here?', a: 'TLS encrypts bytes between two endpoints; anyone in the middle sees opaque ciphertext. "Terminating" means: this is the point where the encrypted connection ends — the component holding the private key performs the handshake and decrypts the stream into plaintext HTTP. GoReplay needs HTTP-level visibility (method, path, headers, body) to capture anything replayable — and TLS session keys are ephemeral per-connection, so ciphertext captured on the wire can never be decrypted later. Decryption must happen before the capture point. Nginx-1 terminates, GoReplay passively reads the plaintext gap, Nginx-2 re-encrypts so the app receives TLS unchanged. GoReplay itself never encrypts or decrypts anything — Nginx does both. The security line: plaintext exists only inside the pod, so the trust boundary matches the physical boundary.' },
        { q: 'Is the traffic on the event bus encrypted or plaintext, and why?', a: 'Encrypted — but with payload-level encryption (IDPS keys), which is different from TLS. TLS protects data in motion between two endpoints; payload encryption protects the data itself wherever it sits — on Kafka with retention, in the validator DB. Shared infrastructure with customer financial data cannot hold readable payloads for anyone with topic access. The validator holds the keys and decrypts only at comparison time. Full journey: TLS-encrypted → Nginx-1 decrypts → captured plaintext → IDPS-encrypted → bus → decrypted inside the validator.' },
        { q: 'How is the cloned database actually created, and why does weekly refresh not make it uselessly stale?', a: 'Cloning is storage-level snapshot + restore — copy-on-write at the block level, which clones terabytes in minutes; the clone shares blocks with the source and diverges as writes happen. Weekly is acceptable because of what replay validates: for write workflows, the rows being compared were just created BY the replay seconds after production created its copy — both sides executed the same request against roughly the same prior state, so staleness of unrelated old data is irrelevant. For reads, staleness can cause divergence — handled by the time-window-bounded comparison (request_timestamp ± Δ) and by classifying known-drift as informational, not failure. Crucially the clone has NO live replication: a replica would receive each write twice (once via replication, once via replay). Independence means replay owns all mutation, making each replay campaign a clean, reproducible experiment.' },
        { q: 'Walk me through exactly how Envoy + Wiremock make downstream writes safe.', a: 'The parallel server runs real code that makes real outbound calls — payments, notifications. Envoy is deployed as the egress proxy: every outbound call from the parallel app routes through it invisibly (the app thinks it is calling the real service). Per destination, Envoy allows (safe reads), blocks, or reroutes to Wiremock. Wiremock is a programmable fake HTTP server returning plausible responses — right status, right shape, templated fields echoing request IDs. The key insight: the application code path executes COMPLETELY — builds the request, sends it, parses the response, updates its own DB, continues. Only the external effect never happened. Blast radius is zero by construction: the parallel pod has no network path to real downstreams; misconfigured app code cannot bypass a network-layer interception. Trade-off to state: you lose true downstream e2e validation — accepted, because corrupting downstream production is categorically worse, and downstream correctness is validated in non-prod.' },
        { q: 'Explain Kafka partitioning and how transaction_id guarantees request/response pairing.', a: 'A topic splits into partitions — independent append-only logs. Partition = unit of parallelism AND unit of ordering: within one partition, offsets give absolute order; across partitions there is no ordering guarantee at all. Producers send with a key; Kafka computes hash(key) % partitions — same key always lands on the same partition. Consumers in a group divide partitions, each partition owned by exactly one consumer. Keying both request and response with transaction_id means: same hash → same partition → strict order (request before response) → same consumer sees both. Pairing becomes trivial — no cross-consumer coordination, no distributed state. If asked "but Kafka does not guarantee global ordering": correct, and we never needed it — we needed per-transaction ordering, which per-key partitioning provides exactly. The hard problem was dissolved by choosing the right key.' },
        { q: 'Why does the validator middleware need its own database, and what does it store?', a: 'Comparison is stateful across time: the active response arrives at T, the parallel response seconds later — something must hold the first until the second exists. Beyond buffering, you need lookup by transaction_id, persistence of comparison verdicts, and retention of full request/response pairs for debugging (engineers pull both payloads side by side on mismatch) and for later re-replay. It stores: request, both responses, latencies from both sides, workflow metadata, and verdicts. On which engine: the source does not name one — reason from access pattern instead: append-heavy writes, key lookup by transaction_id, TTL expiry, no complex joins. That shape fits key-value/document stores well. Saying "the access pattern matters more than the engine" is the stronger interview answer.' },
        { q: 'Where does BFS come into data validation? Explain like I have never seen it.', a: 'A relational schema IS a graph: rows are nodes, foreign-key references are edges. One write request (create invoice) writes a small connected subgraph — invoice row, its line rows, tax entries, audit record — all hanging off one parent record. To validate data parity you must compare exactly those rows in both DBs, and full-table diff at TB scale is impossible and meaningless. BFS = explore the graph level by level from a start node. Start: (tenant_id, parent_record_id). Level 1: rows in configured impacted tables directly referencing the parent. Level 2: rows referencing those. Bound everything by the time window (request_timestamp ± Δ). Run the identical traversal on active and clone, compare the two row-sets ignoring variable fields. Cost: O(rows this request touched) — typically tens — instead of O(table). The time window does double duty: bounds the traversal AND excludes clone-staleness drift.' },
        { q: 'What do TP90/95/99 actually measure, and what does "slow workflows surfaced before release" mean concretely?', a: 'Averages lie: 99 requests at 100ms + 1 at 10s averages to ~199ms while 1% of users suffered. TPxx = the latency value that xx% of requests beat; TP99 is the experience of the unluckiest 1% — which at 1M requests/day is 10,000 real requests. The validator computes per-workflow percentiles for active and parallel over the SAME replayed traffic: same requests, same data, two code versions — any distribution difference is attributable to the code. Concrete scenario: Hibernate 3→5 upgrade on the parallel server; most workflows identical, but estimate-update TP99 jumps 800ms → 4s from a changed query plan. That regression becomes a dashboard finding BEFORE release instead of a production incident after — that mechanism is the "200+ hours saved" claim. Per-workflow, not global, because one workflow\'s regression drowns in a million mixed requests.' },
        { q: 'How does 2×/3× load replay mechanically work, and where is the traffic stored for replay?', a: 'Two storage layers: Kafka retention (messages persist for the retention window; re-consuming = resetting consumer offsets) and the validator DB (explicit pairs, selectable long after). Speed multiplication works on inter-arrival gaps: captured traffic is a timestamped sequence, and the gaps encode production load shape. 1× preserves gaps; 3× compresses every gap by three — same requests, same order, triple the arrival rate. This is real traffic mix (real endpoint distribution, payload sizes, tenant skew) at hypothetical future volume — which no synthetic load test reproduces. Staleness: for stress testing (the main 3× use) it is irrelevant — you measure saturation, error rates, latency under load, and week-old reads do the same work. For correctness replays, refresh the clone first; since the clone has no replication, replayed writes are the only writes — a fresh clone + a stored traffic run is a clean, repeatable experiment.' },
        { q: 'How do you ACTUALLY perform BFS on a database — is there a graph in memory?', a: 'No in-memory graph. The graph is implicit in the foreign keys, and each LEVEL of the BFS is one SQL query that follows FKs outward. Normal BFS calls node.getNeighbors(); here getNeighbors() IS a SQL query — "give me all rows whose FK points at this row." Concretely for create-invoice (invoice 5001): Level 0 = SELECT the invoice by id + time window. Level 1 = for each table referencing invoices (invoice_lines, audit_log), SELECT where invoice_id=5001 within the window. Level 2 = SELECT from tables referencing THOSE rows (tax_entries where invoice_line_id IN the level-1 ids). Stop when no table references the current level — those are leaf nodes. Underneath it is textbook BFS (queue + visited set) where the "adjacency" is a SQL call. Two guardrails keep it bounded: the per-workflow config declares which tables the workflow touches (so you never walk the whole schema out to the tenant and back), and the time window (created_at BETWEEN t_start AND t_end) on every query scopes each hop to rows THIS request wrote. Schema graph = which edges CAN exist; data BFS = which edges DO exist for this request.' },
        { q: 'Interview delivery: what is the clean 4-beat opener for this project?', a: 'Beat 1: a general-purpose traffic capture and replay framework for validating high-risk backend changes against real production traffic, safely, without impacting customers or downstreams. Beat 2: the problem — 100k+ daily customers, financial data; on a risky change (Oracle exit, Hibernate upgrade, MySQL→Postgres) manual/automated tests only cover cases you thought of and cannot reproduce production shape. Beat 3: core idea — run a passive parallel server with the change applied and replay real traffic against it, comparing response parity, data correctness, and latency; the word passive is load-bearing (never serves a customer, never touches downstream state). Beat 4: mechanism + impact — sidecar captures, Kafka buffers, a replay validator compares three dimensions, persisted traffic enables 2×/3× load testing; backed multiple migrations with zero customer-facing incidents. Frame the DB migration as ONE example of a platform, not the reason the platform exists.' },
        { q: 'Interview delivery: the reflex that upgrades every answer?', a: 'After stating any design choice, add the sentence "...because the alternative would have...". It forces the reasoning out. Sidecar because in-process would couple the failure domain and release lifecycle to the app. Re-encrypt because plaintext on the network would break the trust boundary. Mock writes at the network layer because doing it in code would be safe-by-convention not safe-by-construction. The consistent trap to avoid: stating the WHAT and going quiet on the WHY, or answering only the part you are sure of when asked three things. When asked three things, answer three things — the part you are tempted to skip (the staleness reasoning, the by-construction proof) is usually the highest-scoring part.' },
      ],
    },
  },
  'cms-migration': {
    framing:
      'Distributed-systems project with documented FMEAs. Failure modes below are taken from your FMEA doc — they are scenarios designed for, not necessarily incidents that occurred. Frame as "scenarios our design accounts for" in interviews, not "things that happened."',
    firstPrinciples: {
      reduction:
        'When two services own overlapping state, how do you know they agree?',
      invariants: [
        'A timeout is not a failure. It is an "unknown" — the actual outcome must be discovered, not assumed.',
        'User-facing actions require strong consistency of outcome. The user must see a deterministic yes/no.',
        'Downstream projections (time tracking, transactions, reports) can be eventually consistent — but the window must be observable.',
        'One authoritative sync path is safer than two. Two paths drift over time.',
        'Every cross-service request must carry a correlation identifier, or reconciliation becomes impossible.',
      ],
      tensions: [
        'Strong consistency for user actions ⇄ Eventual consistency for downstream scaling.',
        'Single source of truth (correctness) ⇄ Defense-in-depth via multiple paths (redundancy).',
        'Retry aggressively (recover fast) ⇄ Idempotency requirements (prevent duplicate work).',
        'Observability cost ⇄ Cost of silent drift.',
      ],
      synthesis:
        'Remove the legacy fallback path. Make the CMS API the single authoritative sync. Treat timeout as unknown; reconcile via correlation id + follow-up reads + compensating actions. Enforce idempotency on CMS. Accept eventual consistency for downstream projections but instrument consumer lag so the window is visible.',
    },
    decisions: [
      {
        q: 'API-based vs event-based for project ↔ CMS sub-customer sync?',
        options: [
          'API-based (sync): low effort, stronger consistency for user actions, medium FMEAs.',
          'Event-based: medium effort, fewer FMEAs, but eventual consistency for txn updates.',
        ],
        chosen: 'API-based (Approach #1).',
        why: 'Based on discussion with CMS team. User-facing create/update needs strong consistency. Approach #1 had lower effort, comparable closeness to target state, and acceptable FMEA profile.',
        tradeoff: 'Timeout-causes-inconsistency FMEAs require explicit handling. Reconciled via idempotency + retry/compensation paths.',
      },
      {
        q: 'On API timeout — retry blindly or reconcile?',
        options: [
          'Treat timeout as failure: rolls back project, loses successful CMS work.',
          'Treat timeout as "unknown": reconcile via follow-up reads + compensating actions.',
        ],
        chosen: 'Reconcile.',
        why: 'Your design: "We stopped treating timeout as failure. We treated it as \'unknown\', then reconciled via idempotency + follow-up reads + compensating actions." Every request carries correlation ID / transaction ID.',
        tradeoff: 'More code surface (reconciliation paths, correlation tracking). Necessary to preserve user intent across transient infra issues.',
      },
      {
        q: 'Legacy v4 fallback events — keep or remove?',
        options: [
          'Keep as fallback: defense in depth, dual paths.',
          'Remove: single authoritative sync path via CMS API.',
        ],
        chosen: 'Remove v4 fallback.',
        why: 'Per your prep guide: "you improved consistency by removing the legacy fallback event path and making a single authoritative sync path, plus observability + compensations to drive failure rate down." Two sync paths cause drift.',
        tradeoff: 'Lose dual-path redundancy. Replaced with idempotency + reconciliation for safety.',
      },
    ],
    algorithms: [
      {
        name: 'Correlation-id-based reconciliation',
        description:
          'Every CMS API request carries a correlation ID / transaction ID. On timeout: treat outcome as unknown. Follow-up read against CMS using the correlation ID determines actual state. If sub-customer exists → finalize project. If not → idempotent retry.',
        complexity: 'O(1) per reconciliation.',
        why: 'Distributed systems cannot distinguish "request lost" from "response lost." Correlation ID enables outcome determination after timeout.',
      },
      {
        name: 'Observability instrumentation (DWSM + consumer lag)',
        description:
          'End-to-end tracing enabled via DWSM. Consumer lag monitors for downstream consumers (QBTime, STS/ETS/FTS) so eventual-consistency delays surface as alerts, not silent staleness.',
        complexity: 'Standard instrumentation.',
        why: 'Without consumer lag monitoring, users hit stale projection views and the system surface looks broken. Lag monitors expose the eventual consistency window for operators to manage.',
      },
    ],
    numbers: [
      { metric: 'Sync failure reduction', value: '~95%', note: 'Achieved by removing legacy fallback event path + single authoritative sync path + observability + compensations.' },
      { metric: 'Removed legacy paths', value: 'Monolith APIs + v4 fallback event', note: 'Both replaced by single CMS API with idempotency.' },
      { metric: 'Affected downstreams', value: 'QBTime, STS, ETS, FTS, BKTS', note: 'Per-consumer lag monitors documented in FMEAs.' },
    ],
    warStories: [
      {
        scenario: 'FMEA: API to create sub-customer times out',
        whatHappened:
          'Documented failure scenario: API times out after sub-customer creation. User sees FCI that project creation failed. However sub-customer is created and appears in quickfills/sales forms. User could create txns with that project, but Project details would error. Project would not appear on Project List Page.',
        howResolved:
          'DWSM enabled for end-to-end flow tracing. Correlation ID enables post-timeout reconciliation. Idempotent CMS API ensures retries do not duplicate sub-customers.',
        lesson:
          'In distributed systems, "no response" is not "no action taken." Always reconcile before destructive cleanup.',
      },
      {
        scenario: 'FMEA: Update project to change sub-customer times out',
        whatHappened:
          'User updates project to change parent customer. CMS update API times out. User sees update-failed message. But sub-customer is updated with new parent customer. Reports for that customer get corrupted because sub-customer has moved.',
        howResolved:
          'DWSM tracing surfaces the discrepancy. Per your prep guide, this is documented as "the nastiest FMEA in your doc (reports corruption)." Compensation flow surfaces mismatch via alerts; manual reconciliation tooling addresses corrupted reports.',
        lesson:
          'Cross-service updates with structural impact (parent moves) need explicit FMEA. Retry logic alone is insufficient for hierarchy changes.',
      },
      {
        scenario: 'FMEA: User converts sub-customer to project, immediately opens project details',
        whatHappened:
          'Documented scenario: user converts sub-customer to project and quickly opens project details. Delay in Project create event consumption in QBTime → no time activities visible. Same for STS/ETS/FTS → no transactions visible.',
        howResolved:
          'Monitor consumer lag in QBTime, STS, ETS, BKTS with proper alerting. UX guidance: refresh page. DWSM trace end-to-end flow.',
        lesson:
          'Eventual consistency for downstream projections is acceptable, but the window must be observable and the user must be guided.',
      },
      {
        scenario: 'FMEA: Project activation/inactivation times out',
        whatHappened:
          'Documented: API to activate/inactivate sub-customer times out. User sees failure message. But sub-customer gets activated/inactivated. Quickfills + transactions show incorrect data.',
        howResolved:
          'DWSM tracing. Reconciliation via correlation ID determines actual state. Idempotency ensures retry safety.',
        lesson:
          'Boolean state toggles have the same timeout problem as creates/updates. Reconciliation must cover all state-mutation surfaces, not just creates.',
      },
    ],
    edgeCases: [
      { case: 'Idempotent retry from different application server', handling: 'Idempotency key is the projectId, not the calling server. Any server retrying produces the same call. CMS dedupes.' },
      { case: 'CMS API extended outage', handling: 'Project create/update fails fast with explicit error. Reconciliation queue drains once CMS recovers.' },
      { case: 'Reports corruption from parent-customer move timeout', handling: 'DWSM trace + compensation alert. Manual reconciliation tooling for affected reports. Documented as a high-severity FMEA.' },
      { case: 'Downstream consumer lag visible to user', handling: 'UX guidance: refresh page. Consumer lag monitors with alerting for operators.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only. Possibilities: build the FMEA before the implementation, not alongside; reconciliation queue dashboard from day one. Mark as your view.',
    chains: [
      {
        title: 'The timeout-handling chain',
        steps: [
          { q: 'CMS API times out. What does your code do?', a: 'Treat as unknown. Follow-up read via correlation ID determines actual state. If sub-customer exists → finalize project. If not → idempotent retry.' },
          { q: 'How do you prevent duplicate sub-customers on retry?', a: 'CMS API is idempotent on projectId. Same key → same sub-customer.' },
          { q: 'What if reconciliation also times out?', a: 'Persistent reconciliation queue. Backoff + retry. Alert if queue depth grows.' },
          { q: 'What proves the 95% sync-failure reduction?', a: 'Pre-state: drift detector counted daily mismatches across legacy paths. Post-state: cross-service consistency monitor shows real-time mismatch count. 95% reduction is the comparison.' },
        ],
      },
      {
        title: 'The eventual-consistency tradeoff chain',
        steps: [
          { q: 'Why is the user-facing CMS sync strongly consistent but downstreams eventually consistent?', a: 'User-facing action requires immediate visibility of outcome. Downstream projections (time tracking, transaction references) are eventual by design — making them sync would not scale.' },
          { q: 'How long is the inconsistency window?', a: 'Bounded by consumer lag. Monitored per consumer. Alerts fire above threshold.' },
          { q: 'What does the user see?', a: 'For just-converted project, no time activities or transactions until consumer catches up. UX guidance: refresh.' },
          { q: 'What about reports referencing the moved customer?', a: 'Reports corruption is the nastiest documented FMEA. DWSM trace + compensation flow + manual reconciliation tooling.' },
        ],
      },
    ],
    followUps: {
      firstPrinciples: [
        { q: 'Why is a timeout an "unknown" rather than a failure?', a: 'A timeout means the response was lost, not that the work was not done. The request may have fully succeeded on the server. Assuming failure and rolling back would discard real work and create drift.' },
        { q: 'Why not just make both services fully synchronous and transactional?', a: 'They are separate services with separate databases. A distributed transaction (2PC) across them would couple availability — if CMS is down, Projects cannot write. We chose reconciliation over distributed locking.' },
        { q: 'Why remove the fallback path instead of keeping it for safety?', a: 'Two sync paths mean two sources of truth that drift. A fallback that is rarely exercised is a fallback you cannot trust. One authoritative path plus reconciliation is more reliable than two racing paths.' },
      ],
      architecture: [
        { q: 'Why did you choose API over events, given events scale better?', a: 'User-facing create/update needs a deterministic outcome the user sees immediately. Events give eventual consistency, which is wrong for the action itself. We use events downstream, API for the user action.' },
        { q: 'What is the idempotency key and why does it matter?', a: 'projectId. Retries carry the same key so CMS dedupes — a retry after timeout cannot create a duplicate sub-customer.' },
        { q: 'How does reconciliation actually work step by step?', a: 'On timeout, treat as unknown. Follow-up read to CMS by correlation id. If sub-customer exists, finalize the project. If not, idempotent retry. Persistent queue if CMS is unreachable.' },
        { q: 'What is DWSM and why did you need it?', a: 'End-to-end distributed tracing. Without it, a timeout is a black box — you cannot tell whether CMS succeeded. Tracing makes the actual outcome observable.' },
      ],
      correctness: [
        { q: 'How do you prove sync failures actually dropped 95%?', a: 'Pre-state: a drift detector counted daily mismatches across the two legacy paths. Post-state: a cross-service consistency monitor reports real-time mismatch count. The 95% is the before/after comparison.' },
        { q: 'What if reconciliation itself keeps failing?', a: 'Persistent reconciliation queue with backoff. Alert on queue depth. It never silently gives up — a stuck item is visible and actionable.' },
        { q: 'How do you handle the reports-corruption FMEA specifically?', a: 'DWSM trace flags the parent-move discrepancy. Compensation flow raises an alert. Manual reconciliation tooling repairs affected reports. It is the highest-severity documented case.' },
      ],
      scale: [
        { q: 'How does this behave under CMS partial outage?', a: 'User actions fail fast with explicit error rather than hanging. Reconciliation queue accumulates and drains on recovery. No silent data loss.' },
        { q: 'What is the throughput ceiling of the sync API path?', a: 'Bounded by CMS API capacity. For user-facing actions this is acceptable — they are human-paced. Bulk operations route through a different batch path.' },
      ],
      operational: [
        { q: 'What do you alert on?', a: 'Timeout rate, retry rate, reconciliation queue depth, consumer lag per downstream (QBTime/STS/ETS/FTS/BKTS), and cross-service mismatch count.' },
        { q: 'How would you debug a user reporting "my project disappeared"?', a: 'DWSM trace by correlation id. Determine whether CMS created the sub-customer and whether the project transaction committed. Reconcile the divergent side.' },
      ],
      organizational: [
        { q: 'How did you get alignment on API vs events?', a: 'Decision was made in discussion with the CMS team. Documented the comparison (effort, consistency, complexity, FMEA profile) and chose API for the consistency guarantee on user actions.' },
        { q: 'How did you handle the resume-vs-doc contradiction risk?', a: 'Precise framing: I improved consistency by removing the legacy fallback path and making a single authoritative sync, plus observability and compensation. I never claim "events eliminated issues" — the doc shows API was chosen.' },
      ],
      career: [
        { q: 'What is the transferable lesson here?', a: 'In distributed systems, absence of confirmation is not confirmation of absence. Design every cross-service call so the true outcome is discoverable after the fact — correlation ids, idempotency, reconciliation.' },
        { q: 'If you rebuilt it, what would you do differently?', a: 'Write the FMEA before the implementation, not alongside. Build the reconciliation-queue dashboard on day one so the eventual-consistency window is visible from the start.' },
      ],
      conceptualFoundations: [
        { q: 'Why does this problem exist at all — what is the root cause?', a: 'A project is two records in two systems that must agree. QuickBooks never rebuilt the transaction/reporting layer to understand a "project" entity — that layer speaks customer-hierarchy. So a project is represented as a project record in the projects service (IPM) PLUS a sub-customer record in CMS, linked by a projectRef. Every create/update/inactivate must land in both systems. The project is only correct when both records agree. That dual-record reality is the source of every hard problem here.' },
        { q: 'Why does "sub-customer to project conversion" exist specifically?', a: 'Before real Projects existed, users tracked jobs as sub-customers under a customer (the Customer:Job model inherited from Desktop). Millions had years of history structured that way. Conversion lets them adopt the Projects experience without losing history — IPM creates a project record and links it to the existing sub-customer. It is the sharpest case of the dual-record problem because the sub-customer already has real transactions hanging off it, so getting the dual-write wrong does the most damage. That is why the resiliency POC was scoped to conversion.' },
        { q: 'What were the THREE things wrong with the legacy design?', a: 'One — two sync paths writing the same state (monolith APIs plus a v4 fallback event), which race, diverge, and rot silently because the rarely-exercised fallback is least tested exactly when it runs. Two — a timeout was treated as a failure, when a timeout actually means the outcome is UNKNOWN (the write may have succeeded and the response was lost). Three — the monolith was being decommissioned anyway, so the migration was forced, and the team used the forcing function to fix the consistency model rather than port the broken design.' },
        { q: 'Why is "two racing sync paths" fundamentally a drift machine?', a: 'You cannot reason about the final state of a system where two independent mechanisms both claim authority over the same data. They race (nondeterministic order), diverge (one succeeds, one fails), and the fallback path is the least-tested code running when the primary is already failing. The fix is a DELETION not a cleverness — collapse to one authoritative CMS API path. One writer is analyzable; two writers are undecidable.' },
        { q: 'Why is "timeout = failure" the deeper bug, and how did you fix it?', a: 'It is the Two Generals problem in production: from the caller side, "request lost" and "response lost" look identical — silence. Treating that silence as failure means you leave IPM updated while believing CMS never got the write — silent drift, one lost-response at a time. Fix: treat timeout as UNKNOWN, then resolve it with a READ not a guess. Every call carries a correlation ID; bounded timeouts make failure detectable at a known point; on timeout, follow-up read to CMS by correlation ID; if the sub-customer exists roll forward (finalize), if not roll back or idempotent-retry.' },
        { q: 'What is the single most important subtlety in the reconciliation design?', a: 'You must RECONCILE BEFORE you COMPENSATE. If you blindly roll back on every timeout, and the CMS call had actually succeeded, you soft-delete a project that CMS still references — manufacturing the exact OPPOSITE inconsistency you were preventing. Compensation on an unknown outcome creates drift. So reconciliation decides (read the true state), compensation executes. This is the point that proves you operated the system rather than read about the saga pattern.' },
        { q: 'How does idempotency make retry safe here?', a: 'The idempotency key is projectId. If a call timed out but actually succeeded and you retry, CMS sees the same key and returns the existing sub-customer instead of creating a duplicate. Without it, every retry risks a duplicate sub-customer — converting temporary uncertainty into permanent bad data. Idempotency is what turns retry from a gamble into a safe strategy.' },
        { q: 'What are the per-operation compensation recipes?', a: 'Create fails at CMS → soft-delete the just-created IPM project (must retain its ID; soft delete is idempotent, audit-preserving, no FK cascade). Update fails → revert the IPM entity to its previous version (must hold the prior model before mutating). Inactivate fails → undelete, flip deleted=false. And compensation is hardened: runs once then async-retries 3x under bounded timeouts, because "what if the compensation itself fails" needs a real answer.' },
        { q: 'Why sync API for the user action but async events for downstream?', a: 'The user-facing write (project ↔ CMS) needs a deterministic outcome the user sees immediately — their next action depends on it — so it is a synchronous API. Downstream systems (STS, ETS, FTS, QBTime) hold their own denormalized projectRef and tolerate bounded staleness, so IPM publishes a domain event they consume asynchronously. Two different consistency requirements, two different mechanisms — not one-size-fits-all. Rolled out behind two flags (publish, consume) so either side toggles independently.' },
        { q: 'Which distributed-transaction patterns apply, and why NOT 2PC?', a: 'Not 2PC: IPM and CMS are separate services with separate DBs; 2PC needs both to hold locks between prepare and commit under a coordinator. CMS is a shared platform service that will not hold locks for your workflow, and 2PC blocking couples your availability to coordinator health on a user-facing path. What it actually is: an orchestrated saga (two local transactions, IPM service layer as orchestrator, compensating transaction on failure) — with the twist that reconciliation gates the compensation. The downstream event publication is a dual-write problem, which is what the transactional outbox pattern solves (verify whether this publish used the outbox before claiming it).' },
        { q: 'Where does the 95% sync-failure reduction come from?', a: 'A sync failure = a detected mismatch between IPM project state and CMS sub-customer state. Before: a drift detector counted mismatches daily on the legacy paths (baseline). After: a cross-service consistency monitor counts them in near-real-time on the new path. 95% is (baseline − new)/baseline. Causally credible because each legacy failure category maps to a specific fix: dual-path race gone, timeouts reconciled instead of becoming permanent drift, idempotent retries killing duplicate-creation. Be ready for "why not 100%?" — honest residual: extended CMS outages that exhaust retries, novel failure modes.' },
        { q: 'The 90-second spoken spine for this project?', a: 'A project is two records in two systems that must agree, because the transaction layer speaks customer-hierarchy not projects. The old design had two racing writers and treated lost responses as failures, so they drifted silently. The new design has one authoritative CMS API path, treats a timeout as an unknown to be reconciled by reading CMS rather than guessing, retries idempotently, gives every failure a tested compensation — reconciling before compensating so it never manufactures the opposite inconsistency — and propagates downstream via async events while keeping the user action synchronous. Result: ~95% fewer sync failures.' },
      ],
    },
  },
  'change-orders': {
    framing:
      'Financial feature with extensive PRD documentation. All decisions, rules, and edge cases below are from your PRD. The "failure modes designed for" section contains documented risks from your PRD that the design accounts for — NOT incidents you should claim happened unless you recall them.',
    firstPrinciples: {
      reduction:
        'How do you change a signed financial document without changing what was signed?',
      invariants: [
        'The original estimate is immutable. Customer signoff applies to a specific state — that state must survive verbatim.',
        'Money math must be deterministic. Given the same set of accepted COs, the estimate total is always the same number.',
        'Rejected scope never appears in totals. Pending scope is visible but never counted. Only Accepted counts.',
        'An issued invoice is a point-in-time record. Later state changes never retroactively rewrite it.',
        'Tax must reflect current rules on the current scope — an override made against old scope is stale by definition.',
      ],
      tensions: [
        'Auditability (immutable history) ⇄ Usability (users just want to "fix the estimate").',
        'Single invoice path (correctness) ⇄ User mental model ("I should invoice this CO directly").',
        'Automatic recalculation (tax correctness) ⇄ User overrides (their explicit intent gets discarded).',
        'Visibility of pending scope ⇄ Not polluting the committed total.',
      ],
      synthesis:
        'Model the change as a new, separate transaction linked to the immutable original. Derive the effective estimate as original + accepted COs, computed by explicit per-status inclusion rules. Route all invoicing through the estimate so there is exactly one money path. Recalculate tax on every accept because scope changed — the old override answered a question that no longer exists.',
    },
    decisions: [
      {
        q: 'Change Order as separate transaction vs estimate edit?',
        options: [
          'Edit estimate in place: breaks audit trail.',
          'Separate CO linked to estimate: preserves immutability, clean audit.',
        ],
        chosen: 'Separate CO linked to estimate.',
        why: 'Original estimate must remain immutable for audit + customer signoff. CO is "an additional line" that updates the overall estimate total only when accepted. Audit traceability is non-negotiable.',
        tradeoff: 'More complex rollup logic (estimate total = original + accepted COs). Worth it for audit + signoff guarantees.',
      },
      {
        q: 'Allow CO to edit any line attribute, or only qty on existing lines?',
        options: [
          'Full edit on existing lines: max flexibility, original estimate effectively rewritten.',
          'Qty-only on existing + full edit on new lines.',
        ],
        chosen: 'Qty-only on existing + full edit on new.',
        why: 'A CO is "an additional line" to the original estimate. Only editable field for existing P/S is qty. New P/S can be added with full attributes. If user needs to change other attributes on existing items, they must edit the original estimate or create a new one.',
        tradeoff: 'Documented constraint; some users may expect more flexibility. PRD explicit on this rule.',
      },
      {
        q: 'Status-based inclusion rules in totals?',
        options: [
          'Implicit: hidden in helpers.',
          'Explicit per-status: Pending shown but excluded from total, Accepted included, Rejected hidden.',
        ],
        chosen: 'Explicit per-status rules.',
        why: 'Pending CO shows on PCE with a Section header (no P/S lines) — visible but not counted. Accepted CO shows as a non-editable section with P/S details, included in updated estimate total. Rejected CO never shown.',
        tradeoff: 'More rules to document and test. Required for correct financial behavior.',
      },
      {
        q: 'Invoice from CO directly or only from PCE?',
        options: [
          'Allow from CO: two invoice paths.',
          'Only from PCE: single invoice path; PCE total reflects accepted COs.',
        ],
        chosen: 'Only from PCE. Create Invoice CTA disabled on CO form.',
        why: 'An invoice can only ever be created from an Estimate. The Estimate already includes accepted COs in its updated total. Single invoice path eliminates double-billing risk and ambiguity.',
        tradeoff: 'Users initially confused. PRD documents this explicitly; CTA disabled to prevent the action.',
      },
      {
        q: 'Sales tax recalculation on CO accept — preserve PCE override or recalculate?',
        options: [
          'Preserve PCE tax override.',
          'Recalculate on accept; remove PCE tax override.',
        ],
        chosen: 'Recalculate, remove override.',
        why: 'PRD rule: "Every time change order line items are added back to a project estimate, and that project estimate sales tax had an override, the override will be removed and the sales tax will calculate based on automatic sales tax calculation." Tax must reflect updated scope to comply with sales tax rules.',
        tradeoff: 'User tax override is lost. Documented behavior.',
      },
      {
        q: 'Discount on CO — support or defer?',
        options: [
          'Support in Phase 1: complex merge rules with PCE discount.',
          'Phase 1: no discount on CO. Phase 2: support.',
        ],
        chosen: 'No discount on CO in Phase 1.',
        why: 'When a CO without discount is added to a PCE with a % discount, the % continues to apply. Reduces Phase 1 complexity; Phase 2 adds support.',
        tradeoff: 'Limited Phase 1 functionality on discounts. Documented.',
      },
    ],
    algorithms: [
      {
        name: 'Status-based rollup with explicit inclusion rules',
        description:
          'CO total counted in PCE updated total only when status = Accepted. Pending: shown on PCE with Section header, no P/S items, no total impact. Rejected: never shown. On accept, CO lines added to PCE; on reject (from accepted), lines removed and PCE recalculates.',
        complexity: 'O(accepted COs × lines) per recomputation.',
        why: 'Independent calculation paths would drift. Single rollup logic feeding all surfaces (PCE display, reports, KPIs) prevents double-counting and inconsistency.',
      },
      {
        name: 'Discount % → $ merge rules on CO accept',
        description:
          'PCE % discount: stays as %, applies to new total including accepted CO lines. PCE $ discount: combine with CO discount if any. If CO subsequently rejected after merge, remove associated discount amount.',
        complexity: 'O(1) per merge.',
        why: 'Discount semantics differ between % and $ representations. Merge rules documented per combination.',
      },
      {
        name: 'Sales tax recalculation pipeline',
        description:
          'On CO accept: tax recalculated against linked PCE date and current rates. If PCE tax had an override, override removed. If tax rates changed between PCE creation and CO creation, PCE line items also recomputed at new rates during the merge. Tax exemption on linked customer is always respected.',
        complexity: 'O(line items) per recompute.',
        why: 'Tax compliance requires accurate calculation against current rates and updated scope. Override removal is the documented contract.',
      },
    ],
    numbers: [
      { metric: 'Manual estimate edit reduction', value: '80%', note: 'Per resume claim.' },
      { metric: 'Businesses impacted', value: '50K+', note: 'QBO Alpha rollout.' },
      { metric: 'Markets', value: 'US, Canada, AU, UK', note: 'Global readiness dependent on TXP availability; currently only works for US.' },
      { metric: 'Target segment', value: 'Mid-market', note: 'Focus on construction and professional services.' },
      { metric: 'Status values', value: '3 (Pending / Accepted / Rejected)', note: 'Plus inclusion rules per status.' },
      { metric: 'New reports', value: 'Change Order Report + columns in existing reports', note: 'CO by Project, CO by Status, CO by E vs A.' },
    ],
    warStories: [
      {
        scenario: 'Pending CO must show on PCE but not affect total',
        whatHappened:
          'Documented requirement: pending COs are visible to the user (so they know what is in flight) but cannot affect the PCE total (which only reflects accepted scope).',
        howResolved:
          'PCE renders pending COs with a Section header and no P/S line items. Updated estimate total excludes pending. Documented and tested per status.',
        lesson:
          'Visibility and totaling are independent concerns in financial UI. Make rules explicit per status.',
      },
      {
        scenario: 'Accepted CO subsequently rejected after partial invoicing',
        whatHappened:
          'Documented scenario: user accepts a CO, partially invoices it (since invoicing flows through PCE which now includes the accepted CO), then rejects the CO.',
        howResolved:
          'Per PRD: rejecting an accepted CO removes its lines from the PCE going forward. The invoice already issued remains historical and unchanged. PCE total recalculates without the rejected CO.',
        lesson:
          'Invoices are point-in-time financial documents. State changes on the source (estimate/CO) do not retroactively alter issued invoices.',
      },
      {
        scenario: 'PCE tax override invalidated by CO accept',
        whatHappened:
          'Documented behavior: if PCE has a tax override (custom rate due to specific contract), accepting a CO recalculates tax against current rates — removing the override.',
        howResolved:
          'PRD documents this as the contract: "the override will be removed and the sales tax will calculate based on automatic sales tax calculation." User-facing communication required to explain the rule.',
        lesson:
          'Tax rules must be deterministic and rule-driven. Overrides represent a moment-in-time decision that becomes stale when scope changes.',
      },
      {
        scenario: 'Discount % conversion on CO merge',
        whatHappened:
          'PRD: when CO with no discount is merged into PCE with % discount, the % continues to apply to the new total. When the combination involves a $ discount on either side, conversion rules apply: % → $ for combining; on rejection, remove the associated amount.',
        howResolved:
          'Merge rules documented per combination (%/%, %/$, $/%, $/$). On CO reject after merge, associated discount amount removed from PCE.',
        lesson:
          'Discount semantics differ between % and $ representations. Merge rules must cover every combination explicitly.',
      },
    ],
    edgeCases: [
      { case: 'Multiple pending COs on the same PCE', handling: 'All visible as grayed sections on PCE. None counted in updated total. User accepts/rejects each individually. No restriction on count.' },
      { case: 'No accepted, pending, or converted PCE exists', handling: 'CO cannot be created. User prompted to create a Project Estimate first.' },
      { case: 'Tax-exempt customer linked to project', handling: 'Tax exemption respected throughout. CO line items inherit taxable flag from PCE.' },
      { case: 'CO accepted then rejected after partial invoicing', handling: 'CO lines removed from PCE going forward. Issued invoice unchanged (historical). PCE total recalculates without the CO.' },
      { case: 'Tax rate changes between PCE and CO creation', handling: 'On CO accept merge, PCE line items recomputed at new tax rate. CO sales tax always calculated based on linked PCE date.' },
      { case: 'Shipping amount on CO', handling: 'Added back to PCE shipping field on accept. Removed if CO subsequently rejected.' },
      { case: 'Negative CO total in Phase 1', handling: 'Total of CO must be >= $0. Individual line items can be negative as long as total is non-negative. Phase 2: full negative support for refund-style COs.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only. Examples to consider: building the rollup pipeline first then UI; deeper versioning for accepted CO state; surfacing tax override warning earlier in CO creation. Mark as your view, not source-documented.',
    chains: [
      {
        title: 'The CO lifecycle chain',
        steps: [
          { q: 'What happens when a CO is created?', a: 'Linked to a Pending, Accepted, or Converted PCE. Status starts as Pending. Shown on PCE as Section header without P/S lines. Not counted in updated estimate total.' },
          { q: 'On accept?', a: 'CO added to PCE as a non-editable section with P/S line item details. Total recalculates. Tax recalculates (removing any override). Discount and shipping merged per documented rules.' },
          { q: 'On reject from accepted?', a: 'CO lines removed from PCE going forward. PCE total recalculates. Associated discount, tax, shipping amounts removed.' },
          { q: 'What about issued invoices?', a: 'Invoices are point-in-time. They remain historical and unchanged regardless of subsequent CO state changes.' },
        ],
      },
      {
        title: 'The invoicing chain',
        steps: [
          { q: 'Can a user invoice directly from a CO?', a: 'No. Create Invoice CTA is disabled on CO form. Invoice can only be created from an Estimate.' },
          { q: 'Why?', a: 'PCE total already reflects accepted COs. Single invoice path eliminates double-billing risk.' },
          { q: 'What if the user has progress-invoiced and then accepts a CO?', a: 'The PCE total updates to include the CO. The next progress invoice shows the updated total minus what has been invoiced. The previously-issued invoice does not retroactively update.' },
          { q: 'Does the issued invoice get an updated total stamp?', a: 'No. Invoice is point-in-time. PRD: "the invoice I previously sent will have an incorrect estimate total on it as it won\'t include the newly accepted change order." That is the documented behavior.' },
        ],
      },
      {
        title: 'The tax & discount chain',
        steps: [
          { q: 'How is sales tax handled on accept?', a: 'Recalculated against linked PCE date and current rates. If PCE had a tax override, override is removed. If rates changed between PCE creation and CO, PCE line items also recomputed.' },
          { q: 'What about tax-exempt customers?', a: 'Exemption is always respected. CO line items inherit the taxable flag from PCE.' },
          { q: 'How are discounts merged?', a: 'Rules documented per combination. Most common in Phase 1: PCE has % discount, CO has none → % continues to apply to new total. On CO reject after merge, associated discount amount removed.' },
        ],
      },
    ],
    followUps: {
      firstPrinciples: [
        { q: 'Why not just let users edit the estimate? Simpler for everyone.', a: 'The estimate is a signed document — the customer accepted a specific state. Editing in place destroys the audit trail and the record of what was agreed. The CO preserves the signed state while representing the delta.' },
        { q: 'Why is the estimate total derived rather than stored?', a: 'A stored total drifts the moment any contributing CO changes state. Deriving it from original + accepted COs with explicit inclusion rules makes double-counting structurally impossible and the number always reproducible.' },
        { q: 'Why does a rejected CO vanish from the estimate but stay in reports?', a: 'The estimate shows committed scope — rejected scope would mislead the customer. Reports serve audit — rejected COs remain queryable there. Two different questions, two different surfaces.' },
      ],
      productReasoning: [
        { q: 'Why qty-only editing on existing lines? Users want to change rates too.', a: 'A CO documents what changed about scope. Rate changes are a renegotiation, not a scope change — that is a new estimate. Keeping COs narrow keeps the audit narrative clean: existing items got more/less, new items were added.' },
        { q: 'Why disable Create Invoice on the CO form?', a: 'Two invoice paths means double-billing risk. The estimate total already includes accepted COs, so invoicing from the estimate covers everything exactly once. One money path, zero ambiguity.' },
        { q: 'What happens to a customer who already partially invoiced when a CO is accepted?', a: 'The estimate total updates. The next progress invoice shows updated-total minus already-invoiced. The issued invoice stays as-is — it is a historical document.' },
        { q: 'Why remove the tax override on accept instead of preserving it?', a: 'The override answered "what tax on THAT scope." Scope changed. Preserving a stale override risks legally wrong tax. Recalculation against current rates and scope is the only defensible default.' },
      ],
      correctness: [
        { q: 'How do you prevent double counting with multiple accepted COs?', a: 'The rollup sums each accepted CO exactly once from explicit status rules. Recomputation is idempotent — re-running on the same state always gives the same total.' },
        { q: 'What if a CO is accepted while another is being edited?', a: 'Each CO transitions independently. The estimate recomputes on each accept. The bottom summary on any open CO always shows all other accepted COs, so the user sees the true total context.' },
        { q: 'How is auditability actually achieved?', a: 'Every transition is a recorded event on a separate transaction entity. The original estimate never mutates. The full history — what changed, when, what status — is reconstructible.' },
      ],
      scale: [
        { q: 'What happens with a project that has 50 change orders?', a: 'Rollup is O(accepted COs × lines) — linear and bounded. The estimate form renders accepted COs as collapsed sections. Reporting aggregates per status without loading full line detail.' },
      ],
      operational: [
        { q: 'What would you monitor in production to catch rollup inconsistencies?', a: 'A consistency check comparing derived estimate totals against what reports/KPIs display, alerting on divergence. Plus metrics on status-transition volume and recompute latency.' },
        { q: 'How do you back the 80% fewer manual edits claim?', a: 'Pre-launch, scope changes required editing/recreating estimates — measurable as estimate-edit events. Post-launch, those became CO creations. The comparison of edit volume gives the reduction.' },
      ],
      career: [
        { q: 'What is the transferable design lesson?', a: 'For financial documents: never mutate signed state; append deltas and derive the effective value with explicit rules. Immutability plus derivation beats in-place mutation everywhere money is involved.' },
        { q: 'Hardest part of this project honestly?', a: 'Not the code — the rule matrix. Tax, discount, shipping, status, invoicing each interact. Getting the PRD to a place where every combination had a documented answer was the real work.' },
      ],
    },
  },
  'project-budgets': {
    framing:
      'Source-of-truth migration with documented constraint set (1444+ memorized reports, multiple cohorts, downgrade paths). All decisions and constraints below are from your PRD. Failure modes section reflects documented requirements, not historical incidents.',
    firstPrinciples: {
      reduction:
        'One form was answering two different questions for two different audiences — split it without breaking anyone.',
      invariants: [
        'Cost has exactly one source of truth per project. Two cost sources means reports become ambiguous.',
        'Existing reports, memorized reports, and custom reports must not break. 1444+ memorized reports carry user expectations.',
        'Internal granularity (cost-code level) and customer-facing granularity (quote level) are different by nature — one form cannot serve both.',
        'Migration must be deterministic per cohort. A tenant can never be left half-migrated.',
        'Downgrade paths preserve user data. Subscription changes never delete budgets.',
      ],
      tensions: [
        'Clean split (PB = cost, PE = income) ⇄ Migration burden for users whose costs live in PEs today.',
        'Single budget per project (unambiguous truth) ⇄ Power users wanting versions and variants.',
        'AI-assisted import (speed) ⇄ Financial accuracy (wrong P/S match = miscategorized money).',
        'Uniform migration (simple) ⇄ Cohort reality (NTTFs, Desktop migrators, Upgraders, Existing IES all start from different states).',
      ],
      synthesis:
        'Decouple by audience: PB becomes the singular internal cost source; PE stays the customer-facing income document. Enforce 1 PB : N PEs so cost truth is never ambiguous while quotes can iterate. Migrate cohort-by-cohort because starting states differ. Keep humans in the loop on AI import because financial categorization errors are silent and expensive. Protect the report long tail explicitly — it is where user trust actually lives.',
    },
    decisions: [
      {
        q: 'Decouple Project Budgets from Project Estimates entirely?',
        options: [
          'Keep PE as combined cost + income source: matches today, conflates audiences.',
          'Split: PB = cost source (internal accountant view), PE = income source (customer-facing quote).',
        ],
        chosen: 'Split.',
        why: 'Project managers need two views: internal accountant-facing (cost breakdown) and external customer-facing (estimates/quotes). PB is granular (cost-code level); PE is high-level. Up to 80% of users use spreadsheets for budgeting today; PB replaces that.',
        tradeoff: 'Two entities to maintain, migration complexity for existing users. Documented as necessary for the financial model.',
      },
      {
        q: 'One budget per project, or multiple?',
        options: [
          'Multiple budgets per project: max flexibility, ambiguous source of truth.',
          'One budget per project: clear source of truth.',
        ],
        chosen: 'One per project.',
        why: 'PRD: "Don\'t allow creation of multiple budgets against 1 project. Show an error message if the user attempts to do so." Single internal cost source. Multiple PEs allowed (negotiation iterations), but cost source must be singular.',
        tradeoff: 'Documented constraint; advanced users requesting versioning addressed via budget revisions, not multiple budgets.',
      },
      {
        q: 'PB and PE coexistence — independent or coupled?',
        options: [
          'Coupled: changes in one trigger the other.',
          'Independent: PE can exist without PB and vice versa. Updates are user-driven.',
        ],
        chosen: 'Independent (V1).',
        why: 'PRD: "PE can exist without PB and PB without PE. Their existence is not tied to the presence of each other. The decision to update PE / PB when the other is updated is taken by the user in V1."',
        tradeoff: 'User must manually keep them aligned. V2 considers automation.',
      },
      {
        q: 'DataGrid — build custom or extend FP&A component?',
        options: [
          'Build custom: full control, time cost.',
          'Reuse FP&A DataGrid: faster, already supports virtual scroll and cell editing.',
        ],
        chosen: 'Reuse + extend.',
        why: 'FP&A DataGrid already supports P&L and B/S budgets. Reusing aligns UX across budget types. Virtual scroll added to support 3500 lines with milestones (V2). Cell edit SLA target: <0.2s for 23 cols × 3500 lines.',
        tradeoff: 'Coordination with FP&A team for extension points. Worthwhile vs building from scratch.',
      },
      {
        q: 'AI-based spreadsheet import or manual mapping only?',
        options: [
          'Manual mapping: user maps every column.',
          'AI-based import with user confirmation per row.',
        ],
        chosen: 'AI import with user confirmation.',
        why: 'PRD documents AI-based spreadsheet import as a differentiator. Per-row confirmation keeps human-in-the-loop for financial accuracy.',
        tradeoff: 'AI matching can suggest wrong P/S items. User confirmation step required, not optional.',
      },
      {
        q: 'Migration paths — uniform or cohort-specific?',
        options: [
          'Uniform auto-migration for all.',
          'Cohort-specific: NTTFs, Desktop Migrators (Fresh + Importer), Advanced→IES Upgraders, Existing IES users.',
        ],
        chosen: 'Cohort-specific.',
        why: 'Documented cohorts have different starting states. NTTFs have no history. Desktop Migrators split into Fresh Start (no migration) and Importer (PCE cost migrated). Advanced→IES Upgraders sign contract covering migration. Existing IES users have history + memorized reports to consider.',
        tradeoff: 'Multiple migration paths to build and maintain. Necessary because cohorts have meaningfully different state.',
      },
    ],
    algorithms: [
      {
        name: 'DataGrid virtual scroll',
        description:
          'Replace paginated view with virtual scroll supporting up to 3500 lines for milestone-driven budgets in V2. Cell edit SLA target <0.2s for 23 columns × 3500 lines.',
        complexity: 'O(viewport) DOM render.',
        why: 'Milestone view requires all data of 1 milestone on the same page. Pagination breaks the experience. Virtual scroll keeps DOM bounded regardless of total row count.',
      },
      {
        name: 'Cohort-driven migration pipeline',
        description:
          'Two-step migration: (1) accept all pending PEs/COs, (2) migrate cost columns PCE → PB. Each cohort has documented entry criteria. On-demand migration for cohorts that need user opt-in.',
        complexity: 'O(PEs + COs + lines) per tenant.',
        why: 'Documented constraint: "Existing reports, memorized reports, custom reports must not break." Migration must be deterministic and reversible per cohort policy.',
      },
      {
        name: 'Dimension/Class/Location/Custom field migration per line item',
        description:
          'When user triggers migration, PCE line-item-level metadata (dimension, class, location, custom field values) migrates over to PB line by line. Header-level values apply uniformly to all PB lines.',
        complexity: 'O(line items × metadata fields).',
        why: 'PB must maintain feature parity with PE for filtering and reporting. Reports filter by dimension/class/location/custom field — PB must support all of them.',
      },
    ],
    numbers: [
      { metric: 'Adoption rate', value: '27%', note: '31% of active project users create PE × 86% of those include costs = 27% adoption of PB.' },
      { metric: 'Businesses impacted', value: '37K+', note: 'Active IES users with project workflows. 43% IES SAM, accounting for 11% of all IES users.' },
      { metric: 'DataGrid scale (V2)', value: '3500 rows × 23 cols', note: 'Performance target documented in V2 enhancements.' },
      { metric: 'Cell edit SLA', value: '<0.2s', note: 'Documented perf budget for DataGrid.' },
      { metric: 'Memorized reports impacted', value: '1444+', note: 'Across 8 affected reports.' },
      { metric: 'Spreadsheet baseline', value: '~80% of users', note: 'Use spreadsheets for project budgeting today. PB targets this workflow.' },
    ],
    warStories: [
      {
        scenario: 'Memorized + custom reports must not break',
        whatHappened:
          'Documented constraint: 1444+ memorized reports across 8 affected reports carry user expectations. Splitting cost source from PE to PB means cost columns on existing custom reports could go blank silently.',
        howResolved:
          'Per requirement: existing reports, memorized reports, and custom reports must not break. Cohort-driven migration with explicit handling for custom reports referencing PE-based cost columns.',
        lesson:
          'Long tail of memorized/custom reports must be planned for explicitly. Silent column-blank is not acceptable for financial reports.',
      },
      {
        scenario: 'Multiple PEs on one project, single PB constraint',
        whatHappened:
          'PRD allows multiple project estimates per project (negotiation iterations) but allows only one budget. Risk: ambiguity about which PE the budget aligns to.',
        howResolved:
          'PB is the singular internal cost source. PEs are customer-facing quotes; income aggregates across PEs. Cost flows from PB only. Documented as the financial model: 1 PB : N PEs.',
        lesson:
          'Source-of-truth correctness is non-negotiable for financial reporting. One PB per project keeps the model unambiguous.',
      },
      {
        scenario: 'AI-based spreadsheet import false matches',
        whatHappened:
          'Documented design risk: AI matching of imported spreadsheet rows to existing P/S catalog can suggest wrong items for similarly-named entries — different income accounts, different categorization.',
        howResolved:
          'AI import requires per-row user confirmation. "Create new" option always available. User cannot bypass confirmation. Financial accuracy prioritized over automation convenience.',
        lesson:
          'AI matching for financial data must be human-in-the-loop. Automation without confirmation = silent miscategorization = audit headaches.',
      },
      {
        scenario: 'Downgrade IES → Advanced preserving budget data',
        whatHappened:
          'Documented requirement: "Adv → IES migration and IES → Advanced reverse-migration experiences will be seamless as project budgets exist in both products."',
        howResolved:
          'Project budgets exist in both products. Migration path documented per cohort including reverse-migration for downgrades.',
        lesson:
          'Subscription downgrade paths must preserve user data, not delete it. Cross-product feature parity is the enabling design.',
      },
    ],
    edgeCases: [
      { case: 'Project with no PE but has PB', handling: 'Allowed by design. Reports show estimated cost from PB; income blank. PE can be added later.' },
      { case: 'PB deleted while reports exist', handling: 'Reports show blank Estimated Cost. PE/EI unchanged. Soft-delete with warning.' },
      { case: 'Multiple PEs on same project, one PB', handling: 'PB unchanged. Reports aggregate income across PEs; cost from single PB. Documented as 1 PB : N PEs.' },
      { case: 'Construction cost codes with hierarchy', handling: 'P/S hierarchy preserved in budget structure (e.g., 101 Painting → 101.1 Painting floor, 101.2 Painting ceiling). One level of grouping in MVP. Custom groupings (visual sections) supported.' },
      { case: 'Budget period changed', handling: 'Period editable post-creation. Does not modify project start/end dates (common because projects often run over schedule).' },
      { case: 'Dimension / Class / Location / Custom field migration', handling: 'Line-item-level values migrate line by line. Header-level values apply uniformly to all PB lines. All filterable in Estimate vs Actual and other reports.' },
      { case: 'Budget templates', handling: 'MVP: "duplicate" or "copy" only. Users copy existing budget and edit. Note: duplicate exists for P&L/B/S in Advanced; enabled only in IES for project budgets in MVP.' },
      { case: 'Budget comments', handling: 'Row-level comments supported (extension of existing P&L/B/S comment feature). Cell-level deferred. Manual tracking via comments until full versioning ships.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only. Possibilities: build full budget versioning system earlier instead of relying on comments; build dual-mode reporting observability from day one; deeper AI confidence-banding for import. Verify before claiming as fact.',
    chains: [
      {
        title: 'The source-of-truth chain',
        steps: [
          { q: 'Why decouple PB from PE?', a: 'Two audiences: internal accountant (granular cost-code level) vs customer (high-level quote). PE conflated them. PB is the singular internal cost source; PE remains the income/quote document.' },
          { q: 'Why one PB per project but multiple PEs?', a: 'Cost source must be singular for unambiguous reporting. Income iterates through negotiation — multiple PEs reflect that. 1 PB : N PEs.' },
          { q: 'How do reports know to use PB or PE for cost?', a: 'PB is the source of truth for Estimated cost in all reports. PE no longer carries cost columns (your rate / your total removed in PE).' },
        ],
      },
      {
        title: 'The migration cohorts chain',
        steps: [
          { q: 'How many migration paths?', a: 'NTTFs, Desktop Migrators (Fresh Start + Importer), Advanced→IES Upgraders, Existing IES users.' },
          { q: 'Why cohort-specific?', a: 'Each cohort has different starting state. NTTFs no history. Importers bring PCE cost data. Upgraders signed contract covering migration. Existing IES have memorized reports + workflow expectations.' },
          { q: 'How are memorized reports protected?', a: 'Documented constraint: existing reports, memorized reports, custom reports must not break. 1444+ memorized reports across 8 affected reports are explicitly considered in migration planning.' },
          { q: 'Downgrade path?', a: 'IES → Advanced reverse-migration seamless because project budgets exist in both products.' },
        ],
      },
      {
        title: 'The DataGrid perf chain',
        steps: [
          { q: 'How does the budget UI handle 3500 lines?', a: 'V2 introduces virtual scroll replacing the paginated view to support milestones with all data on one page. Cell edit SLA target <0.2s for 23 columns × 3500 lines.' },
          { q: 'Why pagination didn\'t work?', a: 'Milestones require all data of one milestone on the same page. Pagination broke the user experience for that flow.' },
          { q: 'What FP&A component is reused?', a: 'The DataGrid used for P&L and B/S budgets. Reuse aligns UX across budget types.' },
        ],
      },
    ],
    followUps: {
      firstPrinciples: [
        { q: 'Why is decoupling cost from income the right cut? Why not decouple by role or by report?', a: 'Because the underlying entities answer different questions for different audiences: PB answers "what will this cost us internally" at cost-code granularity; PE answers "what do we quote the customer" at line-item granularity. The audience split is the natural seam — role or report splits would leave one form still conflating both.' },
        { q: 'Why exactly one budget per project? Versioning solves the same need.', a: 'Reports need an unambiguous cost source. Multiple budgets means every report must answer "which budget?" Budget revisions handle iteration within the single source; multiple sources would push ambiguity into every downstream consumer.' },
        { q: 'Why can PB and PE exist independently in V1 instead of syncing automatically?', a: 'Auto-sync requires deciding whose edit wins on conflict — a hard product question. V1 makes the user the arbiter: they decide when to propagate changes. Automation can come later once real usage shows what users actually want synced.' },
      ],
      productReasoning: [
        { q: 'Why does ~80% of your target market use spreadsheets today, and what does that tell you?', a: 'Spreadsheets are flexible, granular, and free-form — everything the old PE form was not for internal costing. It tells us the product gap was granularity + internal-facing workflow, which is exactly what PB provides, plus what spreadsheets cannot: report integration and single source of truth.' },
        { q: 'Why per-row confirmation on AI import instead of full automation?', a: 'A wrong P/S match silently miscategorizes money into the wrong income account. The failure is invisible until an audit. Human confirmation per row converts a silent failure into a visible decision. Financial accuracy beats import speed.' },
        { q: 'Why support cost-code hierarchies (101 → 101.1, 101.2) in MVP?', a: 'Construction — the core segment — organizes all costing this way. Without hierarchy the budget cannot mirror how these businesses actually think, and they stay in spreadsheets.' },
      ],
      correctness: [
        { q: 'How do 1444+ memorized reports survive the source-of-truth switch?', a: 'Documented as a hard constraint: existing, memorized, and custom reports must not break. Migration planning explicitly enumerates the 8 affected reports and handles cost columns sourced from PE so nothing silently goes blank.' },
        { q: 'How does line-level metadata survive migration?', a: 'Dimensions, class, location migrate line-by-line from PCE to PB. Header-level custom fields apply uniformly to all lines. All remain filterable in Estimate vs Actual and other reports.' },
        { q: 'What prevents double counting between PB and PE in reports?', a: 'Cost columns were removed from PE ("your rate"/"your total"). PB is the only cost source; PE only carries income. Structural separation, not convention.' },
      ],
      scale: [
        { q: 'Why is <0.2s cell-edit SLA hard at 3500 rows × 23 columns?', a: 'Naive React re-renders the grid per keystroke — 80K+ cells. Virtual scroll bounds the DOM to the viewport, and edit state isolation keeps a cell edit from cascading. The SLA forces those disciplines.' },
        { q: 'What breaks first at 10× the row count?', a: 'Client-side aggregation for group totals. The move would be server-side materialized rollups with the grid consuming aggregates.' },
      ],
      operational: [
        { q: 'How do you measure the 27% adoption claim?', a: 'It is a derived projection from documented behavior: 31% of active project users create PEs, 86% of those include costs — the budgeting behavior. 31% × 86% = 27% of the 37K active project users.' },
        { q: 'What would you monitor post-launch?', a: 'Migration completion per cohort, report-render errors on the 8 affected reports, AI-import confirmation vs correction rates, and cell-edit latency percentiles against the 0.2s SLA.' },
      ],
      career: [
        { q: 'What is the transferable lesson?', a: 'Source-of-truth migrations are constraint-management problems, not feature problems. The feature took a fraction of the thought; protecting the report long tail and sequencing cohorts was the actual engineering.' },
        { q: 'What was genuinely hard here?', a: 'Four cohorts with different starting states, a downgrade path that must preserve data, and 1444 memorized reports that must not notice anything changed — all while shipping a new editing surface with a strict perf SLA.' },
      ],
    },
  },
  'au-launch': {
    framing:
      'Cross-team execution at market scale. Probed on coordination, risk surfacing, and leadership without authority. Be specific about what you owned vs participated in. Stripped of fabricated bug stories from earlier draft.',
    firstPrinciples: {
      reduction:
        'Ten teams, one launch date, zero authority over nine of them — how do you make the date without being anyone\'s boss?',
      invariants: [
        'First impression in a new market is unrecoverable. Xero and MYOB own AU mindshare; a broken launch confirms the incumbent choice.',
        'Upgrade/downgrade paths must never corrupt data or lock a customer in. Money software with a broken upgrade is a trust-ending event.',
        'Analytics must be correct at GA. Wrong dashboards in a finance product are indistinguishable from a broken product.',
        'Every dependent team\'s readiness must be independently verifiable — "we think we\'re ready" is not a gate.',
      ],
      tensions: [
        'Launch scope (full parity impresses) ⇄ Launch risk (every feature is another failure surface).',
        'Marketing push (adoption velocity) ⇄ Validation window (real traffic before scale).',
        'Central coordination (consistency) ⇄ Team autonomy (10+ teams own their own gates).',
        'Hard deadline (Dec 4) ⇄ Descope discipline (cut features, never cut safety).',
      ],
      synthesis:
        'Convert authority you don\'t have into structure everyone agrees to: a per-team readiness gate with an explicit cutoff (Oct 27), a dependency graph that makes sequencing objective, and a triage cadence that surfaces blockers daily. Launch soft — no marketing — so real AU traffic validates the product before scale amplifies any mistake. Gate hardest on the two irreversible things: upgrade safety and analytics correctness.',
    },
    decisions: [
      {
        q: 'Why launch with no marketing?',
        options: [
          'Full marketing launch: max influx, max risk if anything breaks.',
          'Soft launch: smaller cohort, lower support pressure, time to validate.',
        ],
        chosen: 'Soft launch.',
        why: 'New market with established competitors (Xero, MYOB). First impression matters. Soft launch lets product stability validate under real AU traffic before scaling marketing. Marketing follows confidence.',
        tradeoff: 'Slower initial adoption. Acceptable: a botched launch in a competitive market is worse than slower ramp.',
      },
      {
        q: 'Feature scope for GA — full Advanced parity or pragmatic subset?',
        options: [
          'All Advanced features at GA: maximum parity.',
          'Core + safe upgrade/downgrade + analytics correctness.',
        ],
        chosen: 'Core + upgrade safety + analytics.',
        why: 'Upgrade/downgrade safety non-negotiable for mid-market customers. Analytics correctness critical for the target segment. Other features follow post-GA.',
        tradeoff: 'Some feature gaps at GA. Documented in known-issues. Roadmap visible to early adopters.',
      },
    ],
    algorithms: [
      {
        name: 'Cross-team readiness gating',
        description:
          'Each of 10+ dependent teams owns a feature gate. Pre-Oct-27 cutoff: all gates green or features descoped. Daily readiness sync. Issue triage with severity tiers. No GA until P0/P1 gates green.',
        complexity: 'O(features × teams) coordination surface.',
        why: 'Mis-sequenced enablement risks silent data corruption or upgrade lock. Explicit per-team gating prevents "it works on my machine" surprises.',
      },
    ],
    numbers: [
      { metric: 'Dependent teams', value: '10+', note: 'Analytics, workflows, upgrade/downgrade, accountant flows, currency, locale, prod offers, experts.' },
      { metric: 'AU subscriber base', value: '~250K', note: 'Pre-launch QBO subscriber count. Strong upgrade opportunity to Advanced.' },
      { metric: 'Launch date', value: 'December 4', note: 'GA with no active marketing.' },
      { metric: 'Pre-prod cutoff', value: 'October 27', note: 'All feature gates green or descoped by this date.' },
      { metric: 'Target segment', value: 'Mid-market', note: 'Construction and professional services emphasis.' },
    ],
    edgeCases: [
      { case: 'AU-only feature dependency timing', handling: 'Sequenced after global-feature enablement. If global delayed, AU launch path adjusted (descope or wait). Explicit dependency graph.' },
      { case: 'Mid-market customer with existing third-party tools', handling: 'Migration path documented. Not gating for GA — migration support is post-GA work.' },
      { case: 'Upgrade matrix coverage', handling: 'Every cohort path (Simple Start, Essentials, Plus → Advanced AU) tested. Soft-blocker conditions in legacy AU configs validated.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only. Possibility: build AU test data set in parallel with feature work, not after. Verify before claiming.',
    chains: [
      {
        title: 'The cross-team execution chain',
        steps: [
          { q: 'How did you sequence 10+ teams?', a: 'Per-feature dependency graph + per-team readiness gate. Daily sync. P0/P1 triaged within 24h.' },
          { q: 'What was the riskiest path?', a: 'Upgrade/downgrade. Soft blockers in legacy AU configs could lock customers in or corrupt data. Gated hardest.' },
          { q: 'What would have caused rollback?', a: 'Analytics drift on key metric, upgrade-path corruption, or critical region-specific bug. Validated pre-GA precisely to avoid.' },
          { q: 'What did you personally drive?', a: 'Sequencing + readiness gates for Projects/IES slice. Personal validation of upgrade/downgrade and analytics correctness for our area. Escalation owner for cross-team blockers.' },
        ],
      },
    ],
    followUps: {
      firstPrinciples: [
        { q: 'Why is soft launch the right call? Doesn\'t no-marketing waste the launch moment?', a: 'In a market owned by Xero and MYOB, a botched first impression confirms the incumbent. Soft launch converts real AU traffic into validation before marketing amplifies anything. The "launch moment" is worthless if what launches is broken — marketing follows confidence, not the calendar.' },
        { q: 'Why gate hardest on upgrade/downgrade rather than features?', a: 'Features can be descoped, patched, or shipped later. A corrupted upgrade is irreversible for the customer it hits — data damage plus trust damage in money software. Gate intensity should match irreversibility, not visibility.' },
        { q: 'How do you lead 10+ teams with zero authority over them?', a: 'Replace authority with structure everyone agrees to: explicit gates, a shared dependency graph, an objective cutoff date, and daily triage. Nobody argues with an agreed structure the way they argue with a person.' },
      ],
      execution: [
        { q: 'What made Oct 27 the pre-prod cutoff? Why that specific buffer before Dec 4?', a: 'The gap gives a validation window for cross-team integration testing, fix cycles for surfaced issues, and holiday-season code-freeze realities. A cutoff without buffer is just the launch date wearing a costume.' },
        { q: 'What happened when a team missed its gate?', a: 'The documented mechanism: green the gate or descope the feature. The date holds; scope flexes. That rule stated upfront prevents the eleventh-hour "just one more day" spiral.' },
        { q: 'How were cross-team blockers actually resolved?', a: 'Daily readiness sync with severity-tiered triage — P0/P1 handled within 24h. As escalation owner for our slice, my job was making blockers visible fast and routing them to whoever could unblock.' },
      ],
      productReasoning: [
        { q: 'Why mid-market, construction and professional services specifically?', a: 'That segment has the strongest need for Advanced capabilities (projects, budgets, workflows) and ~250K existing AU QBO subscribers form the upgrade base. Beachhead where the product is differentiated, not where competition is strongest.' },
        { q: 'How does this launch compete with Xero on its home turf?', a: 'It does not try to beat Xero at SMB accounting. It targets the mid-market segment where advanced project/workflow needs outgrow entry products — a segment gap, not a head-on fight.' },
      ],
      operational: [
        { q: 'What would have triggered a launch rollback?', a: 'Analytics drift on a key metric, upgrade-path corruption, or a critical region-specific defect. The pre-GA gating was designed precisely so none of these could be discovered after launch.' },
        { q: 'How did you verify analytics correctness for AU?', a: 'Validation of analytics pipelines against AU-shaped data pre-GA for our area — correctness gating meant sensible values verified before customers could see a dashboard.' },
      ],
      career: [
        { q: 'What did this teach you that pure engineering projects could not?', a: 'That the hardest system at launch scale is the org, not the code. Dependency graphs, gates, and cadence are engineering disciplines applied to people — and they work for the same reason they work in code: they make state explicit.' },
        { q: 'What would you do differently?', a: 'Build the AU-shaped test data set in parallel with feature work rather than after — scenario diversity late in the cycle compresses the validation window. Retrospective opinion.' },
      ],
    },
  },
  'template-sharing': {
    framing:
      'Frontend-led with platform-thinking implications. Your source describes the WAS → UCS publish ordering, PII masking with dot-dash, and share scopes. Failure modes below are scenarios the design accounts for, not historical incidents.',
    firstPrinciples: {
      reduction:
        'One tenant\'s working configuration becomes another tenant\'s starting point — without leaking the first tenant\'s data.',
      invariants: [
        'Tenant data never crosses the tenant boundary. A published template carries structure, never values.',
        'A published template must reference a persisted workflow. A template pointing at nothing is corrupt by definition.',
        'Publish is a multi-service operation with no distributed transaction — partial failure must leave a recoverable, visible state.',
        'The platform is plugin-agnostic. Workflow-specific logic stays in the workflow plugin, or the platform dies as a platform.',
      ],
      tensions: [
        'Sharing richness (more context helps consumers) ⇄ Privacy (more context leaks more tenant data).',
        'Platform generality (serve future plugins) ⇄ Time-to-ship (workflow-only would ship faster).',
        'Client-side orchestration (ship fast) ⇄ Server-side transactionality (fail cleanly).',
        'Publisher convenience ⇄ Consumer trust in what a "community" template contains.',
      ],
      synthesis:
        'Separate structure from data: templates carry the workflow shape; PII is masked with dot-dash at publish time so the publisher sees exactly what consumers will see. Order the writes by referential dependency — WAS persists the definition, then UCS publishes metadata that references it — so partial failure yields an orphan (cleanable) rather than a dangling pointer (corrupt). Scope visibility explicitly: community, my companies, my clients. Design the handler contract plugin-agnostic so the next plugin reuses the whole flow.',
    },
    decisions: [
      {
        q: 'Workflow-specific feature or plugin-agnostic platform?',
        options: [
          'Workflow-only: faster ship, rebuild per plugin.',
          'Plugin-agnostic: shared publish/discovery flow across plugins.',
        ],
        chosen: 'Plugin-agnostic platform.',
        why: 'Templates are a category, not a single-plugin feature. Same publishing/discovery flow can serve future plugins. Build once for many.',
        tradeoff: 'Higher upfront design cost. Pays back as additional plugins adopt the framework.',
      },
      {
        q: 'PII masking — where to enforce?',
        options: [
          'Client-side only.',
          'Server-side only.',
          'Both.',
        ],
        chosen: 'Client-side masking with dot-dash representation.',
        why: 'Templates published to community/companies/clients must not leak tenant data. Dot-dash visualization gives the publisher immediate feedback that values are scrubbed.',
        tradeoff: 'Client-side enforcement alone has gaps without server backstop. Note: I do not have detail from your source on server-side validation specifics — verify before claiming.',
      },
      {
        q: 'Publish flow — order of WAS and UCS calls?',
        options: [
          'UCS first then WAS: backwards causality.',
          'WAS first (persist workflow definition) then UCS (publish template metadata).',
        ],
        chosen: 'WAS → UCS.',
        why: 'UCS template metadata references the persisted workflow. UCS-first would create unreferenceable template entries. Sequential dependency drives ordering.',
        tradeoff: 'WAS-success-then-UCS-failure leaves an orphan workflow that needs explicit handling.',
      },
    ],
    algorithms: [
      {
        name: 'Multi-step publish orchestration',
        description:
          'Sequence: (1) enter publish mode → mask PII (dot-dash), hide workflow-specific UI; (2) collect template metadata; (3) call WAS to persist workflow definition; (4) on WAS success → call UCS to publish template metadata; (5) on UCS success → navigate to discovery view + reset UI.',
        complexity: 'O(1) sequential steps.',
        why: 'UCS references WAS workflow entity. Reverse ordering creates orphan template entries. Strict order preserves referential integrity.',
      },
    ],
    numbers: [
      { metric: 'Users publishing templates', value: '1K+', note: 'Across tenants using the feature.' },
      { metric: 'Setup time reduction', value: '~60%', note: 'For tenants using shared templates vs creating from scratch.' },
      { metric: 'Share scopes', value: '3', note: 'community / my companies / my clients.' },
    ],
    warStories: [
      {
        scenario: 'WAS success + UCS failure leaving orphan workflow',
        whatHappened:
          'Documented risk in the publish flow: WAS persists workflow definition successfully, UCS template-publish fails (transient infra issue). Result: workflow exists in WAS without a discoverable template in UCS.',
        howResolved:
          'Retry surfaced to user. On retry, UCS call repeats with the same WAS reference (idempotent on workflow key — no duplicate created). For sustained failures, an orphan-cleanup sweep can address WAS entries without UCS references.',
        lesson:
          'Multi-service publish flows need explicit retry semantics and orphan cleanup. Silent retries on the client cause confusion.',
      },
      {
        scenario: 'PII visibility for the publisher',
        whatHappened:
          'Templates are tenant-published but consumed across tenants. Without masking, tenant-specific values (customer names, emails, account references) would appear in shared templates.',
        howResolved:
          'On entering publish mode, sensitive values are masked client-side using dot-dash representation so the publisher sees what consumers will see.',
        lesson:
          'For cross-tenant sharing, masking is a publisher-facing trust signal, not just a data-protection mechanism.',
      },
    ],
    edgeCases: [
      { case: 'User closes browser mid-publish', handling: 'WAS may have succeeded, UCS may not. Orphan cleanup eventually sweeps WAS workflows without UCS references. User can re-publish (idempotent on workflow key).' },
      { case: 'Share scope selection', handling: 'Three scopes captured at publish time: community / my companies / my clients. UCS enforces visibility on discovery accordingly.' },
      { case: 'Multi-plugin extensibility', handling: 'Future plugins (reports, spreadsheets) extend via a Template Handler contract with core fields + plugin-specific extension map.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only — verify before claiming. Possibilities: server-side orchestration with transactional semantics (vs client-orchestrated); explicit template versioning earlier; standalone PII scrub service reusable across surfaces.',
    chains: [
      {
        title: 'The platform-extensibility chain',
        steps: [
          { q: 'How does this extend to a new plugin?', a: 'Template Handler is plugin-agnostic. New plugin implements the metadata contract. Discovery + publishing UX reused.' },
          { q: 'What if a new plugin needs different metadata?', a: 'Core fields + plugin-specific extension map. New plugin adds its fields without changing core.' },
          { q: 'How do you prevent the platform from drifting workflow-specific?', a: 'Code review discipline. Workflow-specific logic stays in the workflow plugin. Platform has its own test surface.' },
        ],
      },
      {
        title: 'The publish-flow consistency chain',
        steps: [
          { q: 'Why does WAS publish before UCS?', a: 'UCS template metadata references the persisted workflow. UCS-first would create orphan template entries.' },
          { q: 'What if UCS fails after WAS succeeds?', a: 'Retry CTA surfaced to user. UCS call repeats with same WAS reference. Idempotent on workflow key — no duplicates.' },
          { q: 'What about repeated UCS failures?', a: 'Orphan cleanup sweep can address WAS entries without UCS references after a threshold.' },
        ],
      },
    ],
    followUps: {
      firstPrinciples: [
        { q: 'Why is publish ordering (WAS then UCS) derivable from first principles rather than a convention?', a: 'UCS metadata references the WAS entity. Referential dependency dictates write order: the referenced thing must exist before the reference. Reverse ordering can create a pointer to nothing — corruption. Correct ordering can only create an orphan — cleanable.' },
        { q: 'Why is an orphan acceptable but a dangling reference not?', a: 'An orphan is invisible to consumers and sweepable by a cleanup job. A dangling reference is visible — a discoverable template that fails on use. Fail modes should degrade toward invisible-and-recoverable, never visible-and-broken.' },
        { q: 'Why mask client-side at publish time rather than scrub server-side on read?', a: 'Publisher trust: dot-dash masking means the publisher sees exactly what consumers will see before committing. Scrub-on-read hides the transformation from the person accountable for the data. (Server-side backstop specifics — verify before claiming.)' },
      ],
      architecture: [
        { q: 'How does the plugin-agnostic contract actually work?', a: 'Template Handler defines core fields all plugins share plus a plugin-specific extension map. A new plugin implements the contract and inherits the entire publish/discovery flow without touching platform code.' },
        { q: 'What stops the platform from silently becoming workflow-specific?', a: 'Code-review discipline enforcing the boundary: workflow logic lives in the workflow plugin. The platform maintains its own test surface that runs without workflow context — if it needs workflow to pass, the boundary leaked.' },
        { q: 'Why client-orchestrated publish instead of a server-side saga?', a: 'Time-to-ship with an acceptable failure mode: strict ordering plus idempotent retry on workflow key covers the realistic failures. Server-side orchestration is the evolution path if publish grows more steps.' },
      ],
      correctness: [
        { q: 'What happens if the user closes the browser mid-publish?', a: 'WAS may have persisted, UCS may not. The orphan cleanup sweeps WAS workflows lacking UCS references past a threshold. Re-publishing is idempotent on the workflow key — no duplicates.' },
        { q: 'How do the three share scopes actually enforce visibility?', a: 'Scope (community / my companies / my clients) is captured at publish time and UCS enforces it at discovery. Enforcement lives server-side at the read path, not in client filtering.' },
      ],
      operational: [
        { q: 'How do you know the ~60% setup-time reduction is real?', a: 'Comparison of setup time for tenants starting from a shared template versus creating from scratch. The template carries the structure that constitutes most of setup effort.' },
        { q: 'What would you monitor?', a: 'Publish success/failure by step (WAS vs UCS), orphan count and sweep effectiveness, retry rates, and template adoption by scope.' },
      ],
      career: [
        { q: 'What is the platform-thinking lesson?', a: 'Templates are a category, not a feature. Designing the contract one level more general than the immediate need cost design time upfront and made every future plugin nearly free. That trade is usually right when the abstraction seam is obvious.' },
        { q: 'What would you change?', a: 'Retrospective opinion: server-side orchestration with transactional semantics, explicit template versioning earlier, and a standalone PII scrub service reusable across surfaces.' },
      ],
    },
  },
  'consolidated-email': {
    framing:
      'Frontend-focused. Your source confirms toggle preference, class-based React without hooks, mock APIs for testing, and legal/branding requirements. War stories below are scenarios the design accounts for, not specific incidents to claim.',
    firstPrinciples: {
      reduction:
        'Reduce notification volume without breaking anyone who depends on the current notifications.',
      invariants: [
        'Existing workflows keep working unchanged. Users built processes around per-transaction emails; silent behavior change breaks trust.',
        'Customer-facing email content is a legal artifact. Wording and branding ship only with sign-off.',
        'Shared components serve both modes from one code path. Duplicated email logic diverges and rots.',
        'Frontend delivery cannot be hostage to backend readiness — mocked contracts decouple the schedules.',
      ],
      tensions: [
        'Volume reduction (consolidation) ⇄ User preference (some genuinely want per-transaction).',
        'Forced simplicity (one mode) ⇄ User agency (a toggle adds a code path forever).',
        'Refactoring shared legacy components (clean) ⇄ Regression risk in class-based React without hooks.',
        'Ship speed ⇄ Legal review as a hard gate on content.',
      ],
      synthesis:
        'Give users the choice instead of choosing for them: a toggle, defaulting to existing behavior so nobody is surprised. Refactor the shared components to be mode-aware via props — one code path, branching internally — rather than forking the email logic. Treat legal review as a merge gate, not a post-ship check. Mock the backend contract so frontend ships on its own schedule. The result: 65% volume reduction for those who opt in, zero breakage for those who don\'t.',
    },
    decisions: [
      {
        q: 'Force consolidated emails or give users a choice?',
        options: [
          'Force consolidated: simpler, ignores low-volume users.',
          'Give users a choice via toggle.',
        ],
        chosen: 'Give users a choice.',
        why: 'Initial forced experience did not respect user preference and had legal/branding gaps. Toggle preserves user agency. Low-volume users prefer per-transaction; high-volume users want consolidation.',
        tradeoff: 'Two code paths to support. Mitigated by refactoring shared components rather than duplicating logic.',
      },
      {
        q: 'Default mode — preserve old behavior or default to new?',
        options: [
          'Default to consolidated (new).',
          'Default to per-transaction (preserve existing behavior).',
        ],
        chosen: 'Preserve existing behavior; consolidation is opt-in.',
        why: 'Existing workflows must continue to function without surprise. Backward compatibility is the non-negotiable design constraint.',
        tradeoff: 'Slower adoption pace. Acceptable for trust-sensitive notifications.',
      },
      {
        q: 'Refactor shared components or duplicate logic per mode?',
        options: [
          'Duplicate: faster, future code rot.',
          'Refactor shared components.',
        ],
        chosen: 'Refactor.',
        why: 'Per your source: "We avoided branching logic explosion by refactoring shared components to support both modes cleanly." Class-based React without hooks made refactoring careful but not impossible.',
        tradeoff: 'Refactor work carries regression risk in legacy codebase. Mitigated by mock APIs + unit/integration test coverage.',
      },
      {
        q: 'Frontend testing without backend readiness?',
        options: [
          'Wait for backend.',
          'Build with mocked services to decouple delivery.',
        ],
        chosen: 'Mock APIs.',
        why: 'Per your source: "I used mocked services to decouple frontend delivery from backend readiness, which kept the release on schedule."',
        tradeoff: 'Mock divergence risk if not maintained. Mitigated by treating contract as the source of truth and updating both.',
      },
    ],
    algorithms: [
      {
        name: 'Mode-aware shared component pattern',
        description:
          'Email composition components accept mode prop ("per-transaction" | "consolidated"). Branching inside the component handles content template, recipient list, CTA differences. CC/BCC, freeform body, and attachments handled in shared code paths.',
        complexity: 'O(1) mode branching per render.',
        why: 'Two delivery modes share most UX. Mode-aware prop pattern keeps shared parts shared and specialized parts isolated. Extending to a third mode = add enum value + add branch.',
      },
    ],
    numbers: [
      { metric: 'Email volume reduction', value: '65%', note: 'Per resume claim; aggregated reduction for high-volume reminder workflows.' },
      { metric: 'CSAT increase', value: '~40%', note: 'Post-launch survey.' },
      { metric: 'Backward compatibility', value: 'Preserved', note: 'Existing reminder workflows unchanged by default.' },
      { metric: 'Codebase characteristic', value: 'Class-based React (no hooks)', note: 'Lifecycle methods + refactoring without destabilizing shared components.' },
    ],
    warStories: [
      {
        scenario: 'Refactor risk in class-based React without hooks',
        whatHappened:
          'Documented design challenge: introducing extensibility in a class-based React codebase without destabilizing shared components. Sibling features (CC/BCC, freeform body) live in the same shared surface.',
        howResolved:
          'Per your source: "We avoided branching logic explosion by refactoring shared components to support both modes cleanly." Mock APIs for testing kept delivery independent of backend readiness. Unit and integration coverage documented.',
        lesson:
          'Legacy frontend codebases have unwritten contracts between sibling features. Test those contracts before changing the implementation underneath them.',
      },
      {
        scenario: 'Legal and branding requirements',
        whatHappened:
          'Per your source: "Email content changes were legally sensitive, so correctness mattered more than speed." Consolidated email content needed to meet updated legal and branding requirements.',
        howResolved:
          'Coordinated with design and legal during content rework. Compliance treated as gate, not afterthought.',
        lesson:
          'Customer-facing communications are legal artifacts. Compliance review is part of the merge gate, not a post-merge check.',
      },
    ],
    edgeCases: [
      { case: 'User toggles mode mid-workflow', handling: 'Preference applies to future workflow execution, not in-flight email generation.' },
      { case: 'CC/BCC across modes', handling: 'CC/BCC composition shared, preserved across both modes.' },
      { case: 'Freeform email body', handling: 'Preserved across both modes; not mode-specific.' },
      { case: 'Backward compatibility for existing reminder workflows', handling: 'Default per-transaction behavior preserved. No silent migration.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only. Possibilities: mode as a string enum from day one to enable future modes (e.g., weekly digest); template versioning so legal updates are diffable. Verify before claiming.',
    chains: [
      {
        title: 'The backward-compatibility chain',
        steps: [
          { q: 'How did you ensure the toggle did not break existing workflows?', a: 'Default preserved old behavior. Toggle is opt-in. Shared components are mode-aware via props, not via duplicate code paths.' },
          { q: 'What if a user has hand-customized their template?', a: 'Templates persist per workflow. Mode toggle does not overwrite customization; customizations apply within the resolved mode.' },
          { q: 'How would a third mode be added?', a: 'Extend the enum. Add one branch in the shared components. Existing modes unaffected.' },
        ],
      },
      {
        title: 'The frontend-delivery chain',
        steps: [
          { q: 'How did you ship without waiting for backend?', a: 'Mocked services let the frontend develop and test against contracts. Backend readiness was decoupled from frontend release schedule.' },
          { q: 'How did you handle legal review?', a: 'Treated content changes as a legal gate. Legal sign-off required before merging template changes.' },
          { q: 'How did you preserve CC/BCC and freeform body?', a: 'These are shared across both modes via the refactored shared components, not duplicated per mode.' },
        ],
      },
    ],
    followUps: {
      firstPrinciples: [
        { q: 'Why is a toggle the right answer instead of just consolidating for everyone?', a: 'The initial forced experience is documented as the failure: it ignored user preference and had legal/branding gaps. Low-volume users legitimately prefer per-transaction emails — forwardable, filable per invoice. Consolidation optimizes for high-volume users; the toggle serves both instead of sacrificing one cohort.' },
        { q: 'Why default to the old behavior when the new one is the improvement?', a: 'Notifications are load-bearing: users built downstream processes on them. A changed default is a silent behavior change to people who never asked. Opt-in preserves trust; adoption comes from the feature being genuinely better, not from being forced.' },
        { q: 'Why refactor shared components instead of forking the email logic?', a: 'Two copies of email logic diverge on the first bug fix that lands in only one. Mode-aware props keep one code path with internal branching — CC/BCC, freeform body, attachments stay shared. Adding a third mode later is an enum value, not a third fork.' },
      ],
      technicalDepth: [
        { q: 'What makes class-based React without hooks genuinely harder here?', a: 'Extensibility patterns that hooks make trivial — extracted stateful logic, composition — require lifecycle-method choreography in class components. Refactoring shared components means preserving unwritten contracts with sibling features that share lifecycles.' },
        { q: 'How did mock APIs decouple frontend delivery?', a: 'Per your source: mocked services let frontend develop and test against the agreed contract while backend readiness proceeded independently — keeping release on schedule. The contract is the source of truth both sides build against.' },
        { q: 'What happens if a user flips the toggle mid-workflow?', a: 'Preference applies to future workflow execution, not in-flight email generation. Each execution resolves the preference at its start, so a single workflow run is internally consistent.' },
      ],
      productReasoning: [
        { q: 'How do you know 65% volume reduction did not hurt engagement?', a: 'The ~40% CSAT increase is the counterweight metric: volume fell and satisfaction rose. Consolidation removed noise, not signal — the per-transaction option remaining available means nobody lost information they wanted.' },
        { q: 'Why does legal review gate the merge rather than the release?', a: 'Per your source, correctness mattered more than speed for legally sensitive content. Gating at merge means non-compliant content cannot exist on the main branch — a structural guarantee instead of a process hope.' },
      ],
      operational: [
        { q: 'What is the rollback story if consolidated mode misbehaves in production?', a: 'The toggle is the rollback: per-transaction path is untouched and remains the default. Worst case, affected users switch back — no deploy needed for user-level mitigation.' },
        { q: 'What would you monitor?', a: 'Email volume by mode, toggle adoption rate, delivery failures per path, and CSAT by cohort — plus template-render errors since content is legally sensitive.' },
      ],
      career: [
        { q: 'This looks like a small feature. Why does it matter in your portfolio?', a: 'It is a masterclass in backward compatibility under constraint: legacy codebase, legal gates, backend not ready, and a user base that punishes surprise. Shipping the 65%/40% outcome through all four constraints is the senior signal, not the toggle itself.' },
        { q: 'What is the transferable lesson?', a: 'When changing load-bearing behavior, make the new thing opt-in, keep one code path with explicit modes, and gate irreversible surfaces (legal content) structurally. Trust is a feature you can lose in one release.' },
      ],
    },
  },
  'implicit-ads': {
    framing:
      'Academic/research project. Useful for analytical depth, not core strength. Keep answers honest and tight. I do not have detailed source material on specific algorithms used — claims below are conservative; verify specifics before claiming.',
    firstPrinciples: {
      reduction:
        'Detect ads that are engineered to not look like ads — the only reliable signal is intent, and intent has no single fingerprint.',
      invariants: [
        'Implicit ads have no clean boundary — no visual cut, no audio spike. Any detector assuming one will fail.',
        'Brand presence is not ad intent. A genuine product review mentions brands constantly without selling.',
        'A missed ad segment cannot be recovered in moderation; a false positive can be filtered by review. Recall dominates.',
        'Classification granularity must match the phenomenon: ads are segments embedded in normal content, so whole-video labels destroy the signal.',
      ],
      tensions: [
        'Recall (catch everything) ⇄ Precision (review burden from false positives).',
        'Single-modality simplicity ⇄ Multi-modal robustness when ads mimic content in any one channel.',
        'Semantic segmentation (meaningful units) ⇄ Robustness on content where segmentation degrades (continuous music).',
      ],
      synthesis:
        'Segment first, classify second — the unit of detection must be the segment because that is the unit of the phenomenon. Fuse weak signals across audio, visual, and contextual channels because intent expresses differently in each and can hide in any single one. Optimize for recall because the moderation use case makes false negatives unrecoverable. Accept that intent — not brand mention — is what separates a review from an ad, and engineer features that capture promotional intent (CTA phrasing, urgency) rather than brand presence.',
    },
    decisions: [
      {
        q: 'Whole-video vs segment-level classification?',
        options: [
          'Whole-video binary: useless for actual product use.',
          'Segment-level: enables boundary detection within otherwise-normal content.',
        ],
        chosen: 'Segment-level.',
        why: 'Implicit ads are embedded inside otherwise-normal content. A 10-min video with a 30-sec embedded ad looks like non-ad at whole-video granularity. Segment level enables localization.',
        tradeoff: 'Requires reliable segmentation logic. Failure on continuous-audio content.',
      },
      {
        q: 'Single-modality or multi-modal classification?',
        options: [
          'Vision-only or audio-only: each fails when ads mimic the other modality.',
          'Multi-modal fusion across audio + visual + contextual signals.',
        ],
        chosen: 'Multi-modal.',
        why: 'Implicit ads are defined by intent, not any single modality. Visual signals (logos, products), audio signals (brand mentions, CTA urgency), and contextual signals (promotional phrasing) all weakly indicate intent. Combined signal is stronger than any one.',
        tradeoff: 'Higher inference cost. Acceptable for the offline batch use case.',
      },
      {
        q: 'Optimize for precision or recall on the ad class?',
        options: [
          'Precision: fewer false positives, more false negatives.',
          'Recall: fewer false negatives, more false positives.',
        ],
        chosen: 'Recall.',
        why: 'Per your prep guide: "Missing an ad segment is worse than occasionally flagging non-ad content in moderation use cases." Moderation reviews can filter out false positives; missed ads cannot be recovered.',
        tradeoff: 'More flagged content to review. Operationally acceptable.',
      },
    ],
    algorithms: [
      {
        name: 'Multi-modal feature combination',
        description:
          'Audio, visual, and contextual signals extracted per segment and combined for final classification. Specifics of architecture and feature engineering withheld here — verify from your own notes before claiming exact components.',
        complexity: 'Depends on per-modality model choice.',
        why: 'No single modality is reliable for implicit-ad detection. Combining weak signals across modalities improves discrimination.',
      },
    ],
    numbers: [
      { metric: 'Accuracy', value: '~85%', note: 'On the labeled test set per resume.' },
      { metric: 'Recall priority', value: 'High over precision', note: 'Moderation use case: false negatives more costly than false positives.' },
      { metric: 'Classification granularity', value: 'Segment-level', note: 'Not whole-video; enables localization.' },
    ],
    edgeCases: [
      { case: 'Continuous-audio content (music videos, podcasts)', handling: 'Sentence-boundary segmentation degrades. Fallback to fixed-time-window with reduced confidence.' },
      { case: 'Multi-language content', handling: 'V1 scope was a single language. Multi-language would require localized brand dictionaries and language-specific CTA patterns.' },
      { case: 'Genuine product reviews flagged as ads', handling: 'Documented failure class. Mitigated by weighting promotional-intent signals (CTA phrasing, urgency) over brand-presence alone. Intent is the signal, not brand mention.' },
    ],
    whatIWouldChange:
      'Retrospective opinion only. Possibilities: confidence-banded output (high/medium/low) for moderation triage; human-in-the-loop review for medium-confidence segments. Verify before claiming.',
    chains: [
      {
        title: 'The problem-formulation chain',
        steps: [
          { q: 'Why segment-level instead of whole-video?', a: 'Implicit ads are embedded within otherwise-normal content. Whole-video loses locality and conflates ad and non-ad signals.' },
          { q: 'Why multi-modal?', a: 'Intent is the signal, not brand presence. No single modality reliably captures intent. Multi-modal combines weak signals.' },
          { q: 'Why optimize for recall?', a: 'In moderation, a missed ad cannot be recovered. False positives can be filtered by review. Recall priority follows from the use case.' },
          { q: 'What is the hardest part of this problem?', a: 'Implicit ads do not look like ads. There is no clean visual boundary or audio spike. The only reliable signal is intent — which forces semantic segmentation and weak-signal fusion.' },
        ],
      },
    ],
    followUps: {
      firstPrinciples: [
        { q: 'What exactly makes an ad "implicit"? Define the problem precisely.', a: 'Promotional content embedded in normal content with no disclosure marker — no cut, no "sponsored" label, no audio transition. The creator is selling while appearing to inform or entertain. Detection therefore cannot rely on any surface marker; it must infer intent.' },
        { q: 'Why is intent the only reliable signal? Push on that.', a: 'Every surface feature has a benign twin: brand mentions appear in reviews, product close-ups appear in tutorials, enthusiasm appears everywhere. What separates an ad is the promotional intent — persuading toward a transaction. That expresses through patterns like CTA phrasing and urgency, not through any single visual or audio cue.' },
        { q: 'Why does recall dominate precision here — is that always true?', a: 'It follows from the moderation use case: flagged content gets human review, so false positives cost review time; missed ads ship undetected, unrecoverable. If the use case were auto-demonetization with no review, the asymmetry would flip and precision would dominate. The metric priority is derived from the downstream action, not from taste.' },
      ],
      mlDepth: [
        { q: 'How would you handle class imbalance — ads are a small fraction of content?', a: 'Standard levers: oversample the ad class or weight the loss, evaluate on per-class recall rather than raw accuracy, and threshold-tune on validation. The ~85% accuracy figure must always travel with per-class recall for exactly this reason.' },
        { q: 'Where did labels come from, and what is hard about boundary annotation?', a: 'Labeling implicit ads requires human judgment about intent, and annotators disagree on where an ad starts inside a smooth transition. Segment-level labels reduce this ambiguity versus frame-level boundaries — another argument for segment granularity. Verify specifics of your dataset before claiming details.' },
        { q: 'How does this generalize across creators and content domains?', a: 'Honestly: imperfectly. Promotional phrasing conventions differ by niche and language. V1 scope was single-language; generalization would need domain-diverse training data and localized CTA patterns. Being candid about this limitation reads as maturity, not weakness.' },
        { q: 'How would you retrain as ad styles evolve to evade detection?', a: 'It is adversarial by nature. A production system needs a feedback loop: reviewer decisions become fresh labels, monitored for drift in the flagged-content distribution, with periodic retraining. Static models decay against adaptive adversaries.' },
      ],
      systemsThinking: [
        { q: 'How would you run this at YouTube scale?', a: 'Offline batch on upload, not real-time: segment, extract per-modality features in parallel, classify, queue flagged segments for review. Cost control via cascade — a cheap first-pass filter routes only ambiguous content to the expensive multi-modal model.' },
        { q: 'What is the latency budget per minute of video, and does it matter?', a: 'For an upload-time batch pipeline, throughput matters more than latency — the constraint is cost per video-minute, not response time. This is why the offline framing is the right one for the use case.' },
      ],
      positioning: [
        { q: 'Why is this project in your portfolio if backend systems are your core strength?', a: 'It demonstrates analytical range: problem formulation, feature reasoning, metric selection under ambiguity. The honest framing: I can reason about ML systems, and I choose to build scalable backend systems. Secondary project, deliberately.' },
        { q: 'Is this a GenAI project?', a: 'No, and do not dress it as one. It is classical multi-modal classification. Claiming GenAI invites questions I would then have to walk back — accuracy about your own work is the credibility play.' },
      ],
    },
  },
  'budget-versioning': {
    framing:
      'A financial-records + concurrency + event-driven story. Spans frontend TS and backend Java — VERIFY which layer is yours before claiming. Everything below is grounded in the repo; the ownership scope is the one thing only your PRs can confirm.',
    firstPrinciples: {
      reduction:
        'A published budget is a financial record. Once approved, its state at that moment must be reconstructable forever, even after the user edits it.',
      invariants: [
        'Exactly one ACTIVE revision per budget at any time. Everything else is history.',
        'A LOCKED (published) revision is immutable — it is never overwritten, only superseded.',
        'No user silently overwrites another user\'s edit — concurrency is guarded.',
        'Version history can never diverge from actual state — they commit together or not at all.',
        'You cannot un-publish: LOCKED → DRAFT is forbidden (INVALID_LOCKED_STATE).',
      ],
      tensions: [
        'Editability (users keep changing budgets) ⇄ Auditability (accountants need the approved snapshot).',
        'Version on every save (safe, but revision explosion during drafting) ⇄ Version only on publish (efficient, drafts have no history).',
        'Concurrent editing allowed ⇄ No silent overwrite.',
        'Pessimistic locking (blocks, safe) ⇄ Optimistic locking (scales, occasional conflict retry).',
      ],
      synthesis:
        'Split the budget\'s life into two modes. DRAFT is mutable in place — iterate freely, no revisions accumulate. LOCKED is immutable and copy-on-write — editing forks a new revision, the old one becomes append-only history. Guard concurrency with optimistic locking (a syncToken round-trip) because budget edits are low-contention. Emit a domain event on every change through a transactional outbox so history can never diverge from state.',
    },
    decisions: [
      {
        q: 'Copy-on-write immutable revisions vs in-place mutation for published budgets?',
        options: [
          'In-place mutation: simplest, destroys approved-state history.',
          'Copy-on-write: archive current as INACTIVE, insert new ACTIVE revision.',
        ],
        chosen: 'Copy-on-write.',
        why: 'Financial history must be reconstructable and auditable — you cannot lose what a budget looked like when it was approved. On editing a LOCKED budget: mark current ACTIVE INACTIVE, insert revision+1 as ACTIVE with deep-copied lines.',
        tradeoff: 'Table growth + a "which revision is ACTIVE" query. Worth it for auditability.',
      },
      {
        q: 'One overloaded enum, or separate state and status?',
        options: [
          'One enum mixing lifecycle and currency: fewer fields, ambiguous queries.',
          'state (DRAFT/LOCKED/HIDDEN) + status (ACTIVE/INACTIVE) as two axes.',
        ],
        chosen: 'Two independent axes.',
        why: 'Lifecycle (is it editable/published) and currency (is this the live row) are orthogonal. Splitting them lets one budgetId own many historical rows while ACTIVE lookups stay a simple findByStatus.',
        tradeoff: 'Two fields to reason about instead of one. Pays back in query simplicity and history clarity.',
      },
      {
        q: 'Optimistic or pessimistic concurrency?',
        options: [
          'Pessimistic: hold a DB lock during editing — blocks, does not scale.',
          'Optimistic: @Version token, detect conflict at write time.',
        ],
        chosen: 'Optimistic (@Version editSequence).',
        why: 'Budget edits are low-contention — two people editing the same budget at once is rare. Optimistic avoids holding DB locks; conflict surfaces as an exception at saveAndFlush and is shown to the user.',
        tradeoff: 'Occasional conflict-retry instead of blocking. Correct default for this workload.',
      },
      {
        q: 'Version on every save, or only on publish?',
        options: [
          'Every save: full history, revision explosion while drafting.',
          'DRAFT mutable in place, only publish forks a revision.',
        ],
        chosen: 'Only publish forks.',
        why: 'Drafts are work-in-progress — nobody has acted on them, so overwriting is safe. Publish is the meaningful checkpoint where downstream consumers appear, so that is where a frozen revision is created.',
        tradeoff: 'Drafts have no intra-draft history. Acceptable — the auditable unit is the published version.',
      },
      {
        q: 'Build a version-history UI, or emit events and link out?',
        options: [
          'Bespoke history UI: full control, reinvents a horizontal concern.',
          'Emit domain events, link to the platform audit-history view.',
        ],
        chosen: 'Emit + link out.',
        why: 'History is a cross-cutting concern across QuickBooks entities. The platform provides a canonical audit-history surface; emit standard domain events keyed by entity type and link to it. Reuse over rebuild.',
        tradeoff: 'Less control over the history UX. Worth it to avoid drift from the platform surface.',
      },
    ],
    algorithms: [
      {
        name: 'Copy-on-write revision creation',
        description:
          'On editing a LOCKED budget: (1) set current ACTIVE header status=INACTIVE, saveAndFlush; (2) createActiveVersion — copy header, status=ACTIVE, revision+1, editSequence+1, deep-copy each line into the new revision. Composite PK (budgetId, revision, companyId).',
        complexity: 'O(lines) deep copy per publish edit.',
        why: 'Immutability requires a full snapshot per published revision. Deep copy is the cost of a reconstructable audit trail.',
      },
      {
        name: 'Optimistic lock via @Version',
        description:
          'editSequence is a JPA @Version column, round-tripped to the frontend as syncToken. On write, JPA compares the token; mismatch throws ObjectOptimisticLockingFailureException, surfaced as a conflict. Match increments the token.',
        complexity: 'O(1) per write.',
        why: 'Detects concurrent modification without holding locks. The stale client is rejected instead of clobbering.',
      },
      {
        name: 'Transactional outbox for history events',
        description:
          'The domain event is written to an outbox table in the SAME DB transaction as the budget change. A relay reads the outbox and publishes to the event bus → audit-history view. Atomic: either both commit or neither.',
        complexity: 'One extra insert per change.',
        why: 'Eliminates the dual-write problem — a committed budget change with no history event, or a phantom event with no change, is impossible.',
      },
    ],
    numbers: [
      { metric: 'Line cap per budget', value: '3500', note: 'Same grid cap as Project Budgets. A single publish deep-copies up to this many lines.' },
      { metric: 'States / statuses', value: '3 / 2', note: 'DRAFT/LOCKED/HIDDEN × ACTIVE/INACTIVE.' },
      { metric: 'Composite PK', value: '(budgetId, revision, companyId)', note: 'Revision is part of the key — that is what makes multiple versions coexist.' },
    ],
    warStories: [
      {
        scenario: 'Two users edit the same revision',
        whatHappened:
          'Concurrent edits to the same ACTIVE revision would, without protection, let the second writer silently overwrite the first.',
        howResolved:
          '@Version editSequence: the second saveAndFlush throws ObjectOptimisticLockingFailureException. The frontend round-trips syncToken, so the stale client is rejected with a conflict error.',
        lesson:
          'Optimistic locking converts "silent data loss" into "explicit, recoverable conflict" — the right trade for low-contention financial edits.',
      },
      {
        scenario: 'Attempt to un-publish a LOCKED budget',
        whatHappened:
          'A LOCKED → DRAFT transition would let a published, possibly-approved budget become mutable again — destroying the audit guarantee.',
        howResolved:
          'Guarded: LOCKED → DRAFT throws INVALID_LOCKED_STATE. Once published, the only forward path is a new copy-on-write revision.',
        lesson:
          'Immutability is enforced by rejecting illegal transitions at the write layer, not by convention in the UI.',
      },
      {
        scenario: 'History diverging from state',
        whatHappened:
          'If the budget change committed but the history event publish failed separately, the audit view would show a different reality than the data (dual-write hazard).',
        howResolved:
          'Transactional outbox — event and change share one DB transaction; a relay publishes afterward. History can never be out of sync with state.',
        lesson:
          'Any "write data + publish event" flow is a dual-write risk; the outbox pattern is the standard, correct answer.',
      },
    ],
    edgeCases: [
      { case: 'Deleting a budget with history', handling: 'Full delete purges inactive revisions (deleteBudgetVersionsWithStatus INACTIVE) — history is tied to the budget lifecycle.' },
      { case: 'HIDDEN state', handling: 'Used by the estimate/change-order lock path (Path B). Leaks into backend logic without being exposed to the frontend — a known cognitive-load smell.' },
      { case: 'Conflict UX', handling: 'Surfaces as a generic conflict error today — no auto-merge or field-level "someone else edited this" reconciliation. A known weakness / improvement.' },
      { case: 'Revision growth', handling: 'No cap or compaction — every publish deep-copies all lines. Heavily-edited budgets grow unbounded until full-delete. A real scaling concern to raise.' },
    ],
    whatIWouldChange:
      'Retrospective opinion — verify before claiming as owned work. (1) Conflict UX: fetch the newer version, diff against pending edits, offer merge instead of a generic error. (2) Revision retention: a pruning policy or delta-based revision model to bound storage — more complex, real trade-off. (3) Unify or clearly separate the two lock concepts (state=LOCKED vs LockProjectBudgetService) — overlapping locks on one entity risk inconsistent invariants.',
    chains: [
      {
        title: 'The publish-edit copy-on-write chain',
        steps: [
          { q: 'User clicks Save & Publish on a LOCKED budget — what happens on the backend?', a: 'Fetch current ACTIVE header, validate syncToken, read old state LOCKED. Copy-on-write branch: set current ACTIVE INACTIVE (archive), insert new header revision+1, editSequence+1, status ACTIVE, deep-copy lines.' },
          { q: 'What is the invariant afterward?', a: 'Exactly one ACTIVE row for that budgetId, one more INACTIVE row than before, revision +1, syncToken +1, and one new event in the outbox awaiting relay.' },
          { q: 'What feeds version history?', a: 'The domain event emitted in the same transaction, relayed via outbox to the platform audit-history view.' },
          { q: 'Honest boundary?', a: 'That whole sequence is BusinessBudgetWriterImpl.handleUpdateBudget — VERIFY whether you authored it or integrated against it.' },
        ],
      },
      {
        title: 'The concurrency chain',
        steps: [
          { q: 'How is a concurrent edit detected?', a: 'JPA @Version editSequence, round-tripped as syncToken. Mismatch at saveAndFlush throws ObjectOptimisticLockingFailureException.' },
          { q: 'Why optimistic, not pessimistic?', a: 'Budget editing is low-contention; holding DB locks is overkill and hurts scale. Optimistic pays only an occasional conflict retry.' },
          { q: 'What does the user see?', a: 'A conflict error — today generic. Better UX would diff and offer merge.' },
        ],
      },
      {
        title: 'The two-lock-paths chain (do not conflate)',
        steps: [
          { q: 'What is Path A?', a: 'User versioning: update with state=LOCKED via Save & Publish. DRAFT edits in place; editing LOCKED forks a revision.' },
          { q: 'What is Path B?', a: 'LockProjectBudgetService: programmatic lock for the estimate/change-order flow. Permission-gated, idempotent, only HIDDEN → LOCKED, rejects pending linked transactions, soft-deletes if no active lines.' },
          { q: 'Which did you work on?', a: 'VERIFY and state it precisely. Claiming both without evidence is the fastest way to get exposed.' },
        ],
      },
    ],
    followUps: {
      firstPrinciples: [
        { q: 'Why immutable revisions instead of just editing in place?', a: 'A published budget is a financial record that downstream consumers act on. Its approved state must be reconstructable forever. Copy-on-write preserves it; in-place mutation destroys it.' },
        { q: 'Why only fork on publish, not on every draft save?', a: 'Drafts are work-in-progress with no external consumers, so overwriting is safe and avoids revision explosion. Publish is the checkpoint where a frozen version becomes necessary.' },
        { q: 'Why is history a separate concern from state?', a: 'History is a cross-cutting platform capability; state is budget-specific. Emitting events and linking to the platform audit view keeps the two decoupled and avoids reinventing history.' },
      ],
      concurrency: [
        { q: 'Walk me through the exact optimistic-lock failure path.', a: 'FE loads a budget, holds editSequence as syncToken. On save it sends it back. Backend @Version compares; if the row changed in between, saveAndFlush throws ObjectOptimisticLockingFailureException → surfaced as conflict. No overwrite.' },
        { q: 'Why not last-write-wins?', a: 'Financial data — a silent overwrite loses a real edit an accountant may have made. Detect-and-reject is the only safe default.' },
        { q: 'What would a better conflict UX look like?', a: 'Fetch the newer revision, diff it against the user\'s pending edits, show conflicting fields, offer merge — instead of a generic error that forces a restart.' },
      ],
      distributedSystems: [
        { q: 'Why is the outbox necessary — why not just publish the event after commit?', a: 'Publish-after-commit can fail after the DB commits, leaving state with no history event. Outbox writes the event in the same transaction, so the two are atomic. Classic dual-write elimination.' },
        { q: 'Who relays the outbox and what if the relay is down?', a: 'A separate relay reads the outbox and publishes; if it is down, events accumulate durably and drain on recovery. VERIFY: the outbox infra is platform-owned — you integrate with it.' },
      ],
      ownership: [
        { q: 'What did YOU build here?', a: 'VERIFY from PRs. Frontend slice: the Save-as-Draft/Save-and-Publish split, syncToken round-trip, DRAFT/LOCKED state gating, version-history link-out. Backend slice: the copy-on-write branch, createActiveVersion, outbox emission, the entity model. State exactly one honestly.' },
        { q: 'What did you NOT build?', a: 'Disclaim explicitly: the transactional outbox infra (platform), the audit-history view (platform), and whichever of the two lock paths you did not touch.' },
      ],
    },
  },
  'ai-budget-import': {
    framing:
      'An AI-integration + async-systems + human-in-the-loop story. The value is the seam between a probabilistic AI upstream and a deterministic financial record downstream. VERIFY your slice; disclaim the QBAI model and the ICE pub/sub infrastructure.',
    firstPrinciples: {
      reduction:
        'A budget line item is a financial record; AI extraction is probabilistic. How do you get AI speed without letting probabilistic output silently become deterministic financial data?',
      invariants: [
        'Wrong data in a budget flows into profitability and estimate-vs-actuals reports — unrecoverable once acted on.',
        'Probabilistic AI output must never land in a financial record without explicit human confirmation.',
        'LLM comprehension is slow and variable — no request or UI thread may block on it.',
        'Document status is server-authoritative — closing the browser must not lose the AI work.',
        'The user must be shown exactly which rows are uncertain — no more, no less.',
      ],
      tensions: [
        'Automation speed (full auto is faster) ⇄ Correctness (humans catch errors).',
        'User trust in AI ⇄ user attention (too many warnings → all ignored; too few → silent errors).',
        'Model probability (scores) ⇄ product certainty (the UI must translate a score into "review this").',
        'Real-time push (fast, can be missed) ⇄ polling (reliable, slower).',
      ],
      synthesis:
        'Model AI output as a three-tier confidence classification per row. Auto-accept only the highest tier. Use a visual affordance (icon + popover) to focus the human on exactly the uncertain rows, and gate save so the system converges on committed-and-reviewed or explicitly-cancelled. Run comprehension as an async job with event-driven status plus polling fallback, because LLM latency is a batch-job profile, not a query profile.',
    },
    decisions: [
      {
        q: 'Auto-accept AI matches, or human-in-the-loop review?',
        options: [
          'Auto-accept, let users fix mistakes later: fast, silent errors in financial records.',
          'Human-in-the-loop: AI drafts, human confirms uncertain rows before save.',
        ],
        chosen: 'Human-in-the-loop.',
        why: 'Correction cost is asymmetric — an unreviewed wrong match becomes a wrong report a customer may show a client. AI extraction is probabilistic; the downstream record is deterministic. Confirmation is the safety net.',
        tradeoff: 'The user does review work. Minimized by only flagging uncertain rows, not all rows.',
      },
      {
        q: 'Two-tier (match/no-match), three tiers, or a raw confidence score?',
        options: [
          'Two tiers: no room for "probably right, please confirm".',
          'Raw score: pushes "is 0.73 good enough?" onto the user.',
          'Three discrete tiers: MATCH / PARTIAL_MATCH / NO_MATCH.',
        ],
        chosen: 'Three tiers.',
        why: 'There is a real middle case — fairly sure, with ranked alternatives. Pre-fill the top guess but flag it, so confirmation costs a glance not data entry. Three tiers turn a probability into an action; a raw score would offload the judgment to the user.',
        tradeoff: 'Threshold calibration between tiers must be tuned. The model team owns that; the UI captures the correction signal that feeds it.',
      },
      {
        q: 'Synchronous request, or async job with status tracking?',
        options: [
          'Sync: simplest, but blocks a thread/UI on a slow, variable LLM call.',
          'Async job + status state machine (ICE push + polling fallback).',
        ],
        chosen: 'Async (V2).',
        why: 'LLM comprehension latency is proportional to output length plus queueing — seconds to minutes. You cannot hold a request thread on that. Status is server-authoritative and re-fetched on load, so work survives a browser close.',
        tradeoff: 'More moving parts — status state machine, event channel, fallback. Necessary for a slow probabilistic dependency.',
      },
      {
        q: 'Event-driven only, or event + polling fallback?',
        options: [
          'ICE pub/sub only: low-latency, but a dropped socket or tab switch loses the event.',
          'ICE push + interval polling fallback.',
        ],
        chosen: 'Push + fallback.',
        why: 'ICE gives fast completion signals; polling (5s while IN_PROGRESS) guarantees eventual consistency if a push is missed. Graceful degradation.',
        tradeoff: 'Two mechanisms to maintain and keep idempotent on status transitions. Worth it for reliability.',
      },
      {
        q: 'Build the upload, or embed the platform widget?',
        options: [
          'Build financial-grade upload: full control, reinvents virus-scan/PCI/compliance.',
          'Embed smartdocs-web-platform/unified-upload.',
        ],
        chosen: 'Embed.',
        why: 'The platform widget already handles virus scanning, PCI/7216 compliance, allowed channels, drag-drop. Rebuilding that for a financial product would be reckless. Composition over reinvention.',
        tradeoff: 'Dependency on the widget contract. Acceptable — it is the compliant path.',
      },
    ],
    algorithms: [
      {
        name: 'Match-tier → grid-row normalization',
        description:
          'getQbAiBudgetDetails / populateGridUtils maps each AI record to a grid row by matchStatus: MATCH uses the matched entity; PARTIAL_MATCH pre-fills the top alternative; NO_MATCH leaves the product/service blank so the user must pick.',
        complexity: 'O(records).',
        why: 'Encodes the confidence policy in one place — the difference between auto-accept, pre-fill-and-flag, and force-pick.',
      },
      {
        name: 'Semantic matching (QBAI-owned)',
        description:
          'Extracted item text is matched against the P&S catalog by semantic similarity — standard modern pattern is embeddings (text → vectors) ranked by cosine similarity, thresholds becoming the tiers, with ranked alternatives as nearest neighbors.',
        complexity: 'Embedding + nearest-neighbor on the backend.',
        why: 'String equality fails on rewordings ("shaker white cabinet" vs "Custom Cabinets, White"). VERIFY: this is the QBAI layer — describe the pattern, disclaim the implementation.',
      },
      {
        name: 'Document status state machine',
        description:
          'NO_DOCUMENT → IN_PROGRESS → EXTRACTED → COMPLETED, with EXTRACTION_FAILED and CANCELLED terminal. The Redux reducer maps status to UI booleans (autofillInProgress, dataFetched, error) and populates records on EXTRACTED.',
        complexity: 'O(1) per transition.',
        why: 'Server-authoritative status is what lets the user navigate away and return without losing extraction work.',
      },
    ],
    numbers: [
      { metric: 'Manual task time', value: '~30 min → upload + review', note: 'The core value proposition.' },
      { metric: 'Confidence tiers', value: '3', note: 'MATCH / PARTIAL_MATCH / NO_MATCH.' },
      { metric: 'Status states', value: '7', note: 'NO_DOCUMENT, IN_PROGRESS, EXTRACTED, COMPLETED, EXTRACTION_FAILED, CANCELLED (+ initial).' },
      { metric: 'Polling interval', value: '5s while IN_PROGRESS', note: 'Fallback when ICE push is missed. VERIFY current value.' },
      { metric: 'Import guardrail', value: '100 records', note: 'maxAllowedRecordsToBeImported triggers CANNOT_IMPORT_ALL_RECORDS. Grid caps at 3500 lines.' },
    ],
    warStories: [
      {
        scenario: 'AI matches the wrong product',
        whatHappened:
          'Semantic matching can suggest a plausible-but-wrong catalog item, especially for similarly-named products — and this becomes a financial line item.',
        howResolved:
          'Confidence tiers: only MATCH is pre-accepted; PARTIAL_MATCH pre-fills the top alternative but flags the row with the AI icon; NO_MATCH forces a manual pick. Wrong matches are caught at human review before save.',
        lesson:
          'For probabilistic output feeding deterministic records, the UI must make accidental acceptance of low-confidence matches structurally hard.',
      },
      {
        scenario: 'Slow extraction / lost status event',
        whatHappened:
          'LLM comprehension can take minutes, and a completion push can be missed (dropped socket, tab switch), leaving the UI stuck IN_PROGRESS.',
        howResolved:
          'Async job with ICE push plus polling fallback (5s). Status is server-authoritative and re-fetched on load, so state converges regardless of a missed event.',
        lesson:
          'Never rely on a single delivery channel for a completion signal; pair push with a polling backstop.',
      },
      {
        scenario: 'Hallucinated line item',
        whatHappened:
          'An LLM can produce plausible output not grounded in the input — an invented line, a misread subtotal, a guessed rate.',
        howResolved:
          'Human-in-the-loop confirmation is the architectural response — unreviewed extraction never saves. Model-side mitigations (structured output, grounding) are QBAI-owned.',
        lesson:
          'Assume hallucinations exist and cannot be fully eliminated by the model — design the UI as the safety net, not a nice-to-have.',
      },
    ],
    edgeCases: [
      { case: 'Multi-sheet workbook', handling: 'qbAiDocumentValidate returns sheetNames; multiple sheets open a sheet-select modal (you cannot guess which sheet is the budget). Single sheet auto-proceeds.' },
      { case: 'Browser closed mid-extraction', handling: 'Status is server-authoritative; re-fetched on load. The AI work (the expensive half) is not lost; local grid edits are.' },
      { case: 'Sheet exceeds 100 records', handling: 'CANNOT_IMPORT_ALL_RECORDS guard prevents swamping the grid/backend.' },
      { case: 'Simulated progress bar', handling: 'No granular backend progress signal, so the bar advances on a timer and can sit at ~85% during a slow extraction. A perceived-performance choice and a known debt.' },
    ],
    whatIWouldChange:
      'Retrospective opinion — verify before claiming. (1) Real backend progress events instead of a simulated bar. (2) Stream partial records so the first rows render while the rest extract. (3) Centralize the confidence-tier interpretation into one predicate (matchStatus is read in several places). (4) Match-acceptance telemetry per tier as the loop for tuning thresholds. (5) Replace the global mutable state in asyncTopic.tsx with a managed subscription; fix the dead guard in the polling hook.',
    chains: [
      {
        title: 'The human-in-the-loop chain',
        steps: [
          { q: 'Why not auto-accept everything the AI matched?', a: 'The output lands in financial records that flow into profitability and estimate-vs-actuals. An unreviewed wrong match becomes a wrong report. Correction cost is asymmetric.' },
          { q: 'How does the user know which rows to review?', a: 'The AI sparkles icon renders only on PARTIAL_MATCH and NO_MATCH rows. Clean rows have no icon; NO_MATCH has an empty required field caught by save validation.' },
          { q: 'What stops a user clicking Save on everything?', a: 'They can, but they must actively ignore a visual signal. NO_MATCH rows fail required-field validation. Acceptance telemetry reveals if users are rubber-stamping partials.' },
        ],
      },
      {
        title: 'The async-latency chain',
        steps: [
          { q: 'Why can\'t this be synchronous?', a: 'LLM comprehension latency is proportional to output length plus queueing — seconds to minutes. Holding a request thread or UI on that is untenable.' },
          { q: 'How is completion detected?', a: 'ICE pub/sub push, with interval polling fallback while IN_PROGRESS. Status is server-authoritative.' },
          { q: 'What if the push is missed?', a: 'Polling re-queries status; state converges. Two channels, one authoritative source.' },
        ],
      },
      {
        title: 'The matching chain',
        steps: [
          { q: 'How is a spreadsheet item matched to the catalog?', a: 'Semantic similarity, not string equality — embeddings ranked by cosine similarity with thresholds becoming the tiers. VERIFY: QBAI-owned; describe the pattern, disclaim the implementation.' },
          { q: 'Why keep the model internal, not use a public LLM API?', a: 'Two reasons: customer financial data cannot leave the trust boundary; and matching is company-specific — it embeds against the customer\'s own P&S catalog, so the matching infra and catalog live together.' },
          { q: 'How would you know the model degraded?', a: 'Match-acceptance telemetry per tier — a rising correction rate on the MATCH tier signals degradation. VERIFY what telemetry exists.' },
        ],
      },
    ],
    followUps: {
      firstPrinciples: [
        { q: 'What makes this an engineering problem and not just an AI feature?', a: 'The seam: a probabilistic upstream feeding a deterministic financial record. The entire design — tiers, human-in-the-loop, gated save, async status — exists to manage that seam safely.' },
        { q: 'Why three tiers rather than a confidence percentage?', a: 'A percentage offloads "is this good enough?" to the user. Three discrete tiers with distinct UI treatment turn a probability into an action: auto-accept, confirm-a-pre-fill, or force-pick.' },
        { q: 'What is your answer to "how do you handle hallucinations"?', a: 'Assume they exist; the confirmation UI is the safety net. Human-in-the-loop is the architectural response to a probabilistic component upstream of a deterministic record.' },
      ],
      aiConcepts: [
        { q: 'What does "extraction" actually do?', a: 'Turns an unstructured spreadsheet grid into typed records (name/description/quantity/rate). LLM-era: send cells to the model, it infers columns and structure across any layout — flexible but probabilistic.' },
        { q: 'How is matching done under the hood?', a: 'VERIFY / boundary: I consumed the score and alternatives. My working model is embeddings + cosine similarity + thresholds — the standard semantic-match pattern — but the QBAI team owns the implementation.' },
        { q: 'How would match quality be measured?', a: 'Precision and recall on the tiers; the thresholds between tiers are the tunable knobs that trade them off. My layer captures the correction signal that feeds that tuning.' },
      ],
      systemsDesign: [
        { q: 'Why Redux, not local state or context?', a: 'Cross-component shared import state (side panel, grid, modal, toast), multi-step async orchestration (validate → comprehend → poll → save), and testability in isolation.' },
        { q: 'Why a GraphQL BFF to a dedicated AI service?', a: 'One typed round-trip returns extraction + matching + confidence + alternatives together, and isolates the AI backend from core budgeting APIs.' },
        { q: 'How does the status survive a page reload?', a: 'Server-authoritative document status re-fetched on load; the Redux reducer rehydrates from it. The AI work persists on the backend regardless of the client.' },
      ],
      ownership: [
        { q: 'What did YOU build?', a: 'VERIFY from PRs. Likely frontend slice: the review UI (match-tier normalization, AiSparkles column config, alternatives popover), the Redux status slice, the polling hook, or the side-panel orchestration. Claim exactly what your commits show.' },
        { q: 'What did you NOT build?', a: 'Disclaim: the QBAI extraction/matching model, the ICE pub/sub infrastructure, the upload widget internals, and V3 agentic if you did not work on it.' },
      ],
    },
  },
};

/* ============================================================================
 * FAMOUS QUESTIONS — HR / BEHAVIORAL ROUND
 * ============================================================================
 * STAR-structured answers grounded in real projects. [VERIFY] marks specifics
 * (numbers, quotes, names) to swap for your actual memory before saying them.
 * The situations are real; the scaffolding details are yours to make true.
 * ========================================================================== */

const HR_QUESTIONS = [
  {
    category: 'Career Oriented',
    questions: [
      {
        q: 'Tell me about yourself',
        principle: 'Present → past (2-3 proof points) → future, ending on why THIS role. 60-90 seconds. Not a resume readthrough — a narrative arc.',
        answer:
          "I'm a software engineer at Intuit, currently SDE II, working on the QuickBooks Projects and Payroll platform. I came up through NIT Trichy, joined as an intern, and grew into SDE II — so I've owned work across the full range, from shipping features to designing infrastructure. The work I'm proudest of sits at the intersection of reliability and scale: I built a traffic capture and replay framework that validates high-risk backend changes against real production traffic without touching customers, and I worked on the resiliency layer for our cross-service project sync. Alongside that I've shipped customer-facing financial features — project budgets, change orders — where correctness isn't optional because it's people's money. What I've realized I'm best at, and want more of, is exactly the kind of problem where a system has to be both safe and fast under real production pressure — which is why I'm interested in this role.",
        notes: 'Swap the closing line to name what THIS company does that matches. Keep the arc: what I do now → 2-3 concrete proofs → what I want next.',
      },
      {
        q: 'Company change reason',
        principle: 'Pull toward the new, never push away from the old. Never criticize Intuit. Frame as growth, not escape.',
        answer:
          "Intuit has been a genuinely good place to grow — I went from intern to SDE II there and got to own real infrastructure. My reason for looking is about the kind of problem I want to work on next, not about leaving. The traffic replay framework and the resiliency work showed me I'm drawn to systems where reliability and scale are the core challenge, not a side concern. I want to go deeper into that, ideally somewhere the pace and the technical bar push me faster than staying on a familiar codebase would. It's a pull toward harder systems problems, not a push away from anything.",
        notes: 'If asked directly about a negative, stay gracious: nothing I would call a problem, more that I have learned what energizes me and want to lean into it.',
      },
      {
        q: 'Why this company?',
        principle: 'Show you researched THEM specifically. Connect their problem space to your demonstrated strengths. Generic answers fail here.',
        answer:
          "[VERIFY — research the specific company] Two things. First, the problem space: you operate at a scale and reliability bar where the kind of work I've been doing — validating changes against real traffic, designing for failure across services — is central, not peripheral. That's exactly where I do my best work and where I want to grow. Second, the engineering culture I've read and heard about rewards depth and ownership, which matches how I like to work — I took the traffic replay framework from an idea to a platform used across multiple migrations largely because I was given the room to own it. I want more of that, at a higher bar.",
        notes: 'MANDATORY: fill the [VERIFY] with 2 specific, researched facts about the company — a product, an engineering blog post, a scaling challenge they wrote about. Generic = instant tell.',
      },
      {
        q: 'Next role priorities',
        principle: 'Show ambition aligned with the role level. Balance technical growth with impact. Avoid "I want to be a manager" unless the role is management.',
        answer:
          "Three things, in order. First, technical depth on hard distributed-systems problems — I've gotten a taste of it with replay and resiliency work and I want to go much deeper on systems where correctness under scale is the whole game. Second, ownership of something end to end — I do my best work when I own a problem from design through production, like I did with the replay framework, rather than picking up slices. Third, growing the people around me — I've started mentoring informally and I want that to become a real part of how I work. Long-term I care more about becoming the engineer teams reach for on the hardest problems than about a specific title.",
        notes: 'Calibrate ambition to the role. For a strong IC role, lead with technical depth + ownership. Mention mentoring as growth, not as pivot away from coding.',
      },
    ],
  },
  {
    category: 'Project Based',
    questions: [
      {
        q: 'Most proud project',
        principle: 'Pick the one with the most depth AND clearest personal ownership. Traffic replay. Lead with impact, show the hard decision, end with what it taught you.',
        answer:
          "The traffic capture and replay framework. The problem: our project service handles around 100,000 customers a day of financial data, and we needed to make high-risk backend changes — a database migration, a Hibernate upgrade — with confidence that they wouldn't break real customer flows. Manual and automated tests only cover the cases you thought of; they can't reproduce the shape of real production traffic. So I built a framework that runs a passive parallel server with the change applied and replays real production traffic against it, comparing response parity, data correctness, and latency — all without ever touching a customer or a downstream system. The hardest decision was making blast radius zero by construction, not by convention: I mocked all downstream writes at the network layer with a proxy, so even a bug in the application code physically cannot reach production. It backed multiple migrations with zero customer-facing incidents. What I'm proudest of isn't the code — it's that I took it from an idea to a platform other teams used, and it changed how we ship risky changes.",
        notes: 'This is your strongest project — own it fully. The "zero by construction not convention" line is the senior signal; land it. Have the BFS data-validation and TLS-sandwich details ready for follow-ups.',
      },
      {
        q: 'How you choose technologies',
        principle: 'Show you reason from constraints, not hype. Name a real decision, the alternatives, and the tradeoff. Interviewers grade the reasoning, not the choice.',
        answer:
          "I start from the constraint, not the technology. Concrete example from the replay framework: for capturing traffic, I had to choose between instrumenting the application code, a sidecar with GoReplay, or a service-mesh mirror. I chose the sidecar — because the alternative, in-process capture, would have coupled the capture lifecycle to the application's release cycle and put my code in the customer's critical request path, where a bug could add latency or crash the app. The sidecar gave me an independent failure domain, independent rollout, and zero application changes. The cost was a small resource overhead and a network hop, which I accepted because safety and isolation were non-negotiable. That's my general pattern: name the invariant that can't be violated, then pick the option that protects it, and be explicit about what I'm trading away.",
        notes: 'The reasoning structure — invariant → option that protects it → what I traded — matters more than the specific tech. Reusable for Kafka partition key, optimistic locking, API-vs-events.',
      },
      {
        q: 'Leading a project',
        principle: 'Leadership without authority is the SDE2 sweet spot. Show you drove clarity, sequencing, and unblocking — not that you managed people.',
        answer:
          "The clearest example is the traffic replay framework — I led it without any formal authority. It started as my proposal to solve a validation gap, and I had to bring along multiple stakeholders: the teams whose downstream services I needed to mock, the platform folks, and leadership who had to fund a parallel production stack. I led by turning a vague fear — 'we might break something in this migration' — into a concrete, staged plan with clear checkpoints, and by reframing the ask to each team in terms they cared about: I told the downstream teams that mocking their services protected them from doubled traffic, rather than asking them for a favor. When blockers came up across teams, I owned surfacing them fast and routing them to whoever could unblock. The framework shipped and backed multiple migrations. The lesson: leading without authority is mostly about converting ambiguity into a plan everyone can see, and making it obviously in each person's interest to help.",
        notes: 'AU launch is your backup leadership story (10+ teams, gates, sequencing). Use whichever fits the follow-up better. Emphasize converting ambiguity into a shared plan.',
      },
    ],
  },
  {
    category: 'Teamwork & Collaboration',
    questions: [
      {
        q: 'Cross-team collaboration',
        principle: 'Name the tension between teams and how you resolved it through THEIR incentives, not authority.',
        answer:
          "On the replay framework, I needed downstream teams — payments, notifications, and others — to let me mock their services in the parallel stack. Their first instinct was hesitation: it was more surface area for them and they didn't own the project. The tension was real. I resolved it by reframing: replaying write traffic against their real services would double their load and risk corrupting their state, so mocking wasn't me asking a favor — it was me protecting their SLAs. Once it was framed as their protection rather than my convenience, the conversations flipped. I also kept the integration contract minimal so onboarding cost them almost nothing. The collaboration worked because I led with their incentive, not mine.",
        notes: 'The CMS project (coordinating with the CMS team on API-vs-events) is an alternate. Core move: find what the other team cares about and frame your ask through it.',
      },
      {
        q: 'Teammate was not contributing enough',
        principle: 'Show empathy first, then constructive action, then escalation only if needed. Never throw the teammate under the bus. Assume a reason before assuming fault.',
        answer:
          "[VERIFY — anchor to a real instance] On one of the budget projects, a teammate's pieces were consistently landing late and it was starting to affect the timeline. Before assuming they weren't pulling weight, I talked to them one-on-one — and it turned out they were blocked on unfamiliarity with part of the codebase and hadn't wanted to flag it. So I paired with them for a couple of sessions to get them unblocked, and we broke their work into smaller, more visible chunks so progress was easier to track and easier to ask for help on. Their delivery recovered. My takeaway: 'not contributing' is usually 'blocked and not saying so.' Leading with a question instead of a judgment fixed it without it ever becoming a conflict.",
        notes: 'The empathy-first framing is what interviewers want. Swap for a real instance if you have one; if not, keep it generic but plausible. Never name the teammate or make them look bad.',
      },
      {
        q: 'Helped a teammate solve a technical challenge',
        principle: 'Show you can transfer knowledge, not just solve. The hero is the teammate learning, not you rescuing.',
        answer:
          "[VERIFY — anchor to a real instance] A teammate was stuck debugging why data comparisons in a validation flow kept showing false mismatches. They'd been at it a while and were ready to conclude the data was genuinely diverging. I'd hit the same class of problem on the replay framework, so I sat with them and walked through it: the mismatches were on variable fields — generated IDs, timestamps — that differ by design between two runs. The fix wasn't in the data, it was in the comparison: normalize out the variable fields first. I didn't just hand them the answer — I walked them through why those fields differ, so they'd recognize the pattern next time. They shipped it, and later applied the same normalization idea somewhere else on their own. That's the part I care about — that they could reuse the reasoning.",
        notes: 'Grounds in your real variable-field-normalization knowledge. The senior move: teach the pattern, not the fix. End on them reusing it independently.',
      },
      {
        q: 'Mentoring or Coaching',
        principle: 'Show structure and follow-through, not a one-off. Growth of the mentee is the outcome.',
        answer:
          "[VERIFY — anchor to a real instance] I've mentored a couple of newer engineers on the team, most concretely one junior who was ramping on our codebase. Rather than answer questions ad hoc, I set up a light structure — a regular check-in, and I'd assign them a real but scoped piece of work with me available as backup. My rule was to never just give the answer: I'd ask what they'd tried and where their mental model broke, so they built the debugging muscle instead of a dependency on me. Over a few months they went from needing hand-holding to owning features and reviewing others' code. Watching that shift — from consuming answers to producing them — is genuinely one of the more satisfying parts of the job, and it's something I want more of in my next role.",
        notes: 'Connects to your next-role-priorities answer (growing people). Emphasize structure + the never-just-give-the-answer rule.',
      },
    ],
  },
  {
    category: 'Conflict & Disagreement',
    questions: [
      {
        q: 'Conflict with a teammate',
        principle: 'Disagreement over an idea, resolved with data and shared goals. Not personal. Show you can disagree and commit.',
        answer:
          "[VERIFY — anchor to a real technical disagreement] On the replay framework, a teammate and I disagreed on how to handle downstream calls — they wanted to allow real reads and writes through with idempotency guards, and I argued for mocking writes entirely. It was a real disagreement because their approach would have given more realistic end-to-end validation. I didn't push it as opinion versus opinion; I laid out the concrete risk: not every downstream was guaranteed idempotent, so a replayed write could corrupt real production state, and the blast radius of that on financial data was unacceptable. We walked through the failure cases together, and once it was framed as 'what's the worst that happens if we're wrong,' we aligned on mocking writes and letting reads pass through. The key was making it about the shared goal — zero customer impact — not about who was right.",
        notes: 'Grounds in a real design axis of your project. The move: convert opinion-vs-opinion into a shared risk analysis. Disagree, then align on the goal.',
      },
      {
        q: 'Disagreement with manager',
        principle: 'Show respectful pushback with reasoning, willingness to disagree-and-commit if overruled. Never insubordinate, never a pushover.',
        answer:
          "[VERIFY — anchor to a real instance] There was a point where there was pressure to ship a risky change on a tighter timeline than I was comfortable with, before the replay validation was fully in place. I disagreed, and I said so directly — but with reasoning, not resistance: I laid out the specific failure modes we'd be blind to without the validation, and what a customer-facing incident on financial data would cost versus the time we'd save. I also came with an option, not just an objection — a staged path that de-risked the most dangerous part first. My manager and I talked it through and adjusted the plan. If I'd been overruled after making my case, I'd have committed fully — disagreeing and then committing is part of the job. But the way to earn that pushback being taken seriously is to bring reasoning and an alternative, not just a no.",
        notes: 'Balance: strong enough to show a spine, humble enough to show disagree-and-commit. Always bring an alternative, not just an objection.',
      },
      {
        q: 'Handling difficult colleague',
        principle: 'Show maturity and de-escalation. Focus on the work, separate the person from the friction. Never vent.',
        answer:
          "[VERIFY — anchor if real] I try to assume good intent and keep everything anchored to the work rather than the friction. In one case, a colleague was consistently combative in reviews — sharp comments, pushing back hard on approach. Rather than match the tone or take it personally, I took it offline: I asked to talk through their concerns directly, and it turned out a lot of the sharpness was them caring about a part of the system they felt protective of. Once I understood that, I started looping them in earlier on decisions that touched their area, so they felt consulted rather than presented-with. The friction dropped a lot. My approach is to look for the legitimate concern underneath the difficult delivery, and address that.",
        notes: 'Never make it sound like you have enemies. Look for the legitimate concern under the difficult delivery is the mature framing.',
      },
    ],
  },
  {
    category: 'Problem Solving',
    questions: [
      {
        q: 'Choosing best solution',
        principle: 'Show a structured evaluation: options, criteria, tradeoff, decision. The replay data-validation choice is perfect.',
        answer:
          "Best example is how I validate data parity in the replay framework. The naive option — diffing whole database tables between the two systems — is correct but completely infeasible at terabyte scale, and mostly meaningless because 99.99% of rows have nothing to do with the request being validated. I needed to compare exactly the rows one request touched. The insight was that a relational schema is really a graph — rows are nodes, foreign keys are edges — so the rows a single write touches form a small connected subgraph hanging off one parent record. I traverse that with a breadth-first search from the request's parent record, bounded by a time window, which gives me exactly the impacted rows in a cost proportional to what the request touched — tens of rows, not the whole table. I chose it because it was the only option that was both correct and feasible at scale. The criteria were: correctness, cost at 32TB, and semantic meaningfulness — and the graph traversal was the only one that satisfied all three.",
        notes: 'Your strongest structured-problem-solving story. The schema-is-a-graph insight is the impressive part — land it clearly.',
      },
      {
        q: 'Production outage handling',
        principle: 'Calm, structured: detect → mitigate → root-cause → prevent. Show you stop the bleeding before finding the cause.',
        answer:
          "[VERIFY — anchor to a real incident, or frame honestly] My instinct on any production issue is mitigate first, diagnose second — stop customer impact before satisfying curiosity about the cause. On the resiliency work for our cross-service sync, the whole design was built around exactly this kind of failure: when a call to the customer-management service times out mid-operation, you're in an unknown state — the write may have succeeded or failed. The wrong move is to guess. So the pattern I built was: detect the failure within a bounded timeout, treat the outcome as unknown, then reconcile by reading the actual downstream state before taking any corrective action — because blindly rolling back a call that actually succeeded creates the opposite inconsistency. That reconcile-before-you-act discipline is exactly how I approach outages: contain, find ground truth, then act on facts, not assumptions.",
        notes: 'If you have a real outage you personally handled, use it. Otherwise this honestly frames your resiliency work as your outage philosophy. Mitigate before diagnose is the key phrase.',
      },
      {
        q: 'Made decision with incomplete information',
        principle: 'Show you can act under uncertainty with a reversible bet + a way to learn. Not reckless, not paralyzed.',
        answer:
          "The entire timeout-handling design in the resiliency project is a decision under incomplete information — that's literally the problem. When a cross-service call times out, you fundamentally cannot know whether it succeeded; the information is unavailable by nature. The wrong response is to freeze or to guess. What I did was design the system to make the missing information discoverable: every call carries a correlation ID, so after a timeout I can go read the actual state and turn 'unknown' into 'known' before acting. Where I couldn't fully resolve it, I made the corrective action safe under either outcome — idempotent retries that do no harm if the original actually succeeded. That's my general approach to incomplete information: prefer decisions that are either reversible or that create a path to the missing facts, rather than betting big on a guess.",
        notes: 'Reframes the CMS reconciliation work as decision-under-uncertainty — natural fit. Reversible bet or a path to the missing facts is the principle.',
      },
      {
        q: 'Automating repetitive tasks',
        principle: 'The whole traffic replay framework IS this answer — it automated away thousands of hours of manual regression testing.',
        answer:
          "The traffic replay framework is fundamentally an automation story. Before it, validating a risky backend change meant huge amounts of manual regression testing — engineers hand-crafting test cases that could never cover the real shape of production traffic, and still leaving blind spots. I automated the whole validation loop: capture real production traffic, replay it against the changed system, and automatically compare responses, data, and latency — surfacing regressions as a report instead of as a customer incident. It saved on the order of a thousand-plus hours of manual regression work across initiatives [VERIFY exact figure], but the bigger win was qualitative — it turned 'test what we thought of and hope' into 'validated against real traffic before release.' I look for exactly these leverage points: repetitive, error-prone manual work that, if automated well, changes not just the effort but the confidence level of the whole team.",
        notes: 'Verify the 1000+ hours figure against your resume. The qualitative reframe (changed the confidence level, not just the effort) is the senior touch.',
      },
    ],
  },
  {
    category: 'Adaptability & Learning',
    questions: [
      {
        q: 'Quickly learning a new technology',
        principle: 'Show a learning method, not just "I learned X." How you ramp is the transferable signal.',
        answer:
          "The replay framework forced me to ramp fast on a stack I hadn't used deeply — GoReplay for capture, Envoy and Wiremock for downstream mocking, Kafka for the transport, all at once. My method is to learn from the constraint inward rather than reading docs end to end: I started from what the system had to guarantee — capture HTTP-level traffic without touching the app, mock writes with zero blast radius, pair requests with responses reliably — and then learned exactly the part of each tool that served that guarantee. For Kafka, that meant going deep on partitioning and ordering because request-response pairing depended on it, and staying shallow on the rest until I needed it. Learning against a concrete requirement makes it stick, and it stops you drowning in a tool's full surface area. Within a few weeks I understood these well enough to make real architectural decisions with them.",
        notes: 'Learn from the constraint inward is a genuinely good, memorable framing of a learning method. That method IS the answer.',
      },
      {
        q: 'Worked outside your comfort zone',
        principle: 'Show you sought the stretch, not that you were forced. The AI import or the infra work both fit.',
        answer:
          "[VERIFY — pick AI import or infra] The AI-assisted budget import pushed me outside my comfort zone. My strength is backend and systems; this dropped me into the seam between a probabilistic AI service and a deterministic financial record, which meant I had to get genuinely fluent in things I hadn't worked with — confidence scoring, why extraction is probabilistic, how semantic matching differs from string equality, the async patterns you need because LLM calls are slow and variable. I leaned into it rather than staying in the part I already knew: I made sure I understood why the AI behaved the way it did, so I could design a UI that made it structurally impossible to let a low-confidence match land in a financial record unreviewed. The discomfort was the point — I came out able to reason about AI systems, which is a gap I deliberately wanted to close.",
        notes: 'Frame the stretch as something you sought. Verify which project you actually stretched on most and use that one.',
      },
      {
        q: 'Enhancing technical knowledge',
        principle: 'Show deliberate, ongoing learning tied to real work — not passive "I read blogs."',
        answer:
          "I learn most durably by going deeper on the systems I'm actually building rather than studying in the abstract. Concretely: the replay and resiliency work pushed me deep into distributed systems — I went and properly learned the distributed-transaction landscape, 2PC versus saga versus outbox, not as trivia but so I could correctly name what my own system was and defend why I didn't use the alternatives. I do the same with fundamentals under whatever I'm touching — when I worked on the database migration validation, I went deep on isolation levels, collation semantics, sequence handling, because bugs live in exactly those gaps between engines. My pattern is: whenever I hit something I'm using but can't explain from first principles, I treat that as the signal to go learn it properly, because that gap is exactly where an interviewer — or a production incident — will find me.",
        notes: 'The gap-between-using-and-explaining = signal-to-learn framing shows genuine engineering maturity. Ties to how you actually prepped.',
      },
    ],
  },
  {
    category: 'Time Management & Prioritization',
    questions: [
      {
        q: 'Managing multiple tasks with deadlines',
        principle: 'Show a prioritization framework (impact × risk, or reversibility), not just "I made a list."',
        answer:
          "I prioritize by blast radius and reversibility, not by what's loudest. Concretely, during the project budgets work I was juggling the DataGrid performance work, the migration pipeline, and coordinating the reporting source switch — all with the same rough deadline. I sequenced by asking two questions of each: what's the cost if this is wrong, and how hard is it to reverse? The reporting source switch and migration touched financial correctness for existing users and were hard to undo, so they got my focus and the most validation. The DataGrid perf work was important but lower-risk and more reversible, so it could tolerate being second. I also front-loaded the things other people were blocked on, so I wasn't the bottleneck for the team. The framework matters more than the list — urgent and important aren't the same, and reversibility tells you where to spend your caution.",
        notes: 'The blast-radius × reversibility framework is the senior signal. Anchor to real concurrent work — budgets is a good fit.',
      },
      {
        q: 'Time when you missed a deadline',
        principle: 'Own it without excuses, show what you learned and changed. Never blame others. The lesson is the point.',
        answer:
          "[VERIFY — anchor to a real slip] On one project, a piece I owned slipped past the date I'd committed to. The honest root cause was that I'd underestimated the integration complexity — specifically the edge cases in how the change interacted with existing behavior — and I hadn't surfaced the risk early enough, so by the time it was clearly going to be late, there wasn't much runway to adjust. I owned it directly with my lead rather than letting it drift, we re-scoped to ship the safe core on time and fast-follow the rest, and it landed without customer impact. The real lesson wasn't about working faster — it was about surfacing risk earlier. Now I flag 'this might slip and here's why' the moment I smell it, not when it's certain, because early visibility gives everyone options that a late surprise doesn't.",
        notes: 'The lesson — surface risk early, not when it is certain — is what they are grading. Own the miss cleanly, no blame, show the behavior change.',
      },
    ],
  },
  {
    category: 'Leadership & Initiative',
    questions: [
      {
        q: 'Leading without asking',
        principle: 'The traffic replay framework started as YOUR initiative to fill a gap nobody assigned. That IS this answer.',
        answer:
          "The replay framework is exactly this. Nobody assigned it — I saw the gap. We had high-risk migrations coming and no reliable way to validate them against real customer traffic, and I was uncomfortable with the level of blind risk we were carrying. Rather than wait for someone to solve it, I scoped the idea, prototyped enough to prove it was feasible, and brought a concrete proposal to my lead instead of just raising a concern. Then I drove it across the teams whose buy-in I needed. The initiative wasn't just building it — it was recognizing that the risk was real before it turned into an incident, and taking ownership of a problem that technically wasn't anyone's assigned job. It ended up being used across multiple migrations. I've learned that the highest-leverage work is often the thing you notice is missing and decide to own.",
        notes: 'Your single best initiative story. Emphasize: saw the gap, prototyped proof, brought a proposal not a complaint. That sequence is the senior signal.',
      },
      {
        q: 'Going above and beyond',
        principle: 'Show discretionary effort that created outsized impact. The reusability of the replay framework fits — you built a platform, not a one-off.',
        answer:
          "When I built the replay framework, the minimum ask was to validate one specific migration. I could have built a narrow, throwaway tool for exactly that one job. Instead I built it as a general-purpose platform — protocol-agnostic capture, a reusable comparison engine, configuration-driven onboarding — because I could see the same validation gap would exist for the next risky change, and the one after that. That was more work up front for a problem nobody was asking me to solve yet. But it meant the framework went on to back multiple initiatives — a database migration, a Hibernate upgrade, and others — and became the way the org de-risks this class of change. Going above and beyond, to me, isn't heroics or hours; it's solving the general problem when you were only asked to solve the specific one, when you can see the leverage.",
        notes: 'Solve the general problem when asked for the specific one is a crisp, senior definition of above-and-beyond. Much stronger than I worked weekends.',
      },
    ],
  },
  {
    category: 'Handling Failure & Feedback',
    questions: [
      {
        q: 'Receiving critical feedback',
        principle: 'Show you take it non-defensively, act on it, and it made you better. Pick real, non-fatal feedback.',
        answer:
          "[VERIFY — anchor to real feedback] A piece of feedback I got that stuck was that I sometimes went deep into building before I'd socialized the approach widely enough — so I'd have a strong solution, but stakeholders hadn't been brought along, and I'd have to backtrack to get alignment. My first instinct was mild defensiveness — the solution was good — but the feedback was fair: being right isn't the same as being aligned. So I changed how I sequence: now I socialize the approach and the tradeoffs early, in a lightweight way, before I've sunk real time into building. It actually makes the building faster because I hit fewer late-stage 'wait, why didn't you consider X' moments. I've come to value that kind of feedback specifically because it catches blind spots I can't see myself.",
        notes: 'Pick feedback that is real but not disqualifying — a working-style thing, not a competence thing. Show the non-defensive turn and the concrete change.',
      },
      {
        q: 'Giving constructive feedback',
        principle: 'Show tact + directness. Specific, kind, actionable. Focus on behavior and impact, not the person.',
        answer:
          "[VERIFY — anchor if real] I gave a teammate feedback once that their PRs were technically solid but so large and unsegmented that reviewers couldn't give them good review — things were slipping through because nobody could hold a 900-line diff in their head. I made it specific and about impact, not character: 'when the PR is this big, I can't review it properly, so we're both losing the safety net of review.' And I made it actionable — I suggested breaking work into stacked, smaller PRs and offered to show them how I structure mine. I delivered it privately and framed it as 'here's something that'll make your work land better,' not 'here's what you're doing wrong.' They took it well and their PRs got much more reviewable. My rule for feedback: specific, about impact, actionable, and private.",
        notes: 'The four-part rule (specific / about impact / actionable / private) is the memorable takeaway. Behavior not character.',
      },
      {
        q: 'Delivering under challenge',
        principle: 'Show grit + judgment under real constraint. The AU launch (10+ teams, hard date) or a tight migration fits.',
        answer:
          "[VERIFY — AU launch or a migration] The Australia market launch was a real delivery-under-pressure situation — a hard launch date, over ten dependent teams, and a new market where a botched first impression against established competitors would be hard to recover from. The challenge was coordination under a fixed deadline with no authority over most of the teams involved. I helped drive it by making readiness objective rather than a matter of opinion: explicit per-team gates, a clear pre-launch cutoff, and daily triage of blockers so nothing festered. The judgment call under pressure was what to gate hardest on — I pushed to gate on the irreversible things, upgrade safety and financial-analytics correctness, and let lower-risk polish flex. It launched on time with no critical issues. Delivering under challenge, for me, is mostly about making the plan legible and gating your caution where the cost of being wrong is highest.",
        notes: 'AU launch is the natural fit. The judgment signal: gate hardest on the irreversible things. Verify your actual role/contribution on AU before over-claiming.',
      },
      {
        q: 'Time when you failed',
        principle: 'A real failure, owned cleanly, with a genuine lesson. Not a humblebrag. The vulnerability + the growth is the point.',
        answer:
          "[VERIFY — anchor to a real failure] Early on, I built a piece of a feature the way I thought was right without validating my assumptions about how users actually worked with it — and it turned out I'd optimized for a workflow that wasn't the common one. It shipped, got limited traction for the effort I'd put in, and I had to rework a meaningful part of it. The failure was real: I'd fallen in love with my solution before confirming the problem. What I took from it is that I now front-load validating the assumption, not just the implementation — I'll spend time up front confirming 'is this actually the problem, and is this actually how people hit it' before I commit to a design. It made me a better engineer specifically because it was a bit humbling — it broke the habit of assuming my model of the problem was correct.",
        notes: 'Must be a REAL failure with a real cost — interviewers can smell a fake one. Fell in love with the solution before confirming the problem is relatable, non-fatal, with a genuine lesson.',
      },
    ],
  },
  {
    category: 'Communication Skills',
    questions: [
      {
        q: 'Explaining to non-technical',
        principle: 'Show you can translate via analogy and audience-framing. Pick a genuinely technical thing you simplified.',
        answer:
          "I had to explain the replay framework to non-technical stakeholders to justify funding a parallel production stack. The technical version — sidecars, traffic mirroring, downstream mocking — means nothing to them. So I used an analogy: it's like a flight simulator for our production system. We take the real conditions pilots actually face — real customer traffic — and let a new version of the plane fly through them in a simulator, where a crash hurts no one, before we ever put real passengers on it. Then I connected it to what they cared about: this is how we make risky changes without betting the customer experience on them. The principle I use is to lead with what the listener cares about — for them it was risk and customer trust, not architecture — and reach for an analogy from a world they already understand. Framing for the audience is most of the work.",
        notes: 'The flight-simulator analogy is genuinely good and reusable. Principle: lead with what THEY care about, borrow an analogy from their world.',
      },
      {
        q: 'Presenting to leadership',
        principle: 'Show you lead with the decision/ask and the impact, not the technical journey. Executives want the "so what" first.',
        answer:
          "When I've presented to leadership — for instance to get buy-in and resourcing for the replay framework — I've learned to invert how engineers naturally talk. My instinct is to build up from the technical detail to the conclusion; leadership needs the opposite. So I lead with the decision and the stakes: 'we're carrying real risk on these migrations, here's a way to eliminate it, here's what it costs and what it saves,' and I put the number and the ask in the first thirty seconds. Then I go one level down into how it works, and I keep the deep technical detail in reserve for questions rather than in the main line. I also frame everything in their terms — risk reduction, customer-facing incidents avoided, engineering hours saved — not in terms of the architecture I find interesting. Conclusion first, tailored to what they're deciding, detail on demand. That shift made my asks land much better.",
        notes: 'Conclusion first, detail on demand is the executive-communication principle. The contrast with engineer-instinct (build up vs. lead with so-what) shows self-awareness.',
      },
    ],
  },
];

/* ============================================================================
 * STYLES
 * ============================================================================
 * Editorial/refined dark theme. Serif display (Fraunces) + monospace accent
 * (JetBrains Mono). Heavy use of CSS variables. Minimal AI-slop.
 * ========================================================================== */

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');

  :root {
    --ink: #0a0a0a;
    --paper: #f4f1ea;
    --paper-2: #ebe6dc;
    --ink-soft: #1a1a1a;
    --ink-mid: #3a3a3a;
    --ink-faded: #6b6b6b;
    --rule: #d6d0c4;
    --accent: #c9461b;
    --accent-soft: #e8a071;
    --tier-1: #c9461b;
    --tier-2: #8a6d3b;
    --tier-3: #6b6b6b;
    --display: 'Fraunces', Georgia, serif;
    --mono: 'JetBrains Mono', 'SF Mono', monospace;
    --body: 'Inter', -apple-system, sans-serif;
    --grain-opacity: 0.4;
    --grain-blend: multiply;
    --fp-bg: #efeadf;
    --fu-bg: #efeadf;
    --paper-warm: #ece7dc;
  }

  [data-theme="dark"] {
    --ink: #f0ece2;
    --paper: #0f0f10;
    --paper-2: #17171a;
    --ink-soft: #dcd6c9;
    --ink-mid: #a8a396;
    --ink-faded: #7a7568;
    --rule: #2a2a2e;
    --accent: #e8703b;
    --accent-soft: #b85a2e;
    --tier-1: #e8703b;
    --tier-2: #c9a465;
    --tier-3: #8a8578;
    --grain-opacity: 0.15;
    --grain-blend: screen;
    --fp-bg: #1a1a1d;
    --fu-bg: #1a1a1d;
    --paper-warm: #1c1c20;
  }

  .pf-theme-toggle {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 100;
    background: var(--paper-2);
    color: var(--ink);
    border: 1px solid var(--rule);
    border-radius: 999px;
    padding: 9px 16px 9px 14px;
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.06em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
  .pf-theme-toggle:hover {
    background: var(--accent);
    color: var(--paper);
    border-color: var(--accent);
    transform: translateY(-1px);
  }
  .pf-theme-toggle-label {
    text-transform: uppercase;
  }

  .pf-progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: var(--accent);
    z-index: 200;
    transition: width 0.1s linear;
  }

  .pf-backtop {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 100;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--paper);
    border: none;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pf-backtop:hover { transform: translateY(-2px); }

  @media (max-width: 720px) {
    .pf-theme-toggle {
      top: 12px;
      right: 12px;
      padding: 7px 12px 7px 10px;
      font-size: 11px;
    }
    .pf-theme-toggle-label { display: none; }
    .pf-backtop { bottom: 16px; right: 16px; width: 40px; height: 40px; }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body, .pf-root {
    background: var(--paper);
    color: var(--ink);
    font-family: var(--body);
    font-weight: 400;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  .pf-grain {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    opacity: var(--grain-opacity);
    mix-blend-mode: var(--grain-blend);
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .pf-shell {
    position: relative;
    z-index: 2;
    max-width: 1280px;
    margin: 0 auto;
    padding: 56px 48px 120px;
  }

  /* ---------- header ---------- */
  .pf-header {
    border-bottom: 1px solid var(--rule);
    padding-bottom: 32px;
    margin-bottom: 56px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 32px;
    align-items: end;
  }

  .pf-eyebrow {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-faded);
    margin-bottom: 16px;
  }

  .pf-title {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(48px, 7vw, 92px);
    line-height: 0.95;
    letter-spacing: -0.025em;
    color: var(--ink);
    font-variation-settings: 'opsz' 144;
  }

  .pf-title em {
    font-style: italic;
    color: var(--accent);
    font-weight: 300;
  }

  .pf-subtitle {
    font-family: var(--display);
    font-weight: 300;
    font-style: italic;
    font-size: 18px;
    color: var(--ink-mid);
    max-width: 380px;
    line-height: 1.4;
    text-align: right;
  }

  /* ---------- meta strip ---------- */
  .pf-meta {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
    margin-bottom: 72px;
  }

  .pf-meta-cell {
    padding: 24px 24px;
    border-right: 1px solid var(--rule);
  }
  .pf-meta-cell:last-child { border-right: none; }

  .pf-meta-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--ink-faded);
    margin-bottom: 8px;
  }

  .pf-meta-value {
    font-family: var(--display);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--ink);
    line-height: 1;
  }

  /* ---------- filter bar ---------- */
  .pf-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 48px;
  }

  .pf-filter {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.05em;
    padding: 8px 14px;
    border: 1px solid var(--rule);
    background: transparent;
    color: var(--ink-mid);
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: 0;
  }
  .pf-filter:hover { border-color: var(--ink); color: var(--ink); }
  .pf-filter.active {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
  }

  /* ---------- project card ---------- */
  .pf-project {
    border-top: 1px solid var(--rule);
    padding: 56px 0;
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 56px;
  }

  .pf-project:first-of-type { border-top: none; padding-top: 0; }

  .pf-side {
    position: sticky;
    top: 24px;
    align-self: start;
  }

  .pf-side-row {
    margin-bottom: 24px;
  }

  .pf-side-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--ink-faded);
    margin-bottom: 6px;
  }

  .pf-side-value {
    font-family: var(--body);
    font-size: 13px;
    color: var(--ink);
    line-height: 1.5;
  }

  .pf-tier {
    display: inline-block;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 4px 10px;
    color: var(--paper);
    margin-bottom: 16px;
  }
  .pf-tier[data-tier='1'] { background: var(--tier-1); }
  .pf-tier[data-tier='2'] { background: var(--tier-2); }
  .pf-tier[data-tier='3'] { background: var(--tier-3); }

  .pf-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .pf-tag {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--ink-mid);
    padding: 3px 8px;
    border: 1px solid var(--rule);
  }

  /* ---------- project body ---------- */
  .pf-body { min-width: 0; }

  .pf-pid {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.15em;
    color: var(--ink-faded);
    margin-bottom: 8px;
  }

  .pf-pname {
    font-family: var(--display);
    font-weight: 500;
    font-size: clamp(32px, 4vw, 48px);
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin-bottom: 16px;
    color: var(--ink);
  }

  .pf-oneline {
    font-family: var(--display);
    font-style: italic;
    font-weight: 300;
    font-size: 20px;
    line-height: 1.4;
    color: var(--ink-mid);
    margin-bottom: 36px;
    max-width: 70ch;
    border-left: 2px solid var(--accent);
    padding-left: 16px;
  }

  /* headline strip */
  .pf-headline {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1px;
    background: var(--rule);
    border: 1px solid var(--rule);
    margin-bottom: 40px;
  }

  .pf-headline-cell {
    background: var(--paper);
    padding: 16px 18px;
  }

  .pf-headline-label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--ink-faded);
    margin-bottom: 4px;
  }

  .pf-headline-value {
    font-family: var(--display);
    font-weight: 500;
    font-size: 17px;
    color: var(--ink);
    line-height: 1.2;
  }

  /* sections */
  .pf-section { margin-bottom: 36px; }

  .pf-section-head {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 16px;
    cursor: pointer;
    user-select: none;
  }

  .pf-section-num {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--accent);
    letter-spacing: 0.1em;
  }

  .pf-section-title {
    font-family: var(--display);
    font-weight: 500;
    font-size: 18px;
    letter-spacing: -0.01em;
    color: var(--ink);
    flex: 1;
  }

  .pf-section-toggle {
    font-family: var(--mono);
    font-size: 14px;
    color: var(--ink-faded);
    width: 20px;
    text-align: center;
  }

  .pf-prose {
    font-size: 15px;
    line-height: 1.7;
    color: var(--ink-soft);
    max-width: 72ch;
  }

  .pf-prose p { margin-bottom: 14px; }
  .pf-prose p:last-child { margin-bottom: 0; }

  .pf-list {
    list-style: none;
    counter-reset: pf-list;
  }
  .pf-list li {
    counter-increment: pf-list;
    position: relative;
    padding-left: 32px;
    margin-bottom: 12px;
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--ink-soft);
  }
  .pf-list li::before {
    content: counter(pf-list, decimal-leading-zero);
    position: absolute;
    left: 0;
    top: 2px;
    font-family: var(--mono);
    font-size: 10px;
    color: var(--ink-faded);
    letter-spacing: 0.05em;
  }

  /* architecture cards */
  .pf-arch {
    display: grid;
    gap: 12px;
  }

  .pf-arch-item {
    border-left: 2px solid var(--rule);
    padding: 4px 0 4px 20px;
    transition: border-color 0.15s ease;
  }
  .pf-arch-item:hover { border-left-color: var(--accent); }

  .pf-arch-name {
    font-family: var(--display);
    font-weight: 600;
    font-size: 14px;
    color: var(--ink);
    margin-bottom: 4px;
    letter-spacing: -0.005em;
  }

  .pf-arch-detail {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--ink-mid);
  }

  /* impact callouts */
  .pf-impact {
    background: var(--paper-2);
    padding: 24px 28px;
    border-left: 3px solid var(--accent);
  }
  .pf-impact .pf-list li {
    margin-bottom: 8px;
    font-size: 14px;
  }
  .pf-impact .pf-list li::before { color: var(--accent); }

  /* killer answer */
  .pf-killer {
    background: var(--ink);
    color: var(--paper);
    padding: 28px 32px;
    position: relative;
  }
  .pf-killer::before {
    content: '"';
    position: absolute;
    top: 12px;
    left: 16px;
    font-family: var(--display);
    font-size: 80px;
    line-height: 1;
    color: var(--accent);
    opacity: 0.5;
  }
  .pf-killer-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent-soft);
    margin-bottom: 12px;
    margin-left: 40px;
  }
  .pf-killer-text {
    font-family: var(--display);
    font-style: italic;
    font-weight: 300;
    font-size: 17px;
    line-height: 1.55;
    margin-left: 40px;
    color: var(--paper);
  }

  /* grill */
  .pf-grill {
    border-top: 1px solid var(--rule);
    padding-top: 16px;
  }
  .pf-grill-item {
    border-bottom: 1px solid var(--rule);
    padding: 14px 0;
  }
  .pf-grill-q {
    font-family: var(--display);
    font-weight: 500;
    font-size: 14px;
    color: var(--ink);
    margin-bottom: 6px;
    display: flex;
    gap: 8px;
  }
  .pf-grill-q::before {
    content: 'Q.';
    color: var(--accent);
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .pf-grill-a {
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--ink-mid);
    padding-left: 22px;
  }

  /* landmines */
  .pf-landmines {
    background: #fef3ed;
    border: 1px solid var(--accent-soft);
    padding: 20px 24px;
  }
  .pf-landmines .pf-section-title { color: var(--accent); }
  .pf-landmines ul {
    list-style: none;
    margin-top: 8px;
  }
  .pf-landmines li {
    font-size: 13.5px;
    color: var(--ink-soft);
    padding: 6px 0 6px 24px;
    position: relative;
    line-height: 1.5;
  }
  .pf-landmines li::before {
    content: '✕';
    position: absolute;
    left: 0;
    color: var(--accent);
    font-weight: 600;
  }

  .pf-collapsed { display: none; }

  /* footer */
  .pf-footer {
    margin-top: 96px;
    padding-top: 32px;
    border-top: 1px solid var(--rule);
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-faded);
  }

  /* ============================== TABS ============================== */
  .pf-tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--ink);
    margin: 40px 0 48px;
    position: relative;
    align-items: center;
  }
  .pf-kbd-hint {
    margin-left: auto;
    padding-bottom: 8px;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--ink-faded);
    letter-spacing: 0.02em;
  }
  .pf-kbd-hint kbd {
    display: inline-block;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 1px 6px;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--ink-soft);
    margin: 0 1px;
  }
  @media (max-width: 720px) { .pf-kbd-hint { display: none; } }
  .pf-tab {
    background: transparent;
    border: none;
    padding: 18px 28px 16px;
    font-family: var(--serif);
    font-size: 22px;
    font-weight: 500;
    color: var(--ink-faded);
    cursor: pointer;
    position: relative;
    transition: color 0.2s ease;
    letter-spacing: -0.01em;
  }
  .pf-tab em {
    font-style: italic;
    font-weight: 400;
  }
  .pf-tab:hover {
    color: var(--ink);
  }
  .pf-tab.active {
    color: var(--ink);
  }
  .pf-tab.active::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -2px;
    height: 4px;
    background: var(--ink);
  }
  .pf-tab-badge {
    display: inline-block;
    margin-left: 10px;
    padding: 2px 8px;
    background: var(--paper-warm);
    color: var(--accent);
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-radius: 3px;
    vertical-align: middle;
    border: 1px solid var(--rule);
  }
  .pf-tab-badge.hr { color: var(--tier-2); }

  /* ============================== HR ROUND ============================== */
  .pf-hr-shell {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 56px;
    margin-top: 8px;
  }
  .pf-hr-side {
    position: sticky;
    top: 24px;
    align-self: start;
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    padding-right: 8px;
  }
  .pf-hr-cat-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .pf-hr-cat-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: transparent;
    border: none;
    border-left: 2px solid transparent;
    padding: 9px 12px;
    text-align: left;
    font-family: var(--body);
    font-size: 13.5px;
    color: var(--ink-faded);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .pf-hr-cat-item:hover { color: var(--ink); }
  .pf-hr-cat-item.active {
    color: var(--ink);
    border-left-color: var(--accent);
    font-weight: 500;
  }
  .pf-hr-cat-name { min-width: 0; }
  .pf-hr-cat-count {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--accent);
    opacity: 0.7;
    flex-shrink: 0;
  }
  .pf-hr-main { min-width: 0; }
  .pf-hr-header { margin-bottom: 40px; }
  .pf-hr-title {
    font-family: var(--display);
    font-size: 46px;
    font-weight: 400;
    letter-spacing: -0.02em;
    line-height: 1.05;
    color: var(--ink);
    margin: 8px 0 18px;
  }
  .pf-hr-framing {
    font-family: var(--body);
    font-size: 15px;
    line-height: 1.65;
    color: var(--ink-soft);
    max-width: 680px;
    padding: 18px 22px;
    background: var(--fu-bg);
    border: 1px solid var(--rule);
    border-left: 3px solid var(--accent);
    border-radius: 2px;
  }
  .pf-hr-framing strong { color: var(--accent); font-weight: 600; }
  .pf-hr-category { margin-bottom: 40px; }
  .pf-hr-cat-head {
    font-family: var(--mono);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--accent);
    margin-bottom: 18px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--rule);
    font-weight: 600;
  }
  .pf-hr-q {
    border: 1px solid var(--rule);
    border-radius: 4px;
    margin-bottom: 12px;
    background: var(--paper-warm);
    overflow: hidden;
    transition: border-color 0.15s ease;
  }
  .pf-hr-q.open { border-color: var(--accent); }
  .pf-hr-q-head {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    background: transparent;
    border: none;
    padding: 16px 20px;
    text-align: left;
    cursor: pointer;
    font-family: var(--display);
    font-size: 17px;
    font-weight: 500;
    color: var(--ink);
    letter-spacing: -0.005em;
  }
  .pf-hr-q-head:hover { color: var(--accent); }
  .pf-hr-q-chevron {
    font-family: var(--mono);
    font-size: 18px;
    color: var(--accent);
    width: 16px;
    flex-shrink: 0;
  }
  .pf-hr-q-title { flex: 1; min-width: 0; }
  .pf-hr-verify-badge {
    font-family: var(--mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--tier-2);
    border: 1px solid var(--tier-2);
    border-radius: 3px;
    padding: 2px 6px;
    flex-shrink: 0;
    opacity: 0.8;
  }
  .pf-hr-q-body {
    padding: 4px 20px 22px 48px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .pf-hr-principle {
    font-family: var(--body);
    font-size: 13px;
    line-height: 1.55;
    color: var(--ink-mid);
    font-style: italic;
    padding: 10px 14px;
    background: var(--paper);
    border-radius: 3px;
    border: 1px solid var(--rule);
  }
  .pf-hr-principle-label,
  .pf-hr-notes-label {
    display: block;
    font-family: var(--mono);
    font-size: 10px;
    font-style: normal;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent);
    margin-bottom: 6px;
    font-weight: 600;
  }
  .pf-hr-answer {
    font-family: var(--serif);
    font-size: 15.5px;
    line-height: 1.72;
    color: var(--ink);
  }
  .pf-hr-notes {
    font-family: var(--body);
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--ink-mid);
    padding: 12px 14px;
    background: var(--paper);
    border-radius: 3px;
    border-left: 2px solid var(--tier-2);
  }
  .pf-hr-notes-label { color: var(--tier-2); }

  @media (max-width: 900px) {
    .pf-hr-shell { grid-template-columns: 1fr; gap: 28px; }
    .pf-hr-side {
      position: static;
      max-height: none;
      border-bottom: 1px solid var(--rule);
      padding-bottom: 20px;
    }
    .pf-hr-cat-list { flex-direction: row; flex-wrap: wrap; gap: 6px; }
    .pf-hr-cat-item {
      border-left: none;
      border: 1px solid var(--rule);
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 12.5px;
    }
    .pf-hr-cat-item.active {
      border-left: 1px solid var(--accent);
      border-color: var(--accent);
    }
    .pf-hr-title { font-size: 34px; }
    .pf-hr-q-body { padding-left: 20px; }
    .pf-hr-q-head { font-size: 15px; }
  }

  /* ============================== DEEP DIVE ============================== */
  .pf-dd-shell {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 56px;
    margin-top: 8px;
  }
  .pf-dd-side {
    position: sticky;
    top: 32px;
    height: fit-content;
    padding-right: 24px;
    border-right: 1px solid var(--rule);
  }
  .pf-dd-side-label {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--ink-faded);
    margin-bottom: 16px;
  }
  .pf-dd-side-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .pf-dd-side-item {
    background: transparent;
    border: none;
    border-left: 2px solid transparent;
    padding: 10px 14px 10px 14px;
    text-align: left;
    font-family: var(--serif);
    font-size: 15px;
    color: var(--ink-soft);
    cursor: pointer;
    transition: all 0.15s ease;
    line-height: 1.35;
  }
  .pf-dd-side-item:hover {
    color: var(--ink);
    background: var(--paper-warm);
  }
  .pf-dd-side-item.active {
    color: var(--ink);
    background: var(--paper-warm);
    border-left-color: var(--accent);
    font-weight: 500;
  }
  .pf-dd-side-tier {
    display: inline-block;
    width: 18px;
    font-family: var(--mono);
    font-size: 10px;
    color: var(--accent);
    margin-right: 8px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .pf-dd-side-tier.t1 { color: var(--tier-1); }
  .pf-dd-side-tier.t2 { color: var(--tier-2); }
  .pf-dd-side-tier.t3 { color: var(--tier-3); }
  .pf-dd-side-item {
    display: flex;
    align-items: baseline;
  }
  .pf-dd-side-item-title { min-width: 0; }

  /* Search */
  .pf-dd-search-wrap {
    position: relative;
    margin-bottom: 22px;
  }
  .pf-dd-search {
    width: 100%;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: 6px;
    padding: 10px 30px 10px 12px;
    font-family: var(--body);
    font-size: 13px;
    color: var(--ink);
    outline: none;
    transition: border-color 0.15s ease;
  }
  .pf-dd-search::placeholder { color: var(--ink-faded); }
  .pf-dd-search:focus { border-color: var(--accent); }
  .pf-dd-search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--ink-faded);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    padding: 0 4px;
  }
  .pf-dd-search-clear:hover { color: var(--accent); }
  .pf-dd-side-count {
    color: var(--accent);
    margin-left: 4px;
  }
  .pf-dd-side-empty {
    font-family: var(--serif);
    font-size: 13px;
    font-style: italic;
    color: var(--ink-faded);
    padding: 8px 14px;
  }

  /* In-page section rail (scroll-spy) */
  .pf-dd-rail {
    margin-top: 28px;
    padding-top: 22px;
    border-top: 1px solid var(--rule);
  }
  .pf-dd-rail-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .pf-dd-rail-item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: transparent;
    border: none;
    border-left: 2px solid transparent;
    padding: 7px 12px;
    text-align: left;
    font-family: var(--body);
    font-size: 13px;
    color: var(--ink-faded);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .pf-dd-rail-item:hover { color: var(--ink); }
  .pf-dd-rail-item.active {
    color: var(--ink);
    border-left-color: var(--accent);
    font-weight: 500;
  }
  .pf-dd-rail-num {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--accent);
    opacity: 0.7;
  }
  .pf-dd-rail-item.active .pf-dd-rail-num { opacity: 1; }

  /* Quick-jump chips */
  .pf-dd-chips {
    display: none;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 20px;
  }
  .pf-dd-chip {
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: 999px;
    padding: 5px 12px;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.02em;
    color: var(--ink-soft);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .pf-dd-chip:hover {
    background: var(--accent);
    color: var(--paper);
    border-color: var(--accent);
  }

  /* Collapsible section head */
  .pf-dd-section-head-toggle {
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .pf-dd-section-head-toggle:hover .pf-dd-section-title { color: var(--accent); }
  .pf-dd-collapse-chevron {
    margin-left: auto;
    font-size: 14px;
    color: var(--ink-faded);
    transition: transform 0.2s ease;
  }
  .pf-dd-collapse-chevron.closed { transform: rotate(-90deg); }

  /* Prev / next pager */
  .pf-dd-pager {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 56px;
    padding-top: 32px;
    border-top: 1px solid var(--rule);
  }
  .pf-dd-pager-btn {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: 8px;
    padding: 16px 20px;
    cursor: pointer;
    transition: all 0.18s ease;
    text-align: left;
  }
  .pf-dd-pager-btn.next { text-align: right; align-items: flex-end; }
  .pf-dd-pager-btn:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
  .pf-dd-pager-dir {
    font-family: var(--mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent);
  }
  .pf-dd-pager-title {
    font-family: var(--serif);
    font-size: 16px;
    color: var(--ink);
    line-height: 1.3;
  }

  .pf-dd-main {
    min-width: 0;
  }
  .pf-dd-header {
    margin-bottom: 40px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--rule);
  }
  .pf-dd-eyebrow {
    font-family: var(--mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--ink-faded);
    margin-bottom: 12px;
  }
  .pf-dd-title {
    font-family: var(--serif);
    font-size: 42px;
    font-weight: 500;
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin: 0 0 18px;
    color: var(--ink);
  }
  .pf-dd-framing {
    font-family: var(--serif);
    font-size: 17px;
    line-height: 1.55;
    color: var(--ink-soft);
    font-style: italic;
    font-weight: 400;
    border-left: 3px solid var(--accent);
    padding: 8px 0 8px 20px;
    margin-top: 18px;
  }

  .pf-dd-section {
    margin-bottom: 52px;
  }
  .pf-dd-section-head {
    display: flex;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 1px dashed var(--rule);
  }
  .pf-dd-section-num {
    font-family: var(--mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--accent);
    font-weight: 600;
  }
  .pf-dd-section-title {
    font-family: var(--serif);
    font-size: 24px;
    font-weight: 500;
    color: var(--ink);
    margin: 0;
    letter-spacing: -0.01em;
  }
  .pf-dd-section-title em {
    font-style: italic;
    font-weight: 400;
  }

  /* Decisions */
  .pf-dd-decisions {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .pf-dd-decision {
    padding: 24px 26px;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: 4px;
  }
  .pf-dd-decision-q {
    font-family: var(--serif);
    font-size: 18px;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 16px;
    line-height: 1.35;
    letter-spacing: -0.005em;
  }
  .pf-dd-options {
    margin: 0 0 18px;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
  }
  .pf-dd-option {
    padding: 10px 0 10px 24px;
    position: relative;
    font-size: 14px;
    line-height: 1.5;
    color: var(--ink-soft);
    border-bottom: 1px dotted var(--rule);
  }
  .pf-dd-option:last-child { border-bottom: none; }
  .pf-dd-option::before {
    content: '○';
    position: absolute;
    left: 4px;
    color: var(--ink-faded);
    font-size: 10px;
    top: 14px;
  }
  .pf-dd-decision-row {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 14px;
    padding: 8px 0;
    align-items: baseline;
    border-bottom: 1px dotted var(--rule);
  }
  .pf-dd-decision-row:last-child { border-bottom: none; }
  .pf-dd-decision-label {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-faded);
    font-weight: 600;
  }
  .pf-dd-decision-label.chosen { color: var(--accent); }
  .pf-dd-decision-value {
    font-family: var(--serif);
    font-size: 14px;
    line-height: 1.55;
    color: var(--ink);
  }
  .pf-dd-decision-value.chosen {
    font-weight: 500;
    color: var(--accent);
  }
  .pf-dd-decision-value.tradeoff { color: var(--ink-soft); font-style: italic; }

  /* Algorithms */
  .pf-dd-algos {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .pf-dd-algo {
    padding: 20px 22px;
    border-left: 3px solid var(--accent);
    background: var(--paper-warm);
  }
  .pf-dd-algo-name {
    font-family: var(--mono);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 10px;
  }
  .pf-dd-algo-desc {
    font-family: var(--serif);
    font-size: 14px;
    line-height: 1.6;
    color: var(--ink);
    margin-bottom: 12px;
  }
  .pf-dd-algo-meta {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 12px;
    font-size: 13px;
    line-height: 1.55;
    padding-top: 10px;
    border-top: 1px dashed var(--rule);
  }
  .pf-dd-algo-meta-label {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-faded);
    padding-top: 2px;
  }
  .pf-dd-algo-meta-value {
    color: var(--ink-soft);
  }

  /* Numbers */
  .pf-dd-numbers {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
    background: var(--rule);
    border: 1px solid var(--rule);
  }
  .pf-dd-number {
    background: var(--paper);
    padding: 18px 20px;
  }
  .pf-dd-number-metric {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-faded);
    margin-bottom: 8px;
    font-weight: 600;
  }
  .pf-dd-number-value {
    font-family: var(--serif);
    font-size: 26px;
    font-weight: 500;
    color: var(--ink);
    letter-spacing: -0.01em;
    margin-bottom: 6px;
    line-height: 1.1;
  }
  .pf-dd-number-note {
    font-family: var(--serif);
    font-size: 12px;
    line-height: 1.5;
    color: var(--ink-soft);
    font-style: italic;
  }

  /* War stories */
  .pf-dd-stories {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .pf-dd-story {
    padding-left: 24px;
    border-left: 2px solid var(--rule);
    position: relative;
  }
  .pf-dd-story::before {
    content: '✖';
    position: absolute;
    left: -10px;
    top: 0;
    width: 18px;
    height: 18px;
    background: var(--paper);
    color: var(--accent);
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pf-dd-story-scenario {
    font-family: var(--serif);
    font-size: 18px;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 14px;
    letter-spacing: -0.005em;
    line-height: 1.3;
  }
  .pf-dd-story-row {
    display: grid;
    grid-template-columns: 130px 1fr;
    gap: 14px;
    padding: 10px 0;
    border-bottom: 1px dotted var(--rule);
    align-items: baseline;
  }
  .pf-dd-story-row:last-child { border-bottom: none; }
  .pf-dd-story-label {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-faded);
    font-weight: 600;
  }
  .pf-dd-story-label.lesson { color: var(--accent); }
  .pf-dd-story-value {
    font-family: var(--serif);
    font-size: 14px;
    line-height: 1.6;
    color: var(--ink);
  }
  .pf-dd-story-value.lesson {
    font-style: italic;
    color: var(--accent);
  }

  /* Edge cases */
  .pf-dd-edges {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
  }
  .pf-dd-edge {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 2fr;
    gap: 24px;
    padding: 16px 0;
    border-bottom: 1px dotted var(--rule);
    align-items: baseline;
  }
  .pf-dd-edge:last-child { border-bottom: none; }
  .pf-dd-edge-case {
    font-family: var(--serif);
    font-size: 14px;
    font-weight: 500;
    color: var(--ink);
    line-height: 1.4;
  }
  .pf-dd-edge-handling {
    font-family: var(--serif);
    font-size: 14px;
    line-height: 1.6;
    color: var(--ink-soft);
  }

  /* Would-change retrospective */
  .pf-dd-retro {
    padding: 24px 28px;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-left: 3px solid var(--accent);
    font-family: var(--serif);
    font-size: 15px;
    line-height: 1.65;
    color: var(--ink);
    font-style: italic;
  }

  /* Chains */
  .pf-dd-chains {
    display: flex;
    flex-direction: column;
    gap: 36px;
  }
  .pf-dd-chain {
    padding: 24px 28px;
    background: var(--ink);
    color: var(--paper);
    border-radius: 4px;
  }
  .pf-dd-chain-title {
    font-family: var(--mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--accent);
    margin-bottom: 22px;
    font-weight: 600;
  }
  .pf-dd-chain-steps {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .pf-dd-chain-step {
    display: flex;
    gap: 18px;
    padding: 14px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .pf-dd-chain-step:last-child { border-bottom: none; }
  .pf-dd-chain-num {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
  }
  .pf-dd-chain-qa {
    flex: 1;
  }
  .pf-dd-chain-q {
    font-family: var(--serif);
    font-size: 15px;
    font-weight: 500;
    color: var(--paper);
    margin-bottom: 8px;
    line-height: 1.4;
    letter-spacing: -0.005em;
  }
  .pf-dd-chain-a {
    font-family: var(--serif);
    font-size: 14px;
    line-height: 1.6;
    color: rgba(248, 244, 235, 0.78);
    padding-left: 14px;
    border-left: 2px solid var(--accent);
  }

  /* First principles */
  .pf-dd-fp-section .pf-dd-section-title em {
    color: var(--accent);
  }
  .pf-dd-fp {
    display: flex;
    flex-direction: column;
    gap: 20px;
    background: var(--fp-bg);
    border: 1px solid var(--rule);
    padding: 28px 32px;
    border-radius: 2px;
    position: relative;
  }
  .pf-dd-fp::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--accent);
  }
  .pf-dd-fp-block {}
  .pf-dd-fp-label {
    font-family: var(--mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent);
    margin-bottom: 10px;
    font-weight: 600;
  }
  .pf-dd-fp-reduction-text {
    font-family: var(--display);
    font-size: 22px;
    font-style: italic;
    line-height: 1.4;
    color: var(--ink);
    font-weight: 400;
    letter-spacing: -0.01em;
  }
  .pf-dd-fp-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pf-dd-fp-item {
    font-family: var(--body);
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--ink-soft);
    padding-left: 20px;
    position: relative;
  }
  .pf-dd-fp-item::before {
    content: '─';
    position: absolute;
    left: 0;
    color: var(--accent);
    font-family: var(--mono);
  }
  .pf-dd-fp-tensions .pf-dd-fp-item::before {
    content: '⇄';
  }
  .pf-dd-fp-synthesis {
    padding-top: 16px;
    border-top: 1px dashed var(--rule);
  }
  .pf-dd-fp-synthesis-text {
    font-family: var(--display);
    font-size: 17px;
    line-height: 1.6;
    color: var(--ink);
    font-weight: 400;
    letter-spacing: -0.005em;
  }

  /* Follow-ups */
  .pf-dd-fu-section .pf-dd-section-title em {
    color: var(--accent);
  }
  .pf-dd-fu {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .pf-dd-fu-block {
    background: var(--fu-bg);
    border: 1px solid var(--rule);
    border-radius: 2px;
    padding: 24px 28px;
  }
  .pf-dd-fu-cat {
    font-family: var(--mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--accent);
    margin-bottom: 18px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--rule);
    font-weight: 600;
  }
  .pf-dd-fu-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .pf-dd-fu-item {
    display: grid;
    gap: 6px;
  }
  .pf-dd-fu-q {
    font-family: var(--display);
    font-size: 16px;
    font-weight: 500;
    color: var(--ink);
    line-height: 1.4;
    letter-spacing: -0.005em;
  }
  .pf-dd-fu-q::before {
    content: 'Q · ';
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--accent);
    letter-spacing: 0.06em;
    margin-right: 4px;
    vertical-align: middle;
  }
  .pf-dd-fu-a {
    font-family: var(--body);
    font-size: 14px;
    line-height: 1.65;
    color: var(--ink-soft);
    padding-left: 14px;
    border-left: 2px solid var(--ink-faded);
  }

  /* Dark mode adjustments for pre-existing sections */
  [data-theme="dark"] .pf-dd-numbers { background: transparent; }
  [data-theme="dark"] .pf-dd-number { background: var(--paper-2); border-color: var(--rule); }
  [data-theme="dark"] .pf-dd-decision { background: var(--paper-2); border-color: var(--rule); }
  [data-theme="dark"] .pf-dd-algo { background: var(--paper-2); border-color: var(--rule); }
  [data-theme="dark"] .pf-dd-story { background: var(--paper-2); border-color: var(--rule); }
  [data-theme="dark"] .pf-dd-edge { background: var(--paper-2); border-color: var(--rule); }
  [data-theme="dark"] .pf-project { background: transparent; }
  [data-theme="dark"] .pf-project-body { border-color: var(--rule); }
  [data-theme="dark"] .pf-project-side { border-color: var(--rule); }
  [data-theme="dark"] .pf-meta-cell { border-color: var(--rule); }
  [data-theme="dark"] .pf-tab { color: var(--ink-mid); }
  [data-theme="dark"] .pf-tab.active { color: var(--ink); }
  [data-theme="dark"] .pf-header { border-color: var(--rule); }
  [data-theme="dark"] .pf-filter { color: var(--ink-mid); border-color: var(--rule); background: transparent; }
  [data-theme="dark"] .pf-filter.active { background: var(--accent); color: var(--paper); border-color: var(--accent); }
  [data-theme="dark"] .pf-dd-side { border-color: var(--rule); }
  [data-theme="dark"] .pf-dd-side-item { color: var(--ink-mid); }
  [data-theme="dark"] .pf-dd-side-item.active { color: var(--ink); }

  /* responsive */
  @media (max-width: 900px) {
    .pf-shell { padding: 32px 24px 80px; }
    .pf-header { grid-template-columns: 1fr; gap: 16px; }
    .pf-subtitle { text-align: left; }
    .pf-meta { grid-template-columns: repeat(2, 1fr); }
    .pf-meta-cell { border-right: none; border-bottom: 1px solid var(--rule); }
    .pf-meta-cell:nth-child(odd) { border-right: 1px solid var(--rule); }
    .pf-project { grid-template-columns: 1fr; gap: 24px; }
    .pf-side { position: static; }
    .pf-dd-shell { grid-template-columns: 1fr; gap: 32px; }
    .pf-dd-side { position: static; border-right: none; border-bottom: 1px solid var(--rule); padding-right: 0; padding-bottom: 24px; }
    .pf-dd-side-list { flex-direction: row; flex-wrap: wrap; gap: 6px; }
    .pf-dd-side-item { border-left: none; border-bottom: 2px solid transparent; padding: 8px 12px; font-size: 13px; }
    .pf-dd-side-item.active { border-left-color: transparent; border-bottom-color: var(--accent); }
    .pf-dd-title { font-size: 32px; }
    .pf-dd-numbers { grid-template-columns: 1fr; }
    .pf-dd-decision-row, .pf-dd-story-row { grid-template-columns: 1fr; gap: 4px; }
    .pf-dd-edge { grid-template-columns: 1fr; gap: 6px; }
    .pf-dd-algo-meta { grid-template-columns: 1fr; gap: 4px; }
    .pf-tab { padding: 14px 16px 12px; font-size: 18px; }
    .pf-dd-fp { padding: 20px 22px; }
    .pf-dd-fp-reduction-text { font-size: 18px; }
    .pf-dd-fu-block { padding: 18px 20px; }
    .pf-dd-fu-q { font-size: 15px; }
    .pf-dd-rail { display: none; }
    .pf-dd-chips { display: flex; }
    .pf-dd-pager { grid-template-columns: 1fr; }
    .pf-dd-pager-btn.next { text-align: left; align-items: flex-start; }
    .pf-dd-search-wrap { max-width: 100%; }
    .pf-dd-side-item-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 220px;
    }
  }
`;

/* ============================================================================
 * COMPONENTS
 * ========================================================================== */

const Section = ({ num, title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pf-section">
      <div className="pf-section-head" onClick={() => setOpen(!open)}>
        <span className="pf-section-num">{num}</span>
        <h3 className="pf-section-title">{title}</h3>
        <span className="pf-section-toggle">{open ? '−' : '+'}</span>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
};

const Project = ({ project, index }) => {
  const idx = String(index + 1).padStart(2, '0');
  return (
    <article className="pf-project">
      <aside className="pf-side">
        <span className="pf-tier" data-tier={project.tier}>
          {TIER_LABELS[project.tier]}
        </span>

        <div className="pf-side-row">
          <div className="pf-side-label">Year</div>
          <div className="pf-side-value">{project.year}</div>
        </div>
        <div className="pf-side-row">
          <div className="pf-side-label">Context</div>
          <div className="pf-side-value">{project.company}</div>
        </div>
        <div className="pf-side-row">
          <div className="pf-side-label">Role</div>
          <div className="pf-side-value">{project.role}</div>
        </div>
        <div className="pf-side-row">
          <div className="pf-side-label">Domains</div>
          <div className="pf-tags">
            {project.tags.map((t) => (
              <span key={t} className="pf-tag">{t}</span>
            ))}
          </div>
        </div>
      </aside>

      <div className="pf-body">
        <div className="pf-pid">Project · {idx}</div>
        <h2 className="pf-pname">{project.title}</h2>
        <p className="pf-oneline">{project.oneLine}</p>

        <div className="pf-headline">
          {Object.entries(project.headline).map(([k, v]) => (
            <div key={k} className="pf-headline-cell">
              <div className="pf-headline-label">{k}</div>
              <div className="pf-headline-value">{v}</div>
            </div>
          ))}
        </div>

        <Section num="§ 01" title="Narrative — the 90-second story">
          <div className="pf-prose">
            {project.narrative.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Section>

        <Section num="§ 02" title="Problem">
          <ol className="pf-list">
            {project.problem.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </Section>

        <Section num="§ 03" title="Architecture & technical depth" defaultOpen={false}>
          <div className="pf-arch">
            {project.architecture.map((a, i) => (
              <div key={i} className="pf-arch-item">
                <div className="pf-arch-name">{a.name}</div>
                <div className="pf-arch-detail">{a.detail}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section num="§ 04" title="Impact">
          <div className="pf-impact">
            <ol className="pf-list">
              {project.impact.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
          </div>
        </Section>

        <Section num="§ 05" title="The killer answer">
          <div className="pf-killer">
            <div className="pf-killer-label">When asked: what was the hardest part?</div>
            <div className="pf-killer-text">{project.killerAnswer}</div>
          </div>
        </Section>

        <Section num="§ 06" title="Grill questions & answers" defaultOpen={false}>
          <div className="pf-grill">
            {project.grillQuestions.map((g, i) => (
              <div key={i} className="pf-grill-item">
                <div className="pf-grill-q">{g.q}</div>
                <div className="pf-grill-a">{g.a}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section num="§ 07" title="Positioning landmines">
          <div className="pf-landmines">
            <ul>
              {project.landmines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        </Section>
      </div>
    </article>
  );
};

/* ============================================================================
 * DEEP DIVE
 * ========================================================================== */

const DeepDive = ({ projects, selectedId, onSelect }) => {
  const dd = DEEP_DIVES[selectedId];
  const project = projects.find((p) => p.id === selectedId);
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState('fp');
  const [collapsed, setCollapsed] = useState({});
  const mainRef = useRef(null);

  // Which sections actually exist for this project (drives nav rail + scroll-spy)
  const sections = useMemo(() => {
    if (!dd) return [];
    const list = [];
    if (dd.firstPrinciples) list.push({ id: 'fp', num: '00', label: 'First principles' });
    if (dd.decisions?.length) list.push({ id: 'decisions', num: '01', label: 'Decisions' });
    if (dd.algorithms?.length) list.push({ id: 'algorithms', num: '02', label: 'Algorithms' });
    if (dd.numbers?.length) list.push({ id: 'numbers', num: '03', label: 'Numbers' });
    if (dd.warStories?.length) list.push({ id: 'failures', num: '04', label: 'Failure modes' });
    if (dd.edgeCases?.length) list.push({ id: 'edges', num: '05', label: 'Edge cases' });
    if (dd.whatIWouldChange) list.push({ id: 'retro', num: '06', label: 'Retro' });
    if (dd.chains?.length) list.push({ id: 'chains', num: '07', label: 'Chains' });
    if (dd.followUps) list.push({ id: 'followups', num: '08', label: 'Follow-ups' });
    return list;
  }, [dd]);

  // Reset to top section when project changes
  useEffect(() => {
    setActiveSection(sections[0]?.id || 'fp');
    setCollapsed({});
    if (mainRef.current) {
      const top = mainRef.current.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'auto' });
    }
  }, [selectedId]); // eslint-disable-line

  // Scroll-spy: highlight the section currently in view
  useEffect(() => {
    const handler = () => {
      let current = sections[0]?.id;
      for (const s of sections) {
        const el = document.getElementById(`sec-${s.id}`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top < 160) current = s.id;
      }
      if (current) setActiveSection(current);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, [sections]);

  const jumpTo = (id) => {
    const el = document.getElementById(`sec-${id}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const idx = projects.findIndex((p) => p.id === selectedId);
  const prev = projects[idx - 1];
  const next = projects[idx + 1];

  const toggle = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const q = query.trim().toLowerCase();
  const filteredProjects = q
    ? projects.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          (DEEP_DIVES[p.id]?.framing || '').toLowerCase().includes(q)
      )
    : projects;

  if (!dd || !project) {
    return (
      <div style={{ padding: '40px 0', fontFamily: 'var(--serif)', color: 'var(--ink-soft)' }}>
        No deep dive available for this project yet.
      </div>
    );
  }

  const SectionHead = ({ id, num, title, em }) => (
    <div
      className="pf-dd-section-head pf-dd-section-head-toggle"
      onClick={() => toggle(id)}
      role="button"
      tabIndex={0}
    >
      <span className="pf-dd-section-num">§ {num}</span>
      <h3 className="pf-dd-section-title">
        {title} {em && <em>{em}</em>}
      </h3>
      <span className={`pf-dd-collapse-chevron ${collapsed[id] ? 'closed' : ''}`}>▾</span>
    </div>
  );

  return (
    <div className="pf-dd-shell">
      {/* Sidebar: search + project list + section rail */}
      <aside className="pf-dd-side">
        <div className="pf-dd-search-wrap">
          <input
            className="pf-dd-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
          />
          {query && (
            <button className="pf-dd-search-clear" onClick={() => setQuery('')} aria-label="Clear">
              ×
            </button>
          )}
        </div>

        <div className="pf-dd-side-label">
          Projects <span className="pf-dd-side-count">{filteredProjects.length}</span>
        </div>
        <div className="pf-dd-side-list">
          {filteredProjects.map((p) => (
            <button
              key={p.id}
              className={`pf-dd-side-item ${p.id === selectedId ? 'active' : ''}`}
              onClick={() => onSelect(p.id)}
            >
              <span className={`pf-dd-side-tier t${p.tier}`}>T{p.tier}</span>
              <span className="pf-dd-side-item-title">{p.title}</span>
            </button>
          ))}
          {filteredProjects.length === 0 && (
            <div className="pf-dd-side-empty">No match for “{query}”.</div>
          )}
        </div>

        {/* In-page section rail (scroll-spy) */}
        <div className="pf-dd-rail">
          <div className="pf-dd-side-label">On this page</div>
          <div className="pf-dd-rail-list">
            {sections.map((s) => (
              <button
                key={s.id}
                className={`pf-dd-rail-item ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => jumpTo(s.id)}
              >
                <span className="pf-dd-rail-num">{s.num}</span>
                <span className="pf-dd-rail-label">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="pf-dd-main" ref={mainRef}>
        {/* Header */}
        <div className="pf-dd-header">
          <div className="pf-dd-eyebrow">
            {project.company} · {TIER_LABELS[project.tier]}
          </div>
          <h2 className="pf-dd-title">{project.title}</h2>
          <div className="pf-dd-framing">{dd.framing}</div>

          {/* Quick jump chips (mobile-friendly) */}
          <div className="pf-dd-chips">
            {sections.map((s) => (
              <button key={s.id} className="pf-dd-chip" onClick={() => jumpTo(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* First principles */}
        {dd.firstPrinciples && (
          <section className="pf-dd-section pf-dd-fp-section" id="sec-fp">
            <SectionHead id="fp" num="00" title="First principles" em="— reason from here" />
            {!collapsed.fp && (
            <div className="pf-dd-fp">
              {dd.firstPrinciples.reduction && (
                <div className="pf-dd-fp-block pf-dd-fp-reduction">
                  <div className="pf-dd-fp-label">The problem, reduced</div>
                  <div className="pf-dd-fp-reduction-text">
                    "{dd.firstPrinciples.reduction}"
                  </div>
                </div>
              )}
              {dd.firstPrinciples.invariants && dd.firstPrinciples.invariants.length > 0 && (
                <div className="pf-dd-fp-block">
                  <div className="pf-dd-fp-label">Invariants — things that MUST hold</div>
                  <ul className="pf-dd-fp-list">
                    {dd.firstPrinciples.invariants.map((inv, i) => (
                      <li key={i} className="pf-dd-fp-item">{inv}</li>
                    ))}
                  </ul>
                </div>
              )}
              {dd.firstPrinciples.tensions && dd.firstPrinciples.tensions.length > 0 && (
                <div className="pf-dd-fp-block">
                  <div className="pf-dd-fp-label">Tensions — competing forces</div>
                  <ul className="pf-dd-fp-list pf-dd-fp-tensions">
                    {dd.firstPrinciples.tensions.map((t, i) => (
                      <li key={i} className="pf-dd-fp-item">{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {dd.firstPrinciples.synthesis && (
                <div className="pf-dd-fp-block pf-dd-fp-synthesis">
                  <div className="pf-dd-fp-label">Synthesis — how the solution follows</div>
                  <div className="pf-dd-fp-synthesis-text">
                    {dd.firstPrinciples.synthesis}
                  </div>
                </div>
              )}
            </div>
            )}
          </section>
        )}

        {/* Decisions */}
        {dd.decisions && dd.decisions.length > 0 && (
          <section className="pf-dd-section" id="sec-decisions">
            <SectionHead id="decisions" num="01" title="Decisions" em="— with the tradeoff stated" />
            {!collapsed.decisions && (
            <div className="pf-dd-decisions">
              {dd.decisions.map((d, i) => (
                <div key={i} className="pf-dd-decision">
                  <div className="pf-dd-decision-q">{d.q}</div>
                  {d.options && d.options.length > 0 && (
                    <ul className="pf-dd-options">
                      {d.options.map((o, j) => (
                        <li key={j} className="pf-dd-option">{o}</li>
                      ))}
                    </ul>
                  )}
                  <div className="pf-dd-decision-row">
                    <div className="pf-dd-decision-label chosen">Chosen</div>
                    <div className="pf-dd-decision-value chosen">{d.chosen}</div>
                  </div>
                  <div className="pf-dd-decision-row">
                    <div className="pf-dd-decision-label">Why</div>
                    <div className="pf-dd-decision-value">{d.why}</div>
                  </div>
                  <div className="pf-dd-decision-row">
                    <div className="pf-dd-decision-label">Tradeoff</div>
                    <div className="pf-dd-decision-value tradeoff">{d.tradeoff}</div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* Algorithms */}
        {dd.algorithms && dd.algorithms.length > 0 && (
          <section className="pf-dd-section" id="sec-algorithms">
            <SectionHead id="algorithms" num="02" title="Algorithms" em="& data structures" />
            {!collapsed.algorithms && (
            <div className="pf-dd-algos">
              {dd.algorithms.map((a, i) => (
                <div key={i} className="pf-dd-algo">
                  <div className="pf-dd-algo-name">{a.name}</div>
                  <div className="pf-dd-algo-desc">{a.description}</div>
                  <div className="pf-dd-algo-meta">
                    <div className="pf-dd-algo-meta-label">Complexity</div>
                    <div className="pf-dd-algo-meta-value">{a.complexity}</div>
                    <div className="pf-dd-algo-meta-label">Why</div>
                    <div className="pf-dd-algo-meta-value">{a.why}</div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* Numbers */}
        {dd.numbers && dd.numbers.length > 0 && (
          <section className="pf-dd-section" id="sec-numbers">
            <SectionHead id="numbers" num="03" title="Numbers" em="worth memorizing" />
            {!collapsed.numbers && (
            <div className="pf-dd-numbers">
              {dd.numbers.map((n, i) => (
                <div key={i} className="pf-dd-number">
                  <div className="pf-dd-number-metric">{n.metric}</div>
                  <div className="pf-dd-number-value">{n.value}</div>
                  <div className="pf-dd-number-note">{n.note}</div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* Failure modes designed for */}
        {dd.warStories && dd.warStories.length > 0 && (
          <section className="pf-dd-section" id="sec-failures">
            <SectionHead id="failures" num="04" title="Failure modes" em="designed for" />
            {!collapsed.failures && (
            <div className="pf-dd-stories">
              {dd.warStories.map((s, i) => (
                <div key={i} className="pf-dd-story">
                  <div className="pf-dd-story-scenario">{s.scenario}</div>
                  <div className="pf-dd-story-row">
                    <div className="pf-dd-story-label">Risk</div>
                    <div className="pf-dd-story-value">{s.whatHappened}</div>
                  </div>
                  <div className="pf-dd-story-row">
                    <div className="pf-dd-story-label">Designed mitigation</div>
                    <div className="pf-dd-story-value">{s.howResolved}</div>
                  </div>
                  <div className="pf-dd-story-row">
                    <div className="pf-dd-story-label lesson">Principle</div>
                    <div className="pf-dd-story-value lesson">{s.lesson}</div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* Edge cases */}
        {dd.edgeCases && dd.edgeCases.length > 0 && (
          <section className="pf-dd-section" id="sec-edges">
            <SectionHead id="edges" num="05" title="Edge cases" em="& their handling" />
            {!collapsed.edges && (
            <div className="pf-dd-edges">
              {dd.edgeCases.map((e, i) => (
                <div key={i} className="pf-dd-edge">
                  <div className="pf-dd-edge-case">{e.case}</div>
                  <div className="pf-dd-edge-handling">{e.handling}</div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* What I'd change */}
        {dd.whatIWouldChange && (
          <section className="pf-dd-section" id="sec-retro">
            <SectionHead id="retro" num="06" title="What I'd change" em="looking back" />
            {!collapsed.retro && <div className="pf-dd-retro">{dd.whatIWouldChange}</div>}
          </section>
        )}

        {/* Interviewer chains */}
        {dd.chains && dd.chains.length > 0 && (
          <section className="pf-dd-section" id="sec-chains">
            <SectionHead id="chains" num="07" title="Interviewer chains" em="— Q → A → but-why → A" />
            {!collapsed.chains && (
            <div className="pf-dd-chains">
              {dd.chains.map((c, i) => (
                <div key={i} className="pf-dd-chain">
                  <div className="pf-dd-chain-title">{c.title}</div>
                  <div className="pf-dd-chain-steps">
                    {c.steps.map((s, j) => (
                      <div key={j} className="pf-dd-chain-step">
                        <div className="pf-dd-chain-num">{j + 1}</div>
                        <div className="pf-dd-chain-qa">
                          <div className="pf-dd-chain-q">{s.q}</div>
                          <div className="pf-dd-chain-a">{s.a}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* Thoughtful follow-ups */}
        {dd.followUps && (
          <section className="pf-dd-section pf-dd-fu-section" id="sec-followups">
            <SectionHead id="followups" num="08" title="Thoughtful follow-ups" em="— what they will push on" />
            {!collapsed.followups && (
            <div className="pf-dd-fu">
              {Object.entries(dd.followUps).map(([category, questions]) => (
                <div key={category} className="pf-dd-fu-block">
                  <div className="pf-dd-fu-cat">
                    {category.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()}
                  </div>
                  <div className="pf-dd-fu-list">
                    {questions.map((qa, i) => (
                      <div key={i} className="pf-dd-fu-item">
                        <div className="pf-dd-fu-q">{qa.q}</div>
                        <div className="pf-dd-fu-a">{qa.a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* Prev / Next project navigation */}
        <div className="pf-dd-pager">
          {prev ? (
            <button className="pf-dd-pager-btn prev" onClick={() => onSelect(prev.id)}>
              <span className="pf-dd-pager-dir">← Previous</span>
              <span className="pf-dd-pager-title">{prev.title}</span>
            </button>
          ) : <span />}
          {next ? (
            <button className="pf-dd-pager-btn next" onClick={() => onSelect(next.id)}>
              <span className="pf-dd-pager-dir">Next →</span>
              <span className="pf-dd-pager-title">{next.title}</span>
            </button>
          ) : <span />}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * HR QUESTIONS COMPONENT
 * ========================================================================== */

const HRQuestions = () => {
  const [activeCategory, setActiveCategory] = useState(HR_QUESTIONS[0].category);
  const [openQ, setOpenQ] = useState({});
  const [query, setQuery] = useState('');

  const toggle = (key) => setOpenQ((s) => ({ ...s, [key]: !s[key] }));

  const q = query.trim().toLowerCase();
  const categoriesToShow = q
    ? HR_QUESTIONS.map((c) => ({
        ...c,
        questions: c.questions.filter(
          (item) =>
            item.q.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q) ||
            (item.principle || '').toLowerCase().includes(q)
        ),
      })).filter((c) => c.questions.length > 0)
    : HR_QUESTIONS;

  const active = q
    ? null
    : HR_QUESTIONS.find((c) => c.category === activeCategory);

  const jumpCategory = (cat) => {
    setActiveCategory(cat);
    setQuery('');
    const el = document.getElementById('hr-main');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const renderQuestion = (item, key) => {
    const isOpen = !!openQ[key];
    const hasVerify = item.answer.includes('[VERIFY') || (item.notes || '').includes('VERIFY');
    return (
      <div key={key} className={`pf-hr-q ${isOpen ? 'open' : ''}`}>
        <button className="pf-hr-q-head" onClick={() => toggle(key)}>
          <span className="pf-hr-q-chevron">{isOpen ? '−' : '+'}</span>
          <span className="pf-hr-q-title">{item.q}</span>
          {hasVerify && <span className="pf-hr-verify-badge">verify</span>}
        </button>
        {isOpen && (
          <div className="pf-hr-q-body">
            {item.principle && (
              <div className="pf-hr-principle">
                <span className="pf-hr-principle-label">Strategy</span>
                {item.principle}
              </div>
            )}
            <div className="pf-hr-answer">{item.answer}</div>
            {item.notes && (
              <div className="pf-hr-notes">
                <span className="pf-hr-notes-label">Delivery notes</span>
                {item.notes}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pf-hr-shell">
      {/* Sidebar: search + category nav */}
      <aside className="pf-hr-side">
        <div className="pf-dd-search-wrap">
          <input
            className="pf-dd-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
          />
          {query && (
            <button className="pf-dd-search-clear" onClick={() => setQuery('')} aria-label="Clear">
              ×
            </button>
          )}
        </div>
        <div className="pf-dd-side-label">Categories</div>
        <div className="pf-hr-cat-list">
          {HR_QUESTIONS.map((c) => (
            <button
              key={c.category}
              className={`pf-hr-cat-item ${!q && activeCategory === c.category ? 'active' : ''}`}
              onClick={() => jumpCategory(c.category)}
            >
              <span className="pf-hr-cat-name">{c.category}</span>
              <span className="pf-hr-cat-count">{c.questions.length}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="pf-hr-main" id="hr-main">
        <div className="pf-hr-header">
          <div className="pf-dd-eyebrow">Behavioral / HR Round · STAR-structured</div>
          <h2 className="pf-hr-title">Famous Questions</h2>
          <div className="pf-hr-framing">
            Answers grounded in your real projects. Situations are real; the{' '}
            <strong>[verify]</strong> markers flag specifics — numbers, quotes, names — to swap
            for your actual memory before you say them. An interviewer probes a made-up detail
            in two follow-ups, so keep the spine and make the specifics true.
          </div>
        </div>

        {q ? (
          categoriesToShow.length > 0 ? (
            categoriesToShow.map((c) => (
              <section key={c.category} className="pf-hr-category">
                <div className="pf-hr-cat-head">{c.category}</div>
                {c.questions.map((item, i) => renderQuestion(item, `${c.category}-${i}`))}
              </section>
            ))
          ) : (
            <div className="pf-dd-side-empty">No question matches “{query}”.</div>
          )
        ) : (
          active && (
            <section className="pf-hr-category">
              <div className="pf-hr-cat-head">{active.category}</div>
              {active.questions.map((item, i) => renderQuestion(item, `${active.category}-${i}`))}
            </section>
          )
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * ROOT
 * ========================================================================== */

const Projects = () => {
  const [view, setView] = useState('overview');
  const [filter, setFilter] = useState('all');
  const [selectedDeepDiveId, setSelectedDeepDiveId] = useState(PROJECTS[0].id);
  const [theme, setTheme] = useState('light');
  const [progress, setProgress] = useState(0);

  // Reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const height = h.scrollHeight - h.clientHeight;
      setProgress(height > 0 ? (scrolled / height) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard shortcuts: [ ] prev/next project in deep dive, o/d switch views, t theme
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 't') setTheme((t) => (t === 'light' ? 'dark' : 'light'));
      if (e.key === 'o') setView('overview');
      if (e.key === 'd') setView('deep-dive');
      if (e.key === 'h') setView('hr-round');
      if (view === 'deep-dive' && (e.key === '[' || e.key === ']')) {
        const idx = PROJECTS.findIndex((p) => p.id === selectedDeepDiveId);
        if (e.key === '[' && idx > 0) setSelectedDeepDiveId(PROJECTS[idx - 1].id);
        if (e.key === ']' && idx < PROJECTS.length - 1) setSelectedDeepDiveId(PROJECTS[idx + 1].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, selectedDeepDiveId]);

  const filters = useMemo(() => {
    const tags = new Set();
    PROJECTS.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return ['all', 'signature', 'strong', 'selective', ...Array.from(tags)];
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return PROJECTS;
    if (filter === 'signature') return PROJECTS.filter((p) => p.tier === 1);
    if (filter === 'strong') return PROJECTS.filter((p) => p.tier === 2);
    if (filter === 'selective') return PROJECTS.filter((p) => p.tier === 3);
    return PROJECTS.filter((p) => p.tags.includes(filter));
  }, [filter]);

  const filterLabel = (f) => {
    if (f === 'all') return `All · ${PROJECTS.length}`;
    if (f === 'signature') return 'Signature';
    if (f === 'strong') return 'Strong';
    if (f === 'selective') return 'Selective';
    return f;
  };

  const deepDiveCount = Object.keys(DEEP_DIVES).length;

  return (
    <div className="pf-root" data-theme={theme}>
      <style>{css}</style>
      <div className="pf-progress" style={{ width: `${progress}%` }} />
      <div className="pf-grain" />
      <button
        className="pf-theme-toggle"
        onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        aria-label="Toggle theme"
        title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
      >
        {theme === 'light' ? '◐' : '◑'}
        <span className="pf-theme-toggle-label">
          {theme === 'light' ? 'dark' : 'light'}
        </span>
      </button>
      {progress > 8 && (
        <button
          className="pf-backtop"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          title="Back to top"
        >
          ↑
        </button>
      )}
      <div className="pf-shell">

        {/* HEADER */}
        <header className="pf-header">
          <div>
            <div className="pf-eyebrow">Engineering Dossier · v2026.01</div>
            <h1 className="pf-title">
              The work,<br />
              <em>in detail.</em>
            </h1>
          </div>
          <p className="pf-subtitle">
            A complete record of projects shipped — with the narratives,
            tradeoffs, impact, and the questions that broke prior candidates.
          </p>
        </header>

        {/* META */}
        <div className="pf-meta">
          <div className="pf-meta-cell">
            <div className="pf-meta-label">Projects</div>
            <div className="pf-meta-value">{PROJECTS.length}</div>
          </div>
          <div className="pf-meta-cell">
            <div className="pf-meta-label">Signature work</div>
            <div className="pf-meta-value">
              {PROJECTS.filter((p) => p.tier === 1).length}
            </div>
          </div>
          <div className="pf-meta-cell">
            <div className="pf-meta-label">Years</div>
            <div className="pf-meta-value">2021—2026</div>
          </div>
          <div className="pf-meta-cell">
            <div className="pf-meta-label">Positioning</div>
            <div className="pf-meta-value" style={{ fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}>
              Product-minded systems engineer
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="pf-tabs">
          <button
            className={`pf-tab ${view === 'overview' ? 'active' : ''}`}
            onClick={() => setView('overview')}
          >
            Overview
          </button>
          <button
            className={`pf-tab ${view === 'deep-dive' ? 'active' : ''}`}
            onClick={() => setView('deep-dive')}
          >
            Deep <em>dive</em>
            <span className="pf-tab-badge">Staff-level</span>
          </button>
          <button
            className={`pf-tab ${view === 'hr-round' ? 'active' : ''}`}
            onClick={() => setView('hr-round')}
          >
            HR <em>round</em>
            <span className="pf-tab-badge hr">Behavioral</span>
          </button>
          <div className="pf-kbd-hint">
            <kbd>o</kbd>/<kbd>d</kbd>/<kbd>h</kbd> views · <kbd>[</kbd><kbd>]</kbd> projects · <kbd>t</kbd> theme
          </div>
        </div>

        {view === 'overview' && (
          <>
            {/* FILTERS */}
            <div className="pf-filters">
              {filters.map((f) => (
                <button
                  key={f}
                  className={`pf-filter ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {filterLabel(f)}
                </button>
              ))}
            </div>

            {/* PROJECTS */}
            <main>
              {filtered.map((p, i) => (
                <Project key={p.id} project={p} index={PROJECTS.indexOf(p)} />
              ))}
            </main>

            {/* FOOTER */}
            <footer className="pf-footer">
              <span>End of dossier</span>
              <span>{filtered.length} of {PROJECTS.length} shown</span>
            </footer>
          </>
        )}

        {view === 'deep-dive' && (
          <>
            <DeepDive
              projects={PROJECTS}
              selectedId={selectedDeepDiveId}
              onSelect={setSelectedDeepDiveId}
            />
            <footer className="pf-footer" style={{ marginTop: 64 }}>
              <span>Deep dive · {deepDiveCount} projects</span>
              <span>Use when interviewer goes 3+ layers deep</span>
            </footer>
          </>
        )}

        {view === 'hr-round' && (
          <>
            <HRQuestions />
            <footer className="pf-footer" style={{ marginTop: 64 }}>
              <span>HR round · {HR_QUESTIONS.reduce((n, c) => n + c.questions.length, 0)} questions</span>
              <span>[VERIFY] markers = swap in your real specifics</span>
            </footer>
          </>
        )}

      </div>
    </div>
  );
};

export default Projects;
