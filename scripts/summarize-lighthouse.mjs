import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  ensureDirectory,
  escapeMarkdown,
  projectRoot,
  writeReport,
} from './maintenance-utils.mjs';

const lighthouseDir = resolve(projectRoot, '.lighthouseci');
const stateDir = resolve(projectRoot, '.maintenance-state');
const statePath = resolve(stateDir, 'lighthouse-latest.json');
const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
const thresholds = {
  performance: 65,
  accessibility: 85,
  'best-practices': 80,
  seo: 85,
};

const files = (await readdir(lighthouseDir))
  .filter((name) => name.endsWith('.json'))
  .map((name) => resolve(lighthouseDir, name));

const current = [];
for (const path of files) {
  const report = JSON.parse(await readFile(path, 'utf8'));
  if (!report.categories || !report.finalDisplayedUrl) continue;

  current.push({
    url: report.finalDisplayedUrl,
    scores: Object.fromEntries(
      categories.map((category) => [category, Math.round((report.categories[category]?.score ?? 0) * 100)]),
    ),
  });
}

if (current.length === 0) {
  throw new Error('没有找到可用的 Lighthouse JSON 报告');
}

let previous = [];
try {
  previous = JSON.parse(await readFile(statePath, 'utf8')).pages ?? [];
} catch {
  // The first run has no previous state to compare against.
}

const previousByPath = new Map(previous.map((page) => [new URL(page.url).pathname, page]));
const rows = [];
const warnings = [];

for (const page of current) {
  const path = new URL(page.url).pathname;
  const old = previousByPath.get(path);
  rows.push({
    path,
    scores: page.scores,
    changes: Object.fromEntries(
      categories.map((category) => [
        category,
        old ? page.scores[category] - old.scores[category] : null,
      ]),
    ),
  });

  for (const category of categories) {
    const score = page.scores[category];
    const change = old ? score - old.scores[category] : null;

    if (score < thresholds[category]) {
      warnings.push(`${path} 的 ${category} 分数为 ${score}，低于基线 ${thresholds[category]}`);
    }
    if (change !== null && change <= -5) {
      warnings.push(`${path} 的 ${category} 相比上次下降 ${Math.abs(change)} 分`);
    }
  }
}

await ensureDirectory(stateDir);
await writeFile(
  statePath,
  `${JSON.stringify({ checkedAt: new Date().toISOString(), pages: current }, null, 2)}\n`,
  'utf8',
);

const formatScore = (score, change) => {
  if (change === null) return `${score}（首次）`;
  if (change === 0) return `${score}（→ 0）`;
  return `${score}（${change > 0 ? '+' : ''}${change}）`;
};

const markdown = `# 每周 Lighthouse 趋势

- 检查时间：${new Date().toISOString()}
- 页面数量：${rows.length}
- 括号内为相对上一次周检的分数变化

| 页面 | 性能 | 可访问性 | 最佳实践 | SEO |
| --- | ---: | ---: | ---: | ---: |
${rows
  .map(
    (row) =>
      `| ${escapeMarkdown(row.path)} | ${formatScore(row.scores.performance, row.changes.performance)} | ${formatScore(row.scores.accessibility, row.changes.accessibility)} | ${formatScore(row.scores['best-practices'], row.changes['best-practices'])} | ${formatScore(row.scores.seo, row.changes.seo)} |`,
  )
  .join('\n')}

## 警告

${warnings.length === 0 ? '无。' : warnings.map((warning) => `- ${warning}`).join('\n')}
`;

await writeReport(
  'weekly-lighthouse',
  {
    checkedAt: new Date().toISOString(),
    pages: rows,
    warnings,
  },
  markdown,
);

for (const warning of warnings) {
  console.warn(`[WARN] ${warning}`);
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log(`::warning title=Lighthouse::${warning}`);
  }
}
