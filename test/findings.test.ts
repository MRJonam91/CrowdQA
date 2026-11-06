// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { clusterFindings, validateFindingSubmission } from "../src/core/findings.ts";
import { sanitizeFinding } from "../src/core/sanitizer.ts";
import type { FindingSubmission } from "../src/core/types.ts";

test("validateFindingSubmission validates and parses correctly", () => {
  const raw = {
    id: "f-10",
    campaignId: "c-10",
    testerId: "t-10",
    title: "Modal dialog closes immediately on click",
    type: "functional_bug",
    severity: "major",
    reproducibility: "always",
    stepsToReproduce: ["click button"],
    expectedBehavior: "modal stays open",
    actualBehavior: "modal closes",
  };

  const validated = validateFindingSubmission(raw);
  assert.equal(validated.id, "f-10");
  assert.equal(validated.type, "functional_bug");
  assert.equal(validated.environment.browser, "Chromium 130");
});

test("clusterFindings deduplicates similar findings and escalates severity", () => {
  const f1: FindingSubmission = {
    id: "f-1",
    campaignId: "c-1",
    testerId: "tester-1",
    stepId: "step-checkout",
    title: "Checkout payment button disabled on mobile viewport",
    type: "functional_bug",
    severity: "minor",
    reproducibility: "always",
    environment: { browser: "Chrome", os: "Android", viewport: "360x780" },
    stepsToReproduce: ["fill form", "view button"],
    expectedBehavior: "button active",
    actualBehavior: "button disabled",
    createdAt: new Date().toISOString(),
  };

  const f2: FindingSubmission = {
    id: "f-2",
    campaignId: "c-1",
    testerId: "tester-2",
    stepId: "step-checkout",
    title: "Checkout payment button stays disabled and unclickable",
    type: "functional_bug",
    severity: "blocker",
    reproducibility: "always",
    environment: { browser: "Safari", os: "iOS", viewport: "390x844" },
    stepsToReproduce: ["fill form", "tap button"],
    expectedBehavior: "button active",
    actualBehavior: "button disabled",
    createdAt: new Date().toISOString(),
  };

  const clusters = clusterFindings([sanitizeFinding(f1), sanitizeFinding(f2)]);

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0]!.findingsCount, 2);
  assert.equal(clusters[0]!.severity, "blocker");
  assert.equal(clusters[0]!.testersInvolved.length, 2);
  assert.equal(clusters[0]!.affectedDevices.length, 2);
});
