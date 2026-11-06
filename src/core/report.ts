// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import { createHash } from "node:crypto";
import type {
  AuditMetrics,
  AuditReport,
  CampaignConfig,
  DeduplicatedCluster,
  FindingSeverity,
  FindingType,
  SanitizedFinding,
  TesterConsent,
} from "./types.ts";
import { evaluateQualityGates } from "./campaign.ts";
import { clusterFindings } from "./findings.ts";
import { CROWDQA_GENESIS_NONCE, CROWDQA_NAMESPACE, SEVERITY_WEIGHTS } from "./constants.ts";

export function computeAuditMetrics(
  campaign: CampaignConfig,
  findings: SanitizedFinding[],
  clusters: DeduplicatedCluster[],
  consents: TesterConsent[] = []
): AuditMetrics {
  const testers = new Set(findings.map((f) => f.testerId));
  const gateEvaluation = evaluateQualityGates(campaign, findings, consents);

  const severityDistribution: Record<FindingSeverity, number> = {
    blocker: 0,
    critical: 0,
    major: 0,
    minor: 0,
    suggestion: 0,
  };

  const typeDistribution: Record<FindingType, number> = {
    functional_bug: 0,
    ux_friction: 0,
    visual_defect: 0,
    performance_lag: 0,
    accessibility_issue: 0,
    ai_hallucination_or_drift: 0,
    security_finding: 0,
  };

  for (const f of findings) {
    if (f.severity in severityDistribution) severityDistribution[f.severity]++;
    if (f.type in typeDistribution) typeDistribution[f.type]++;
  }

  // Calculate task completion rate
  // Steps with blocker defects are considered blocked
  const blockedSteps = new Set(findings.filter((f) => f.severity === "blocker").map((f) => f.stepId).filter(Boolean));
  const totalSteps = Math.max(1, campaign.steps.length);
  const completedSteps = Math.max(0, totalSteps - blockedSteps.size);
  const taskCompletionRate = Math.round((completedSteps / totalSteps) * 100);

  // Calculate friction score based on severity weights
  let weightedFriction = 0;
  for (const c of clusters) {
    const weight = SEVERITY_WEIGHTS[c.severity] || 1;
    weightedFriction += weight * Math.min(3, c.findingsCount);
  }
  const frictionScore = Math.min(100, Math.round(weightedFriction * 2.5));

  return {
    totalTesters: testers.size,
    totalSubmissions: findings.length,
    uniqueClusters: clusters.length,
    blockersCount: severityDistribution.blocker,
    criticalCount: severityDistribution.critical,
    majorCount: severityDistribution.major,
    minorCount: severityDistribution.minor,
    suggestionsCount: severityDistribution.suggestion,
    taskCompletionRate,
    frictionScore,
    severityDistribution,
    typeDistribution,
    gateEvaluation,
  };
}

export function generateAuditReport(
  campaign: CampaignConfig,
  sanitizedFindings: SanitizedFinding[],
  consents: TesterConsent[] = []
): AuditReport {
  const clusters = clusterFindings(sanitizedFindings);
  const metrics = computeAuditMetrics(campaign, sanitizedFindings, clusters, consents);
  const generatedAt = new Date().toISOString();

  const provenanceHash = createHash("sha256")
    .update(`${CROWDQA_NAMESPACE}:${CROWDQA_GENESIS_NONCE}:${campaign.id}:${generatedAt}:${metrics.totalSubmissions}`)
    .digest("hex");

  return {
    id: `audit-${campaign.id}-${Date.now()}`,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    targetUrl: campaign.targetUrl,
    generatedAt,
    provenanceHash,
    metrics,
    clusters,
    findings: sanitizedFindings,
  };
}

export function renderMarkdownReport(report: AuditReport): string {
  const m = report.metrics;
  const statusEmoji = m.gateEvaluation.status === "PASSED" ? "🟢" : m.gateEvaluation.status === "FAILED" ? "🔴" : "🟡";

  return `# CrowdQA Audit Report: ${report.campaignTitle}

**Campaign ID:** \`${report.campaignId}\`  
**Target Application:** ${report.targetUrl}  
**Audit Status:** ${statusEmoji} **${m.gateEvaluation.status}**  
**Generated At:** \`${report.generatedAt}\`  
**Provenance SHA-256:** \`${report.provenanceHash}\`

---

## 📊 Executive Summary

| Metric | Result | Description |
|---|---|---|
| **Gate Status** | **${m.gateEvaluation.status}** | ${m.gateEvaluation.reasons.join("; ")} |
| **Participating Testers** | **${m.totalTesters}** | Independent human test contributors |
| **Total Findings Ingested** | **${m.totalSubmissions}** | Validated submissions with PII redaction |
| **Deduplicated Defect Clusters** | **${m.uniqueClusters}** | Consolidated problem clusters |
| **Task Completion Rate (TCR)** | **${m.taskCompletionRate}%** | Completed user mission steps |
| **UX Friction Index** | **${m.frictionScore} / 100** | Weighted heuristic disruption score |

### Severity Distribution
- 🚨 **Blockers (P0):** ${m.blockersCount}
- ⚠️ **Critical (P1):** ${m.criticalCount}
- 🔸 **Major (P2):** ${m.majorCount}
- 🔹 **Minor (P3):** ${m.minorCount}
- 💡 **Suggestions (P4):** ${m.suggestionsCount}

---

## 🔍 Consolidated Defect Clusters (${report.clusters.length})

${report.clusters.length === 0 ? "_No defect clusters recorded for this mission._" : report.clusters.map((c, i) => `### ${i + 1}. [${c.severity.toUpperCase()}] ${c.title}
- **Cluster ID:** \`${c.clusterId}\` (Grouped ${c.findingsCount} finding(s) across testers: ${c.testersInvolved.join(", ")})
- **Category:** \`${c.type}\`
- **Step Affected:** \`${c.stepId || "General Exploratory"}\`
- **Affected Environments:** ${c.affectedDevices.join(", ")}
- **Expected:** ${c.representativeFinding.expectedBehavior}
- **Actual:** ${c.representativeFinding.actualBehavior}
- **Reproduction Steps:**
${c.representativeFinding.stepsToReproduce.map((s, idx) => `  ${idx + 1}. ${s}`).join("\n")}
${c.representativeFinding.logExtract ? `\n\`\`\`text\n${c.representativeFinding.logExtract}\n\`\`\`` : ""}
`).join("\n---\n\n")}

---

## 🛡️ Privacy & Compliance Notice
All raw logs, session tokens, email records, and credit numbers have been subjected to CrowdQA zero-leak automated PII scrubbing.
`;
}

export function renderHtmlReport(report: AuditReport): string {
  const m = report.metrics;
  const statusColor = m.gateEvaluation.status === "PASSED" ? "#10b981" : m.gateEvaluation.status === "FAILED" ? "#ef4444" : "#f59e0b";

  const severityJson = JSON.stringify(m.severityDistribution);
  const clustersJson = JSON.stringify(report.clusters);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CrowdQA Audit Report — ${escapeHtml(report.campaignTitle)}</title>
  <style>
    :root {
      --bg: #0f172a;
      --surface: #1e293b;
      --surface-border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #6366f1;
      --danger: #ef4444;
      --warning: #f59e0b;
      --success: #10b981;
      --info: #06b6d4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1.5rem;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    header {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 1.75rem;
      margin-bottom: 2rem;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
    }
    .title-area h1 { font-size: 1.8rem; margin-bottom: 0.25rem; font-weight: 700; }
    .title-area p { color: var(--text-muted); font-size: 0.95rem; }
    .status-badge {
      padding: 0.6rem 1.25rem;
      border-radius: 9999px;
      font-size: 1rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      border: 2px solid ${statusColor};
      color: ${statusColor};
      background: rgba(255, 255, 255, 0.04);
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 1.25rem;
      text-align: center;
    }
    .kpi-value { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 0.25rem; }
    .kpi-label { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 1.5rem;
    }
    .panel h2 { font-size: 1.2rem; margin-bottom: 1rem; color: #fff; }
    .bar-item { margin-bottom: 0.75rem; }
    .bar-label { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.25rem; }
    .bar-track { background: #0f172a; height: 10px; border-radius: 5px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 5px; }
    .cluster-list { display: flex; flex-direction: column; gap: 1rem; }
    .cluster-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-left: 5px solid #6366f1;
      border-radius: 8px;
      padding: 1.25rem;
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .cluster-card:hover { transform: translateY(-2px); border-color: #6366f1; }
    .cluster-card.blocker { border-left-color: var(--danger); }
    .cluster-card.critical { border-left-color: #f97316; }
    .cluster-card.major { border-left-color: var(--warning); }
    .cluster-card.minor { border-left-color: var(--info); }
    .cluster-card.suggestion { border-left-color: var(--success); }
    .cluster-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem; }
    .cluster-title { font-weight: 700; font-size: 1.1rem; }
    .cluster-meta { font-size: 0.85rem; color: var(--text-muted); }
    .steps-box {
      margin-top: 0.75rem;
      background: #0f172a;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
    }
    .footer {
      text-align: center;
      margin-top: 3rem;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    code { font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; background: #090d16; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="title-area">
        <h1>${escapeHtml(report.campaignTitle)}</h1>
        <p>Target: <code>${escapeHtml(report.targetUrl)}</code> · Campaign: <code>${escapeHtml(report.campaignId)}</code></p>
      </div>
      <div class="status-badge">${m.gateEvaluation.status}</div>
    </header>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-value">${m.totalTesters}</div>
        <div class="kpi-label">Human Testers</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${m.totalSubmissions}</div>
        <div class="kpi-label">Sanitized Findings</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${m.uniqueClusters}</div>
        <div class="kpi-label">Defect Clusters</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${m.taskCompletionRate}%</div>
        <div class="kpi-label">Task Completion</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${m.frictionScore}</div>
        <div class="kpi-label">Friction Index / 100</div>
      </div>
    </div>

    <div class="charts-row">
      <div class="panel">
        <h2>Defects by Severity</h2>
        <div class="bar-item">
          <div class="bar-label"><span>🚨 Blockers (P0)</span><span>${m.blockersCount}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width: ${calcPercent(m.blockersCount, m.totalSubmissions)}%; background: var(--danger);"></div></div>
        </div>
        <div class="bar-item">
          <div class="bar-label"><span>⚠️ Critical (P1)</span><span>${m.criticalCount}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width: ${calcPercent(m.criticalCount, m.totalSubmissions)}%; background: #f97316;"></div></div>
        </div>
        <div class="bar-item">
          <div class="bar-label"><span>🔸 Major (P2)</span><span>${m.majorCount}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width: ${calcPercent(m.majorCount, m.totalSubmissions)}%; background: var(--warning);"></div></div>
        </div>
        <div class="bar-item">
          <div class="bar-label"><span>🔹 Minor (P3)</span><span>${m.minorCount}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width: ${calcPercent(m.minorCount, m.totalSubmissions)}%; background: var(--info);"></div></div>
        </div>
        <div class="bar-item">
          <div class="bar-label"><span>💡 Suggestions (P4)</span><span>${m.suggestionsCount}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width: ${calcPercent(m.suggestionsCount, m.totalSubmissions)}%; background: var(--success);"></div></div>
        </div>
      </div>

      <div class="panel">
        <h2>Quality Gate Evaluation</h2>
        <p style="margin-bottom: 0.75rem; color: var(--text-muted);">Thresholds defined in campaign configuration:</p>
        <ul style="list-style-type: square; padding-left: 1.25rem; font-size: 0.95rem;">
          ${m.gateEvaluation.reasons.map((r) => `<li style="margin-bottom: 0.4rem;">${escapeHtml(r)}</li>`).join("")}
        </ul>
        <div style="margin-top: 1.25rem; font-size: 0.85rem; color: var(--text-muted);">
          SHA-256 Provenance Signature: <code>${report.provenanceHash.slice(0, 24)}...</code>
        </div>
      </div>
    </div>

    <div class="panel">
      <h2>Synthesized Finding Clusters (${report.clusters.length})</h2>
      <div class="cluster-list">
        ${report.clusters.map((c) => `
          <div class="cluster-card ${c.severity}">
            <div class="cluster-header">
              <span class="cluster-title">[${c.severity.toUpperCase()}] ${escapeHtml(c.title)}</span>
              <span class="cluster-meta">${c.findingsCount} tester finding(s) · Type: <code>${c.type}</code></span>
            </div>
            <p style="font-size: 0.95rem; margin-bottom: 0.5rem; color: #cbd5e1;">
              <strong>Observed:</strong> ${escapeHtml(c.representativeFinding.actualBehavior)}
            </p>
            <p style="font-size: 0.95rem; color: var(--text-muted);">
              <strong>Expected:</strong> ${escapeHtml(c.representativeFinding.expectedBehavior)}
            </p>
            <div class="steps-box">
              <strong style="color: #94a3b8; font-size: 0.8rem; text-transform: uppercase;">Reproduction:</strong>
              <ol style="margin-left: 1.2rem; margin-top: 0.25rem;">
                ${c.representativeFinding.stepsToReproduce.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
              </ol>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="footer">
      Generated by <strong>CrowdQA</strong> · Automated PII scrub applied · Zero runtime dependencies
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function calcPercent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((count / total) * 100));
}
