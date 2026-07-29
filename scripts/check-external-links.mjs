import { relative, resolve, sep } from 'node:path';
import {
  createResults,
  escapeMarkdown,
  fetchWithTimeout,
  isTextFile,
  listFiles,
  projectRoot,
  readUtf8,
  writeReport,
} from './maintenance-utils.mjs';

const results = createResults();
const timeoutMs = Number(process.env.LINKCHECK_TIMEOUT_MS ?? 15000);
const concurrency = Number(process.env.LINKCHECK_CONCURRENCY ?? 6);
const sourceRoot = resolve(projectRoot, 'src');
const links = new Map();

function cleanUrl(value) {
  return value
    .replaceAll('&amp;', '&')
    .replace(/[),.;!?，。；！]+$/u, '')
    .trim();
}

function extractExternalLinks(text) {
  const found = new Set();
  const patterns = [
    /\[[^\]]*]\((https?:\/\/[^\s)]+)(?:\s+["'][^"']*["'])?\)/gi,
    /(?:href|src)=["'](https?:\/\/[^"']+)["']/gi,
    /<(https?:\/\/[^>\s]+)>/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      found.add(cleanUrl(match[1]));
    }
  }

  return found;
}

for (const path of (await listFiles(sourceRoot)).filter(isTextFile)) {
  const text = await readUtf8(path);
  for (const value of extractExternalLinks(text)) {
    try {
      const url = new URL(value);
      if (['bestsdz.xyz', 'www.bestsdz.xyz', 'localhost', '127.0.0.1'].includes(url.hostname)) continue;
      url.hash = '';
      const normalized = url.toString();
      if (!links.has(normalized)) links.set(normalized, []);
      links.get(normalized).push(relative(projectRoot, path).split(sep).join('/'));
    } catch {
      results.warn('外链', '无法解析 URL', value);
    }
  }
}

async function requestLink(url) {
  let response;

  try {
    response = await fetchWithTimeout(url, { method: 'HEAD' }, timeoutMs);
    if (response.status < 400) {
      await response.body?.cancel();
      return response;
    }
    await response.body?.cancel();
  } catch {
    // Some sites reject HEAD requests. Retry once with a small ranged GET.
  }

  response = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers: {
        range: 'bytes=0-1023',
      },
    },
    timeoutMs,
  );
  await response.body?.cancel();
  return response;
}

const entries = [...links.entries()];
let cursor = 0;

async function worker() {
  while (cursor < entries.length) {
    const current = cursor;
    cursor += 1;
    const [url, sources] = entries[current];

    try {
      const response = await requestLink(url);
      const detail = `HTTP ${response.status}，引用：${sources.slice(0, 2).join('、')}`;

      if (response.status >= 200 && response.status < 400) {
        results.pass('外链', url, detail);
      } else if (response.status === 404 || response.status === 410) {
        results.fail('外链', url, detail);
      } else {
        results.warn('外链', url, `${detail}；可能存在登录、限流或临时故障`);
      }
    } catch (error) {
      results.warn(
        '外链',
        url,
        `${error instanceof Error ? error.message : String(error)}；引用：${sources.slice(0, 2).join('、')}`,
      );
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, entries.length || 1) }, () => worker()));

const counts = results.counts();
const markdown = `# 每周外部链接检查

- 检查时间：${new Date().toISOString()}
- 链接总数：${entries.length}
- 通过：${counts.passed}
- 警告：${counts.warnings}
- 失败：${counts.failed}

| 状态 | URL | 详情 |
| --- | --- | --- |
${results.items
  .map(
    (item) =>
      `| ${item.status.toUpperCase()} | ${escapeMarkdown(item.label)} | ${escapeMarkdown(item.detail)} |`,
  )
  .join('\n')}
`;

await writeReport(
  'weekly-external-links',
  {
    checkedAt: new Date().toISOString(),
    counts,
    total: entries.length,
    results: results.items,
  },
  markdown,
);

if (counts.failed > 0) process.exitCode = 1;
