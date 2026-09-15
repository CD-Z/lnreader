import { requireOptionalNativeModule } from 'expo-modules-core';

export type NativeCrashDebugInfo = {
  webViewVersion: string | null;
};

export type NativeCrashLogsModule = {
  shareCrashLogs(report: string, logLevel: 'E' | 'V'): Promise<void>;
  recordJsCrash(stackTrace: string): void;
  getPendingCrash(): Promise<string | null>;
  clearPendingCrash(): Promise<void>;
  getDebugInfo(): Promise<NativeCrashDebugInfo>;
  restartApp(): void;
};

export default requireOptionalNativeModule<NativeCrashLogsModule>(
  'NativeCrashLogs',
);
