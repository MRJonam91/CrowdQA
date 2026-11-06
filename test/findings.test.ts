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

test("clusterFindings keeps distinct issues in separate clusters", () => {
  const f1: FindingSubmission = {
    id: "f-101",
    campaignId: "c-1",
    testerId: "tester-1",
    stepId: "step-1",
    title: "Login button displays wrong font",
    type: "visual_defect",
    severity: "minor",
    reproducibility: "always",
    environment: { browser: "Chrome", os: "Windows", viewport: "1920x1080" },
    stepsToReproduce: ["view page"],
    expectedBehavior: "Roboto",
    actualBehavior: "Times New Roman",
    createdAt: new Date().toISOString(),
  };

  const f2: FindingSubmission = {
    id: "f-102",
    campaignId: "c-1",
    testerId: "tester-2",
    stepId: "step-3",
    title: "SQL database timeout during checkout processing",
    type: "functional_bug",
    severity: "blocker",
    reproducibility: "always",
    environment: { browser: "Firefox", os: "Linux", viewport: "1920x1080" },
    stepsToReproduce: ["submit order"],
    expectedBehavior: "order placed",
    actualBehavior: "timeout 504",
    createdAt: new Date().toISOString(),
  };

  const clusters = clusterFindings([sanitizeFinding(f1), sanitizeFinding(f2)]);
  assert.equal(clusters.length, 2);
  assert.equal(clusters[0]!.severity, "blocker");
  assert.equal(clusters[1]!.severity, "minor");
});

test("clusterFindings does not cluster similar wording across explicitly different steps", () => {
  const f1: FindingSubmission = {
    id: "f-step1",
    campaignId: "c-1",
    testerId: "t-1",
    stepId: "step-search",
    title: "Submit button does not respond on tap",
    type: "functional_bug",
    severity: "major",
    reproducibility: "always",
    environment: { browser: "Chrome", os: "Android", viewport: "360x780" },
    stepsToReproduce: ["tap search"],
    expectedBehavior: "searches",
    actualBehavior: "freezes",
    createdAt: new Date().toISOString(),
  };

  const f2: FindingSubmission = {
    id: "f-step3",
    campaignId: "c-1",
    testerId: "t-2",
    stepId: "step-pay",
    title: "Submit button does not respond on tap",
    type: "functional_bug",
    severity: "blocker",
    reproducibility: "always",
    environment: { browser: "Chrome", os: "iOS", viewport: "390x844" },
    stepsToReproduce: ["tap pay"],
    expectedBehavior: "pays",
    actualBehavior: "freezes",
    createdAt: new Date().toISOString(),
  };

  const clusters = clusterFindings([sanitizeFinding(f1), sanitizeFinding(f2)]);
  assert.equal(clusters.length, 2);
  assert.notEqual(clusters[0]!.stepId, clusters[1]!.stepId);
});


test("validateFindingSubmission rejects invalid types and severities", () => {
  assert.throws(
    () =>
      validateFindingSubmission({
        id: "f",
        campaignId: "c",
        testerId: "t",
        title: "T",
        type: "unknown_weird_type",
        severity: "major",
        stepsToReproduce: ["s"],
        expectedBehavior: "e",
        actualBehavior: "a",
      }),
    /Invalid finding type/
  );

  assert.throws(
    () =>
      validateFindingSubmission({
        id: "f",
        campaignId: "c",
        testerId: "t",
        title: "T",
        type: "functional_bug",
        severity: "nuclear_danger",
        stepsToReproduce: ["s"],
        expectedBehavior: "e",
        actualBehavior: "a",
      }),
    /Invalid finding severity/
  );
});

