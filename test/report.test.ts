// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { validateCampaign } from "../src/core/campaign.ts";
import { createTesterConsent } from "../src/core/consent.ts";
import { generateAuditReport, renderHtmlReport, renderMarkdownReport } from "../src/core/report.ts";
import { sanitizeFinding } from "../src/core/sanitizer.ts";
import type { FindingSubmission } from "../src/core/types.ts";

test("generateAuditReport produces metrics, markdown, and html outputs", () => {
  const campaign = validateCampaign({
    id: "camp-alpha",
    title: "Alpha Release QA Mission",
    targetUrl: "https://alpha.example.com",
    steps: [
      { id: "s-1", stepNumber: 1, title: "Step 1", instruction: "Do A", expectedOutcome: "A done" },
      { id: "s-2", stepNumber: 2, title: "Step 2", instruction: "Do B", expectedOutcome: "B done" },
    ],
  });

  const consent = createTesterConsent("tester-99", campaign.id);

  const finding: FindingSubmission = {
    id: "f-99",
    campaignId: campaign.id,
    testerId: "tester-99",
    stepId: "s-2",
    title: "Infinite loop on Step 2 submit",
    type: "functional_bug",
    severity: "blocker",
    reproducibility: "always",
    environment: { browser: "Firefox 132", os: "macOS", viewport: "1920x1080" },
    stepsToReproduce: ["submit"],
    expectedBehavior: "redirect to dashboard",
    actualBehavior: "browser tab freezes",
    createdAt: new Date().toISOString(),
  };

  const report = generateAuditReport(campaign, [sanitizeFinding(finding)], [consent]);

  assert.equal(report.campaignId, "camp-alpha");
  assert.equal(report.metrics.totalTesters, 1);
  assert.equal(report.metrics.totalSubmissions, 1);
  assert.equal(report.metrics.blockersCount, 1);
  assert.equal(report.metrics.gateEvaluation.status, "FAILED");
  assert.ok(report.provenanceHash.length === 64);

  const md = renderMarkdownReport(report);
  assert.ok(md.includes("CrowdQA Audit Report"));
  assert.ok(md.includes("Infinite loop on Step 2 submit"));
  assert.ok(md.includes("FAILED"));

  const html = renderHtmlReport(report);
  assert.ok(html.includes("<!DOCTYPE html>"));
  assert.ok(html.includes("CrowdQA Audit Report"));
  assert.ok(html.includes("FAILED"));
});
