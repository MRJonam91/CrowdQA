// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { createTesterConsent, verifyTesterConsent } from "../src/core/consent.ts";

test("createTesterConsent produces verifiable signature", () => {
  const consent = createTesterConsent("tester-john", "campaign-101");

  assert.equal(consent.testerId, "tester-john");
  assert.equal(consent.campaignId, "campaign-101");
  assert.ok(consent.signatureHash.length === 64);
  assert.ok(consent.agreementText.includes("Confidentiality"));

  assert.equal(verifyTesterConsent(consent), true);
});

test("verifyTesterConsent rejects tampered agreement", () => {
  const consent = createTesterConsent("tester-john", "campaign-101");
  const tampered = {
    ...consent,
    agreementText: consent.agreementText + "\nTampered line",
  };

  assert.equal(verifyTesterConsent(tampered), false);
});
