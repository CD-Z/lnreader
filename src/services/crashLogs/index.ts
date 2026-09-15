import DeviceInfo from 'react-native-device-info';

import NativeCrashLogs from '@modules/native-crash-logs';
import { INSTALLED_PLUGINS_KEY } from '@plugins/constants';
import { PluginItem } from '@plugins/types';
import { getMMKVObject } from '@utils/mmkv/mmkv';
import { BUILD_TYPE, GIT_HASH, RELEASE_DATE } from '@env';
import { version } from '../../../package.json';
import { buildCrashReport } from './buildCrashReport';
import { formatException } from './formatException';
import { getProblematicPlugins } from './pluginDiagnostics';
import { getPendingCrash } from './nativeCrashState';

export {
  clearPendingCrash,
  getPendingCrash,
  restartApplication,
} from './nativeCrashState';

const AVAILABLE_PLUGINS_KEY = 'AVAILABLE_PLUGINS';

const readPlugins = (key: string): PluginItem[] => {
  try {
    return getMMKVObject<PluginItem[]>(key) ?? [];
  } catch {
    return [];
  }
};

export const shareCrashLogs = async (error?: unknown): Promise<void> => {
  if (!NativeCrashLogs) {
    throw new Error('Crash log sharing is unavailable in this build.');
  }

  const [manufacturer, buildId, apiLevel, supportedAbis, nativeDebugInfo] =
    await Promise.all([
      DeviceInfo.getManufacturer(),
      DeviceInfo.getBuildId(),
      DeviceInfo.getApiLevel(),
      DeviceInfo.supportedAbis(),
      NativeCrashLogs.getDebugInfo().catch(() => ({ webViewVersion: null })),
    ]);
  const pendingCrash = await getPendingCrash().catch(() => null);
  const problematicPlugins = getProblematicPlugins(
    readPlugins(INSTALLED_PLUGINS_KEY),
    readPlugins(AVAILABLE_PLUGINS_KEY),
  );

  const report = buildCrashReport({
    generatedAt: new Date().toISOString(),
    application: {
      packageName: DeviceInfo.getBundleId(),
      version,
      buildNumber: DeviceInfo.getBuildNumber(),
      buildType: BUILD_TYPE || 'Unknown',
      commitSha: GIT_HASH || 'Unknown',
      releaseDate: RELEASE_DATE || 'Unknown',
      jsEngine: 'HermesInternal' in globalThis ? 'Hermes' : 'Unknown',
    },
    device: {
      systemName: DeviceInfo.getSystemName(),
      systemVersion: DeviceInfo.getSystemVersion(),
      apiLevel,
      buildId,
      brand: DeviceInfo.getBrand(),
      manufacturer,
      model: DeviceInfo.getModel(),
      deviceId: DeviceInfo.getDeviceId(),
      supportedAbis,
      webViewVersion: nativeDebugInfo.webViewVersion,
    },
    problematicPlugins,
    exception: formatException(error),
    pendingCrash: pendingCrash ?? undefined,
  });

  await NativeCrashLogs.shareCrashLogs(report, 'E');
};
