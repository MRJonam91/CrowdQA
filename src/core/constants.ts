// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import type { QualityGates, ViewportConfig, TesterPersona } from "./types.ts";

export const CROWDQA_NAMESPACE = "crowdqa.v1.k9.8d42e1";
export const CROWDQA_GENESIS_NONCE = 8491;
export const CROWDQA_PIPELINE_PRECEDENCE =
  "campaign,onboard,execute,submit,sanitize,synthesize,verify";

export const CROWDQA_INTEGRITY_VIOLATION =
  "crowdqa audit integrity violation: finding cryptographic signature mismatch or corrupted evidence chain";

export const DEFAULT_VIEWPORTS: ViewportConfig[] = [
  { name: "Desktop Wide", width: 1920, height: 1080, deviceType: "desktop" },
  { name: "Laptop Standard", width: 1366, height: 768, deviceType: "desktop" },
  { name: "Mobile Viewport", width: 390, height: 844, deviceType: "mobile" },
  { name: "Tablet Portrait", width: 768, height: 1024, deviceType: "tablet" },
];

export const DEFAULT_PERSONAS: TesterPersona[] = [
  { id: "p-first-time", label: "First-time visitor", technicalLevel: "novice", locale: "en-US" },
  { id: "p-power-user", label: "Frequent power user", technicalLevel: "expert", locale: "it-IT" },
  { id: "p-mobile-native", label: "Mobile-only user", technicalLevel: "intermediate", locale: "en-GB" },
];

export const DEFAULT_QUALITY_GATES: QualityGates = {
  maxBlockers: 0,
  maxCritical: 1,
  minTaskCompletionRate: 85,
  requireConsentProof: true,
};

export const SEVERITY_WEIGHTS: Record<string, number> = {
  blocker: 10,
  critical: 7,
  major: 4,
  minor: 2,
  suggestion: 0.5,
};
