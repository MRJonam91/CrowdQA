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

test("computeAuditMetrics calculates CrowdScore, Grade and Defect Density accurately", () => {
  const campaign = validateCampaign({
    id: "camp-score",
    title: "Score Campaign",
    targetUrl: "https://example.com",
    steps: [
      { id: "s-1", instruction: "1", expectedOutcome: "1" },
      { id: "s-2", instruction: "2", expectedOutcome: "2" },
    ],
  });

  const findings: FindingSubmission[] = [
    {
      id: "f-minor",
      campaignId: campaign.id,
      testerId: "t-1",
      stepId: "s-1",
      title: "Minor text misalignment",
      type: "visual_defect",
      severity: "minor",
      reproducibility: "always",
      environment: { browser: "Chrome", os: "macOS", viewport: "1920x1080" },
      stepsToReproduce: ["view"],
      expectedBehavior: "aligned",
      actualBehavior: "offset 2px",
      createdAt: new Date().toISOString(),
    },
  ];

  const report = generateAuditReport(campaign, [sanitizeFinding(findings[0]!)], []);
  assert.equal(report.metrics.blockersCount, 0);
  assert.equal(report.metrics.criticalCount, 0);
  assert.equal(report.metrics.minorCount, 1);
  assert.equal(report.metrics.crowdScore, 98);
  assert.equal(report.metrics.grade, "A+");
  assert.equal(report.metrics.defectDensityIndex, 0.5);
});

