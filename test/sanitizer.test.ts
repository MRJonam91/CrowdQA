// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeFinding, sanitizeText } from "../src/core/sanitizer.ts";
import type { FindingSubmission } from "../src/core/types.ts";

test("sanitizeText scrubs emails, keys, and tokens", () => {
  const input = "User test.dev@example.org reported auth fail with Bearer abcdef1234567890abcdef and sk-12345678901234567890";
  const result = sanitizeText(input);

  assert.ok(!result.text.includes("test.dev@example.org"));
  assert.ok(result.text.includes("[REDACTED_EMAIL]"));
  assert.ok(!result.text.includes("abcdef1234567890abcdef"));
  assert.ok(result.text.includes("Bearer [REDACTED_TOKEN]"));
  assert.ok(!result.text.includes("sk-12345678901234567890"));
  assert.ok(result.text.includes("[REDACTED_API_KEY]"));
  assert.ok(result.redactedTypes.includes("email_address"));
  assert.ok(result.redactedTypes.includes("bearer_token"));
  assert.ok(result.redactedTypes.includes("api_key"));
});

test("sanitizeFinding flags and sanitizes sensitive fields in submission", () => {
  const submission: FindingSubmission = {
    id: "f-raw",
    campaignId: "c-1",
    testerId: "t-1",
    title: "Error on john.doe@corp.com login",
    type: "functional_bug",
    severity: "major",
    reproducibility: "always",
    environment: { browser: "Firefox", os: "Windows", viewport: "1920x1080" },
    stepsToReproduce: ["visit /login", "enter password=superSecretPassword123"],
    expectedBehavior: "Success",
    actualBehavior: "Failure",
    logExtract: "Authorization: Bearer 1234567890abcdef123456",
    createdAt: new Date().toISOString(),
  };

  const sanitized = sanitizeFinding(submission);
  assert.equal(sanitized.sanitized, true);
  assert.ok(sanitized.redactedFields.includes("title"));
  assert.ok(sanitized.redactedFields.includes("steps[1]"));
  assert.ok(sanitized.redactedFields.includes("logExtract"));
  assert.ok(!sanitized.title.includes("john.doe@corp.com"));
  assert.ok(!sanitized.stepsToReproduce[1]!.includes("superSecretPassword123"));
  assert.ok(!sanitized.logExtract!.includes("1234567890abcdef123456"));
});

test("sanitizeText handles empty string and clean strings without alterations", () => {
  assert.equal(sanitizeText("").text, "");
  assert.equal(sanitizeText("").redactedTypes.length, 0);

  const clean = "User clicks on the green button successfully.";
  const res = sanitizeText(clean);
  assert.equal(res.text, clean);
  assert.equal(res.redactedTypes.length, 0);
});

test("sanitizeText detects credit card numbers", () => {
  const ccString = "Transaction with card 4111-2222-3333-4444 failed to settle";
  const res = sanitizeText(ccString);
  assert.ok(!res.text.includes("4111-2222-3333-4444"));
  assert.ok(res.text.includes("[REDACTED_CREDIT_CARD]"));
  assert.ok(res.redactedTypes.includes("credit_card"));
});

test("sanitizeText scrubs mixed lowercase bearer tokens and ghp GitHub tokens", () => {
  const mixed = "Authorization: bearer 9876543210abcdef9876 and token ghp_12345678901234567890";
  const res = sanitizeText(mixed);
  assert.ok(!res.text.includes("9876543210abcdef9876"));
  assert.ok(!res.text.includes("ghp_12345678901234567890"));
  assert.ok(res.text.includes("Bearer [REDACTED_TOKEN]"));
  assert.ok(res.text.includes("[REDACTED_API_KEY]"));
});


