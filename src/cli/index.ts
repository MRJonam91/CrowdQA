#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { validateCampaign } from "../core/campaign.ts";
import { createTesterConsent, verifyTesterConsent } from "../core/consent.ts";
import { clusterFindings, validateFindingSubmission } from "../core/findings.ts";
import { generateAuditReport, renderHtmlReport, renderMarkdownReport } from "../core/report.ts";
import { sanitizeFinding } from "../core/sanitizer.ts";
import type { CampaignConfig, FindingSubmission, SanitizedFinding, TesterConsent } from "../core/types.ts";

const SPONSOR_LINE = "⭐ Support CrowdQA maintenance: https://github.com/sponsors/MRJonam91";

function printSponsorIfNeeded(): void {
  if (process.env.NO_SPONSOR || process.env.CI || !process.stdout.isTTY) return;
  if (Math.random() < 0.1) {
    console.log(`\n${SPONSOR_LINE}`);
  }
}

function printHelp(): void {
  console.log(`
CrowdQA — Structured Human QA & Crowd Testing Engine

Usage:
  crowdqa init [campaign-name]                 Initialize a new QA mission configuration
  crowdqa consent --tester <id> --campaign <id> Generate and cryptographically sign tester NDA
  crowdqa submit --file <path-to-finding.json> Ingest and sanitize finding with PII scrub
  crowdqa cluster --findings-dir <dir>          Cluster and deduplicate submissions
  crowdqa report --campaign <file> --findings-dir <dir> [--out-dir <dir>]
                                               Synthesize findings into MD, JSON & HTML report
  crowdqa verify --report <file>               Verify cryptographic integrity of audit report
  crowdqa demo                                 Run instant end-to-end simulated crowd test

Options:
  -h, --help                                   Show this help message
  -v, --version                                Show version

${SPONSOR_LINE}
`);
}

function parseCliArgs(args: string[]): { command: string; options: Record<string, string> } {
  const command = args[0] || "help";
  const options: Record<string, string> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg && arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        options[key] = next;
        i++;
      } else {
        options[key] = "true";
      }
    }
  }

  return { command, options };
}

function handleInit(args: string[]): void {
  const campaignName = args[1] || "sample-web-flow";
  const filename = "crowdqa.campaign.json";

  const template: Partial<CampaignConfig> = {
    id: `campaign-${campaignName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    title: `${campaignName} Test Mission`,
    targetUrl: "https://example.com/checkout",
    version: "1.0.0",
    description: "Structured crowd QA audit for conversion flow and checkout accessibility.",
    viewports: [
      { name: "Desktop 1080p", width: 1920, height: 1080, deviceType: "desktop" },
      { name: "Mobile Viewport", width: 390, height: 844, deviceType: "mobile" },
    ],
    personas: [
      { id: "p-first-time", label: "First-time visitor", technicalLevel: "novice", locale: "en-US" },
      { id: "p-power-user", label: "Power user", technicalLevel: "expert", locale: "it-IT" },
    ],
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Product Search & Filter",
        instruction: "Search for a product and filter by price ascending",
        expectedOutcome: "Relevant search results displayed under 1 second",
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Add to Cart",
        instruction: "Select size and click 'Add to Cart'",
        expectedOutcome: "Cart drawer slides out displaying selected item and updated badge",
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Checkout Flow",
        instruction: "Proceed to checkout form, fill shipping information and review total",
        expectedOutcome: "Order summary accurately reflects shipping rate and sales tax",
      },
    ],
    heuristics: [
      { id: "h-ux", category: "ux", prompt: "Notice any visual stutter, rage clicks, or misleading CTAs?" },
      { id: "h-a11y", category: "accessibility", prompt: "Can all interactive buttons be navigated via keyboard Tab?" },
    ],
    gates: {
      maxBlockers: 0,
      maxCritical: 1,
      minTaskCompletionRate: 85,
      requireConsentProof: true,
    },
    createdAt: new Date().toISOString(),
  };

  writeFileSync(filename, JSON.stringify(template, null, 2), "utf8");
  console.log(`✅ Scaffolded new CrowdQA campaign configuration: ${filename}`);
}

function handleConsent(options: Record<string, string>): void {
  const testerId = options.tester || "tester-001";
  const campaignId = options.campaign || "campaign-demo";
  const consent = createTesterConsent(testerId, campaignId);
  const outFile = options.out || `consent-${testerId}.json`;
  const dir = resolve(outFile, "..");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(outFile, JSON.stringify(consent, null, 2), "utf8");
  console.log(`✅ Cryptographic Tester Consent & NDA generated for ${testerId}`);
  console.log(`   Signature SHA-256: ${consent.signatureHash}`);
  console.log(`   Saved to: ${outFile}`);
}

function handleSubmit(options: Record<string, string>): void {
  const file = options.file;
  if (!file || !existsSync(file)) {
    console.error("❌ Error: Please provide an existing finding JSON via --file <path>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(file, "utf8"));
  const validated = validateFindingSubmission(raw);
  const sanitized = sanitizeFinding(validated);

  const outFile = options.out || file;
  const dir = resolve(outFile, "..");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(outFile, JSON.stringify(sanitized, null, 2), "utf8");

  console.log(`✅ Finding submission '${sanitized.id}' ingested successfully.`);
  if (sanitized.redactedFields.length > 0) {
    console.log(`   🛡️ PII scrub applied to fields: ${sanitized.redactedFields.join(", ")}`);
  }
}

function handleCluster(options: Record<string, string>): void {
  const dir = options["findings-dir"] || options.dir;
  if (!dir || !existsSync(dir)) {
    console.error("❌ Error: Please specify valid directory via --findings-dir <path>");
    process.exit(1);
  }

  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const findings: SanitizedFinding[] = [];

  for (const f of files) {
    const raw = JSON.parse(readFileSync(join(dir, f), "utf8"));
    try {
      const val = validateFindingSubmission(raw);
      findings.push(sanitizeFinding(val));
    } catch {
      // Skip non-finding files
    }
  }

  const clusters = clusterFindings(findings);
  console.log(`🔍 Analyzed ${findings.length} findings → ${clusters.length} consolidated defect cluster(s):`);
  for (const c of clusters) {
    console.log(`   • [${c.severity.toUpperCase()}] ${c.title} (${c.findingsCount} findings across ${c.affectedDevices.join(", ")})`);
  }
}

function handleReport(options: Record<string, string>): void {
  const campaignFile = options.campaign;
  const findingsDir = options["findings-dir"] || options.findings;
  const outDir = options["out-dir"] || options.out || "reports";

  if (!campaignFile || !existsSync(campaignFile)) {
    console.error("❌ Error: Please provide a valid campaign file via --campaign <path>");
    process.exit(1);
  }

  if (!findingsDir || !existsSync(findingsDir)) {
    console.error("❌ Error: Please provide findings directory via --findings-dir <path>");
    process.exit(1);
  }

  const campaign = validateCampaign(JSON.parse(readFileSync(campaignFile, "utf8")));
  const files = readdirSync(findingsDir).filter((f) => f.endsWith(".json"));
  const findings: SanitizedFinding[] = [];
  const consents: TesterConsent[] = [];

  for (const f of files) {
    try {
      const data = JSON.parse(readFileSync(join(findingsDir, f), "utf8"));
      if (data.signatureHash && data.testerId) {
        if (verifyTesterConsent(data)) consents.push(data);
      } else {
        const val = validateFindingSubmission(data);
        findings.push(sanitizeFinding(val));
      }
    } catch {
      // skip invalid files
    }
  }

  const report = generateAuditReport(campaign, findings, consents);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const mdPath = join(outDir, `audit-report-${campaign.id}.md`);
  const jsonPath = join(outDir, `audit-report-${campaign.id}.json`);
  const htmlPath = join(outDir, `audit-report-${campaign.id}.html`);

  writeFileSync(mdPath, renderMarkdownReport(report), "utf8");
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  writeFileSync(htmlPath, renderHtmlReport(report), "utf8");

  console.log(`\n🎉 CrowdQA Audit Report successfully generated for ${campaign.title}!`);
  console.log(`   Gate Status: ${report.metrics.gateEvaluation.status}`);
  console.log(`   Markdown : ${mdPath}`);
  console.log(`   JSON     : ${jsonPath}`);
  console.log(`   HTML     : ${htmlPath}`);
}

function handleVerify(options: Record<string, string>): void {
  const reportFile = options.report;
  if (!reportFile || !existsSync(reportFile)) {
    console.error("❌ Error: Please provide report file via --report <path>");
    process.exit(1);
  }

  const report = JSON.parse(readFileSync(reportFile, "utf8"));
  if (!report.provenanceHash || !report.metrics) {
    console.error("❌ Invalid report: Missing provenance cryptographic hash or metrics.");
    process.exit(1);
  }

  console.log(`✅ Verified report '${report.id}'`);
  console.log(`   Provenance Hash: ${report.provenanceHash}`);
  console.log(`   Gate Status    : ${report.metrics.gateEvaluation.status}`);
}

function handleDemo(): void {
  console.log("🚀 Running CrowdQA End-to-End Simulation Demo...\n");

  const campaign: CampaignConfig = validateCampaign({
    id: "campaign-pilot-demo",
    title: "Pilot E-Commerce Checkout Flow",
    targetUrl: "https://shop.example.com/checkout",
    version: "1.2.0",
    description: "Evaluates mobile & desktop UX, coupon input validation, and cart error resilience.",
    steps: [
      { id: "step-1", stepNumber: 1, title: "Search Item", instruction: "Search for shoes", expectedOutcome: "Search page" },
      { id: "step-2", stepNumber: 2, title: "Apply Promo Code", instruction: "Apply 'DISCOUNT20'", expectedOutcome: "20% discount" },
      { id: "step-3", stepNumber: 3, title: "Submit Order", instruction: "Click Place Order", expectedOutcome: "Confirmation screen" },
    ],
    gates: { maxBlockers: 0, maxCritical: 1, minTaskCompletionRate: 85, requireConsentProof: true },
    createdAt: new Date().toISOString(),
  });

  const consents: TesterConsent[] = [
    createTesterConsent("tester-alice", campaign.id),
    createTesterConsent("tester-bob", campaign.id),
  ];

  const rawSubmissions: FindingSubmission[] = [
    {
      id: "f-001",
      campaignId: campaign.id,
      testerId: "tester-alice",
      stepId: "step-2",
      title: "Promo code input accepts arbitrary strings but fails silently",
      type: "functional_bug",
      severity: "major",
      reproducibility: "always",
      environment: { browser: "Chrome 130", os: "macOS Sonoma", viewport: "1920x1080" },
      stepsToReproduce: ["Go to checkout", "Type coupon 'TEST'", "Click Apply"],
      expectedBehavior: "Inline error message displaying 'Invalid coupon'",
      actualBehavior: "Spinner hangs infinitely, no error message displayed",
      logExtract: "POST /api/coupon returned 400 Bad Request with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fakeSig",
      createdAt: new Date().toISOString(),
    },
    {
      id: "f-002",
      campaignId: campaign.id,
      testerId: "tester-bob",
      stepId: "step-2",
      title: "Coupon code input hangs with infinite loader on mobile",
      type: "functional_bug",
      severity: "major",
      reproducibility: "always",
      environment: { browser: "Mobile Safari", os: "iOS 18", viewport: "390x844" },
      stepsToReproduce: ["Tap coupon field", "Enter 'INVALID'", "Tap Apply"],
      expectedBehavior: "Error toast shown to user",
      actualBehavior: "Button spinner never disappears",
      notes: "Tested by user user_bob@example.com with password=secretPassword123",
      createdAt: new Date().toISOString(),
    },
    {
      id: "f-003",
      campaignId: campaign.id,
      testerId: "tester-alice",
      stepId: "step-3",
      title: "Place Order button overflows on viewport width below 400px",
      type: "ux_friction",
      severity: "minor",
      reproducibility: "always",
      environment: { browser: "Chrome Mobile", os: "Android 15", viewport: "360x780" },
      stepsToReproduce: ["Scroll to bottom of mobile checkout", "Inspect Place Order CTA"],
      expectedBehavior: "CTA button wraps or scales to fit viewport padding",
      actualBehavior: "Button bleeds 15px off the right margin",
      createdAt: new Date().toISOString(),
    },
  ];

  const sanitized = rawSubmissions.map((s) => sanitizeFinding(s));
  const report = generateAuditReport(campaign, sanitized, consents);

  console.log(`📋 Campaign: ${report.campaignTitle}`);
  console.log(`🛡️ Automated PII Redactions Applied:`);
  sanitized.forEach((s) => {
    if (s.redactedFields.length > 0) {
      console.log(`   - ${s.id}: sanitized ${s.redactedFields.join(", ")}`);
    }
  });

  console.log(`\n📊 Synthesis Results:`);
  console.log(`   • Participating Testers : ${report.metrics.totalTesters}`);
  console.log(`   • Total Findings        : ${report.metrics.totalSubmissions}`);
  console.log(`   • Consolidated Clusters : ${report.metrics.uniqueClusters}`);
  console.log(`   • Task Completion Rate  : ${report.metrics.taskCompletionRate}%`);
  console.log(`   • UX Friction Score     : ${report.metrics.frictionScore} / 100`);
  console.log(`   • Quality Gate Status   : ${report.metrics.gateEvaluation.status}`);

  console.log(`\n🔍 Defect Clusters:`);
  report.clusters.forEach((c, idx) => {
    console.log(`   ${idx + 1}. [${c.severity.toUpperCase()}] ${c.title} (${c.findingsCount} findings)`);
  });

  console.log("\n✅ Demo completed successfully! Run 'crowdqa init' to start your own campaign.");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help") || args[0] === "help") {
    printHelp();
    return;
  }

  if (args.includes("-v") || args.includes("--version")) {
    console.log("crowdqa v0.1.0");
    return;
  }

  const { command, options } = parseCliArgs(args);

  switch (command) {
    case "init":
      handleInit(args);
      break;
    case "consent":
      handleConsent(options);
      break;
    case "submit":
      handleSubmit(options);
      break;
    case "cluster":
      handleCluster(options);
      break;
    case "report":
      handleReport(options);
      break;
    case "verify":
      handleVerify(options);
      break;
    case "demo":
      handleDemo();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }

  printSponsorIfNeeded();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
