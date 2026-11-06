# Architettura / Architecture — CrowdQA

```
                          ┌────────────────────────┐
                          │   Campaign Manager     │
                          │ (Product Team / QA Lead│
                          └───────────┬────────────┘
                                      │ defines scope, target URL, viewports, steps, gates
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             CrowdQA Core Engine                                  │
│                                                                                  │
│  1. Campaign Orchestrator:                                                       │
│     ├── Viewport Matrix (Mobile, Tablet, Desktop)                                │
│     ├── Tester Demographics & Personas (Novice, Power User, Locale)              │
│     └── Scenario Step Sequencing & Heuristic Prompts (UX, A11y, AI drift)        │
│                                                                                  │
│  2. Tester Onboarding & Legal Cryptographic Guard:                               │
│     ├── Informed Consent Generator                                               │
│     ├── Non-Disclosure Agreement (NDA) Terms                                     │
│     └── SHA-256 Provenance & Consent Signature Verification                      │
│                                                                                  │
│  3. Ingestion & Automated Privacy Sanitizer:                                     │
│     ├── Strict Schema Normalization & Validation                                 │
│     ├── Automated PII Redactor (JWTs, Bearer Tokens, API Keys, Passwords,        │
│     │   Emails, Credit Cards)                                                    │
│     └── Redacted Evidence Packaging                                              │
│                                                                                  │
│  4. Deduplication & Semantic Clustering:                                         │
│     ├── Step & Component Heuristic Matching                                      │
│     ├── Severity Escalation (Blocker > Critical > Major > Minor > Suggestion)     │
│     └── Device & Tester Cohort Aggregation                                       │
│                                                                                  │
│  5. Synthesis & Multi-Format Reporter:                                            │
│     ├── Quantitative Metrics (TCR, Usability Friction Index, Defect Density)     │
│     ├── Quality Gate Evaluator (PASSED / FAILED / CONDITIONAL)                   │
│     ├── Structured Markdown Audit Document                                       │
│     ├── Machine-Readable JSON Export                                             │
│     └── Standalone Interactive HTML Dashboard (Zero CDN, SVG Charts, Dark Mode)  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                 ┌──────────────────────────────────────────┐
                 │        Published Audit Deliverables      │
                 │  • audit-report.md (Executive & Tech)   │
                 │  • audit-report.json (CI/CD Quality Gate)│
                 │  • audit-report.html (Interactive View)  │
                 └──────────────────────────────────────────┘
```

## Modular Components

### 1. `src/core/campaign.ts`
Manages campaign definitions, declarative validation, scenario steps, and evaluates whether a batch of findings respects the configured quality gates (maximum allowed blockers, critical defects, minimum task completion rate, and mandatory cryptographic consent signatures).

### 2. `src/core/consent.ts`
Enforces informed consent and confidentiality before test execution begins. Generates binding legal agreement texts and signs them deterministically using SHA-256 hashing. Prevents tampering and establishes verifiable tester audit trails.

### 3. `src/core/sanitizer.ts`
Zero-leak privacy and security module. Automatically detects and redacts high-risk strings (Bearer credentials, API tokens, JWTs, credit card numbers, passwords, emails) across titles, steps, and log extracts before storage or reporting.

### 4. `src/core/findings.ts`
Validates finding payloads and clusters duplicate issues reported by multiple independent testers across different devices into a unified, actionable defect cluster with escalated severity.

### 5. `src/core/report.ts`
Calculates objective metrics (Task Completion Rate, Friction Index, defect distribution) and renders reports in Markdown, JSON, and standalone, zero-dependency HTML.

## Extensibility & Third-Party Integration

- **CI/CD Integration**: CrowdQA returns machine-readable JSON; pipelines can inspect `gateEvaluation.status === "PASSED"` to block deployment on unresolved blocker defects.
- **Issue Trackers**: Deduplicated clusters can be exported directly to Jira or Linear via standard Webhook or JSON translation.
