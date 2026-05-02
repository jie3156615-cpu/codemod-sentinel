import type { AnalysisReport, RiskSeverity } from "./types.js";

const severityRank: Record<RiskSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export function renderMarkdownReport(report: AnalysisReport): string {
  const findings = report.findings.length > 0
    ? report.findings.map((finding, index) => [
      `### ${index + 1}. ${finding.title}`,
      "",
      `- Severity: ${finding.severity.toUpperCase()}`,
      `- Score impact: ${finding.score}`,
      `- File: \`${finding.file}\``,
      `- Evidence: ${finding.evidence}`,
      `- Recommendation: ${finding.recommendation}`
    ].join("\n")).join("\n\n")
    : "No risk findings detected.";

  const topSeverity = report.findings.reduce<RiskSeverity>(
    (highest, finding) => severityRank[finding.severity] > severityRank[highest] ? finding.severity : highest,
    "low"
  );

  return [
    "# Codemod Sentinel Report",
    "",
    "Codemod Sentinel is an AI-assisted reporting layer for codemods and migration patches. This MVP uses deterministic heuristics instead of external LLM calls, so it is demo-friendly and requires no API keys.",
    "",
    "## Summary",
    "",
    `- Diff analyzed: \`${report.diffPath}\``,
    `- Generated at: ${report.generatedAt}`,
    `- Files changed: ${report.summary.filesChanged}`,
    `- Lines added: ${report.summary.additions}`,
    `- Lines removed: ${report.summary.deletions}`,
    `- Overall risk score: ${report.summary.riskScore}/100`,
    `- Overall risk level: ${report.summary.riskLevel.toUpperCase()}`,
    `- Highest finding severity: ${topSeverity.toUpperCase()}`,
    "",
    "## AI-Assisted Review Narrative",
    "",
    report.aiAssistedNarrative,
    "",
    "## Findings",
    "",
    findings,
    "",
    "## Suggested Review Checklist",
    "",
    "- Run build, lint, and test commands after applying the migration.",
    "- Manually review package and configuration changes.",
    "- Confirm import rewrites preserve runtime behavior.",
    "- Add focused regression tests for changed API call sites.",
    "- Split large migrations into smaller review batches when possible.",
    ""
  ].join("\n");
}

export function renderJsonReport(report: AnalysisReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
