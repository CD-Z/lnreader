import type { PluginIssueIndex } from '../issueIndex';

const PLUGIN_ISSUE_INDEX = 'PLUGIN_ISSUE_INDEX';
const issueIndexFixture: PluginIssueIndex = {
  galaxynovels: [
    [6, 2133],
    [3, 2667],
  ],
  novelupdates: [[0, 729, 736]],
  emptyplugin: [],
};
const primaryUrl =
  'https://raw.githubusercontent.com/LNReader/lnreader-plugins/issue-index/issue-index.min.json';
const forkUrl =
  'https://raw.githubusercontent.com/CD-Z/lnreader-sources/issue-index/issue-index.min.json';

const mockStorage = new Map<string, string>();
const mockGetMMKVObject = jest.fn();
const mockSetMMKVObject = jest.fn();
const mockFetchTimeout = jest.fn();

jest.mock('@utils/mmkv/mmkv', () => ({
  getMMKVObject: (...args: [string]) => mockGetMMKVObject(...args),
  setMMKVObject: (...args: [string, unknown]) => mockSetMMKVObject(...args),
}));

jest.mock('@utils/fetch/fetch', () => ({
  fetchTimeout: (...args: unknown[]) => mockFetchTimeout(...args),
}));

const loadIssueIndex = () => require('../issueIndex');

const jsonResponse = (body: unknown) => ({
  ok: true,
  json: jest.fn().mockResolvedValue(body),
});

const cacheIndex = (index: unknown) => {
  mockStorage.set(PLUGIN_ISSUE_INDEX, JSON.stringify(index));
};

describe('plugin issue index', () => {
  beforeEach(() => {
    jest.resetModules();
    mockStorage.clear();
    mockGetMMKVObject.mockReset();
    mockGetMMKVObject.mockImplementation((key: string) => {
      const stored = mockStorage.get(key);
      return stored === undefined ? undefined : JSON.parse(stored);
    });
    mockSetMMKVObject.mockReset();
    mockSetMMKVObject.mockImplementation((key: string, value: unknown) => {
      mockStorage.set(key, JSON.stringify(value));
    });
    mockFetchTimeout.mockReset();
  });

  it('keeps an unavailable index distinct from a loaded empty index after both requests fail', async () => {
    const { pluginIssueIndexStore, refreshPluginIssueIndex } = loadIssueIndex();
    mockFetchTimeout.mockRejectedValue(new Error('network unavailable'));

    expect(pluginIssueIndexStore.getState()).toEqual({
      index: undefined,
      isRefreshing: false,
      refreshFailed: false,
    });

    await expect(refreshPluginIssueIndex()).resolves.toBeUndefined();
    expect(pluginIssueIndexStore.getState()).toEqual({
      index: undefined,
      isRefreshing: false,
      refreshFailed: true,
    });
    expect(mockFetchTimeout.mock.calls.map(([url]) => url)).toEqual([
      primaryUrl,
      forkUrl,
    ]);
  });

  it('retains cached reports when both remote snapshots fail', async () => {
    cacheIndex(issueIndexFixture);
    const { pluginIssueIndexStore, refreshPluginIssueIndex } = loadIssueIndex();
    mockFetchTimeout.mockRejectedValue(new Error('network unavailable'));

    await refreshPluginIssueIndex();

    expect(pluginIssueIndexStore.getState()).toEqual({
      index: issueIndexFixture,
      isRefreshing: false,
      refreshFailed: true,
    });
    expect(mockStorage.get(PLUGIN_ISSUE_INDEX)).toBe(
      JSON.stringify(issueIndexFixture),
    );
  });

  it('hydrates and refreshes the whole snapshot without losing exact IDs or category zero', async () => {
    cacheIndex(issueIndexFixture);
    const { pluginIssueIndexStore, refreshPluginIssueIndex } = loadIssueIndex();
    const refreshedIndex = {
      galaxynovels: [[5, 2133]],
      novelupdates: [[0, 729, 736]],
      emptyplugin: [],
    };
    mockFetchTimeout.mockResolvedValue(jsonResponse(refreshedIndex));

    expect(pluginIssueIndexStore.getState()).toEqual({
      index: issueIndexFixture,
      isRefreshing: false,
      refreshFailed: false,
    });

    await refreshPluginIssueIndex();

    expect(pluginIssueIndexStore.getState().index).toEqual(refreshedIndex);
    expect(pluginIssueIndexStore.getState().index?.novelupdates).toEqual([
      [0, 729, 736],
    ]);
    expect(
      pluginIssueIndexStore.getState().index?.['GalaxyNovels'],
    ).toBeUndefined();
    expect(JSON.parse(mockStorage.get(PLUGIN_ISSUE_INDEX)!)).toEqual(
      refreshedIndex,
    );
    expect(mockFetchTimeout).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/LNReader/lnreader-plugins/issue-index/issue-index.min.json',
      { headers: { pragma: 'no-cache', 'cache-control': 'no-cache' } },
    );
  });

  it.each(['http', 'network', 'json', 'shape'])(
    'uses the fork snapshot when the primary request fails (%s)',
    async failure => {
      cacheIndex(issueIndexFixture);
      const { pluginIssueIndexStore, refreshPluginIssueIndex } =
        loadIssueIndex();
      const forkSnapshot: PluginIssueIndex = { forkplugin: [[4, 912]] };
      mockFetchTimeout.mockImplementation((url: string) => {
        if (url === forkUrl) {
          return Promise.resolve(jsonResponse(forkSnapshot));
        }
        if (failure === 'http') {
          return Promise.resolve({ ok: false, status: 404, json: jest.fn() });
        }
        if (failure === 'network') {
          return Promise.reject(new Error('network unavailable'));
        }
        if (failure === 'json') {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockRejectedValue(new SyntaxError('invalid JSON')),
          });
        }
        return Promise.resolve(jsonResponse({ galaxynovels: [[6, 0]] }));
      });

      await expect(refreshPluginIssueIndex()).resolves.toBeUndefined();

      expect(pluginIssueIndexStore.getState()).toEqual({
        index: forkSnapshot,
        isRefreshing: false,
        refreshFailed: false,
      });
      expect(mockStorage.get(PLUGIN_ISSUE_INDEX)).toBe(
        JSON.stringify(forkSnapshot),
      );
      expect(mockFetchTimeout.mock.calls.map(([url]) => url)).toEqual([
        primaryUrl,
        forkUrl,
      ]);
    },
  );

  it('rejects an invalid cached shape without preventing a later successful fetch', async () => {
    cacheIndex({ galaxynovels: [[7, 2133]] });
    const { pluginIssueIndexStore, refreshPluginIssueIndex } = loadIssueIndex();
    mockFetchTimeout.mockResolvedValue(jsonResponse(issueIndexFixture));

    expect(pluginIssueIndexStore.getState().index).toBeUndefined();

    await refreshPluginIssueIndex();

    expect(pluginIssueIndexStore.getState().index).toEqual(issueIndexFixture);
    expect(pluginIssueIndexStore.getState().refreshFailed).toBe(false);
  });

  it('ignores corrupt cached JSON and still fetches a valid snapshot', async () => {
    mockStorage.set(PLUGIN_ISSUE_INDEX, '{invalid json');
    const { pluginIssueIndexStore, refreshPluginIssueIndex } = loadIssueIndex();
    mockFetchTimeout.mockResolvedValue(jsonResponse(issueIndexFixture));

    expect(pluginIssueIndexStore.getState().index).toBeUndefined();

    await refreshPluginIssueIndex();

    expect(pluginIssueIndexStore.getState().index).toEqual(issueIndexFixture);
    expect(pluginIssueIndexStore.getState().refreshFailed).toBe(false);
  });

  it('keeps the old snapshot when persistence fails without fetching the fork', async () => {
    cacheIndex(issueIndexFixture);
    const { pluginIssueIndexStore, refreshPluginIssueIndex } = loadIssueIndex();
    const persistedBefore = mockStorage.get(PLUGIN_ISSUE_INDEX);
    mockFetchTimeout.mockResolvedValue(jsonResponse({ novelupdates: [] }));
    mockSetMMKVObject.mockImplementationOnce(() => {
      throw new Error('storage unavailable');
    });

    await expect(refreshPluginIssueIndex()).resolves.toBeUndefined();

    expect(pluginIssueIndexStore.getState()).toEqual({
      index: issueIndexFixture,
      isRefreshing: false,
      refreshFailed: true,
    });
    expect(mockStorage.get(PLUGIN_ISSUE_INDEX)).toBe(persistedBefore);
    expect(mockFetchTimeout.mock.calls.map(([url]) => url)).toEqual([
      primaryUrl,
    ]);
  });

  it('accepts an empty primary snapshot without fetching the fork', async () => {
    cacheIndex(issueIndexFixture);
    const { pluginIssueIndexStore, refreshPluginIssueIndex } = loadIssueIndex();
    mockFetchTimeout.mockResolvedValue(jsonResponse({}));

    await refreshPluginIssueIndex();

    expect(pluginIssueIndexStore.getState()).toEqual({
      index: {},
      isRefreshing: false,
      refreshFailed: false,
    });
    expect(JSON.parse(mockStorage.get(PLUGIN_ISSUE_INDEX)!)).toEqual({});
    expect(mockFetchTimeout.mock.calls.map(([url]) => url)).toEqual([
      primaryUrl,
    ]);
  });

  it('coalesces callers across primary and fork requests, then releases after failure', async () => {
    const { pluginIssueIndexStore, refreshPluginIssueIndex } = loadIssueIndex();
    let resolvePrimary!: (response: unknown) => void;
    let resolveFork!: (response: unknown) => void;
    const primaryResponse = new Promise<unknown>(resolve => {
      resolvePrimary = resolve;
    });
    const forkResponse = new Promise<unknown>(resolve => {
      resolveFork = resolve;
    });
    mockFetchTimeout
      .mockReturnValueOnce(primaryResponse)
      .mockReturnValueOnce(forkResponse);

    const firstRefresh = refreshPluginIssueIndex();
    const overlappingRefresh = refreshPluginIssueIndex();

    expect(pluginIssueIndexStore.getState().isRefreshing).toBe(true);
    expect(mockFetchTimeout.mock.calls.map(([url]) => url)).toEqual([
      primaryUrl,
    ]);

    resolvePrimary({ ok: false, status: 404, json: jest.fn() });
    await Promise.resolve();
    await Promise.resolve();
    expect(mockFetchTimeout.mock.calls.map(([url]) => url)).toEqual([
      primaryUrl,
      forkUrl,
    ]);

    resolveFork({ ok: false, status: 404, json: jest.fn() });
    await Promise.all([firstRefresh, overlappingRefresh]);

    expect(pluginIssueIndexStore.getState().refreshFailed).toBe(true);

    mockFetchTimeout.mockResolvedValue(jsonResponse(issueIndexFixture));
    await refreshPluginIssueIndex();

    expect(mockFetchTimeout.mock.calls.map(([url]) => url)).toEqual([
      primaryUrl,
      forkUrl,
      primaryUrl,
    ]);
    expect(pluginIssueIndexStore.getState()).toEqual({
      index: issueIndexFixture,
      isRefreshing: false,
      refreshFailed: false,
    });
  });
});
