// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { exportToCsv, exportToGitHubMarkdownIssues, exportToSarif } from "../src/core/exporters.ts";
import { generateAuditReport } from "../src/core/report.ts";
import { validateCampaign } from "../src/core/campaign.ts";
import { sanitizeFinding } from "../src/core/sanitizer.ts";
import type { FindingSubmission } from "../src/core/types.ts";

function createSampleReport() {
  const campaign = validateCampaign({
    id: "camp-export",
    title: "Export Test",
    targetUrl: "https://demo.app/checkout",
    steps: [{ id: "step-1", instruction: "Click checkout", expectedOutcome: "Modal opens" }],
  });

  const finding: FindingSubmission = {
    id: "f-exp-1",
    campaignId: "camp-export",
    testerId: "tester-sam",
    stepId: "step-1",
    title: "Checkout button fails with 500 error",
    type: "functional_bug",
    severity: "critical",
    reproducibility: "always",
    environment: { browser: "Chrome 130", os: "macOS", viewport: "1920x1080" },
    stepsToReproduce: ["open page", "click button"],
    expectedBehavior: "opens modal",
    actualBehavior: "server returns 500",
    createdAt: new Date().toISOString(),
  };

  return generateAuditReport(campaign, [sanitizeFinding(finding)], []);
}

test("exportToSarif generates valid SARIF 2.1.0 schema structure", () => {
  const report = createSampleReport();
  const sarif = exportToSarif(report) as any;

  assert.equal(sarif.version, "2.1.0");
  assert.ok(sarif.$schema.includes("sarif-schema-2.1.0.json"));
  assert.equal(sarif.runs.length, 1);
  assert.equal(sarif.runs[0].tool.driver.name, "CrowdQA");
  assert.equal(sarif.runs[0].results.length, 1);
  assert.equal(sarif.runs[0].results[0].ruleId, "crowdqa/functional_bug");
  assert.equal(sarif.runs[0].results[0].level, "error");
});

test("exportToCsv formats headers and rows with escaping", () => {
  const report = createSampleReport();
  const csv = exportToCsv(report);

  assert.ok(csv.includes("ClusterID,Title,Severity,Type,StepID"));
  assert.ok(csv.includes("Checkout button fails with 500 error"));
  assert.ok(csv.includes("critical"));
});

test("exportToGitHubMarkdownIssues produces formatted markdown issue cards", () => {
  const report = createSampleReport();
  const issues = exportToGitHubMarkdownIssues(report);

  assert.ok(issues.includes("### [CrowdQA] [CRITICAL] Checkout button fails with 500 error"));
  assert.ok(issues.includes("#### Expected Behavior"));
  assert.ok(issues.includes("#### Actual Behavior"));
});
