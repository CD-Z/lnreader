import { createChapterTextCache } from '../novelStore.chapterState';

describe('novelStore.chapterState', () => {
  describe('createChapterTextCache', () => {
    describe('initial cache state', () => {
      it('returns an object with read/write/remove/clear methods', () => {
        const cache = createChapterTextCache();

        expect(cache).toHaveProperty('read');
        expect(cache).toHaveProperty('write');
        expect(cache).toHaveProperty('remove');
        expect(cache).toHaveProperty('clear');
        expect(typeof cache.read).toBe('function');
        expect(typeof cache.write).toBe('function');
        expect(typeof cache.remove).toBe('function');
        expect(typeof cache.clear).toBe('function');
      });

      it('returns undefined when reading a non-existent chapterId', () => {
        const cache = createChapterTextCache();

        expect(cache.read(1)).toBeUndefined();
        expect(cache.read(999)).toBeUndefined();
      });
    });

    describe('cache write and read operations', () => {
      it('stores and retrieves string values', () => {
        const cache = createChapterTextCache();
        const text = 'Chapter 1 content...';

        cache.write(1, text);

        expect(cache.read(1)).toBe(text);
      });

      it('stores and retrieves Promise values', async () => {
        const cache = createChapterTextCache();
        const promise = Promise.resolve('Async chapter text');

        cache.write(2, promise);

        const result = cache.read(2);
        expect(result).toBe(promise);
        expect(await result).toBe('Async chapter text');
      });

      it('maintains separate values for different chapterIds', () => {
        const cache = createChapterTextCache();

        cache.write(1, 'Chapter 1');
        cache.write(2, 'Chapter 2');
        cache.write(3, 'Chapter 3');

        expect(cache.read(1)).toBe('Chapter 1');
        expect(cache.read(2)).toBe('Chapter 2');
        expect(cache.read(3)).toBe('Chapter 3');
      });

      it('overwrites existing values when written with same chapterId', () => {
        const cache = createChapterTextCache();

        cache.write(1, 'First content');
        expect(cache.read(1)).toBe('First content');

        cache.write(1, 'Updated content');
        expect(cache.read(1)).toBe('Updated content');
      });

      it('supports mixing string and Promise values in same cache', () => {
        const cache = createChapterTextCache();

        cache.write(1, 'String chapter');
        cache.write(2, Promise.resolve('Promise chapter'));

        expect(cache.read(1)).toBe('String chapter');
        expect(cache.read(2)).toBeInstanceOf(Promise);
      });
    });

    describe('cache remove operation', () => {
      it('returns false when removing non-existent chapterId', () => {
        const cache = createChapterTextCache();

        expect(cache.remove(1)).toBe(false);
        expect(cache.remove(999)).toBe(false);
      });

      it('returns true when successfully removing existing entry', () => {
        const cache = createChapterTextCache();
        cache.write(1, 'Chapter content');

        expect(cache.remove(1)).toBe(true);
      });

      it('makes removed entry return undefined on read', () => {
        const cache = createChapterTextCache();
        cache.write(1, 'Chapter content');

        cache.remove(1);

        expect(cache.read(1)).toBeUndefined();
      });

      it('does not affect other cached entries when removing one', () => {
        const cache = createChapterTextCache();
        cache.write(1, 'Chapter 1');
        cache.write(2, 'Chapter 2');
        cache.write(3, 'Chapter 3');

        cache.remove(2);

        expect(cache.read(1)).toBe('Chapter 1');
        expect(cache.read(2)).toBeUndefined();
        expect(cache.read(3)).toBe('Chapter 3');
      });

      it('supports removing the same entry multiple times (second returns false)', () => {
        const cache = createChapterTextCache();
        cache.write(1, 'Chapter content');

        expect(cache.remove(1)).toBe(true);
        expect(cache.remove(1)).toBe(false);
      });
    });

    describe('cache clear operation', () => {
      it('returns undefined (void behavior) when clearing', () => {
        const cache = createChapterTextCache();
        cache.write(1, 'Chapter 1');
        cache.write(2, 'Chapter 2');

        const result = cache.clear();

        expect(result).toBeUndefined();
      });

      it('makes all cached entries return undefined after clear', () => {
        const cache = createChapterTextCache();
        cache.write(1, 'Chapter 1');
        cache.write(2, 'Chapter 2');
        cache.write(3, 'Chapter 3');

        cache.clear();

        expect(cache.read(1)).toBeUndefined();
        expect(cache.read(2)).toBeUndefined();
        expect(cache.read(3)).toBeUndefined();
      });

      it('allows writing new entries after clear', () => {
        const cache = createChapterTextCache();
        cache.write(1, 'Chapter 1');
        cache.clear();

        cache.write(2, 'New chapter');

        expect(cache.read(2)).toBe('New chapter');
        expect(cache.read(1)).toBeUndefined();
      });

      it('clears mixed content (strings and promises)', () => {
        const cache = createChapterTextCache();
        cache.write(1, 'String chapter');
        cache.write(2, Promise.resolve('Promise chapter'));

        cache.clear();

        expect(cache.read(1)).toBeUndefined();
        expect(cache.read(2)).toBeUndefined();
      });
    });

    describe('cache determinism and contract', () => {
      it('each call to createChapterTextCache returns independent instance', () => {
        const cache1 = createChapterTextCache();
        const cache2 = createChapterTextCache();

        cache1.write(1, 'Cache 1 content');
        cache2.write(1, 'Cache 2 content');

        expect(cache1.read(1)).toBe('Cache 1 content');
        expect(cache2.read(1)).toBe('Cache 2 content');
      });

      it('preserves insertion order semantics (last write wins)', () => {
        const cache = createChapterTextCache();

        cache.write(5, 'Fifth');
        cache.write(3, 'Third');
        cache.write(1, 'First');
        cache.write(3, 'Third Updated');

        expect(cache.read(5)).toBe('Fifth');
        expect(cache.read(3)).toBe('Third Updated');
        expect(cache.read(1)).toBe('First');
      });

      it('API contract: read always returns ChapterTextValue | undefined', () => {
        const cache = createChapterTextCache();

        const val1 = cache.read(1);
        expect(
          val1 === undefined ||
            typeof val1 === 'string' ||
            val1 instanceof Promise,
        ).toBe(true);

        cache.write(1, 'text');
        const val2 = cache.read(1);
        expect(typeof val2 === 'string' || val2 instanceof Promise).toBe(true);

        cache.write(2, Promise.resolve('text'));
        const val3 = cache.read(2);
        expect(val3 instanceof Promise).toBe(true);
      });
    });
  });
});
