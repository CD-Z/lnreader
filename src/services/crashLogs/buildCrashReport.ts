import { PluginDiagnostic } from './pluginDiagnostics';

export type CrashReportData = {
  generatedAt: string;
  application: {
    packageName: string;
    version: string;
    buildNumber: string;
    buildType: string;
    commitSha: string;
    releaseDate: string;
    jsEngine: string;
  };
  device: {
    systemName: string;
    systemVersion: string;
    apiLevel: number;
    buildId: string;
    brand: string;
    manufacturer: string;
    model: string;
    deviceId: string;
    supportedAbis: string[];
    webViewVersion: string | null;
  };
  problematicPlugins: PluginDiagnostic[];
  exception?: string;
  pendingCrash?: string;
};

const formatPlugins = (plugins: readonly PluginDiagnostic[]) => {
  if (plugins.length === 0) return 'None detected.';

  return plugins
    .map(plugin => {
      const availableVersion = plugin.availableVersion
        ? ` / Available: ${plugin.availableVersion}`
        : '';
      return [
        `- ${plugin.name} (${plugin.id}, ${plugin.language})`,
        `  Installed: ${plugin.installedVersion}${availableVersion}`,
        `  Status: ${plugin.statuses.join(', ')}`,
      ].join('\n');
    })
    .join('\n');
};

export const buildCrashReport = (data: CrashReportData): string => {
  const sections = [
    'LNReader diagnostic report',
    `Generated: ${data.generatedAt}`,
    '',
    '[Application]',
    `Package: ${data.application.packageName}`,
    `Version: ${data.application.version} (${data.application.buildNumber})`,
    `Build type: ${data.application.buildType}`,
    `Commit: ${data.application.commitSha}`,
    `Release date: ${data.application.releaseDate}`,
    `JavaScript engine: ${data.application.jsEngine}`,
    '',
    '[Device]',
    `Operating system: ${data.device.systemName} ${data.device.systemVersion} (SDK ${data.device.apiLevel}; build ${data.device.buildId})`,
    `Brand: ${data.device.brand}`,
    `Manufacturer: ${data.device.manufacturer}`,
    `Model: ${data.device.model} (${data.device.deviceId})`,
    `ABIs: ${data.device.supportedAbis.join(', ') || 'Unknown'}`,
    `WebView: ${data.device.webViewVersion ?? 'Unknown'}`,
    '',
    '[Problematic plugins]',
    formatPlugins(data.problematicPlugins),
  ];

  if (data.exception) {
    sections.push('', '[Current exception]', data.exception);
  }
  if (data.pendingCrash && data.pendingCrash !== data.exception) {
    sections.push('', '[Previous fatal crash]', data.pendingCrash);
  }

  sections.push(
    '',
    '[Privacy notice]',
    'This report does not intentionally include library data, cookies, plugin settings, or browsing history. Logcat may still contain data written by app or system components; review the file before sending it.',
  );

  return sections.join('\n');
};
