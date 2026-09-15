import { PluginItem } from '@plugins/types';

export type PluginDiagnostic = {
  id: string;
  name: string;
  language: string;
  installedVersion: string;
  availableVersion?: string;
  statuses: string[];
};

export const getProblematicPlugins = (
  installedPlugins: readonly PluginItem[],
  availablePlugins: readonly PluginItem[],
): PluginDiagnostic[] => {
  const availableById = new Map(
    availablePlugins.map(plugin => [plugin.id, plugin]),
  );
  const hasRepositorySnapshot = availablePlugins.length > 0;

  return installedPlugins.flatMap(plugin => {
    const availablePlugin = availableById.get(plugin.id);
    const statuses: string[] = [];

    if (plugin.hasUpdate) {
      statuses.push('Update available');
    }
    if (hasRepositorySnapshot && !availablePlugin) {
      statuses.push('Not present in the latest repository snapshot');
    }
    if (statuses.length === 0) return [];

    return [
      {
        id: plugin.id,
        name: plugin.name,
        language: plugin.lang,
        installedVersion: plugin.version,
        availableVersion: availablePlugin?.version,
        statuses,
      },
    ];
  });
};
