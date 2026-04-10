export type { KeyContractInput as NovelPersistenceInput } from './keyContract';
export { keyContract } from './keyContract';
export {
  createNovelPersistenceBridge,
  novelPersistence,
  defaultNovelSettings,
  defaultPageIndex,
  LAST_READ_PREFIX,
  NOVEL_PAGE_INDEX_PREFIX,
  NOVEL_SETTINGS_PREFIX,
} from './persistence';
