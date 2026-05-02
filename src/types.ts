export type RiskSeverity = "low" | "medium" | "high" | "critical";

export interface DiffFile {
  oldPath: string;
  newPath: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: string[];
  deletions: string[];
  hunks: string[];
}

export interface RiskFinding {
  id: string;
  title: string;
  severity: RiskSeverity;
  score: number;
  file: string;
  evidence: string;
  recommendation: string;
}

export interface AnalysisSummary {
  filesChanged: number;
  additions: number;
  deletions: number;
  riskScore: number;
  riskLevel: RiskSeverity;
}

export interface AnalysisReport {
  generatedAt: string;
  diffPath: string;
  summary: AnalysisSummary;
  findings: RiskFinding[];
  aiAssistedNarrative: string;
}
