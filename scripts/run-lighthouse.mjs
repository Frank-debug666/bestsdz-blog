import { createReadStream } from 'node:fs';
import { access, mkdir, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { projectRoot } from './maintenance-utils.mjs';

const distRoot = resolve(projectRoot, 'dist');
const outputRoot = resolve(projectRoot, '.lighthouseci');
const lighthouseCli = resolve(projectRoot, 'node_modules', 'lighthouse', 'cli', 'index.js');
const paths = ['/', '/posts/', '/videos/'];
const runsPerPage = Math.max(1, Number(process.env.LIGHTHOUSE_RUNS ?? 1));
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relativePath = decoded.endsWith('/') ? `${decoded}index.html` : decoded;
  const resolved = resolve(distRoot, `.${relativePath}`);
  const prefix = distRoot.endsWith(sep) ? distRoot : `${distRoot}${sep}`;

  if (resolved !== distRoot && !resolved.startsWith(prefix)) return null;
  return resolved;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let path = safePath(url.pathname);

  if (!path) {
    response.writeHead(400).end('Bad request');
    return;
  }

  if (!(await exists(path)) && !extname(path)) {
    path = resolve(path, 'index.html');
  }

  if (!(await exists(path))) {
    response.writeHead(404).end('Not found');
    return;
  }

  response.setHeader('content-type', contentTypes[extname(path).toLowerCase()] ?? 'application/octet-stream');
  response.setHeader('cache-control', 'no-store');
  createReadStream(path).pipe(response);
});

await new Promise((resolvePromise, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolvePromise);
});

const address = server.address();
if (!address || typeof address === 'string') {
  server.close();
  throw new Error('无法取得 Lighthouse 本地服务器端口');
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

function runLighthouse(url, outputPath) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      [
        lighthouseCli,
        url,
        '--quiet',
        '--output=json',
        `--output-path=${outputPath}`,
        '--only-categories=performance,accessibility,best-practices,seo',
        '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
      ],
      {
        cwd: projectRoot,
        stdio: 'inherit',
        windowsHide: true,
      },
    );

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`Lighthouse 检查失败，退出码 ${code}`));
      }
    });
  });
}

try {
  for (const path of paths) {
    const slug = path === '/' ? 'home' : path.replaceAll('/', '-').replace(/^-|-$/g, '');
    const url = `http://127.0.0.1:${address.port}${path}`;
    for (let run = 1; run <= runsPerPage; run += 1) {
      console.log(`Running Lighthouse for ${url} (${run}/${runsPerPage})`);
      await runLighthouse(url, resolve(outputRoot, `${slug}-run-${run}.report.json`));
    }
  }
} finally {
  await new Promise((resolvePromise) => server.close(resolvePromise));
}
