import {
  createResults,
  escapeMarkdown,
  fetchWithTimeout,
  findMojibake,
  writeReport,
} from './maintenance-utils.mjs';

const baseUrl = new URL(process.env.SITE_URL ?? 'https://bestsdz.xyz');
const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS ?? 15000);
const results = createResults();
const fetchedPages = new Map();

function absoluteUrl(path) {
  return new URL(path, baseUrl).toString();
}

async function fetchText(path, label, expectedContentType) {
  const url = absoluteUrl(path);

  try {
    const response = await fetchWithTimeout(url, {}, timeoutMs);
    const body = await response.text();

    if (response.status !== 200) {
      results.fail('HTTP', label, `期望 200，实际 ${response.status}`, url);
      return { response, body, url };
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (expectedContentType && !contentType.toLowerCase().includes(expectedContentType)) {
      results.fail('HTTP', label, `Content-Type 异常：${contentType || '未提供'}`, url);
    } else {
      results.pass('HTTP', label, `200 ${contentType}`.trim(), url);
    }

    const mojibake = findMojibake(body);
    if (mojibake.length > 0) {
      results.fail('编码', label, `检测到疑似乱码：${mojibake.join('、')}`, url);
    } else {
      results.pass('编码', label, '未发现常见乱码特征', url);
    }

    fetchedPages.set(url, body);
    return { response, body, url };
  } catch (error) {
    results.fail('HTTP', label, error instanceof Error ? error.message : String(error), url);
    return { response: null, body: '', url };
  }
}

function extractAssets(html) {
  const assets = new Set();
  const tagPattern = /<(?:link|script)\b[^>]*(?:href|src)=["']([^"']+)["'][^>]*>/gi;

  for (const match of html.matchAll(tagPattern)) {
    const value = match[1];
    if (/\.(?:css|js)(?:[?#].*)?$/i.test(value)) {
      assets.add(new URL(value, baseUrl).toString());
    }
  }

  return [...assets];
}

function extractAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'));
  return match?.[1] ?? '';
}

function extractMetaContent(html, property) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (extractAttribute(tag, 'property') === property || extractAttribute(tag, 'name') === property) {
      return extractAttribute(tag, 'content');
    }
  }

  return '';
}

async function probeAsset(url, label, expectedKind) {
  try {
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          range: 'bytes=0-255',
        },
      },
      timeoutMs,
    );

    const accepted = response.status === 200 || response.status === 206;
    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    const typeMatches =
      expectedKind === 'style'
        ? contentType.includes('text/css')
        : expectedKind === 'script'
          ? contentType.includes('javascript')
          : expectedKind === 'image'
            ? contentType.startsWith('image/')
            : expectedKind === 'video'
              ? contentType.startsWith('video/') || contentType.includes('octet-stream')
              : true;

    if (!accepted) {
      results.fail('资源', label, `HTTP ${response.status}`, url);
    } else if (!typeMatches) {
      results.fail('资源', label, `Content-Type 异常：${contentType || '未提供'}`, url);
    } else {
      results.pass('资源', label, `${response.status} ${contentType}`.trim(), url);
    }

    await response.body?.cancel();
  } catch (error) {
    results.fail('资源', label, error instanceof Error ? error.message : String(error), url);
  }
}

const home = await fetchText('/', '首页', 'text/html');
const postsIndex = await fetchText('/posts/', '文章列表', 'text/html');
const videos = await fetchText('/videos/', '视频中心', 'text/html');
const search = await fetchText('/search.json', '搜索索引', 'application/json');
const rss = await fetchText('/rss.xml', 'RSS', 'xml');
const sitemap = await fetchText('/sitemap.xml', 'Sitemap', 'xml');

let latestPost = null;
let indexedPosts = [];
try {
  const searchData = JSON.parse(search.body);
  const posts = Array.isArray(searchData.posts) ? searchData.posts : [];
  indexedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (posts.length === 0) {
    results.fail('搜索', '文章索引', 'posts 数组为空', search.url);
  } else {
    latestPost = indexedPosts[0];
    results.pass('搜索', '文章索引', `共 ${posts.length} 篇，最新文章：${latestPost.title}`, search.url);
  }
} catch (error) {
  results.fail('搜索', '搜索 JSON 解析', error instanceof Error ? error.message : String(error), search.url);
}

if (latestPost?.url) {
  const latest = await fetchText(latestPost.url, `最新文章：${latestPost.title}`, 'text/html');

  if (!rss.body.includes(latestPost.url) && !rss.body.includes(latestPost.id)) {
    results.fail('RSS', '最新文章收录', `RSS 中未找到 ${latestPost.url}`, rss.url);
  } else {
    results.pass('RSS', '最新文章收录', latestPost.url, rss.url);
  }

  if (!sitemap.body.includes(latestPost.url) && !sitemap.body.includes(latestPost.id)) {
    results.fail('Sitemap', '最新文章收录', `Sitemap 中未找到 ${latestPost.url}`, sitemap.url);
  } else {
    results.pass('Sitemap', '最新文章收录', latestPost.url, sitemap.url);
  }

  const cover =
    extractMetaContent(latest.body, 'og:image') ||
    extractMetaContent(latest.body, 'twitter:image') ||
    latest.body.match(/<img\b[^>]*src=["']([^"']+)["']/i)?.[1] ||
    '';

  if (cover) {
    await probeAsset(new URL(cover, baseUrl).toString(), '最新文章封面', 'image');
  } else {
    results.fail('资源', '最新文章封面', '文章页面中没有找到封面地址', latest.url);
  }

  let latestVideo = null;
  for (const post of indexedPosts.slice(0, 15)) {
    let body = post.id === latestPost.id ? latest.body : '';
    if (!body) {
      try {
        const response = await fetchWithTimeout(absoluteUrl(post.url), {}, timeoutMs);
        if (response.status === 200) body = await response.text();
      } catch {
        // The regular page checks already report failures for the latest article.
      }
    }

    const match = body.match(/<(?:source|video)\b[^>]*src=["']([^"']+\.mp4(?:[?#][^"']*)?)["']/i);
    if (match) {
      latestVideo = { post, source: match[1] };
      break;
    }
  }

  if (latestVideo) {
    await probeAsset(
      new URL(latestVideo.source, baseUrl).toString(),
      `最新可用视频：${latestVideo.post.title}`,
      'video',
    );
  } else {
    results.warn('资源', '最新文章视频', '最近 15 篇文章均未找到 MP4，已跳过视频探测', latest.url);
  }
}

const pageAssets = new Set();
for (const body of [home.body, postsIndex.body, videos.body]) {
  for (const asset of extractAssets(body)) pageAssets.add(asset);
}

if (pageAssets.size === 0) {
  results.fail('资源', 'CSS/JavaScript 发现', '核心页面中没有发现可检查的 CSS 或 JavaScript');
} else {
  for (const asset of pageAssets) {
    const kind = new URL(asset).pathname.endsWith('.css') ? 'style' : 'script';
    await probeAsset(asset, `${kind === 'style' ? 'CSS' : 'JavaScript'}：${new URL(asset).pathname}`, kind);
  }
}

const styleAssets = [...pageAssets].filter((asset) => new URL(asset).pathname.endsWith('.css'));
const scriptAssets = [...pageAssets].filter((asset) => new URL(asset).pathname.endsWith('.js'));
if (styleAssets.length === 0) {
  results.fail('资源', 'CSS 发现', '核心页面没有引用样式表');
}
if (scriptAssets.length === 0) {
  const inlineScripts = [home.body, postsIndex.body, videos.body].filter((body) => /<script\b/i.test(body)).length;
  if (inlineScripts > 0) {
    results.pass('资源', 'JavaScript', `${inlineScripts} 个核心页面使用内联脚本，脚本随 HTML 成功返回`);
  } else {
    results.warn('资源', 'JavaScript', '核心页面没有发现外部或内联脚本');
  }
}

try {
  const viewsUrl = absoluteUrl('/api/views?path=/__maintenance_healthcheck__');
  const response = await fetchWithTimeout(viewsUrl, {}, timeoutMs);
  const data = await response.json();
  const valid =
    response.status === 200 &&
    typeof data.path === 'string' &&
    Number.isFinite(Number(data.page)) &&
    Number.isFinite(Number(data.total));

  if (valid) {
    results.pass('API', '浏览量接口', `page=${data.page}, total=${data.total}`, viewsUrl);
  } else {
    results.fail('API', '浏览量接口', `HTTP ${response.status}，响应结构不符合预期`, viewsUrl);
  }
} catch (error) {
  results.fail('API', '浏览量接口', error instanceof Error ? error.message : String(error));
}

const counts = results.counts();
const markdown = `# 每日线上健康检查

- 检查时间：${new Date().toISOString()}
- 站点：${baseUrl.toString()}
- 通过：${counts.passed}
- 警告：${counts.warnings}
- 失败：${counts.failed}

| 状态 | 分类 | 检查项 | 详情 |
| --- | --- | --- | --- |
${results.items
  .map(
    (item) =>
      `| ${item.status.toUpperCase()} | ${escapeMarkdown(item.area)} | ${escapeMarkdown(item.label)} | ${escapeMarkdown(item.detail || item.url)} |`,
  )
  .join('\n')}
`;

await writeReport(
  'daily-health',
  {
    checkedAt: new Date().toISOString(),
    site: baseUrl.toString(),
    counts,
    results: results.items,
  },
  markdown,
);

if (counts.failed > 0) process.exitCode = 1;
