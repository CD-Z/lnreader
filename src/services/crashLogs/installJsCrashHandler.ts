import { recordFatalJsCrash } from './nativeCrashState';

type GlobalErrorHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsApi = {
  getGlobalHandler(): GlobalErrorHandler;
  setGlobalHandler(handler: GlobalErrorHandler): void;
};

let installed = false;

export const installJsCrashHandler = (): void => {
  if (installed) return;

  const errorUtils = (
    globalThis as typeof globalThis & { ErrorUtils?: ErrorUtilsApi }
  ).ErrorUtils;
  if (!errorUtils) return;

  const defaultHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    if (isFatal) {
      try {
        recordFatalJsCrash(error);
      } catch {
        // Never prevent React Native's default fatal error handling.
      }
    }
    defaultHandler(error, isFatal);
  });
  installed = true;
};
