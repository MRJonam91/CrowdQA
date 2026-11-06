// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { evaluateQualityGates, validateCampaign } from "../src/core/campaign.ts";
import type { FindingSubmission, TesterConsent } from "../src/core/types.ts";

test("validateCampaign normalizes valid campaign definition", () => {
  const campaign = validateCampaign({
    id: "test-campaign",
    title: "Test Campaign",
    targetUrl: "https://test.app",
    steps: [{ id: "step-1", title: "Step 1", instruction: "Do something", expectedOutcome: "Success" }],
  });

  assert.equal(campaign.id, "test-campaign");
  assert.equal(campaign.title, "Test Campaign");
  assert.equal(campaign.steps.length, 1);
  assert.equal(campaign.gates.maxBlockers, 0);
  assert.ok(campaign.viewports.length > 0);
  assert.ok(campaign.personas.length > 0);
});

test("validateCampaign rejects invalid campaigns", () => {
  assert.throws(() => validateCampaign(null), /expected an object/);
  assert.throws(() => validateCampaign({}), /must have a valid string id/);
  assert.throws(() => validateCampaign({ id: "c1" }), /must have a title/);
  assert.throws(() => validateCampaign({ id: "c1", title: "T1" }), /must specify targetUrl/);
  assert.throws(() => validateCampaign({ id: "c1", title: "T1", targetUrl: "https://a.b" }), /must define at least one scenario step/);
});

test("evaluateQualityGates detects blocker violations", () => {
  const campaign = validateCampaign({
    id: "c1",
    title: "C1",
    targetUrl: "https://a.b",
    steps: [{ id: "s1", instruction: "i", expectedOutcome: "e" }],
    gates: { maxBlockers: 0, maxCritical: 1, minTaskCompletionRate: 85, requireConsentProof: false },
  });

  const findings: FindingSubmission[] = [
    {
      id: "f1",
      campaignId: "c1",
      testerId: "t1",
      stepId: "s1",
      title: "Crash on start",
      type: "functional_bug",
      severity: "blocker",
      reproducibility: "always",
      environment: { browser: "Chrome", os: "Linux", viewport: "1920x1080" },
      stepsToReproduce: ["open app"],
      expectedBehavior: "opens",
      actualBehavior: "crashes",
      createdAt: new Date().toISOString(),
    },
  ];

  const evalResult = evaluateQualityGates(campaign, findings);
  assert.equal(evalResult.passed, false);
  assert.equal(evalResult.status, "FAILED");
  assert.ok(evalResult.reasons.some((r) => r.includes("Blocker defects")));
});

test("evaluateQualityGates flags missing tester consent when required", () => {
  const campaign = validateCampaign({
    id: "c1",
    title: "C1",
    targetUrl: "https://a.b",
    steps: [{ id: "s1", instruction: "i", expectedOutcome: "e" }],
    gates: { maxBlockers: 0, maxCritical: 1, minTaskCompletionRate: 85, requireConsentProof: true },
  });

  const findings: FindingSubmission[] = [
    {
      id: "f1",
      campaignId: "c1",
      testerId: "tester-unverified",
      title: "UI glitch",
      type: "visual_defect",
      severity: "minor",
      reproducibility: "always",
      environment: { browser: "Chrome", os: "Linux", viewport: "1920x1080" },
      stepsToReproduce: ["look"],
      expectedBehavior: "clean",
      actualBehavior: "jitter",
      createdAt: new Date().toISOString(),
    },
  ];

  const evalResult = evaluateQualityGates(campaign, findings, []);
  assert.equal(evalResult.passed, false);
  assert.ok(evalResult.reasons.some((r) => r.includes("Missing cryptographic NDA/consent proof")));
});

test("evaluateQualityGates marks CONDITIONAL status for non-blocker violations", () => {
  const campaign = validateCampaign({
    id: "c-cond",
    title: "Conditional Campaign",
    targetUrl: "https://example.com",
    steps: [{ id: "s1", instruction: "i", expectedOutcome: "e" }],
    gates: { maxBlockers: 1, maxCritical: 0, minTaskCompletionRate: 85, requireConsentProof: false },
  });

  const findings: FindingSubmission[] = [
    {
      id: "f-crit",
      campaignId: "c-cond",
      testerId: "t1",
      title: "Critical layout shift",
      type: "visual_defect",
      severity: "critical",
      reproducibility: "always",
      environment: { browser: "Chrome", os: "macOS", viewport: "1920x1080" },
      stepsToReproduce: ["step"],
      expectedBehavior: "stable",
      actualBehavior: "jumps",
      createdAt: new Date().toISOString(),
    },
  ];

  const evalResult = evaluateQualityGates(campaign, findings, []);
  assert.equal(evalResult.passed, false);
  assert.equal(evalResult.status, "CONDITIONAL");
});

test("evaluateQualityGates evaluates multiple scenario steps correctly", () => {
  const campaign = validateCampaign({
    id: "c-multi",
    title: "Multi Step Campaign",
    targetUrl: "https://example.com",
    steps: [
      { id: "s1", instruction: "1", expectedOutcome: "1" },
      { id: "s2", instruction: "2", expectedOutcome: "2" },
      { id: "s3", instruction: "3", expectedOutcome: "3" },
    ],
    gates: { maxBlockers: 0, maxCritical: 2, minTaskCompletionRate: 80, requireConsentProof: false },
  });

  const evalResult = evaluateQualityGates(campaign, [], []);
  assert.equal(evalResult.passed, true);
  assert.equal(evalResult.status, "PASSED");
});

test("evaluateQualityGates fails when TCR drops below minTaskCompletionRate", () => {
  const campaign = validateCampaign({
    id: "c-tcr-fail",
    title: "TCR Fail Campaign",
    targetUrl: "https://example.com",
    steps: [
      { id: "s1", instruction: "1", expectedOutcome: "1" },
      { id: "s2", instruction: "2", expectedOutcome: "2" },
      { id: "s3", instruction: "3", expectedOutcome: "3" },
      { id: "s4", instruction: "4", expectedOutcome: "4" },
    ],
    // Allow up to 2 blockers, but mandate >= 80% TCR (here 2 blocked steps out of 4 = 50% TCR)
    gates: { maxBlockers: 2, maxCritical: 2, minTaskCompletionRate: 80, requireConsentProof: false },
  });

  const findings: FindingSubmission[] = [
    {
      id: "f-block-1",
      campaignId: "c-tcr-fail",
      testerId: "t1",
      stepId: "s1",
      title: "Step 1 blocker",
      type: "functional_bug",
      severity: "blocker",
      reproducibility: "always",
      environment: { browser: "Chrome", os: "macOS", viewport: "1920x1080" },
      stepsToReproduce: ["1"],
      expectedBehavior: "pass",
      actualBehavior: "fail",
      createdAt: new Date().toISOString(),
    },
    {
      id: "f-block-2",
      campaignId: "c-tcr-fail",
      testerId: "t1",
      stepId: "s2",
      title: "Step 2 blocker",
      type: "functional_bug",
      severity: "blocker",
      reproducibility: "always",
      environment: { browser: "Chrome", os: "macOS", viewport: "1920x1080" },
      stepsToReproduce: ["2"],
      expectedBehavior: "pass",
      actualBehavior: "fail",
      createdAt: new Date().toISOString(),
    },
  ];

  const evalResult = evaluateQualityGates(campaign, findings, []);
  assert.equal(evalResult.passed, false);
  assert.equal(evalResult.status, "FAILED");
  assert.ok(evalResult.reasons.some((r) => r.includes("Task completion rate")));
});



