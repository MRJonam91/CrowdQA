// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import type { FindingSubmission, SanitizedFinding } from "./types.ts";

export interface RedactionResult {
  text: string;
  redactedTypes: string[];
}

export function sanitizeText(input: string): RedactionResult {
  if (!input) return { text: "", redactedTypes: [] };
  const detected = new Set<string>();
  let sanitized = input;

  // 1. JWT tokens
  const jwtRegex = /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g;
  if (jwtRegex.test(sanitized)) {
    sanitized = sanitized.replace(jwtRegex, "[REDACTED_JWT]");
    detected.add("jwt_token");
  }

  // 2. Bearer Authorization headers
  const bearerRegex = /Bearer\s+[a-zA-Z0-9_\-\.]{16,}/gi;
  if (bearerRegex.test(sanitized)) {
    sanitized = sanitized.replace(bearerRegex, "Bearer [REDACTED_TOKEN]");
    detected.add("bearer_token");
  }

  // 3. API Keys (common patterns sk-..., api_key=..., ghp_...)
  const apiKeyRegex = /\b(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|ai_key_[a-zA-Z0-9]{12,})\b/g;
  if (apiKeyRegex.test(sanitized)) {
    sanitized = sanitized.replace(apiKeyRegex, "[REDACTED_API_KEY]");
    detected.add("api_key");
  }

  // 4. Passwords / Secrets in query string or key-value
  const secretParamRegex = /(?<=(password|passwd|secret|authToken|auth_key)=)([^&\s]+)/gi;
  if (secretParamRegex.test(sanitized)) {
    sanitized = sanitized.replace(secretParamRegex, "[REDACTED_SECRET]");
    detected.add("password_secret");
  }

  // 5. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  if (emailRegex.test(sanitized)) {
    sanitized = sanitized.replace(emailRegex, "[REDACTED_EMAIL]");
    detected.add("email_address");
  }

  // 6. Credit Card Numbers (13 to 19 digits)
  const ccRegex = /\b(?:\d{4}[- ]?){3}\d{4}\b|\b\d{15,16}\b/g;
  if (ccRegex.test(sanitized)) {
    sanitized = sanitized.replace(ccRegex, "[REDACTED_CREDIT_CARD]");
    detected.add("credit_card");
  }

  return {
    text: sanitized,
    redactedTypes: Array.from(detected),
  };
}

export function sanitizeFinding(finding: FindingSubmission): SanitizedFinding {
  const redactedFields = new Set<string>();

  const titleRedacted = sanitizeText(finding.title);
  if (titleRedacted.redactedTypes.length > 0) redactedFields.add("title");

  const expectedRedacted = sanitizeText(finding.expectedBehavior);
  if (expectedRedacted.redactedTypes.length > 0) redactedFields.add("expectedBehavior");

  const actualRedacted = sanitizeText(finding.actualBehavior);
  if (actualRedacted.redactedTypes.length > 0) redactedFields.add("actualBehavior");

  const stepsRedacted = finding.stepsToReproduce.map((step, idx) => {
    const res = sanitizeText(step);
    if (res.redactedTypes.length > 0) redactedFields.add(`steps[${idx}]`);
    return res.text;
  });

  let logRedacted: string | undefined = undefined;
  if (finding.logExtract) {
    const res = sanitizeText(finding.logExtract);
    if (res.redactedTypes.length > 0) redactedFields.add("logExtract");
    logRedacted = res.text;
  }

  let notesRedacted: string | undefined = undefined;
  if (finding.notes) {
    const res = sanitizeText(finding.notes);
    if (res.redactedTypes.length > 0) redactedFields.add("notes");
    notesRedacted = res.text;
  }

  return {
    ...finding,
    title: titleRedacted.text,
    expectedBehavior: expectedRedacted.text,
    actualBehavior: actualRedacted.text,
    stepsToReproduce: stepsRedacted,
    logExtract: logRedacted,
    notes: notesRedacted,
    sanitized: true,
    redactedFields: Array.from(redactedFields),
  };
}
