// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

export type DeviceType = "mobile" | "desktop" | "tablet";

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  deviceType: DeviceType;
}

export type TechnicalLevel = "novice" | "intermediate" | "expert";

export interface TesterPersona {
  id: string;
  label: string;
  technicalLevel: TechnicalLevel;
  locale: string;
}

export interface ScenarioStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  expectedOutcome: string;
  optional?: boolean;
}

export type HeuristicCategory =
  | "ux"
  | "accessibility"
  | "performance"
  | "ai_drift"
  | "error_handling";

export interface HeuristicCheck {
  id: string;
  category: HeuristicCategory;
  prompt: string;
  weight?: number;
}

export interface QualityGates {
  maxBlockers: number;
  maxCritical: number;
  minTaskCompletionRate: number;
  requireConsentProof: boolean;
}

export interface CampaignConfig {
  id: string;
  title: string;
  targetUrl: string;
  version: string;
  description: string;
  viewports: ViewportConfig[];
  personas: TesterPersona[];
  steps: ScenarioStep[];
  heuristics: HeuristicCheck[];
  gates: QualityGates;
  createdAt: string;
}

export interface TesterConsent {
  testerId: string;
  campaignId: string;
  signedAt: string;
  termsVersion: string;
  agreementText: string;
  signatureHash: string;
}

export type FindingSeverity = "blocker" | "critical" | "major" | "minor" | "suggestion";

export type FindingType =
  | "functional_bug"
  | "ux_friction"
  | "visual_defect"
  | "performance_lag"
  | "accessibility_issue"
  | "ai_hallucination_or_drift"
  | "security_finding";

export type ReproducibilityRate = "always" | "frequent" | "intermittent" | "once";

export interface FindingEnvironment {
  browser: string;
  os: string;
  viewport: string;
  networkCondition?: string;
}

export interface FindingSubmission {
  id: string;
  campaignId: string;
  testerId: string;
  stepId?: string;
  title: string;
  type: FindingType;
  severity: FindingSeverity;
  reproducibility: ReproducibilityRate;
  environment: FindingEnvironment;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  logExtract?: string;
  notes?: string;
  createdAt: string;
}

export interface SanitizedFinding extends FindingSubmission {
  sanitized: boolean;
  redactedFields: string[];
}

export interface DeduplicatedCluster {
  clusterId: string;
  title: string;
  type: FindingType;
  severity: FindingSeverity;
  stepId?: string;
  findingsCount: number;
  findingIds: string[];
  testersInvolved: string[];
  representativeFinding: SanitizedFinding;
  affectedDevices: string[];
}

export interface GateEvaluation {
  passed: boolean;
  status: "PASSED" | "FAILED" | "CONDITIONAL";
  reasons: string[];
}

export interface AuditMetrics {
  totalTesters: number;
  totalSubmissions: number;
  uniqueClusters: number;
  blockersCount: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  suggestionsCount: number;
  taskCompletionRate: number;
  frictionScore: number;
  severityDistribution: Record<FindingSeverity, number>;
  typeDistribution: Record<FindingType, number>;
  gateEvaluation: GateEvaluation;
}

export interface AuditReport {
  id: string;
  campaignId: string;
  campaignTitle: string;
  targetUrl: string;
  generatedAt: string;
  provenanceHash: string;
  metrics: AuditMetrics;
  clusters: DeduplicatedCluster[];
  findings: SanitizedFinding[];
}

export interface LintIssue {
  level: "error" | "warning";
  field: string;
  message: string;
}

export interface HeuristicBreakdown {
  category: HeuristicCategory;
  count: number;
  severities: Record<FindingSeverity, number>;
}

