# Launch Checklist — CrowdQA v0.3.0-beta

Formal pre-publication verification checklist for CrowdQA Beta release.

## Quality & Governance Checklist

- [x] AGPL-3.0-only full unmodified text in `LICENSE`
- [x] Commercial licensing path documented in `COMMERCIAL-LICENSE.md`
- [x] Contributor License Agreement in `CLA.md`
- [x] Attribution and rights breakdown in `LICENSING.md`
- [x] Funding and donation channels configured in `.github/FUNDING.yml` and READMEs
- [x] GitHub Actions CI workflow passing with core size guard (< 1,500 non-empty LOC)
- [x] 100% test pass rate across Node.js 22 and 24 (35 passing tests)
- [x] Anti-plagiarism markers registered in `_provenance/CrowdQA.json`
- [x] Zero external runtime dependencies
- [x] SARIF 2.1.0, JUnit XML, CSV, and GitHub issue card export engine
- [x] CrowdScore™ benchmark rating algorithm (Grade A+ to F) and Defect Density Index
- [x] Built-in local HTTP server for interactive HTML report preview
- [x] Interactive HTML dashboard with live keyword search and severity filter tabs
- [x] Batch findings ingestion (`crowdqa submit --dir ...`)
- [x] Campaign configuration linter and heuristic categorization
- [x] Bilingual READMEs (Italian / English) with terminal SVG demo
- [x] Zero-leak automated PII sanitization enabled by default
- [x] GitHub repository initialized and synchronized with remote

## Promotion Strategy & Target Audiences

1. **Independent Builders & Indie Hackers**:
   - Small development teams and bootstrapped founders who struggle to get structured human testing on conversion funnels.
   - Show how CrowdQA replaces chaotic bug spreadsheets with automated consent, PII redaction, clustering, and developer-ready HTML reports.

2. **Open Source & Quality Assurance Communities**:
   - Share on Hacker News (Show HN), Reddit (`r/qualityassurance`, `r/webdev`), and technical testing groups.
   - Tagline: *CrowdQA — Structured human QA & crowd testing engine with automated PII scrub and zero runtime dependencies.*

3. **Freelancers & Testing Agencies**:
   - Provide a turnkey standard for delivering pilot QA audits (€199 service model) to clients with professional cryptographic reports.
