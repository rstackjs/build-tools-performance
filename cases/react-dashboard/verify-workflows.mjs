import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

export async function verifyWorkspaces(page, base) {
  const navigate = async (feature) => {
    await page.evaluate((feature) => {
      [...document.querySelectorAll('nav a')]
        .find((link) => new URL(link.href).pathname === `/${feature}`)
        .click();
    }, feature);
    await page.waitForSelector(`[data-feature="${feature}"]`);
  };
  await navigate('approvals');
  const request = '[data-request="approvals-1"]';
  assert.equal(
    await page.$eval(
      `${request} [data-action="APPROVE"]`,
      (button) => button.disabled,
    ),
    true,
  );
  for (const [action, state] of [
    ['SUBMIT', 'review'],
    ['REJECT', 'rejected'],
    ['REVISE', 'draft'],
    ['SUBMIT', 'review'],
    ['APPROVE', 'approved'],
  ]) {
    await page.click(`${request} [data-action="${action}"]`);
    await page.waitForFunction(
      (request, state) =>
        document.querySelector(`${request} [data-testid="approval-state"]`)
          .textContent === state,
      {},
      request,
      state,
    );
  }
  assert.equal(
    await page.$eval(
      `${request} [data-action="SUBMIT"]`,
      (button) => button.disabled,
    ),
    true,
  );
  await navigate('audit');
  await page.select('[aria-label="Filter activity"]', 'approvals');
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="activity-feed"]')
      .textContent.includes('Annual software renewal: approved'),
  );
  assert.ok(
    !(
      await page.$eval(
        '[data-testid="activity-feed"]',
        (element) => element.textContent,
      )
    ).includes('January account data reconciled'),
  );

  await navigate('reports');
  await page.waitForSelector('[data-report-ready="true"]');
  const setInput = async (selector, value) => {
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type(selector, value);
  };
  await setInput('[aria-label="Minimum revenue"]', '7000');
  const count = Number(
    (
      await page.$eval(
        '[data-testid="report-total"]',
        (element) => element.textContent,
      )
    ).split(' ')[0],
  );
  assert.ok(count > 0 && count < 200, 'Report filter did not narrow accounts');
  assert.match(
    await page.$eval(
      '[data-testid="csv-preview"]',
      (element) => element.textContent,
    ),
    /^"Account","Revenue","Updated"/,
  );
  const link = await page.$eval('[data-testid="report-link"]', (element) =>
    element.getAttribute('href'),
  );
  assert.equal(link, '/reports?minimumRevenue=7000');

  const directory = mkdtempSync(path.join(tmpdir(), 'dashboard-export-'));
  const session = await page.createCDPSession();
  try {
    await session.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: directory,
    });
    await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .find((button) => button.textContent === 'Download CSV')
        .click(),
    );
    const file = path.join(directory, 'accounts.csv');
    const until = Date.now() + 10000;
    while (!existsSync(file) && Date.now() < until) await delay(50);
    assert.ok(existsSync(file), 'CSV download did not complete');
    const csv = readFileSync(file, 'utf8');
    assert.equal(
      csv.split('\r\n').length,
      count + 1,
      'CSV row count differs from the filtered report',
    );
    assert.match(csv, /^"Account","Revenue","Updated"/);
  } finally {
    await session.detach();
    rmSync(directory, { recursive: true, force: true });
  }
  await setInput('[aria-label="Report name"]', 'Enterprise accounts');
  await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .find((button) => button.textContent === 'Save report')
      .click(),
  );
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="report-status"]').textContent ===
      'Saved report: Enterprise accounts',
  );
  await page.click('[role="tab"]:nth-child(2)');
  await page.waitForSelector('[aria-label="Load Enterprise accounts"]');
  await page.reload();
  await page.waitForSelector('[data-report-ready="true"]');
  await page.click('[role="tab"]:nth-child(2)');
  await page.waitForSelector('[aria-label="Load Enterprise accounts"]');
  await page.click('[aria-label="Load Enterprise accounts"]');
  await page.click('[role="tab"]:nth-child(1)');
  assert.equal(
    await page.$eval('[aria-label="Minimum revenue"]', (input) => input.value),
    '7000',
  );
  await page.goto(base + link);
  await page.waitForSelector('[data-report-ready="true"]');
  assert.equal(
    await page.$eval('[aria-label="Minimum revenue"]', (input) => input.value),
    '7000',
    'Shared report URL did not restore the filter',
  );
  await page.click('[role="tab"]:nth-child(2)');
  await page.click('[aria-label="Delete Enterprise accounts"]');
  await page.waitForFunction(
    () => !document.querySelector('[aria-label="Load Enterprise accounts"]'),
  );
  await page.select('[aria-label="Interface language"]', 'zh');
  await page.waitForFunction(
    () =>
      document.querySelector('aside').textContent.includes('工作空间') &&
      document
        .querySelector('[data-report-ready]')
        .textContent.includes('报表工作台'),
  );
  await page.select('[aria-label="Interface language"]', 'en');
  await page.waitForFunction(() =>
    document
      .querySelector('[data-report-ready]')
      .textContent.includes('Report studio'),
  );
}
