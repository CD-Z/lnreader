import { act, renderHook, waitFor } from '@testing-library/react-native';

import { usePluginActions } from '../usePlugins';
import {
  pluginIssueIndexStore,
  type PluginIssueIndex,
} from '@plugins/issueIndex';
import type { PluginItem } from '@plugins/types';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

jest.mock('react-native-mmkv', () => ({
  useMMKVObject: jest.fn(),
}));

jest.mock('@plugins/pluginManager', () => ({
  fetchPlugins: jest.fn(),
  installPlugin: jest.fn(),
  uninstallPlugin: jest.fn(),
  updatePlugin: jest.fn(),
  INSTALLED_PLUGINS_KEY: 'INSTALLED_PLUGINS',
}));

jest.mock('@utils/mmkv/mmkv', () => {
  const storage = new Map<string, unknown>();
  return {
    __storage: storage,
    MMKVStorage: {
      remove: jest.fn((key: string) => storage.delete(key)),
    },
    getMMKVObject: jest.fn((key: string) => storage.get(key)),
    setMMKVObject: jest.fn((key: string, value: unknown) => {
      storage.set(key, value);
    }),
  };
});

jest.mock('@utils/fetch/fetch', () => ({
  fetchTimeout: jest.fn(),
}));

interface MMKVMock {
  __storage: Map<string, unknown>;
}

interface PluginManagerMock {
  fetchPlugins: jest.Mock;
}

interface FetchMock {
  fetchTimeout: jest.Mock;
}

const mockStorage = jest.requireMock<MMKVMock>('@utils/mmkv/mmkv').__storage;
const mockFetchPlugins = jest.requireMock<PluginManagerMock>(
  '@plugins/pluginManager',
).fetchPlugins;
const mockFetchTimeout =
  jest.requireMock<FetchMock>('@utils/fetch/fetch').fetchTimeout;

const installedPlugin: PluginItem = {
  id: 'galaxynovels',
  name: 'Galaxy Novels',
  site: 'https://galaxynovels.example.com',
  lang: 'English',
  version: '1.0.0',
  url: 'https://plugins.example.com/galaxynovels.js',
  iconUrl: 'https://plugins.example.com/galaxynovels.png',
};
const updatedPlugin: PluginItem = {
  ...installedPlugin,
  version: '2.0.0',
  url: 'https://updated.example.com/galaxynovels.js',
  iconUrl: 'https://updated.example.com/galaxynovels.png',
};
const issueIndexFixture: PluginIssueIndex = {
  galaxynovels: [
    [6, 2133],
    [3, 2667],
  ],
  novelupdates: [[0, 729, 736]],
  emptyplugin: [],
};
const primaryIssueIndexUrl =
  'https://raw.githubusercontent.com/LNReader/lnreader-plugins/issue-index/issue-index.min.json';
const forkIssueIndexUrl =
  'https://raw.githubusercontent.com/CD-Z/lnreader-sources/issue-index/issue-index.min.json';

const jsonResponse = (body: unknown) => ({
  ok: true,
  json: jest.fn().mockResolvedValue(body),
});

describe('plugin issue refresh integration', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockFetchPlugins.mockReset();
    mockFetchTimeout.mockReset();
    pluginIssueIndexStore.setState({
      index: undefined,
      isRefreshing: false,
      refreshFailed: false,
    });
  });

  it('persists manifest updates when issue refresh fails', async () => {
    mockStorage.set('INSTALLED_PLUGINS', [installedPlugin]);
    mockFetchPlugins.mockResolvedValue([updatedPlugin]);
    mockFetchTimeout.mockRejectedValue(new Error('issue index unavailable'));
    const { result } = renderHook(usePluginActions);

    await act(async () => {
      await result.current.refreshPlugins();
    });

    expect(mockStorage.get('AVAILABLE_PLUGINS')).toEqual([updatedPlugin]);
    expect(mockStorage.get('INSTALLED_PLUGINS')).toEqual([
      {
        ...installedPlugin,
        hasUpdate: true,
        url: updatedPlugin.url,
        iconUrl: updatedPlugin.iconUrl,
      },
    ]);
    expect(pluginIssueIndexStore.getState()).toEqual({
      index: undefined,
      isRefreshing: false,
      refreshFailed: true,
    });
    expect(mockFetchTimeout.mock.calls.map(([url]) => url)).toEqual([
      primaryIssueIndexUrl,
      forkIssueIndexUrl,
    ]);
  });

  it('persists manifests and publishes issue reports from the fork fallback', async () => {
    mockStorage.set('INSTALLED_PLUGINS', [installedPlugin]);
    mockFetchPlugins.mockResolvedValue([updatedPlugin]);
    mockFetchTimeout.mockImplementation((url: string) => {
      if (url === primaryIssueIndexUrl) {
        return Promise.resolve({ ok: false, status: 404, json: jest.fn() });
      }
      if (url === forkIssueIndexUrl) {
        return Promise.resolve(jsonResponse(issueIndexFixture));
      }
      throw new Error(`Unexpected issue index URL: ${url}`);
    });
    const { result } = renderHook(usePluginActions);

    await act(async () => {
      await result.current.refreshPlugins();
    });

    expect(mockStorage.get('AVAILABLE_PLUGINS')).toEqual([updatedPlugin]);
    expect(pluginIssueIndexStore.getState()).toEqual({
      index: issueIndexFixture,
      isRefreshing: false,
      refreshFailed: false,
    });
    expect(mockStorage.get('PLUGIN_ISSUE_INDEX')).toEqual(issueIndexFixture);
    expect(mockFetchTimeout.mock.calls.map(([url]) => url)).toEqual([
      primaryIssueIndexUrl,
      forkIssueIndexUrl,
    ]);
  });

  it('publishes reports even when manifest refresh rejects', async () => {
    mockFetchPlugins.mockRejectedValue(new Error('manifest unavailable'));
    mockFetchTimeout.mockResolvedValue(jsonResponse(issueIndexFixture));
    const { result } = renderHook(usePluginActions);

    await act(async () => {
      await expect(result.current.refreshPlugins()).rejects.toThrow(
        'manifest unavailable',
      );
    });

    expect(pluginIssueIndexStore.getState()).toEqual({
      index: issueIndexFixture,
      isRefreshing: false,
      refreshFailed: false,
    });
    expect(mockStorage.get('PLUGIN_ISSUE_INDEX')).toEqual(issueIndexFixture);
  });

  it('removes old report associations after a later successful empty refresh', async () => {
    mockFetchPlugins.mockResolvedValue([]);
    mockFetchTimeout
      .mockResolvedValueOnce(jsonResponse(issueIndexFixture))
      .mockResolvedValueOnce(jsonResponse({}));
    const { result } = renderHook(usePluginActions);

    await act(async () => {
      await result.current.refreshPlugins();
    });
    expect(pluginIssueIndexStore.getState().index).toEqual(issueIndexFixture);

    await act(async () => {
      await result.current.refreshPlugins();
    });

    expect(pluginIssueIndexStore.getState()).toEqual({
      index: {},
      isRefreshing: false,
      refreshFailed: false,
    });
    expect(mockStorage.get('PLUGIN_ISSUE_INDEX')).toEqual({});
    expect(mockFetchTimeout.mock.calls.map(([url]) => url)).toEqual([
      primaryIssueIndexUrl,
      primaryIssueIndexUrl,
    ]);
  });

  it('writes manifest results while waiting for the concurrent report request', async () => {
    mockFetchPlugins.mockResolvedValue([updatedPlugin]);
    let resolveIssueResponse!: (response: unknown) => void;
    const issueResponse = new Promise<unknown>(resolve => {
      resolveIssueResponse = resolve;
    });
    mockFetchTimeout.mockReturnValue(issueResponse);
    const { result } = renderHook(usePluginActions);
    let refreshFinished = false;

    const refresh = result.current.refreshPlugins().then(() => {
      refreshFinished = true;
    });

    await waitFor(() => {
      expect(mockStorage.get('AVAILABLE_PLUGINS')).toEqual([updatedPlugin]);
    });
    expect(refreshFinished).toBe(false);
    expect(pluginIssueIndexStore.getState().isRefreshing).toBe(true);

    resolveIssueResponse(jsonResponse(issueIndexFixture));
    await act(async () => {
      await refresh;
    });

    expect(refreshFinished).toBe(true);
    expect(pluginIssueIndexStore.getState().index).toEqual(issueIndexFixture);
  });
});
