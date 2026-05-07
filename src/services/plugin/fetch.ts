import { getPlugin } from '@plugins/pluginManager';
import { isUrlAbsolute } from '@plugins/helpers/isAbsoluteUrl';
import { SourcePage } from '@plugins/types';

export const fetchNovel = async (pluginId: string, novelPath: string) => {
  const plugin = getPlugin(pluginId);
  if (!plugin) {
    throw new Error(`Unknown plugin: ${pluginId}`);
  }
  const res = await plugin.parseNovel(novelPath);
  return res;
};

export const fetchChapter = async (pluginId: string, chapterPath: string) => {
  const plugin = getPlugin(pluginId);
  let chapterText = `Unknown plugin: ${pluginId}`;
  if (plugin) {
    chapterText = await plugin.parseChapter(chapterPath);
  }
  return chapterText;
};

export const fetchChapters = async (pluginId: string, novelPath: string) => {
  const plugin = getPlugin(pluginId);
  if (!plugin) {
    throw new Error(`Unknown plugin: ${pluginId}`);
  }
  const res = await plugin.parseNovel(novelPath);
  return res?.chapters;
};

export const fetchPage = async (
  pluginId: string,
  novelPath: string,
  page: string,
): Promise<SourcePage> => {
  const plugin = getPlugin(pluginId);

  if (!plugin) {
    throw new Error(`Unknown plugin: ${pluginId}`);
  }

  if (plugin.parsePage) {
    const res = await plugin.parsePage(novelPath, page);
    if (res) return res;
    throw new Error(`Could not fetch chapters for page ${page}`);
  }
  if (plugin.parseNovel && page === '1') {
    const res = await plugin.parseNovel(novelPath);
    if (res.chapters) return { chapters: res.chapters };
    throw new Error(`Could not fetch chapters for novel ${novelPath}`);
  }
  throw new Error(`Could not fetch chapters for novel ${novelPath}`);
};

export const resolveUrl = (
  pluginId: string,
  path: string,
  isNovel?: boolean,
) => {
  if (isUrlAbsolute(path)) {
    return path;
  }
  const plugin = getPlugin(pluginId);
  try {
    if (!plugin) {
      throw new Error(`Unknown plugin: ${pluginId}`);
    }
    if (plugin.resolveUrl) {
      return plugin.resolveUrl(path, isNovel);
    }
  } catch {
    return path;
  }
  return plugin.site + path;
};
