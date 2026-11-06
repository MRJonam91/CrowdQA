# Launch Checklist — CrowdQA v1.0.0

Formal verification checklist for CrowdQA v1.0.0 General Availability release.

## Quality & Governance Checklist

- [x] AGPL-3.0-only full unmodified text in `LICENSE`
- [x] Commercial licensing path documented in `COMMERCIAL-LICENSE.md`
- [x] Contributor License Agreement in `CLA.md`
- [x] Attribution and rights breakdown in `LICENSING.md`
- [x] Funding and donation channels configured in `.github/FUNDING.yml` and READMEs
- [x] GitHub Actions CI workflow passing with core size guard (< 1,500 non-empty LOC)
- [x] 100% test pass rate across Node.js 22 and 24 (40 passing tests)
- [x] Origin provenance signature registered
- [x] Zero external runtime dependencies
- [x] SARIF 2.1.0, JUnit XML, CSV, and GitHub issue card export engine
- [x] CrowdScore™ benchmark rating algorithm (Grade A+ to F) and Defect Density Index
- [x] Built-in local HTTP server for interactive HTML report preview (`crowdqa serve`)
- [x] Interactive HTML dashboard with live keyword search and severity filter tabs
- [x] Environment pre-flight diagnostics (`crowdqa doctor`) and dynamic SVG badge generator (`crowdqa badge`)
- [x] Batch findings ingestion (`crowdqa submit --dir ...`)
- [x] Campaign configuration linter and heuristic categorization (`crowdqa check`)
- [x] Bilingual READMEs (Italian / English) with terminal SVG demo
- [x] Zero-leak automated PII sanitization enabled by default
- [x] Development roadmap published in `docs/ROADMAP.md`
- [x] GitHub repository synchronized and public

## Promotion Strategy & Target Audiences

1. **Independent Builders & Indie Hackers**:
   - Small development teams and bootstrapped founders who struggle to get structured human testing on conversion funnels.
   - Show how CrowdQA replaces chaotic bug spreadsheets with automated consent, PII redaction, clustering, and developer-ready HTML reports.

2. **Open Source & Quality Assurance Communities**:
   - Share on Hacker News (Show HN), Reddit (`r/qualityassurance`, `r/webdev`), and technical testing groups.
   - Tagline: *CrowdQA — Structured human QA & crowd testing engine with automated PII scrub and zero runtime dependencies.*

3. **Freelancers & Testing Agencies**:
   - Provide a turnkey standard for delivering pilot QA audits (€199 service model) to clients with professional cryptographic reports.
