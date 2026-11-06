// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import type {
  CampaignConfig,
  FindingSeverity,
  HeuristicBreakdown,
  HeuristicCategory,
  LintIssue,
  SanitizedFinding,
} from "./types.ts";

export function lintCampaign(campaign: CampaignConfig): LintIssue[] {
  const issues: LintIssue[] = [];

  if (!campaign.id || campaign.id.trim().length < 3) {
    issues.push({ level: "error", field: "id", message: "Campaign id must be at least 3 characters long" });
  }

  if (!campaign.title || campaign.title.trim().length < 5) {
    issues.push({ level: "error", field: "title", message: "Campaign title is too short (min 5 characters)" });
  }

  try {
    const url = new URL(campaign.targetUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      issues.push({ level: "error", field: "targetUrl", message: "Target URL protocol must be http: or https:" });
    }
  } catch {
    issues.push({ level: "error", field: "targetUrl", message: "Target URL is not a valid absolute URL" });
  }

  if (!Array.isArray(campaign.steps) || campaign.steps.length === 0) {
    issues.push({ level: "error", field: "steps", message: "Campaign must contain at least one step" });
  } else {
    campaign.steps.forEach((s, idx) => {
      if (!s.instruction || s.instruction.trim().length === 0) {
        issues.push({ level: "error", field: `steps[${idx}].instruction`, message: `Step ${s.id || idx + 1} has empty instruction` });
      }
      if (!s.expectedOutcome || s.expectedOutcome.trim().length === 0) {
        issues.push({ level: "warning", field: `steps[${idx}].expectedOutcome`, message: `Step ${s.id || idx + 1} lacks expected outcome` });
      }
    });
  }

  if (!Array.isArray(campaign.viewports) || campaign.viewports.length === 0) {
    issues.push({ level: "warning", field: "viewports", message: "No custom viewports defined; default viewports will be applied" });
  } else {
    const hasMobile = campaign.viewports.some((v) => v.deviceType === "mobile" || v.width <= 480);
    if (!hasMobile) {
      issues.push({ level: "warning", field: "viewports", message: "Campaign lacks a dedicated mobile viewport (recommended <= 480px)" });
    }
  }

  if (campaign.gates) {
    if (campaign.gates.maxBlockers < 0) {
      issues.push({ level: "error", field: "gates.maxBlockers", message: "maxBlockers cannot be negative" });
    }
    if (campaign.gates.minTaskCompletionRate < 0 || campaign.gates.minTaskCompletionRate > 100) {
      issues.push({ level: "error", field: "gates.minTaskCompletionRate", message: "minTaskCompletionRate must be between 0 and 100" });
    }
  }

  return issues;
}

const CATEGORY_MAP: Record<string, HeuristicCategory> = {
  functional_bug: "error_handling",
  ux_friction: "ux",
  visual_defect: "ux",
  performance_lag: "performance",
  accessibility_issue: "accessibility",
  ai_hallucination_or_drift: "ai_drift",
  security_finding: "error_handling",
};

export function evaluateHeuristics(findings: SanitizedFinding[]): HeuristicBreakdown[] {
  const map = new Map<HeuristicCategory, { count: number; severities: Record<FindingSeverity, number> }>();

  const initSeverities = (): Record<FindingSeverity, number> => ({
    blocker: 0,
    critical: 0,
    major: 0,
    minor: 0,
    suggestion: 0,
  });

  for (const f of findings) {
    const category: HeuristicCategory = CATEGORY_MAP[f.type] || "ux";
    let entry = map.get(category);
    if (!entry) {
      entry = { count: 0, severities: initSeverities() };
      map.set(category, entry);
    }
    entry.count += 1;
    if (f.severity in entry.severities) {
      entry.severities[f.severity] += 1;
    }
  }

  return Array.from(map.entries()).map(([category, data]) => ({
    category,
    count: data.count,
    severities: data.severities,
  }));
}
