import { open } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  createResults,
  escapeMarkdown,
  isTextFile,
  listFiles,
  normalizeWebPath,
  projectRoot,
  readUtf8,
  writeReport,
} from './maintenance-utils.mjs';

const results = createResults();
const publicRoot = resolve(projectRoot, 'public');
const sourceRoots = [resolve(projectRoot, 'src'), resolve(projectRoot, 'functions'), publicRoot];
const mediaExtensions = new Set(['.gif', '.ico', '.jpeg', '.jpg', '.mp4', '.png', '.svg', '.vtt', '.webm', '.webp']);
const imageExtensions = new Set(['.gif', '.ico', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const videoExtensions = new Set(['.mp4', '.webm']);

function toPosix(path) {
  return path.split(sep).join('/');
}

function publicWebPath(path) {
  return normalizeWebPath(toPosix(relative(publicRoot, path)));
}

function extractLocalAssets(text) {
  const references = new Set();
  const pattern =
    /\/[A-Za-z0-9_@%+.,~\-/\u3400-\u9fff]+\.(?:gif|ico|jpe?g|mp4|png|svg|vtt|webm|webp)(?=$|[?#"'`\s<>()])(?:[?#][^"'`\s<>()]*)?/gi;

  for (const match of text.matchAll(pattern)) {
    references.add(normalizeWebPath(match[0]));
  }

  return references;
}

const actualFiles = await listFiles(publicRoot);
const actualMedia = actualFiles.filter((path) => mediaExtensions.has(extname(path).toLowerCase()));
const actualByWebPath = new Map(actualMedia.map((path) => [publicWebPath(path), path]));
const references = new Map();

for (const root of sourceRoots) {
  const files = await listFiles(root);

  for (const path of files.filter(isTextFile)) {
    const sourceText = await readUtf8(path);
    const text =
      extname(path).toLowerCase() === '.md'
        ? sourceText.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, '')
        : sourceText;
    for (const webPath of extractLocalAssets(text)) {
      if (!references.has(webPath)) references.set(webPath, new Set());
      references.get(webPath).add(toPosix(relative(projectRoot, path)));
    }
  }
}

const missingAssets = [...references.keys()].filter((webPath) => !actualByWebPath.has(webPath)).sort();
if (missingAssets.length === 0) {
  results.pass('资源', '引用完整性', `检查了 ${references.size} 个本地媒体引用`);
} else {
  for (const path of missingAssets) {
    results.fail('资源', '引用文件不存在', `${path}，引用位置：${[...references.get(path)].slice(0, 3).join('、')}`);
  }
}

const orphanImages = actualMedia
  .filter((path) => imageExtensions.has(extname(path).toLowerCase()))
  .map(publicWebPath)
  .filter((path) => !references.has(path))
  .sort();
const orphanVideos = actualMedia
  .filter((path) => videoExtensions.has(extname(path).toLowerCase()))
  .map(publicWebPath)
  .filter((path) => !references.has(path))
  .sort();

if (orphanImages.length === 0) {
  results.pass('资源', '孤立图片', '未发现');
} else {
  results.warn('资源', '孤立图片', `发现 ${orphanImages.length} 个，详见报告`);
}

if (orphanVideos.length === 0) {
  results.pass('资源', '无引用视频', '未发现');
} else {
  results.warn('资源', '无引用视频', `发现 ${orphanVideos.length} 个，详见报告`);
}

const videos = actualMedia.filter((path) => videoExtensions.has(extname(path).toLowerCase()));
const missingCaptions = videos
  .filter((path) => {
    const webPath = publicWebPath(path);
    const captionPath = webPath.replace(/\.(?:mp4|webm)$/i, '.vtt');
    return !actualByWebPath.has(captionPath);
  })
  .map(publicWebPath)
  .sort();

if (missingCaptions.length === 0) {
  results.pass('字幕', '视频字幕配对', `${videos.length} 个视频均有同名 VTT`);
} else {
  results.warn('字幕', '缺失字幕', `${missingCaptions.length}/${videos.length} 个视频没有同名 VTT，详见报告`);
}

function runGit(args) {
  return spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
}

const lfsVersion = runGit(['lfs', 'version']);
if (lfsVersion.status !== 0) {
  results.fail('Git LFS', '命令可用性', lfsVersion.stderr.trim() || 'git-lfs 未安装');
} else {
  results.pass('Git LFS', '命令可用性', lfsVersion.stdout.trim());

  const lfsFsck = runGit(['lfs', 'fsck']);
  if (lfsFsck.status === 0) {
    results.pass('Git LFS', '对象完整性', lfsFsck.stdout.trim() || 'git lfs fsck 通过');
  } else {
    results.fail('Git LFS', '对象完整性', (lfsFsck.stderr || lfsFsck.stdout).trim());
  }

  const lfsList = runGit(['lfs', 'ls-files', '--name-only']);
  const tracked = new Set(
    lfsList.stdout
      .split(/\r?\n/)
      .map((line) => line.trim().replaceAll('\\', '/'))
      .filter(Boolean),
  );

  for (const path of videos.filter((value) => extname(value).toLowerCase() === '.mp4')) {
    const repositoryPath = toPosix(relative(projectRoot, path));
    if (!tracked.has(repositoryPath)) {
      results.fail('Git LFS', 'MP4 未被 LFS 跟踪', repositoryPath);
    }

    const handle = await open(path, 'r');
    const buffer = Buffer.alloc(200);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    await handle.close();
    const header = buffer.subarray(0, bytesRead).toString('utf8');

    if (header.startsWith('version https://git-lfs.github.com/spec/v1')) {
      results.fail('Git LFS', '工作区仍是指针文件', repositoryPath);
    }
  }

  if (!results.items.some((item) => item.area === 'Git LFS' && item.status === 'fail')) {
    results.pass('Git LFS', 'MP4 跟踪状态', `${videos.length} 个视频文件检查通过`);
  }
}

const counts = results.counts();
const listSection = (title, items) => `## ${title}

${items.length === 0 ? '无。' : items.map((item) => `- \`${item}\``).join('\n')}
`;
const markdown = `# 每周仓库与媒体检查

- 检查时间：${new Date().toISOString()}
- 通过：${counts.passed}
- 警告：${counts.warnings}
- 失败：${counts.failed}

| 状态 | 分类 | 检查项 | 详情 |
| --- | --- | --- | --- |
${results.items
  .map(
    (item) =>
      `| ${item.status.toUpperCase()} | ${escapeMarkdown(item.area)} | ${escapeMarkdown(item.label)} | ${escapeMarkdown(item.detail)} |`,
  )
  .join('\n')}

${listSection('缺失字幕的视频', missingCaptions)}
${listSection('孤立图片', orphanImages)}
${listSection('无引用视频', orphanVideos)}
${listSection('不存在的媒体引用', missingAssets)}
`;

await writeReport(
  'weekly-repository',
  {
    checkedAt: new Date().toISOString(),
    counts,
    totals: {
      media: actualMedia.length,
      videos: videos.length,
      references: references.size,
    },
    missingCaptions,
    orphanImages,
    orphanVideos,
    missingAssets,
    results: results.items,
  },
  markdown,
);

if (counts.failed > 0) process.exitCode = 1;
