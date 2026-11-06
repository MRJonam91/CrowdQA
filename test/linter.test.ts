// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { evaluateHeuristics, lintCampaign } from "../src/core/linter.ts";
import { validateCampaign } from "../src/core/campaign.ts";
import { sanitizeFinding } from "../src/core/sanitizer.ts";
import type { FindingSubmission } from "../src/core/types.ts";

test("lintCampaign validates sound campaign with zero errors", () => {
  const campaign = validateCampaign({
    id: "camp-perfect",
    title: "Perfect Test Campaign",
    targetUrl: "https://example.com/flow",
    viewports: [{ name: "Mobile", width: 390, height: 844, deviceType: "mobile" }],
    steps: [{ id: "step-1", instruction: "Do A", expectedOutcome: "A works" }],
  });

  const issues = lintCampaign(campaign);
  assert.equal(issues.filter((i) => i.level === "error").length, 0);
});

test("lintCampaign catches invalid URL, short title, and broken gates", () => {
  const badCampaign = {
    id: "c",
    title: "bad",
    targetUrl: "not-a-valid-url",
    version: "1.0.0",
    description: "",
    viewports: [{ name: "Desktop", width: 1920, height: 1080, deviceType: "desktop" as const }],
    personas: [],
    steps: [{ id: "s1", stepNumber: 1, title: "Step", instruction: "", expectedOutcome: "" }],
    heuristics: [],
    gates: { maxBlockers: -1, maxCritical: 0, minTaskCompletionRate: 150, requireConsentProof: false },
    createdAt: new Date().toISOString(),
  };

  const issues = lintCampaign(badCampaign);
  assert.ok(issues.some((i) => i.field === "id"));
  assert.ok(issues.some((i) => i.field === "title"));
  assert.ok(issues.some((i) => i.field === "targetUrl"));
  assert.ok(issues.some((i) => i.field === "gates.maxBlockers"));
  assert.ok(issues.some((i) => i.field === "gates.minTaskCompletionRate"));
  assert.ok(issues.some((i) => i.field === "viewports" && i.level === "warning"));
});

test("evaluateHeuristics categorizes findings accurately", () => {
  const submissions: FindingSubmission[] = [
    {
      id: "f1",
      campaignId: "c1",
      testerId: "t1",
      title: "Contrast too low",
      type: "accessibility_issue",
      severity: "minor",
      reproducibility: "always",
      environment: { browser: "Chrome", os: "macOS", viewport: "1920x1080" },
      stepsToReproduce: ["look"],
      expectedBehavior: "clear",
      actualBehavior: "dim",
      createdAt: new Date().toISOString(),
    },
    {
      id: "f2",
      campaignId: "c1",
      testerId: "t1",
      title: "Button unresponsive",
      type: "functional_bug",
      severity: "major",
      reproducibility: "always",
      environment: { browser: "Chrome", os: "macOS", viewport: "1920x1080" },
      stepsToReproduce: ["tap"],
      expectedBehavior: "action",
      actualBehavior: "none",
      createdAt: new Date().toISOString(),
    },
  ];

  const breakdowns = evaluateHeuristics(submissions.map((s) => sanitizeFinding(s)));
  assert.equal(breakdowns.length, 2);
  const a11y = breakdowns.find((b) => b.category === "accessibility");
  assert.ok(a11y);
  assert.equal(a11y?.count, 1);
  assert.equal(a11y?.severities.minor, 1);
});
