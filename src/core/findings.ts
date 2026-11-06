// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import type {
  DeduplicatedCluster,
  FindingSeverity,
  FindingSubmission,
  FindingType,
  ReproducibilityRate,
  SanitizedFinding,
} from "./types.ts";
import { SEVERITY_WEIGHTS } from "./constants.ts";

const VALID_TYPES: Set<FindingType> = new Set([
  "functional_bug",
  "ux_friction",
  "visual_defect",
  "performance_lag",
  "accessibility_issue",
  "ai_hallucination_or_drift",
  "security_finding",
]);

const VALID_SEVERITIES: Set<FindingSeverity> = new Set([
  "blocker",
  "critical",
  "major",
  "minor",
  "suggestion",
]);

const VALID_REPRO: Set<ReproducibilityRate> = new Set(["always", "frequent", "intermittent", "once"]);

export function validateFindingSubmission(submission: unknown): FindingSubmission {
  if (!submission || typeof submission !== "object") {
    throw new Error("Invalid finding submission: expected an object");
  }
  const f = submission as Partial<FindingSubmission>;
  if (!f.id || typeof f.id !== "string") throw new Error("Finding must have an id");
  if (!f.campaignId || typeof f.campaignId !== "string") throw new Error("Finding must have a campaignId");
  if (!f.testerId || typeof f.testerId !== "string") throw new Error("Finding must have a testerId");
  if (!f.title || typeof f.title !== "string") throw new Error("Finding must have a title");

  const type = f.type as FindingType;
  if (!VALID_TYPES.has(type)) {
    throw new Error(`Invalid finding type: ${f.type}`);
  }

  const severity = f.severity as FindingSeverity;
  if (!VALID_SEVERITIES.has(severity)) {
    throw new Error(`Invalid finding severity: ${f.severity}`);
  }

  const reproducibility = (f.reproducibility || "always") as ReproducibilityRate;
  if (!VALID_REPRO.has(reproducibility)) {
    throw new Error(`Invalid reproducibility: ${f.reproducibility}`);
  }

  if (!Array.isArray(f.stepsToReproduce) || f.stepsToReproduce.length === 0) {
    throw new Error("Finding must provide at least one stepToReproduce");
  }

  if (!f.expectedBehavior || typeof f.expectedBehavior !== "string") {
    throw new Error("Finding must specify expectedBehavior");
  }

  if (!f.actualBehavior || typeof f.actualBehavior !== "string") {
    throw new Error("Finding must specify actualBehavior");
  }

  return {
    id: f.id.trim(),
    campaignId: f.campaignId.trim(),
    testerId: f.testerId.trim(),
    stepId: f.stepId?.trim(),
    title: f.title.trim(),
    type,
    severity,
    reproducibility,
    environment: {
      browser: f.environment?.browser || "Chromium 130",
      os: f.environment?.os || "Unknown OS",
      viewport: f.environment?.viewport || "Desktop 1920x1080",
      networkCondition: f.environment?.networkCondition || "Broadband",
    },
    stepsToReproduce: f.stepsToReproduce.map((s) => String(s).trim()),
    expectedBehavior: f.expectedBehavior.trim(),
    actualBehavior: f.actualBehavior.trim(),
    logExtract: f.logExtract ? String(f.logExtract).trim() : undefined,
    notes: f.notes ? String(f.notes).trim() : undefined,
    createdAt: f.createdAt || new Date().toISOString(),
  };
}

function normalizeTitleTokens(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "with", "from", "when", "that"].includes(w));
}

function calculateSimilarity(titleA: string, titleB: string): number {
  const setA = new Set(normalizeTitleTokens(titleA));
  const setB = new Set(normalizeTitleTokens(titleB));
  if (setA.size === 0 || setB.size === 0) return 0;
  let matches = 0;
  for (const token of setA) {
    if (setB.has(token)) matches++;
  }
  return (2 * matches) / (setA.size + setB.size);
}

export function clusterFindings(findings: SanitizedFinding[]): DeduplicatedCluster[] {
  const clusters: DeduplicatedCluster[] = [];

  for (const finding of findings) {
    let matchedCluster: DeduplicatedCluster | null = null;

    for (const cluster of clusters) {
      // Do not cluster across explicitly distinct scenario steps
      const conflictStep = Boolean(finding.stepId && cluster.stepId && finding.stepId !== cluster.stepId);
      if (conflictStep) continue;

      const sameStep = Boolean(finding.stepId && cluster.stepId && finding.stepId === cluster.stepId);
      const sameType = finding.type === cluster.type;

      if (sameStep || sameType) {
        const sim = calculateSimilarity(finding.title, cluster.title);
        if (sim >= 0.5) {
          matchedCluster = cluster;
          break;
        }
      }
    }

    if (matchedCluster) {
      matchedCluster.findingsCount += 1;
      matchedCluster.findingIds.push(finding.id);
      if (!matchedCluster.testersInvolved.includes(finding.testerId)) {
        matchedCluster.testersInvolved.push(finding.testerId);
      }
      const deviceStr = `${finding.environment.os} / ${finding.environment.viewport}`;
      if (!matchedCluster.affectedDevices.includes(deviceStr)) {
        matchedCluster.affectedDevices.push(deviceStr);
      }

      // Escalate cluster severity to highest severity among grouped findings
      const currentWeight = SEVERITY_WEIGHTS[matchedCluster.severity] ?? 0;
      const findingWeight = SEVERITY_WEIGHTS[finding.severity] ?? 0;
      if (findingWeight > currentWeight) {
        matchedCluster.severity = finding.severity;
        matchedCluster.representativeFinding = finding;
      }
    } else {
      clusters.push({
        clusterId: `cluster-${clusters.length + 1}`,
        title: finding.title,
        type: finding.type,
        severity: finding.severity,
        stepId: finding.stepId,
        findingsCount: 1,
        findingIds: [finding.id],
        testersInvolved: [finding.testerId],
        representativeFinding: finding,
        affectedDevices: [`${finding.environment.os} / ${finding.environment.viewport}`],
      });
    }
  }

  // Sort clusters by severity weight descending
  clusters.sort((a, b) => (SEVERITY_WEIGHTS[b.severity] ?? 0) - (SEVERITY_WEIGHTS[a.severity] ?? 0));
  return clusters;
}
