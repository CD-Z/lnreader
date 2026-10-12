import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PluginIssueGroup } from '@plugins/issueIndex';
import { usePluginIssueTitles } from '../usePluginIssueTitles';

const mockLoadPluginIssueTitle = jest.fn<
  Promise<string | undefined>,
  [issueNumber: number]
>();

jest.mock('@plugins/issueMetadata', () => ({
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
  });

  it('deduplicates issue numbers and runs at most three workers', async () => {
    const requests = new Map<number, Deferred<string | undefined>>();
    let activeRequests = 0;
    let maxActiveRequests = 0;
    mockLoadPluginIssueTitle.mockImplementation(issueNumber => {
      const request = deferred<string | undefined>();
      requests.set(issueNumber, request);
      activeRequests++;
      maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
      return request.promise.finally(() => {
        activeRequests--;
      });
    });

    const groups: PluginIssueGroup[] = [
      [0, 1, 2, 3, 1],
      [4, 4, 5, 6, 7],
    ];
    const { result } = renderHook(() => usePluginIssueTitles(groups));

    expect(
      mockLoadPluginIssueTitle.mock.calls.map(([number]) => number),
    ).toEqual([1, 2, 3]);
    expect(maxActiveRequests).toBe(3);

    await act(async () => {
      requests.get(2)?.resolve('Title 2');
      await requests.get(2)?.promise;
    });
    await waitFor(() => expect(result.current[2]).toBe('Title 2'));
    expect(
      mockLoadPluginIssueTitle.mock.calls.map(([number]) => number),
    ).toEqual([1, 2, 3, 4]);
    expect(maxActiveRequests).toBe(3);

    await act(async () => {
      requests.get(1)?.resolve('Title 1');
      requests.get(3)?.resolve('Title 3');
      requests.get(4)?.resolve(undefined);
      await Promise.all([
        requests.get(1)?.promise,
        requests.get(3)?.promise,
        requests.get(4)?.promise,
      ]);
    });
    await waitFor(() =>
      expect(mockLoadPluginIssueTitle).toHaveBeenCalledTimes(7),
    );
    expect(
      mockLoadPluginIssueTitle.mock.calls.map(([number]) => number),
    ).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(
      new Set(mockLoadPluginIssueTitle.mock.calls.map(([number]) => number))
        .size,
    ).toBe(7);
    expect(maxActiveRequests).toBeLessThanOrEqual(3);
    expect(result.current).toEqual({
      1: 'Title 1',
      2: 'Title 2',
      3: 'Title 3',
    });
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
      Readonly<Partial<Record<number, string>>>,
      PluginIssueGroup[]
    >(groups => usePluginIssueTitles(groups), { initialProps: oldGroups });
    expect(
      mockLoadPluginIssueTitle.mock.calls.map(([number]) => number),
    ).toEqual([11, 12, 13]);

    rerender(newGroups);
    expect(
      mockLoadPluginIssueTitle.mock.calls.map(([number]) => number),
    ).toEqual([11, 12, 13, 99]);

    await act(async () => {
      requests.get(11)?.resolve('Retired title');
      requests.get(12)?.resolve('Retired title');
      requests.get(13)?.resolve('Retired title');
      await Promise.all([
        requests.get(11)?.promise,
        requests.get(12)?.promise,
        requests.get(13)?.promise,
      ]);
    });

    expect(
      mockLoadPluginIssueTitle.mock.calls.map(([number]) => number),
    ).toEqual([11, 12, 13, 99]);
    expect(result.current).toEqual({});
  });

  it('does no work for absent or empty groups', () => {
    const { rerender } = renderHook<
      Readonly<Partial<Record<number, string>>>,
      PluginIssueGroup[] | undefined
    >(groups => usePluginIssueTitles(groups), { initialProps: undefined });
    expect(mockLoadPluginIssueTitle).not.toHaveBeenCalled();

    rerender([]);
    expect(mockLoadPluginIssueTitle).not.toHaveBeenCalled();
  });
});
