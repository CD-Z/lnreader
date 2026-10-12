import { createStore, type StoreApi } from 'zustand';

import { fetchTimeout } from '@utils/fetch/fetch';
import { getMMKVObject, setMMKVObject } from '@utils/mmkv/mmkv';

export type PluginIssueCategory = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type PluginIssueGroup = [PluginIssueCategory, number, ...number[]];
export type PluginIssueIndex = Record<string, PluginIssueGroup[]>;

export interface PluginIssueIndexState {
  index: PluginIssueIndex | undefined;
  isRefreshing: boolean;
  refreshFailed: boolean;
}

const issueIndexUrl =
  'https://raw.githubusercontent.com/LNReader/lnreader-plugins/issue-index/issue-index.min.json';
const temporaryIssueIndexUrl =
  'https://raw.githubusercontent.com/CD-Z/lnreader-sources/issue-index/issue-index.min.json';
const issueIndexStorageKey = 'PLUGIN_ISSUE_INDEX';

const fetchIssueIndex = async (url: string): Promise<PluginIssueIndex> => {
  const response = await fetchTimeout(url, {
    headers: { pragma: 'no-cache', 'cache-control': 'no-cache' },
  });
  if (!response.ok) {
    throw new Error(`Plugin issue index request failed: ${response.status}`);
  }

  const index: unknown = await response.json();
  if (!isPluginIssueIndex(index)) {
    throw new Error('Plugin issue index response has an invalid shape');
  }
  return index;
};

const isPluginIssueIndex = (value: unknown): value is PluginIssueIndex => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  for (const pluginId of Object.keys(value)) {
    const groups = (value as Record<string, unknown>)[pluginId];
    if (!Array.isArray(groups)) {
      return false;
    }

    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      const group = groups[groupIndex];
      if (!Array.isArray(group) || group.length < 2) {
        return false;
      }

      const category = group[0];
      if (
        typeof category !== 'number' ||
        !Number.isInteger(category) ||
        category < 0 ||
        category > 6
      ) {
        return false;
      }

      for (let issueIndex = 1; issueIndex < group.length; issueIndex++) {
        const issueNumber = group[issueIndex];
        if (
          typeof issueNumber !== 'number' ||
          !Number.isSafeInteger(issueNumber) ||
          issueNumber <= 0
        ) {
          return false;
        }
      }
    }
  }

  return true;
};

const readCachedIndex = (): PluginIssueIndex | undefined => {
  try {
    const cachedIndex = getMMKVObject<unknown>(issueIndexStorageKey);
    return isPluginIssueIndex(cachedIndex) ? cachedIndex : undefined;
  } catch {
    return undefined;
  }
};

export const pluginIssueIndexStore: StoreApi<PluginIssueIndexState> =
  createStore<PluginIssueIndexState>()(() => ({
    index: readCachedIndex(),
    isRefreshing: false,
    refreshFailed: false,
  }));

const refreshIssueIndex = async (): Promise<void> => {
  pluginIssueIndexStore.setState({ isRefreshing: true, refreshFailed: false });

  try {
    let index: PluginIssueIndex;
    try {
      index = await fetchIssueIndex(issueIndexUrl);
    } catch {
      index = await fetchIssueIndex(temporaryIssueIndexUrl);
    }

    setMMKVObject(issueIndexStorageKey, index);
    pluginIssueIndexStore.setState({ index, refreshFailed: false });
  } catch {
    pluginIssueIndexStore.setState({ refreshFailed: true });
  } finally {
    pluginIssueIndexStore.setState({ isRefreshing: false });
  }
};

let inFlightRefresh: Promise<void> | undefined;

export const refreshPluginIssueIndex = (): Promise<void> => {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  const refresh = refreshIssueIndex();
  inFlightRefresh = refresh.finally(() => {
    inFlightRefresh = undefined;
  });
  return inFlightRefresh;
};
