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
  sanitized = sanitized.replace(jwtRegex, () => {
    detected.add("jwt_token");
    return "[REDACTED_JWT]";
  });

  // 2. Bearer Authorization headers
  const bearerRegex = /bearer\s+[a-zA-Z0-9_\-\.]{16,}/gi;
  sanitized = sanitized.replace(bearerRegex, () => {
    detected.add("bearer_token");
    return "Bearer [REDACTED_TOKEN]";
  });

  // 3. API Keys (sk-..., sk-proj-..., sk-ant-..., ghp_..., github_pat_..., glpat-..., xoxb-..., ai_key_...)
  const apiKeyRegex = /\b(sk-[a-zA-Z0-9_\-]{20,}|ghp_[a-zA-Z0-9]{20,}|github_pat_[a-zA-Z0-9_]{20,}|glpat-[a-zA-Z0-9_\-]{20,}|xox[baprs]-[a-zA-Z0-9\-]{10,}|ai_key_[a-zA-Z0-9]{12,})\b/g;
  sanitized = sanitized.replace(apiKeyRegex, () => {
    detected.add("api_key");
    return "[REDACTED_API_KEY]";
  });

  // 4. Passwords / Secrets in query string (password=...) or JSON ("password": "...")
  const secretParamRegex = /(?<=(password|passwd|secret|authToken|auth_key)=)([^&\s]+)/gi;
  sanitized = sanitized.replace(secretParamRegex, () => {
    detected.add("password_secret");
    return "[REDACTED_SECRET]";
  });

  const secretJsonRegex = /(["']?(?:password|passwd|secret|authToken|auth_key)["']?\s*:\s*["'])([^"'\r\n]+)(["'])/gi;
  sanitized = sanitized.replace(secretJsonRegex, (_match, prefix, _val, suffix) => {
    detected.add("password_secret");
    return `${prefix}[REDACTED_SECRET]${suffix}`;
  });

  // 5. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  sanitized = sanitized.replace(emailRegex, () => {
    detected.add("email_address");
    return "[REDACTED_EMAIL]";
  });

  // 6. Credit Card Numbers (13 to 19 digits)
  const ccRegex = /\b(?:\d{4}[- ]?){3}\d{4}\b|\b\d{15,16}\b/g;
  sanitized = sanitized.replace(ccRegex, () => {
    detected.add("credit_card");
    return "[REDACTED_CREDIT_CARD]";
  });

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
