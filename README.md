# Codemod Sentinel

Codemod Sentinel is an AI-assisted safety reviewer for codemods and migration patches. It analyzes JavaScript and TypeScript git diffs, detects risky migration patterns, and generates a concise safety report for reviewers.

This hackathon MVP does not call a real LLM or require API keys. It simulates an AI-assisted reporting layer with deterministic heuristics so the demo is fast, transparent, and reliable.

## Why It Matters

Large framework upgrades and automated codemods can change hundreds of files at once. Reviewers often need to quickly answer:

- Did package dependencies change?
- Were imports rewritten?
- Did function calls lose arguments?
- Were config files, tests, or runtime files changed?
- Is this migration too large to review safely in one pass?

Codemod Sentinel turns those questions into an immediate report.

## Installation

```bash
npm install
```

## Demo

Run the included sample migration scan:

```bash
npm run demo
```

The command analyzes:

```bash
examples/sample.diff
```

and generates:

```bash
sentinel-report.md
sentinel-report.json
```

## CLI Usage

```bash
npm run scan -- --diff examples/sample.diff
```

After building, the CLI entry can also be used as:

```bash
codemod-sentinel scan --diff examples/sample.diff
```

## Example Output

```text
Codemod Sentinel scan complete
Diff: examples/sample.diff
Risk: CRITICAL (77/100)
Generated sentinel-report.md
Generated sentinel-report.json
```

The Markdown report includes:

- overall risk score
- AI-assisted review narrative
- risk findings
- evidence from the diff
- review recommendations
- suggested migration checklist

## MVP Scope

This MVP detects and scores:

- package.json dependency changes
- import rewrites
- removed function arguments
- removed files
- config file changes
- test file changes
- large diff size

Future versions could connect to an LLM, inspect full repository context, suggest safer codemod chunks, and integrate with pull request checks.

## Development

```bash
npm run build
npm run demo
```
