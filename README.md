# Codemod Sentinel

Codemod Sentinel is an AI-assisted safety reviewer for codemods and migration patches.

It analyzes JavaScript and TypeScript git diffs, detects risky migration patterns, and generates a concise safety report for reviewers.

**No API key required.** This hackathon MVP does not call a real LLM. It simulates an AI-assisted reporting layer with deterministic heuristics, so the demo is fast, transparent, and reliable.

## Quick Start

```bash
npm install
npm run build
npm run demo
```

The demo scans:

```text
examples/sample.diff
```

and generates:

- `sentinel-report.md`
- `sentinel-report.json`

A committed example report is also available at:

- `examples/sample-report.md`

## What It Does

Codemod Sentinel parses a git diff and highlights migration risks such as:

- package dependency changes
- import rewrites
- removed function arguments
- removed files
- config file changes
- test file changes
- large diff size

Each finding includes:

- severity
- score impact
- file path
- evidence from the diff
- review recommendation

## Why It Matters

Large framework upgrades and automated codemods can change hundreds of files at once. Reviewers often need to quickly answer:

- Did package dependencies change?
- Were imports rewritten?
- Did function calls lose arguments?
- Were config files, tests, or runtime files changed?
- Is this migration too large to review safely in one pass?

Codemod Sentinel turns those questions into an immediate migration safety report.

## Why This Is Different

Most migration tools focus on creating another framework-specific codemod.

Codemod Sentinel reviews the codemod output instead. It sits after automated changes and helps teams decide whether the migration patch is safe to review, test, and merge.

## CLI Usage

Run the included demo:

```bash
npm run demo
```

Run the scanner directly through npm:

```bash
npm run scan -- --diff examples/sample.diff
```

After building, the CLI entry can also be used as:

```bash
codemod-sentinel scan --diff examples/sample.diff
```

## Example Console Output

```text
Codemod Sentinel scan complete
Diff: examples/sample.diff
Risk: CRITICAL (77/100)
Generated sentinel-report.md
Generated sentinel-report.json
```

## Sample Report Excerpt

```md
# Codemod Sentinel Report

## Summary

- Files changed: 5
- Lines added: 9
- Lines removed: 13
- Overall risk score: 77/100
- Overall risk level: CRITICAL

## AI-Assisted Review Narrative

AI-assisted reporting layer: deterministic heuristics rated this migration at 77/100. Main review areas: package dependency changes detected, function call arguments were removed, file removed by migration.
```

## Hackathon MVP Scope

This MVP intentionally keeps the implementation simple:

- no external API keys
- no real LLM call
- no framework-specific migration engine
- deterministic scoring for repeatable demos
- Markdown and JSON report generation

The MVP is framework-agnostic: it does not try to know every React, Next.js, Vue, Angular, or Node migration rule. It highlights review risk patterns that appear across many codemods.

Future versions could connect to an LLM, inspect full repository context, suggest safer codemod chunks, and integrate with pull request checks.

## Development

```bash
npm run build
npm run demo
```
