# Codemod Sentinel Report

Codemod Sentinel is an AI-assisted reporting layer for codemods and migration patches.

This MVP uses deterministic heuristics instead of external LLM calls, so it is demo-friendly and requires no API keys.

## Summary

- Diff analyzed: `examples/sample.diff`
- Generated at: `2026-05-02T12:12:32.694Z`
- Files changed: 5
- Lines added: 9
- Lines removed: 13
- Overall risk score: 77/100
- Overall risk level: CRITICAL
- Highest finding severity: HIGH

## AI-Assisted Review Narrative

AI-assisted reporting layer: deterministic heuristics rated this migration at 77/100.

Main review areas:

- package dependency changes detected
- function call arguments were removed
- file removed by migration

## Findings

### 1. Package dependency changes detected

- Severity: HIGH
- Score impact: 18
- File: `package.json`
- Evidence: 6 dependency-related lines changed
- Recommendation: Review lockfile impact, transitive dependency changes, and runtime compatibility before merging.

### 2. Function call arguments were removed

- Severity: HIGH
- Score impact: 16
- File: `src/pages/users.tsx`
- Evidence:
  - Before: `const users = useQuery("users", fetchUsers, { staleTime: 5000 });`
  - After: `const users = useQuery({ queryKey: ["users"], queryFn: fetchUsers });`
- Recommendation: Confirm the target API signature changed intentionally and add regression coverage around the call site.

### 3. File removed by migration

- Severity: HIGH
- Score impact: 15
- File: `src/legacy/cache.ts`
- Evidence: `src/legacy/cache.ts` was deleted
- Recommendation: Confirm no imports, routes, build entries, or runtime references still depend on this file.

### 4. Import rewrites may alter module resolution

- Severity: MEDIUM
- Score impact: 12
- File: `src/pages/users.tsx`
- Evidence: 1 import removed and 1 import added
- Recommendation: Check named exports, default exports, tree-shaking behavior, and bundler aliases.

### 5. Build or tool configuration changed

- Severity: MEDIUM
- Score impact: 10
- File: `tsconfig.json`
- Evidence: 3 config lines changed
- Recommendation: Run the relevant build, lint, and test commands across affected packages.

### 6. Test files changed during migration

- Severity: LOW
- Score impact: 6
- File: `src/users.test.ts`
- Evidence: 2 test lines changed
- Recommendation: Review whether tests were updated to preserve behavior or only to fit the migration.

## Suggested Review Checklist

- Run build, lint, and test commands after applying the migration.
- Manually review package and configuration changes.
- Confirm import rewrites preserve runtime behavior.
- Add focused regression tests for changed API call sites.
- Split large migrations into smaller review batches when possible.
