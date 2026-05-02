import type { AnalysisReport, DiffFile, RiskFinding, RiskSeverity } from "./types.js";

const CONFIG_FILE_PATTERN = /(^|\/)(vite|webpack|rollup|babel|tsconfig|eslint|prettier|jest|vitest|next|nuxt|astro|svelte|tailwind|postcss)\.?(config)?\.(js|cjs|mjs|ts|json)$|(^|\/)\.(eslintrc|prettierrc|babelrc)/i;
const TEST_FILE_PATTERN = /(^|\/)(__tests__|tests?|specs?)\/|(\.|-)(test|spec)\.[cm]?[jt]sx?$/i;
const IMPORT_LINE_PATTERN = /^\s*import\s.+from\s+["'][^"']+["'];?\s*$/;
const FUNCTION_CALL_PATTERN = /([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g;

export function analyzeDiff(diffText: string, diffPath: string): AnalysisReport {
  const files = parseGitDiff(diffText);
  const findings: RiskFinding[] = [];

  for (const file of files) {
    findings.push(...detectPackageChanges(file));
    findings.push(...detectImportRewrites(file));
    findings.push(...detectRemovedFunctionArguments(file));
    findings.push(...detectRemovedFiles(file));
    findings.push(...detectConfigChanges(file));
    findings.push(...detectTestChanges(file));
  }

  findings.push(...detectLargeDiff(files));

  const additions = files.reduce((total, file) => total + file.additions.length, 0);
  const deletions = files.reduce((total, file) => total + file.deletions.length, 0);
  const riskScore = Math.min(100, findings.reduce((total, finding) => total + finding.score, 0));
  const riskLevel = scoreToSeverity(riskScore);

  return {
    generatedAt: new Date().toISOString(),
    diffPath,
    summary: {
      filesChanged: files.length,
      additions,
      deletions,
      riskScore,
      riskLevel
    },
    findings: findings.sort((a, b) => b.score - a.score),
    aiAssistedNarrative: buildNarrative(riskScore, findings)
  };
}

export function parseGitDiff(diffText: string): DiffFile[] {
  const files: DiffFile[] = [];
  let current: DiffFile | undefined;

  for (const line of diffText.split(/\r?\n/)) {
    if (line.startsWith("diff --git ")) {
      current = createDiffFile(line);
      files.push(current);
      continue;
    }

    if (!current) {
      continue;
    }

    if (line.startsWith("deleted file mode")) {
      current.status = "deleted";
    } else if (line.startsWith("new file mode")) {
      current.status = "added";
    } else if (line.startsWith("rename from ")) {
      current.oldPath = normalizeDiffPath(line.slice("rename from ".length));
      current.status = "renamed";
    } else if (line.startsWith("rename to ")) {
      current.newPath = normalizeDiffPath(line.slice("rename to ".length));
      current.status = "renamed";
    } else if (line.startsWith("--- ")) {
      current.oldPath = normalizeHeaderPath(line.slice(4), current.oldPath);
    } else if (line.startsWith("+++ ")) {
      current.newPath = normalizeHeaderPath(line.slice(4), current.newPath);
    } else if (line.startsWith("@@")) {
      current.hunks.push(line);
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      current.additions.push(line.slice(1));
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      current.deletions.push(line.slice(1));
    }
  }

  return files;
}

function createDiffFile(header: string): DiffFile {
  const match = /^diff --git a\/(.+) b\/(.+)$/.exec(header);
  return {
    oldPath: normalizeDiffPath(match?.[1] ?? "unknown"),
    newPath: normalizeDiffPath(match?.[2] ?? match?.[1] ?? "unknown"),
    status: "modified",
    additions: [],
    deletions: [],
    hunks: []
  };
}

function detectPackageChanges(file: DiffFile): RiskFinding[] {
  if (!file.newPath.endsWith("package.json")) {
    return [];
  }

  const dependencyLines = [...file.additions, ...file.deletions].filter((line) =>
    /"(@?[\w.-]+\/?[\w.-]*)"\s*:\s*"[~^]?\d|"(dependencies|devDependencies|peerDependencies|optionalDependencies)"/.test(line)
  );

  if (dependencyLines.length === 0) {
    return [];
  }

  return [finding(
    "package-dependency-change",
    "Package dependency changes detected",
    "high",
    18,
    file.newPath,
    `${dependencyLines.length} dependency-related lines changed`,
    "Review lockfile impact, transitive dependency changes, and runtime compatibility before merging."
  )];
}

function detectImportRewrites(file: DiffFile): RiskFinding[] {
  const removedImports = file.deletions.filter((line) => IMPORT_LINE_PATTERN.test(line));
  const addedImports = file.additions.filter((line) => IMPORT_LINE_PATTERN.test(line));

  if (removedImports.length === 0 || addedImports.length === 0) {
    return [];
  }

  return [finding(
    "import-rewrite",
    "Import rewrites may alter module resolution",
    "medium",
    12,
    file.newPath,
    `${removedImports.length} imports removed and ${addedImports.length} imports added`,
    "Check named exports, default exports, tree-shaking behavior, and bundler aliases."
  )];
}

function detectRemovedFunctionArguments(file: DiffFile): RiskFinding[] {
  const findings: RiskFinding[] = [];

  for (const deletion of file.deletions) {
    const comparableAddition = file.additions.find((addition) => sameCallWithFewerArgs(deletion, addition));
    if (!comparableAddition) {
      continue;
    }

    findings.push(finding(
      "removed-function-argument",
      "Function call arguments were removed",
      "high",
      16,
      file.newPath,
      `Before: ${deletion.trim()} | After: ${comparableAddition.trim()}`,
      "Confirm the target API signature changed intentionally and add regression coverage around the call site."
    ));
    break;
  }

  return findings;
}

function detectRemovedFiles(file: DiffFile): RiskFinding[] {
  if (file.status !== "deleted") {
    return [];
  }

  return [finding(
    "removed-file",
    "File removed by migration",
    "high",
    15,
    file.oldPath,
    `${file.oldPath} was deleted`,
    "Confirm no imports, routes, build entries, or runtime references still depend on this file."
  )];
}

function detectConfigChanges(file: DiffFile): RiskFinding[] {
  if (!CONFIG_FILE_PATTERN.test(file.newPath) && !CONFIG_FILE_PATTERN.test(file.oldPath)) {
    return [];
  }

  return [finding(
    "config-change",
    "Build or tool configuration changed",
    "medium",
    10,
    file.newPath,
    `${file.additions.length + file.deletions.length} config lines changed`,
    "Run the relevant build, lint, and test commands across affected packages."
  )];
}

function detectTestChanges(file: DiffFile): RiskFinding[] {
  if (!TEST_FILE_PATTERN.test(file.newPath) && !TEST_FILE_PATTERN.test(file.oldPath)) {
    return [];
  }

  return [finding(
    "test-change",
    "Test files changed during migration",
    "low",
    6,
    file.newPath,
    `${file.additions.length + file.deletions.length} test lines changed`,
    "Review whether tests were updated to preserve behavior or only to fit the migration."
  )];
}

function detectLargeDiff(files: DiffFile[]): RiskFinding[] {
  const changedLines = files.reduce((total, file) => total + file.additions.length + file.deletions.length, 0);
  if (changedLines < 80 && files.length < 8) {
    return [];
  }

  return [finding(
    "large-diff",
    "Large migration diff needs staged review",
    "medium",
    12,
    "diff",
    `${files.length} files and ${changedLines} changed lines`,
    "Split high-risk areas into reviewable groups and verify each group independently."
  )];
}

function sameCallWithFewerArgs(before: string, after: string): boolean {
  const beforeCalls = extractCalls(before);
  const afterCalls = extractCalls(after);

  return beforeCalls.some((beforeCall) =>
    afterCalls.some((afterCall) =>
      beforeCall.name === afterCall.name &&
      beforeCall.args.length > afterCall.args.length &&
      beforeCall.args.length > 1
    )
  );
}

function extractCalls(line: string): Array<{ name: string; args: string[] }> {
  const calls: Array<{ name: string; args: string[] }> = [];
  for (const match of line.matchAll(FUNCTION_CALL_PATTERN)) {
    const args = match[2]
      .split(",")
      .map((arg) => arg.trim())
      .filter(Boolean);
    calls.push({ name: match[1], args });
  }
  return calls;
}

function finding(
  id: string,
  title: string,
  severity: RiskSeverity,
  score: number,
  file: string,
  evidence: string,
  recommendation: string
): RiskFinding {
  return { id, title, severity, score, file, evidence, recommendation };
}

function normalizeHeaderPath(path: string, fallback: string): string {
  if (path === "/dev/null") {
    return fallback;
  }
  return normalizeDiffPath(path.replace(/^[ab]\//, ""));
}

function normalizeDiffPath(path: string): string {
  return path.trim().replace(/\\/g, "/");
}

function scoreToSeverity(score: number): RiskSeverity {
  if (score >= 70) {
    return "critical";
  }
  if (score >= 40) {
    return "high";
  }
  if (score >= 18) {
    return "medium";
  }
  return "low";
}

function buildNarrative(score: number, findings: RiskFinding[]): string {
  if (findings.length === 0) {
    return "AI-assisted reporting layer: deterministic heuristics found no major migration risks in this diff.";
  }

  const topRisks = findings.slice(0, 3).map((finding) => finding.title.toLowerCase()).join(", ");
  return `AI-assisted reporting layer: deterministic heuristics rated this migration at ${score}/100. Main review areas: ${topRisks}.`;
}
