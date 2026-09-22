import { spawn, type ChildProcess } from 'node:child_process';
import os from 'node:os';
import {
  monitorProcess,
  RetryableError,
  runPhase,
  runWithRetry,
} from './benchmark-runtime.ts';
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
  timeouts?: Partial<typeof defaultTimeouts>;
};

type MemoryMonitor = ReturnType<
  Awaited<ReturnType<typeof createMemorySampler>>['start']
>;
type Measurement = 'timing' | 'memory';
type Command = {
  child: ChildProcess;
  measurement: Measurement;
  memory?: MemoryMonitor;
  monitor: ReturnType<typeof monitorProcess>;
  started: number;
  phase?: string;
  phaseElapsedMs?: number;
  error?: string;
  browserLog: string;
  attempt: number;
};
type DevServerResult = { time: number; command: Command };
type BuildResult = { time: number; peak?: number };

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
const defaultTimeouts = {
  startup: 60000,
  page: 60000,
  hmr: 60000,
  build: 180000,
  shutdown: 10000,
};

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
const timeouts = { ...defaultTimeouts, ...config.timeouts };
for (const [phase, value] of Object.entries(timeouts)) {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`Invalid ${phase} timeout: ${value}`);
}

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
    [monorepoRoot, caseDir].forEach((dir) => {
      for (const cache of [
        '.parcel-cache',
        'node_modules/.cache',
        'node_modules/.vite',
        'node_modules/.farm',
        '.turbopack',
      ]) {
        fse.removeSync(path.join(dir, cache));
      }
    });
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

  private launch(script: string, measurement: Measurement): Command {
    const child = spawn(process.execPath, ['--run', script], {
      cwd: caseDir,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1' },
    });
    const command: Command = {
      monitor: monitorProcess(child),
      started: Date.now(),
      browserLog: '',
      attempt: currentAttempt,
      child,
      measurement,
      memory:
        measurement === 'memory' && child.pid
          ? memorySampler.start(child.pid)
          : undefined,
    };
    activeCommands.add(command);
    child.stderr!.on('data', (data: Buffer) => logger.log(`stderr: ${data}`));
    if (process.env.DEBUG)
      child.stdout!.on('data', (data: Buffer) => console.log(data.toString()));
    return command;
  }

  async startServer(
    measurement: Measurement,
    cache: 'cold' | 'warm',
  ): Promise<DevServerResult> {
    logger.start(`Running start command: ${this.startScript}`);
    const command = this.launch(this.startScript, measurement);
    try {
      const time = await commandPhase(
        command,
        'startup',
        timeouts.startup,
        (signal) =>
          new Promise<number>((resolve) => {
            const onData = () => {
              const output = command.monitor.output.stdout;
              const match = /Benchmark Start Time: (\d+)/.exec(output);
              this.startedRegex.lastIndex = 0;
              if (match && this.startedRegex.test(output))
                resolve(Date.now() - Number(match[1]));
            };
            command.child.stdout!.on('data', onData);
            signal.addEventListener(
              'abort',
              () => command.child.stdout!.off('data', onData),
              { once: true },
            );
          }),
        command.monitor.exited.then((exit) => {
          const ErrorType =
            exit.signal || exit.code === 0 ? RetryableError : Error;
          throw new ErrorType(
            `Server exited during startup: ${JSON.stringify(exit)}`,
          );
        }),
      );
      return { time, command };
    } catch (error) {
      await finishCommand(this.name, `dev-${cache}`, command, {
        succeeded: false,
      });
      throw error;
    }
  }

  async build(
    cache: 'cold' | 'warm',
    measurement: Measurement,
  ): Promise<BuildResult> {
    logger.start(`Running build command: ${this.buildScript}`);
    const start = Date.now();
    const command = this.launch(this.buildScript, measurement);
    let succeeded = false;
    let time: number | undefined;
    try {
      await commandPhase(command, 'build', timeouts.build, async () => {
        const exit = await command.monitor.exited;
        if (exit.error || exit.code !== 0) {
          throw new Error(`Build failed: ${JSON.stringify(exit)}`);
        }
      });
      time = Date.now() - start;
      const peak = await command.memory?.stop();
      if (command.memory && !peak)
        throw new Error('No build memory samples collected');
      succeeded = true;
      return { time, peak: peak === undefined ? undefined : peak / 1024 ** 2 };
    } catch (error) {
      command.error = String(error);
      throw error;
    } finally {
      await finishCommand(this.name, `build-${cache}`, command, {
        succeeded,
        time: measurement === 'timing' ? time : undefined,
      });
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
let currentAttempt = 1;
const attempts: {
  tool: string;
  measurement: Measurement;
  unit: string;
  iteration: number;
  attempt: number;
  succeeded: boolean;
  error?: string;
}[] = [];
const metadata = {
  case: caseName,
  memoryKind,
  sampleIntervalMs,
  steadyIdleMs,
  steadyWindowMs,
  hmrUpdates: 10,
  timeouts,
  maxAttempts: 2,
  measurements: ['timing', 'memory'],
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

function saveRun(
  tool: string,
  phase: string,
  command: Command,
  details: object = {},
) {
  const filename = `${iteration}-${tool.replace(/[^a-zA-Z0-9.-]/g, '_')}-${command.measurement}-${phase}-attempt-${command.attempt}.json`;
  writeFileSync(
    path.join(resultDirectory, filename),
    JSON.stringify({
      tool,
      phase,
      iteration,
      warmup: iteration < warmupTimes,
      measurement: command.measurement,
      memoryKind: command.memory ? memoryKind : undefined,
      ...details,
      attempt: command.attempt,
      lastPhase: command.phase,
      phaseElapsedMs: command.phaseElapsedMs,
      elapsedMs: Date.now() - command.started,
      error: command.error,
      exit: { code: command.child.exitCode, signal: command.child.signalCode },
      ...(command.error
        ? { ...command.monitor.output, browserLog: command.browserLog }
        : {}),
      samples: command.memory?.samples,
    }),
  );
}

async function commandPhase<T>(
  command: Command,
  phase: string,
  timeout: number,
  operation: (signal: AbortSignal) => Promise<T>,
  failure?: Promise<never>,
): Promise<T> {
  command.phase = phase;
  const started = Date.now();
  try {
    return await runPhase(phase, timeout, operation, failure);
  } catch (error) {
    command.error = `${phase}: ${String(error)}`;
    throw error;
  } finally {
    command.phaseElapsedMs = Date.now() - started;
  }
}

async function finishCommand(
  tool: string,
  phase: string,
  command: Command,
  details: { succeeded: boolean; [key: string]: unknown },
) {
  const hadError = Boolean(command.error);
  try {
    await stopCommand(command);
  } catch (error) {
    command.error = [command.error, `cleanup: ${String(error)}`]
      .filter(Boolean)
      .join('\n');
    details = { ...details, succeeded: false };
    // Preserve the original failure after a successful forced cleanup.
    if (!hadError || !(error instanceof RetryableError)) throw error;
  } finally {
    saveRun(tool, phase, command, details);
  }
}

async function stopCommand(command: Command) {
  try {
    await command.memory?.stop();
  } finally {
    const rootPid = command.child.pid;
    if (!rootPid) {
      activeCommands.delete(command);
      return;
    }
    const signal = async (name: NodeJS.Signals) => {
      const processes = await memorySampler.snapshot(rootPid);
      for (const { pid } of processes.reverse()) {
        try {
          process.kill(pid, name);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
        }
      }
    };
    const waitForExit = async (timeout: number) => {
      const deadline = Date.now() + timeout;
      do {
        if (!(await memorySampler.snapshot(rootPid)).length) return true;
        await sleep(50);
      } while (Date.now() < deadline);
      return false;
    };
    await signal('SIGTERM');
    if (await waitForExit(timeouts.shutdown)) {
      activeCommands.delete(command);
    } else {
      await signal('SIGKILL');
      if (!(await waitForExit(5000)))
        throw new Error(`Command ${rootPid} survived SIGKILL`);
      activeCommands.delete(command);
      // Discard the entire cold/warm pair: the cache may not have been flushed.
      throw new RetryableError(`Command ${rootPid} required SIGKILL`);
    }
  }
}

let browser: Browser = await puppeteer.launch();

async function closeBrowser() {
  const child = browser.process();
  const exited = child && monitorProcess(child).exited;
  try {
    await runPhase('browser shutdown', timeouts.shutdown, () =>
      browser.close(),
    );
  } catch (error) {
    if (!child) throw error;
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
      await runPhase('browser exit', 5000, () => exited!);
    }
  }
}

let perfResults: PerfResultMap[] = [];
const sizeResults: Partial<Record<string, FileSizes>> = {};
try {
  for (; iteration < warmupTimes + runTimes; iteration++) await benchAllCases();
} finally {
  try {
    await closeBrowser();
  } finally {
    try {
      const cleanup = await Promise.allSettled(
        [...activeCommands].map(stopCommand),
      );
      const failed = cleanup.find((result) => result.status === 'rejected');
      if (failed?.status === 'rejected') throw failed.reason;
    } finally {
      await memorySampler.close();
    }
  }
}

async function runDevBenchmark(
  buildTool: BuildTool,
  perfResult: PerfResultMap,
  measurement: Measurement,
): Promise<void> {
  const { rootFile, leafFile } = config;
  if (!rootFile || !leafFile)
    throw new Error('Dev benchmarks require rootFile and leafFile');
  const files = [rootFile, leafFile].map((file, index) => {
    const filePath = path.join(srcDir, file);
    const original = readFileSync(filePath, 'utf8');
    const marker = `benchmark-restored-${index}`;
    return {
      path: filePath,
      original,
      marker,
      // The same baseline is used for cold compilation, restoration, and warm
      // startup. Its console message acknowledges the restoration rebuild.
      baseline: `${original}\nconsole.log(${JSON.stringify(marker)}, Date.now());\n`,
    };
  });
  try {
    files.forEach((file) => writeFileSync(file.path, file.baseline));
    buildTool.cleanCache();
    await fse.remove(distDir);
    if (!browser.connected) browser = await puppeteer.launch();
    await runDevSession(buildTool, perfResult, 'cold', measurement, files);
    await coolDown();
    await runDevSession(buildTool, perfResult, 'warm', measurement, files);
    await coolDown();
  } finally {
    files.forEach((file) => writeFileSync(file.path, file.original));
  }
}

async function runDevSession(
  buildTool: BuildTool,
  perfResult: PerfResultMap,
  cache: 'cold' | 'warm',
  measurement: Measurement,
  files: { path: string; baseline: string; marker: string }[],
) {
  const metrics = ensureMetrics(perfResult, buildTool.name);
  const { time, command } = await buildTool.startServer(measurement, cache);
  let page: Page | undefined;
  let details = { succeeded: false } as {
    succeeded: boolean;
    steady?: object;
    startupTime?: number;
    hmrTimes?: number[];
  };
  let onDisconnected: () => void;
  const failure = Promise.race([
    command.monitor.exited.then((exit) => {
      throw new RetryableError(`Dev server exited: ${JSON.stringify(exit)}`);
    }),
    new Promise<never>((_, reject) => {
      onDisconnected = () => reject(new RetryableError('Browser disconnected'));
      browser.once('disconnected', onDisconnected);
      if (!browser.connected) onDisconnected();
    }),
  ]);
  // Keep the persistent exit watcher handled between phases as well.
  void failure.catch(() => {});
  const phase = <T>(
    name: string,
    timeout: number,
    operation: (signal: AbortSignal) => Promise<T>,
  ) => commandPhase(command, name, timeout, operation, failure);
  try {
    const sessionPage = await phase(
      'new page',
      timeouts.page,
      async (signal) => {
        const created = await browser.newPage();
        if (signal.aborted) {
          await created.close();
          signal.throwIfAborted();
        }
        return created;
      },
    );
    page = sessionPage;
    const logBrowser = (message: string) => {
      command.browserLog = (command.browserLog + message + '\n').slice(-65536);
    };
    page.on('console', (event) =>
      logBrowser(`${event.type()}: ${event.text()}`),
    );
    page.on('pageerror', (error) => logBrowser(`pageerror: ${String(error)}`));
    page.on('error', (error) => logBrowser(`error: ${String(error)}`));
    const start = Date.now();
    await phase('page load', timeouts.page, async (signal) => {
      await sessionPage.goto(`http://localhost:${buildTool.port}`, {
        timeout: 0,
      });
      signal.throwIfAborted();
      await sessionPage.waitForSelector('#root > *', { timeout: 0, signal });
    });
    const startupTime = time + Date.now() - start;
    if (measurement === 'timing')
      metrics[cache === 'cold' ? 'devColdStart' : 'devHotStart'] = startupTime;
    // Load the benchmark's / route, without visiting its other lazy routes.
    const idle = () =>
      phase('network idle', timeouts.page, (signal) =>
        sessionPage.waitForNetworkIdle({ idleTime: 500, timeout: 0, signal }),
      );
    await idle();
    let navigated = false;
    page.on('framenavigated', (frame) => {
      if (frame === sessionPage.mainFrame()) navigated = true;
    });
    const updateModule = async (
      file: string,
      content: string,
      marker: string,
    ) => {
      const started = Date.now();
      const duration = await phase(
        `HMR (${marker})`,
        timeouts.hmr,
        (signal) =>
          new Promise<number>((resolve) => {
            const onConsole = (event: ConsoleMessage) => {
              const [name, timestamp] = event.text().split(' ');
              if (name === marker && Number(timestamp) >= started)
                resolve(Number(timestamp) - started);
            };
            sessionPage.on('console', onConsole);
            signal.addEventListener(
              'abort',
              () => sessionPage.off('console', onConsole),
              { once: true },
            );
            writeFileSync(file, content);
          }),
      );
      if (navigated)
        throw new Error(`${buildTool.name} reloaded the page during HMR`);
      await idle();
      return duration;
    };
    const hmrTimes: number[] = [];
    for (let update = 0; update < 10; update++) {
      const file = files[update % 2];
      const marker = `benchmark-hmr-${cache}-${update}`;
      hmrTimes.push(
        await updateModule(
          file.path,
          `${file.baseline}\nconsole.log(${JSON.stringify(marker)}, Date.now());\n`,
          marker,
        ),
      );
    }
    if (measurement === 'timing' && cache === 'cold') {
      metrics.rootHmr = median(hmrTimes.filter((_, index) => index % 2 === 0));
      metrics.leafHmr = median(hmrTimes.filter((_, index) => index % 2 === 1));
      metrics.hmr = (metrics.rootHmr + metrics.leafHmr) / 2;
    }
    if (command.memory) {
      const steady = await phase('steady memory', timeouts.page, () =>
        command.memory!.steady(),
      );
      const peak = await command.memory.stop();
      metrics[cache === 'cold' ? 'devColdSteady' : 'devHotSteady'] =
        steady.bytes / 1024 ** 2;
      metrics[cache === 'cold' ? 'devColdPeak' : 'devHotPeak'] =
        peak / 1024 ** 2;
      details = { succeeded: false, steady };
      logger.success(
        `${buildTool.name} dev (${cache}, memory): steady ${(steady.bytes / 1024 ** 2).toFixed(1)} MiB, peak ${(peak / 1024 ** 2).toFixed(1)} MiB`,
      );
    } else {
      details = { succeeded: false, startupTime, hmrTimes };
      logger.success(
        `${buildTool.name} dev (${cache}, timing): ${startupTime}ms`,
      );
    }
    // Measurement is over. Restore the exact baseline while the server is
    // alive, await each rebuild, then let graceful shutdown flush the cache.
    for (const file of files)
      await updateModule(file.path, file.baseline, file.marker);
    details = { ...details, succeeded: true };
  } catch (error) {
    command.error ??= String(error);
    if (!browser.connected && !(error instanceof RetryableError))
      throw new RetryableError(`Browser disconnected: ${String(error)}`);
    throw error;
  } finally {
    browser.off('disconnected', onDisconnected!);
    try {
      if (browser.connected && page && !page.isClosed()) {
        await runPhase('page shutdown', timeouts.shutdown, () => page!.close());
      }
      // Cancel a pending newPage() before retrying a failed page creation.
      if (!page || !browser.connected) await closeBrowser();
    } catch (error) {
      await closeBrowser();
      if (!command.error) {
        command.error = `Page cleanup failed: ${String(error)}`;
        details.succeeded = false;
        throw new RetryableError(command.error);
      }
    } finally {
      await finishCommand(buildTool.name, `dev-${cache}`, command, details);
    }
  }
}

async function runBuildBenchmark(
  buildTool: BuildTool,
  perfResult: PerfResultMap,
  measurement: Measurement,
): Promise<void> {
  const metrics = ensureMetrics(perfResult, buildTool.name);
  buildTool.cleanCache();
  // Clean up dist dir
  await fse.remove(distDir);

  const { time: buildTime, peak } = await buildTool.build('cold', measurement);
  if (measurement === 'memory') metrics.buildColdPeak = peak!;

  const sizes = sizeResults[buildTool.name] ?? (await getFileSizes(distDir));

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

  if (measurement === 'timing') metrics.prodBuild = buildTime;

  await coolDown();

  await runHotBuildBenchmark(buildTool, perfResult, measurement);
  sizeResults[buildTool.name] = sizes;
}

async function runHotBuildBenchmark(
  buildTool: BuildTool,
  perfResult: PerfResultMap,
  measurement: Measurement,
): Promise<void> {
  const metrics = ensureMetrics(perfResult, buildTool.name);
  // Clean up dist dir
  await fse.remove(distDir);

  const { time: buildTime, peak } = await buildTool.build('warm', measurement);
  if (measurement === 'memory') metrics.buildHotPeak = peak!;

  logger.success(
    color.dim(buildTool.name) +
      ' built with cache in ' +
      color.green(buildTime + 'ms'),
  );

  if (measurement === 'timing') metrics.prodHotBuild = buildTime;

  await coolDown();
}

async function benchAllCases(): Promise<void> {
  const perfResult: PerfResultMap = {};
  // Shuffle the build tools to avoid the cache effect
  const shuffledBuildTools = shuffleArray([...buildTools]);

  for (const buildTool of shuffledBuildTools) {
    ensureMetrics(perfResult, buildTool.name);
    for (const measurement of ['timing', 'memory'] as const) {
      logger.info(`${buildTool.name}: ${measurement} pass`);
      for (const unit of runDev ? ['dev', 'build'] : ['build']) {
        const context = { tool: buildTool.name, measurement, unit, iteration };
        const persistAttempts = () =>
          writeFileSync(
            path.join(resultDirectory, 'attempts.json'),
            JSON.stringify(attempts, null, 2),
          );
        const result = await runWithRetry(
          async (attempt) => {
            currentAttempt = attempt;
            const pending: PerfResultMap = {};
            if (attempt > 1) await coolDown();
            if (unit === 'dev')
              await runDevBenchmark(buildTool, pending, measurement);
            else await runBuildBenchmark(buildTool, pending, measurement);
            attempts.push({ ...context, attempt, succeeded: true });
            persistAttempts();
            if (attempt > 1)
              logger.warn(
                `${buildTool.name} ${measurement} ${unit}: recovered after retry`,
              );
            return pending;
          },
          (error, attempt, willRetry) => {
            attempts.push({
              ...context,
              attempt,
              succeeded: false,
              error: String(error),
            });
            persistAttempts();
            logger.warn(
              `${buildTool.name} ${measurement} ${unit} attempt ${attempt} failed: ${String(error)}${willRetry ? '; retrying cold/warm pair' : ''}`,
            );
          },
        );
        Object.assign(
          ensureMetrics(perfResult, buildTool.name),
          result[buildTool.name],
        );
      }
    }
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
  JSON.stringify({ ...metadata, attempts, tools: summaries }, null, 2),
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
    const { median: value } = item!;
    return unit === 'MiB' ? value.toFixed(1) : `${Math.round(value)}${unit}`;
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
    ],
  });
}

columnGroups.push({
  label: 'Build metrics',
  columns: [
    nameColumn,
    { title: 'Build (no cache)', data: getData('prodBuild', 'ms') },
    { title: 'Build (with cache)', data: getData('prodHotBuild', 'ms') },
    { title: 'Output size', data: getData('outputSize', 'kB') },
    {
      title: 'Gzipped size',
      data: getData('gzippedSize', 'kB'),
    },
  ],
});

if (runDev) {
  columnGroups.push({
    label: 'Dev memory (MiB)',
    columns: [
      nameColumn,
      { title: 'Steady (no cache)', data: getData('devColdSteady', 'MiB') },
      { title: 'Steady (with cache)', data: getData('devHotSteady', 'MiB') },
      { title: 'Peak (no cache)', data: getData('devColdPeak', 'MiB') },
      { title: 'Peak (with cache)', data: getData('devHotPeak', 'MiB') },
    ],
  });
}

columnGroups.push({
  label: 'Build memory (MiB)',
  columns: [
    nameColumn,
    { title: 'Peak (no cache)', data: getData('buildColdPeak', 'MiB') },
    { title: 'Peak (with cache)', data: getData('buildHotPeak', 'MiB') },
  ],
});

let markdown = `Timing and memory are measured in separate passes.\n\nMemory: process-tree ${memoryKind}, MiB; median, natural GC.\n\n`;
const failures = attempts.filter((attempt) => !attempt.succeeded);
if (failures.length) {
  markdown += `### Recovered after retry\n\n${failures.length} failed attempt(s); failed attempts are excluded from metrics.\n\n`;
  for (const failure of failures)
    markdown += `- ${failure.tool}, ${failure.measurement}, ${failure.unit}, iteration ${failure.iteration}: ${failure.error}\n`;
  markdown += '\n';
}
for (const { label, columns } of columnGroups) {
  logger.log(`${label}:\n`);
  const table = buildMarkdownTable(columns);
  console.log(`${table}\n`);
  markdown += `### ${label}\n\n${table}\n\n`;
}

writeFileSync(path.join(resultDirectory, 'summary.md'), markdown);
