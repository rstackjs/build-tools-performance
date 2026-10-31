import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { parseSync } from '@swc/core';
import puppeteer from 'puppeteer';
import { ensureGenerated } from './generate.mjs';
import { features, panels } from './workload.mjs';

const root = import.meta.dirname;
const src = path.join(root, 'src');
ensureGenerated();

// Follow actual value imports, including literal dynamic imports. Type-only
// imports, declarations, CSS and assets do not contribute to the 10k minimum.
const visited = new Set();
function visit(file) {
  if (visited.has(file)) return;
  visited.add(file);
  const ast = parseSync(readFileSync(file, 'utf8'), {
    syntax: 'typescript',
    tsx: file.endsWith('.tsx'),
  });
  const follow = (specifier) => {
    if (!specifier.startsWith('.')) return;
    const base = path.resolve(path.dirname(file), specifier);
    const resolved = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}/index.ts`,
      `${base}/index.tsx`,
    ].find(
      (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
    );
    assert.ok(resolved, `Unresolved local import ${specifier} in ${file}`);
    if (/\.tsx?$/.test(resolved) && !resolved.endsWith('.d.ts'))
      visit(resolved);
  };
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (
      [
        'ImportDeclaration',
        'ExportNamedDeclaration',
        'ExportAllDeclaration',
      ].includes(node.type) &&
      !node.typeOnly &&
      node.source
    ) {
      if (
        !node.specifiers?.length ||
        node.specifiers.some((specifier) => !specifier.isTypeOnly)
      )
        follow(node.source.value);
    }
    if (node.type === 'CallExpression' && node.callee.type === 'Import') {
      const argument = node.arguments[0]?.expression;
      assert.equal(
        argument?.type,
        'StringLiteral',
        'Graph verification requires explicit dynamic import paths',
      );
      follow(argument.value);
    }
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach(walk);
      else if (child && typeof child === 'object') walk(child);
    }
  };
  walk(ast);
}
visit(path.join(src, 'index.tsx'));
const generatedModules = readdirSync(path.join(src, 'generated'), {
  recursive: true,
}).filter((file) => /\.tsx?$/.test(file));
assert.ok(
  generatedModules.length >= 10000,
  `Only ${generatedModules.length} generated modules`,
);
for (const file of generatedModules)
  assert.ok(
    visited.has(path.join(src, 'generated', file)),
    `Unreachable generated module: ${file}`,
  );
console.log(
  `Verified ${visited.size} reachable application modules (${generatedModules.length} generated), ${features.length} lazy routes, ${panels.length} panels per route.`,
);

const tool = process.argv[process.argv.indexOf('--tool') + 1];
if (!process.argv.includes('--tool')) process.exit(0);
assert.ok(
  ['rspack', 'rsbuild', 'vite', 'webpack', 'utoo'].includes(tool),
  `Unknown tool: ${tool}`,
);
const dev = process.argv.includes('--dev');
// Allocate a port independently of other applications running locally.
const probe = createServer();
await new Promise((resolve) => probe.listen(0, resolve));
const devPort = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
let output = '';
let exited = false;
const command = spawn(
  process.execPath,
  ['--run', `${dev ? 'start' : 'build'}:${tool}`],
  {
    cwd: root,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, REACT_APP_PORT: String(devPort), NO_COLOR: '1' },
  },
);
command.stdout.on('data', (data) => {
  output = (output + data).slice(-50000);
});
command.stderr.on('data', (data) => {
  output = (output + data).slice(-50000);
});
const completion = new Promise((resolve, reject) => {
  command.on('error', reject);
  command.on('exit', (code, signal) => {
    exited = true;
    resolve({ code, signal });
  });
});
let server;
let browser;
const originals = new Map();
const routeDigests = [];
const deadline = setTimeout(() => {
  console.error(output);
  try {
    process.kill(-command.pid, 'SIGKILL');
  } catch {}
}, 240000);
try {
  let port;
  if (!dev) {
    const result = await completion;
    assert.equal(result.code, 0, output);
    const dist = path.join(root, 'dist');
    assert.ok(
      !readdirSync(dist, { recursive: true }).some((file) =>
        file.endsWith('.map'),
      ),
      'Production must not emit source maps',
    );
    const mime = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.json': 'application/json',
    };
    server = createServer((request, response) => {
      const pathname = decodeURIComponent(
        new URL(request.url, 'http://localhost').pathname,
      );
      let file = path.resolve(dist, `.${pathname}`);
      if (
        !file.startsWith(dist + path.sep) ||
        !existsSync(file) ||
        !statSync(file).isFile()
      )
        file = path.join(dist, 'index.html');
      response.setHeader(
        'Content-Type',
        mime[path.extname(file)] ?? 'application/octet-stream',
      );
      response.end(readFileSync(file));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  } else {
    port = devPort;
    const until = Date.now() + 120000;
    while (true) {
      assert.ok(!exited, output);
      try {
        const response = await fetch(`http://localhost:${port}`, {
          signal: AbortSignal.timeout(1000),
        });
        if (response.ok) break;
      } catch {}
      assert.ok(Date.now() < until, `Dev server timeout\n${output}`);
      await delay(200);
    }
  }
  browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  const base = `http://${dev ? 'localhost' : '127.0.0.1'}:${port}`;
  await page.goto(base);
  await page.waitForSelector('[data-feature="overview"]');
  const styles = await page.$eval('[data-panel]', (element) => ({
    padding: getComputedStyle(element).paddingTop,
    background: getComputedStyle(element).backgroundColor,
    gap: getComputedStyle(element.parentElement).gap,
  }));
  assert.equal(styles.padding, '20px', 'Tailwind spacing did not compile');
  assert.equal(styles.gap, '20px', 'Tailwind grid styles did not compile');
  assert.equal(
    styles.background,
    'rgb(255, 255, 255)',
    'Tailwind background did not compile',
  );
  await page.waitForFunction(() => {
    const image = document.querySelector('aside img');
    return image?.complete && image.naturalWidth > 0;
  });
  await page.evaluate(() => {
    window.__verificationDocument = 'same-document';
  });
  for (const feature of features) {
    const target = feature === 'overview' ? '/' : `/${feature}`;
    await page.evaluate((target) => {
      const link = [...document.querySelectorAll('nav a')].find(
        (link) => new URL(link.href).pathname === target,
      );
      link.click();
    }, target);
    await page.waitForSelector(`[data-feature="${feature}"]`);
    assert.equal(
      await page.$$eval('[data-panel]', (nodes) => nodes.length),
      panels.length,
      feature,
    );
    assert.equal(
      await page.evaluate(() => window.__verificationDocument),
      'same-document',
      'Client navigation reloaded the page',
    );
    const content = await page.$eval('[data-feature]', (element) =>
      element.textContent.replace(/\s+/g, ' ').trim(),
    );
    routeDigests.push(createHash('sha256').update(content).digest('hex'));
  }
  console.log(`${tool}: all routes and styles checked`);
  await page.goto(`${base}/customers?page=invalid`);
  await page.waitForSelector('[data-feature="customers"]');
  assert.equal(
    await page.$eval('[data-testid="page-number"]', (el) => el.textContent),
    'Page 1',
  );
  const firstRow = () => page.$eval('tbody tr', (el) => el.textContent);
  const alphabetical = await firstRow();
  await page.select('[aria-label="Sort records"]', 'amount');
  await page.waitForFunction(
    () => new URL(location.href).searchParams.get('sort') === 'amount',
  );
  await page.waitForFunction(
    (before) => document.querySelector('tbody tr').textContent !== before,
    {},
    alphabetical,
  );
  const firstPage = await firstRow();
  await page.click('[aria-label="Next page"]');
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="page-number"]').textContent ===
      'Page 2',
  );
  assert.notEqual(
    await firstRow(),
    firstPage,
    'Pagination did not change records',
  );
  const secondPage = await firstRow();
  await page.reload();
  await page.waitForSelector('[data-feature="customers"]');
  assert.equal(
    await firstRow(),
    secondPage,
    'URL state did not survive reload',
  );
  await page.click('[aria-label="Previous page"]');
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="page-number"]').textContent ===
      'Page 1',
  );
  await page.click('input[type="checkbox"]');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('tbody tr td:nth-child(2)')].every(
      (el) => el.textContent === 'Active',
    ),
  );
  await page.type('[aria-label="Filter records"]', 'no-record-can-match-this');
  await page.waitForFunction(
    () => document.querySelectorAll('tbody tr').length === 0,
  );
  assert.equal(
    await page.$$eval('tbody tr', (nodes) => nodes.length),
    0,
    'Filtering did not update records',
  );
  await page.reload();
  await page.waitForSelector('[data-feature="customers"]');
  assert.equal(
    await page.$$eval('tbody tr', (nodes) => nodes.length),
    0,
    'Filter URL state did not survive reload',
  );
  await page.type('[aria-label="View name"]', 'x');
  await page.click('form button');
  await page.waitForFunction(() =>
    document.querySelector('[role="status"]').textContent.includes('3–40'),
  );
  await page.type('[aria-label="View name"]', 'yz');
  await page.click('form button');
  await page.waitForFunction(
    () =>
      document.querySelector('[role="status"]').textContent ===
      'Saved view: xyz',
  );
  if (dev) {
    await page.goto(base);
    await page.waitForSelector('[data-feature="overview"]');
    await page.click('[data-testid="density"]');
    await page.evaluate(() => {
      window.__verificationDocument = 'hmr-document';
    });
    for (const relative of [
      'app/Shell.tsx',
      'generated/overview/summary/Metric.tsx',
    ]) {
      const file = path.join(src, relative);
      const original = readFileSync(file, 'utf8');
      originals.set(file, original);
      const marker = `hmr-${Date.now()}`;
      writeFileSync(
        file,
        `${original}\nconsole.log('${marker}');\nwindow.__verificationHmr = '${marker}';\n`,
      );
      await page.waitForFunction(
        (marker) => window.__verificationHmr === marker,
        {},
        marker,
      );
      assert.equal(
        await page.evaluate(() => window.__verificationDocument),
        'hmr-document',
        `${relative} caused a reload`,
      );
      assert.equal(
        await page.$eval('[data-testid="density"]', (element) =>
          element.getAttribute('aria-pressed'),
        ),
        'true',
        'HMR lost React state',
      );
    }
    const cssFile = path.join(src, 'styles.css');
    originals.set(cssFile, readFileSync(cssFile, 'utf8'));
    // A class absent from the baseline checks Tailwind rescanning on TSX edits.
    const headerFile = path.join(src, 'shared/FeatureHeader.tsx');
    const header = readFileSync(headerFile, 'utf8');
    originals.set(headerFile, header);
    writeFileSync(
      headerFile,
      header.replace('mb-6 space-y-5', 'mb-6 space-y-5 min-h-[123px]'),
    );
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector('[data-feature] > header'))
          .minHeight === '123px',
    );
    writeFileSync(
      cssFile,
      originals.get(cssFile) + '\n:root { --benchmark-hmr: verified; }\n',
    );
    await page.waitForFunction(
      () =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--benchmark-hmr')
          .trim() === 'verified',
    );
    assert.equal(
      await page.evaluate(() => window.__verificationDocument),
      'hmr-document',
      'CSS update reloaded the page',
    );
  }
  assert.deepEqual(errors, [], 'Browser errors');
  if (process.argv.includes('--report')) {
    writeFileSync(
      process.argv[process.argv.indexOf('--report') + 1],
      JSON.stringify({
        modules: visited.size,
        routeDigests,
        styles,
      }),
    );
  }
  console.log(
    `${tool}: ${dev ? 'development + state-preserving root/leaf HMR + Tailwind/CSS HMR' : 'production build'} passed; all 40 routes, CSS, assets, filtering, validation, and direct navigation work.`,
  );
} catch (error) {
  console.error(output);
  throw error;
} finally {
  clearTimeout(deadline);
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  if (!exited) {
    try {
      process.kill(-command.pid, 'SIGTERM');
    } catch {}
    await Promise.race([completion, delay(5000)]);
    if (!exited) {
      try {
        process.kill(-command.pid, 'SIGKILL');
      } catch {}
    }
  }
  for (const [file, original] of originals) writeFileSync(file, original);
}
