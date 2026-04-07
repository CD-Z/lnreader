import { keyContract, KeyContractInput } from '../keyContract';
import {
  NOVEL_PAGE_INDEX_PREFIX,
  NOVEL_SETTINGS_PREFIX,
  LAST_READ_PREFIX,
} from '../types';

describe('keyContract', () => {
  describe('pageIndex', () => {
    it('generates legacy format key: ${PREFIX}_${pluginId}_${novelPath}', () => {
      const input: KeyContractInput = {
        pluginId: 'webnovel',
        novelPath: 'api/novels/xyz-123',
      };

      const result = keyContract.pageIndex(input);

      expect(result).toBe(
        'NOVEL_PAGE_INDEX_PREFIX_webnovel_api/novels/xyz-123',
      );
    });

    it('preserves pluginId and novelPath in exact order', () => {
      const input: KeyContractInput = {
        pluginId: 'archive',
        novelPath: 'light-novel/ch1',
      };

      const result = keyContract.pageIndex(input);

      expect(result).toContain(
        `${NOVEL_PAGE_INDEX_PREFIX}_archive_light-novel/ch1`,
      );
    });

    it('handles complex novelPath with special characters', () => {
      const input: KeyContractInput = {
        pluginId: 'source',
        novelPath: 'path/to/novel-with-dashes_and_underscores/123',
      };

      const result = keyContract.pageIndex(input);

      expect(result).toBe(
        `${NOVEL_PAGE_INDEX_PREFIX}_source_path/to/novel-with-dashes_and_underscores/123`,
      );
    });
  });

  describe('settings', () => {
    it('generates legacy format key: ${PREFIX}_${pluginId}_${novelPath}', () => {
      const input: KeyContractInput = {
        pluginId: 'webnovel',
        novelPath: 'api/novels/xyz-123',
      };

      const result = keyContract.settings(input);

      expect(result).toBe('NOVEL_SETTINGS_webnovel_api/novels/xyz-123');
    });

    it('preserves pluginId and novelPath in exact order', () => {
      const input: KeyContractInput = {
        pluginId: 'archive',
        novelPath: 'light-novel/ch1',
      };

      const result = keyContract.settings(input);

      expect(result).toContain(
        `${NOVEL_SETTINGS_PREFIX}_archive_light-novel/ch1`,
      );
    });
  });

  describe('lastRead', () => {
    it('generates legacy format key: ${PREFIX}_${pluginId}_${novelPath}', () => {
      const input: KeyContractInput = {
        pluginId: 'webnovel',
        novelPath: 'api/novels/xyz-123',
      };

      const result = keyContract.lastRead(input);

      expect(result).toBe('LAST_READ_PREFIX_webnovel_api/novels/xyz-123');
    });

    it('preserves pluginId and novelPath in exact order', () => {
      const input: KeyContractInput = {
        pluginId: 'archive',
        novelPath: 'light-novel/ch1',
      };

      const result = keyContract.lastRead(input);

      expect(result).toContain(`${LAST_READ_PREFIX}_archive_light-novel/ch1`);
    });
  });

  describe('key continuity across calls', () => {
    it('produces deterministic keys for same input', () => {
      const input: KeyContractInput = {
        pluginId: 'plugin-a',
        novelPath: 'novel/path',
      };

      const key1 = keyContract.pageIndex(input);
      const key2 = keyContract.pageIndex(input);

      expect(key1).toBe(key2);
    });

    it('differentiates keys by pluginId', () => {
      const base: KeyContractInput = {
        pluginId: 'plugin-a',
        novelPath: 'same/path',
      };

      const otherPluginId: KeyContractInput = {
        pluginId: 'plugin-b',
        novelPath: 'same/path',
      };

      const key1 = keyContract.pageIndex(base);
      const key2 = keyContract.pageIndex(otherPluginId);

      expect(key1).not.toBe(key2);
      expect(key2).toContain('plugin-b');
    });

    it('differentiates keys by novelPath', () => {
      const base: KeyContractInput = {
        pluginId: 'same-plugin',
        novelPath: 'novel/path-a',
      };

      const otherPath: KeyContractInput = {
        pluginId: 'same-plugin',
        novelPath: 'novel/path-b',
      };

      const key1 = keyContract.pageIndex(base);
      const key2 = keyContract.pageIndex(otherPath);

      expect(key1).not.toBe(key2);
      expect(key2).toContain('novel/path-b');
    });

    it('uses correct prefix constants from types', () => {
      const input: KeyContractInput = {
        pluginId: 'p1',
        novelPath: 'n1',
      };

      expect(keyContract.pageIndex(input)).toContain(NOVEL_PAGE_INDEX_PREFIX);
      expect(keyContract.settings(input)).toContain(NOVEL_SETTINGS_PREFIX);
      expect(keyContract.lastRead(input)).toContain(LAST_READ_PREFIX);
    });
  });
});
