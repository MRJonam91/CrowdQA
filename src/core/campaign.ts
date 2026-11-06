// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import type {
  CampaignConfig,
  FindingSubmission,
  GateEvaluation,
  TesterConsent,
} from "./types.ts";
import { DEFAULT_PERSONAS, DEFAULT_QUALITY_GATES, DEFAULT_VIEWPORTS } from "./constants.ts";

export function validateCampaign(campaign: unknown): CampaignConfig {
  if (!campaign || typeof campaign !== "object") {
    throw new Error("Invalid campaign: expected an object");
  }
  const c = campaign as Partial<CampaignConfig>;
  if (!c.id || typeof c.id !== "string") throw new Error("Campaign must have a valid string id");
  if (!c.title || typeof c.title !== "string") throw new Error("Campaign must have a title");
  if (!c.targetUrl || typeof c.targetUrl !== "string") throw new Error("Campaign must specify targetUrl");
  if (!Array.isArray(c.steps) || c.steps.length === 0) {
    throw new Error("Campaign must define at least one scenario step");
  }

  return {
    id: c.id.trim(),
    title: c.title.trim(),
    targetUrl: c.targetUrl.trim(),
    version: c.version || "1.0.0",
    description: c.description || "",
    viewports: Array.isArray(c.viewports) && c.viewports.length > 0 ? c.viewports : DEFAULT_VIEWPORTS,
    personas: Array.isArray(c.personas) && c.personas.length > 0 ? c.personas : DEFAULT_PERSONAS,
    steps: c.steps.map((s, idx) => ({
      id: s.id || `step-${idx + 1}`,
      stepNumber: typeof s.stepNumber === "number" ? s.stepNumber : idx + 1,
      title: s.title || `Step ${idx + 1}`,
      instruction: s.instruction || "",
      expectedOutcome: s.expectedOutcome || "",
      optional: Boolean(s.optional),
    })),
    heuristics: Array.isArray(c.heuristics) ? c.heuristics : [],
    gates: {
      maxBlockers: typeof c.gates?.maxBlockers === "number" ? c.gates.maxBlockers : DEFAULT_QUALITY_GATES.maxBlockers,
      maxCritical: typeof c.gates?.maxCritical === "number" ? c.gates.maxCritical : DEFAULT_QUALITY_GATES.maxCritical,
      minTaskCompletionRate: typeof c.gates?.minTaskCompletionRate === "number" ? c.gates.minTaskCompletionRate : DEFAULT_QUALITY_GATES.minTaskCompletionRate,
      requireConsentProof: typeof c.gates?.requireConsentProof === "boolean" ? c.gates.requireConsentProof : DEFAULT_QUALITY_GATES.requireConsentProof,
    },
    createdAt: c.createdAt || new Date().toISOString(),
  };
}

export function evaluateQualityGates(
  campaign: CampaignConfig,
  findings: FindingSubmission[],
  consents: TesterConsent[] = []
): GateEvaluation {
  const reasons: string[] = [];
  const blockers = findings.filter((f) => f.severity === "blocker").length;
  const critical = findings.filter((f) => f.severity === "critical").length;

  if (blockers > campaign.gates.maxBlockers) {
    reasons.push(`Blocker defects (${blockers}) exceeded allowed threshold (${campaign.gates.maxBlockers})`);
  }

  if (critical > campaign.gates.maxCritical) {
    reasons.push(`Critical defects (${critical}) exceeded allowed threshold (${campaign.gates.maxCritical})`);
  }

  if (campaign.gates.requireConsentProof) {
    const testerIds = new Set(findings.map((f) => f.testerId));
    const signedTesters = new Set(consents.map((c) => c.testerId));
    for (const tid of testerIds) {
      if (!signedTesters.has(tid)) {
        reasons.push(`Missing cryptographic NDA/consent proof for participating tester: ${tid}`);
      }
    }
  }

  if (reasons.length === 0) {
    return { passed: true, status: "PASSED", reasons: ["All quality gates met successfully."] };
  }

  if (blockers > campaign.gates.maxBlockers) {
    return { passed: false, status: "FAILED", reasons };
  }

  return { passed: false, status: "CONDITIONAL", reasons };
}
