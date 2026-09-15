import { PluginItem } from '@plugins/types';
import { getProblematicPlugins } from '../pluginDiagnostics';

const plugin = (overrides: Partial<PluginItem> = {}): PluginItem => ({
  id: 'source',
  name: 'Source',
  site: 'https://example.com',
  lang: 'English',
  version: '1.0.0',
  url: 'https://example.com/plugin.js',
  iconUrl: 'https://example.com/icon.png',
  ...overrides,
});

describe('getProblematicPlugins', () => {
  it('includes plugins with updates', () => {
    expect(
      getProblematicPlugins(
        [plugin({ hasUpdate: true })],
        [plugin({ version: '1.1.0' })],
      ),
    ).toEqual([
      expect.objectContaining({
        id: 'source',
        availableVersion: '1.1.0',
        statuses: ['Update available'],
      }),
    ]);
  });

  it('identifies plugins missing from a populated repository snapshot', () => {
    expect(
      getProblematicPlugins([plugin()], [plugin({ id: 'different-source' })])[0]
        .statuses,
    ).toContain('Not present in the latest repository snapshot');
  });

  it('does not mark every plugin missing when no snapshot exists', () => {
    expect(getProblematicPlugins([plugin()], [])).toEqual([]);
  });
});
