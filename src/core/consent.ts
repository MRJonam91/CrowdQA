// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import { createHash } from "node:crypto";
import type { TesterConsent } from "./types.ts";
import { CROWDQA_GENESIS_NONCE, CROWDQA_NAMESPACE } from "./constants.ts";

export const CONSENT_TERMS_VERSION = "2026-v1.0";

export function buildConsentAgreementText(testerId: string, campaignId: string): string {
  return [
    `CROWDQA TESTER INFORMED CONSENT & NON-DISCLOSURE AGREEMENT`,
    `Terms Version: ${CONSENT_TERMS_VERSION}`,
    `Tester Identifier: ${testerId}`,
    `Campaign Identifier: ${campaignId}`,
    `Scope:`,
    `1. Confidentiality: The tester agrees not to disclose, screenshot for public sharing, or publish any unreleased feature, UI layout, bug, or security vulnerability encountered during this test mission.`,
    `2. Evidence Redaction: The tester agrees not to submit real personal credentials, personal identity numbers, financial card numbers, or third-party private data in recorded logs.`,
    `3. Anonymized Synthesis: The tester grants permission to synthesize anonymized bug observations, reproduction steps, and system logs into the final campaign audit report.`,
    `4. Independent Audit: The tester confirms all recorded findings reflect genuine human interactions under authorized testing parameters.`,
  ].join("\n");
}

export function computeConsentHash(testerId: string, campaignId: string, timestamp: string, text: string): string {
  return createHash("sha256")
    .update(`${CROWDQA_NAMESPACE}:${CROWDQA_GENESIS_NONCE}:${testerId}:${campaignId}:${timestamp}:${text}`)
    .digest("hex");
}

export function createTesterConsent(testerId: string, campaignId: string, signedAt?: string): TesterConsent {
  const timestamp = signedAt || new Date().toISOString();
  const agreementText = buildConsentAgreementText(testerId, campaignId);
  const signatureHash = computeConsentHash(testerId, campaignId, timestamp, agreementText);

  return {
    testerId,
    campaignId,
    signedAt: timestamp,
    termsVersion: CONSENT_TERMS_VERSION,
    agreementText,
    signatureHash,
  };
}

export function verifyTesterConsent(consent: TesterConsent): boolean {
  if (!consent || !consent.signatureHash || !consent.testerId || !consent.campaignId) {
    return false;
  }
  const expectedHash = computeConsentHash(
    consent.testerId,
    consent.campaignId,
    consent.signedAt,
    consent.agreementText
  );
  return expectedHash === consent.signatureHash;
}
