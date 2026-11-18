---
name: 'benchmark-readme-sync'
description: 'Update README benchmark results from a successful GitHub Actions run and regenerate the matching light and dark charts.'
---

# Benchmark README Sync

Use this skill to refresh benchmark tables, tool versions, source metadata, and charts. The user does not need to provide a workflow run URL.

## Workflow

1. Read `README.md`, `.github/workflows/benchmark.yml`, and the reporting section of `scripts/benchmark.ts` to confirm the current cases, metrics, and table format. Check `scripts/generate-charts.ts` for chart generation requirements.
2. Resolve the canonical repository and default branch through the GitHub connector, or `gh` when needed. Unless the user specifies a run, find the latest successful `Benchmark` run on the default branch; paginate if necessary.
3. Collect every matrix case from that one run, checking successful jobs and rerun attempts. Prefer the uploaded `benchmark-<os>-<case>` artifacts: `summary.md` supplies tables, and `summary.json` supplies values, versions, and measurement metadata. Fall back to final job-log tables only when artifacts are unavailable. Do not mix runs or substitute local measurements.
4. Replace each case's tables inside **Full benchmark data** and update the source run URL, run date, commit SHA, and memory metric. Preserve case descriptions, commands, headings, separators, and chart markers. Use the benchmark run's date, not the edit date.
5. **Regenerate charts automatically on every sync, even when the tables are already current.** After updating the README, run:

   ```bash
   pnpm charts
   ```

   The dependency-free equivalent is `node scripts/generate-charts.ts`. It reads the README tables, writes both themes to `assets/charts/`, and updates the README image references and collapsible sections. Do not edit SVGs manually or rerun benchmarks just to generate charts. Include changed SVGs alongside the README in any commit or PR.

6. Validate the complete update before reporting completion.

## Table conventions

- Preserve the existing table labels and column names: the chart generator reads them. Keep this order: **Development metrics**, **Build metrics**, **Dev memory (MiB)**, **Build memory (MiB)**. Build-only cases omit both development tables.
- Preserve reported values, versions, and ranking emojis. If older output needs reformatting, use `summary.json` and the current reporting logic without importing the benchmark entrypoint, which starts measurements.
- Keep memory separate from timing and size tables. Show memory medians to one decimal place, with `MiB` in the table label rather than each cell; omit min–max ranges.
- Preserve the source memory methodology. macOS process-tree physical footprint, Linux RSS, and historical single-process measurements are not interchangeable.

## Validation

- Every workflow case and measured metric is represented; tables match the selected run, with no duplicated headings or rows.
- Both chart themes cover the table data, with correct values, tool labels, units, and readable text. Preserve the existing presentation and concise image alt text.
- Running the chart command again produces no additional changes. A routine sync changes only README results/source metadata and their generated charts.
- If tables and charts are already current, leave an empty diff after regeneration.

If a case or metric is missing, results are incomplete, or chart generation fails, report the specific blocker. Do not drop data to make generation pass or report a partial update as complete.
