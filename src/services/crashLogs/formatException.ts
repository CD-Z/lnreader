import { getErrorChainMessages } from '@utils/error';

export const formatException = (error: unknown): string | undefined => {
  if (error === undefined || error === null) return undefined;
  if (!(error instanceof Error)) return String(error);

  const messages = getErrorChainMessages(error).join('\n\nCaused by: ');
  return `${messages}\n\n${error.stack ?? ''}`.trim();
};
