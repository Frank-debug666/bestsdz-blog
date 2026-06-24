const TOTAL_KEY = 'views:__total';

interface KVStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init?.headers ?? {}),
    },
  });
}

function normalizePath(rawPath: string | null) {
  if (!rawPath) return '/';

  try {
    const parsed = new URL(rawPath, 'https://bestsdz.xyz');
    rawPath = parsed.pathname;
  } catch {
    // Keep handling the raw value below.
  }

  let path = decodeURIComponent(rawPath).trim();
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/{2,}/g, '/');
  if (path.length > 180) path = path.slice(0, 180);

  return path || '/';
}

async function readCount(store: KVStore, key: string) {
  const value = await store.get(key);
  const count = Number(value ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

async function writeCount(store: KVStore, key: string, value: number) {
  await store.put(key, String(value));
  return value;
}

async function getPathFromRequest(request: Request) {
  const url = new URL(request.url);

  if (request.method === 'POST') {
    try {
      const body = (await request.json()) as { path?: string };
      return normalizePath(body.path ?? url.searchParams.get('path'));
    } catch {
      return normalizePath(url.searchParams.get('path'));
    }
  }

  return normalizePath(url.searchParams.get('path'));
}

async function handleRequest(context: any, shouldIncrement: boolean) {
  const store = context.env?.BLOG_VIEWS as KVStore | undefined;
  if (!store) {
    return json({ error: 'BLOG_VIEWS binding is not configured' }, { status: 503 });
  }

  const path = await getPathFromRequest(context.request);
  const pageKey = `views:${path}`;

  let [page, total] = await Promise.all([readCount(store, pageKey), readCount(store, TOTAL_KEY)]);

  if (shouldIncrement) {
    [page, total] = await Promise.all([
      writeCount(store, pageKey, page + 1),
      writeCount(store, TOTAL_KEY, total + 1),
    ]);
  }

  return json({ path, page, total });
}

export const onRequestGet = (context: any) => handleRequest(context, false);
export const onRequestPost = (context: any) => handleRequest(context, true);
