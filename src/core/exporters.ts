// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import type { AuditReport, FindingSeverity } from "./types.ts";

function mapSeverityToSarifLevel(severity: FindingSeverity): "error" | "warning" | "note" {
  switch (severity) {
    case "blocker":
    case "critical":
      return "error";
    case "major":
      return "warning";
    case "minor":
    case "suggestion":
    default:
      return "note";
  }
}

export function exportToSarif(report: AuditReport): Record<string, unknown> {
  const rules = Array.from(new Set(report.clusters.map((c) => c.type))).map((type) => ({
    id: `crowdqa/${type}`,
    name: type.replace(/_/g, " "),
    shortDescription: { text: `CrowdQA detected ${type.replace(/_/g, " ")}` },
    defaultConfiguration: { level: "warning" },
  }));

  const results = report.clusters.map((cluster) => ({
    ruleId: `crowdqa/${cluster.type}`,
    level: mapSeverityToSarifLevel(cluster.severity),
    message: {
      text: `[${cluster.severity.toUpperCase()}] ${cluster.title} - Observed: ${cluster.representativeFinding.actualBehavior} (Affected: ${cluster.affectedDevices.join(", ")})`,
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: report.targetUrl },
          region: { startLine: 1, startColumn: 1 },
        },
      },
    ],
    properties: {
      clusterId: cluster.clusterId,
      stepId: cluster.stepId,
      findingsCount: cluster.findingsCount,
      testers: cluster.testersInvolved,
    },
  }));

  return {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "CrowdQA",
            version: "0.2.0-alpha",
            informationUri: "https://github.com/MRJonam91/CrowdQA",
            rules,
          },
        },
        results,
      },
    ],
  };
}

function escapeCsvCell(cell: string | number | undefined): string {
  if (cell === undefined || cell === null) return '""';
  const str = String(cell).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportToCsv(report: AuditReport): string {
  const headers = [
    "ClusterID",
    "Title",
    "Severity",
    "Type",
    "StepID",
    "FindingsCount",
    "Testers",
    "AffectedDevices",
    "ExpectedBehavior",
    "ActualBehavior",
  ];

  const rows = report.clusters.map((c) => [
    escapeCsvCell(c.clusterId),
    escapeCsvCell(c.title),
    escapeCsvCell(c.severity),
    escapeCsvCell(c.type),
    escapeCsvCell(c.stepId || "N/A"),
    escapeCsvCell(c.findingsCount),
    escapeCsvCell(c.testersInvolved.join("; ")),
    escapeCsvCell(c.affectedDevices.join("; ")),
    escapeCsvCell(c.representativeFinding.expectedBehavior),
    escapeCsvCell(c.representativeFinding.actualBehavior),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportToGitHubMarkdownIssues(report: AuditReport): string {
  return report.clusters
    .map(
      (c) => `### [CrowdQA] [${c.severity.toUpperCase()}] ${c.title}

- **Type:** \`${c.type}\`
- **Severity:** \`${c.severity}\`
- **Target URL:** ${report.targetUrl}
- **Step ID:** \`${c.stepId || "General Exploratory"}\`
- **Affected Environments:** ${c.affectedDevices.join(", ")}
- **Crowd Confirmation:** Confirmed by ${c.findingsCount} tester(s) (${c.testersInvolved.join(", ")})

#### Expected Behavior
${c.representativeFinding.expectedBehavior}

#### Actual Behavior
${c.representativeFinding.actualBehavior}

#### Steps to Reproduce
${c.representativeFinding.stepsToReproduce.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${c.representativeFinding.logExtract ? `\`\`\`text\n${c.representativeFinding.logExtract}\n\`\`\`` : ""}
`
    )
    .join("\n---\n\n");
}
