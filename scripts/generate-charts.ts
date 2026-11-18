import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// The checked-in README tables are the source for this presentation preview.
// Regenerate after updating them; this never runs benchmarks or changes values.
const root = new URL('../', import.meta.url);
const readmePath = new URL('README.md', root);
const readme = readFileSync(readmePath, 'utf8');
const source = readme.match(/^> Data from (.+)$/m)?.[1];
if (!source) throw new Error('README benchmark provenance is missing.');
const sourceLabel = source
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/`/g, '');

const themes = {
  light: {
    background: '#f6f8fb',
    panel: '#ffffff',
    text: '#182230',
    muted: '#596779',
    line: '#dce3ec',
    ranks: ['#219e91', '#329fb7', '#4f86d5', '#7b6cc8', '#ad63ad'],
  },
  dark: {
    background: '#0d1117',
    panel: '#161b22',
    text: '#e6edf3',
    muted: '#9daab9',
    line: '#303b49',
    ranks: ['#37b8aa', '#4bb7ce', '#73a1ed', '#9d8de5', '#cb83c9'],
  },
};

function rankColor(palette: string[], rank: number, count: number): string {
  const position = ((rank - 1) / Math.max(1, count - 1)) * (palette.length - 1);
  const index = Math.floor(position);
  const fraction = position - index;
  const start = palette[index];
  const end = palette[Math.min(index + 1, palette.length - 1)];
  return (
    '#' +
    [1, 3, 5]
      .map((offset) => {
        const a = Number.parseInt(start.slice(offset, offset + 2), 16);
        const b = Number.parseInt(end.slice(offset, offset + 2), 16);
        return Math.round(a + (b - a) * fraction)
          .toString(16)
          .padStart(2, '0');
      })
      .join('')
  );
}
type Row = { name: string; values: Record<string, number> };
type Table = { title: string; rows: Row[] };
type Panel = {
  title: string;
  table: string;
  column: string;
  unit: string;
};

function cachePair(
  title: string,
  table: string,
  metric: string,
  unit: string,
): Panel[] {
  const columns = [`${metric} (no cache)`, `${metric} (with cache)`];
  return columns.map((column, index) => ({
    title: `${title} · ${index === 0 ? 'no cache' : 'with cache'}`,
    table,
    column,
    unit,
  }));
}

function singleMetric(
  title: string,
  table: string,
  column: string,
  unit: string,
): Panel {
  return { title, table, column, unit };
}
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[c]!,
  );

function parseTables(section: string): Table[] {
  return [...section.matchAll(/^([^\n]+):\n\n((?:\|[^\n]+\|\n?)+)/gm)].map(
    (match) => {
      const lines = match[2].trim().split('\n');
      const cells = (line: string) =>
        line
          .split('|')
          .slice(1, -1)
          .map((cell) => cell.trim());
      const columns = cells(lines[0]).slice(1);
      return {
        title: match[1],
        rows: lines.slice(2).map((line) => {
          const [name, ...raw] = cells(line);
          const values = Object.fromEntries(
            columns.map((column, i) => {
              const value = Number.parseFloat(raw[i]);
              if (!Number.isFinite(value) || value < 0)
                throw new Error(`Invalid value: ${name}, ${column}`);
              return [column, value];
            }),
          );
          return { name, values };
        }),
      };
    },
  );
}

function draw(
  caseName: string,
  panels: Panel[],
  tables: Table[],
  theme: keyof typeof themes,
): string {
  const t = themes[theme];
  const panelRows = Array.from(
    { length: Math.ceil(panels.length / 3) },
    (_, index) => panels.slice(index * 3, index * 3 + 3),
  );
  const width = 1040;
  const margin = 16;
  const gap = 10;
  const cardPadding = 10;
  const cardWidth = (width - margin * 2 - gap * 2) / 3;
  const rowHeight = 18;
  const rowCount = Math.max(...tables.map((table) => table.rows.length));
  const cardHeight = 40 + rowCount * rowHeight;
  const headerHeight = 64;
  const height =
    headerHeight +
    panelRows.length * cardHeight +
    (panelRows.length - 1) * gap +
    28;
  const parts: string[] = [];
  const text = (
    x: number,
    y: number,
    value: string,
    size = 11,
    fill = t.text,
    extra = '',
  ) =>
    parts.push(
      `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${escape(value)}</text>`,
    );
  parts.push(
    `<rect width="${width}" height="${height}" rx="12" fill="${t.background}"/>`,
  );
  text(
    margin,
    23,
    'BUILD TOOLS COMPARISON',
    10,
    t.muted,
    'font-weight="700" letter-spacing="1.5"',
  );
  text(margin, 49, caseName, 24, t.text, 'font-weight="700"');

  panelRows.forEach((panels, panelRow) => {
    panels.forEach((panel, panelColumn) => {
      const table = tables.find((item) => item.title === panel.table);
      if (!table) throw new Error(`Missing table: ${caseName}, ${panel.table}`);
      const x = margin + panelColumn * (cardWidth + gap);
      const y = headerHeight + panelRow * (cardHeight + gap);
      const values = table.rows.map((row) => {
        if (!(panel.column in row.values))
          throw new Error(`Missing column: ${panel.column}`);
        return row.values[panel.column];
      });
      // Fill the plot with this metric's maximum while preserving a linear zero-based scale.
      const limit = Math.max(...values) || 1;
      // Rank the displayed values; ties share a rank and skip the next place (1, 1, 3).
      const sortedValues = [...values].sort((a, b) => a - b);
      const plotX = x + 80;
      const plotWidth = cardWidth - 138;
      const top = y + 36;
      parts.push(
        `<g class="chart" data-metric="${escape(panel.column)}" data-table="${escape(panel.table)}" data-scale="${limit}">`,
      );
      parts.push(
        `<rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="8" fill="${t.panel}" stroke="${t.line}"/>`,
      );
      text(
        x + cardPadding,
        y + 21,
        `${panel.title} (${panel.unit})`,
        12,
        t.text,
        'font-weight="650"',
      );
      table.rows.forEach((row, rowIndex) => {
        const rowY = top + rowIndex * rowHeight;
        const name = row.name.replace(/\s+\d.*$/, '');
        const value = row.values[panel.column];
        const length = (value / limit) * plotWidth;
        const rank = sortedValues.indexOf(value) + 1;
        const color = rankColor(t.ranks, rank, rowCount);
        text(x + cardPadding, rowY + 9, name, 10.5);
        parts.push(
          `<rect class="bar" data-rank="${rank}" x="${plotX}" y="${rowY}" width="${length.toFixed(3)}" height="10" rx="2" fill="${color}"/>`,
        );
        const label = value.toLocaleString('en-US', {
          minimumFractionDigits: panel.unit === 'ms' ? 0 : 1,
          maximumFractionDigits: 1,
        });
        text(plotX + length + 4, rowY + 9, label, 10);
      });
      parts.push('</g>');
    });
  });
  const provenance = sourceLabel.split('. Memory uses ');
  if (provenance[1])
    text(margin, height - 12, `Memory: ${provenance[1]}`, 10, t.muted);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
<title id="title">${escape(caseName)} benchmark results</title>
<desc id="description">${escape(
    panelRows
      .flat()
      .map((panel) => `${panel.title} (${panel.unit})`)
      .join('; '),
  )}. Each chart shows one metric on its own linear scale from zero to its maximum. Lower is better. Colors indicate rank within each chart, progressing from teal through blue to violet as rank increases. Equal displayed values share a rank. Bar lengths are comparable within a chart; compare numeric values across charts. Tool order is consistent across charts. Versions and the same measurements are available in the README tables.</desc>
<g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" style="font-variant-numeric:tabular-nums">
${parts.join('\n')}
</g>
</svg>
`;
}

mkdirSync(new URL('assets/charts/', root), { recursive: true });
let count = 0;
const updated = readme.replace(
  /^### ([\w-]+)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm,
  (section: string, caseName: string) => {
    const clean = section
      .replace(
        /<!-- benchmark-chart:start -->[\s\S]*?<!-- benchmark-chart:end -->\n*/g,
        '',
      )
      .replace(/<details>\n<summary>Full benchmark data<\/summary>\n\n/g, '')
      .replace(/\n<\/details>\n/g, '\n');
    const tables = parseTables(clean);
    if (!tables.length) return section;
    const dev = tables.some((table) => table.title === 'Development metrics');
    const panelRows: Panel[][] = [];
    if (dev) {
      panelRows.push([
        ...cachePair('Startup', 'Development metrics', 'Startup', 'ms'),
        singleMetric('HMR', 'Development metrics', 'HMR', 'ms'),
      ]);
    }
    panelRows.push(
      [
        ...cachePair('Build', 'Build metrics', 'Build', 'ms'),
        singleMetric('Output size', 'Build metrics', 'Output size', 'kB'),
      ],
      [
        ...cachePair('Build peak memory', 'Build memory (MiB)', 'Peak', 'MiB'),
        singleMetric('Gzipped size', 'Build metrics', 'Gzipped size', 'kB'),
      ],
    );
    if (dev) {
      panelRows.push(
        cachePair('Dev steady memory', 'Dev memory (MiB)', 'Steady', 'MiB'),
        cachePair('Dev peak memory', 'Dev memory (MiB)', 'Peak', 'MiB'),
      );
    }
    const panels = panelRows.flat();
    // Fail if a table gains a metric without a corresponding chart panel.
    for (const table of tables) {
      const columns = panels
        .filter((panel) => panel.table === table.title)
        .map((panel) => panel.column);
      for (const row of table.rows) {
        for (const column of Object.keys(row.values)) {
          if (columns.filter((item) => item === column).length !== 1) {
            throw new Error(
              `Expected one chart for ${caseName}: ${table.title}, ${column}`,
            );
          }
        }
      }
    }
    for (const theme of ['light', 'dark'] as const) {
      writeFileSync(
        new URL(`assets/charts/${caseName}-${theme}.svg`, root),
        draw(caseName, panels, tables, theme),
      );
    }
    const first = clean.indexOf(`${tables[0].title}:\n`);
    const lastTable = [...clean.matchAll(/^\|[^\n]+\|$/gm)].at(-1)!;
    const end = lastTable.index! + lastTable[0].length;
    count++;
    return `${clean.slice(0, first).trimEnd()}

<!-- benchmark-chart:start -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/charts/${caseName}-dark.svg">
  <img alt="${caseName}" src="assets/charts/${caseName}-light.svg" width="1040">
</picture>
<!-- benchmark-chart:end -->

<details>
<summary>Full benchmark data</summary>

${clean.slice(first, end)}

</details>
${clean.slice(end).replace(/^\n+/, '\n')}`;
  },
);
if (count !== 6) throw new Error(`Expected 6 benchmark cases, found ${count}.`);
writeFileSync(readmePath, updated);
console.log(
  `Generated light/dark SVG charts for ${count} cases and updated README.md.`,
);
