import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PluginIssueGroup } from '@plugins/issueIndex';
import { usePluginIssueTitles } from '../usePluginIssueTitles';

const mockLoadPluginIssueTitle = jest.fn<
  Promise<string | undefined>,
  [issueNumber: number]
>();
const mockCachedTitles = new Map<number, string>();

jest.mock('@plugins/issueMetadata', () => ({
  getCachedPluginIssueTitle: (issueNumber: number) =>
    mockCachedTitles.get(issueNumber),
  loadPluginIssueTitle: (issueNumber: number) =>
    mockLoadPluginIssueTitle(issueNumber),
}));

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(complete => {
    resolve = complete;
  });
  return { promise, resolve };
};

describe('usePluginIssueTitles', () => {
  beforeEach(() => {
    mockLoadPluginIssueTitle.mockReset();
    mockCachedTitles.clear();
  });

  it('publishes cached and fourth titles while earlier requests remain pending', async () => {
    const requests = new Map<number, Deferred<string | undefined>>();
    mockCachedTitles.set(5, 'Cached title 5');
    mockLoadPluginIssueTitle.mockImplementation(issueNumber => {
      const request = deferred<string | undefined>();
      requests.set(issueNumber, request);
      return request.promise;
    });

    const groups: PluginIssueGroup[] = [[0, 1, 2, 3, 4, 5, 1, 4]];
    const { result } = renderHook(() => usePluginIssueTitles(groups));

    expect(
      mockLoadPluginIssueTitle.mock.calls.map(([number]) => number),
    ).toEqual([1, 2, 3, 4]);
    expect(result.current).toEqual({
      1: undefined,
      2: undefined,
      3: undefined,
      4: undefined,
      5: 'Cached title 5',
    });

    await act(async () => {
      requests.get(4)?.resolve('Title 4');
      await requests.get(4)?.promise;
    });
    await waitFor(() => expect(result.current[4]).toBe('Title 4'));
    expect(result.current[1]).toBeUndefined();
    expect(result.current[2]).toBeUndefined();
    expect(result.current[3]).toBeUndefined();
    expect(result.current[5]).toBe('Cached title 5');
    expect(mockLoadPluginIssueTitle).toHaveBeenCalledTimes(4);

    await act(async () => {
      requests.get(1)?.resolve('Title 1');
      requests.get(2)?.resolve(undefined);
      requests.get(3)?.resolve('Title 3');
      await Promise.all([
        requests.get(1)?.promise,
        requests.get(2)?.promise,
        requests.get(3)?.promise,
      ]);
    });
    await waitFor(() => expect(result.current[2]).toBeNull());
    expect(result.current).toEqual({
      1: 'Title 1',
      2: null,
      3: 'Title 3',
      4: 'Title 4',
      5: 'Cached title 5',
    });
  });
  it('settles undefined and rejected metadata as unavailable', async () => {
    mockLoadPluginIssueTitle
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('network unavailable'));
    const groups: PluginIssueGroup[] = [[0, 21, 22]];
    const { result } = renderHook(() => usePluginIssueTitles(groups));

    expect(result.current).toEqual({ 21: undefined, 22: undefined });
    await waitFor(() => expect(result.current).toEqual({ 21: null, 22: null }));
  });

  it('does not publish retired results or start queued requests after groups change', async () => {
    const requests = new Map<number, Deferred<string | undefined>>();
    mockLoadPluginIssueTitle.mockImplementation(issueNumber => {
      const request = deferred<string | undefined>();
      requests.set(issueNumber, request);
      return request.promise;
    });

    const oldGroups: PluginIssueGroup[] = [[0, 11, 12, 13, 14, 15, 16, 17]];
    const newGroups: PluginIssueGroup[] = [[3, 99]];
    const { result, rerender } = renderHook<
      Readonly<Partial<Record<number, string | null>>>,
      PluginIssueGroup[]
    >(groups => usePluginIssueTitles(groups), { initialProps: oldGroups });
    expect(
      mockLoadPluginIssueTitle.mock.calls.map(([number]) => number),
    ).toEqual([11, 12, 13, 14, 15, 16]);

    rerender(newGroups);
    expect(
      mockLoadPluginIssueTitle.mock.calls.map(([number]) => number),
    ).toEqual([11, 12, 13, 14, 15, 16, 99]);

    await act(async () => {
      requests.get(11)?.resolve('Retired title');
      requests.get(12)?.resolve('Retired title');
      requests.get(13)?.resolve('Retired title');
      requests.get(14)?.resolve('Retired title');
      requests.get(15)?.resolve('Retired title');
      requests.get(16)?.resolve('Retired title');
      await Promise.all(
        [11, 12, 13, 14, 15, 16].map(
          issueNumber => requests.get(issueNumber)?.promise,
        ),
      );
    });

    expect(
      mockLoadPluginIssueTitle.mock.calls.map(([number]) => number),
    ).toEqual([11, 12, 13, 14, 15, 16, 99]);
    expect(result.current).toEqual({ 99: undefined });
  });

  it('does no work for absent or empty groups', () => {
    const { rerender } = renderHook<
      Readonly<Partial<Record<number, string | null>>>,
      PluginIssueGroup[] | undefined
    >(groups => usePluginIssueTitles(groups), { initialProps: undefined });
    expect(mockLoadPluginIssueTitle).not.toHaveBeenCalled();

    rerender([]);
    expect(mockLoadPluginIssueTitle).not.toHaveBeenCalled();
  });
});
