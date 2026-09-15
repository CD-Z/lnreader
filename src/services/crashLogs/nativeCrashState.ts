import NativeCrashLogs from '@modules/native-crash-logs';
import { formatException } from './formatException';

export const getPendingCrash = async (): Promise<string | null> => {
  return (await NativeCrashLogs?.getPendingCrash()) ?? null;
};

export const clearPendingCrash = async (): Promise<void> => {
  await NativeCrashLogs?.clearPendingCrash();
};

export const restartApplication = async (
  fallback?: () => void,
): Promise<void> => {
  if (!NativeCrashLogs) {
    fallback?.();
    return;
  }

  try {
    await NativeCrashLogs.clearPendingCrash();
  } finally {
    NativeCrashLogs.restartApp();
  }
};

export const recordFatalJsCrash = (error: unknown): void => {
  const exception = formatException(error);
  if (!exception || !NativeCrashLogs) return;
  NativeCrashLogs.recordJsCrash(
    `Fatal JavaScript crash captured: ${new Date().toISOString()}\n\n${exception}`,
  );
};
