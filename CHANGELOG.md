# Changelog — CrowdQA

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0-beta] - 2026-11-06

### Added
- **JUnit XML Test Results Exporter**: Export audit reports to standard JUnit XML (`crowdqa export --format junit`) for native defect tracking in CI test views (GitHub Actions, GitLab CI, Jenkins, Azure DevOps).
- **CrowdScore™ & Defect Density Benchmark**: Proprietary weighted scoring algorithm computing a 0–100 benchmark score, letter grade (`A+` to `F`), Defect Density Index (DDI), and inter-tester agreement rate.
- **Interactive HTML Dashboard Enhancements**: Integrated client-side real-time keyword search, active severity filter tabs with live counters, and card tags with zero CDN dependencies.
- **Batch Findings Submission**: Ingest and sanitize entire directories of findings in one operation via `crowdqa submit --dir <folder>`.
- **Quality Gate Overrides & CI Enforcement**: Configurable CLI flags (`--max-blockers <N>`, `--max-critical <N>`, `--min-tcr <N>`, `--fail-on-violation`) for automated deployment blocking.
- **Test Suite Expansion**: Added hermetic CI test isolation, JUnit XML validation, score benchmarks, and reach 35 passing tests.

## [0.2.0-alpha] - 2026-11-06

### Added
- **SARIF 2.1.0 Exporter**: Native export to OASIS SARIF format (`crowdqa export --format sarif`) enabling direct ingestion into GitHub Code Scanning and IDE security viewers.
- **CSV & GitHub Issue Card Exporters**: Formatted tabular export (`crowdqa export --format csv`) for spreadsheet triage and pre-rendered GitHub issue markdown cards.
- **Campaign Configuration Linter**: Declarative validator (`crowdqa check`) verifying URL validity, viewport coverage (including mobile requirements), reachability, and quality gate constraints.
- **Interactive Report Server**: Built-in zero-dependency HTTP preview server (`crowdqa serve`) to locally host and inspect interactive HTML audit dashboards.
- **Heuristic Rubric Evaluator**: Classification engine mapping findings to usability, WCAG accessibility, performance, and AI hallucination/drift categories.
- **Test Suite Expansion**: Comprehensive unit and integration test coverage across all core modules (26 passing tests).

## [0.1.0] - 2026-11-06

### Added
- **Campaign Engine**: Declarative test campaign schema definition supporting multi-device viewport matrix, tester personas, sequential scenario flows, heuristic evaluations, and quality gate thresholds.
- **Tester Onboarding & Consent**: Cryptographic SHA-256 agreement generator for informed consent and confidentiality/NDA obligations.
- **Finding Intake & PII Sanitizer**: Automated pattern redaction for sensitive data (emails, Bearer tokens, API keys, JWTs, credit cards, passwords) from evidence logs and reproduction notes.
- **Crowd Finding Clustering**: Deduplication and similarity clustering across crowd submissions to pinpoint recurring blockers and edge cases.
- **Multi-Format Synthesis**: Unified report generation in structured Markdown, machine-readable JSON, and self-contained interactive HTML with SVG charts and severity filtering.
- **Zero-Dependency CLI (`crowdqa`)**: Subcommands for `init`, `consent`, `submit`, `cluster`, `report`, `verify`, and simulated `demo`.
- **Repository Standards & Governance**: Dual AGPL-3.0-only / Commercial licensing with CLA, funding links, CI quality guards, and anti-plagiarism provenance registration.
