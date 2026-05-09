import dayjs from 'dayjs';
import {
  updateNovelCategoryById,
  updateNovelInfo,
} from '@database/queries/NovelQueries';
import { LOCAL_PLUGIN_ID } from '@plugins/pluginManager';
import { getString } from '@strings/translations';
import { NOVEL_STORAGE } from '@utils/Storages';
import { dbManager } from '@database/db';
import { novelSchema, chapterSchema } from '@database/schema';
import { BackgroundTaskMetadata } from '@services/ServiceManager';
import NativeFile from '@specs/NativeFile';
import NativeZipArchive from '@specs/NativeZipArchive';
import NativeEpub from '@specs/NativeEpub';

const decodePath = (path: string) => {
  try {
    return decodeURI(path);
  } catch {
    return path;
  }
};

const normalizePath = (path: string) => path.replace(/\\/g, '/');

const stripFileScheme = (path: string) =>
  path.startsWith('file://') ? path.slice('file://'.length) : path;

const getParentDir = (path: string) => {
  const normalized = normalizePath(stripFileScheme(path)).replace(/\/+$/, '');
  const index = normalized.lastIndexOf('/');
  return index >= 0 ? normalized.slice(0, index) : '';
};

const resolvePath = (baseDir: string, relativePath: string) => {
  const normalizedBase = normalizePath(stripFileScheme(baseDir)).replace(
    /\/+$/,
    '',
  );
  const baseSegments = normalizedBase ? normalizedBase.split('/') : [];
  const normalizedRelative = normalizePath(stripFileScheme(relativePath));

  for (const segment of normalizedRelative.split('/')) {
    if (!segment || segment === '.') {
      continue;
    }
    if (segment === '..') {
      baseSegments.pop();
      continue;
    }
    baseSegments.push(segment);
  }

  return baseSegments.join('/');
};

const getRelativePath = (rootPath: string, fullPath: string) => {
  const normalizedRoot = normalizePath(stripFileScheme(rootPath)).replace(
    /\/+$/,
    '',
  );
  const normalizedFull = normalizePath(stripFileScheme(fullPath));

  if (!normalizedRoot) {
    return '';
  }

  if (normalizedFull === normalizedRoot) {
    return '';
  }

  if (normalizedFull.startsWith(`${normalizedRoot}/`)) {
    return normalizedFull.slice(normalizedRoot.length + 1);
  }

  return '';
};

const ASSET_EXTENSIONS = new Set([
  'css',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'svg',
  'webp',
  'woff',
  'woff2',
  'ttf',
  'otf',
]);

const HTML_EXTENSIONS = new Set(['xhtml', 'html', 'htm']);

const getExtension = (path: string) => {
  const match = path.match(/\.([^.\/?#]+)$/);
  return match ? match[1].toLowerCase() : '';
};

const shouldSkipUrlRewrite = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return true;
  }
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
};

const stripHtml = (value: string) => {
  const bodyMatch = value.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : value;
  return bodyContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeText = (value: string) => stripHtml(value).toLowerCase();

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isDerivedName = (name: string, base: string) => {
  const normalizedName = name.trim().toLowerCase();
  const normalizedBase = base.trim().toLowerCase();
  if (!normalizedName || !normalizedBase) {
    return false;
  }
  if (normalizedName === normalizedBase) {
    return true;
  }
  const pattern = new RegExp(`^${escapeRegExp(normalizedBase)}\\s*\\(\\d+\\)$`);
  return pattern.test(normalizedName);
};

const isTitleOnlyChapter = (chapterName: string, chapterText: string) => {
  if (!chapterName) {
    return false;
  }
  const normalizedName = normalizeText(chapterName);
  if (!normalizedName) {
    return false;
  }
  const normalizedText = normalizeText(chapterText);
  if (!normalizedText) {
    return false;
  }

  return (
    (normalizedText === normalizedName && normalizedText.length <= 80) ||
    normalizedText.length <= normalizedName.length
  );
};

const resolveAssetPath = (
  epubRootPath: string,
  chapterPath: string,
  assetPath: string,
) => {
  const normalizedAssetPath = normalizePath(stripFileScheme(assetPath));
  if (!normalizedAssetPath) {
    return '';
  }
  if (normalizedAssetPath.startsWith('/')) {
    return resolvePath(epubRootPath, normalizedAssetPath.slice(1));
  }
  const chapterDir = getParentDir(chapterPath);
  return resolvePath(chapterDir, normalizedAssetPath);
};

const rewriteChapterContent = (
  chapterText: string,
  chapterPath: string,
  epubRootPath: string,
  novelDir: string,
  assetRelativePaths: Set<string>,
) => {
  return chapterText.replace(
    /(\b(?:href|src))\s*=\s*(["'])([^"']+)\2/gi,
    (match, attr: string, quote: string, rawUrl: string) => {
      if (shouldSkipUrlRewrite(rawUrl)) {
        return match;
      }

      const urlMatch = rawUrl.match(/^([^?#]*)(.*)$/);
      const pathPart = urlMatch ? urlMatch[1] : rawUrl;
      const suffix = urlMatch ? urlMatch[2] : '';

      const extension = getExtension(pathPart);
      if (attr.toLowerCase() === 'href') {
        if (!extension || HTML_EXTENSIONS.has(extension)) {
          return match;
        }
        if (!ASSET_EXTENSIONS.has(extension)) {
          return match;
        }
      }

      const absolutePath = resolveAssetPath(
        epubRootPath,
        chapterPath,
        pathPart,
      );
      if (!absolutePath) {
        return match;
      }

      const relativePath = getRelativePath(epubRootPath, absolutePath);
      if (!relativePath || !assetRelativePaths.has(relativePath)) {
        return match;
      }

      const targetPath = `${normalizePath(novelDir)}/${relativePath}`;
      const newUrl = `file://${targetPath}${suffix}`;
      return `${attr}=${quote}${newUrl}${quote}`;
    },
  );
};

const insertLocalNovel = async (
  name: string,
  path: string,
  epubRootPath: string,
  cover?: string,
  author?: string,
  artist?: string,
  summary?: string,
) => {
  const { insertId } = await dbManager.write(async tx => {
    return tx
      .insert(novelSchema)
      .values({ name, path, pluginId: 'local', inLibrary: true, isLocal: true })
      .run();
  });

  if (insertId !== undefined && insertId >= 0) {
    await updateNovelCategoryById(insertId, [2]);
    const novelDir = NOVEL_STORAGE + '/local/' + insertId;
    NativeFile.mkdir(novelDir);
    const decodedCoverPath = cover ? decodePath(cover) : '';
    const coverRelativePath = decodedCoverPath
      ? getRelativePath(epubRootPath, decodedCoverPath) ||
        decodedCoverPath.split(/[/\\]/).pop() ||
        ''
      : '';
    const newCoverPath = coverRelativePath
      ? `file://${novelDir}/${coverRelativePath}`
      : '';
    await updateNovelInfo({
      id: insertId,
      pluginId: LOCAL_PLUGIN_ID,
      author: author,
      artist: artist,
      summary: summary,
      path: NOVEL_STORAGE + '/local/' + insertId,
      cover: newCoverPath,
      name: name,
      inLibrary: true,
      isLocal: true,
      totalPages: 0,
    });
    return insertId;
  }
  throw new Error(getString('advancedSettingsScreen.novelInsertFailed'));
};

const insertLocalChapter = async (
  novelId: number,
  fakeId: number,
  name: string,
  path: string,
  releaseTime: string,
  epubRootPath: string,
  assetRelativePaths: Set<string>,
  chapterTextOverride?: string,
) => {
  const { insertId } = await dbManager.write(async tx => {
    return tx
      .insert(chapterSchema)
      .values({
        novelId,
        name,
        path: NOVEL_STORAGE + '/local/' + novelId + '/' + fakeId,
        releaseTime,
        position: fakeId,
        isDownloaded: true,
      })
      .run();
  });

  if (insertId !== undefined && insertId >= 0) {
    let chapterText: string = chapterTextOverride ?? '';
    if (!chapterText) {
      chapterText = NativeFile.readFile(decodePath(path));
    }
    if (!chapterText) {
      return [];
    }
    const novelDir = `${NOVEL_STORAGE}/local/${novelId}`;
    chapterText = rewriteChapterContent(
      chapterText,
      path,
      epubRootPath,
      novelDir,
      assetRelativePaths,
    );
    NativeFile.mkdir(novelDir + '/' + insertId);
    NativeFile.writeFile(`${novelDir}/${insertId}/index.html`, chapterText);
    return;
  }
  throw new Error(getString('advancedSettingsScreen.chapterInsertFailed'));
};

export const importEpub = async (
  {
    uri,
    filename,
  }: {
    uri: string;
    filename: string;
  },
  setMeta: (
    transformer: (meta: BackgroundTaskMetadata) => BackgroundTaskMetadata,
  ) => void,
) => {
  setMeta(meta => ({
    ...meta,
    isRunning: true,
    progress: 0,
  }));

  const epubFilePath =
    NativeFile.getConstants().ExternalCachesDirectoryPath +
    `/novel_${Date.now()}_${Math.random().toString(16).slice(2)}.epub`;
  try {
    NativeFile.copyFile(uri, epubFilePath);
  } catch {
    throw new Error(
      `Failed to read EPUB file "${filename}". The file may have been moved or deleted. Please try importing again.`,
    );
  }
  const epubDirPath =
    NativeFile.getConstants().ExternalCachesDirectoryPath +
    `/epub_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  if (NativeFile.exists(epubDirPath)) {
    NativeFile.unlink(epubDirPath);
  }
  NativeFile.mkdir(epubDirPath);
  await NativeZipArchive.unzip(epubFilePath, epubDirPath);
  const novel = NativeEpub.parseNovelAndChapters(epubDirPath);
  if (!novel.name) {
    novel.name = filename.replace('.epub', '') || 'Untitled';
  }
  const novelId = await insertLocalNovel(
    novel.name,
    epubDirPath + novel.name, // temporary
    epubDirPath,
    novel.cover || '',
    novel.author || '',
    novel.artist || '',
    novel.summary || '',
  );
  const now = dayjs().toISOString();
  const assetPathByRelative = new Map<string, string>();
  const addAssetPath = (
    assetPath?: string | null,
    allowBasenameFallback = false,
  ) => {
    if (!assetPath) {
      return;
    }
    const decodedPath = decodePath(assetPath);
    const relativePath = getRelativePath(epubDirPath, decodedPath);
    const fallbackName = decodedPath.split(/[/\\]/).pop() || '';
    const finalRelativePath =
      relativePath || (allowBasenameFallback ? fallbackName : '');
    if (!finalRelativePath) {
      return;
    }
    if (!assetPathByRelative.has(finalRelativePath)) {
      assetPathByRelative.set(finalRelativePath, decodedPath);
    }
  };

  novel.imagePaths?.forEach(path => addAssetPath(path));
  novel.cssPaths?.forEach(path => addAssetPath(path));
  addAssetPath(novel.cover, true);
  const assetRelativePaths = new Set(assetPathByRelative.keys());
  let pendingTitleName: string | null = null;
  let insertIndex = 0;
  if (novel.chapters) {
    for (let i = 0; i < novel.chapters?.length; i++) {
      const chapter = novel.chapters[i];
      const fallbackName = chapter.path.split(/[/\\]/).pop() || 'unknown';
      let chapterName = chapter.name || fallbackName;

      if (pendingTitleName) {
        if (
          isDerivedName(chapterName, pendingTitleName) ||
          chapterName === fallbackName
        ) {
          chapterName = pendingTitleName;
        }
        pendingTitleName = null;
      }

      const chapterText = NativeFile.readFile(decodePath(chapter.path));
      if (chapterText && isTitleOnlyChapter(chapterName, chapterText)) {
        const hasNext = i + 1 < novel.chapters.length;
        if (hasNext) {
          pendingTitleName = chapterName;
          continue;
        }
      }

      setMeta(meta => ({
        ...meta,
        progressText: chapterName,
      }));

      await insertLocalChapter(
        novelId,
        insertIndex,
        chapterName,
        chapter.path,
        now,
        epubDirPath,
        assetRelativePaths,
        chapterText,
      );
      insertIndex += 1;

      setMeta(meta => ({
        ...meta,
        progress: (i + 1) / novel.chapters.length,
      }));
    }
  }
  const novelDir = NOVEL_STORAGE + '/local/' + novelId;

  setMeta(meta => ({
    ...meta,
    progressText: getString('advancedSettingsScreen.importStaticFiles'),
  }));

  for (const [relativePath, absolutePath] of assetPathByRelative.entries()) {
    const decodedPath = decodePath(absolutePath);
    if (NativeFile.exists(decodedPath)) {
      const targetPath = `${novelDir}/${relativePath}`;
      const parentDir = getParentDir(targetPath);
      if (parentDir) {
        NativeFile.mkdir(parentDir);
      }
      NativeFile.moveFile(decodedPath, targetPath);
    }
  }

  setMeta(meta => ({
    ...meta,
    progress: 1,
    isRunning: false,
  }));
};
