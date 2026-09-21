---
name: 'benchmark-readme-sync'
description: 'Refresh README benchmark results from a successful GitHub Actions Benchmark run, preserving data provenance and separate development, build, and memory tables.'
---

# Benchmark README Sync

## When to use

- Update `README.md` benchmark results from GitHub Actions.
- Replace stale benchmark tables, versions, run links, or dates.
- The user does not need to provide an Actions URL.

## Workflow

1. Read `README.md`, `.github/workflows/benchmark.yml`, and the reporting code in `scripts/benchmark.ts` to confirm the cases, metrics, and current output format.
2. Resolve the canonical GitHub repository and default branch with `gh repo view`, then find the latest successful `Benchmark` workflow run on that branch unless the user gave a specific run ID.
3. Confirm the run succeeded and map each matrix case to a successful job, including rerun attempts. Use one workflow run for the complete set of results; do not mix unrelated runs or silently substitute local measurements.
4. Prefer the uploaded `benchmark-<os>-<case>` artifacts. Read `summary.md` for tables and `summary.json` for exact values, tool versions, units, and measurement settings. Use final job-log tables only if artifacts are unavailable.
5. Update `README.md` carefully:
   - Record the source run URL, run date, and commit SHA. Use the run's date, not the date of the README edit.
   - Replace each case's tables with its matching results, following the layout below.
   - Preserve the case heading, prose, command block, and the final `---` separator before `## Run locally`.
   - Preserve reported values and ranking emojis. If older output needs reformatting, use its `summary.json` with the current reporting logic in `scripts/benchmark.ts`; do not rerun benchmarks just to render tables. Avoid importing the whole benchmark entrypoint, which starts measurements.
6. Validation is required after the edit:
   - Every case in the workflow matrix is represented in `README.md`.
   - Table order, available columns, tool names, units, and values match the source results and current reporting format.
   - No duplicated headings, tables, rows, or min–max ranges appear in the displayed results.
   - Case descriptions and the separator before `## Run locally` are preserved.
   - For a routine sync, the diff only changes result tables and their source metadata.

## Result layout

- **Development metrics:** startup without cache, startup with cache, and HMR. Omit this table for build-only cases.
- **Build metrics:** build without cache, build with cache, output size, and gzipped size.
- **Memory metrics:** a separate table immediately below Build metrics. Include dev steady and dev peak without cache, dev steady and dev peak with cache, then build peak without and with cache. Build-only cases include only the two build peak columns.
- Keep memory out of the Development and Build tables. Display memory medians to one decimal place with `MiB`, for example `365.9 MiB🥇`, without a suffix such as `(365.9–377.5)`. Raw JSON can retain minimum and maximum values.
- State the source memory metric (macOS physical footprint or Linux RSS). Historical single-process RSS snapshots cannot supply process-tree steady or peak values; do not relabel them or invent missing metrics.

## Commands

Prefer `gh` because it is authenticated and exposes both run metadata and logs. Use these to execute or debug the workflow manually.

Resolve the canonical repository and default branch:

```bash
benchmark_repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
benchmark_branch=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)
```

Find the latest successful benchmark run:

```bash
gh run list \
  --workflow Benchmark \
  --branch "$benchmark_branch" \
  --limit 20 \
  --json databaseId,conclusion,url,createdAt,headSha \
  --jq 'map(select(.conclusion == "success")) | sort_by(.createdAt) | last' \
  -R "$benchmark_repo"
```

Expand the search if the first page has no successful run. Download artifacts into a fresh temporary directory:

```bash
gh run download <run_id> -R "$benchmark_repo" --dir <temporary-directory>
```

Map case names to job IDs:

```bash
gh api repos/<owner>/<repo>/actions/runs/<run_id>/jobs --paginate \
  | jq -r '.jobs[] | [.id, .name, .conclusion] | @tsv'
```

Extract a job's final benchmark tables:

```bash
gh run view <run_id> --job <job_id> --log \
  -R <owner>/<repo> \
  | cut -f3- \
  | perl -pe 's/\e\[[0-9;]*[A-Za-z]//g' \
  | sed -E 's/^\xef\xbb\xbf//; s/^[0-9T:.\-]+Z //' \
  | awk '/^(Development|Build|Memory) metrics:$/ {capture=1; print; next} capture && (/^\|/ || /^$/) {print; next} capture {exit}'
```

Notes:

- Do not rely on the second log column being `Run Benchmark`. Current `gh run view --log` output may label lines as `UNKNOWN STEP`, while the third column still contains the benchmark output you need.
- Capture starts at the first `Development metrics:` or `Build metrics:` heading so preamble noise is excluded.
- Stop at the first non-table output after capture begins so artifact-upload and cleanup steps do not leak into the tables.
- Keep all three tables when present; build-only cases have Build metrics followed by Memory metrics.
- Prefer replacing one case section at a time or using a temporary one-off local command; do not add repository scripts just to complete a single sync.
- The brittle part of the edit is preserving section boundaries, especially the final `---` before `## Run locally`.

## Failure handling

- If no successful `Benchmark` run exists, stop and report that blocker.
- If a case is missing, failed, truncated, or lacks the required metrics in both artifacts and logs, report it and do not present a partial set as a complete refresh.
- If the workflow matrix and README sections do not match, call out the mismatch and preserve unsupported sections rather than silently dropping them.
- If `README.md` already points to the latest successful run and the extracted tables match, the expected result is an empty diff.
- If the workflow breaks down, include the failing step in the report: repo resolution, run lookup, job mapping, log extraction, README replacement, or structural validation.
