import {
  NOVEL_PAGE_INDEX_PREFIX,
  NOVEL_SETTINGS_PREFIX,
  LAST_READ_PREFIX,
} from '../types';

export interface KeyContractInput {
  pluginId: string;
  novelPath: string;
}

export const keyContract = {
  pageIndex: (input: KeyContractInput): string => {
    return `${NOVEL_PAGE_INDEX_PREFIX}_${input.pluginId}_${input.novelPath}`;
  },

  settings: (input: KeyContractInput): string => {
    return `${NOVEL_SETTINGS_PREFIX}_${input.pluginId}_${input.novelPath}`;
  },

  lastRead: (input: KeyContractInput): string => {
    return `${LAST_READ_PREFIX}_${input.pluginId}_${input.novelPath}`;
  },
};
