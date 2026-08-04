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
    id: 'test-parallelization',
    tier: 1,
    year: '[VERIFY year]',
    company: 'Intuit',
    title: 'Parallelized Integration Test Suite',
    role: '[VERIFY — you drove this end to end]',
    tags: ['Infrastructure', 'CI/CD', 'Concurrency', 'JVM'],
    oneLine:
      'Parallelized a 10K+ scenario Cucumber suite across 4 isolated JVM forks with per-fork company-level data partitioning — CI feedback 10 min → ~3 min.',
    headline: '10 min → ~3 min CI',
    narrative:
      "The team's 10,000+ scenario Cucumber integration suite ran sequentially in ~10 minutes on every CI run — a quiet tax on every engineer, every push, pushing people toward bigger batched commits. I parallelized it across 4 JVM forks via Maven Surefire, choosing process isolation over threads because the legacy suite was full of static state that threads would share and corrupt. The hard problem was isolation against a shared database: I used per-fork company-level data partitioning — fork.id deterministically maps to a disjoint range of pre-provisioned companies, so two forks physically cannot touch the same data, with no runtime coordination. Along the way, scenario-count reconciliation I added to verify the change surfaced 550 ghost scenarios running against deleted code; a small static-analysis tool plus owner review removed them safely.",
    problem: [
      '10K+ scenarios, sequential, one JVM: ~10 min per CI run — dominated by per-scenario DB I/O, not CPU.',
      'Ten minutes per push, multiplied across the team, meant context-switch tax and batched, riskier commits.',
      'Legacy suite full of statics and singletons written for one-test-at-a-time — thread parallelism would expose years of unsafe assumptions as intermittent CI-only flakes.',
      'All parallel workers share one test database: naive parallelism means cross-worker data collisions on financial test data.',
    ],
    architecture: [
      'Maven Surefire forkCount=4, reuseForks=true — four child JVMs, each with its own heap, statics, Spring context. Isolation is structural (OS process boundary), not disciplinary.',
      'Four forks chosen empirically: near-linear speedup at 4; at 6+ the shared DB showed connection pressure and slow queries; at 8 it regressed (~3.4 min) from CPU thrashing + startup amortization loss.',
      'Per-fork company partitioning: fork.id (system property injected by the build) → disjoint pre-provisioned company ID range. TestCompanyProvider hands each scenario a fresh company from its fork pool; used companies reset nightly.',
      'Intra-fork isolation: tests run sequentially inside a fork; fresh-company-per-scenario means no cleanup dependency — a crashed test corrupts only a company no other test touches.',
      'Environment keying: per-fork namespace for flags/config overrides so forks cannot flip each other\u2019s state.',
      'Test assignment: historical-duration-seeded distribution + dynamic pickup at test-class level, so no fork gets stuck with all the slow classes. [VERIFY exact mechanism]',
      'Ghost detection: per-scenario count reconciliation (parallel vs sequential) exposed report mismatches → static-analysis tool walked scenario → step definitions → invoked code, flagging scenarios whose entire reachable code was deleted/deprecated; owners confirmed before deletion.',
    ],
    impact: [
      'CI feedback loop: ~10 min → ~3 min (≈70% reduction) on every run.',
      '550 ghost scenarios identified and removed with owner sign-off — runtime saved and "suite passed" made meaningful again.',
      'Flake rate after isolation hardening: <0.2% [VERIFY]; cross-fork data collisions eliminated by construction.',
      'Second-order: smaller, more frequent commits — engineers stopped batching to amortize CI wait.',
    ],
    killerAnswer:
      "Threads share memory; processes don't. For a legacy suite full of statics, forks make cross-test contamination structurally impossible instead of relying on a multi-month thread-safety refactor. The shared DB was handled at the app's own tenancy layer: fork_id → disjoint company range, so two forks physically cannot see each other's data — no locks, no runtime coordination, isolation by construction.",
    grillQuestions: [
      'Why forks over Cucumber thread parallelism?',
      'Why exactly 4 forks — what happened at 8?',
      'How did forks avoid colliding on the shared database?',
      'Inside one fork, how did tests avoid contaminating each other?',
      'How did you find the 550 ghost scenarios, and how did you know they were safe to delete?',
      'What if one fork gets all the slow tests?',
    ],
    landmines: [
      "Don't claim you made the suite thread-safe — the whole point is you deliberately avoided that refactor via process isolation.",
      "Don't say the counts differed because parallel ran extra tests — both modes ran the ghosts; your new instrumentation exposed reporting that had been wrong for years.",
      'Surefire, Cucumber, and the multi-tenant companyId design are things you stood on — your work was composing them into a safe parallel scheme.',
      'The 4-vs-6-vs-8 fork numbers and flake percentages are reconstructions — [VERIFY] against your real runs before quoting them.',
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
    firstPrinciplesQA: [
      { q: "What problem is this actually solving?", a: "Tests only cover the cases someone imagined; real production traffic is the only realistic test surface — but you cannot experiment on customers. Reduced: how do you get production-scale truth without production-scale risk? Answer: capture real traffic, replay it against a parallel stack running the risky change, compare responses, written data, and latency. The customer only ever touches the real service." },
      { q: "Why must capture live outside the application?", a: "Anything inside the app sits in the customer's critical path — a capture bug adds latency or crashes the app — and couples capture to the app's release cycle. A sidecar is a separate process in the same pod with its own failure domain: if it dies, customers feel nothing. Isolation of failure domains is the design principle." },
      { q: "Traffic is TLS-encrypted. How do you capture it without weakening security?", a: "GoReplay watches packets; it cannot decrypt and never encrypts or decrypts anything. The Nginx sandwich solves it inside the pod: Nginx terminates TLS (decrypts), GoReplay passively observes the plaintext, a second Nginx re-encrypts before the app. Plaintext exists ONLY within the pod — the trust boundary is the pod boundary, physical rather than policy. On the bus, payloads are additionally IDPS-encrypted." },
      { q: "How is it guaranteed the replay causes no side effects?", a: "An Envoy egress proxy intercepts every outbound call from the parallel stack; Wiremock fakes the WRITES; reads pass through because they are side-effect-free. The mocking is at the network layer — even buggy application code cannot reach a production write endpoint, because the network path does not exist. Blast radius is zero by construction, not by convention." },
      { q: "How do you compare written data without diffing a 32TB database?", a: "A relational schema IS a graph: rows are nodes, foreign keys are edges, and one request's writes form a small connected subgraph off one parent record. So: BFS from (tenant_id, parent_record_id) following FKs, each BFS level one SQL query, bounded by a time window and per-workflow table config. Compare the two row-sets normalizing generated IDs and timestamps. Cost proportional to what the request touched — tens of rows, not terabytes." },
      { q: "Why Kafka, and why does the partition key matter so much?", a: "Requests and responses are captured as separate events but must be paired to know what production answered. Partition key = transaction_id: Kafka sends same-key messages to the same partition, one consumer owns a partition, order is preserved — so a request and its response always meet at the same consumer, in order. Choose the key right and the hard problem disappears." },
    ],
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
    firstPrinciplesQA: [
      { q: "What is the root problem, in one sentence?", a: "One concept — a project — lives as two records in two services (IPM project, CMS sub-customer) with no shared transaction, and the legacy sync ran two racing code paths that treated timeouts as certain failure — so it manufactured the exact drift it existed to prevent." },
      { q: "Why is a timeout not a failure?", a: "When a cross-service call times out, three things could be true: the request never arrived (retry safe), the other side did the work and the response was lost (retry double-applies), or it is still processing. You cannot distinguish them — the Two Generals problem. A timeout is an UNKNOWN, not a NO. Treating it as failure and rolling back a call that actually succeeded creates inconsistency in the opposite direction." },
      { q: "What does reconcile-before-compensate mean, mechanically?", a: "Every write carries a correlation ID (the projectId). After a timeout, read CMS by that ID to establish ground truth. Found and matching → roll FORWARD: the write succeeded despite the timeout, so update local state. Absent → NOW compensate safely. Compensation only ever runs after reconciliation confirms it is needed — never on a guess." },
      { q: "How do retries avoid creating duplicates?", a: "The correlation ID doubles as an idempotency key: CMS treats a repeated write with the same key as the same operation and returns the original result. Retry becomes safe by contract, not by luck. And compensation is per-operation: failed create → soft-delete the optimistic local record; failed update → revert to prior version; failed inactivate → undelete. Each compensation is itself idempotent and chaos-tested." },
      { q: "Why synchronous to CMS but asynchronous to downstream?", a: "The user clicking Save needs a deterministic answer NOW — so the IPM→CMS write is synchronous with the reconciliation flow wrapped around it. Downstream systems (STS, ETS, FTS, QBTime) only need to learn that a project changed — they get async domain events via the platform transactional outbox (event written in the same DB transaction as the state change). Honesty: outbox is platform infra — consumed, not built; my slice was the STS consumer and the resiliency POC." },
      { q: "Why not two-phase commit?", a: "2PC requires every participant to hold locks between prepare and commit. CMS is a shared multi-tenant service used by many teams — it will not hold write locks for one caller. Off the table organizationally, not just technically. What exists instead has a name: an orchestrated saga, with reconciliation gating compensation." },
    ],
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
  'template-sharing': {
    firstPrinciplesQA: [
      { q: "What was actually hard here?", a: "Two things. Sharing is a read-model problem: SHARED_WITH_ME is the union of four scope predicates (ALL, ALL_MY_COMPANIES, ALL_MY_CLIENTS, CUSTOM), and ALL_MY_CLIENTS depends on the firm-client relationship graph that lives outside UCS. And publish is a dual write across two services (WAS + UCS) with no shared transaction — so failure ordering had to be designed, not hoped." },
      { q: "Why write WAS before UCS?", a: "When two writes cannot be atomic, order them so the failure mode is the harmless one. If UCS fails after WAS succeeded, you have an orphan definition — invisible to users, cleanable by a job. The reverse order risks a UCS record pointing at a definition that does not exist — a dangling reference, which is user-visible corruption. Orphan beats dangling reference every time." },
      { q: "Why is offeringId mandatory on everything?", a: "UCS is one platform serving many products. offeringId is the partition key that keeps every product's data in its own lane — it is precisely what makes the platform plugin-agnostic. Your templates live under your offeringId; the platform never mixes tenants of different products." },
      { q: "Why cursor pagination instead of page numbers?", a: "The shared-templates list changes while someone pages through it. Offset pagination (page 3 = skip 40) shifts under inserts — duplicates or skipped rows. A cursor is a stable position marker: give me items after THIS one. Correct under concurrent writes; Relay-style first/after/endCursor/hasNextPage." },
      { q: "Is the PII masking a security boundary?", a: "No, and saying so cleanly is the senior move. It is client-side dot-dash masking at publish time — a publisher-trust convenience. A malicious client could skip it. A real guarantee requires a server-side backstop [VERIFY whether one exists]. Precision about what a control does and does not protect is worth more than overclaiming." },
    ],
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
    firstPrinciplesQA: [
      { q: "What is the one deep design decision in this project?", a: "WHEN the preference is read. The consolidation toggle is resolved at EXECUTION time — the moment an email is actually sent — not at toggle time. For any setting, the design question is: at what moment is this read, and what is in flight when it changes?" },
      { q: "Why not resolve at toggle time?", a: "Emails already queued or scheduled when the user flips the switch. Resolve at toggle time and in-flight emails behave inconsistently — some old mode, some new, depending on where they sat in the pipeline. Resolve at execution time and behavior is deterministic no matter when the toggle flips. [If asked how you know: an early behavior report during rollout traced exactly to this — VERIFY the specifics.]" },
      { q: "Why not fork the shared email components for the new mode?", a: "The CC/BCC, freeform-text, and attachment components were shared with other flows. Forking creates two copies to maintain forever — every future fix lands twice or diverges. Instead they became mode-aware via props: one component, behavior switched by mode, every existing capability preserved. Harder up front, no permanent fork debt." },
      { q: "What made the rollout safe?", a: "Legal review as a merge gate (customer-facing email content), mock APIs so the frontend never blocked on backend readiness, percentage-based rollout, and a default that preserved old behavior — opt-in, reversible, backward compatible." },
    ],
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
    firstPrinciplesQA: [
      { q: "What is this project, in one sentence?", a: "An academic, segment-level binary classifier for implicit advertising in video: extract features from each segment, model outputs a probability, threshold turns it into a flag — ~85% test-set accuracy. Frame it as academic up front; the calibrated modesty buys credibility." },
      { q: "Why multi-modal?", a: "Implicit advertising is an INTENT signal, and intent rarely shows in one channel. A visible logo alone is incidental product use; promotional audio alone misses silent placements. Brand present (visual) + promotional framing (audio) + unusual placement in the flow (contextual) — together they signal promotion. The features fuse into one vector so the model learns cross-mode combinations. The intent lives in the combination." },
      { q: "Why recall-prioritized?", a: "Cost of errors. As a screening tool, a missed implicit ad slips through undisclosed — genuinely bad; a false flag costs a reviewer seconds. So the threshold is tuned low: flag aggressively, maximize recall, accept lower precision. The golden contrast: the budget import tunes the OPPOSITE way (precision) because a wrong auto-match onto money is the costly error there. Same tradeoff, opposite directions, because the error costs are reversed." },
      { q: "Is 85% accuracy good?", a: "Careful — accuracy flatters imbalanced classes. If only 10% of segments are ads, a model that always says not-an-ad scores 90% while catching nothing. Given the recall priority, recall and F1 were the metrics that mattered; accuracy was the headline, not the target. And it is test-set accuracy — performance on unseen data, the only kind that means anything." },
      { q: "Where does your knowledge stop?", a: "At model internals. The honest exit if pushed: this was academic — I understand these systems at the level of designing around them and reasoning about tradeoffs (features, thresholds, precision/recall, generalization), not deriving optimizers. Saying the boundary cleanly is a strength, not a confession." },
    ],
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
    firstPrinciplesQA: [
      { q: "What tension drives the entire design?", a: "History versus authority. Lose old versions and you cannot answer what was originally planned — a real accounting need. Keep every version and every read must answer: which one is THE budget right now? The design must keep history AND stay authoritative, under concurrent editing, on money." },
      { q: "Why does naive version++ fail?", a: "Four ways. Every read becomes ORDER BY version DESC LIMIT 1 — forget once, a report shows stale money. Versioning per keystroke floods history with junk — versions should mark meaningful moments. Casual draft edits and formal publishes get flattened into one motion. And two users saving from two tabs silently lose the first save — the lost-update problem." },
      { q: "What is the core mechanism?", a: "DRAFT is mutable in place — one working row, every save overwrites. Publish FORKS: copy the draft into a new immutable LOCKED row (copy-on-write); the previous LOCKED goes INACTIVE, the new one is ACTIVE. Three orthogonal axes keep it reasonable: state (what kind of row), status (which is authoritative), revision (which snapshot) — composite key (budgetId, revision, companyId)." },
      { q: "How are concurrent editors handled?", a: "Optimistic locking, two layers on purpose. editSequence (JPA @Version) travels to the client as a syncToken and comes back with the save; a mismatch returns 409 Conflict and the client refreshes. The explicit check gives clean UX; @Version catches the true race at commit with OptimisticLockException. Optimistic because you never hold a DB lock while a browser tab sits open." },
      { q: "Why can LOCKED never become DRAFT?", a: "A locked revision may already back an estimate a customer has seen. Unlock-and-edit would shift ground other systems believe frozen. Once immutable, always immutable — enforced as INVALID_LOCKED_STATE. New work happens on the draft and becomes a NEW revision." },
    ],
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
      conceptualFoundations: [
        { q: "State vs status vs revision — why three separate axes?", a: "state = what KIND of row (DRAFT/LOCKED/HIDDEN), status = which row is the current authority (ACTIVE/INACTIVE), revision = which snapshot. Conflate any two and the model stops being reasonable — you end up encoding authority into version numbers or mutability into flags. Orthogonal axes make every lifecycle transition a clean tuple change." },
        { q: "Optimistic vs pessimistic locking — when is each right?", a: "Pessimistic takes a DB lock up front — correct but deadly for web UIs, because a browser tab can sit open for hours holding it. Optimistic assumes conflicts are rare: no lock, check a version counter at commit, reject the loser with 409. Right whenever hold-time is human-scale. The budget uses optimistic with two layers: explicit syncToken compare for clean UX, JPA @Version for the true race." },
        { q: "What is copy-on-write, generally?", a: "Share or keep the current thing; the moment a change is needed, copy it and change the copy — the original stays frozen. Filesystems, string implementations, and this budget design all use it. Publish copies the draft into a new LOCKED row; the deep copy matters — copying references instead of data would let later draft edits mutate the supposedly-immutable snapshot through shared objects." },
        { q: "Why 409 Conflict specifically?", a: "Status codes are contract. 400 says your request was malformed (it was not), 500 says the server broke (it did not). 409 says: valid request, but the resource changed underneath you — refresh and retry. The client can build the right recovery UX only because the code is semantically precise." },
        { q: "What does the composite primary key buy?", a: "(budgetId, revision, companyId) makes every physical row uniquely addressable — one logical budget, many revision rows — and bakes tenant isolation into the identity itself: no query can even express crossing companies. Identity design doing security work for free." },
      ],
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
    firstPrinciplesQA: [
      { q: "What tension drives the whole design?", a: "A budget is deterministic — $14,200 is not about-$14,200. An LLM is probabilistic — plausible, variable, sometimes wrong. The design question: how does a probabilistic component feed a deterministic financial record without the uncertainty leaking into the money? Answer: the AI never writes to the record, and the human reviews exactly where the AI is uncertain." },
      { q: "Why asynchronous?", a: "LLM extraction takes seconds to tens of seconds, varying with document size. Block a user request on that and you get HTTP timeouts, frozen UI, lost work on tab close. V1 was synchronous and taught that lesson on large documents; V2 went async — upload returns immediately, completion arrives by ICE push with a 5-second poll fallback (push for speed, poll so a dropped message can never hang the UI forever)." },
      { q: "Why are EXTRACTED and COMPLETED separate states?", a: "That gap IS the human-in-the-loop, encoded as a state machine. The AI can reach EXTRACTED on its own — results parked for review, not in the budget. Only a human transition crosses to COMPLETED, and what gets written is the human-approved reviewedLines, never raw model output. The state machine is server-authoritative so closing the laptop loses nothing." },
      { q: "How does confidence actually work?", a: "The document says Lumber; the cost code says Framing Materials — zero shared characters, same meaning. Embeddings map text to vectors where similar meanings are geometrically close; cosine similarity scores the closeness; thresholds cut the score into MATCH / PARTIAL_MATCH / NO_MATCH. The thresholds are a precision-recall dial, tuned toward precision on financial data — when in doubt, ask the human. AiSparkles marks only the uncertain tiers: attention where judgment adds value." },
      { q: "What about hallucination?", a: "Plausible output not grounded in the input — a line item that LOOKS real but is not in the document. It cannot be eliminated at the model level, so the system is built to be safe when the model is wrong rather than assuming it is right: nothing auto-commits, uncertain rows flagged, human gates the only write path, 100-record guardrail bounds a runaway extraction." },
      { q: "What did you own versus consume?", a: "Consumed: the QBAI extraction/matching model (embeddings, cosine, confidence) behind a GraphQL BFF, and the ICE pub/sub. Owned: the async orchestration, server-authoritative state machine, review UI and confidence surfacing, guardrails, budget-grid integration. The reframe: the model is the easy 20% — the safe, async, human-gated system around it is the hard 80%." },
    ],
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
      conceptualFoundations: [
        { q: "What is an LLM actually doing?", a: "Predicting likely next tokens (word-pieces), one after another, based on patterns learned from enormous text via self-supervised training — the text is its own label. It optimizes for plausibility, not truth. That single fact generates the whole design: async (generation is slow), confidence tiers (output is probabilistic), human gate (plausible is not the same as correct)." },
        { q: "What is an embedding, in one breath?", a: "A function that maps text to a vector of numbers such that similar MEANINGS land geometrically close. Cosine similarity measures how aligned two vectors are. Meaning becomes geometry — which is how Lumber matches Framing Materials with zero shared characters. Semantic matching, not string matching." },
        { q: "Precision vs recall — and the two-project contrast.", a: "Precision: of what you flagged positive, how much was right. Recall: of the real positives, how much you caught. They trade off through the threshold, and which you favor follows the cost of each error. Budget import: wrong auto-match onto money is expensive → precision. Ads detector: missed ad slipping through is expensive → recall. Same principle, opposite directions — land that contrast and you have proven you understand it." },
        { q: "What is hallucination and why can you not just fix it?", a: "Plausible output not grounded in the input. The model is doing exactly what it was trained to do — produce likely text — so hallucination is not a bug you patch but a property you design around. Hence: safe when the model is wrong, never assuming it is right." },
        { q: "What is calibration, and why no auto-accept even on MATCH?", a: "A confidence of 0.9 does not guarantee 90% real-world correctness — scores are not perfectly calibrated. So high confidence reduces review attention (no sparkle) but never bypasses the gate. On financial data, the human stays in the loop for every write." },
        { q: "Push vs poll — why both?", a: "Push (ICE pub/sub) is fast but a message can drop; poll (5s) is guaranteed but adds latency. Push for speed, poll as the safety net, both feeding ONE idempotent completion handler so double-delivery is harmless. The UI can never hang forever on a lost event." },
        { q: "Why is there a 100-record guardrail?", a: "Bounds the blast radius of a runaway or hallucinated extraction and keeps review humanly possible — 100 rows is reviewable, 10,000 is a rubber stamp. Guardrails protect the human gate from becoming theater." },
      ],
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
  'test-parallelization': {
    framing:
      'This project is an isolation story wearing a speed costume. The 10→3 min number gets attention, but the engineering was making four parallel workers safe against shared state — in the JVM (via process forks) and in the database (via tenancy partitioning). Lead with the isolation reasoning; the speedup is just the receipt.',
    firstPrinciplesQA: [
      { q: 'What was the real bottleneck?', a: 'Serialization, not CPU. Each scenario is I/O-bound (DB reads/writes), and 10K of them ran one at a time in a single JVM. A faster machine barely helps an I/O-bound serial run; overlapping the waits via parallelism is the actual fix. You do not fix serialization by making the serial thing faster — you break the serialization.' },
      { q: 'Why not threads inside one JVM?', a: 'Threads share the entire heap — every static field, every singleton, every cache. The legacy suite assumed one test at a time (shared TestContext, static caches, Spring singletons with mutable state). Threading would expose years of unsafe assumptions as intermittent, CI-only flakes, and fixing it means a multi-month cross-team thread-safety refactor. Forks sidestep all of it.' },
      { q: 'Why do JVM forks make it safe?', a: 'Each fork is a separate OS process with its own private memory. Fork 1\u2019s statics are physically different variables from fork 2\u2019s — the OS will not let one process read another\u2019s memory. Isolation is enforced by the substrate, not by programmer discipline. Cost: extra RAM per JVM and startup time — a fair price for structural safety.' },
      { q: 'The forks share one database. How is that safe?', a: 'Use the app\u2019s own production isolation: every row is scoped by companyId and every query filters on it. If fork 1 only ever touches companies 1000-1999 and fork 2 only 2000-2999, they cannot see each other\u2019s rows even in the same tables. The partition function is fork_id → disjoint company range — pure, static, zero runtime coordination.' },
      { q: 'And inside one fork?', a: 'Tests run sequentially within a fork, so there is no race — only temporal contamination (test B inheriting test A\u2019s leftovers). Fix: fresh company per scenario from the fork\u2019s pre-provisioned pool. State starts empty by construction; a crashed test corrupts only a company nothing else will touch. No cleanup logic to trust.' },
      { q: 'Why is the fork count 4 and not 8?', a: 'Parallelism speeds you up only until the first shared resource saturates. At 4 forks, CPU was near-saturated with DB headroom. At 6, DB connection pressure and slow queries appeared. At 8 it regressed: CPU context-switch thrash, halved per-fork startup amortization, and forks queuing inside the DB. The number is an empirical sweet spot of the environment, not a universal.' },
    ],
    decisions: [
      { q: 'Process forks vs thread parallelism?', options: ['Cucumber threads in one JVM', 'Maven Surefire JVM forks', 'Refactor suite to be thread-safe first'], chosen: 'Surefire forks, reuseForks=true', why: 'Threads share heap → legacy statics become race conditions with the worst failure mode (intermittent CI-only flakes). The refactor is multi-month and cross-team. Forks give structural isolation for the price of RAM + startup.', tradeoff: 'Each fork pays Spring startup and its own heap; reuseForks=true amortizes startup across the fork lifetime.' },
      { q: 'How to isolate against the shared DB?', options: ['One DB per fork', 'Transaction-wrap and rollback per test', 'Truncate between tests', 'Per-fork companyId range partitioning'], chosen: 'companyId range partitioning', why: 'Uses the app\u2019s production multi-tenancy invariant — queries are companyId-scoped, so disjoint ranges mean disjoint visibility. No infra cost (vs 4 DBs), works for tests that commit (vs rollback wrapping), and no shared truncation hazard.', tradeoff: 'Requires pre-provisioned company pools and a nightly reset job.' },
      { q: 'Fresh company per scenario vs shared company + cleanup?', options: ['One company per fork + cleanup hooks', 'Fresh company per scenario from pool', 'Fresh per feature file'], chosen: 'Fresh per scenario', why: 'Cleanup-based isolation silently poisons the next test whenever cleanup has a bug or a test crashes before teardown. Fresh-per-scenario means empty state by construction — a stronger guarantee with no growing cleanup tax.', tradeoff: 'Bigger pool to provision; scenarios needing shared setup re-create it via Cucumber Background on the fresh company.' },
      { q: 'How to assign tests to forks?', options: ['Static round-robin by class', 'Dynamic pickup seeded by historical durations'], chosen: 'Duration-seeded dynamic pickup [VERIFY]', why: 'Wall-clock = slowest fork. Static round-robin can dump all slow classes on one fork. Seeding by last-run durations plus dynamic pickup keeps forks within ~15% of the theoretical minimum.', tradeoff: 'Needs duration history; imperfect balance accepted as not worth further complexity.' },
    ],
    algorithms: [
      { name: 'Fork → company partition function', detail: 'At fork startup, read -Dfork.id, compute the disjoint range (e.g., start = 1000 + (forkId-1)*1000), load those IDs into an in-memory queue. checkoutCompany() pops one per scenario; used companies are not returned during the run (nightly reset). Two forks cannot collide because the function is pure and the ranges are disjoint by construction.' },
      { name: 'Ghost-scenario detector', detail: 'Cucumber --dry-run maps every scenario to its step-definition methods. JavaParser walks each method\u2019s call graph (BFS over method calls, bounded to our own packages). A scenario whose entire reachable set is deleted/deprecated code is flagged. Tool proposes; area tech leads dispose. 550 confirmed dead and removed.' },
      { name: 'Count reconciliation', detail: 'Per-scenario start log line tagged with fork id + scenario name, aggregated and compared against the sequential baseline. The mismatch it exposed was not "parallel ran extra tests" — both ran the ghosts — it was that the old reporter had been silently under-counting early-failing scenarios for years.' },
    ],
    numbers: [
      { metric: 'CI feedback loop', value: '10 min → ~3 min', note: '≈70% reduction; wall-clock ≈ slowest fork.' },
      { metric: 'Scenarios', value: '10,000+', note: '~2,500 per fork at forkCount=4.' },
      { metric: 'Ghost scenarios removed', value: '550', note: 'Confirmed by owners; running for ~2 years against deleted code.' },
      { metric: 'Fork sweep', value: '2→~5.5m · 4→~3.1m · 6→~2.9m · 8→~3.4m', note: '[VERIFY] — the shape (regression past the DB saturation point) is the point.' },
      { metric: 'Flake rate', value: '~15% → <0.2%', note: '[VERIFY] before vs after isolation hardening.' },
    ],
    warStories: [
      { title: 'The fork that hung at 99%', story: 'Roughly 1 in 15 CI runs, one fork would stall forever near the end; never reproducible locally. Root cause: a pipe-buffer deadlock between the fork and the Surefire parent — the fork emitting large output at shutdown while the parent waited for completion. Fix: bound fork output + a heartbeat so the parent detects and kills a stalled fork deterministically. Lesson: parallelizing does not just add data races — it adds coordination races between workers and the infrastructure supervising them. The bugs move up a layer. [VERIFY specifics]' },
      { title: 'Flake spike before isolation landed', story: 'First parallel runs flaked ~15%: ordering assumptions, Thread.sleep-based waits that failed under CPU contention, and early partitioning gaps. Fixed by condition-based waits, fresh-per-scenario allocation, and a flake dashboard clustering failures by scenario. Retro lesson: build the observability BEFORE the change that needs it.' },
    ],
    edgeCases: [
      'Scenario needing two companies: checkout both from the same fork\u2019s pool — never borrow across forks.',
      'Pool exhaustion mid-run: sized generously (pool ≥ scenarios per fork that need one); hot-reset fallback existed and was never needed. Design for the failure mode you hope never to hit.',
      'Tests must never run DDL — CREATE INDEX/ALTER TABLE takes table locks that stall every other fork. Schema migrations happen once at CI startup, before forks.',
      'Heavy fixtures: a separate pool of pre-seeded companies at fixture levels (empty / small / with-history); tests declare the level they need.',
    ],
    whatIWouldChange:
      'Build the flake dashboard before flipping on parallelism, not after — I spent a week hunting individual failures blind. Observability first, then the change it measures. Also: per-fork databases become the right call if the suite grows ~10x, and past that the honest answer is fewer end-to-end tests, not more forks.',
    chains: [
      { q: 'Speed it up further?', a: 'More forks hits the DB wall — next lever is per-fork DBs, then test-pyramid rebalancing (more unit/contract tests, fewer full-stack scenarios). Parallelism only helps until the first shared resource saturates.' },
      { q: 'Same idea elsewhere in your work?', a: 'Same shape as traffic replay: isolation by construction, not convention. Forks are to statics what network-layer write-mocking is to downstream services — the substrate enforces safety so discipline does not have to.' },
    ],
    followUps: {
      interviewDrills: [
        { q: 'Why not just a bigger CI machine?', a: 'The suite is I/O-bound and serial; faster CPU buys ~5-10% per scenario. The bottleneck was running one at a time — you break serialization with concurrency, not silicon.' },
        { q: 'Cucumber parallel vs Surefire forkCount?', a: 'Cucumber parallel = threads in one JVM = shared heap = legacy statics become races. Surefire forks = separate JVMs = structural isolation. For an old suite, forks are the only path that avoids a cross-team thread-safety refactor.' },
        { q: 'reuseForks true or false?', a: 'True. False kills and reboots the JVM (and Spring, 20-30s) per test class — the startup tax eats the parallelism win. True means Spring boots once per fork; that is exactly why the isolation work (partitioning, env keying) had to be solid — a reused JVM carries state forward.' },
        { q: 'Don\u2019t parallel forks contend inside the DB?', a: 'Row locks: no — companyId partitioning means disjoint rows. What remains shared: connection budget (per-fork pools sized against max_connections), disk I/O queue depth, commit log. That shared machinery is precisely why 8 forks regressed. And no DDL in tests, ever — table locks stall everyone.' },
        { q: 'How did you know the 550 were really dead?', a: 'The tool proposed, owners disposed. Flagged only scenarios whose entire reachable code path was deleted/deprecated; verified against coverage; walked the list with each area\u2019s tech lead. Default was keep, not delete. Nothing removed on my sole authority.' },
        { q: 'What if 5 of the 10 minutes were Spring startup?', a: 'Then parallelizing execution attacks the wrong bottleneck — four forks each paying 5 minutes of boot is still 5 minutes wall-clock. The right fix becomes context caching / test slicing first. I profiled first: startup was under 30s, execution dominated — which is why parallelism was the right lever. Always profile before optimizing.' },
        { q: 'Does this survive 100K scenarios?', a: 'Directionally, with two walls: more forks saturate the shared DB (per-fork DBs become necessary around 8-12), and pool provisioning must scale. Past that the honest answer is rethinking the test pyramid — at 100K end-to-end scenarios the problem is the suite, not the runner.' },
        { q: 'Why not tags — run @smoke on PRs, full on merge?', a: 'Tags reduce what you run: coverage traded for speed, bugs surface post-merge with bigger blast radius. Parallelization cuts how long the same coverage takes — no one has to be smart about which bugs are acceptable to catch late. Not mutually exclusive; I picked the lever with no coverage cost.' },
        { q: 'Three runs, three pass rates — what does that tell you?', a: 'Flakes, and flakes are signal about isolation assumptions, not noise. Hunt in order: ordering assumptions (dynamic assignment changed execution order), timing assumptions (sleeps failing under CPU contention → condition-based waits), and state leaks. Systemically: flake dashboard, cluster by scenario, quarantine repeat offenders, fix root causes — never just retry.' },
        { q: 'One thing you\u2019d do differently?', a: 'Observability before the change. I turned on parallelism, drowned in a 15% flake spike for a week, then built the dashboard that would have made it a day. You cannot debug what you cannot see — the tooling comes first, so the change is measurable from day one.' },
      ],
      conceptualFoundations: [
        { q: 'Process vs thread — the one-breath version.', a: 'A process is a running program with private, OS-enforced memory (an apartment). Threads are workers inside one process sharing all its memory (roommates — same fridge, same couch). Sharing is threads\u2019 power and their danger: any shared mutable thing can be corrupted by whoever touched it last.' },
        { q: 'Why is static state the villain?', a: 'A static field is one shared slot per JVM. Test A sets TestContext.currentCompany, test B overwrites it mid-flight, test A reads B\u2019s value. The suite was written when only one test ran at a time, so nobody made anything thread-safe — turning on threads does not add safety, it exposes a decade of assumptions.' },
        { q: 'What exactly is a Surefire fork?', a: 'A child JVM that Surefire launches to run a chunk of tests. Four forks = four independent JVMs, each booting its own Spring context, running its chunk sequentially inside itself. Wall-clock ≈ slowest fork, not the sum. Results flow back to the parent over a pipe (which is where the shutdown-deadlock bug lived).' },
        { q: 'Where does Spring fit?', a: 'Spring beans are singletons per context, one context per JVM — a nightmare for thread parallelism, perfectly fine for forks because each fork owns its own set. All four forks boot Spring in parallel, so aggregate startup wall-clock ≈ one boot. The DB is NOT a Spring singleton — it is genuinely shared, which is what the companyId partitioning handles.' },
        { q: 'Why does companyId partitioning give real isolation?', a: 'Multi-tenancy is a production invariant: every query filters WHERE company_id = ?. Two forks on disjoint company ranges share tables but have disjoint visibility — fork 1\u2019s SELECT can never return fork 4\u2019s rows. You are reusing the same mechanism that keeps real customers from seeing each other\u2019s money.' },
        { q: 'How do scenarios and companies actually get assigned?', a: 'Two independent layers. Which fork runs a scenario: Surefire, duration-seeded dynamic pickup at class level. Which company a scenario uses: the fork\u2019s local pool, keyed by fork.id at startup. Neither layer knows about the other; rerun the suite and both assignments can differ — correctness never depends on either.' },
        { q: 'What is a CI pipeline, in one example?', a: 'Push → webhook → CI server runs staged config: checkout (10s) → compile (30s) → unit tests (2m) → integration suite (10m ← the pain) → static checks (1m) → build image (1m). Any stage fails, the PR gate turns red. My fix lived entirely inside stage 4 — same input, same pass/fail guarantees, one-third the wall-clock.' },
        { q: 'Why did counts differ between parallel and sequential?', a: 'Same glob, same discovered scenarios — what differed was REPORTED scenarios. The old sequential reporter silently dropped scenarios that failed very early (a hook/class-loading race); the fork-merge reporting plus my independent per-scenario instrumentation counted honestly. The ghosts ran in both modes; careful counting just finally exposed them.' },
        { q: 'How was the ghost-detector built?', a: 'Cucumber --dry-run gives scenario → step-definition mapping without executing. JavaParser walks each step method\u2019s AST, recording method calls, recursing only into our packages — a BFS over the call graph. Label reachable methods dead via: no longer exists (strongest), @Deprecated, git-untouched in legacy packages, no production callers. Flag scenarios whose whole reachable set is dead. ~500 lines. The idea is the tool; the discipline is that owners approve every deletion.' },
        { q: 'Why do slow queries appear at 8 forks?', a: 'The DB has fixed budgets: max_connections, disk queue depth, one commit log. 8 forks × 20-connection pools = 160 concurrent connections — requests start queuing inside the DB, every query carries invisible wait time. Same query, same data, 50ms → 120ms purely from contention. Parallelism helps until the first shared resource saturates; past that it hurts.' },
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
        options: [
          {
            label: 'Traffic Replay',
            principle: 'Your strongest project — most depth + clearest ownership. Lead with impact, show the hard decision, end with what it taught you.',
            answer:
              "The traffic capture and replay framework. The problem: our project service handles around 100,000 customers a day of financial data, and we needed to make high-risk backend changes — a database migration, a Hibernate upgrade — with confidence they wouldn't break real customer flows. Manual and automated tests only cover cases you thought of; they can't reproduce the shape of real production traffic. So I built a framework that runs a passive parallel server with the change applied and replays real production traffic against it, comparing response parity, data correctness, and latency — without ever touching a customer or a downstream system. The hardest decision was making blast radius zero by construction, not by convention: I mocked all downstream writes at the network layer with a proxy, so even a bug in the application code physically cannot reach production. It backed multiple migrations with zero customer-facing incidents. What I'm proudest of isn't the code — it's that I took it from an idea to a platform other teams used, and it changed how we ship risky changes.",
            notes: 'Default choice. The "zero by construction not convention" line is the senior signal. Have BFS data-validation and TLS-sandwich ready for follow-ups.',
          },
          {
            label: 'CMS Resiliency',
            principle: 'Use when the interviewer signals they want distributed-systems depth, or when you already told the replay story.',
            answer:
              "The resiliency layer for our cross-service project sync. The root problem is subtle: a 'project' in QuickBooks is actually two records in two systems that must agree — a project record in our service and a sub-customer record in the customer-management service, linked by a reference. Every create, update, and inactivate has to land in both. The legacy design had two competing sync paths and, worse, treated a network timeout as a definite failure — when a timeout actually means the outcome is unknown, because the write may have succeeded and only the response was lost. So the systems drifted apart silently, one lost-response at a time. I worked on the redesign: collapse to one authoritative path, and treat every timeout as unknown — reconcile by reading the downstream's actual state before acting, then roll forward if it succeeded or compensate if it didn't. The subtlety I'm proudest of getting right is that you must reconcile before you compensate, because blindly rolling back a call that actually succeeded manufactures the opposite inconsistency. It cut sync failures by around 95%. I'm proud of it because the interesting work was entirely in reasoning about failure, not in the happy path.",
            notes: 'The "reconcile before compensate" point is the senior signal here — it proves you operated the system. Verify your exact slice (STS consumer + reconciliation POC) before over-claiming ownership.',
          },
          {
            label: 'Project Budgets',
            principle: 'Use when the interviewer is product-minded or wants a customer-facing financial-systems story.',
            answer:
              "Project Budgets — decoupling internal cost from customer-facing estimates in QuickBooks. Before it, one form was the source of truth for both what you quote a customer and what a job costs you internally — which is the wrong mental model for construction and professional-services businesses, where internal cost is tracked at far finer granularity than a customer quote. I helped design and ship the separation: budgets became the source of truth for cost, estimates stayed the source of truth for income. What makes me proud of it isn't the UI — it's that changing a source of truth under a live financial product is terrifying, because it touches reporting, migrations, and downstream features. There were something like 1,400 memorized reports that depended on the old cost source, across multiple user cohorts each with a different migration path. Getting that transition to be safe, staged, and reversible — dual-mode reporting during rollout, cohort-by-cohort migration, full backward compatibility — without a single financial-correctness incident, is the part I'm proud of. It's the discipline of changing something load-bearing without anyone falling through the floor.",
            notes: 'The "1,400 memorized reports across cohorts" specific grounds it. Frame the pride around safe migration of a source-of-truth, not around building a form.',
          },
        ],
      },
      {
        q: 'How you choose technologies',
        options: [
          {
            label: 'Traffic Replay',
            principle: 'Reason from constraints, not hype. Name a real decision, the alternatives, the tradeoff. The reasoning structure is what they grade.',
            answer:
              "I start from the constraint, not the technology. Concrete example from the replay framework: for capturing traffic, I chose between instrumenting the application code, a sidecar with GoReplay, or a service-mesh mirror. I chose the sidecar — because the alternative, in-process capture, would have coupled the capture lifecycle to the application's release cycle and put my code in the customer's critical request path, where a bug could add latency or crash the app. The sidecar gave me an independent failure domain, independent rollout, and zero application changes. The cost was a small resource overhead and a network hop, which I accepted because safety and isolation were non-negotiable. My general pattern: name the invariant that can't be violated, pick the option that protects it, and be explicit about what I'm trading away.",
            notes: 'The structure — invariant → option that protects it → what I traded — matters more than the tech.',
          },
          {
            label: 'CMS (API vs Events)',
            principle: 'Use for a distributed-systems flavored version of the same reasoning.',
            answer:
              "On the CMS sync redesign, the core technology decision was synchronous API versus event-driven for keeping the two systems in sync. Events were tempting — looser coupling, better scalability. But I started from the constraint: this is a user-facing action, and the user needs a deterministic outcome immediately, because their very next step depends on the project existing. Event-driven gives eventual consistency, which means a window where the user acts on a project that isn't fully there yet — unacceptable for the action itself. So the user-facing path is a synchronous API for the strong-consistency guarantee. But I didn't make it dogmatic: downstream systems that only need to *know* about the project, and tolerate a little staleness, get it through async events. Two different consistency requirements, two different mechanisms. The lesson: don't pick one technology for the whole system — decompose by the guarantee each part actually needs.",
            notes: 'The "sync where the user waits, async where staleness is fine" decomposition is the senior signal. Ties to your real CMS decision matrix.',
          },
          {
            label: 'Project Budgets (grid)',
            principle: 'Use for a frontend/performance-flavored version.',
            answer:
              "On project budgets, a real technology choice was how to render the budget grid — up to 3,500 rows by 23 columns with a sub-200ms cell-edit requirement. The naive approach, a standard data table that re-renders on every keystroke, would blow the latency budget completely. I chose to reuse the existing FP&A virtualized DataGrid rather than build fresh — because the constraint was a hard perf SLA and that component had already solved virtual scrolling and edit-state isolation under exactly this kind of load. Building my own would have meant re-solving those, slower and buggier. The tradeoff was accepting its abstractions and extension points rather than having full control. I took it because the invariant — the latency SLA — was better served by a battle-tested component than by novelty. General rule: reuse when something already protects your hardest constraint; build only when nothing does.",
            notes: 'The reuse-vs-build reasoning against a perf SLA. Grounds in the real 3500x23 grid and <200ms requirement.',
          },
        ],
      },
      {
        q: 'Leading a project',
        options: [
          {
            label: 'Traffic Replay',
            principle: 'Leadership without authority is the SDE2 sweet spot. Show you drove clarity, sequencing, and unblocking — not that you managed people.',
            answer:
              "The clearest example is the traffic replay framework — I led it without any formal authority. It started as my proposal to solve a validation gap, and I had to bring along multiple stakeholders: the teams whose downstream services I needed to mock, platform folks, and leadership who had to fund a parallel production stack. I led by turning a vague fear — 'we might break something in this migration' — into a concrete, staged plan with clear checkpoints, and by reframing the ask to each team in terms they cared about: I told downstream teams that mocking their services protected them from doubled traffic, rather than asking a favor. When cross-team blockers came up, I owned surfacing them fast and routing them to whoever could unblock. It shipped and backed multiple migrations. The lesson: leading without authority is mostly about converting ambiguity into a plan everyone can see, and making it obviously in each person's interest to help.",
            notes: 'Emphasize converting ambiguity into a shared plan.',
          },
          {
            label: 'AU Launch',
            principle: 'Use when the interviewer wants cross-team coordination at scale rather than a solo-initiative story.',
            answer:
              "The Australia market launch is my best cross-team leadership example. It involved over ten dependent teams, a hard launch date, and no authority over most of the people involved — a new-market launch where a botched first impression against established competitors would be hard to recover from. I helped drive it by making readiness objective instead of a matter of opinion: explicit per-team gates, a clear pre-production cutoff date, and a daily triage of cross-team blockers so nothing festered silently. The leadership judgment was deciding what to gate hardest on — I pushed to gate on the irreversible things, upgrade safety and financial-analytics correctness, and let lower-risk polish flex against the date. It launched on time with no critical issues. Leading at that scale isn't about authority — it's about making the state of the whole system legible so ten teams can self-coordinate against a shared, objective bar.",
            notes: 'The "gate hardest on the irreversible things" judgment is the signal. Verify your actual role on AU before over-claiming — say "helped drive."',
          },
          {
            label: 'Project Budgets',
            principle: 'Use for a story about leading a technically complex feature through to launch.',
            answer:
              "On project budgets I led the frontend architecture and the migration strategy for a change that was far riskier than it looked — moving the source of truth for estimated cost. Leading it meant coordinating across the reporting team, the backend team, and multiple user cohorts with different migration paths. I drove clarity by making the risk concrete and shared: I mapped exactly which reports and cohorts were affected — including the roughly 1,400 memorized reports on the old source — so everyone was reasoning about the same blast radius. Then I sequenced the rollout so the highest-risk, hardest-to-reverse pieces got the most validation and shipped behind dual-mode reporting, and the lower-risk work followed. The feature launched with full backward compatibility and no financial-correctness incidents. Leading here was less about people management and more about making a scary migration legible and staged enough that the whole group could move on it with confidence.",
            notes: 'Leadership-through-clarity on a risky migration. The specific "1,400 reports" number grounds it.',
          },
        ],
      },
    ],
  },
  {
    category: 'Teamwork & Collaboration',
    questions: [
      {
        q: 'Cross-team collaboration',
        options: [
          {
            label: 'Traffic Replay',
            principle: 'Name the tension between teams and how you resolved it through THEIR incentives, not authority.',
            answer:
              "On the replay framework, I needed downstream teams — payments, notifications, and others — to let me mock their services in the parallel stack. Their first instinct was hesitation: more surface area for them, and they didn't own the project. The tension was real. I resolved it by reframing: replaying write traffic against their real services would double their load and risk corrupting their state, so mocking wasn't me asking a favor — it was me protecting their SLAs. Once it was framed as their protection rather than my convenience, the conversations flipped. I also kept the integration contract minimal so onboarding cost them almost nothing. It worked because I led with their incentive, not mine.",
            notes: 'Core move: find what the other team cares about and frame your ask through it.',
          },
          {
            label: 'CMS (with CMS team)',
            principle: 'Use for collaboration on a shared architectural decision rather than a resource ask.',
            answer:
              "On the CMS sync redesign, the key collaboration was with the customer-management team, who owned the service I had to integrate against. The tension: I needed strong-consistency guarantees from their API for the user-facing path, and they had their own roadmap and constraints. Rather than push my design onto them, I brought the actual decision to them — I laid out the API-versus-events tradeoff with the concrete failure modes for each, and we worked through the consistency requirements together. The outcome — synchronous API for the user action, async events downstream — was genuinely a joint decision, which mattered because they had to support the contract long after I moved on. The collaboration worked because I treated their ownership as real and brought them a decision to make together, not a solution to rubber-stamp.",
            notes: 'The move: respect the other team\'s ownership, bring a shared decision not a finished design. Grounds in your real CMS-team coordination.',
          },
          {
            label: 'Consolidated Email (legal + backend)',
            principle: 'Use for collaboration across non-engineering functions.',
            answer:
              "On the consolidated email feature, the interesting cross-team work was with two very different groups: the backend team, who weren't ready with the real APIs when I needed to build the frontend, and legal, who had to sign off on customer-facing email content. For the backend, instead of blocking on them, I built against mocked APIs matching the agreed contract, so both sides could move on their own timelines and integrate cleanly later. For legal, I treated their review as a hard merge gate rather than a last-minute checkbox — I looped them in early on the consolidated email wording and branding, so compliance was designed in, not bolted on. Collaborating across functions taught me to decouple where I can — mocks to unblock engineering dependencies — and to front-load the gates I can't move, like legal, so they never become a surprise at the end.",
            notes: 'Shows collaboration beyond engineering. The decouple-with-mocks + front-load-the-gate moves are both real and senior.',
          },
        ],
      },
      {
        q: 'Teammate was not contributing enough',
        principle: 'Show empathy first, then constructive action, then escalation only if needed. Never throw the teammate under the bus. Assume a reason before assuming fault.',
        answer:
          "[VERIFY — adapt to your real instance] During the project budgets work, a teammate owned the reporting integration — wiring budget data into the existing report infrastructure — and their pieces kept landing late with the classic 'almost done' status for two sprints. It was starting to put the reporting cutover at risk. Before assuming they weren't pulling weight, I asked them to walk me through where they were — genuinely to understand, not to check up. It turned out they were stuck in the legacy reporting code, which is genuinely gnarly territory — a lot of implicit behavior, thin documentation — and they hadn't wanted to flag it because everyone else seemed to be moving fast. So we did two things: I paired with them for a couple of sessions to get them past the specific wall — I'd touched adjacent code and could shortcut a lot of their archaeology — and we re-cut their remaining work into smaller pieces with visible checkpoints, so 'stuck' would become visible in days, not sprints. Their delivery recovered, and the cutover held. My honest takeaway: 'not contributing' is usually 'blocked and not saying so,' and the fix is making it cheap to admit being stuck. Leading with a question instead of a judgment meant it never became a conflict at all.",
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
        principle: 'Show structure and follow-through, not a one-off. Growth of the mentee is the outcome. One concrete teaching moment beats a vague summary.',
        answer:
          "[VERIFY — adapt to your real mentee] When a new engineer joined our team, I owned their ramp-up on the budgeting codebase — which is genuinely hard to ramp on, because it mixes financial-correctness rules with a lot of state: budget versions, locking, sync between draft and published. I gave it structure instead of ad-hoc answers: a weekly check-in, and I sequenced their first tasks deliberately — first a read-only bug in the budget detail view so they learned the data flow with no risk, then a scoped fix in the grid, then a real feature slice. My rule was to never just give the answer. The moment that stuck with me: they hit a save failure that was actually an optimistic-locking conflict — the classic stale-version error — and instead of pointing at it, I asked them to trace what the server was comparing when it rejected the write. It took them a day, but they came back having understood the whole versioning model — why edits fork a revision, why the client carries a sync token. That one day bought months, because after that they could debug that entire class of problem alone. Within a quarter they were reviewing other people's PRs in that area. That shift — from consuming answers to producing them — is the actual outcome of mentoring, and it's something I want more of in my next role.",
        notes: "The optimistic-lock teaching moment is grounded in your real budget versioning work (editSequence / syncToken) — that specificity is what makes it believable. Verify: swap in your actual mentee situation, keep the one-concrete-moment structure.",
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
          "[VERIFY — adapt to your real disagreement] On the replay framework, a backend teammate and I disagreed sharply on how to handle downstream write calls from the parallel server. He wanted to let real writes through but wrap every downstream in an idempotency check, arguing it gave us true end-to-end validation — which was a legitimate point. I argued for mocking all writes at the network layer instead. The disagreement got tense because we'd each half-built our approach. What broke the deadlock: instead of trading opinions, I proposed we list every downstream and check the actual guarantee. We found three of them had no idempotency guarantee at all — a replayed write there could double-charge or corrupt real state, on financial data. Once it was concrete failure cases on a whiteboard instead of 'my design versus yours,' he agreed the blast radius was unacceptable, and we aligned on mocking writes, passing reads through. What made it work was reframing from 'who's right' to 'what's the worst that happens if we're wrong' — and I made a point afterward to credit his idempotency idea, because we did use it for the read-consistency checks. Disagree hard on the idea, stay warm on the person.",
        notes: 'The concrete detail — "three downstreams had no idempotency guarantee" — is what makes this believable. Verify the specifics but keep the shape: opinion-vs-opinion → shared failure-case analysis → align on the risk, credit their idea.',
      },
      {
        q: 'Disagreement with manager',
        principle: 'Respectful pushback with reasoning, willingness to disagree-and-commit if overruled. Never insubordinate, never a pushover. Bring an alternative, not just a no.',
        answer:
          "[VERIFY — adapt to your real instance] The clearest one: during the project budgets migration, there was pressure to turn on the new reporting source-of-truth for all existing users on a fixed date to hit a quarterly goal. My manager wanted the clean cutover. I disagreed — because I'd traced the impact and knew there were something like 1,400 memorized reports across existing users that pulled cost from the old source, and a hard cutover risked those going silently blank on people who ran their business on them. I didn't just say 'this is risky.' I came with the specific failure — 'here's the exact report type that breaks and roughly how many users hit it' — and, importantly, an alternative: a dual-mode rollout where new-source and old-source users coexist behind a flag, so we could ramp by cohort and cut over only when mismatch monitoring was clean. That reframed it from 'ship date versus caution' to 'here's a path that hits the goal without the blast radius.' He agreed and we went dual-mode. Honestly, if he'd heard me out and still chosen the hard cutover, I'd have committed fully and just made the rollback airtight — making your case and then committing is the job. But you earn that pushback being taken seriously by bringing the specific number and the alternative, not just the worry.",
        notes: 'The "1,400 memorized reports" specific is grounded in your real project budgets work — that concrete number is what makes it land. Structure: specific failure + a number + an alternative + disagree-and-commit if overruled.',
      },
      {
        q: 'Handling difficult colleague',
        principle: 'Maturity and de-escalation. Find the legitimate concern under the difficult delivery. Never vent, never make it sound like you have enemies.',
        answer:
          "[VERIFY — adapt if real] On the consolidated email work, I had to integrate with a senior engineer who owned the shared email components, and he was blocking my PRs hard — long lists of change requests, pushing back on almost every approach, and it was slowing me down enough to threaten the timeline. My first instinct was frustration, but I made myself assume there was a real reason rather than that he was being territorial. So I stopped fighting it async in PR comments and asked for 20 minutes face to face. It turned out those shared components were used by several other teams he was responsible for, and he'd been burned before by someone forking them and causing regressions elsewhere — his 'difficulty' was really unmanaged risk. Once I understood that, everything changed: I proposed making the components mode-aware through props instead of forking them, which protected his other consumers, and I started looping him in on the design before writing code rather than presenting him with a finished PR. The review friction basically vanished, and he became one of my most useful reviewers. The lesson I keep: difficult behavior is usually a legitimate concern delivered badly — address the concern and the behavior tends to dissolve.",
        notes: 'Grounded in your real consolidated-email refactor (mode-aware props, shared components). The reveal — "his difficulty was really unmanaged risk from other teams" — is what makes it mature rather than a complaint.',
      },
    ],
  },
  {
    category: 'Problem Solving',
    questions: [
      {
        q: 'Choosing best solution',
        options: [
          {
            label: 'Traffic Replay (BFS)',
            principle: 'Show structured evaluation: options, criteria, tradeoff, decision. The data-validation choice is perfect.',
            answer:
              "Best example is how I validate data parity in the replay framework. The naive option — diffing whole database tables between the two systems — is correct but completely infeasible at terabyte scale, and mostly meaningless because 99.99% of rows have nothing to do with the request being validated. I needed to compare exactly the rows one request touched. The insight was that a relational schema is really a graph — rows are nodes, foreign keys are edges — so the rows a single write touches form a small connected subgraph hanging off one parent record. I traverse that with a breadth-first search from the request's parent record, bounded by a time window, giving me exactly the impacted rows at a cost proportional to what the request touched — tens of rows, not the whole table. I chose it because it was the only option both correct and feasible at scale. The criteria were correctness, cost at 32TB, and semantic meaningfulness — and the graph traversal was the only one satisfying all three.",
            notes: 'The schema-is-a-graph insight is the impressive part — land it clearly.',
          },
          {
            label: 'CMS (reconcile vs rollback)',
            principle: 'Use for a solution-choice under correctness pressure in a distributed system.',
            answer:
              "On the CMS resiliency work, the key solution choice was how to handle a write that times out mid-operation. The obvious option was: on timeout, roll back — undo what you did and report failure. But I realized that's actively wrong, because a timeout doesn't mean the write failed; it means the outcome is unknown — it may have succeeded and just lost the response. If you blindly roll back a call that actually succeeded, you create the opposite inconsistency. So I evaluated three options: assume-failure-and-rollback (creates drift), assume-success-and-continue (also creates drift the other way), or reconcile-then-decide. I chose reconcile: read the downstream's actual state first, then roll forward if it succeeded or compensate if it didn't. The criteria were correctness under every possible true outcome and no manufactured inconsistencies — and only reconciliation satisfied both. The best solution was the one that refused to guess.",
            notes: 'The reconcile-before-compensate reasoning as a structured 3-option evaluation. Very strong for "choosing best solution."',
          },
          {
            label: 'Consolidated Email (toggle vs force)',
            principle: 'Use for a product-correctness solution choice with backward-compatibility stakes.',
            answer:
              "On consolidated email, the solution choice was how to change a load-bearing notification behavior without breaking the people who relied on the old one. The tempting option was to just switch everyone to consolidated — cleaner, one code path. But existing users had built real processes around per-transaction emails, and a silent behavior change on notifications is trust-ending. So I evaluated: force-migrate everyone (breaks existing workflows), fork into two separate email pipelines (drifts and rots on the first divergent bug fix), or a single mode-aware code path with a per-workflow preference defaulting to the old behavior. I chose the third — one set of shared components made mode-aware through props, opt-in to the new mode, percentage-gated rollout. The criteria were zero breakage for existing users and maintainability over time, and only the mode-aware single-path option satisfied both. The best solution protected trust and avoided a maintenance fork at the same time.",
            notes: 'Three-option evaluation grounded in the real refactor-vs-fork decision. The "silent behavior change is trust-ending" framing is the signal.',
          },
        ],
      },
      {
        q: 'Production outage handling',
        options: [
          {
            label: 'CMS resiliency',
            principle: 'Calm, structured: detect → mitigate → root-cause → prevent. Stop the bleeding before finding the cause.',
            answer:
              "[VERIFY — anchor to a real incident if you have one] My instinct on any production issue is mitigate first, diagnose second — stop customer impact before satisfying curiosity about the cause. On the resiliency work for our cross-service sync, the whole design was built around exactly this kind of failure: when a call to the customer-management service times out mid-operation, you're in an unknown state — the write may have succeeded or failed. The wrong move is to guess. So the pattern I built was: detect the failure within a bounded timeout, treat the outcome as unknown, then reconcile by reading the actual downstream state before taking any corrective action — because blindly rolling back a call that actually succeeded creates the opposite inconsistency. That reconcile-before-you-act discipline is exactly how I approach outages: contain, find ground truth, then act on facts, not assumptions.",
            notes: 'If you have a real outage you personally handled, use it. This frames your resiliency work as your outage philosophy. "Mitigate before diagnose" is the key phrase.',
          },
          {
            label: 'Replay as prevention',
            principle: 'Use to reframe: the best outage handling is the outage that never ships. Shows preventive maturity.',
            answer:
              "My honest answer is that I've invested more in preventing outages than in heroics during them — because for the class of change I worked on, an outage on financial data is something you cannot fully clean up after. That's the entire reason I built the replay framework: the risky backend migrations we were doing were exactly the kind that cause a slow, ugly production incident — data subtly wrong in ways you don't notice until customers do. So rather than get good at firefighting those, I made them not happen: validate the change against real production traffic, catch the regression as a diff in a report before release, and ship with evidence instead of hope. When something does slip through in general, the discipline is the same as everyone's — mitigate first, then root-cause — but the higher-leverage move I care about is catching the failure before it's ever in front of a customer. The best incident response is the incident that never shipped.",
            notes: 'Reframes toward prevention — a legitimate senior stance. Good if you genuinely lack a big personal outage story; don\'t invent one.',
          },
          {
            label: 'Budget import (async failure)',
            principle: 'Use for a graceful-degradation angle on handling failures in a live feature.',
            answer:
              "[VERIFY — adapt to real behavior] On the AI budget import, a relevant failure mode was the AI extraction service being slow or failing outright — which, if handled naively, would hang or break the user's flow in a live feature. The design principle I care about there is graceful degradation: the document goes through an explicit status state machine, server-authoritative, so a failure lands in a clean EXTRACTION_FAILED state rather than an ambiguous hang, and the user can retry or fall back to manual entry instead of being stuck. And because the status lives on the server, it survives the user closing their browser — the failure is recoverable, not silent. Handling failures in a live feature, to me, is about making sure every failure mode has a defined, recoverable state the user can see and act on — never an ambiguous hang and never silent data loss.",
            notes: 'Graceful-degradation angle. Verify the actual state-machine behavior before claiming detail. Good variety from the CMS story.',
          },
        ],
      },
      {
        q: 'Made decision with incomplete information',
        options: [
          {
            label: 'CMS timeout',
            principle: 'Act under uncertainty with a reversible bet + a way to learn. Not reckless, not paralyzed.',
            answer:
              "The entire timeout-handling design in the resiliency project is a decision under incomplete information — that's literally the problem. When a cross-service call times out, you fundamentally cannot know whether it succeeded; the information is unavailable by nature. The wrong response is to freeze or to guess. What I did was design the system to make the missing information discoverable: every call carries a correlation ID, so after a timeout I can go read the actual state and turn 'unknown' into 'known' before acting. Where I couldn't fully resolve it, I made the corrective action safe under either outcome — idempotent retries that do no harm if the original actually succeeded. My general approach to incomplete information: prefer decisions that are either reversible or that create a path to the missing facts, rather than betting big on a guess.",
            notes: 'Reframes the CMS reconciliation work as decision-under-uncertainty. "Reversible bet or a path to the missing facts" is the principle.',
          },
          {
            label: 'Project Budgets (rollout)',
            principle: 'Use for a product/rollout decision made without full data.',
            answer:
              "[VERIFY — adapt to real rollout data] On the project budgets migration, we had to decide how aggressively to roll out the new reporting source without complete information about how every user cohort actually depended on the old reports — we knew the rough shape, roughly 1,400 memorized reports affected, but not the full behavior of every cohort in production. Rather than wait for perfect information that would never come, or gamble on a full cutover, I chose the reversible path: dual-mode reporting and a cohort-by-cohort rollout with mismatch monitoring. That way each stage produced the very information we were missing — real production signal on whether cohorts broke — before we widened. The decision was structured so that acting was also how we learned, and every step was reversible if the signal was bad. Under incomplete information, I'd rather make a small reversible move that generates the missing data than wait for certainty that isn't coming.",
            notes: 'Staged, reversible rollout as decision-under-uncertainty. Verify the specifics. "Acting was also how we learned" is the signal.',
          },
          {
            label: 'Replay data scoping',
            principle: 'Use for a design decision made under uncertainty about data shape/scale.',
            answer:
              "A more technical version: when I designed the data-parity validation for the replay framework, I didn't have complete information about exactly which tables and rows each workflow would touch — the schema was large and the access patterns varied by request. I couldn't enumerate it all up front. So instead of trying to, I designed for the uncertainty: a bounded breadth-first traversal from the request's parent record, following foreign keys outward, with the scope constrained by a time window and per-workflow configuration. It discovers the impacted rows dynamically rather than requiring me to know them in advance, and the bounds keep it safe even when a workflow touches more than I expected. Designing under incomplete information often means building something that discovers what it needs at runtime, with guardrails, instead of demanding complete knowledge before you start.",
            notes: 'Design-for-discovery under uncertainty. Ties to the real BFS scoping. Good technical variety from the two consistency-flavored answers.',
          },
        ],
      },
      {
        q: 'Automating repetitive tasks',
        options: [
          {
            label: 'Traffic Replay',
            principle: 'The whole framework IS this — it automated away thousands of hours of manual regression testing.',
            answer:
              "The traffic replay framework is fundamentally an automation story. Before it, validating a risky backend change meant huge amounts of manual regression testing — engineers hand-crafting test cases that could never cover the real shape of production traffic, and still leaving blind spots. I automated the whole validation loop: capture real production traffic, replay it against the changed system, and automatically compare responses, data, and latency — surfacing regressions as a report instead of a customer incident. It saved on the order of a thousand-plus hours of manual regression work across initiatives [VERIFY exact figure], but the bigger win was qualitative — it turned 'test what we thought of and hope' into 'validated against real traffic before release.' I look for exactly these leverage points: repetitive, error-prone manual work that, automated well, changes not just the effort but the confidence level of the whole team.",
            notes: 'The qualitative reframe (changed the confidence level, not just effort) is the senior touch. Verify the hours figure.',
          },
          {
            label: 'AI Budget Import',
            principle: 'Use for an automation story with an AI/human-in-the-loop angle.',
            answer:
              "The AI-assisted budget import is an automation story with a twist. Creating a project budget from scratch was around 30 minutes of manual data entry, and most users rebuilt very similar budgets over and over. I worked on automating that: upload a spreadsheet, an AI service extracts the line items and matches them against the company's existing products and services, and the user just reviews. But the interesting part is what I deliberately did *not* fully automate — because the output lands in financial records, and AI extraction is probabilistic. So instead of auto-committing everything, the system classifies each match by confidence and only asks the human to review the uncertain rows. It automated the 30-minute grind down to an upload-plus-review while keeping a human gate exactly where wrong data would be expensive. That's my philosophy on automation: automate the repetitive bulk, but keep a human checkpoint wherever an automated mistake is costly and silent.",
            notes: 'The "automate the bulk, keep a human gate where mistakes are costly" framing is mature. Verify your actual slice on AI import.',
          },
          {
            label: 'Consolidated Email (mocks)',
            principle: 'Use for a smaller, dev-workflow automation angle if the others are used.',
            answer:
              "A smaller but real example is from the consolidated email work. The backend APIs I depended on weren't ready, which would normally mean repeatedly blocking, waiting, and hand-testing against a moving target. Instead I built a mock layer matching the agreed API contract, which let me develop and test the entire frontend automatically against stable, predictable responses — no manual coordination cycle every time I needed to check a case. It removed the repetitive block-and-wait loop and kept the release on schedule, and when the real backend landed, integration was clean because both sides had built to the same contract. Automating away a repetitive coordination bottleneck can be as valuable as automating a data task — it's about removing the friction that slows the whole team down.",
            notes: 'Reframes mocks as automating-away-a-bottleneck. Good lighter-weight option grounded in real consolidated-email work.',
          },
        ],
      },
    ],
  },
  {
    category: 'Adaptability & Learning',
    questions: [
      {
        q: 'Quickly learning a new technology',
        options: [
          {
            label: 'Traffic Replay',
            principle: 'Show a learning METHOD, not just "I learned X." How you ramp is the transferable signal.',
            answer:
              "The replay framework forced me to ramp fast on a stack I hadn't used deeply — GoReplay for capture, Envoy and Wiremock for downstream mocking, Kafka for transport, all at once. My method is to learn from the constraint inward rather than reading docs end to end: I started from what the system had to guarantee — capture HTTP-level traffic without touching the app, mock writes with zero blast radius, pair requests with responses reliably — and learned exactly the part of each tool that served that guarantee. For Kafka, that meant going deep on partitioning and ordering because request-response pairing depended on it, and staying shallow on the rest until I needed it. Learning against a concrete requirement makes it stick and stops you drowning in a tool's full surface area. Within a few weeks I understood these well enough to make real architectural decisions with them.",
            notes: '"Learn from the constraint inward" is a genuinely good, memorable learning method. That method IS the answer.',
          },
          {
            label: 'AI / QBAI',
            principle: 'Use when you want to show you can ramp on an unfamiliar DOMAIN (AI/ML), not just a tool.',
            answer:
              "The AI budget import made me ramp fast on a whole domain I hadn't worked in — how AI extraction and semantic matching actually work. I couldn't design the review experience well without understanding why the AI behaved the way it did. My method was the same as always: learn from the concrete problem inward. I didn't try to learn machine learning broadly; I learned exactly what the seam demanded — why extraction is probabilistic, why matching uses embeddings and similarity scores rather than string equality, why confidence thresholds map to the review tiers, and why the latency profile forces an async pattern. I went deep on precisely those, because those were the concepts my design decisions actually rested on. That focused ramp let me reason about an AI system and design around its failure modes within the project timeline, despite starting from a backend background.",
            notes: 'Shows domain-ramp, not just tool-ramp. Same "learn from the concrete problem inward" method. Verify your AI-import slice.',
          },
          {
            label: 'DB Migration internals',
            principle: 'Use for a fundamentals-depth version — learning the guts of a database engine.',
            answer:
              "For the database migration validation, I had to get deep, fast, on the internals of two different database engines — because the bugs in a migration live precisely in the subtle differences between them. I couldn't validate parity without understanding where the engines diverge. So I learned from the failure modes inward: I went deep specifically on the things that silently differ — isolation-level semantics, collation and sort-order behavior, sequence and auto-increment handling, type coercion edge cases — because those are exactly where a migrated query returns different results without erroring. I skipped the parts that didn't affect correctness. Learning targeted at 'where will this silently break' rather than 'read the whole manual' let me build validation that caught real divergences fast. My general rule: when learning something new under time pressure, learn toward the failure modes, not front-to-back.",
            notes: 'Fundamentals-depth version. "Learn toward the failure modes" is the memorable method. Verify which engines/specifics before claiming detail.',
          },
        ],
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
          "[VERIFY — adapt to your real slip] On the AI budget import, I committed to a date for the async document-processing flow and slipped it by about two weeks. The honest root cause: I estimated it as 'wire the upload to the extraction service and poll for status' — but the real complexity was in the states I hadn't planned for. What happens if the user closes the browser mid-extraction? If extraction fails halfway? If they cancel and re-upload? Each of those forced changes to the status model, and I discovered them one at a time during development instead of upfront — so my estimate was for the happy path and the work was mostly in the unhappy paths. The second mistake was that I didn't surface the risk until the slip was certain, which left my lead with no room to adjust. What we did: I owned it directly, we re-scoped to ship the synchronous version behind a flag on the original date — real user value, simpler flow — and fast-followed with the async version. Two lessons that actually changed how I work: I now estimate the failure paths explicitly, because in anything involving external services the unhappy paths ARE the work; and I flag 'this might slip and here's why' the moment I smell it, not when it's certain — early visibility gives everyone options a late surprise doesn't.",
        notes: "Grounded in your real V1-sync/V2-async generational rollout — the shipped-sync-first detail is true to the architecture, which makes the story credible. The two named lessons are what they are grading.",
      },
    ],
  },
  {
    category: 'Leadership & Initiative',
    questions: [
      {
        q: 'Leading without asking',
        options: [
          {
            label: 'Traffic Replay',
            principle: 'The framework started as YOUR initiative to fill a gap nobody assigned. That IS this answer.',
            answer:
              "The replay framework is exactly this. Nobody assigned it — I saw the gap. We had high-risk migrations coming and no reliable way to validate them against real customer traffic, and I was uncomfortable with the blind risk we were carrying. Rather than wait for someone to solve it, I scoped the idea, prototyped enough to prove it was feasible, and brought a concrete proposal to my lead instead of just raising a concern. Then I drove it across the teams whose buy-in I needed. The initiative wasn't just building it — it was recognizing the risk was real before it turned into an incident, and owning a problem that technically wasn't anyone's assigned job. It ended up used across multiple migrations. The highest-leverage work is often the thing you notice is missing and decide to own.",
            notes: 'Your best initiative story. Emphasize: saw the gap, prototyped proof, brought a proposal not a complaint.',
          },
          {
            label: 'Budget Versioning',
            principle: 'Use for a smaller, more contained initiative — spotting a correctness gap and closing it.',
            answer:
              "[VERIFY — confirm this was your initiative] On project budgets, I pushed for proper versioning before anyone asked for it. The feature shipped with budgets being editable in place, and I was uncomfortable with that, because a published budget is a financial record that people act on — if someone edits it later, the version that was approved is just gone, and there's no audit trail. Nobody had flagged this as a problem yet. Rather than wait for it to become an incident, I made the case for copy-on-write versioning: editing a published budget should fork an immutable new revision and keep the old one as history. I laid out the risk concretely and proposed the design. Taking initiative here meant seeing a latent correctness gap — the kind that doesn't hurt until it suddenly does in an audit — and owning it before it bit us.",
            notes: 'Verify this was genuinely your initiative vs assigned. Frame around spotting a latent audit/correctness gap. Grounds in the real versioning work.',
          },
          {
            label: 'Conceptual foundations prep',
            principle: 'Use ONLY if a lighter, learning-culture example fits — e.g. improving team knowledge or docs unprompted.',
            answer:
              "[VERIFY — use a real instance] A lighter example: on the replay framework, I noticed that the reasoning behind key design decisions — why the Nginx sandwich, why the partition key, why mock at the network layer — lived only in my head, which meant the framework was hard for other teams to onboard onto or extend safely. Nobody asked me to fix that. But I could see it would become a bottleneck as more teams adopted it. So I took the initiative to document the design decisions as first-principles reasoning — not just what the system does, but why each choice was the only safe option — so another engineer could extend it without re-deriving everything or introducing a subtle blast-radius bug. Initiative isn't always a big new system; sometimes it's noticing that critical knowledge is trapped and deciding to free it before it costs the team.",
            notes: 'Softer initiative example about knowledge-sharing. Verify against a real instance; adapt to actual docs/mentoring you did.',
          },
        ],
      },
      {
        q: 'Going above and beyond',
        options: [
          {
            label: 'Traffic Replay',
            principle: 'Discretionary effort that created outsized impact. You built a platform, not a one-off.',
            answer:
              "When I built the replay framework, the minimum ask was to validate one specific migration. I could have built a narrow, throwaway tool for exactly that one job. Instead I built it as a general-purpose platform — protocol-agnostic capture, a reusable comparison engine, configuration-driven onboarding — because I could see the same validation gap would exist for the next risky change, and the one after that. That was more work up front for a problem nobody was asking me to solve yet. But it meant the framework went on to back multiple initiatives — a database migration, a Hibernate upgrade, and others — and became the way the org de-risks this class of change. Going above and beyond, to me, isn't heroics or hours; it's solving the general problem when you were only asked to solve the specific one, when you can see the leverage.",
            notes: '"Solve the general problem when asked for the specific one" is a crisp, senior definition. Much stronger than "I worked weekends."',
          },
          {
            label: 'Project Budgets (downgrade path)',
            principle: 'Use for above-and-beyond as anticipating an edge case others would have skipped.',
            answer:
              "[VERIFY — confirm you drove this] On project budgets, the above-and-beyond piece was the downgrade path. The core ask was to launch budgets for users on the higher tier. What nobody was really pushing on was what happens when a user *downgrades* — their budget data would be stranded or lost, which is a quiet, nasty way to break trust with a paying customer. It would have been easy to ship the launch and treat downgrade as a later problem. Instead I pushed to handle it up front: a reverse-migration that preserves the user's budget data even when they drop to a tier without the feature, so nothing is silently destroyed. It was extra work for an edge case most launches would have deferred — but on financial data, silently losing someone's work is exactly the kind of trust failure you can't undo. Going above and beyond here was refusing to leave a data-loss edge case for 'later.'",
            notes: 'Verify you actually drove the downgrade/reverse-migration. The "refused to leave a data-loss edge for later" framing is strong and grounded.',
          },
          {
            label: 'Consolidated Email (CSAT)',
            principle: 'Use for a customer-empathy flavored above-and-beyond.',
            answer:
              "On consolidated email, the minimum ask was to add a consolidated option. But I went further on making sure it actually served users rather than just shipping the toggle. I dug into why the first version of the experience had underperformed — it had ignored user preference and had compliance gaps — and made the case for building it around real user choice, per-workflow preferences, and legal-reviewed content, rather than a quick forced rollout. That was more work than the minimum feature, but it's the difference between shipping something and shipping something people actually adopt. It moved notification-experience satisfaction up meaningfully [VERIFY ~40% CSAT]. Going above and beyond was caring whether the feature earned adoption, not just whether it shipped.",
            notes: 'Customer-empathy angle. Verify the CSAT figure. The "caring whether it earned adoption, not just shipped" framing is the signal.',
          },
        ],
      },
    ],
  },
  {
    category: 'Handling Failure & Feedback',
    questions: [
      {
        q: 'Receiving critical feedback',
        principle: 'Show you take it non-defensively, act on it, and it made you better. Pick real, non-fatal feedback — a working-style gap, not a competence gap.',
        answer:
          "[VERIFY — adapt to your real feedback] The feedback that changed how I work came from my manager early in the replay framework. I'd gone heads-down and built a working capture prototype before I'd properly socialized the approach — and when I finally presented it, the downstream teams raised concerns I hadn't accounted for, like how mocked responses would be kept in sync with their evolving API contracts. My manager's feedback was direct: the prototype was good, but I'd optimized for building speed over alignment, and now I was defending a design instead of shaping one with the people who had context I lacked. My first instinct was mild defensiveness — the prototype worked — but he was right: being right is not the same as being aligned, and I'd burned time building things I then had to rework. The change I made was concrete: for everything significant since, I write a one-pager with the approach and the tradeoffs and circulate it BEFORE I write real code — I did exactly that for the downstream-mocking design and the data-validation approach, and the feedback on those one-pagers caught issues in an afternoon that would have cost me weeks in code. I've come to actively want that kind of feedback, because it catches the blind spots I structurally cannot see myself.",
        notes: "The one-pager-before-code change is the concrete behavioral proof. The mocked-contract-drift concern is a real issue in your architecture, which makes the story ring true. Verify against what actually happened.",
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
          "[VERIFY — adapt to your real failure] A failure I own completely was on the consolidated email work. The feature let users choose consolidated versus individual emails per workflow, and in my first implementation I resolved that preference at the moment the user toggled the setting. It seemed obviously correct. What I hadn't thought through: emails that were already queued or scheduled when the toggle flipped. In testing before wide rollout we found in-flight emails behaving inconsistently — some went out in the old mode, some in the new, depending on where they were in the pipeline when the setting changed. The failure was not the bug itself; it was that I had never asked the question 'WHEN should this preference be read?' I'd assumed the answer instead of noticing there was a decision there at all. The fix was to resolve the preference at execution time — the moment an email is actually sent — which makes behavior deterministic no matter when the user toggles. I had to rework a chunk of the delivery path, and it cost us schedule. The durable lesson: for any setting or piece of state, the question 'at what moment is this read, and what is in flight when it changes' is now something I ask at design time, every time. Getting that wrong once, cheaply, in testing — rather than in production — made me permanently better at designing state transitions.",
        notes: "Grounded in a REAL design detail of your project — the preference genuinely resolves at execution time, so this failure story explains WHY that design exists. That coherence is what makes it credible. Verify whether this matches what actually happened, and adjust.",
      },
    ],
  },
  {
    category: 'Communication Skills',
    questions: [
      {
        q: 'Explaining to non-technical',
        options: [
          {
            label: 'Traffic Replay',
            principle: 'Translate via analogy and audience-framing. Pick a genuinely technical thing you simplified.',
            answer:
              "I had to explain the replay framework to non-technical stakeholders to justify funding a parallel production stack. The technical version — sidecars, traffic mirroring, downstream mocking — means nothing to them. So I used an analogy: it's like a flight simulator for our production system. We take the real conditions pilots actually face — real customer traffic — and let a new version of the plane fly through them in a simulator, where a crash hurts no one, before we ever put real passengers on it. Then I connected it to what they cared about: this is how we make risky changes without betting the customer experience on them. My principle is to lead with what the listener cares about — for them it was risk and customer trust, not architecture — and reach for an analogy from a world they already understand.",
            notes: 'The flight-simulator analogy is genuinely good and reusable. Lead with what THEY care about, borrow an analogy from their world.',
          },
          {
            label: 'CMS timeout',
            principle: 'Use for explaining a subtle distributed-systems idea to a non-technical audience.',
            answer:
              "I had to explain the CMS timeout problem to non-technical stakeholders to justify the resiliency investment, and 'distributed transaction reconciliation' means nothing to them. So I used an everyday analogy: imagine you send an important letter and never hear back. You don't actually know if it arrived and the reply got lost, or if it never arrived at all — and the wrong move is to assume one or the other and act on the guess. If you assume it failed and re-send, but it actually arrived, now there are two letters causing confusion. What we built is a way to 'call and check what actually happened' before doing anything, so we never act on a guess. Then I tied it to their concern: this is why customer data stays consistent instead of quietly going wrong. The principle is the same — borrow a situation from their life, and connect it to the outcome they care about.",
            notes: 'The lost-letter analogy makes the Two Generals problem intuitive. Same principle: everyday analogy + their outcome.',
          },
          {
            label: 'Project Budgets',
            principle: 'Use for explaining a product/data concept to a business stakeholder.',
            answer:
              "On project budgets I often had to explain to non-technical stakeholders why we were 'splitting one thing into two' — separating the cost budget from the customer estimate — which sounds like extra complexity to a business audience. So I framed it in their world: I said it's like the difference between the price you quote a customer and your own internal spreadsheet of what the job will actually cost you to deliver. You'd never hand your customer your cost breakdown, and you'd never run your business off the customer-facing quote — they're two different documents for two different purposes, and jamming them into one form is exactly why people were leaving to use spreadsheets. Once it was 'the quote versus your own cost sheet,' the reason for the split was obvious to them. Lead with a distinction they already live with, not the system design.",
            notes: 'The "customer quote vs your own cost sheet" framing makes the PB/PE split instantly intuitive to a business audience.',
          },
        ],
      },
      {
        q: 'Presenting to leadership',
        options: [
          {
            label: 'Traffic Replay',
            principle: 'Lead with the decision/ask and impact, not the technical journey. Executives want the "so what" first.',
            answer:
              "When I've presented to leadership — for instance to get buy-in and resourcing for the replay framework — I've learned to invert how engineers naturally talk. My instinct is to build up from technical detail to the conclusion; leadership needs the opposite. So I lead with the decision and the stakes: 'we're carrying real risk on these migrations, here's a way to eliminate it, here's what it costs and what it saves,' and I put the number and the ask in the first thirty seconds. Then I go one level down into how it works, and I keep the deep technical detail in reserve for questions rather than the main line. I frame everything in their terms — risk reduction, incidents avoided, engineering hours saved — not the architecture I find interesting. Conclusion first, tailored to what they're deciding, detail on demand.",
            notes: '"Conclusion first, detail on demand" is the executive-communication principle. The engineer-instinct contrast shows self-awareness.',
          },
          {
            label: 'Project Budgets (risk)',
            principle: 'Use for presenting a risk/migration decision to leadership.',
            answer:
              "On project budgets I had to present the migration risk to leadership who were focused on the launch date. Same principle — lead with what they're deciding, not the technical detail. I opened with the decision and the stakes in plain terms: 'we can hit the date with a hard cutover, but here's the specific risk — roughly 1,400 existing reports could break for paying customers — and here's an alternative that hits the date without that risk.' I put the number and the recommendation first, then went one level into the dual-mode rollout mechanism, and kept the deeper migration detail for questions. Framing it as a business risk decision with a clear recommendation — rather than a technical explanation — got a fast, aligned decision. Leadership wants the tradeoff and your recommendation up front, not the architecture.",
            notes: 'Same conclusion-first principle applied to a risk decision. The "1,400 reports" specific gives it weight.',
          },
          {
            label: 'CMS (outcome)',
            principle: 'Use for presenting a completed technical win in business terms.',
            answer:
              "When I presented the CMS resiliency outcome to leadership, the temptation was to walk them through the elegant timeout-reconciliation design — which they don't care about. So I led with the result in their terms: 'we cut sync failures by around 95%, which means far fewer cases of customer project data silently going inconsistent.' That's the so-what. Then I gave one level of how — 'the old system guessed on network timeouts and guessed wrong; the new one checks what actually happened before acting' — in a single sentence, and left the distributed-systems depth for anyone who asked. The discipline is translating a technical achievement into the business outcome it produced, and trusting that the depth is there if they want to pull on it.",
            notes: 'Translating a technical win into a business outcome. "95% fewer silent inconsistencies" is the leadership-facing number.',
          },
        ],
      },
    ],
  },
];

/* ============================================================================
 * FULL CONTEXT — first-principles teaching stories, beginning to end
 * Simple language. Read a project here when you want to re-understand it,
 * not just recall it. Sections build on each other — read top to bottom.
 * ========================================================================== */

const FULL_CONTEXT = {
  'traffic-replay': {
    title: 'Traffic Capture & Replay',
    subtitle: 'How to test risky changes against reality without touching a single customer',
    sections: [
      { h: 'The problem in plain words', body: [
        "You need to make a dangerous backend change — swap the database engine, upgrade Hibernate, exit Oracle. The service handles ~100k customers a day of financial data. How do you know the change will not break real customer flows?",
        "Tests only cover the cases someone thought of. Real production traffic has a shape no test suite reproduces: weird payloads, rare workflows, bursts, edge cases nobody imagined. The only realistic test surface is production itself — but you obviously cannot experiment on customers.",
        "So the question, reduced: how do you get production-scale truth without production-scale risk?",
      ]},
      { h: 'The core idea', body: [
        "Run a second, parallel copy of the service with the risky change applied. Capture real production traffic as it flows to the real service, and replay the same traffic against the parallel copy. Compare three things: are the responses the same (response parity), is the data written the same (data parity), and is it as fast (latency parity). The customer only ever talks to the real service; the parallel one is a shadow.",
        "The analogy that lands with anyone: it is a flight simulator for production. Real flight conditions, a new version of the plane, and a crash hurts no one.",
      ]},
      { h: 'Capturing traffic: the sidecar and the Nginx sandwich', body: [
        "First problem: how do you capture traffic without touching the application? Putting capture code inside the app couples it to the release cycle and puts your code in the customer's critical path — a bug there adds latency or crashes the app. So capture lives in a sidecar: a separate process in the same pod, using GoReplay, with its own failure domain. If the sidecar dies, customers feel nothing.",
        "Second problem: traffic is encrypted (TLS). GoReplay captures packets — it cannot read encrypted bytes, and it never does any encrypting or decrypting itself. The solution is a sandwich inside the pod: the load balancer routes to the pod → Nginx #1 terminates TLS (decrypts) → GoReplay passively watches the now-plaintext traffic → Nginx #2 re-encrypts → the app receives it as normal. Ports 9443 in, 8443 out, roughly 10% overhead.",
        "The security point to land: plaintext exists ONLY inside the pod. The trust boundary is the pod boundary — a physical boundary, not a policy. Traffic on the wire outside the pod is always encrypted.",
      ]},
      { h: 'Moving traffic: Kafka and the pairing trick', body: [
        "Captured requests and responses travel to the replay system over a Kafka bus (payloads additionally encrypted with IDPS — separate from TLS, which only protects data in transit). The subtle problem: a request and its response are captured as two separate events, and you must pair them back together to know what the real system answered.",
        "The trick is the partition key: transaction_id. Kafka guarantees that all messages with the same key land in the same partition (hash(key) % partitions), a partition is consumed by exactly one consumer, and order within a partition is preserved. So a request and its response always arrive at the same consumer, in order — pairing becomes trivial. Choose the key right and the hard problem disappears.",
      ]},
      { h: 'Replaying safely: why writes are mocked and reads are not', body: [
        "The parallel service, processing a replayed request, will try to call downstream services — payments, notifications. If those calls go through, you double-charge customers and duplicate emails. That must be impossible, not just unlikely.",
        "So an Envoy egress proxy intercepts every outbound call from the parallel stack, and Wiremock returns fake responses for WRITES. Reads pass through — a read is side-effect-free, worst case some extra read load, never corruption. Writes are mocked at the NETWORK layer, which is the key phrase: even a bug in the application code physically cannot reach a production write endpoint, because the network path does not exist. Blast radius is zero by construction, not by convention.",
      ]},
      { h: 'Data parity: the schema is a graph', body: [
        "Response parity is easy — compare two HTTP responses. Data parity is the hard one: did the replayed request write the same rows to the parallel database that the original wrote to production? You cannot diff whole tables — 32TB, and 99.99% of rows have nothing to do with this request.",
        "The insight: a relational schema IS a graph. Rows are nodes; foreign keys are edges. The rows one write touches form a small connected subgraph hanging off one parent record. So: BFS starting from (tenant_id, parent_record_id), following foreign keys outward. Each BFS LEVEL is one SQL query — there is no in-memory graph; getNeighbors() is literally a SQL query following FKs. Bounded by a time window (request_timestamp ± delta) and a per-workflow table config. Cost proportional to what the request touched — tens of rows, not terabytes.",
        "Compare the two row-sets ignoring variable fields — generated IDs and timestamps differ by design between two runs; normalizing them out is what makes the comparison meaningful instead of noisy.",
      ]},
      { h: 'The cloned database', body: [
        "The parallel service needs its own database. It is cloned weekly from production via a storage-level copy-on-write snapshot — cheap, fast, no live replication. No replication is deliberate: the replay must own ALL writes to its DB, or you cannot attribute a row to the replay. Staleness is fine because every compared row was just created by the replay itself, inside the time window.",
      ]},
      { h: 'Latency and load', body: [
        "Latency parity uses per-workflow TP90/95/99 percentiles — averages hide tail regressions, and the tail is where customers hurt. The framework also does load testing by compressing inter-arrival gaps between captured requests, replaying at 0.5x, 2x, or 3x real traffic speed — real traffic shape, synthetic intensity.",
      ]},
      { h: 'Impact and the general-purpose framing', body: [
        "Crucial framing: this is a general-purpose validation platform, not a tool for one migration. It backed the Oracle exit (70+ releases), the Hibernate upgrade (200+ hours saved), and MySQL→Postgres — over 1M requests/day capability, 1000+ manual hours saved, zero P0/P1 incidents. When you open with it, say 'validation platform' first and name migrations as examples, or the interviewer will box it as a one-off script.",
      ]},
    ],
  },

  'cms-migration': {
    title: 'CMS Migration & Cross-Service Resiliency',
    subtitle: 'One concept, two records, and what a timeout really means',
    sections: [
      { h: 'What a project physically is', body: [
        "To a customer, a project — Bella's Kitchen renovation — is one thing. Inside Intuit it is TWO records in two services that do not share a database: a project record in IPM (name, dates, budgets, estimates) and a sub-customer record in CMS, linked by a projectRef.",
        "Why two? Because the transaction and reporting layer of QuickBooks — invoices, bills, payments — predates Projects and only understands customers and sub-customers. The sub-customer record is the adapter that lets a project participate in the money layer. Every problem in this story is a consequence of one idea living in two places that must agree.",
      ]},
      { h: 'The three problems of the old world', body: [
        "Problem 1 — two racing sync paths. Sync between IPM and CMS ran on two code paths simultaneously: direct monolith APIs plus a v4 fallback event. Both could fire for one change; one could succeed while the other failed; they could write in different orders. Result: drift — the two records slowly disagreeing about the truth. The redundancy designed to prevent inconsistency became its source.",
        "Problem 2 — timeouts treated as failure. When IPM calls CMS and the call times out, three things could be true: the request never arrived (retry is safe), CMS did the work and the response got lost (retrying double-applies), or CMS is still processing. You cannot tell which — this is the Two Generals problem: over an unreliable channel you can never be certain the other side heard you. A timeout is not a NO. A timeout is an UNKNOWN. The old code treated it as failure and rolled back the local write — and when CMS had actually succeeded, that rollback CREATED the exact inconsistency it was trying to prevent, in the opposite direction.",
        "Problem 3 — the monolith was being decommissioned, so half the sync code had a death sentence. That was the forcing function that turned a chronic problem into a project.",
      ]},
      { h: 'The root cause in one sentence', body: [
        "A project is a single concept represented as two records in two services with no shared transaction, and the legacy sync had two independent code paths writing concurrently while interpreting timeouts as certain failures — so it manufactured the drift it was designed to prevent.",
      ]},
      { h: 'Fix 1: one authoritative path', body: [
        "Two paths caused the drift, so the fix must be one path: the CMS GraphQL API becomes the single authoritative way to write sub-customers; the v4 fallback event path is deprecated. One contract, no belt-and-suspenders. GraphQL is the tactical choice (exact fields, evolvable schema); ONE PATH is the strategic one.",
      ]},
      { h: 'Fix 2: reconcile before compensate', body: [
        "The conceptual turn: after a timeout, do not guess — find out. Every write carries a correlation ID (the projectId — already unique and meaningful). After a failure, read CMS by that correlation ID: did the write actually happen? If yes — roll FORWARD: the write succeeded despite the timeout, just update local state to match. If no — NOW compensate safely.",
        "That is the killer insight: blind rollback of a call that actually succeeded manufactures the opposite inconsistency. Compensation only runs after reconciliation confirms it is needed. Say it as: reconcile before compensate.",
      ]},
      { h: 'Fix 3: idempotency and per-operation compensation', body: [
        "The correlation ID doubles as an idempotency key: a retried write with the same key returns the original result instead of double-applying. And 'undo' is not one thing — each operation has its own compensation: a failed create is compensated by soft-deleting the optimistic local project; a failed update by reverting to the prior version; a failed inactivate by undeleting. Each compensation is itself idempotent and was hardened by chaos testing — a deliberately faulty endpoint, timeouts forced from 15000ms to 3ms to trigger RestClientException, 3x async retries with bounded timeouts.",
      ]},
      { h: 'Fix 4: sync for the user, async for the world', body: [
        "The user clicking Save needs a deterministic answer NOW — so the IPM→CMS call is synchronous with the reconciliation flow. Downstream systems (STS, ETS, FTS, QBTime) just need to know a project changed — they get asynchronous domain events, published via the platform's transactional outbox (the event is written in the same DB transaction as the state change; a platform publisher pushes it to Kafka). Honesty line: the outbox is platform infrastructure — consumed, not built. Your slice: the STS event-consumer and the resiliency/reconciliation POC.",
      ]},
      { h: 'Why not two-phase commit', body: [
        "2PC requires every participant to hold locks between prepare and commit. CMS is a shared multi-tenant service used by many teams — it will not hold write locks for you. So 2PC is off the table organizationally, not just technically. What was built instead has a name: an orchestrated saga (IPM drives the sequence and compensations) with reconciliation gating compensation. That vocabulary — saga vs 2PC vs outbox — is what makes an interviewer sit up.",
      ]},
      { h: 'The result and its provenance', body: [
        "~95% reduction in cross-service sync failures. Provenance matters: before — a drift detector counted daily mismatches on the legacy paths (baseline); after — a cross-service consistency monitor counts them in near-real-time. The reduction is the comparison, and it is causally credible because each legacy failure category maps to a specific fix. Residual failures: extended CMS outages that exhaust retries.",
      ]},
    ],
  },

  'test-parallelization': {
    title: 'Parallelized Integration Test Suite',
    subtitle: 'Processes, threads, and isolation by construction',
    sections: [
      { h: 'The quiet tax', body: [
        "10,000+ Cucumber scenarios, sequential, one JVM: ~10 minutes on every CI run. Not broken — just slow. Engineers pushed and went for coffee; worse, they batched changes into bigger, riskier commits to amortize the wait. Nobody scoped it as a project because slow is not an incident. Noticing it anyway is the L4 move.",
      ]},
      { h: 'Processes and threads, from zero', body: [
        "A process is a running program with its own private memory, walled off by the OS — an apartment. Threads are workers inside one process that share ALL its memory — roommates: same fridge, same couch, if one leaves dishes in the sink the other sees them. Sharing is the threads' superpower (cheap communication) and their curse (anything shared can be corrupted by whoever touched it last).",
        "In Java, a static field is one shared slot per JVM. The suite was full of them — a static TestContext holding 'the current company', static caches, Spring singletons — all written when only one test ran at a time. Turn on threads and test B silently overwrites test A's context mid-flight. Making it all thread-safe is a multi-month refactor across code other teams own, and getting it wrong yields the worst bug class: intermittent flakes that only reproduce on CI.",
      ]},
      { h: 'The escape hatch: JVM forks', body: [
        "Run four whole JVMs instead of four threads. Each fork (Maven Surefire's word for a child JVM) has its OWN copy of every static, its own Spring context, its own caches — different memory regions the OS will not let cross. Fork 1 cannot corrupt fork 2's state even if it tries. That is structural isolation: enforced by the substrate, not by asking programmers to be careful. The cost — RAM per JVM and startup time — is cheap next to the refactor it avoids. reuseForks=true keeps each JVM alive across test classes so Spring boots once per fork, not once per class.",
      ]},
      { h: 'Why four forks', body: [
        "Parallelism speeds you up until the first shared resource saturates. Empirically: 2 forks ~5.5 min, 4 forks ~3.1 min (sweet spot), 6 forks ~2.9 min but DB connection pressure and slow queries appear, 8 forks ~3.4 min — a regression from CPU context-switch thrash, halved startup amortization, and forks queuing inside the shared database. The number is a property of the environment, not a universal.",
      ]},
      { h: 'The real work: isolation against a shared database', body: [
        "Four processes hitting one database WILL step on each other's data — unless you make their working sets disjoint. Rejected options: one DB per fork (infra cost, drifts from prod reality), transaction-rollback wrapping (integration tests commit their own transactions), truncation between tests (a shared truncate during another fork's test is catastrophe).",
        "The chosen scheme uses the app's own production invariant: every row is scoped by companyId and every query filters on it. Partition companies by fork — fork.id (a system property injected at fork startup) maps to a disjoint pre-provisioned range: fork 1 owns companies 1000-1999, fork 2 owns 2000-2999. Two forks share tables but have disjoint visibility. The partition function is pure and static: no locks, no registry, no runtime coordination. Two forks physically cannot collide.",
      ]},
      { h: 'Isolation inside one fork', body: [
        "Within a fork, tests run one at a time — so the risk is temporal, not concurrent: test B inheriting test A's leftovers. Fix: every scenario checks out a FRESH company from the fork's pool (a Cucumber Before hook pops one from an in-memory queue). Used companies are not returned during the run; a nightly job wipes and recycles them. State starts empty by construction — no cleanup logic to trust, and a crashed test corrupts only a company nothing else will touch. Scenarios needing shared setup re-create it via Cucumber Background on their fresh company. A second layer — per-fork environment keying — scopes flags and config overrides so forks cannot flip each other's switches.",
      ]},
      { h: 'The 550 ghosts', body: [
        "To verify the parallel run was equivalent, a per-scenario log line (fork id + scenario name) was reconciled against the sequential baseline. The counts disagreed — which should be impossible with the same glob. Digging in: the old sequential reporter had been silently under-counting scenarios that failed very early, and — deeper — 550 scenarios in the glob's path were leftovers from a defunct refactor: running every cycle, testing deleted code, some passing by coincidence. Both modes had been running them for years; careful counting finally exposed it.",
        "A ~500-line static-analysis tool walked scenario → step definitions (via Cucumber --dry-run) → invoked code (JavaParser call-graph walk, bounded to our packages), flagging scenarios whose ENTIRE reachable code was deleted or deprecated. The tool proposed; area tech leads disposed. 550 confirmed and removed. The discipline: nothing deleted on one person's authority.",
      ]},
      { h: 'The hardest bug and the meta-lesson', body: [
        "~1 in 15 runs, one fork hung at 99% until the pipeline timeout — never locally. Root cause: a pipe-buffer deadlock between fork and Surefire parent at shutdown. Fix: bounded fork output plus a parent-side heartbeat that kills a stalled fork deterministically. The lesson worth saying in an interview: parallelizing does not just add data races — it adds coordination races between the workers and the infrastructure supervising them. The bugs move up a layer.",
        "Retro: build the flake dashboard BEFORE flipping on parallelism. Observability first, then the change it exists to measure.",
      ]},
      { h: 'Results', body: [
        "10 min → ~3 min per CI run (~70%). 550 dead scenarios gone. Flake rate under 0.2% after isolation hardening. And the second-order effect leadership cares about: commits got smaller and more frequent because engineers stopped batching to amortize CI cost. Faster CI does not just save time — it changes how a team ships.",
      ]},
    ],
  },

  'budget-versioning': {
    title: 'Budget Versioning',
    subtitle: 'Keeping history without losing authority',
    sections: [
      { h: 'What a budget is and the natural problem', body: [
        "A Project Budget is the plan for what a project will cost — Bella's Kitchen at $14,200, broken down by cost code. Real owners invoice against it and steer by it, so correctness is money. Budgets change over months: change orders, price shifts, scope. So: when a budget changes, do you lose the old version or keep it? Lose it and you cannot answer 'what did we originally plan?' — a real accounting need. Keep every version and you must answer 'which one is THE budget right now?' for every report and invoice. The whole project is that tension: keep history AND stay authoritative.",
      ]},
      { h: 'Why naive version++ fails', body: [
        "Add a version column, increment on every edit? Four failures. (1) Every read becomes ORDER BY version DESC LIMIT 1 — forget it once and a customer-facing report shows stale money. (2) Versioning per keystroke on a 3500-row grid produces hundreds of junk versions; versions must mark MEANINGFUL moments, not typing. (3) Editing a draft is casual; publishing a plan-of-record is formal — one version++ strategy erases the difference. (4) Two users, two tabs, both save: the second silently destroys the first — the lost-update problem, catastrophic on money.",
      ]},
      { h: 'The core insight: only milestones deserve history', body: [
        "While a user edits, you want the latest state, not history: that is the DRAFT — one row per budget, mutable in place, every save overwrites it. When the user declares 'this is now the plan of record' (Save & Publish), you FORK: copy the draft's data into a new row marked LOCKED — immutable forever. Publish again later and it forks again: the previous LOCKED becomes INACTIVE history; a new LOCKED-ACTIVE row carries the new revision. At any moment: one DRAFT, zero or more LOCKED snapshots, exactly one ACTIVE among them. One line: DRAFT is mutable-in-place; LOCKED is immutable copy-on-write. Editing forks a revision; the old one becomes history.",
      ]},
      { h: 'Three axes, kept separate', body: [
        "state (DRAFT / LOCKED / HIDDEN): what KIND of row. status (ACTIVE / INACTIVE): which row is the current authority for reads. revision: which snapshot number. Composite primary key (budgetId, revision, companyId) — each row uniquely addressable, tenant-scoped. Conflate any two axes and the model becomes unreasonable; keep them orthogonal and every transition is a clean tuple change. The editor reads the DRAFT; reports and estimates read the ACTIVE LOCKED. Two screens, two intents, one model.",
      ]},
      { h: 'Concurrency: optimistic locking', body: [
        "Within the DRAFT, two concurrent editors remain a problem. Every row carries editSequence — a JPA @Version column that increments on every update. The frontend receives it at load (as syncToken) and sends it back with the save. Server compares: match → save proceeds, sequence increments; mismatch → 409 Conflict, the client refreshes and lets the user reconcile. 'Optimistic' because conflicts are assumed rare — you check at commit instead of holding a DB lock while a browser tab sits open for hours (pessimistic locking is a non-starter for web UIs). Two layers on purpose: the explicit token check gives a clean early error; @Version catches the true race at commit. Belt and suspenders.",
      ]},
      { h: 'The invariant that keeps history honest', body: [
        "LOCKED can never become DRAFT (INVALID_LOCKED_STATE). A locked revision may already be referenced by an estimate a customer has seen; unlock-and-edit would shift the ground under a document that other systems believe is frozen. Once immutable, always immutable.",
      ]},
      { h: 'The honesty boundary', body: [
        "History events publish via the platform's transactional outbox — event written in the same transaction as the state change, platform publisher delivers to Kafka. Consumed, not built. Volunteer that boundary before they probe it.",
      ]},
      { h: 'Why this project reads as senior', body: [
        "No drama — just state-machine discipline: three orthogonal axes, copy-on-write immutability, optimistic concurrency, one hard invariant protecting downstream consumers. Sell it as CLEAN, not complex: every decision defended by the constraint it solves. Boring backend done precisely is where senior range shows.",
      ]},
    ],
  },

  'ai-budget-import': {
    title: 'AI Budget Import',
    subtitle: 'A probabilistic model in front of a deterministic financial record',
    sections: [
      { h: 'The problem and the value', body: [
        "A business owner's budget already exists — in a spreadsheet, a contractor's PDF. Using Project Budgets meant retyping all of it: ~30 minutes of tedious, error-prone entry. The feature: upload the document, AI extracts the line items, the user reviews and accepts. Thirty minutes of typing becomes a few minutes of review.",
      ]},
      { h: 'The core tension', body: [
        "A budget is deterministic — $14,200 is not 'about $14,200'. An LLM is probabilistic — it predicts plausible text, optimizes for plausibility not truth, and can differ run to run. The entire design answers one question: how do you put a probabilistic component in front of a deterministic financial record without letting the uncertainty leak into the money? Answer: the AI never writes to the record directly, and a human reviews exactly where the AI is uncertain. Everything else is mechanism serving that principle.",
      ]},
      { h: 'Why asynchronous, and the three generations', body: [
        "LLM extraction generates output token by token through a huge network — seconds to tens of seconds, variable with document size. Block a user request on that and you hit HTTP timeouts, frozen browsers, and lost work when a tab closes. So: V1 was synchronous (worked on small docs, broke on big ones — the lesson), V2 async (upload returns immediately; completion arrives via the platform's ICE pub/sub push, with a 5-second polling fallback because pushed messages can drop — push for speed, poll as the safety net so the UI never hangs forever), V3 agentic [VERIFY your involvement — disclaim if none]. All behind flags.",
      ]},
      { h: 'The server-authoritative state machine', body: [
        "Long-running async work needs explicit state, and it must live on the SERVER: NO_DOCUMENT → IN_PROGRESS → EXTRACTED → COMPLETED, plus EXTRACTION_FAILED and CANCELLED. Server-authoritative means closing the laptop loses nothing — the truth survives the browser. The crucial gap is EXTRACTED vs COMPLETED: the AI can reach EXTRACTED on its own (results parked for review, NOT in the budget); only a human transition reaches COMPLETED. That gap IS the human-in-the-loop, encoded as a state machine.",
      ]},
      { h: 'Confidence: embeddings, cosine, thresholds', body: [
        "The document says 'Lumber'; the budget's cost code says 'Framing Materials' — zero shared characters, same meaning. String comparison fails; the matcher uses embeddings: text converted to a vector such that similar MEANINGS land geometrically close. Cosine similarity measures the alignment of two vectors (near 1 = same direction = same meaning). Thresholds turn the score into tiers: MATCH (high — user can skim), PARTIAL_MATCH (medium — flag it), NO_MATCH (low — flag it). Meaning becomes geometry; closeness in space is closeness in meaning.",
        "The thresholds are a precision-recall tradeoff. Raise the MATCH bar → higher precision (fewer wrong auto-matches) but lower recall (more rows sent to the human). On financial data you tune toward precision — a wrong auto-match onto money costs more than one extra human glance. When in doubt, ask the human.",
      ]},
      { h: 'The UI: attention where it matters', body: [
        "Every extracted line appears in the review grid, but the AiSparkles marker appears ONLY on PARTIAL_MATCH and NO_MATCH rows. Making the human re-verify everything would erase the time savings; the design directs limited human attention to exactly the rows where judgment adds value. Confident rows get skimmed; uncertain rows get checked. That is the difference between a human rubber-stamp and a human where it matters.",
      ]},
      { h: 'Hallucination and structural safety', body: [
        "Hallucination: plausible output not grounded in the input — a line item or amount that LOOKS real but is not in the document. It cannot be eliminated at the model level; the model optimizes plausibility, not faithful transcription. So the system is designed to be SAFE WHEN THE MODEL IS WRONG rather than assuming it is right: nothing auto-commits, uncertain rows are flagged, the human gates EXTRACTED → COMPLETED, and what gets written is the human's reviewed (possibly corrected) lines — never the AI's raw output. Plus a hard guardrail: max 100 records per import, bounding the blast radius of a runaway extraction and keeping review humanly possible.",
      ]},
      { h: 'The ownership boundary — volunteer it', body: [
        "The extraction/matching model is QBAI — a separate team's system, consumed through a GraphQL BFF. Not yours: the model, the embeddings, the cosine scoring, the thresholds' implementation. Yours: the async orchestration, the server-authoritative state machine, the review UI and confidence surfacing, the guardrails, the budget-grid integration. The reframe that wins: the model is the easy 20%; the safe, async, human-gated system around it is the hard 80% — and that is the part where the probabilistic and deterministic worlds actually meet.",
      ]},
    ],
  },

  'template-sharing': {
    title: 'Template Sharing / UCS',
    subtitle: 'Multi-tenant sharing on a platform you consumed',
    sections: [
      { h: 'The problem', body: [
        "Setting up workflow templates from scratch is slow and repeated across thousands of companies. The feature: let a user publish a template once and share it — to everyone, to all their companies, to all their clients (accountant firms), or to a custom list. Result: ~60% setup-time reduction, 1000+ publishers.",
      ]},
      { h: 'The platform: UCS and the mandatory partition key', body: [
        "UCS is a multi-tenant sharing platform used by many products — which is why offeringId is a MANDATORY partition key on everything: it is what makes the platform plugin-agnostic. Your product's templates live under your offeringId; another product's under theirs; the platform never mixes them. Auth is app + user + realm via an IAM ticket; every call carries intuit_tid for cross-service tracing.",
      ]},
      { h: 'Two records, one ordering rule', body: [
        "A shared template is metadata in UCS pointing (via entityReferenceId) at the actual workflow definition persisted in WAS. Ordering rule: WAS first, then UCS. Why: if the second write fails, a WAS orphan (definition with no metadata) is invisible and cleanable, but a UCS record pointing at a definition that does not exist — a dangling reference — is user-visible corruption. When two writes cannot be atomic, order them so the failure mode is the harmless one.",
      ]},
      { h: 'Share scopes and the hardest read', body: [
        "Four scopes: ALL, ALL_MY_COMPANIES, ALL_MY_CLIENTS, CUSTOM — at USER or REALM granularity. The hardest query is SHARED_WITH_ME: the union of four visibility predicates, one per scope — and ALL_MY_CLIENTS requires the firm-client relationship graph, which lives OUTSIDE UCS. Listing uses Relay cursor pagination (first/after/endCursor/hasNextPage) — cursors, not offsets, because the underlying list changes while you page.",
      ]},
      { h: 'The honesty edge: PII masking', body: [
        "PII is masked client-side at publish time (dot-dash masking). Be precise about what that is: a publisher-trust convenience, NOT a security boundary — a malicious client could skip it. If asked, the correct posture is that a server-side backstop is what would make it a real guarantee [VERIFY whether one exists].",
      ]},
      { h: 'Ownership', body: [
        "You owned the frontend and orchestration and consumed the UCS platform — you did NOT build UCS's ACL engine. Namespaced IDs (sbg:) and createdBy/createdByUser/createdByCompany audit metadata are platform conventions you followed. Volunteer the boundary; defend the orchestration and the API-design reasoning.",
      ]},
    ],
  },

  'consolidated-email': {
    title: 'Consolidated Email',
    subtitle: 'A timing insight hiding inside a preference toggle',
    sections: [
      { h: 'The problem', body: [
        "Customers running many workflows received a flood of individual notification emails. The feature: a per-workflow preference to consolidate them. Results: 65% email-volume reduction, ~40% CSAT lift [VERIFY numbers]. You owned the frontend (class-based React, no hooks — it was that era).",
      ]},
      { h: 'The one deep design point: WHEN is a setting read?', body: [
        "The preference is resolved at EXECUTION time — the moment an email is actually sent — not at toggle time. Why that matters: emails already queued or scheduled when the user flips the toggle. Resolve at toggle time and in-flight emails behave inconsistently — some go out in the old mode, some the new, depending on pipeline position. Resolve at execution time and behavior is deterministic regardless of when the toggle flips. The generalizable question this project teaches: for any setting, ask 'at what moment is this read, and what is in flight when it changes?' — at design time, every time.",
      ]},
      { h: 'Mode-aware components, not forks', body: [
        "The email UI components (CC/BCC, freeform text, attachments) were shared with other flows. The tempting move — fork them for consolidated mode — creates permanent double-maintenance. Instead they were refactored to be mode-aware via props: one component, behavior switched by mode, every existing capability preserved. Harder up front, no fork debt forever.",
      ]},
      { h: 'Shipping discipline', body: [
        "Legal review was a MERGE gate (customer-facing email content), mock APIs decoupled frontend progress from backend readiness, and rollout was percentage-based with the default preserving old behavior — opt-in, reversible, backward compatible.",
      ]},
    ],
  },

  'implicit-ads': {
    title: 'Implicit Ads Detector',
    subtitle: 'An academic classifier, framed honestly',
    sections: [
      { h: 'What it is and how to frame it', body: [
        "Academic project: detect implicit advertising — product placement, sponsored segments with no 'Ad' label — in video, at segment level, ~85% accuracy. Frame it honestly up front ('this was academic — where I got hands-on with multi-modal classification and the precision-recall tradeoff') and the calibrated modesty buys credibility for everything after. Decide in advance: this is a backup breadth story, not one you lead with.",
      ]},
      { h: 'The classification skeleton', body: [
        "Every classifier has the same shape: raw input → extract FEATURES (measurable signals) → model maps feature vector to a PROBABILITY → THRESHOLD turns probability into a decision. A feature is one measurable number: brand_logo_present = 1, logo_screen_time = 4.2s, promotional_language_score = 0.7, interrupts_normal_flow = 1. A segment becomes a vector of these; the model — trained on labeled examples (supervised learning) — learned which COMBINATIONS mean 'ad'.",
      ]},
      { h: 'Why multi-modal: intent lives in the combination', body: [
        "A visible logo alone is not an ad — people drink Coke incidentally. Promotional audio alone misses silent placements. Implicit advertising is an INTENT signal, and intent shows up only in the combination: brand present (visual) + promotional framing (audio) + unusual placement in the flow (contextual). Example: a host holding up olive oil saying 'I always use this, genuinely the best' → logo present AND salesy language AND cooking paused → 0.88 probability → flagged. Same logo appearing on a pan in passing with none of the rest → 0.15 → not flagged. Fusion (features from all modes combined into one vector — early fusion) is what lets the model learn those cross-mode interactions.",
      ]},
      { h: 'Recall-prioritized — and the golden contrast', body: [
        "Precision: of what you flagged, how much was really an ad. Recall: of the real ads, how many you caught. This detector was tuned for RECALL: as a screening tool, a missed implicit ad slips through undisclosed (bad), while a false flag costs a reviewer seconds (cheap). Threshold set low, flag aggressively. The interview gold is the contrast: the ads detector tuned toward recall; the budget import tuned toward precision — same tradeoff, OPPOSITE directions, because the cost of each error type was reversed. Land that and a throwaway academic project becomes proof you understand ML tradeoffs deeply enough to apply them contextually.",
      ]},
      { h: 'The honest metric caveat', body: [
        "85% accuracy flatters imbalanced classes: if only 10% of segments are ads, 'never an ad' scores 90% while catching nothing. So the metrics that mattered were recall and F1 (harmonic mean of precision and recall); accuracy was the headline, not the target. Trained supervised with a train/test split — 85% is test-set performance, i.e., generalization to unseen data, which is the only kind of accuracy that means anything (the gap between train and test scores is how you spot overfitting).",
      ]},
      { h: 'Where your knowledge stops', body: [
        "If pushed past the concepts — derive backprop, choose an optimizer — the calibrated exit: 'That is past where I have worked hands-on; I understand these systems at the level of designing around them and reasoning about tradeoffs, not implementing model internals.' Saying it cleanly is a strength.",
      ]},
    ],
  },
};

/* ============================================================================
 * CODE GUIDES — whiteboard-ready code with narration
 * Not production dumps: the RIGHT classes and signatures, built in the order
 * you would build them live, with what-to-say at each step.
 * ========================================================================== */

const CODE_GUIDES = {
  'traffic-replay': {
    title: 'Traffic Replay — capture config to parity BFS',
    intro: 'The code here is half config, half algorithm — which is honest to what the system is. Build order: capture topology → pairing consumer → write-mocking → the data-parity BFS. Narrate the invariant (zero customer impact) at every step.',
    sections: [
      {
        h: '1 · The Nginx sandwich + GoReplay sidecar (pod topology)',
        say: 'Capture is a sidecar, not app code — its failure domain is its own; if it dies, customers feel nothing. TLS terminates at the first Nginx so GoReplay can see plaintext, and the second Nginx re-encrypts before the app. Plaintext exists only inside the pod — the trust boundary is physical.',
        code: `# Pod (simplified): LB -> :9443 nginx-tls-term -> :8080 plaintext
#                    -> goreplay (passive tap) -> :8443 nginx-re-encrypt -> app

# nginx-tls-term.conf
server {
  listen 9443 ssl;
  ssl_certificate     /certs/tls.crt;
  ssl_certificate_key /certs/tls.key;
  location / { proxy_pass http://127.0.0.1:8080; }   # plaintext hop
}

# goreplay sidecar command — capture only, never in request path
gor --input-raw :8080 \\
    --output-kafka broker-list=kafka:9092,topic=captured-traffic \\
    --input-raw-track-response \\
    --http-allow-method GET --http-allow-method POST \\
    --http-allow-method PUT --http-allow-method DELETE
# ~10% pod overhead, measured. Payloads IDPS-encrypted before the bus.`,
      },
      {
        h: '2 · Pairing consumer — the partition key does the work',
        say: 'Requests and responses arrive as separate events; pairing them is trivial because the producer keys every message by transaction_id — same key, same partition, same consumer, in order. I buffer the request briefly and emit the pair when its response lands.',
        code: `// Producer side (in the capture pipeline):
//   ProducerRecord(topic, key = transactionId, value = event)

Map<String, CapturedRequest> pending = new HashMap<>(); // per-partition safe

for (ConsumerRecord<String, TrafficEvent> rec : records) {
  TrafficEvent e = rec.value();
  if (e.isRequest()) {
    pending.put(e.getTransactionId(), e.asRequest());
  } else {                                  // response
    CapturedRequest req = pending.remove(e.getTransactionId());
    if (req != null) {
      replayQueue.submit(new ReplayPair(req, e.asResponse()));
    } // else: response-first arrival is impossible within a partition —
      // ordering is guaranteed per key. Orphans -> TTL eviction.
  }
}`,
      },
      {
        h: '3 · Write-mocking at the network layer (Envoy → Wiremock)',
        say: 'The replay stack\u2019s egress goes through Envoy: mutating methods route to Wiremock, reads pass through. This is why blast radius is zero by construction — even buggy code cannot reach a production write endpoint; the route does not exist.',
        code: `# envoy route config (concept)
routes:
- match: { prefix: "/", headers: [{ name: ":method",
           string_match: { exact: "GET" } }] }
  route: { cluster: real_downstreams }        # reads pass through
- match: { prefix: "/" }                       # POST/PUT/DELETE/PATCH
  route: { cluster: wiremock }                 # writes are faked

# wiremock stub example — deterministic fake for a payment write
{ "request":  { "method": "POST", "urlPattern": "/payments/.*" },
  "response": { "status": 201,
                "jsonBody": { "paymentId": "mock-{{randomValue}}",
                              "status": "ACCEPTED" } } }`,
      },
      {
        h: '4 · Data parity — BFS over the FK graph',
        say: 'The schema is a graph: rows are nodes, FKs are edges; one request touches a small subgraph off one parent record. Each BFS LEVEL is one SQL query — there is no in-memory graph. Bounded by a time window and per-workflow table config, then compared with variable fields normalized.',
        code: `Set<Row> collectSubgraph(String tenantId, String parentId,
                         Instant t0, WorkflowConfig cfg) {
  Set<Row> visited = new LinkedHashSet<>();
  List<Key> frontier = List.of(new Key(cfg.rootTable(), parentId));

  while (!frontier.isEmpty()) {
    // ONE query per BFS level: fetch children via configured FK edges
    List<Row> level = db.query(
      cfg.childQuery(frontier),               // WHERE fk IN (:frontier)
      Map.of("tenant", tenantId,
             "from", t0.minus(cfg.window()),
             "to",   t0.plus(cfg.window())));
    level.removeAll(visited);
    visited.addAll(level);
    frontier = keysOf(level, cfg.followEdges());
  }
  return visited;
}

boolean parity(Set<Row> prod, Set<Row> replay, WorkflowConfig cfg) {
  return normalize(prod, cfg.ignoredFields())      // generated IDs,
       .equals(normalize(replay, cfg.ignoredFields())); // timestamps
}`,
      },
      {
        h: '5 · Latency comparison — percentiles, never averages',
        say: 'Averages hide tail regressions and the tail is where customers hurt. Per-workflow TP90/95/99, compared with a tolerance band. Load replay just compresses inter-arrival gaps — real traffic shape, synthetic intensity.',
        code: `LatencyReport compare(List<Sample> prod, List<Sample> replay) {
  for (double p : new double[]{90, 95, 99}) {
    double base = percentile(prod, p), cand = percentile(replay, p);
    if (cand > base * (1 + TOLERANCE))          // e.g. 10%
      report.flag(p, base, cand);
  }
  return report;
}
// load mode: replayAt(pairs, speedup) => sleep(gap / speedup) between sends`,
      },
    ],
    close: 'If asked to "code the replay system", pick section 4 — the BFS is the algorithmic heart and it is genuinely yours. Sections 1-3 you narrate as configuration with reasons. Never let the conversation end without "zero by construction, not by convention."',
  },

  'test-parallelization': {
    title: 'Test Parallelization — Surefire config to company pool',
    intro: 'Three artifacts carry the whole design: the Surefire config (forks), the company provider (isolation), and the Cucumber hook (fresh state). The ghost detector is a bonus if they ask. Narrate WHY at each block — the config is trivial, the reasoning is not.',
    sections: [
      {
        h: '1 · Maven Surefire — the fork topology',
        say: 'forkCount=4 gives four child JVMs — structural isolation for a legacy suite full of statics. reuseForks=true means Spring boots once per fork, not once per class — without it the startup tax eats the win. And surefire.forkNumber flows in as fork.id: the seed for data partitioning.',
        code: `<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-surefire-plugin</artifactId>
  <configuration>
    <forkCount>4</forkCount>              <!-- empirical sweet spot -->
    <reuseForks>true</reuseForks>         <!-- amortize Spring boot -->
    <systemPropertyVariables>
      <fork.id>\${surefire.forkNumber}</fork.id>  <!-- 1..4 -->
    </systemPropertyVariables>
    <!-- duration-seeded class ordering feeds dynamic pickup [VERIFY] -->
    <runOrder>balanced</runOrder>
  </configuration>
</plugin>`,
      },
      {
        h: '2 · TestCompanyProvider — fork.id → disjoint range',
        say: 'The partition function is pure and static: fork N owns companies [1000·N, 1000·N+999], pre-provisioned. No locks, no registry, no runtime coordination — two forks physically cannot collide because the ranges are disjoint by construction. This reuses the app\u2019s own production invariant: every query filters by companyId.',
        code: `public final class TestCompanyProvider {
  private static final int POOL = 1000;
  private static final Deque<String> available = new ArrayDeque<>();

  static {                                    // runs once per fork JVM
    int forkId = Integer.parseInt(System.getProperty("fork.id"));
    int start = forkId * POOL;                // disjoint by construction
    for (int i = start; i < start + POOL; i++) {
      available.add("test-co-" + i);          // pre-provisioned nightly
    }
  }

  public static String checkout() {
    String id = available.poll();
    if (id == null) throw new PoolExhaustedException(
        "fork " + System.getProperty("fork.id") + " exhausted");
    return id;                                // NOT returned during run;
  }                                           // nightly job resets pool
}`,
      },
      {
        h: '3 · Fresh company per scenario — the Cucumber hook',
        say: 'Inside a fork, tests run sequentially, so the risk is temporal contamination — B inheriting A\u2019s leftovers. Fresh-per-scenario means state starts empty by construction: no cleanup logic to trust, and a crashed test poisons only a company nothing else will touch.',
        code: `public class IsolationHooks {
  @Before
  public void freshCompany(Scenario s) {
    String companyId = TestCompanyProvider.checkout();
    TestContext.setCurrentCompany(companyId);   // the old static — now
    EnvKeys.scopeTo(companyId);                 // safe: one fork, one test
    log.info("scenario={} fork={} company={}",  // <- count reconciliation
        s.getName(), System.getProperty("fork.id"), companyId);
  }
  // NO @After cleanup by design — crash-safety over cleanup discipline
}`,
      },
      {
        h: '4 · Ghost detector — the ~500-line sketch',
        say: 'Cucumber dry-run maps scenarios to step methods without executing; JavaParser walks each method\u2019s call graph, bounded to our packages. A scenario whose ENTIRE reachable set is dead code gets flagged. The tool proposed; owners disposed — 550 confirmed.',
        code: `// 1. cucumber --dry-run --plugin json  => scenario -> stepDef methods
// 2. for each step method: BFS the call graph
Set<String> reachable(MethodDecl root) {
  Deque<MethodDecl> q = new ArrayDeque<>(List.of(root));
  Set<String> seen = new HashSet<>();
  while (!q.isEmpty()) {
    MethodDecl m = q.poll();
    for (MethodCallExpr call : m.findAll(MethodCallExpr.class)) {
      resolve(call).filter(t -> t.pkg().startsWith("com.intuit."))
                   .filter(t -> seen.add(t.signature()))
                   .ifPresent(q::add);
    }
  }
  return seen;
}
// 3. dead if: target no longer exists | @Deprecated | git-stale
//    | zero production callers.  Scenario dead if ALL reachable dead.
// 4. output: report per team -> tech leads approve -> delete.`,
      },
    ],
    close: 'The one config line that carries the interview: forkCount=4 with fork.id injected. Everything else — partitioning, hooks, pools — exists to make that line SAFE. Say that sentence and you have framed the whole project.',
  },

  'template-sharing': {
    title: 'Template Sharing — APIs, ordering, cursor pagination',
    intro: 'This one is API-design territory: a publish orchestration with a dual-write ordering rule, four share scopes, and a cursor-paginated union read. Perfect if they say "design the sharing API."',
    sections: [
      {
        h: '1 · The API surface',
        say: 'Resources first: a template definition (WAS) and its share metadata (UCS). Publish, update scope, unshare, and the two reads — mine and shared-with-me. offeringId rides every call — the platform\u2019s mandatory partition key. Auth is the IAM ticket; authorId comes from it, never the body.',
        code: `POST /v1/templates/publish
  body: { workflowDefinition, shareScope: ALL | ALL_MY_COMPANIES
          | ALL_MY_CLIENTS | CUSTOM, granularity: USER | REALM,
          customTargets?: [realmId], maskPii: true }
  201 { templateId, entityReferenceId }        # ids namespaced sbg:

GET  /v1/templates/shared-with-me?first=20&after=<cursor>
  200 { edges: [{ node, cursor }],
        pageInfo: { endCursor, hasNextPage } } # Relay-style

PATCH  /v1/templates/{id}/share   { shareScope, customTargets? }
DELETE /v1/templates/{id}/share   # unshare, keeps WAS definition
GET    /v1/templates/mine?first=20&after=<cursor>`,
      },
      {
        h: '2 · Publish orchestration — WAS first, always',
        say: 'Two writes, no shared transaction — so ordering is a design decision. WAS first: if UCS fails after, the orphan definition is invisible and a sweeper cleans it. The reverse order risks a UCS record pointing at nothing — user-visible corruption. Orphan beats dangling reference.',
        code: `public PublishResult publish(PublishRequest req, IamTicket ticket) {
  // 1. the definition — fails? nothing user-visible happened
  String defId = wasClient.persistDefinition(
      req.getWorkflowDefinition(), ticket);

  try {
    // 2. share metadata pointing at it
    UcsRecord meta = ucsClient.createShare(UcsShare.builder()
        .offeringId(OFFERING_ID)              // mandatory partition key
        .entityReferenceId(defId)
        .scope(req.getShareScope())
        .granularity(req.getGranularity())
        .createdBy(ticket.userId())           // audit trio from ticket
        .createdByCompany(ticket.realmId())
        .build());
    return PublishResult.of(defId, meta.getId());
  } catch (UcsException e) {
    orphanSweeper.schedule(defId);            // WAS orphan: cleanable
    throw new PublishFailedException(e);      // user retries whole op
  }
}`,
      },
      {
        h: '3 · SHARED_WITH_ME — a union of four predicates',
        say: 'The hardest read. Each scope contributes a visibility predicate; the result is their union. ALL_MY_CLIENTS is the expensive one — it needs the firm-client relationship graph, which lives outside UCS, so that lookup is resolved first and passed in.',
        code: `List<Predicate> visibilityFor(Caller c, List<String> myFirms) {
  return List.of(
    scope(ALL),                                        // public
    scope(ALL_MY_COMPANIES).and(sameOwnerUser(c)),     // my other realms
    scope(ALL_MY_CLIENTS).and(publisherIn(myFirms)),   // firm graph, external
    scope(CUSTOM).and(targetContains(c.realmId()))     // explicit list
  );
}
// query: WHERE offeringId = :o AND (p1 OR p2 OR p3 OR p4)
//        ORDER BY createdAt DESC, id DESC   <- stable cursor sort`,
      },
      {
        h: '4 · Cursor pagination — why not offsets',
        say: 'The list changes while someone pages. Offsets shift under inserts — duplicates or skips. A cursor encodes a stable position: strictly-after THIS (createdAt, id). The compound sort makes it deterministic even when timestamps tie.',
        code: `// cursor = base64(createdAt + ":" + id)
Page fetch(String after, int first) {
  Cursor c = Cursor.decode(after);
  List<Row> rows = db.query(
    "... AND (createdAt, id) < (:t, :id) " +   // strictly after cursor
    "ORDER BY createdAt DESC, id DESC LIMIT :n",
    Map.of("t", c.t(), "id", c.id(), "n", first + 1));
  boolean hasNext = rows.size() > first;
  return Page.of(rows.subList(0, Math.min(first, rows.size())), hasNext);
}`,
      },
    ],
    close: 'The two sentences that mark this as senior: the ordering argument (orphan over dangling reference) and the pagination argument (cursors because the data moves). Both generalize to any system — say them as principles, not trivia.',
  },

  'consolidated-email': {
    title: 'Consolidated Email — execution-time resolution, mode-aware UI',
    intro: 'Small surface, one deep idea: WHEN a setting is read. Two short blocks of backend logic plus the frontend pattern you actually owned.',
    sections: [
      {
        h: '1 · The preference API',
        say: 'A per-workflow preference, realm-scoped. Boring on purpose — the design lives in when it is READ, not how it is stored.',
        code: `GET /v1/realms/{realmId}/workflows/{wfId}/email-preference
  200 { mode: INDIVIDUAL | CONSOLIDATED, updatedAt }

PUT /v1/realms/{realmId}/workflows/{wfId}/email-preference
  body: { mode: CONSOLIDATED }
  200  # takes effect for emails EXECUTED after this moment`,
      },
      {
        h: '2 · Execution-time resolution — the timing insight',
        say: 'The pipeline resolves the preference at SEND time, not at enqueue or toggle time. Emails already queued when the user flips the toggle would otherwise behave inconsistently — some old mode, some new, by pipeline position. Resolving at execution makes behavior deterministic regardless of when the toggle changes. The general question: at what moment is any setting read, and what is in flight when it changes?',
        code: `void processDue(EmailTask task) {
  // resolve NOW — never trust a mode snapshotted at enqueue time
  Mode mode = prefs.get(task.realmId(), task.workflowId()).mode();

  if (mode == Mode.INDIVIDUAL) {
    sender.send(render(task));
  } else {
    digestBuffer.add(task);        // windowed; flushed as one email
  }
}
// anti-pattern (the bug class this design kills):
//   enqueue(task, mode = prefs.get(...))   // stale by send time`,
      },
      {
        h: '3 · Mode-aware components, not forks (your slice)',
        say: 'The CC/BCC, freeform-text, and attachment components were shared with other flows. Forking them for consolidated mode means every future fix lands twice. Mode-aware via props keeps one component, both behaviors, all existing capabilities — class-based React, since this predated hooks.',
        code: `class EmailComposer extends React.Component {
  render() {
    const { mode, recipients, onSend } = this.props;   // mode-aware
    return (
      <div>
        <RecipientFields
          recipients={recipients}
          allowPerRecipientCc={mode === 'INDIVIDUAL'}   // behavior
          showAggregateSummary={mode === 'CONSOLIDATED'} // switches,
        />                                               {/* one component */}
        <FreeformText maxLength={mode === 'CONSOLIDATED' ? 500 : 2000} />
        <AttachmentPicker disabled={mode === 'CONSOLIDATED'} />
        <SendBar onSend={onSend} />
      </div>
    );
  }
}`,
      },
    ],
    close: 'If they push for more depth than exists, be honest: my slice was the frontend and the mode-aware refactor; the timing principle is the transferable design lesson, and I can apply it to any settings system they name.',
  },

  'implicit-ads': {
    title: 'Implicit Ads — features, training, threshold for recall',
    intro: 'Academic project, so the code is the honest ML workflow: extract features, train supervised, evaluate with the RIGHT metrics, pick the threshold for recall. Python/sklearn-level is exactly the right register.',
    sections: [
      {
        h: '1 · Feature extraction per segment',
        say: 'Raw video becomes a feature vector per segment — measurable signals across three modes. Early fusion: one combined vector so the model can learn cross-mode interactions, because intent lives in the combination.',
        code: `def extract_features(segment):
    v = visual_signals(segment)       # logo detector, framing
    a = audio_signals(segment)        # ASR text -> language scores
    c = context_signals(segment)      # position, flow interruption
    return [
        v.brand_logo_present,         # 0/1
        v.logo_screen_time_sec,       # e.g. 4.2
        v.product_centered,           # 0..1 prominence
        a.brand_name_mentioned,       # 0/1
        a.promotional_language,       # 0..1  ("genuinely the best")
        a.enthusiasm_tone,            # 0..1
        c.interrupts_flow,            # 0/1  (cooking paused to pitch)
        c.segment_position,           # 0..1 within video
    ]                                  # early fusion: one vector`,
      },
      {
        h: '2 · Train / evaluate — the honest split',
        say: 'Supervised: labeled segments, train/test split so the reported number is generalization, not memorization. And I report precision, recall, F1 — accuracy alone flatters imbalanced classes, and ad segments are the minority.',
        code: `X = [extract_features(s) for s in segments]
y = [s.label for s in segments]              # 1 = implicit ad

X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y)         # keep class ratio

model = GradientBoostingClassifier().fit(X_tr, y_tr)

proba = model.predict_proba(X_te)[:, 1]      # probabilities, not labels
print(classification_report(y_te, proba > 0.5))
# accuracy ~0.85 — but recall/F1 on the ad class are what mattered`,
      },
      {
        h: '3 · Threshold chosen for recall — the tuned decision',
        say: 'The threshold is a dial, and I set it from the error costs: a missed ad slips through undisclosed (expensive), a false flag costs a reviewer seconds (cheap). So: lowest threshold that clears the recall target. The budget import tunes the same dial the OPPOSITE way — that contrast is the money sentence.',
        code: `prec, rec, thresholds = precision_recall_curve(y_te, proba)

TARGET_RECALL = 0.90
ok = [i for i, r in enumerate(rec[:-1]) if r >= TARGET_RECALL]
best = max(ok, key=lambda i: prec[i])        # best precision at recall>=.90
THRESHOLD = thresholds[best]

def flag(segment):                            # inference
    p = model.predict_proba([extract_features(segment)])[0, 1]
    return p >= THRESHOLD                     # tuned low -> recall-first`,
      },
    ],
    close: 'Keep the academic frame: "here is the workflow I actually ran" beats pretending it was production. If pushed to model internals, exit cleanly — you reason about ML systems and tradeoffs, you did not implement optimizers.',
  },
  'budget-versioning': {
    title: 'Budget Versioning — entity to API',
    intro: 'Build order on a whiteboard: entity → edit path → publish (copy-on-write) → invariant → API. The design lives in the schema; start there and narrate.',
    sections: [
      {
        h: '1 · The entity — three axes plus the optimistic lock',
        say: 'The primary key is composite — (budgetId, revision, companyId) — because one logical budget has many physical rows, one per revision, tenant-scoped. state is what KIND of row, status is which row is authoritative, revision is the snapshot counter. And editSequence with @Version is my optimistic lock — JPA increments it automatically on every update.',
        code: `@Entity
@Table(name = "project_budget")
@IdClass(BudgetKey.class)              // composite key
public class ProjectBudget {
  @Id private Long budgetId;
  @Id private Integer revision;
  @Id private String companyId;

  @Enumerated(EnumType.STRING)
  private BudgetState state;           // DRAFT, LOCKED, HIDDEN
  @Enumerated(EnumType.STRING)
  private BudgetStatus status;         // ACTIVE, INACTIVE

  @Version
  private Long editSequence;           // optimistic lock — JPA managed

  @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
  private List<BudgetLine> lines;
}

enum BudgetState  { DRAFT, LOCKED, HIDDEN }
enum BudgetStatus { ACTIVE, INACTIVE }`,
      },
      {
        h: '2 · Repository — reads split by intent',
        say: 'Reads split by intent: the editor loads the DRAFT; reports and estimates load the ACTIVE LOCKED revision. findMaxRevision computes the next number when publish forks.',
        code: `public interface ProjectBudgetRepository
    extends JpaRepository<ProjectBudget, BudgetKey> {

  Optional<ProjectBudget> findByBudgetIdAndCompanyIdAndState(
      Long budgetId, String companyId, BudgetState state);

  Optional<ProjectBudget> findByBudgetIdAndCompanyIdAndStateAndStatus(
      Long budgetId, String companyId,
      BudgetState state, BudgetStatus status);

  @Query("SELECT MAX(b.revision) FROM ProjectBudget b " +
         "WHERE b.budgetId = :budgetId AND b.companyId = :companyId")
  Optional<Integer> findMaxRevision(Long budgetId, String companyId);
}`,
      },
      {
        h: '3 · Edit path — belt AND suspenders concurrency',
        say: 'Two layers of concurrency protection, on purpose. The explicit syncToken check gives a clean, early rejection with a good error. JPA @Version gives the database-level guarantee: if two requests pass the first check simultaneously, whichever commits second throws OptimisticLockException. Token check is for UX; @Version is for correctness.',
        code: `@Transactional
public ProjectBudget updateDraft(Long budgetId, String companyId,
                                 List<BudgetLine> newLines,
                                 Long clientSyncToken) {
  ProjectBudget draft = repo
      .findByBudgetIdAndCompanyIdAndState(budgetId, companyId, BudgetState.DRAFT)
      .orElseThrow(() -> new BudgetNotFoundException(budgetId));

  // Layer 1: explicit check — clean early 409 for the client
  if (!draft.getEditSequence().equals(clientSyncToken)) {
    throw new StaleBudgetException(draft.getEditSequence(), clientSyncToken);
  }

  draft.setLines(newLines);
  // Layer 2: @Version — true race caught at commit
  return repo.save(draft);
}`,
      },
      {
        h: '4 · Publish — copy-on-write fork, one transaction',
        say: 'Publish is copy-on-write: demote the old ACTIVE LOCKED to INACTIVE, compute the next revision, insert a NEW immutable LOCKED row with a DEEP COPY of the draft lines. Flag the deep copy unprompted: copy the reference instead of the data and editing the draft later mutates the supposedly-immutable snapshot — they would share line objects. All three writes in one @Transactional boundary, so a failure never leaves a half-published state. The draft itself is untouched — the user keeps their working copy.',
        code: `@Transactional
public ProjectBudget publishBudget(Long budgetId, String companyId,
                                   Long clientSyncToken) {
  ProjectBudget draft = loadDraftChecked(budgetId, companyId, clientSyncToken);

  // 1. demote previous active snapshot
  repo.findByBudgetIdAndCompanyIdAndStateAndStatus(
        budgetId, companyId, BudgetState.LOCKED, BudgetStatus.ACTIVE)
     .ifPresent(prev -> { prev.setStatus(BudgetStatus.INACTIVE); repo.save(prev); });

  // 2. next revision number
  int nextRev = repo.findMaxRevision(budgetId, companyId).orElse(0) + 1;

  // 3. new immutable snapshot — DEEP copy, not a reference
  ProjectBudget locked = new ProjectBudget();
  locked.setBudgetId(budgetId);
  locked.setCompanyId(companyId);
  locked.setRevision(nextRev);
  locked.setState(BudgetState.LOCKED);
  locked.setStatus(BudgetStatus.ACTIVE);
  locked.setLines(deepCopy(draft.getLines()));   // <-- the guarantee lives here
  return repo.save(locked);
}`,
      },
      {
        h: '5 · The invariant',
        say: 'One hard rule ties it together: LOCKED never becomes DRAFT. A locked revision may already back an estimate a customer has seen — unlocking would shift ground other systems believe is frozen.',
        code: `public static void validateTransition(BudgetState from, BudgetState to) {
  if (from == BudgetState.LOCKED && to == BudgetState.DRAFT) {
    throw new InvalidLockStateException("LOCKED cannot transition to DRAFT");
  }
}`,
      },
      {
        h: '6 · API surface — status codes are the contract',
        say: 'syncToken rides in the body of every mutation; a stale token returns 409 Conflict — not 400, not 500. 409 is semantically exact: valid request, resource changed underneath you, refresh and retry. Getting the status code right is part of the design.',
        code: `PUT  /companies/{companyId}/budgets/{budgetId}/draft
     body: { lines: [...], syncToken: 42 }
     200 { ...budget, editSequence: 43 } | 409 Conflict

POST /companies/{companyId}/budgets/{budgetId}/publish
     body: { syncToken: 43 }
     201 { revision: 3, state: LOCKED, status: ACTIVE } | 409

GET  /companies/{companyId}/budgets/{budgetId}?view=draft|active`,
      },
    ],
    close: 'If they ask "is this your real code": this is the core; production had more edge handling and the platform outbox wiring — which I consumed, not built. The three things to hold if all else fails: @Version optimistic locking (and why two layers), deep-copy copy-on-write, one transaction per operation.',
  },

  'ai-budget-import': {
    title: 'AI Budget Import — orchestration around QBAI',
    intro: 'The QBAI GraphQL BFF is given. Your code is the async, human-gated system around it. Build order: state machine → QBAI boundary → start → completion (idempotent) → confidence surfacing → the human gate.',
    sections: [
      {
        h: '1 · State machine + job entity — server-authoritative',
        say: 'The status lives on the SERVER in an ImportJob — extraction is long-running and async; client state dies with the tab, server state survives it. EXTRACTED and COMPLETED are distinct on purpose: the AI can reach EXTRACTED alone; only a human reaches COMPLETED. That gap is the human-in-the-loop, encoded.',
        code: `public enum DocumentStatus {
  NO_DOCUMENT, IN_PROGRESS, EXTRACTED, COMPLETED,
  EXTRACTION_FAILED, CANCELLED
}
public enum ConfidenceTier { MATCH, PARTIAL_MATCH, NO_MATCH }

@Entity
public class ImportJob {
  @Id private String jobId;
  private String budgetId;
  private String companyId;
  @Enumerated(EnumType.STRING)
  private DocumentStatus status;     // the server-side truth
  private String qbaiJobId;
  private String failureReason;
}`,
      },
      {
        h: '2 · The QBAI boundary — consumed, not built',
        say: 'This interface IS the ownership boundary. Everything intelligent — extraction, embeddings, cosine matching, confidence — lives behind it, in QBAI. I am a client. My job starts when results come back.',
        code: `// PROVIDED BY QBAI — consumed, not built.
public interface QbaiExtractionClient {
  QbaiJobHandle startExtraction(String documentRef, List<String> costCodes);
  boolean isComplete(String qbaiJobId);
  QbaiExtractionResult getResults(String qbaiJobId);
}`,
      },
      {
        h: '3 · Start — return immediately',
        say: 'Upload creates the job in IN_PROGRESS, kicks off QBAI with the budget cost codes as the matching vocabulary, and returns NOW. Never block a user request on an LLM.',
        code: `@Transactional
public ImportJob startImport(String budgetId, String companyId, String docRef) {
  ImportJob job = ImportJob.create(budgetId, companyId, docRef,
                                   DocumentStatus.IN_PROGRESS);
  jobRepo.save(job);

  List<String> codes = budgetService.getCostCodes(budgetId, companyId);
  job.setQbaiJobId(qbai.startExtraction(docRef, codes).getId());
  return jobRepo.save(job);       // returns immediately
}`,
      },
      {
        h: '4 · Completion — one idempotent handler, push OR poll',
        say: 'One handler, reachable two ways: QBAI pushed event, or the frontend 5-second poll. The idempotency guard matters because both can fire — first one processes, second is a no-op. Push for speed, poll as the safety net so the UI never hangs on a dropped message. Success lands on EXTRACTED — parked for review, NOT in the budget. And the 100-record guardrail bounds a runaway extraction.',
        code: `@Transactional
public ImportJob handleExtractionComplete(String jobId) {
  ImportJob job = jobRepo.findById(jobId).orElseThrow();

  if (job.getStatus() != DocumentStatus.IN_PROGRESS) return job; // idempotent

  try {
    QbaiExtractionResult r = qbai.getResults(job.getQbaiJobId());
    if (r.getLines().size() > 100) {                 // guardrail
      job.fail("Exceeds max 100 records");
      return jobRepo.save(job);
    }
    job.setExtractedLines(map(r));
    job.setStatus(DocumentStatus.EXTRACTED);          // parked, not committed
  } catch (QbaiException e) {
    job.fail(e.getMessage());
  }
  return jobRepo.save(job);
}

// Poll endpoint — the fallback path can trigger completion too
public ImportJob getStatus(String jobId) {
  ImportJob job = jobRepo.findById(jobId).orElseThrow();
  if (job.getStatus() == DocumentStatus.IN_PROGRESS
      && qbai.isComplete(job.getQbaiJobId())) {
    return handleExtractionComplete(jobId);
  }
  return job;
}`,
      },
      {
        h: '5 · Confidence surfacing — attention where it matters',
        say: 'needsReview drives the AiSparkles marker: only PARTIAL_MATCH and NO_MATCH rows get flagged. Re-verifying everything would erase the time savings; the design routes limited human attention to exactly where judgment adds value.',
        code: `public boolean needsReview(ExtractedLine line) {
  return line.getConfidence() == ConfidenceTier.PARTIAL_MATCH
      || line.getConfidence() == ConfidenceTier.NO_MATCH;
}`,
      },
      {
        h: '6 · Accept — the human gate',
        say: 'The ONLY path into the budget, and only reachable from EXTRACTED — the status guard IS the human-in-the-loop in code. And I write reviewedLines, the human-approved (possibly corrected) version, never QBAI raw output. The AI suggested; the human decided; the human decision is what touches money.',
        code: `@Transactional
public ImportJob acceptImport(String jobId, List<ExtractedLine> reviewedLines) {
  ImportJob job = jobRepo.findById(jobId).orElseThrow();

  if (job.getStatus() != DocumentStatus.EXTRACTED) {
    throw new InvalidStatusException("accept only from EXTRACTED");
  }

  budgetService.addLines(job.getBudgetId(), job.getCompanyId(), reviewedLines);
  job.setStatus(DocumentStatus.COMPLETED);
  return jobRepo.save(job);
}`,
      },
      {
        h: '7 · GraphQL surface — the absent mutation is the point',
        say: 'Three mutations and a status query. Note what is MISSING: there is no auto-accept mutation. By design, no API path writes AI output to the budget without a human. That absence is a design decision, not an omission.',
        code: `type Mutation {
  startBudgetImport(budgetId: ID!, companyId: ID!, documentRef: String!): ImportJob
  acceptBudgetImport(jobId: ID!, reviewedLines: [ExtractedLineInput!]!): ImportJob
  cancelBudgetImport(jobId: ID!): ImportJob
}
type Query { importJobStatus(jobId: ID!): ImportJob }`,
      },
    ],
    close: 'Three things to hold if all else fails: async with server-authoritative state (push + poll fallback), EXTRACTED-vs-COMPLETED as the human gate writing the human version, and the QBAI boundary — they built the intelligence, you built what makes it safe on money.',
  },

  'cms-migration': {
    title: 'CMS Resiliency — reconcile before compensate, in code',
    intro: 'The shape they want to see: timeout treated as UNKNOWN, a reconciliation read gating the compensation, idempotency on projectId. Pseudocode-level Java is enough; narrate the failure logic.',
    sections: [
      {
        h: '1 · The orchestration — reconcile gates compensate',
        say: 'The whole insight is in the catch block. A timeout is not failure — it is unknown. So before any corrective action, read CMS by correlation ID to establish ground truth: if the write actually landed, roll FORWARD (blind rollback of a success would manufacture the opposite inconsistency); only if it truly failed, compensate.',
        code: `public SyncResult syncProjectToCms(ProjectChange change) {
  String correlationId = change.getProjectId();   // idempotency key too

  try {
    CmsResult r = cmsClient.upsertSubCustomer(change, correlationId);
    return SyncResult.success(r);

  } catch (TimeoutException | RemoteUnknownException e) {
    // UNKNOWN, not failure. Reconcile before compensate.
    Optional<CmsRecord> actual =
        cmsClient.findByCorrelationId(correlationId);

    if (actual.isPresent() && matches(actual.get(), change)) {
      return SyncResult.rolledForward(actual.get());  // it DID succeed
    }
    compensate(change);                                // it truly failed
    return SyncResult.compensated();
  }
}`,
      },
      {
        h: '2 · Per-operation compensation',
        say: 'Undo is not one thing. Create compensates by soft-delete (keep the record that it briefly existed); update by reverting to the prior version — which is why versioning matters; inactivate by undelete. Each compensation is idempotent itself, because compensations get retried too — once inline, then 3x async with bounded timeouts.',
        code: `private void compensate(ProjectChange change) {
  switch (change.getType()) {
    case CREATE     -> projectRepo.softDelete(change.getProjectId());
    case UPDATE     -> projectRepo.revertToPriorVersion(change.getProjectId());
    case INACTIVATE -> projectRepo.undelete(change.getProjectId());
  }
}`,
      },
      {
        h: '3 · What CMS must expose for this to work',
        say: 'Two capabilities make reconciliation possible: an idempotent write keyed on the correlation ID (a duplicate returns the original result, never double-applies), and a cheap indexed read by that ID. Compensation is just the write API called in reverse with a new key.',
        code: `mutation upsertSubCustomer(input: {
  idempotencyKey: "<projectId>",
  name, parentCustomerId, status, ...
}) : SubCustomerResult

query getSubCustomerByCorrelation(correlationId: ID!)
  : SubCustomerResult | null    # indexed, side-effect free`,
      },
    ],
    close: 'Vocabulary to drop while writing: this is an orchestrated saga with reconciliation gating compensation — not 2PC, because CMS is a shared multi-tenant service that will not hold locks between prepare and commit. Downstream fanout is async domain events via the platform outbox (consumed, not built). Sync failure reduction: ~95% vs the drift-detector baseline.',
  },

  'api-design-method': {
    title: 'API design — the 6-step method (any question)',
    intro: 'Same sequence every time, narrated aloud. Interviewers score the process as much as the output.',
    sections: [
      {
        h: 'The six steps',
        say: 'Clarify before designing — 90 seconds of scope questions is the biggest differentiator. Then nouns become paths, verbs become methods, shapes show data thinking, cross-cutting concerns separate real answers from toys, and the hard edges show you will own it in production.',
        code: `1 CLARIFY   2-4 scope questions (nesting? permissions? scale? realtime?)
2 NOUNS     resources → URL paths
3 VERBS     CRUD per resource → POST / GET / PATCH / DELETE
4 SHAPES    request body + response + status codes for key endpoints
5 CROSS-CUTTING
    auth vs authz · cursor pagination (not offset — data moves)
    409 vs 403 vs 404 · idempotency key on create/charge · validation
6 HARD EDGES  name 1-2: soft-delete semantics, N+1 on lists, races`,
      },
      {
        h: 'Worked mini-example: project comments',
        say: 'Threaded one level, author-or-admin edits, thousands per project → pagination. A reply is just a comment with a parentId — one resource, no /replies endpoint. authorId comes from the auth context, never the body — otherwise anyone posts as anyone.',
        code: `POST   /projects/{id}/comments        create (parentId nullable)
GET    /projects/{id}/comments?limit=20&cursor=xyz   cursor paginated
GET    /projects/{id}/comments/{cid}   one + replies
PATCH  /projects/{id}/comments/{cid}   edit (author|admin → else 403)
DELETE /projects/{id}/comments/{cid}   soft-delete ("comment removed"
                                       so replies keep context)`,
      },
      {
        h: 'The five reusable senior signals',
        say: 'Three of these come straight from your real projects — you are naming patterns you already shipped.',
        code: `1 "The ID comes from auth context, not the request body"
2 "Cursor pagination, because the data changes under you"   (UCS)
3 "Idempotency key so a retry cannot double-apply"          (CMS)
4 "Soft-delete so referencing data stays coherent"          (Versioning)
5 "403 = authenticated-but-forbidden, 404 = not-exists —
   and sometimes 404 instead of 403 to avoid leaking existence"`,
      },
    ],
    close: 'Narrate the method as you go. A clear spoken process reads as "this person will make good API decisions on problems I have not thought of yet" — which is exactly what they are buying.',
  },
};

/* ============================================================================
 * SYSTEM DESIGNS v2 — "design your own project", L4/SDE2 bar
 * Every design: 60-second opener → requirements → scale numbers → HLD →
 * flow → data model / API → LLD → defended tradeoffs → failure walkthrough →
 * evolution. This is the order strong candidates actually speak in.
 * ========================================================================== */

const SYSTEM_DESIGNS = {
  'traffic-replay': {
    title: 'Traffic Capture & Replay',
    goal: 'Validate risky backend changes against real production traffic with provably zero customer impact.',
    openingScript: 'Let me frame the problem first: we need production-scale behavioral truth about a risky change — DB engine swap, ORM upgrade — without production-scale risk. Tests cannot reproduce real traffic shape. So the design is: capture real traffic passively, replay it against a parallel stack running the change, and compare three things — responses, written data, latency. My north-star invariant: the customer path is untouchable, and the replay path must be HARMLESS BY CONSTRUCTION, not by care. Every component I draw follows from that invariant.',
    scale: [
      '~100K customers/day on the service; capability >1M requests/day replayed',
      '1M req/day ≈ 12 rps average, bursty to ~10x at peak — Kafka absorbs the burst, replay consumes at its own pace',
      'Capture overhead measured ~10% on the pod — budgeted, not assumed',
      'Parity check cost: tens of rows per request (BFS subgraph), never table scans on the 32TB store',
    ],
    requirements: {
      functional: [
        'Capture prod HTTP requests + responses without app code changes',
        'Replay against parallel stack; support per-workflow onboarding config',
        'Compare response parity, data parity, latency percentiles (TP90/95/99)',
        'Load replay at 0.5x/2x/3x by compressing inter-arrival gaps',
      ],
      nonFunctional: [
        'Zero customer impact — structural guarantee',
        'Zero downstream side effects from replays — structural guarantee',
        'Plaintext never leaves the pod; encrypted on the bus (IDPS) + TLS in transit',
        'Passive validator: may miss a regression, may never cause one',
      ],
    },
    hld: {
      diagram: `PROD POD (customer path — untouchable)
┌──────────────────────────────────────────┐
│ LB → Nginx#1 :9443 (TLS terminate)       │
│         │ plaintext (pod-internal only)  │
│         ├──▶ GoReplay sidecar ─────────────▶ Kafka
│         ▼                                │   topic: captured-traffic
│      Nginx#2 :8443 (re-encrypt) → App    │   key: transaction_id
└──────────────────────────────────────────┘   (IDPS-encrypted payloads)
                                                    │
                      ┌─────────────────────────────┘
                      ▼
              Pairing consumer (req+resp meet: same key → same partition)
                      │ ReplayPair
                      ▼
        ┌──────────────────────────────┐     writes    ┌──────────┐
        │ PARALLEL STACK (the change)  │──Envoy egress─▶│ Wiremock │
        │ own cloned DB (weekly CoW    │     reads      └──────────┘
        │ snapshot, NO replication)    │──passthrough──▶ real reads
        └──────────────┬───────────────┘
                       ▼
        Validator: response diff · data-parity BFS · latency percentiles
                       ▼
                 Diff report (pre-release, not an incident)`,
      components: [
        { n: 'Capture sidecar (GoReplay + Nginx sandwich)', r: 'Passive tap on pod-internal plaintext. Own process = own failure domain: sidecar death is invisible to customers. This is where "no app changes" and "no plaintext outside the pod" are both satisfied at once.' },
        { n: 'Kafka bus', r: 'Decouples capture rate from replay rate (absorbs bursts); partition key transaction_id makes request/response pairing trivial — same key, same partition, one consumer, in order.' },
        { n: 'Parallel stack + Envoy/Wiremock', r: 'Runs the risky change. Egress proxy routes mutating methods to Wiremock, reads pass through. The production write path does not exist from this stack — blast radius zero by construction.' },
        { n: 'Cloned DB (weekly CoW snapshot)', r: 'Replay must own ALL writes to its DB or rows cannot be attributed. No replication is deliberate; staleness is safe because compared rows are replay-created inside a time window.' },
        { n: 'Validator + its own store', r: 'Pairs, replays, compares, reports. Store is append-heavy with key lookups by transaction_id and TTL — pick storage from the access pattern, not fashion.' },
      ],
    },
    flow: [
      'Customer request → Nginx#1 decrypts → GoReplay copies → Nginx#2 re-encrypts → app answers customer (unchanged path, ~10% pod overhead)',
      'Request event + response event published to Kafka keyed by transaction_id',
      'Pairing consumer joins them (ordering per key guaranteed) → ReplayPair',
      'Replayer fires the request at the parallel stack; Envoy fakes writes, passes reads',
      'Validator: diff responses (normalize variable fields) · BFS the FK subgraph from (tenant_id, parent_record_id) on both DBs and compare · compare TP90/95/99 per workflow',
      'Findings land in a diff report reviewed before release',
    ],
    api: `# Onboarding config per workflow (how a team joins the platform)
workflow: invoices.create
  rootTable: invoice
  followEdges: [invoice→invoice_line, invoice→tax_entry]
  ignoredFields: [id, created_at, updated_at, trace_id]
  timeWindowMs: 5000
  latencyToleranceP99: 0.10`,
    lld: [
      { h: 'Data parity BFS (the algorithmic core)', points: [
        'Schema IS a graph: rows = nodes, FKs = edges; one write touches a small connected subgraph off one parent record',
        'BFS by LEVEL — each level is ONE SQL query (WHERE fk IN frontier); no in-memory graph ever exists',
        'Bounded by time window ± config and per-workflow table list; compare row-sets after normalizing generated IDs/timestamps',
        'Cost proportional to what the request touched: tens of rows against a 32TB database',
      ]},
      { h: 'Why pairing is trivial (Kafka mechanics)', points: [
        'hash(transaction_id) % partitions → same partition; one consumer owns a partition; order preserved within it',
        'So response-before-request is impossible at the consumer; orphaned requests TTL out (their response was never captured)',
      ]},
      { h: 'Security model', points: [
        'Trust boundary = pod boundary (physical). Plaintext exists only between Nginx#1 and Nginx#2',
        'Bus payloads IDPS-encrypted — TLS protects transit, IDPS protects the message at rest on the bus',
      ]},
    ],
    tradeoffs: [
      { choice: 'Sidecar capture', over: 'in-app capture middleware', why: 'In-app puts capture bugs in the customer critical path and couples to release cycles. Sidecar has an independent failure domain — it can die silently.' },
      { choice: 'Mock writes at the network layer (Envoy)', over: 'mocking in application code', why: 'Code-level mocks depend on discipline; a missed mock double-charges a customer. Network-level means the write path physically does not exist. Guarantee over convention.' },
      { choice: 'Weekly CoW snapshot clone', over: 'live replication to the parallel DB', why: 'Replication injects writes the replay does not own, breaking row attribution. Staleness is harmless: every compared row is replay-created inside the request time window.' },
      { choice: 'Kafka between capture and replay', over: 'direct HTTP forwarding (tee)', why: 'A tee couples replay availability to the customer path and drops traffic when replay is down. The bus buffers bursts, decouples rates, and allows replay-later/load-replay.' },
      { choice: 'Percentiles per workflow', over: 'average latency', why: 'Averages hide tail regressions; the tail is where customers hurt. TP99 catching a 2x regression on one workflow was the whole point.' },
    ],
    failures: [
      { scenario: 'GoReplay sidecar crashes', handling: 'Capture stops; customers unaffected (independent process). Gap in captured traffic is acceptable — the platform is a sampler, not an auditor. Alert + restart.' },
      { scenario: 'Kafka consumer lag spikes', handling: 'Replay falls behind real time — by design that is fine; pairs carry original timestamps and the time-window parity still works. Scale consumers; partitions rebalance whole partitions so pairing never breaks.' },
      { scenario: 'Parallel stack writes leak attempt', handling: 'Cannot reach production: mutating routes terminate at Wiremock. Worst case a stub is missing → replay request fails → shows in diff report as replay-side error, never as a customer effect.' },
      { scenario: 'Parity false positives flood the report', handling: 'Almost always a missing ignoredField (new generated column) or wrong time window — fix the workflow config, not the engine. Config-per-workflow is what keeps signal high.' },
    ],
    evolution: [
      '10x traffic: partitions + consumer instances scale linearly; replay is embarrassingly parallel by transaction_id',
      'More teams: onboarding config is the product — the platform framing (Oracle exit, Hibernate, MySQL→Postgres are just clients)',
      'Beyond HTTP: same pattern for event-driven flows — capture consumer-side, replay into a shadow consumer group',
    ],
    presentTip: 'Draw the prod pod first and put a wall around it — say "everything left of this wall is untouchable." Then derive each right-side box from an invariant. Interviewers remember candidates who design from invariants, not inventories.',
  },

  'cms-migration': {
    title: 'Cross-Service Project Sync (CMS Resiliency)',
    goal: 'Keep one concept — a project — consistent across two services that share no transaction, under partial failure.',
    openingScript: 'The shape of the problem: a customer project is TWO records — an IPM project and a CMS sub-customer — in services with separate databases. No shared transaction exists, so the design question is: what happens when the second write fails, times out, or lies? The legacy system got this wrong twice — two racing sync paths, and timeouts treated as failures — and manufactured the drift it was meant to prevent. My design has three pillars: one authoritative path, reconcile-before-compensate on timeouts, and idempotency everywhere.',
    scale: [
      'Every project create/update/inactivate crosses the boundary — user-facing latency budget applies to the sync call',
      'Result: ~95% reduction in cross-service sync failures vs drift-detector baseline',
      'Retry budget: 1 inline reconcile + 3 async retries with bounded timeouts (chaos-tested at 3ms forced timeouts)',
    ],
    requirements: {
      functional: [
        'Project create/update/inactivate reflected in both services',
        'Deterministic outcome for the user action (success, retriable, or compensated)',
        'Downstream consumers (STS/ETS/FTS/QBTime) notified of changes',
      ],
      nonFunctional: [
        'No drift under timeout/partial failure',
        'Retries never double-apply (idempotency)',
        'No 2PC — CMS is shared multi-tenant and will not hold locks',
        'Monolith sync paths fully decommissioned (forcing function)',
      ],
    },
    hld: {
      diagram: `User action (sync path — user waits)
      │
      ▼
┌───────────────┐  1. local write        ┌──────────────────────┐
│      IPM      │──────────────┐         │         CMS          │
│  orchestrator │  2. GraphQL upsert     │  (shared multi-      │
│               │──idempotencyKey=───────▶  tenant service)     │
│               │   projectId            │                      │
│               │◀─3. on timeout: read───│  getByCorrelationId  │
│               │   by correlation       │  (indexed, no side   │
└──────┬────────┘   → roll fwd / comp.   │   effects)           │
       │ same txn                        └──────────────────────┘
       ▼
  Outbox table ──platform publisher──▶ Kafka ──▶ STS / ETS / FTS / QBTime
  (event written atomically              (async domain events;
   with the state change)                 my slice: STS consumer)`,
      components: [
        { n: 'IPM orchestrator', r: 'Drives the saga: local write, sync CMS call, timeout classification, reconciliation read, per-operation compensation. The resiliency slice I built.' },
        { n: 'CMS GraphQL API', r: 'THE single authoritative write path (v4 fallback event path deprecated — killing the dual-path race). Exposes idempotent upsert + read-by-correlation.' },
        { n: 'Transactional outbox (platform, consumed)', r: 'Event row written in the same DB transaction as state; platform publisher delivers to Kafka. Removes the write-then-publish race without me building bus infrastructure.' },
        { n: 'Downstream consumers', r: 'Async, eventually consistent — they need "a project changed," not a vote in the user\u2019s transaction.' },
      ],
    },
    flow: [
      'User saves → IPM local write + synchronous CMS upsert (idempotencyKey = projectId)',
      'Success → respond to user; outbox event fans out async',
      'Timeout → classify as UNKNOWN → read CMS by correlation ID',
      'Record found & matches → roll FORWARD: the write landed; align local state, done',
      'Absent → compensate per operation: create→soft-delete · update→revert-to-prior-version · inactivate→undelete; compensations idempotent, then async retries',
      'Consistency monitor watches both sides in near-real-time (provenance of the 95%)',
    ],
    api: `mutation upsertSubCustomer(input: {
  idempotencyKey: "<projectId>",     # duplicate ⇒ original result
  name, parentCustomerId, status ...
}): SubCustomerResult

query getSubCustomerByCorrelation(correlationId: ID!)
  : SubCustomerResult | null         # indexed, side-effect-free
# Compensation = the write API driven in reverse with a fresh key.`,
    lld: [
      { h: 'Timeout classification (the heart)', points: [
        'Two Generals: request-lost vs response-lost vs still-processing are indistinguishable at the caller',
        'Therefore timeout = UNKNOWN. Acting on unknown as if it were failure is how the legacy system manufactured reverse-drift',
        'Ground truth is one indexed read away — that read is what gates every compensation',
      ]},
      { h: 'Idempotency design', points: [
        'Key = projectId: already unique, meaningful, and stable across retries — no key-distribution infrastructure needed',
        'CMS contract: same key ⇒ return original result, never re-execute',
        'Compensations are idempotent too — they get retried as well',
      ]},
      { h: 'Sync/async split', points: [
        'Sync where the user is waiting on a promise; async where consumers need eventual notification',
        'Outbox kills the "DB committed but event never published" race by making event emission part of the transaction',
      ]},
    ],
    tradeoffs: [
      { choice: 'Orchestrated saga (IPM drives)', over: 'choreographed events between IPM and CMS', why: 'The user is synchronously waiting; orchestration gives a deterministic answer and one place to reason about compensation. Choreography shines for fan-out — which is exactly where I DO use events (downstream).' },
      { choice: 'Reconcile-then-compensate', over: 'compensate immediately on failure', why: 'Blind rollback of a call that actually succeeded creates the opposite inconsistency. The reconciliation read converts UNKNOWN into a fact before any destructive action.' },
      { choice: 'Idempotency key = projectId', over: 'generated UUID per attempt', why: 'Per-attempt keys make every retry look like a NEW operation — the exact double-create bug idempotency exists to kill. The natural business key is stable across retries.' },
      { choice: 'One authoritative path', over: 'primary + fallback path', why: 'The fallback WAS the bug: two writers, different orders, no arbiter. Redundancy in write paths is not resilience; it is a race condition with good intentions.' },
      { choice: 'No 2PC', over: 'distributed transaction', why: 'Prepare/commit requires participants to hold locks; a shared multi-tenant CMS will not sign that contract. Organizational constraint, not just technical taste.' },
    ],
    failures: [
      { scenario: 'CMS down hard (not timeout — connection refused)', handling: 'Fail fast, mark project PENDING_SYNC, async retry with backoff; user sees success-with-sync-pending semantics [VERIFY exact UX]. No compensation needed — nothing ambiguous happened.' },
      { scenario: 'Timeout, and the reconciliation read ALSO times out', handling: 'Stay in UNKNOWN: schedule async reconciliation; never compensate on unknown. Bounded retries → alert. This is the honest residual inside the "95%, not 100%."' },
      { scenario: 'Duplicate delivery of the outbox event', handling: 'Consumers are idempotent on (projectId, version/eventId) — at-least-once delivery is the platform contract, dedupe is the consumer\u2019s job (my STS consumer does exactly this).' },
      { scenario: 'Compensation itself fails', handling: 'Compensations are idempotent and retried (3x async, bounded timeouts, chaos-tested via forced 3ms timeouts → RestClientException). Exhaustion → dead-letter + alert + consistency monitor keeps score.' },
    ],
    evolution: [
      'More downstream consumers: zero orchestrator changes — they subscribe to the same domain events',
      'Multi-entity sync (projects + sub-jobs): same saga skeleton, compensation table grows per operation type',
      'If CMS ever offers async ack: the sync leg could become submit+confirm, keeping the same reconciliation spine',
    ],
    presentTip: 'Draw the two services and write "NO SHARED TXN" between them before anything else. Then narrate the timeout branch slowly — reconcile-before-compensate spoken clearly is the single highest-signal moment this design offers.',
  },

  'test-parallelization': {
    title: 'Parallelized Integration Test Suite',
    goal: 'Cut CI wall-clock ~70% on a legacy 10K-scenario suite via process-level parallelism — without a thread-safety refactor.',
    openingScript: 'The bottleneck was serialization: 10,000 I/O-bound scenarios in one JVM, one at a time, ~10 minutes per push. Two constraints shape everything: the suite is full of legacy static state — so THREAD parallelism would surface years of unsafe assumptions as flakes — and all workers share one test database. So the design is: process-level isolation via JVM forks for memory, and tenant-level partitioning via companyId ranges for data. Both isolations are structural — enforced by the OS and by the schema — not by asking test authors to be careful.',
    scale: [
      '10K+ scenarios, ~2,500 per fork at forkCount=4',
      'Fork sweep: 2→~5.5m · 4→~3.1m · 6→~2.9m (DB pressure) · 8→~3.4m regression [VERIFY]',
      'Company pool: 1,000 pre-provisioned per fork, fresh one per scenario, nightly reset',
      'Flake rate after hardening: <0.2% [VERIFY]; 550 ghost scenarios removed',
    ],
    requirements: {
      functional: [
        'Same scenario set, same pass/fail semantics, ~1/3 wall-clock',
        'Deterministic worker isolation (memory + data)',
        'Balanced distribution; merged reporting; stalled-fork detection',
      ],
      nonFunctional: [
        'Zero changes to legacy one-test-at-a-time assumptions',
        'Shared DB must survive 4x concurrency without cross-talk',
        'CI flake rate must not regress',
      ],
    },
    hld: {
      diagram: `Maven Surefire parent (forkCount=4, reuseForks=true)
 │  assigns test classes: duration-seeded dynamic pickup
 │  injects -Dfork.id=N · heartbeat + bounded output per fork
 │
 ├─ Fork JVM 1 ─ Spring ctx ─ seq scenarios ─ companies 1000-1999 ─┐
 ├─ Fork JVM 2 ─ Spring ctx ─ seq scenarios ─ companies 2000-2999 ─┤
 ├─ Fork JVM 3 ─ Spring ctx ─ seq scenarios ─ companies 3000-3999 ─┼─▶ ONE
 └─ Fork JVM 4 ─ Spring ctx ─ seq scenarios ─ companies 4000-4999 ─┘  test DB
      │ each scenario: fresh company from fork pool                (companyId-
      ▼                                                             scoped
 results via pipes → parent merges → CI report                     visibility)

 offline: ghost detector (dry-run → call-graph walk) → owner review`,
      components: [
        { n: 'Surefire parent', r: 'Fork lifecycle, class assignment (duration-seeded dynamic pickup), report merge, and — after the war story — heartbeat + bounded output to kill stalled forks deterministically.' },
        { n: 'Fork JVMs (4)', r: 'Own heap, statics, Spring context each. Cross-fork memory isolation enforced by the OS. Sequential inside, parallel across; wall-clock ≈ slowest fork.' },
        { n: 'TestCompanyProvider', r: 'fork.id → disjoint pre-provisioned company range; checkout() per scenario; used IDs not recycled mid-run; nightly reset job.' },
        { n: 'Env-key layer', r: 'Per-fork namespace for flags/config overrides — forks cannot flip each other\u2019s switches.' },
        { n: 'Ghost detector (offline)', r: 'Cucumber --dry-run → step defs → JavaParser call-graph BFS → dead-code flags → tech-lead approval. Tool proposes, owners dispose.' },
      ],
    },
    flow: [
      'CI stage starts → 4 forks boot Spring in parallel (aggregate startup ≈ one boot thanks to parallelism + reuseForks)',
      'Fork picks next test class (dynamic) → per scenario: checkout fresh company → run → log scenario+fork+company (count reconciliation)',
      'Results stream to parent over pipes → merged report → PR gate',
      'Nightly: reset used companies; refresh duration seed data',
    ],
    dataModel: `-- isolation rides the app's own production invariant:
-- every table is companyId-scoped, every query filters on it
SELECT ... FROM invoices WHERE company_id = :ctx  -- ctx ∈ fork's range
-- fork ranges disjoint by construction ⇒ disjoint visibility, zero locks`,
    lld: [
      { h: 'Two isolation layers, precisely', points: [
        'Cross-fork memory: OS process boundary — fork 1\u2019s statics are physically different variables from fork 2\u2019s',
        'Cross-fork data: disjoint companyId ranges — same tables, non-intersecting row visibility',
        'Intra-fork: sequential + fresh-company-per-scenario — temporal contamination dies with no cleanup logic to trust; crash-safe by construction',
      ]},
      { h: 'Why 4 forks (resource math)', points: [
        '4 ≈ CPU near-saturation with DB headroom on the CI agent',
        '8 regressed: context-switch thrash + halved per-fork startup amortization + ~160 pooled connections queuing inside the DB (slow-query symptoms)',
        'Rule to say out loud: parallelism helps until the first shared resource saturates',
      ]},
      { h: 'Discipline rules', points: [
        'No DDL in tests — CREATE INDEX/ALTER takes table locks that stall every fork; migrations run once, pre-fork',
        'Condition-based waits only — Thread.sleep fails under CPU contention and was a top flake source',
      ]},
    ],
    tradeoffs: [
      { choice: 'JVM forks', over: 'Cucumber thread parallelism', why: 'Threads share the heap; the legacy suite\u2019s statics become race conditions with the worst failure mode — intermittent CI-only flakes — and fixing that is a multi-month cross-team refactor. Forks buy structural isolation for RAM + startup.' },
      { choice: 'companyId range partitioning', over: 'one DB per fork', why: 'Reuses the production tenancy invariant at zero infra cost and stays faithful to prod topology. Per-fork DBs become right at ~8-12 forks — named as evolution, not day one.' },
      { choice: 'Fresh company per scenario', over: 'shared company + cleanup hooks', why: 'Cleanup-based isolation silently poisons the next test when cleanup bugs or a test crashes pre-teardown. Fresh-per-scenario is empty-by-construction and crash-safe.' },
      { choice: 'Duration-seeded dynamic pickup', over: 'static round-robin', why: 'Wall-clock = slowest fork; round-robin can dump every slow class on one fork. Seeding + dynamic pickup keeps forks within ~15% of optimal.' },
      { choice: 'reuseForks=true', over: 'fresh JVM per class', why: 'Per-class JVM+Spring boot (20-30s) would eat the entire win. Reuse is exactly why the isolation layers had to be airtight — a reused JVM carries state forward.' },
    ],
    failures: [
      { scenario: 'Fork hangs at 99% (~1 in 15 runs)', handling: 'Root cause was a pipe-buffer deadlock: fork flooding stdout at shutdown while the parent waited. Fix: bounded fork output + parent heartbeat that kills a stalled fork deterministically. Lesson: parallelism adds coordination races with the supervising infra — bugs move up a layer. [VERIFY details]' },
      { scenario: 'Company pool exhausted mid-run', handling: 'Sized generously (pool ≥ per-fork scenario demand); hot-reset fallback existed and was never needed. Fail loudly with fork id — never silently reuse a dirty company.' },
      { scenario: 'Flake spike after enabling parallelism (~15%)', handling: 'Clustered by scenario on a flake dashboard: ordering assumptions (dynamic assignment changed order), sleep-based waits, partitioning gaps. Fixed root causes; quarantine lane for repeat offenders. Retro: build the dashboard BEFORE the change.' },
      { scenario: 'Report counts disagree with baseline', handling: 'Not "parallel ran extra tests" — independent per-scenario logging exposed the old reporter silently under-counting early failures for years, and led to the 550 ghost scenarios (deleted-code tests still executing). Reconciliation instrumentation is what made the change trustworthy.' },
    ],
    evolution: [
      '~10x scenarios: per-fork databases at 8-12 forks (the DB is the first saturating resource)',
      'Past that: fix the test pyramid — more unit/contract tests, fewer full-stack scenarios; the suite becomes the problem, not the runner',
      'Duration data → detect newly-slow tests as a regression signal, not just a scheduling input',
    ],
    presentTip: 'Draw the four forks as separate boxes each containing "own statics · own Spring" — the picture makes structural isolation obvious before you say a word. Then shade one DB into four colored companyId bands. Two images carry the design; the fork-sweep numbers carry the empiricism.',
  },

  'budget-versioning': {
    title: 'Budget Versioning',
    goal: 'Preserve full budget history while keeping exactly one authoritative version, under concurrent editing, on money.',
    openingScript: 'The tension: accountants need history — what did we originally plan? — while invoices and reports need ONE authoritative current budget. Keep only the latest and you lose auditability; keep everything naively and every read must guess which version is real. My design: a mutable DRAFT for the working copy, immutable LOCKED snapshots created copy-on-write at publish, three orthogonal axes (state, status, revision) so authority is never ambiguous, and optimistic locking so concurrent editors can never silently destroy each other\u2019s work.',
    scale: [
      'Grid editing up to ~3,500 rows per budget [VERIFY] — versions must mark PUBLISHES, not keystrokes',
      'History growth bounded by publish events; reads are two indexed point queries (DRAFT / ACTIVE LOCKED)',
    ],
    requirements: {
      functional: [
        'Editable working copy; publish = immutable snapshot; full history queryable',
        'Exactly one ACTIVE authority at any moment',
        'Concurrent editors detected with a clean conflict UX (409 + refresh)',
      ],
      nonFunctional: [
        'Financial correctness — customer-facing money',
        'Locked history immutable forever (downstream estimates reference it)',
        'No long-held DB locks (browser tabs stay open for hours)',
      ],
    },
    hld: {
      diagram: `Editor UI ── draft + syncToken ──▶ ┌────────────────┐
Reports / Estimates ── ACTIVE ────▶ │ Budget service │
                                    └───────┬────────┘
                                            ▼
              project_budget  PK(budgetId, revision, companyId)
   ┌─────────────────────────────────────────────────────────┐
   │ rev 0 DRAFT  ACTIVE-ish (working copy, mutated in place)│
   │ rev 1 LOCKED INACTIVE   (history)                       │
   │ rev 2 LOCKED INACTIVE   (history)                       │
   │ rev 3 LOCKED ACTIVE ◀── the authority for all reads     │
   └─────────────────────────────────────────────────────────┘
   publish: demote rev3→INACTIVE · insert rev4 LOCKED ACTIVE
            (DEEP copy of draft lines) — one transaction
   state-change txn ──▶ outbox (platform) ──▶ history events`,
      components: [
        { n: 'Budget service', r: 'updateDraft (two-layer optimistic locking) and publishBudget (copy-on-write fork, single transaction). State-transition guard: LOCKED→DRAFT forbidden.' },
        { n: 'project_budget table', r: 'Composite PK (budgetId, revision, companyId) — one logical budget, many physical revision rows, tenant isolation in the identity itself.' },
        { n: 'Readers by intent', r: 'Editor reads the DRAFT; reports/estimates read the single ACTIVE LOCKED. Two intents, two point queries, zero ambiguity.' },
        { n: 'Outbox (platform, consumed)', r: 'History events atomic with state changes.' },
      ],
    },
    flow: [
      'Edit: load DRAFT (editSequence → syncToken) → save with token → match: persist + increment · mismatch: 409, client refreshes and re-applies',
      'Publish: demote previous ACTIVE LOCKED → compute maxRevision+1 → insert new LOCKED ACTIVE with DEEP-copied lines → one transaction',
      'Read: caller intent picks DRAFT vs ACTIVE — never a version scan',
    ],
    dataModel: `project_budget(
  budget_id, revision, company_id,   -- composite PK
  state    ENUM(DRAFT, LOCKED, HIDDEN),
  status   ENUM(ACTIVE, INACTIVE),
  edit_sequence BIGINT,              -- @Version optimistic lock
  lines    (child table, FK by full composite key)
)
-- invariants: one DRAFT per budget · ≤1 (LOCKED, ACTIVE) per budget
-- transition guard: LOCKED → DRAFT ⇒ INVALID_LOCKED_STATE`,
    api: `PUT  /companies/{cid}/budgets/{bid}/draft   { lines, syncToken }
     → 200 {editSequence: n+1} | 409 Conflict (stale token)
POST /companies/{cid}/budgets/{bid}/publish { syncToken }
     → 201 { revision, state: LOCKED, status: ACTIVE } | 409
GET  /companies/{cid}/budgets/{bid}?view=draft|active|history`,
    lld: [
      { h: 'Concurrency — two layers on purpose', points: [
        'Explicit syncToken compare: clean, early, user-friendly 409 (UX layer)',
        'JPA @Version on edit_sequence: OptimisticLockException at commit catches the true race (correctness layer)',
        'Optimistic over pessimistic because hold-time is human-scale — a tab open for hours must not hold a row lock',
      ]},
      { h: 'Copy-on-write, precisely', points: [
        'DEEP copy of line objects at publish — reference-copying would let later draft edits mutate the "immutable" snapshot through shared children',
        'All three publish writes in one transaction: no observable half-published state',
      ]},
      { h: 'Why three axes stay separate', points: [
        'state=row kind, status=current authority, revision=snapshot counter — conflate any two and reads start guessing (e.g., encoding authority in max(revision) resurrects the ORDER BY bug)',
      ]},
    ],
    tradeoffs: [
      { choice: 'Version on publish (copy-on-write)', over: 'version every save', why: 'Versions should mark meaningful moments; per-save versioning floods history with keystrokes and makes "current" a scan instead of a flag.' },
      { choice: 'Optimistic locking', over: 'pessimistic row locks', why: 'Editors are humans with open tabs; conflicts are rare. Check at commit, reject the loser with 409 — never hold DB locks across think-time.' },
      { choice: 'Status flag for authority', over: '"latest revision wins"', why: 'max(revision) as authority makes every read a scan and every forgotten ORDER BY a stale-money bug. ACTIVE is one indexed point read.' },
      { choice: 'Immutable LOCKED (no unlock)', over: 'unlock-and-edit', why: 'Locked revisions may back estimates customers have seen; unlocking shifts ground other systems believe frozen. New work forks a NEW revision instead.' },
    ],
    failures: [
      { scenario: 'Two editors save simultaneously', handling: 'First commit wins; second hits token mismatch (or @Version at worst) → 409 → client refreshes, shows the newer state, user re-applies. Silent lost-update is impossible by construction.' },
      { scenario: 'Crash mid-publish', handling: 'Single transaction: either fully published (old demoted + new ACTIVE) or nothing. No orphaned half-state to repair.' },
      { scenario: 'Client sends stale token repeatedly', handling: '409 every time with the current editSequence in the body — the client always has what it needs to converge. Semantically precise status code IS the recovery protocol.' },
    ],
    evolution: [
      'Diff-view between revisions: trivial because snapshots are complete rows, not deltas',
      'Retention: HIDDEN state supports archival without deletion (history stays honest)',
      'Same pattern generalizes to any draft/publish document — estimates, templates, contracts',
    ],
    presentTip: 'Draw the revision-row lifecycle FIRST (draft mutating, publishes forking off locked rows) — the entire design falls out of that one picture. Flag the deep copy unprompted; it is the exact bug a mid-level engineer ships.',
  },

  'ai-budget-import': {
    title: 'AI Budget Import',
    goal: 'Let a probabilistic LLM populate a deterministic financial record — with structural safety, not hope.',
    openingScript: 'The tension in one line: a budget is deterministic, an LLM is probabilistic, and the design must keep the uncertainty from ever leaking into the money. Three principles generate everything: never block a user on LLM latency (async, server-authoritative state), never let AI output touch the record without a human (EXTRACTED vs COMPLETED gate), and route human attention to exactly where the model is uncertain (confidence tiers). The extraction model itself is QBAI — a boundary I consumed; my system is everything that makes it safe.',
    scale: [
      'Extraction latency: seconds to tens of seconds, varies with document size — hence async',
      'Poll fallback: 5s cadence; push (ICE) typically lands first',
      'Guardrail: ≤100 records per import — bounds blast radius AND keeps review humanly real',
    ],
    requirements: {
      functional: [
        'Upload → extract line items mapped to this budget\u2019s cost codes',
        'Per-line confidence surfaced; human review, correction, accept/cancel',
        'Progress survives tab close; failure and cancel are explicit states',
      ],
      nonFunctional: [
        'No AI write path to the budget without a human transition',
        'UI can never hang forever on a lost event (push + poll)',
        'Idempotent completion (push and poll may both fire)',
      ],
    },
    hld: {
      diagram: `Browser ──upload──▶ ┌──────────────────┐   startExtraction(doc,
   │                │  Import service  │──── costCodes) ──────▶ ┌────────┐
   │                │  (orchestration, │                        │  QBAI  │
   │  poll 5s ────▶ │   guardrails)    │◀─── push (ICE) ────────│  BFF   │
   │◀─ status ───── └────────┬─────────┘      or poll pulls     │(model, │
   │                         ▼                                  │embeds, │
   │                ImportJob store                             │cosine, │
   │                NO_DOCUMENT→IN_PROGRESS→EXTRACTED→COMPLETED │conf.)  │
   │                        (+FAILED / CANCELLED)               └────────┘
   ▼
Review grid (AiSparkles on PARTIAL/NO_MATCH only)
   │ accept(reviewedLines)  — the ONLY write path, human-driven
   ▼
Budget grid (deterministic record)`,
      components: [
        { n: 'Import service (mine)', r: 'Async orchestration, server-authoritative state machine, 100-record guardrail, idempotent completion handler, the accept gate.' },
        { n: 'ImportJob store', r: 'The truth. Client state dies with the tab; job status does not. EXTRACTED = parked for review; COMPLETED = human accepted.' },
        { n: 'QBAI BFF (consumed)', r: 'Extraction + semantic matching: embeddings → cosine vs the budget\u2019s cost codes → thresholds → MATCH / PARTIAL_MATCH / NO_MATCH.' },
        { n: 'Review UI (mine)', r: 'Confidence surfacing — sparkles only on uncertain tiers: attention where judgment adds value, skimming where it does not.' },
      ],
    },
    flow: [
      'Upload → job IN_PROGRESS → QBAI kicked with cost codes as matching vocabulary → return immediately',
      'Completion via push OR poll → ONE idempotent handler → guardrail (≤100) → EXTRACTED (parked)',
      'Human reviews; corrects flagged rows → accept(reviewedLines) → only-from-EXTRACTED guard → HUMAN version written → COMPLETED',
      'Failure → EXTRACTION_FAILED with reason (retriable); cancel → CANCELLED. Never a stuck spinner',
    ],
    api: `type Mutation {
  startBudgetImport(budgetId, companyId, documentRef): ImportJob
  acceptBudgetImport(jobId, reviewedLines: [ExtractedLineInput!]!): ImportJob
  cancelBudgetImport(jobId): ImportJob
}
type Query { importJobStatus(jobId): ImportJob }
# NOTE the absence: no auto-accept mutation exists. By design,
# no API path writes AI output to the budget without a human.`,
    lld: [
      { h: 'The human gate, mechanically', points: [
        'EXTRACTED and COMPLETED are distinct states; only acceptBudgetImport crosses, and only from EXTRACTED (guard throws otherwise)',
        'What lands is reviewedLines — the human-approved, possibly corrected version — never raw model output',
      ]},
      { h: 'Confidence pipeline (QBAI-side, but I must explain it)', points: [
        'Embed extracted text + candidate cost codes → cosine similarity → thresholds cut tiers (Lumber ↔ Framing Materials with zero shared characters)',
        'Thresholds are a precision/recall dial tuned toward PRECISION on money — when in doubt, ask the human',
        'Scores are not perfectly calibrated → even MATCH passes through the gate; it just costs less attention',
      ]},
      { h: 'Async correctness', points: [
        'Push for speed, poll for guarantee; both hit one handler guarded by status check — double-fire is a no-op',
        'Server-authoritative status: laptop closes, extraction continues, review resumes anywhere',
      ]},
    ],
    tradeoffs: [
      { choice: 'Async with push + poll fallback', over: 'synchronous extraction', why: 'V1 WAS synchronous and taught the lesson: fine on small docs, HTTP timeouts and frozen UI on real ones. Push alone can drop; poll alone is slow. Both, into an idempotent handler, is the honest design.' },
      { choice: 'Human gates every write', over: 'auto-accept high-confidence rows', why: 'Confidence is not calibrated truth — a 0.9 is not 90% correctness on YOUR document. On financial data the asymmetry is brutal: auto-accept saves seconds, a wrong committed amount costs trust. Absence of the auto-accept mutation is the design.' },
      { choice: 'Sparkles only on uncertain tiers', over: 'flagging everything', why: 'Re-verify everything and the feature saves nothing; flag nothing and errors sail through. Selective attention IS the product decision — human effort where the model is unsure.' },
      { choice: 'Server-side state machine', over: 'client-driven status', why: 'Extraction outlives the tab. Client state is a cache of server truth, never the truth.' },
    ],
    failures: [
      { scenario: 'QBAI extraction fails', handling: 'EXTRACTION_FAILED + reason on the job; UI offers retry. Explicit failure state — the user is never staring at an infinite spinner.' },
      { scenario: 'Push event dropped', handling: 'Poll completes it within ~5s through the same idempotent handler. Designed-for, not hoped-against.' },
      { scenario: 'Both push and poll fire', handling: 'Status guard makes the second a no-op. Idempotency is what lets me run redundant delivery safely.' },
      { scenario: 'Model hallucinates a plausible line', handling: 'Structural, not detective: parked in EXTRACTED, flagged if low-confidence, human edits/deletes, human version is what commits. Safe when the model is wrong — the design never assumes it is right.' },
      { scenario: 'Runaway extraction (500 rows)', handling: 'Guardrail fails the job loudly at 100. Bounded blast radius; review stays humanly possible instead of becoming a rubber stamp.' },
    ],
    evolution: [
      'V3 agentic flow [VERIFY involvement — disclaim if none]; same gate principle holds',
      'Feedback loop: human corrections are exactly the labeled data that would improve matching (owned by QBAI, but name it)',
      'Same skeleton for any AI-assist on records: receipts, invoices, estimates — the gate pattern is the reusable asset',
    ],
    presentTip: 'Open with the probabilistic/deterministic tension, then let every box be a consequence. Volunteer the QBAI boundary early — then own the harder 80%: the state machine, the gate, the attention routing. The absent auto-accept mutation is your closing line.',
  },

  'template-sharing': {
    title: 'Template Sharing on UCS',
    goal: 'Publish once, share across tenants safely — orchestrating a multi-tenant platform you consume.',
    openingScript: 'Two hard sub-problems hide in "share a template": a dual write across two services with no shared transaction — the definition in WAS, share metadata in UCS — and a read model where SHARED_WITH_ME is the union of four different visibility rules, one of which depends on a relationship graph outside the platform. My design decisions: order the dual write so the failure mode is harmless, and make the union query cursor-paginated because the underlying list moves while users page.',
    scale: [
      '1,000+ publishers; ~60% setup-time reduction for template consumers',
      'SHARED_WITH_ME = 4-predicate union; ALL_MY_CLIENTS resolves the firm-client graph externally first',
    ],
    requirements: {
      functional: [
        'Publish template; share at ALL / ALL_MY_COMPANIES / ALL_MY_CLIENTS / CUSTOM, USER or REALM granularity',
        'SHARED_WITH_ME and MINE listings, stable pagination',
        'Unshare without destroying the definition; audit trail (who/user/company)',
      ],
      nonFunctional: [
        'Tenant isolation via mandatory offeringId partition key',
        'No dangling references ever user-visible',
        'PII handling honest about its guarantees',
      ],
    },
    hld: {
      diagram: `Publisher UI ──▶ Orchestration (mine)
                    │ 1. persist definition ─────▶ WAS (workflow defs)
                    │ 2. create share metadata ──▶ UCS (platform)
                    │      entityReferenceId → WAS id
                    │      offeringId · IAM ticket · intuit_tid
                    │ on step-2 failure: orphan sweeper(defId)
Consumer UI ──▶ SHARED_WITH_ME
                = ALL ∪ (ALL_MY_COMPANIES ∧ my user)
                ∪ (ALL_MY_CLIENTS ∧ publisher ∈ my firms*)  *external graph
                ∪ (CUSTOM ∧ me ∈ targets)
                Relay cursors: first / after / endCursor / hasNextPage`,
      components: [
        { n: 'Orchestration + UI (mine)', r: 'Publish flow with WAS-first ordering, scope selection, client-side PII masking, listings.' },
        { n: 'WAS', r: 'System of record for the workflow definition itself.' },
        { n: 'UCS (platform, consumed)', r: 'Share metadata, scope model, ACL evaluation, pagination. I did NOT build its ACL engine — I orchestrated against it.' },
        { n: 'Orphan sweeper', r: 'Cleans WAS definitions whose UCS write failed — the designed-for failure mode.' },
      ],
    },
    flow: [
      'Publish: WAS write → UCS metadata write referencing it → success returns both ids',
      'Step-2 failure: schedule orphan cleanup, surface retriable error — user retries the whole operation (WAS write is idempotent on content [VERIFY])',
      'Read: resolve firm graph if needed → union query → cursor page → render',
      'Unshare: delete UCS metadata, keep WAS definition (owner may re-share)',
    ],
    lld: [
      { h: 'Dual-write ordering (the senior argument)', points: [
        'No shared transaction ⇒ pick the failure mode: WAS-first leaves an invisible, cleanable orphan; UCS-first risks metadata pointing at nothing — user-visible corruption',
        'Rule worth stating generally: when two writes cannot be atomic, order them so the failure you get is the failure you can live with',
      ]},
      { h: 'Cursor pagination', points: [
        'Offsets shift under concurrent inserts → duplicates/skips mid-paging',
        'Cursor = stable position (createdAt, id) compound sort — deterministic even under timestamp ties',
      ]},
      { h: 'PII masking honesty', points: [
        'Client-side dot-dash masking at publish = publisher-trust convenience, NOT a security boundary; a hostile client skips it',
        'A server-side backstop is what would upgrade it to a guarantee [VERIFY existence] — precision about guarantees beats overclaiming',
      ]},
    ],
    tradeoffs: [
      { choice: 'WAS before UCS', over: 'UCS before WAS', why: 'Orphan (invisible, sweepable) beats dangling reference (visible corruption). The whole argument in one line.' },
      { choice: 'Consume UCS', over: 'building product-local sharing tables', why: 'Sharing, scopes, and ACL evaluation are platform problems solved once for many products; offeringId partitioning is the contract that makes that safe. Build the orchestration, not the engine.' },
      { choice: 'Cursor pagination', over: 'offset pagination', why: 'The list mutates while users page; correctness under concurrency beats the simplicity of page numbers.' },
      { choice: 'Unshare keeps the definition', over: 'cascade delete', why: 'Share metadata and the asset have different lifecycles; owners re-share. Soft semantics keep referencing data coherent.' },
    ],
    failures: [
      { scenario: 'UCS write fails after WAS succeeded', handling: 'Orphan sweeper collects the definition; user sees a retriable error. Nothing user-visible dangles — by ordering, not by luck.' },
      { scenario: 'Firm-client graph service degraded', handling: 'ALL_MY_CLIENTS predicate unavailable → degrade the union gracefully (other three scopes still serve) + surface partial-results indicator [VERIFY exact behavior]. Never block the whole listing on one predicate\u2019s dependency.' },
      { scenario: 'Cursor points past deleted rows', handling: 'Cursor semantics are strictly-after — deletions cause no duplicates, just a shorter page. hasNextPage recomputed per request.' },
    ],
    evolution: [
      'New scope types = new predicates in the union; the read model absorbs them without schema surgery',
      'Server-side PII backstop is the highest-value hardening step',
      'Template versioning composes cleanly: share metadata points at a definition version (same copy-on-write instinct as budget versioning)',
    ],
    presentTip: 'Spend your first minute on the two-writes-no-transaction problem — it is the most transferable thinking in the design. Say "orphan beats dangling reference" while drawing the failure arrow, and volunteer the UCS boundary before they ask.',
  },

  'consolidated-email': {
    title: 'Consolidated Email (Notification Digest)',
    goal: 'Cut notification volume ~65% with a per-workflow digest preference — resolved at the only moment that is deterministic: send time.',
    openingScript: 'Honest scoping first: my production slice was the frontend and the mode-aware component refactor — but the design question "build the consolidation system" is fair game, so here is how I would design the whole pipeline. It is a digest problem: buffer notification events, window them, render one consolidated email — with the one subtle decision being WHEN the user\u2019s preference is read. My answer: at execution time, because anything earlier makes in-flight emails behave inconsistently when the toggle flips.',
    scale: [
      '65% email-volume reduction, ~40% CSAT lift [VERIFY]',
      'Digest window: e.g. 15-min tumbling per (realm, workflow) [VERIFY actual] — the latency/volume dial',
    ],
    requirements: {
      functional: [
        'Per-workflow preference: INDIVIDUAL vs CONSOLIDATED',
        'Consolidated mode: window events → one digest email with full fidelity (CC/BCC, freeform text preserved)',
        'Toggle takes effect deterministically, including for in-flight sends',
      ],
      nonFunctional: [
        'No lost notifications during mode transitions',
        'Legal-approved content (merge gate)',
        'Reversible rollout; default preserves old behavior',
      ],
    },
    hld: {
      diagram: `Workflow events ──▶ Notification service
                        │  resolve preference AT SEND TIME
                        ▼
              ┌── INDIVIDUAL ──▶ render → send (per event)
              │
              └── CONSOLIDATED ─▶ digest buffer
                                   key: (realmId, workflowId)
                                   tumbling window (e.g. 15 min)
                                   │ window closes
                                   ▼
                            render digest → send ONE email
Preference store ◀── PUT /email-preference (UI toggle, mine)`,
      components: [
        { n: 'Preference store', r: 'Per (realm, workflow) mode + updatedAt. Deliberately boring — the design lives in when it is read.' },
        { n: 'Send-time resolver', r: 'The one rule that matters: mode is read at execution, never snapshotted at enqueue. Kills the in-flight inconsistency class.' },
        { n: 'Digest buffer + window', r: 'Groups by (realm, workflow); tumbling window trades latency for volume. Flush renders one email preserving CC/BCC and freeform content.' },
        { n: 'Mode-aware UI components (my slice)', r: 'Shared CC/BCC, freeform, attachment components refactored to switch behavior by prop — one component, no fork debt.' },
      ],
    },
    flow: [
      'Event arrives → resolver reads CURRENT preference',
      'INDIVIDUAL → render + send immediately',
      'CONSOLIDATED → append to (realm, workflow) buffer; window timer flushes → one digest email',
      'Toggle mid-window: events already buffered flush as digest; new events follow the new mode — deterministic because resolution is at execution',
    ],
    api: `GET /v1/realms/{rid}/workflows/{wid}/email-preference
PUT /v1/realms/{rid}/workflows/{wid}/email-preference { mode }
# semantics: affects emails EXECUTED after this write`,
    lld: [
      { h: 'The timing principle (generalizable)', points: [
        'For ANY setting ask: at what moment is it read, and what is in flight when it changes?',
        'Enqueue-time snapshots go stale by send time — the exact bug class execution-time resolution removes',
      ]},
      { h: 'Windowing choice', points: [
        'Tumbling window per key: simple, predictable digest cadence; the window length is the latency-vs-volume dial',
        'Flush must be atomic per key — one digest per window, never partial duplicates [design intent]',
      ]},
    ],
    tradeoffs: [
      { choice: 'Execution-time preference resolution', over: 'enqueue-time snapshot', why: 'Snapshots make in-flight emails behave by pipeline position — nondeterministic UX. Execution-time is deterministic no matter when the toggle flips.' },
      { choice: 'Mode-aware shared components', over: 'forking the email UI', why: 'A fork is permanent double-maintenance; every fix lands twice or diverges. Props switch behavior in one component — harder once, cheaper forever.' },
      { choice: 'Opt-in default (old behavior)', over: 'default-on consolidation', why: 'Backward compatible, reversible, and the percentage rollout stays meaningful. Changing email behavior under people uninvited is how trust erodes.' },
    ],
    failures: [
      { scenario: 'Digest flush crashes mid-window', handling: 'Buffer is persistent [design intent]; flush is retried idempotently on (key, windowId) — one digest, at-least-once processing, no lost notifications.' },
      { scenario: 'Preference store briefly unavailable at send', handling: 'Fail safe to INDIVIDUAL (old behavior) rather than dropping or delaying — degraded mode is the pre-feature world, which is always acceptable.' },
    ],
    evolution: [
      'Per-user quiet hours / channel preferences slot into the same send-time resolver',
      'Digest templating per workflow type; summary-line intelligence is a natural later layer',
    ],
    presentTip: 'Lead with the honest scope line, then the timing principle — it is small but it is REAL design judgment, and interviewers reward candidates who extract transferable principles from modest features.',
  },

  'implicit-ads': {
    title: 'Implicit Ads Detection Pipeline',
    goal: 'Batch ML pipeline flagging implicit-advertising segments in video for human review — recall-first by design.',
    openingScript: 'Framing honestly: this was academic, so I will design it as the production system it would become. It is a classification pipeline: segment the video, extract multi-modal features, score each segment, threshold tuned for recall, and route flags to a review queue. The two decisions worth defending are WHY multi-modal — intent lives in the combination of signals, no single mode is sufficient — and why the threshold is set for recall: a missed ad slips through undisclosed, while a false flag costs a reviewer seconds.',
    requirements: {
      functional: [
        'Ingest video → segment → per-segment ad probability → flags above threshold',
        'Reviewer queue with evidence (which signals fired)',
        'Metrics: recall/F1 on the ad class tracked over time',
      ],
      nonFunctional: [
        'Recall target first (e.g. ≥0.90), precision optimized second',
        'Batch latency acceptable (not real-time)',
        'Model swappable without pipeline rewrites',
      ],
    },
    hld: {
      diagram: `Video in ──▶ Segmenter (shot/scene boundaries)
                 │ per segment
                 ▼
   ┌─ Visual extractor (logo detect, framing) ──┐
   ├─ Audio extractor (ASR → language scores) ──┼─▶ feature vector
   └─ Context extractor (position, flow) ───────┘   (early fusion)
                 │
                 ▼
        Classifier ──▶ probability ──▶ threshold (recall-tuned)
                                          │ ≥ τ
                                          ▼
                                   Review queue (human)
                                          │ labels feed back
                                          ▼
                                Retraining set (data flywheel)`,
      components: [
        { n: 'Segmenter', r: 'Scene/shot boundaries define the unit of detection — segment-level, not whole-video, because ads are local.' },
        { n: 'Per-mode extractors', r: 'Independent, parallelizable, individually testable. Visual: logo presence/prominence. Audio: transcript → promotional-language score. Context: position, flow interruption.' },
        { n: 'Fusion + classifier', r: 'Early fusion into one vector so the model learns cross-mode interactions — the intent signal IS the combination.' },
        { n: 'Threshold + review queue', r: 'τ chosen as lowest threshold meeting the recall target; flags carry per-feature evidence so reviewers decide fast.' },
      ],
    },
    flow: [
      'Ingest → segment → extract three feature groups in parallel → fuse',
      'Classifier outputs probability per segment',
      'p ≥ τ → flag with evidence → reviewer confirms/rejects',
      'Reviewer labels append to the training set → periodic retrain → re-pick τ on fresh validation data',
    ],
    lld: [
      { h: 'Metric discipline', points: [
        'Accuracy flatters imbalance (ads are the minority class); the tracked numbers are recall and F1 on the ad class',
        'Train/validation/test split; τ chosen on validation, reported on test — the 85% is test-set, i.e. generalization',
      ]},
      { h: 'Threshold selection', points: [
        'precision_recall_curve → among thresholds with recall ≥ target, take max precision',
        'Re-derive τ every retrain — thresholds are data-dependent, not constants',
      ]},
    ],
    tradeoffs: [
      { choice: 'Recall-first threshold', over: 'balanced/precision-first', why: 'Error costs: a missed implicit ad is an undisclosed ad in the wild; a false flag is seconds of reviewer time. Opposite tuning from my budget import (precision-first on money) — same dial, reversed costs.' },
      { choice: 'Early fusion', over: 'late fusion (per-mode voters)', why: 'The signal is cross-modal (logo + salesy audio + flow break TOGETHER); early fusion lets the model learn those interactions directly. Late fusion is more modular but blunts exactly the interaction we need.' },
      { choice: 'Human review of flags', over: 'auto-publish detections', why: 'At ~85% the model is a screener, not a judge. Human-in-the-loop converts tolerable precision into a usable system — and the review labels are free training data.' },
      { choice: 'Segment granularity', over: 'whole-video classification', why: 'Ads are local phenomena; whole-video labels destroy the actionable information (WHERE is the ad).' },
    ],
    failures: [
      { scenario: 'One extractor fails on a video (e.g. no audio track)', handling: 'Score with the remaining modes + a missing-mode indicator feature; recall-first means when evidence is thin, prefer flagging. Degrade toward the cheap error.' },
      { scenario: 'Class drift (new ad styles)', handling: 'Recall on fresh reviewer labels is the canary; drop triggers retrain with the flywheel data and a fresh τ.' },
      { scenario: 'Reviewer queue floods (precision collapse)', handling: 'That is the recall-first failure mode by construction — raise τ toward the recall floor, improve features (the real fix), and triage queue by probability.' },
    ],
    evolution: [
      'Late-fusion ensemble as a second opinion on disagreement cases',
      'Active learning: route lowest-confidence segments to reviewers first — maximum label value per human minute',
      'The honest boundary if pushed to internals: I reason about ML systems and tradeoffs; I have not implemented model internals — and that line, said cleanly, is a strength',
    ],
    presentTip: 'Say "academic, so I will design the production version" up front — it converts a weakness into initiative. Land the recall-vs-precision contrast with budget import; it is the single sentence that proves you understand ML tradeoffs rather than reciting them.',
  },
};

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
    -moz-osx-font-smoothing: grayscale;
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

  .pf-project-full { grid-template-columns: 1fr !important; }
  .pf-project-full .pf-body { max-width: 100%; }

  /* ============================== RESPONSIVE TIERS ========================= */
  /* Prose measure: keep long-form lines readable at any width */
  .pf-fc-p { max-width: 78ch; }
  .pf-fc-subtitle { max-width: 70ch; }
  .pf-dd-fpqa-a, .pf-sd-trade-why, .pf-sd-fail-handling { max-width: 88ch; }

  /* Laptop squeeze zone (split windows, small laptops): keep 2 columns, tighten */
  @media (min-width: 901px) and (max-width: 1200px) {
    .pf-shell { padding: 44px 32px 100px; }
    .pf-dd-shell, .pf-fc-shell, .pf-hr-shell { grid-template-columns: 222px 1fr; gap: 32px; }
    .pf-ov-shell { grid-template-columns: 210px 1fr; gap: 28px; }
    .pf-project { grid-template-columns: 200px 1fr; gap: 32px; }
    .pf-fc-title { font-size: 34px; }
    .pf-sd-diagram { font-size: 10.5px; }
    .pf-sd-component { grid-template-columns: 200px 1fr; }
  }

  /* Large monitor: use the space, scale comfortably */
  @media (min-width: 1600px) {
    .pf-shell { max-width: 1480px; padding: 72px 64px 140px; }
    .pf-dd-shell, .pf-fc-shell, .pf-hr-shell { grid-template-columns: 300px 1fr; gap: 72px; }
    .pf-ov-shell { grid-template-columns: 280px 1fr; gap: 64px; }
    .pf-fc-title { font-size: 46px; }
    .pf-fc-p { font-size: 16.5px; }
    .pf-dd-fpqa-q { font-size: 18px; }
    .pf-dd-fpqa-a { font-size: 15px; }
    .pf-cg-code { font-size: 13px; }
    .pf-sd-diagram { font-size: 12.5px; }
    .pf-cg-say, .pf-sd-trade-why, .pf-sd-fail-handling,
    .pf-sd-comp-role, .pf-sd-flow li, .pf-sd-list li { font-size: 14.5px; }
  }

  /* ============================== CODE BLOCKS ============================= */
  .pf-codeblock { margin: 0 0 4px; }
  .pf-codeblock-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #141312;
    border: 1px solid var(--rule);
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    padding: 6px 12px 6px 14px;
  }
  [data-theme="dark"] .pf-codeblock-bar { background: #0a0a0c; }
  .pf-codeblock-lang {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--accent);
    font-weight: 600;
  }
  .pf-codeblock-copy {
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: 0.05em;
    color: #9a948a;
    background: transparent;
    border: 1px solid #33312e;
    border-radius: 4px;
    padding: 3px 10px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .pf-codeblock-copy:hover { color: #e8e2d4; border-color: #55524d; }
  .pf-codeblock .pf-cg-code {
    border-radius: 0 0 6px 6px;
    margin: 0;
    font-variant-ligatures: none;
    -webkit-overflow-scrolling: touch;
  }
  .tok-c { color: #7d8a6a; font-style: italic; }
  .tok-s { color: #d9a05f; }
  .tok-k { color: #e8703b; font-weight: 500; }
  .tok-n { color: #a8b8dc; }
  .tok-a { color: #c9a465; }
  .tok-t { color: #8fc3d4; }

  /* ============================== DARK MODE TEXT ========================== */
  [data-theme="dark"] .pf-root,
  [data-theme="dark"] body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  [data-theme="dark"] .pf-fc-p,
  [data-theme="dark"] .pf-narrative,
  [data-theme="dark"] .pf-killer-text {
    font-weight: 400;
    letter-spacing: 0.004em;
  }
  [data-theme="dark"] .pf-fc-title,
  [data-theme="dark"] .pf-name { letter-spacing: -0.015em; }

  /* ============================== MOBILE PASS ============================= */
  @media (max-width: 720px) {
    .pf-tabs {
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      margin: 28px 0 32px;
    }
    .pf-tabs::-webkit-scrollbar { display: none; }
    .pf-tab {
      white-space: nowrap;
      padding: 10px 12px;
      font-size: 13px;
      flex-shrink: 0;
    }
    .pf-tab-badge { display: none; }
    .pf-killer { padding: 20px 16px; }
    .pf-killer-label, .pf-killer-text { margin-left: 0; }
    .pf-killer::before { display: none; }
    .pf-cg-code { font-size: 11px; padding: 12px 12px; }
    .pf-sd-diagram { font-size: 9.5px; padding: 12px 10px; }
    .pf-sd-open { padding: 14px 14px; font-size: 14px; }
    .pf-dd-fpqa-item { padding: 13px 14px; }
    .pf-fc-p { font-size: 14.5px; }
    .pf-fc-title { font-size: 26px; }
    .pf-fc-subtitle { font-size: 14px; margin-bottom: 24px; }
    .pf-cg-h { font-size: 17px; }
    .pf-cg-say { font-size: 12.5px; padding: 10px 12px; }
    .pf-sd-trade-chose { font-size: 14px; }
    .pf-sd-flow li, .pf-sd-list li, .pf-sd-trade-why,
    .pf-sd-fail-handling, .pf-sd-comp-role { font-size: 12.5px; }
  }
  @media (max-width: 540px) {
    .pf-shell { padding: 24px 14px 64px; }
    .pf-name { font-size: 34px; }
    .pf-meta { grid-template-columns: 1fr; }
    .pf-meta-cell, .pf-meta-cell:nth-child(odd) { border-right: none; }
    .pf-fc-item { font-size: 11px; padding: 5px 10px; }
    .pf-codeblock-bar { padding: 5px 8px 5px 10px; }
  }

  /* ============================== DARK MODE FIXES ========================= */
  [data-theme="dark"] .pf-killer {
    background: #201f1c;
    border: 1px solid var(--rule);
  }
  [data-theme="dark"] .pf-killer-text { color: var(--ink); }
  [data-theme="dark"] .pf-killer-label { color: var(--accent); }
  [data-theme="dark"] .pf-landmines {
    background: #231712;
    border-color: var(--accent-soft);
  }

  /* ============================== OVERVIEW NAV ============================ */
  .pf-ov-shell {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 48px;
    align-items: start;
  }
  .pf-ov-side {
    position: sticky;
    top: 24px;
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    padding-right: 6px;
  }
  .pf-ov-item {
    display: flex;
    align-items: baseline;
    gap: 8px;
    width: 100%;
  }
  .pf-ov-tier {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .pf-ov-tier[data-tier="1"] { color: var(--tier-1); }
  .pf-ov-tier[data-tier="2"] { color: var(--tier-2); }
  .pf-ov-tier[data-tier="3"] { color: var(--tier-3); }
  .pf-ov-legend {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 8px;
  }
  .pf-ov-legend span {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--ink-faded);
    letter-spacing: 0.02em;
  }
  .pf-ov-main { min-width: 0; }
  @media (max-width: 900px) {
    .pf-ov-shell { grid-template-columns: 1fr; gap: 20px; }
    .pf-ov-side { position: static; max-height: none; border-bottom: 1px solid var(--rule); padding-bottom: 14px; }
    .pf-ov-legend { display: none; }
  }

  /* ============================== SYSTEM DESIGN v2 ======================== */
  .pf-sd-open {
    font-family: var(--serif);
    font-size: 15px;
    line-height: 1.7;
    color: var(--ink);
    padding: 18px 22px;
    background: var(--fp-bg);
    border: 1px solid var(--rule);
    border-left: 3px solid var(--accent);
    border-radius: 3px;
    margin-bottom: 30px;
    font-style: italic;
  }
  .pf-sd-trades, .pf-sd-fails {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .pf-sd-trade {
    padding: 12px 16px;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: 3px;
  }
  .pf-sd-trade-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 6px;
  }
  .pf-sd-trade-chose {
    font-family: var(--display);
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
  }
  .pf-sd-trade-over {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .pf-sd-trade-why {
    font-family: var(--body);
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--ink-soft);
  }
  .pf-sd-fail {
    padding: 12px 16px;
    background: var(--fu-bg);
    border: 1px solid var(--rule);
    border-left: 3px solid var(--tier-2);
    border-radius: 3px;
  }
  .pf-sd-fail-scenario {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 5px;
    letter-spacing: 0.01em;
  }
  .pf-sd-fail-scenario::before {
    content: '⚠ ';
    color: var(--tier-2);
  }
  .pf-sd-fail-handling {
    font-family: var(--body);
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--ink-soft);
  }

  /* ============================== FULL CONTEXT / CODE / DESIGN ============= */
  .pf-fc-shell {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 56px;
    margin-top: 8px;
  }
  .pf-fc-side {
    position: sticky;
    top: 24px;
    align-self: start;
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    padding-right: 8px;
  }
  .pf-fc-list { display: flex; flex-direction: column; gap: 1px; }
  .pf-fc-item {
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
    line-height: 1.35;
  }
  .pf-fc-item:hover { color: var(--ink); }
  .pf-fc-item.active {
    color: var(--ink);
    border-left-color: var(--accent);
    font-weight: 500;
  }
  .pf-fc-side-note {
    margin-top: 18px;
    padding: 12px 14px;
    background: var(--fu-bg);
    border-radius: 3px;
    font-family: var(--body);
    font-size: 12px;
    line-height: 1.55;
    color: var(--ink-mid);
    font-style: italic;
  }
  .pf-fc-main { min-width: 0; }
  .pf-fc-title {
    font-family: var(--display);
    font-size: 40px;
    font-weight: 400;
    letter-spacing: -0.02em;
    line-height: 1.05;
    color: var(--ink);
    margin: 8px 0 10px;
  }
  .pf-fc-subtitle {
    font-family: var(--serif);
    font-size: 16px;
    font-style: italic;
    color: var(--ink-soft);
    margin-bottom: 36px;
    line-height: 1.5;
  }
  .pf-fc-section { margin-bottom: 34px; }
  .pf-fc-h {
    font-family: var(--display);
    font-size: 21px;
    font-weight: 500;
    color: var(--ink);
    margin: 0 0 12px;
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
  .pf-fc-num {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--accent);
    font-weight: 600;
  }
  .pf-fc-p {
    font-family: var(--serif);
    font-size: 15.5px;
    line-height: 1.75;
    color: var(--ink);
    margin: 0 0 12px;
  }

  /* Code guides */
  .pf-cg-section { margin-bottom: 30px; }
  .pf-cg-h {
    font-family: var(--display);
    font-size: 19px;
    font-weight: 500;
    color: var(--ink);
    margin: 0 0 10px;
  }
  .pf-cg-say {
    font-family: var(--body);
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--ink-soft);
    padding: 12px 16px;
    background: var(--fu-bg);
    border-left: 3px solid var(--accent);
    border-radius: 3px;
    margin-bottom: 12px;
  }
  .pf-cg-say-label {
    display: block;
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--accent);
    margin-bottom: 6px;
    font-weight: 600;
    font-style: normal;
  }
  .pf-cg-code {
    background: #1c1b1a;
    color: #e8e2d4;
    border-radius: 4px;
    padding: 16px 18px;
    overflow-x: auto;
    font-family: var(--mono);
    font-size: 12.5px;
    line-height: 1.6;
    margin: 0;
    border: 1px solid var(--rule);
  }
  [data-theme="dark"] .pf-cg-code {
    background: #101012;
    border-color: var(--rule);
  }
  .pf-cg-close {
    font-family: var(--body);
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--ink-soft);
    padding: 14px 16px;
    background: var(--fu-bg);
    border: 1px solid var(--rule);
    border-radius: 3px;
    margin-top: 8px;
  }

  /* System design */
  .pf-sd-section { margin-bottom: 30px; }
  .pf-sd-req-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .pf-sd-req-label {
    font-family: var(--mono);
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--accent);
    margin-bottom: 8px;
    font-weight: 600;
  }
  .pf-sd-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .pf-sd-list li {
    font-family: var(--body);
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--ink-soft);
    padding-left: 18px;
    position: relative;
  }
  .pf-sd-list li::before {
    content: '─';
    position: absolute;
    left: 0;
    color: var(--accent);
    font-family: var(--mono);
  }
  .pf-sd-diagram {
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 16px 18px;
    overflow-x: auto;
    font-family: var(--mono);
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--ink);
    margin: 0 0 16px;
  }
  .pf-sd-components { display: flex; flex-direction: column; gap: 8px; }
  .pf-sd-component {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 14px;
    padding: 10px 14px;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: 3px;
  }
  .pf-sd-comp-name {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    line-height: 1.45;
  }
  .pf-sd-comp-role {
    font-family: var(--body);
    font-size: 13px;
    line-height: 1.55;
    color: var(--ink-soft);
  }
  .pf-sd-flow {
    margin: 0;
    padding-left: 22px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pf-sd-flow li {
    font-family: var(--body);
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--ink);
  }
  .pf-sd-flow li::marker {
    font-family: var(--mono);
    color: var(--accent);
    font-weight: 600;
  }
  .pf-sd-lld-block { margin-bottom: 16px; }

  /* First principles Q&A (L4 rewrite) */
  .pf-dd-fpqa { display: flex; flex-direction: column; gap: 14px; }
  .pf-dd-fpqa-item {
    background: var(--fp-bg);
    border: 1px solid var(--rule);
    border-left: 3px solid var(--accent);
    border-radius: 3px;
    padding: 16px 20px;
  }
  .pf-dd-fpqa-q {
    font-family: var(--display);
    font-size: 17px;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 8px;
    line-height: 1.4;
  }
  /* Overview jump index */
  .pf-toc {
    border: 1px solid var(--rule);
    background: var(--paper-warm);
    padding: 18px 20px;
    margin-bottom: 40px;
    border-radius: 2px;
  }
  .pf-toc-label {
    font-family: var(--mono);
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--accent);
    font-weight: 600;
    margin-bottom: 12px;
  }
  .pf-toc-items {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 24px;
  }
  .pf-toc-item {
    display: flex;
    align-items: baseline;
    gap: 10px;
    background: transparent;
    border: none;
    padding: 6px 4px;
    text-align: left;
    cursor: pointer;
    font-family: var(--body);
    font-size: 13.5px;
    color: var(--ink-soft);
    border-radius: 2px;
    transition: color 0.15s ease;
  }
  .pf-toc-item:hover { color: var(--accent); }
  .pf-toc-num {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--accent);
    font-weight: 600;
    flex-shrink: 0;
  }
  .pf-toc-title { line-height: 1.4; }
  .pf-toc-tier {
    font-family: var(--mono);
    font-size: 10px;
    margin-left: auto;
    flex-shrink: 0;
    color: var(--ink-faded);
  }
  .pf-toc-tier.t1 { color: var(--tier-1); }
  .pf-toc-tier.t2 { color: var(--tier-2); }
  .pf-project { scroll-margin-top: 24px; }
  @media (max-width: 720px) { .pf-toc-items { grid-template-columns: 1fr; } }

  /* SD: 15-min plan */
  .pf-sd-plan {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-left: 2px solid var(--accent);
    padding-left: 16px;
  }
  .pf-sd-plan li {
    font-family: var(--body);
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--ink);
  }

  /* SD: key decisions */
  .pf-sd-kd { display: flex; flex-direction: column; gap: 12px; }
  .pf-sd-kd-item {
    border: 1px solid var(--rule);
    background: var(--paper-warm);
    padding: 14px 18px;
    border-radius: 3px;
  }
  .pf-sd-kd-q {
    font-family: var(--display);
    font-size: 16px;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 8px;
  }
  .pf-sd-kd-row {
    display: grid;
    grid-template-columns: 64px 1fr;
    gap: 12px;
    font-family: var(--body);
    font-size: 13px;
    line-height: 1.55;
    color: var(--ink-soft);
    padding: 3px 0;
  }
  .pf-sd-kd-label {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--ink-faded);
    font-weight: 600;
    padding-top: 2px;
  }
  .pf-sd-kd-label.chosen { color: var(--accent); }
  .pf-sd-kd-label.alt { color: var(--tier-2); }

  /* SD: failure modes */
  .pf-sd-fail { display: flex; flex-direction: column; gap: 6px; }
  .pf-sd-fail-row {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 14px;
    padding: 10px 14px;
    border: 1px solid var(--rule);
    border-radius: 3px;
  }
  .pf-sd-fail-f {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    line-height: 1.5;
  }
  .pf-sd-fail-h {
    font-family: var(--body);
    font-size: 13px;
    line-height: 1.55;
    color: var(--ink-soft);
  }
  @media (max-width: 720px) {
    .pf-sd-fail-row { grid-template-columns: 1fr; gap: 4px; }
    .pf-sd-kd-row { grid-template-columns: 1fr; gap: 2px; }
  }

  .pf-dd-fpqa-a {
    font-family: var(--body);
    font-size: 14px;
    line-height: 1.65;
    color: var(--ink-soft);
  }

  @media (max-width: 900px) {
    .pf-fc-shell { grid-template-columns: 1fr; gap: 24px; }
    .pf-fc-side { position: static; max-height: none; border-bottom: 1px solid var(--rule); padding-bottom: 16px; }
    .pf-fc-list { flex-direction: row; flex-wrap: wrap; gap: 6px; }
    .pf-fc-item { border-left: none; border: 1px solid var(--rule); border-radius: 999px; padding: 6px 12px; font-size: 12px; }
    .pf-fc-item.active { border-color: var(--accent); }
    .pf-fc-title { font-size: 30px; }
    .pf-sd-req-grid { grid-template-columns: 1fr; }
    .pf-sd-component { grid-template-columns: 1fr; gap: 4px; }
  }

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
  .pf-hr-multi-badge {
    font-family: var(--mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 3px;
    padding: 2px 6px;
    flex-shrink: 0;
    opacity: 0.85;
  }
  .pf-hr-opt-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4px;
    padding-bottom: 14px;
    border-bottom: 1px dashed var(--rule);
  }
  .pf-hr-opt-tab {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.03em;
    padding: 6px 12px;
    border: 1px solid var(--rule);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-mid);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .pf-hr-opt-tab:hover {
    color: var(--ink);
    border-color: var(--ink-faded);
  }
  .pf-hr-opt-tab.active {
    background: var(--accent);
    color: var(--paper);
    border-color: var(--accent);
    font-weight: 600;
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
  [data-theme="dark"] .pf-killer {
    background: var(--paper-2);
    color: var(--ink);
    border: 1px solid var(--rule);
    border-left: 3px solid var(--accent);
  }
  [data-theme="dark"] .pf-killer-text { color: var(--ink); }
  [data-theme="dark"] .pf-landmines {
    background: rgba(232, 112, 59, 0.07);
    border-color: rgba(232, 112, 59, 0.35);
  }
  [data-theme="dark"] .pf-landmines li { color: var(--ink-soft); }
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
    <article className="pf-project pf-project-full" id={'pf-p-' + project.id}>
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
    if (dd.firstPrinciplesQA || dd.firstPrinciples) list.push({ id: 'fp', num: '00', label: 'First principles' });
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
        {(dd.firstPrinciplesQA || dd.firstPrinciples) && (
          <section className="pf-dd-section pf-dd-fp-section" id="sec-fp">
            <SectionHead id="fp" num="00" title="First principles" em="— L4 Q&amp;A, reason from here" />
            {!collapsed.fp && (dd.firstPrinciplesQA ? (
              <div className="pf-dd-fpqa">
                {dd.firstPrinciplesQA.map((item, i) => (
                  <div key={i} className="pf-dd-fpqa-item">
                    <div className="pf-dd-fpqa-q">{item.q}</div>
                    <div className="pf-dd-fpqa-a">{item.a}</div>
                  </div>
                ))}
              </div>
            ) : (
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
            ))}
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
  const [optionIdx, setOptionIdx] = useState({});
  const [query, setQuery] = useState('');

  const toggle = (key) => setOpenQ((s) => ({ ...s, [key]: !s[key] }));

  const matches = (item, q) => {
    if (item.q.toLowerCase().includes(q)) return true;
    const opts = item.options || [{ answer: item.answer, principle: item.principle }];
    return opts.some(
      (o) =>
        (o.answer || '').toLowerCase().includes(q) ||
        (o.principle || '').toLowerCase().includes(q) ||
        (o.label || '').toLowerCase().includes(q)
    );
  };

  const q = query.trim().toLowerCase();
  const categoriesToShow = q
    ? HR_QUESTIONS.map((c) => ({
        ...c,
        questions: c.questions.filter((item) => matches(item, q)),
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

  const renderAnswerBody = (a) => (
    <>
      {a.principle && (
        <div className="pf-hr-principle">
          <span className="pf-hr-principle-label">Strategy</span>
          {a.principle}
        </div>
      )}
      <div className="pf-hr-answer">{a.answer}</div>
      {a.notes && (
        <div className="pf-hr-notes">
          <span className="pf-hr-notes-label">Delivery notes</span>
          {a.notes}
        </div>
      )}
    </>
  );

  const renderQuestion = (item, key) => {
    const isOpen = !!openQ[key];
    // options model: if item.options exists, it's a multi-project question; else single answer
    const options = item.options || [{ label: item.project || 'Answer', principle: item.principle, answer: item.answer, notes: item.notes }];
    const selectedIdx = optionIdx[key] || 0;
    const current = options[selectedIdx] || options[0];
    const anyVerify = options.some((o) => (o.answer || '').includes('[VERIFY]') || (o.notes || '').includes('VERIFY'));
    const isMulti = options.length > 1;
    return (
      <div key={key} className={`pf-hr-q ${isOpen ? 'open' : ''}`}>
        <button className="pf-hr-q-head" onClick={() => toggle(key)}>
          <span className="pf-hr-q-chevron">{isOpen ? '−' : '+'}</span>
          <span className="pf-hr-q-title">{item.q}</span>
          {isMulti && <span className="pf-hr-multi-badge">{options.length} options</span>}
          {anyVerify && <span className="pf-hr-verify-badge">verify</span>}
        </button>
        {isOpen && (
          <div className="pf-hr-q-body">
            {isMulti && (
              <div className="pf-hr-opt-tabs">
                {options.map((o, i) => (
                  <button
                    key={i}
                    className={`pf-hr-opt-tab ${selectedIdx === i ? 'active' : ''}`}
                    onClick={() => setOptionIdx((s) => ({ ...s, [key]: i }))}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
            {renderAnswerBody(current)}
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
 * FULL CONTEXT COMPONENT — long-form teaching stories
 * ========================================================================== */

const FullContext = () => {
  const ids = Object.keys(FULL_CONTEXT);
  const [selected, setSelected] = useState(ids[0]);
  const fc = FULL_CONTEXT[selected];

  const pick = (id) => {
    setSelected(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pf-fc-shell">
      <aside className="pf-fc-side">
        <div className="pf-dd-side-label">Projects</div>
        <div className="pf-fc-list">
          {ids.map((id) => (
            <button
              key={id}
              className={`pf-fc-item ${selected === id ? 'active' : ''}`}
              onClick={() => pick(id)}
            >
              {FULL_CONTEXT[id].title}
            </button>
          ))}
        </div>
        <div className="pf-fc-side-note">
          Read top to bottom — sections build on each other. This is the
          re-understand tab, not the recall tab.
        </div>
      </aside>
      <div className="pf-fc-main">
        <div className="pf-dd-eyebrow">Full context · first principles</div>
        <h2 className="pf-fc-title">{fc.title}</h2>
        <div className="pf-fc-subtitle">{fc.subtitle}</div>
        {fc.sections.map((s, i) => (
          <section key={i} className="pf-fc-section">
            <h3 className="pf-fc-h">
              <span className="pf-fc-num">{String(i + 1).padStart(2, '0')}</span>
              {s.h}
            </h3>
            {s.body.map((p, j) => (
              <p key={j} className="pf-fc-p">{p}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * CODE GUIDES COMPONENT — whiteboard-ready code with narration
 * ========================================================================== */

/* ============================================================================
 * CODE BLOCK — language label, copy button, lightweight syntax highlighting
 * ========================================================================== */

const CODE_KEYWORDS = new Set(('public private protected static final void class interface enum extends implements new return '
  + 'if else for while do try catch finally throw throws switch case break continue this super null true false import package var record '
  + 'const let function async await export default typeof instanceof '
  + 'def lambda from elif except raise with as pass None True False in not and or '
  + 'type query mutation input GET POST PUT PATCH DELETE '
  + 'SELECT FROM WHERE AND OR ORDER BY LIMIT ENUM NOT NULL BIGINT '
  + 'server location listen routes match route cluster body').split(' '));

const detectLang = (code) => {
  if (/<\/?[a-zA-Z][\w.-]*>/.test(code) && /<plugin>|<configuration>|xmlns|<\/(groupId|artifactId)/.test(code)) return 'xml';
  if (/^\s*(def |import |from \w+ import|print\()/m.test(code) || /_test_split|predict_proba|precision_recall/.test(code)) return 'python';
  if (/\b(mutation|query)\s*\{|^type \w+ \{/m.test(code)) return 'graphql';
  if (/^(GET|POST|PUT|PATCH|DELETE)\s+\//m.test(code)) return 'http';
  if (/\bSELECT\b|\bWHERE\b|ENUM\(|composite PK/i.test(code) && !/public|void/.test(code)) return 'sql';
  if (/@\w+|\b(public|private|void)\b|new \w+\(/.test(code)) return 'java';
  if (/=>|className=|React\./.test(code)) return 'jsx';
  if (/gor --|nginx|server \{|ssl_certificate|forkCount|routes:/.test(code)) return 'config';
  return 'code';
};

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const highlightCode = (code, lang) => {
  // Tokenize the RAW string, escaping as we emit.
  const rules = [];
  rules.push({ re: /\/\*[\s\S]*?\*\//y, cls: 'tok-c' });
  rules.push({ re: /<!--[\s\S]*?-->/y, cls: 'tok-c' });
  rules.push({ re: /\/\/[^\n]*/y, cls: 'tok-c' });
  if (lang !== 'java' && lang !== 'jsx') rules.push({ re: /#[^\n]*/y, cls: 'tok-c' });
  if (lang === 'sql') rules.push({ re: /--[^\n]*/y, cls: 'tok-c' });
  rules.push({ re: /"(?:[^"\\\n]|\\.)*"/y, cls: 'tok-s' });
  rules.push({ re: /'(?:[^'\\\n]|\\.)*'/y, cls: 'tok-s' });
  rules.push({ re: /`[^`]*`/y, cls: 'tok-s' });
  rules.push({ re: /@\w+/y, cls: 'tok-a' });
  if (lang === 'xml') rules.push({ re: /<\/?[A-Za-z][\w.-]*/y, cls: 'tok-t' });
  rules.push({ re: /\b\d+(?:\.\d+)?\b/y, cls: 'tok-n' });
  rules.push({ re: /\b[A-Za-z_]\w*\b/y, cls: null }); // word: keyword check

  let out = '', i = 0;
  const n = code.length;
  while (i < n) {
    let matched = false;
    for (const rule of rules) {
      rule.re.lastIndex = i;
      const m = rule.re.exec(code);
      if (m && m.index === i) {
        const t = m[0];
        let cls = rule.cls;
        if (cls === null) cls = CODE_KEYWORDS.has(t) ? 'tok-k' : '';
        out += cls ? '<span class="' + cls + '">' + escapeHtml(t) + '</span>' : escapeHtml(t);
        i += t.length;
        matched = true;
        break;
      }
    }
    if (!matched) { out += escapeHtml(code[i]); i += 1; }
  }
  return out;
};

const CodeBlock = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const lang = useMemo(() => detectLang(code), [code]);
  const html = useMemo(() => highlightCode(code, lang), [code, lang]);
  const copy = () => {
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (e) { /* clipboard unavailable */ }
  };
  return (
    <div className="pf-codeblock">
      <div className="pf-codeblock-bar">
        <span className="pf-codeblock-lang">{lang}</span>
        <button className="pf-codeblock-copy" onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre className="pf-cg-code"><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
    </div>
  );
};

const CodeGuides = () => {
  const ids = Object.keys(CODE_GUIDES);
  const [selected, setSelected] = useState(ids[0]);
  const g = CODE_GUIDES[selected];

  return (
    <div className="pf-fc-shell">
      <aside className="pf-fc-side">
        <div className="pf-dd-side-label">Guides</div>
        <div className="pf-fc-list">
          {ids.map((id) => (
            <button
              key={id}
              className={`pf-fc-item ${selected === id ? 'active' : ''}`}
              onClick={() => { setSelected(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              {CODE_GUIDES[id].title}
            </button>
          ))}
        </div>
        <div className="pf-fc-side-note">
          Build in the numbered order on a whiteboard. The "say" block is your
          narration — the code is only half the answer.
        </div>
      </aside>
      <div className="pf-fc-main">
        <div className="pf-dd-eyebrow">Code · interview-ready</div>
        <h2 className="pf-fc-title">{g.title}</h2>
        <div className="pf-fc-subtitle">{g.intro}</div>
        {g.sections.map((s, i) => (
          <section key={i} className="pf-cg-section">
            <h3 className="pf-cg-h">{s.h}</h3>
            {s.say && (
              <div className="pf-cg-say">
                <span className="pf-cg-say-label">What to say</span>
                {s.say}
              </div>
            )}
            {s.code && <CodeBlock code={s.code} />}
          </section>
        ))}
        {g.close && (
          <div className="pf-cg-close">
            <span className="pf-cg-say-label">If you remember nothing else</span>
            {g.close}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * SYSTEM DESIGN COMPONENT — HLD + LLD for own projects
 * ========================================================================== */

const SystemDesign = () => {
  const ids = Object.keys(SYSTEM_DESIGNS);
  const [selected, setSelected] = useState(ids[0]);
  const d = SYSTEM_DESIGNS[selected];

  return (
    <div className="pf-fc-shell">
      <aside className="pf-fc-side">
        <div className="pf-dd-side-label">Designs</div>
        <div className="pf-fc-list">
          {ids.map((id) => (
            <button
              key={id}
              className={`pf-fc-item ${selected === id ? 'active' : ''}`}
              onClick={() => { setSelected(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              {SYSTEM_DESIGNS[id].title}
            </button>
          ))}
        </div>
        <div className="pf-fc-side-note">
          Speak in this order: opener → requirements → numbers → HLD →
          flow → LLD → tradeoffs → failures → evolution. Tradeoffs and
          failure walkthroughs are where L4 is decided.
        </div>
      </aside>
      <div className="pf-fc-main">
        <div className="pf-dd-eyebrow">System design · L4 walkthrough</div>
        <h2 className="pf-fc-title">{d.title}</h2>
        <div className="pf-fc-subtitle">{d.goal}</div>

        {d.openingScript && (
          <div className="pf-sd-open">
            <span className="pf-cg-say-label">The 60-second opener — say this while drawing</span>
            {d.openingScript}
          </div>
        )}

        <section className="pf-sd-section">
          <h3 className="pf-cg-h">Requirements</h3>
          <div className="pf-sd-req-grid">
            <div>
              <div className="pf-sd-req-label">Functional</div>
              <ul className="pf-sd-list">
                {d.requirements.functional.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div>
              <div className="pf-sd-req-label">Non-functional</div>
              <ul className="pf-sd-list">
                {d.requirements.nonFunctional.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {d.scale && d.scale.length > 0 && (
          <section className="pf-sd-section">
            <h3 className="pf-cg-h">Numbers to anchor the design</h3>
            <ul className="pf-sd-list">
              {d.scale.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </section>
        )}

        <section className="pf-sd-section">
          <h3 className="pf-cg-h">High-level design</h3>
          <pre className="pf-sd-diagram"><code>{d.hld.diagram}</code></pre>
          <div className="pf-sd-components">
            {d.hld.components.map((c, i) => (
              <div key={i} className="pf-sd-component">
                <div className="pf-sd-comp-name">{c.n}</div>
                <div className="pf-sd-comp-role">{c.r}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="pf-sd-section">
          <h3 className="pf-cg-h">Flow</h3>
          <ol className="pf-sd-flow">
            {d.flow.map((f, i) => <li key={i}>{f}</li>)}
          </ol>
        </section>

        {d.dataModel && (
          <section className="pf-sd-section">
            <h3 className="pf-cg-h">Data model</h3>
            <CodeBlock code={d.dataModel} />
          </section>
        )}

        {d.api && (
          <section className="pf-sd-section">
            <h3 className="pf-cg-h">API / contract</h3>
            <CodeBlock code={d.api} />
          </section>
        )}

        <section className="pf-sd-section">
          <h3 className="pf-cg-h">Low-level detail</h3>
          {d.lld.map((block, i) => (
            <div key={i} className="pf-sd-lld-block">
              <div className="pf-sd-req-label">{block.h}</div>
              <ul className="pf-sd-list">
                {block.points.map((p, j) => <li key={j}>{p}</li>)}
              </ul>
            </div>
          ))}
        </section>

        {d.tradeoffs && d.tradeoffs.length > 0 && (
          <section className="pf-sd-section">
            <h3 className="pf-cg-h">Tradeoffs — defended, not listed</h3>
            <div className="pf-sd-trades">
              {d.tradeoffs.map((t, i) => (
                <div key={i} className="pf-sd-trade">
                  <div className="pf-sd-trade-head">
                    <span className="pf-sd-trade-chose">{t.choice}</span>
                    <span className="pf-sd-trade-over">over {t.over}</span>
                  </div>
                  <div className="pf-sd-trade-why">{t.why}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {d.failures && d.failures.length > 0 && (
          <section className="pf-sd-section">
            <h3 className="pf-cg-h">Failure walkthrough — what breaks and what happens</h3>
            <div className="pf-sd-fails">
              {d.failures.map((f, i) => (
                <div key={i} className="pf-sd-fail">
                  <div className="pf-sd-fail-scenario">{f.scenario}</div>
                  <div className="pf-sd-fail-handling">{f.handling}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {d.evolution && d.evolution.length > 0 && (
          <section className="pf-sd-section">
            <h3 className="pf-cg-h">Evolution — how it grows</h3>
            <ul className="pf-sd-list">
              {d.evolution.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </section>
        )}

        <div className="pf-cg-close">
          <span className="pf-cg-say-label">How to present it</span>
          {d.presentTip}
        </div>
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
      if (e.key === 'c') setView('context');
      if (e.key === 'k') setView('code');
      if (e.key === 's') setView('design');
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
            <span className="pf-tab-badge">L4 depth</span>
          </button>
          <button
            className={`pf-tab ${view === 'context' ? 'active' : ''}`}
            onClick={() => setView('context')}
          >
            Full <em>context</em>
          </button>
          <button
            className={`pf-tab ${view === 'code' ? 'active' : ''}`}
            onClick={() => setView('code')}
          >
            Code
          </button>
          <button
            className={`pf-tab ${view === 'design' ? 'active' : ''}`}
            onClick={() => setView('design')}
          >
            System <em>design</em>
          </button>
          <button
            className={`pf-tab ${view === 'hr-round' ? 'active' : ''}`}
            onClick={() => setView('hr-round')}
          >
            HR <em>round</em>
            <span className="pf-tab-badge hr">Behavioral</span>
          </button>
          <div className="pf-kbd-hint">
            <kbd>o</kbd>/<kbd>d</kbd>/<kbd>c</kbd>/<kbd>k</kbd>/<kbd>s</kbd>/<kbd>h</kbd> views · <kbd>[</kbd><kbd>]</kbd> projects · <kbd>t</kbd> theme
          </div>
        </div>

        {view === 'overview' && (
          <div className="pf-ov-shell">
            <aside className="pf-ov-side">
              <div className="pf-dd-side-label">Jump to project</div>
              <div className="pf-fc-list">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    className="pf-fc-item"
                    onClick={() => {
                      const el = document.getElementById('pf-p-' + p.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    <span className="pf-ov-item">
                      <span className="pf-ov-tier" data-tier={p.tier}>T{p.tier}</span>
                      <span>{p.title}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="pf-dd-side-label" style={{ marginTop: 22 }}>On every card</div>
              <div className="pf-ov-legend">
                <span>§ 01 Narrative</span>
                <span>§ 02 Problem</span>
                <span>§ 03 Architecture</span>
                <span>§ 04 Impact</span>
                <span>§ 05 Killer answer</span>
                <span>§ 06 Grill Q + A</span>
                <span>§ 07 Landmines</span>
              </div>
            </aside>
            <div className="pf-ov-main">
              {/* PROJECTS */}
              <main>
                {filtered.map((p, i) => (
                  <Project key={p.id} project={p} index={PROJECTS.indexOf(p)} />
                ))}
              </main>

              {/* FOOTER */}
              <footer className="pf-footer">
                <span>End of dossier</span>
                <span>{PROJECTS.length} projects</span>
              </footer>
            </div>
          </div>
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

        {view === 'context' && (
          <>
            <FullContext />
            <footer className="pf-footer" style={{ marginTop: 64 }}>
              <span>Full context · {Object.keys(FULL_CONTEXT).length} teaching stories</span>
              <span>Re-understand first, then recall</span>
            </footer>
          </>
        )}

        {view === 'code' && (
          <>
            <CodeGuides />
            <footer className="pf-footer" style={{ marginTop: 64 }}>
              <span>Code · {Object.keys(CODE_GUIDES).length} guides</span>
              <span>Narrate the say-blocks while you write</span>
            </footer>
          </>
        )}

        {view === 'design' && (
          <>
            <SystemDesign />
            <footer className="pf-footer" style={{ marginTop: 64 }}>
              <span>System design · {Object.keys(SYSTEM_DESIGNS).length} walkthroughs</span>
              <span>Goal → HLD → flow → LLD → scale</span>
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
