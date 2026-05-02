#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { analyzeDiff } from "./analyzer.js";
import { renderJsonReport, renderMarkdownReport } from "./report.js";

const program = new Command();

program
  .name("codemod-sentinel")
  .description("AI-assisted safety reviewer for codemods and migration patches.")
  .version("0.1.0");

program
  .command("scan")
  .description("Analyze a git diff and generate migration safety reports.")
  .requiredOption("--diff <path>", "Path to a git diff file")
  .option("--out-dir <path>", "Directory for generated reports", ".")
  .action(async (options: { diff: string; outDir: string }) => {
    const diffPath = path.resolve(options.diff);
    const outDir = path.resolve(options.outDir);

    try {
      const diffText = await readFile(diffPath, "utf8");
      const report = analyzeDiff(diffText, options.diff);
      const markdownPath = path.join(outDir, "sentinel-report.md");
      const jsonPath = path.join(outDir, "sentinel-report.json");

      await writeFile(markdownPath, renderMarkdownReport(report), "utf8");
      await writeFile(jsonPath, renderJsonReport(report), "utf8");

      console.log(chalk.cyan("Codemod Sentinel scan complete"));
      console.log(chalk.gray(`Diff: ${options.diff}`));
      console.log(`Risk: ${formatRisk(report.summary.riskLevel, report.summary.riskScore)}`);
      console.log(chalk.green(`Generated ${path.relative(process.cwd(), markdownPath)}`));
      console.log(chalk.green(`Generated ${path.relative(process.cwd(), jsonPath)}`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Scan failed: ${message}`));
      process.exitCode = 1;
    }
  });

program.parseAsync();

function formatRisk(level: string, score: number): string {
  const label = `${level.toUpperCase()} (${score}/100)`;
  if (level === "critical" || level === "high") {
    return chalk.red(label);
  }
  if (level === "medium") {
    return chalk.yellow(label);
  }
  return chalk.green(label);
}
