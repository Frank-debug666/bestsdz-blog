import { appendFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));

export const projectRoot = resolve(scriptsDir, '..');
export const reportsDir = resolve(projectRoot, '.maintenance-reports');

export async function ensureDirectory(path) {
  await mkdir(path, { recursive: true });
}

export async function listFiles(root) {
  const files = [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
      } else if (entry.isFile()) {
        files.push(path);
      }
    }
  }

  await walk(root);
  return files;
}

export function normalizeWebPath(value) {
  let path = value.trim().replaceAll('\\', '/').split(/[?#]/, 1)[0];

  try {
    path = decodeURIComponent(path);
  } catch {
    // Keep the original path when it contains malformed percent encoding.
  }

  if (!path.startsWith('/')) path = `/${path}`;
  return path.replace(/\/{2,}/g, '/');
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      redirect: 'follow',
      ...options,
      headers: {
        'user-agent': 'bestsdz-site-maintenance/1.0',
        ...(options.headers ?? {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export function findMojibake(text) {
  const hits = new Set();
  const directTokens = [
    '\uFFFD',
    'Ã',
    'Â',
    'â€',
    'ðŸ',
    '馃',
    '锛?',
    '銆?',
    '绗?',
    '鏂囩珷',
    '瑙嗛',
    '鍏ラ棬',
    '瀛︿範',
    '鐨勫',
  ];

  for (const token of directTokens) {
    if (text.includes(token)) hits.add(token);
  }

  const denseMatches = text.match(/(?:锛|銆|鈥|鈺|鏂|瑙|棰|绗|璇|鍏|瀛|鐨)[?€]{0,1}/g) ?? [];
  if (denseMatches.length >= 8) {
    hits.add(`疑似乱码片段 ${denseMatches.slice(0, 6).join('、')}`);
  }

  return [...hits];
}

export function escapeMarkdown(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

export async function writeReport(name, payload, markdown) {
  await ensureDirectory(reportsDir);
  await writeFile(resolve(reportsDir, `${name}.json`), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeFile(resolve(reportsDir, `${name}.md`), `${markdown.trim()}\n`, 'utf8');

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    await appendFile(summaryPath, `${markdown.trim()}\n\n`, 'utf8');
  }
}

export function createResults() {
  const items = [];

  const add = (status, area, label, detail = '', url = '') => {
    const item = { status, area, label, detail, url };
    items.push(item);

    const icon = status === 'pass' ? 'PASS' : status === 'warn' ? 'WARN' : 'FAIL';
    console.log(`[${icon}] ${area}: ${label}${detail ? ` - ${detail}` : ''}${url ? ` (${url})` : ''}`);

    if (process.env.GITHUB_ACTIONS === 'true' && status !== 'pass') {
      const command = status === 'fail' ? 'error' : 'warning';
      console.log(`::${command} title=${area}::${label}${detail ? ` - ${detail}` : ''}`);
    }
  };

  return {
    items,
    pass: (area, label, detail, url) => add('pass', area, label, detail, url),
    warn: (area, label, detail, url) => add('warn', area, label, detail, url),
    fail: (area, label, detail, url) => add('fail', area, label, detail, url),
    counts: () => ({
      passed: items.filter((item) => item.status === 'pass').length,
      warnings: items.filter((item) => item.status === 'warn').length,
      failed: items.filter((item) => item.status === 'fail').length,
    }),
  };
}

export function isTextFile(path) {
  return new Set([
    '.astro',
    '.css',
    '.html',
    '.js',
    '.json',
    '.jsx',
    '.md',
    '.mjs',
    '.cjs',
    '.ts',
    '.tsx',
    '.txt',
    '.webmanifest',
    '.xml',
    '.yml',
    '.yaml',
  ]).has(extname(path).toLowerCase());
}

export async function readUtf8(path) {
  return readFile(path, 'utf8');
}
