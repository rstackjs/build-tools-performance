import { spawn, type ChildProcess } from 'node:child_process';
import os from 'node:os';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import fse from 'fs-extra';
import { createRequire } from 'module';
import path from 'path';
import puppeteer, {
  type Browser,
  type ConsoleMessage,
  type Page,
} from 'puppeteer';
import { logger } from 'rslog';
import color from 'picocolors';
import { markdownTable } from 'markdown-table';
import { caseName } from '../shared/constants.mjs';
import {
  getFileSizes,
  addRankingEmojis,
  shuffleArray,
  sleep,
} from './utils.ts';

import {
  createMemorySampler,
  memoryKind,
  median,
  sampleIntervalMs,
  steadyIdleMs,
  steadyWindowMs,
} from './memory.ts';

process.env.CASE = caseName;

type BenchmarkConfig = {
  supportedTools: string[];
  defaultTools?: string[];
  dev?: boolean;
  rootFile?: string;
  leafFile?: string;
};

type MemoryMonitor = ReturnType<
  Awaited<ReturnType<typeof createMemorySampler>>['start']
>;
type Command = { child: ChildProcess; memory: MemoryMonitor };
type DevServerResult = { time: number; command: Command };
type BuildResult = { time: number; peak: number };

type NumericPerfMetricKey =
  | 'devColdStart'
  | 'devHotStart'
  | 'devColdSteady'
  | 'devColdPeak'
  | 'devHotSteady'
  | 'devHotPeak'
  | 'rootHmr'
  | 'leafHmr'
  | 'hmr'
  | 'prodBuild'
  | 'prodHotBuild'
  | 'buildColdPeak'
  | 'buildHotPeak';

interface PerfMetrics extends Partial<Record<NumericPerfMetricKey, number>> {
  outputSize?: string;
  gzippedSize?: string;
}

type PerfResultMap = Partial<Record<string, PerfMetrics>>;
type FileSizes = Awaited<ReturnType<typeof getFileSizes>>;

interface Column {
  title: string;
  data: string[] | null;
}

const COOL_DOWN_TIME = 3000;

async function coolDown(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, COOL_DOWN_TIME));
}

const ensureMetrics = (
  perfResult: PerfResultMap,
  toolName: string,
): PerfMetrics => {
  if (!perfResult[toolName]) {
    perfResult[toolName] = {};
  }
  return perfResult[toolName]!;
};

const require = createRequire(import.meta.url);
const monorepoRoot = path.join(import.meta.dirname, '../');
const caseDir = path.join(monorepoRoot, 'cases', caseName);
const srcDir = path.join(caseDir, 'src');
const distDir = path.join(caseDir, 'dist');
type ConfigModule = {
  config: BenchmarkConfig;
};
const { config } = (await import(
  `../cases/${caseName}/benchmark-config.mjs`
)) as ConfigModule;
const runDev = config.dev !== false;

const startConsole = `console.log('Benchmark Start Time:', Date.now());
`;

interface BuildToolOptions {
  name: string;
  port: number;
  startScript: string;
  startedRegex: RegExp;
  buildScript: string;
  binFilePath: string;
}

class BuildTool {
  public readonly name: string;
  public readonly port: number;
  private readonly startScript: string;
  private readonly startedRegex: RegExp;
  private readonly buildScript: string;
  private readonly binFilePath: string;

  constructor({
    name,
    port,
    startScript,
    startedRegex,
    buildScript,
    binFilePath,
  }: BuildToolOptions) {
    this.name = name;
    this.port = port;
    this.startScript = startScript;
    this.startedRegex = startedRegex;
    this.buildScript = buildScript;
    this.binFilePath = path.join(process.cwd(), 'node_modules', binFilePath);
    this.hackBinFile();
  }

  cleanCache(): void {
    try {
      [monorepoRoot, caseDir].forEach((dir) => {
        fse.removeSync(path.join(dir, './.parcel-cache'));
        fse.removeSync(path.join(dir, './node_modules/.cache'));
        fse.removeSync(path.join(dir, './node_modules/.vite'));
        fse.removeSync(path.join(dir, './node_modules/.farm'));
        fse.removeSync(path.join(dir, './.turbopack'));
      });
    } catch {
      // ignore cache cleanup failures so benchmarks can continue
    }
  }

  // Add a `console.log('Benchmark start', Date.now())` to the bin file's second line
  private hackBinFile(): void {
    logger.info(
      'Setup bin file for',
      color.green(this.name),
      color.dim(`(${this.binFilePath.split('node_modules/')[1]})`),
    );

    const binFileContent = readFileSync(this.binFilePath, 'utf-8');

    if (!binFileContent.includes(startConsole)) {
      const lines = binFileContent.split('\n');
      lines.splice(1, 0, startConsole);
      writeFileSync(this.binFilePath, lines.join('\n'));
    }
  }

  private launch(script: string): Command {
    const child = spawn(process.execPath, ['--run', script], {
      cwd: caseDir,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1' },
    });
    if (!child.pid) throw new Error(`Failed to launch ${script}`);
    const command = { child, memory: memorySampler.start(child.pid) };
    activeCommands.add(command);
    child.stderr!.on('data', (data: Buffer) => logger.log(`stderr: ${data}`));
    if (process.env.DEBUG)
      child.stdout!.on('data', (data: Buffer) => console.log(data.toString()));
    return command;
  }

  async startServer(): Promise<DevServerResult> {
    logger.start(`Running start command: ${this.startScript}`);
    const command = this.launch(this.startScript);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`${this.name} startup timed out`)),
        60000,
      );
      let output = '';
      command.child.stdout!.on('data', (data: Buffer) => {
        output = (output + data.toString()).slice(-65536);
        const match = /Benchmark Start Time: (\d+)/.exec(output);
        this.startedRegex.lastIndex = 0;
        if (match && this.startedRegex.test(output)) {
          clearTimeout(timeout);
          resolve({ time: Date.now() - Number(match[1]), command });
        }
      });
      command.child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      command.child.on('exit', (code) => {
        clearTimeout(timeout);
        reject(new Error(`${this.name} dev server exited with code ${code}`));
      });
    });
  }

  async build(cache: 'cold' | 'warm'): Promise<BuildResult> {
    logger.start(`Running build command: ${this.buildScript}`);
    const start = Date.now();
    const command = this.launch(this.buildScript);
    let succeeded = false;
    try {
      await new Promise<void>((resolve, reject) => {
        command.child.stdout!.resume();
        command.child.on('error', reject);
        command.child.on('exit', (code) =>
          code === 0
            ? resolve()
            : reject(new Error(`Build failed with exit code ${code}`)),
        );
      });
      const time = Date.now() - start;
      const peak = await command.memory.stop();
      if (!peak) throw new Error('No build memory samples collected');
      succeeded = true;
      return { time, peak: peak / 1024 ** 2 };
    } finally {
      await stopCommand(command);
      saveMemory(this.name, `build-${cache}`, command, { succeeded });
    }
  }
}

const parseToolNames = (): string[] => {
  if (process.env.TOOLS === 'all') {
    return config.supportedTools;
  }
  if (process.env.TOOLS) {
    return process.env.TOOLS?.split(',').map((item) => item.toLowerCase());
  }
  return config.defaultTools ?? config.supportedTools;
};
const buildTools: BuildTool[] = [];
parseToolNames().forEach((name) => {
  switch (name) {
    case 'rspack':
      buildTools.push(
        new BuildTool({
          name: 'Rspack CLI ' + require('@rspack/core/package.json').version,
          port: 8080,
          startScript: 'start:rspack',
          startedRegex: /in (.+) (s|ms)/,
          buildScript: 'build:rspack',
          binFilePath: '@rspack/cli/bin/rspack.js',
        }),
      );
      break;
    case 'rsbuild':
      buildTools.push(
        new BuildTool({
          name: 'Rsbuild ' + require('@rsbuild/core/package.json').version,
          port: 3000,
          startScript: 'start:rsbuild',
          startedRegex: /in (.+)(s|ms)/,
          buildScript: 'build:rsbuild',
          binFilePath: '@rsbuild/core/bin/rsbuild.js',
        }),
      );
      break;
    case 'vite':
      buildTools.push(
        new BuildTool({
          name: 'Vite ' + require('vite/package.json').version,
          port: 5173,
          startScript: 'start:vite',
          startedRegex: /ready in (\d+) (s|ms)/,
          buildScript: 'build:vite',
          binFilePath: 'vite/bin/vite.js',
        }),
      );
      break;
    case 'rollup':
      buildTools.push(
        new BuildTool({
          name: 'Rollup ' + require('rollup/package.json').version,
          port: 10001,
          startScript: 'start:rollup',
          startedRegex: /created .+ in (.+)ms/,
          buildScript: 'build:rollup',
          binFilePath: 'rollup/dist/bin/rollup',
        }),
      );
      break;
    case 'rolldown':
      buildTools.push(
        new BuildTool({
          name: 'Rolldown ' + require('rolldown/package.json').version,
          port: 5173,
          startScript: 'start:rolldown',
          startedRegex: /Finished in (\d+) (s|ms)/,
          buildScript: 'build:rolldown',
          binFilePath: 'rolldown/bin/cli.mjs',
        }),
      );
      break;
    case 'webpack':
      buildTools.push(
        new BuildTool({
          name: 'webpack ' + require('webpack/package.json').version,
          port: 8080,
          startScript: 'start:webpack',
          startedRegex: /compiled .+ in (.+) (s|ms)/,
          buildScript: 'build:webpack',
          binFilePath: 'webpack-cli/bin/cli.js',
        }),
      );
      break;
    case 'esbuild':
      buildTools.push(
        new BuildTool({
          name: 'esbuild ' + require('esbuild/package.json').version,
          port: 8080,
          startScript: 'start:esbuild',
          startedRegex: /esbuild built in (\d+) ms/,
          buildScript: 'build:esbuild',
          binFilePath: 'esbuild/lib/main.js',
        }),
      );
      break;
    case 'parcel':
      buildTools.push(
        new BuildTool({
          name: 'Parcel ' + require('parcel/package.json').version,
          port: 3200,
          startScript: 'start:parcel',
          startedRegex: /Built in (.+)(s|ms)/,
          buildScript: 'build:parcel',
          binFilePath: 'parcel/lib/bin.js',
        }),
      );
      break;
    case 'farm':
      buildTools.push(
        new BuildTool({
          name: 'Farm ' + require('@farmfe/core/package.json').version,
          port: 9000,
          startScript: 'start:farm',
          startedRegex: /Local:\s+http:\/\/localhost:9000/,
          buildScript: 'build:farm',
          binFilePath: '@farmfe/cli/bin/farm.mjs',
        }),
      );
      break;
    case 'utoo':
      buildTools.push(
        new BuildTool({
          name: 'Utoo ' + require('@utoo/pack-cli/package.json').version,
          port: 3000,
          startScript: 'start:utoo',
          startedRegex: /Local:\s+http:\/\/localhost:(\d+)/,
          buildScript: 'build:utoo',
          binFilePath: '@utoo/pack-cli/bin/run.js',
        }),
      );
      break;
  }
});

const memorySampler = await createMemorySampler();
const activeCommands = new Set<Command>();
const resultDirectory = path.resolve(
  process.env.RESULTS_DIR ?? path.join('results', `${caseName}-${Date.now()}`),
);
mkdirSync(resultDirectory, { recursive: true });
const { WARMUP_TIMES, RUN_TIMES } = process.env;
const warmupTimes = WARMUP_TIMES ? Number(WARMUP_TIMES) : 2;
const runTimes = RUN_TIMES ? Number(RUN_TIMES) : 3;
if (
  !Number.isInteger(warmupTimes) ||
  warmupTimes < 0 ||
  !Number.isInteger(runTimes) ||
  runTimes < 1
) {
  throw new Error('WARMUP_TIMES must be >= 0 and RUN_TIMES must be >= 1');
}
let iteration = 0;
const metadata = {
  case: caseName,
  memoryKind,
  sampleIntervalMs,
  steadyIdleMs,
  steadyWindowMs,
  hmrUpdates: 10,
  warmupTimes,
  runTimes,
  node: process.version,
  platform: process.platform,
  release: os.release(),
  arch: process.arch,
  cpus: os.cpus().length,
  cpuModel: os.cpus()[0]?.model,
  totalMemory: os.totalmem(),
};
writeFileSync(
  path.join(resultDirectory, 'environment.json'),
  JSON.stringify(metadata, null, 2),
);
logger.info(
  `Memory: process-tree ${memoryKind}; raw results: ${resultDirectory}`,
);

function saveMemory(
  tool: string,
  phase: string,
  command: Command,
  details: object = {},
) {
  const filename = `${iteration}-${tool.replace(/[^a-zA-Z0-9.-]/g, '_')}-${phase}.json`;
  writeFileSync(
    path.join(resultDirectory, filename),
    JSON.stringify({
      tool,
      phase,
      iteration,
      warmup: iteration < warmupTimes,
      memoryKind,
      ...details,
      samples: command.memory.samples,
    }),
  );
}

async function stopCommand(command: Command) {
  try {
    await command.memory.stop();
  } finally {
    const rootPid = command.child.pid!;
    const signal = async (name: NodeJS.Signals) => {
      // Enumerate live processes again instead of signalling an already-empty
      // process group (which can report EPERM on macOS after shutdown).
      const processes = await memorySampler.snapshot(rootPid);
      for (const { pid } of processes.reverse()) {
        try {
          process.kill(pid, name);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
        }
      }
    };
    await signal('SIGTERM');
    // Wait for actual shutdown so the next tool cannot overlap with this one.
    for (let i = 0; i < 20; i++) {
      if (!(await memorySampler.snapshot(rootPid)).length) break;
      await sleep(50);
    }
    await signal('SIGKILL');
    activeCommands.delete(command);
  }
}

const browser: Browser = await puppeteer.launch();
let perfResults: PerfResultMap[] = [];
const sizeResults: Partial<Record<string, FileSizes>> = {};
try {
  for (; iteration < warmupTimes + runTimes; iteration++) await benchAllCases();
} finally {
  await browser.close();
  try {
    for (const command of activeCommands) await stopCommand(command);
  } finally {
    await memorySampler.close();
  }
}

async function runDevBenchmark(
  buildTool: BuildTool,
  perfResult: PerfResultMap,
): Promise<void> {
  buildTool.cleanCache();
  await runDevSession(buildTool, perfResult, 'cold');
  await coolDown();
  await runDevSession(buildTool, perfResult, 'warm');
  await coolDown();
}

async function runDevSession(
  buildTool: BuildTool,
  perfResult: PerfResultMap,
  cache: 'cold' | 'warm',
) {
  const metrics = ensureMetrics(perfResult, buildTool.name);
  const { rootFile, leafFile } = config;
  if (!rootFile || !leafFile)
    throw new Error('Dev benchmarks require rootFile and leafFile');
  const files = [rootFile, leafFile].map((file) => path.join(srcDir, file));
  const originals = files.map((file) => readFileSync(file, 'utf8'));
  const { time, command } = await buildTool.startServer();
  const page: Page = await browser.newPage();
  let details: object = { succeeded: false };
  try {
    const start = Date.now();
    await page.goto(`http://localhost:${buildTool.port}`, { timeout: 60000 });
    await page.waitForSelector('#root > *', { timeout: 60000 });
    metrics[cache === 'cold' ? 'devColdStart' : 'devHotStart'] =
      time + Date.now() - start;
    // Load the benchmark's / route, without visiting its other lazy routes.
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 60000 });
    let navigated = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) navigated = true;
    });
    const hmrTimes: number[] = [];
    for (let update = 0; update < 10; update++) {
      const fileIndex = update % 2;
      const marker = `benchmark-hmr-${cache}-${update}`;
      const started = Date.now();
      const updated = new Promise<number>((resolve, reject) => {
        const onConsole = (event: ConsoleMessage) => {
          const [name, timestamp] = event.text().split(' ');
          if (name !== marker) return;
          clearTimeout(timeout);
          page.off('console', onConsole);
          resolve(Number(timestamp) - started);
        };
        const timeout = setTimeout(() => {
          page.off('console', onConsole);
          reject(new Error(`${buildTool.name} HMR timed out (${marker})`));
        }, 60000);
        page.on('console', onConsole);
      });
      writeFileSync(
        files[fileIndex],
        `${originals[fileIndex]}\nconsole.log(${JSON.stringify(marker)}, Date.now());\n`,
      );
      hmrTimes.push(await updated);
      if (navigated)
        throw new Error(`${buildTool.name} reloaded the page during HMR`);
      await page.waitForNetworkIdle({ idleTime: 500, timeout: 60000 });
    }
    if (cache === 'cold') {
      metrics.rootHmr = median(hmrTimes.filter((_, index) => index % 2 === 0));
      metrics.leafHmr = median(hmrTimes.filter((_, index) => index % 2 === 1));
      metrics.hmr = (metrics.rootHmr + metrics.leafHmr) / 2;
    }
    const steady = await command.memory.steady();
    const peak = await command.memory.stop();
    metrics[cache === 'cold' ? 'devColdSteady' : 'devHotSteady'] =
      steady.bytes / 1024 ** 2;
    metrics[cache === 'cold' ? 'devColdPeak' : 'devHotPeak'] = peak / 1024 ** 2;
    details = { succeeded: true, steady, hmrTimes };
    logger.success(
      `${buildTool.name} dev (${cache}): steady ${(steady.bytes / 1024 ** 2).toFixed(1)} MiB, peak ${(peak / 1024 ** 2).toFixed(1)} MiB`,
    );
  } finally {
    try {
      await stopCommand(command);
    } finally {
      // Restore only after sampling and shutdown, so restoration cannot trigger
      // an extra compilation in the memory observation window.
      files.forEach((file, index) => writeFileSync(file, originals[index]));
      saveMemory(buildTool.name, `dev-${cache}`, command, details);
      await page.close();
    }
  }
}

async function runBuildBenchmark(
  buildTool: BuildTool,
  perfResult: PerfResultMap,
): Promise<void> {
  const metrics = ensureMetrics(perfResult, buildTool.name);
  buildTool.cleanCache();
  // Clean up dist dir
  await fse.remove(distDir);

  const { time: buildTime, peak } = await buildTool.build('cold');
  metrics.buildColdPeak = peak;

  const sizes = sizeResults[buildTool.name] ?? (await getFileSizes(distDir));
  sizeResults[buildTool.name] = sizes;

  logger.success(
    color.dim(buildTool.name) + ' built in ' + color.green(buildTime + 'ms'),
  );
  logger.success(
    color.dim(buildTool.name) +
      ' output size: ' +
      color.green(sizes.outputSize + 'kB'),
  );
  logger.success(
    color.dim(buildTool.name) +
      ' gzipped size: ' +
      color.green(sizes.gzippedSize + 'kB'),
  );

  metrics.prodBuild = buildTime;

  await coolDown();

  await runHotBuildBenchmark(buildTool, perfResult);
}

async function runHotBuildBenchmark(
  buildTool: BuildTool,
  perfResult: PerfResultMap,
): Promise<void> {
  const metrics = ensureMetrics(perfResult, buildTool.name);
  // Clean up dist dir
  await fse.remove(distDir);

  const { time: buildTime, peak } = await buildTool.build('warm');
  metrics.buildHotPeak = peak;

  logger.success(
    color.dim(buildTool.name) +
      ' built with cache in ' +
      color.green(buildTime + 'ms'),
  );

  metrics.prodHotBuild = buildTime;

  await coolDown();
}

async function benchAllCases(): Promise<void> {
  const perfResult: PerfResultMap = {};
  // Shuffle the build tools to avoid the cache effect
  const shuffledBuildTools = shuffleArray([...buildTools]);

  for (const buildTool of shuffledBuildTools) {
    ensureMetrics(perfResult, buildTool.name);
    if (runDev) {
      await runDevBenchmark(buildTool, perfResult);
    }
    await runBuildBenchmark(buildTool, perfResult);
  }

  perfResults.push(perfResult);
  writeFileSync(
    path.join(resultDirectory, 'runs.json'),
    JSON.stringify(perfResults, null, 2),
  );
}

// Report medians and ranges across measured runs; preserve each raw run.
const measuredResults = perfResults.slice(warmupTimes);
const summaries: Record<
  string,
  Partial<
    Record<NumericPerfMetricKey, { median: number; min: number; max: number }>
  > &
    FileSizes
> = {};
for (const tool of buildTools) {
  const summary = { ...sizeResults[tool.name] } as (typeof summaries)[string];
  const keys = Object.keys(
    measuredResults[0][tool.name]!,
  ) as NumericPerfMetricKey[];
  for (const key of keys) {
    const values = measuredResults.map((result) => result[tool.name]![key]!);
    summary[key] = {
      median: median(values),
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }
  summaries[tool.name] = summary;
}
writeFileSync(
  path.join(resultDirectory, 'summary.json'),
  JSON.stringify({ ...metadata, tools: summaries }, null, 2),
);

logger.log('');
logger.success('Benchmark finished!\n');

const getData = function (
  fieldName: keyof PerfMetrics,
  unit: string,
): string[] | null {
  const dataset = buildTools.map(({ name }) => summaries[name]?.[fieldName]);
  if (dataset.some((item) => item === undefined)) return null;
  const normalized = dataset.map((item) => {
    if (typeof item === 'string') return `${item}${unit}`;
    const { median: value, min, max } = item!;
    const format = (n: number) =>
      unit === 'MiB' ? n.toFixed(1) : String(Math.round(n));
    return unit === 'MiB'
      ? `${format(value)} ${unit} (${format(min)}–${format(max)})`
      : `${format(value)}${unit}`;
  });
  addRankingEmojis(normalized);
  return normalized;
};

const buildMarkdownTable = (columns: Column[]): string => {
  const columnsWithData = columns
    .map(({ title, data }) => (data ? [title, ...data] : null))
    .filter((item): item is string[] => item !== null);

  if (columnsWithData.length === 0) {
    throw new Error('No benchmark data available to render.');
  }

  const rows = Array.from({ length: columnsWithData[0].length }, (_, index) =>
    columnsWithData.map((item) => item[index]),
  );

  return markdownTable(rows);
};

const nameColumn: Column = {
  title: 'Name',
  data: buildTools.map(({ name }) => name),
};

const columnGroups: { label: string; columns: Column[] }[] = [];

if (runDev) {
  columnGroups.push({
    label: 'Development metrics',
    columns: [
      nameColumn,
      {
        title: 'Startup (no cache)',
        data: getData('devColdStart', 'ms'),
      },
      {
        title: 'Startup (with cache)',
        data: getData('devHotStart', 'ms'),
      },
      { title: 'HMR', data: getData('hmr', 'ms') },
      {
        title: 'Memory steady (no cache)',
        data: getData('devColdSteady', 'MiB'),
      },
      { title: 'Memory peak (no cache)', data: getData('devColdPeak', 'MiB') },
      {
        title: 'Memory steady (with cache)',
        data: getData('devHotSteady', 'MiB'),
      },
      { title: 'Memory peak (with cache)', data: getData('devHotPeak', 'MiB') },
    ],
  });
}

columnGroups.push({
  label: 'Build metrics',
  columns: [
    nameColumn,
    { title: 'Build (no cache)', data: getData('prodBuild', 'ms') },
    { title: 'Build (with cache)', data: getData('prodHotBuild', 'ms') },
    {
      title: 'Memory peak (no cache)',
      data: getData('buildColdPeak', 'MiB'),
    },
    { title: 'Memory peak (with cache)', data: getData('buildHotPeak', 'MiB') },
    { title: 'Output size', data: getData('outputSize', 'kB') },
    {
      title: 'Gzipped size',
      data: getData('gzippedSize', 'kB'),
    },
  ],
});

let markdown = `Memory: process-tree ${memoryKind}, MiB; median (min–max), natural GC.\n\n`;
for (const { label, columns } of columnGroups) {
  logger.log(`${label}:\n`);
  const table = buildMarkdownTable(columns);
  console.log(`${table}\n`);
  markdown += `### ${label}\n\n${table}\n\n`;
}

writeFileSync(path.join(resultDirectory, 'summary.md'), markdown);
