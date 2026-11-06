# Changelog — CrowdQA

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-06

### Added
- **Campaign Engine**: Declarative test campaign schema definition supporting multi-device viewport matrix, tester personas, sequential scenario flows, heuristic evaluations, and quality gate thresholds.
- **Tester Onboarding & Consent**: Cryptographic SHA-256 agreement generator for informed consent and confidentiality/NDA obligations.
- **Finding Intake & PII Sanitizer**: Automated pattern redaction for sensitive data (emails, Bearer tokens, API keys, JWTs, credit cards, passwords) from evidence logs and reproduction notes.
- **Crowd Finding Clustering**: Deduplication and similarity clustering across crowd submissions to pinpoint recurring blockers and edge cases.
- **Multi-Format Synthesis**: Unified report generation in structured Markdown, machine-readable JSON, and self-contained interactive HTML with SVG charts and severity filtering.
- **Zero-Dependency CLI (`crowdqa`)**: Subcommands for `init`, `consent`, `submit`, `cluster`, `report`, `verify`, and simulated `demo`.
- **Repository Standards & Governance**: Dual AGPL-3.0-only / Commercial licensing with CLA, funding links, CI quality guards, and anti-plagiarism provenance registration.
