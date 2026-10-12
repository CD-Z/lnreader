const mockFetchTimeout = jest.fn();

jest.mock('@utils/fetch/fetch', () => ({
  fetchTimeout: (...args: unknown[]) => mockFetchTimeout(...args),
}));

const issueUrl = (issueNumber: number) =>
  `https://github.com/LNReader/lnreader-plugins/issues/${issueNumber}`;
const htmlResponse = (html: string) => ({
  ok: true,
  text: jest.fn().mockResolvedValue(html),
});
const loadIssueMetadata = () => require('../issueMetadata');

describe('plugin issue metadata', () => {
  beforeEach(() => {
    jest.resetModules();
    mockFetchTimeout.mockReset();
  });

  it('builds links to the upstream plugin repository', () => {
    expect(loadIssueMetadata().getPluginIssueUrl(2133)).toBe(
      'https://github.com/LNReader/lnreader-plugins/issues/2133',
    );
  });

  it('uses the first nonblank title, preferring Open Graph metadata', async () => {
    mockFetchTimeout.mockResolvedValue(
      htmlResponse(`
        <html><head>
          <meta property="og:title" content="  Open Graph title  ">
          <meta name="twitter:title" content="Twitter title">
          <title>Document title</title>
        </head><body><h1>Issue body should not be parsed</h1></body></html>
      `),
    );

    await expect(loadIssueMetadata().loadPluginIssueTitle(2133)).resolves.toBe(
      'Open Graph title',
    );
  });

  it('falls back to Twitter and then the document title when earlier values are blank', async () => {
    const { loadPluginIssueTitle } = loadIssueMetadata();
    mockFetchTimeout
      .mockResolvedValueOnce(
        htmlResponse(
          '<head><meta property="og:title" content="  "><meta name="twitter:title" content=" Twitter title "></head>',
        ),
      )
      .mockResolvedValueOnce(
        htmlResponse(
          '<head><meta property="og:title" content="\n"><meta name="twitter:title" content=" "><title> Document title </title></head>',
        ),
      );

    await expect(loadPluginIssueTitle(2134)).resolves.toBe('Twitter title');
    await expect(loadPluginIssueTitle(2135)).resolves.toBe('Document title');
  });

  it('decodes entities and collapses whitespace in the selected title', async () => {
    mockFetchTimeout.mockResolvedValue(
      htmlResponse(
        '<head><meta property="og:title" content=" A &amp; B\n  title "></head>',
      ),
    );

    await expect(loadIssueMetadata().loadPluginIssueTitle(2136)).resolves.toBe(
      'A & B title',
    );
  });

  it('removes only the requested issue decoration and preserves title punctuation', async () => {
    mockFetchTimeout
      .mockResolvedValueOnce(
        htmlResponse(
          '<head><meta property="og:title" content="GALAXYNOVELS. · Issue #2667 · lnreader/lnreader-plugins · GitHub"></head>',
        ),
      )
      .mockResolvedValueOnce(
        htmlResponse(
          '<head><title>Novel · Part 2 · Issue #2668 · LNREADER/LNREADER-PLUGINS</title></head>',
        ),
      )
      .mockResolvedValueOnce(
        htmlResponse(
          '<head><title>Novel · Part 2 · Issue #2669 · lnreader/lnreader-plugins-extra</title></head>',
        ),
      );
    const { loadPluginIssueTitle } = loadIssueMetadata();

    await expect(loadPluginIssueTitle(2667)).resolves.toBe('GALAXYNOVELS.');
    await expect(loadPluginIssueTitle(2668)).resolves.toBe('Novel · Part 2');
    await expect(loadPluginIssueTitle(2669)).resolves.toBe(
      'Novel · Part 2 · Issue #2669 · lnreader/lnreader-plugins-extra',
    );
  });

  it('returns undefined for an empty selected title', async () => {
    mockFetchTimeout.mockResolvedValue(
      htmlResponse(
        '<head><meta property="og:title" content=" &nbsp; "><title> </title></head>',
      ),
    );

    await expect(loadIssueMetadata().loadPluginIssueTitle(2137)).resolves.toBe(
      undefined,
    );
  });

  it('returns undefined for non-OK responses, missing metadata, and failed requests', async () => {
    mockFetchTimeout
      .mockResolvedValueOnce({ ok: false, text: jest.fn() })
      .mockResolvedValueOnce(
        htmlResponse('<html><head></head><body>None</body></html>'),
      )
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockRejectedValue(new Error('body unavailable')),
      });
    const { loadPluginIssueTitle } = loadIssueMetadata();

    await expect(loadPluginIssueTitle(2140)).resolves.toBeUndefined();
    await expect(loadPluginIssueTitle(2141)).resolves.toBeUndefined();
    await expect(loadPluginIssueTitle(2142)).resolves.toBeUndefined();
    await expect(loadPluginIssueTitle(2143)).resolves.toBeUndefined();
  });

  it('caches successful titles and sends the HTML accept header', async () => {
    mockFetchTimeout.mockResolvedValue(
      htmlResponse('<head><title>Cached title</title></head>'),
    );
    const { loadPluginIssueTitle } = loadIssueMetadata();

    await expect(loadPluginIssueTitle(2144)).resolves.toBe('Cached title');
    await expect(loadPluginIssueTitle(2144)).resolves.toBe('Cached title');

    expect(mockFetchTimeout).toHaveBeenCalledTimes(1);
    expect(mockFetchTimeout).toHaveBeenCalledWith(issueUrl(2144), {
      headers: { Accept: 'text/html' },
    });
  });

  it('coalesces overlapping loads for the same issue', async () => {
    let resolveResponse!: (response: {
      ok: boolean;
      text: () => Promise<string>;
    }) => void;
    const promise = new Promise<{
      ok: boolean;
      text: () => Promise<string>;
    }>(resolve => {
      resolveResponse = resolve;
    });
    mockFetchTimeout.mockReturnValue(promise);
    const { loadPluginIssueTitle } = loadIssueMetadata();

    const first = loadPluginIssueTitle(2145);
    const second = loadPluginIssueTitle(2145);
    expect(mockFetchTimeout).toHaveBeenCalledTimes(1);

    resolveResponse(htmlResponse('<head><title>Shared title</title></head>'));
    await expect(Promise.all([first, second])).resolves.toEqual([
      'Shared title',
      'Shared title',
    ]);
  });

  it('retries after an unsuccessful request', async () => {
    mockFetchTimeout
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(
        htmlResponse('<head><title>Recovered title</title></head>'),
      );
    const { loadPluginIssueTitle } = loadIssueMetadata();

    await expect(loadPluginIssueTitle(2146)).resolves.toBeUndefined();
    await expect(loadPluginIssueTitle(2146)).resolves.toBe('Recovered title');
    expect(mockFetchTimeout).toHaveBeenCalledTimes(2);
  });
});
