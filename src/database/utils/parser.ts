import {
  CHAPTER_FILTER,
  CHAPTER_ORDER,
  ChapterFilterKey,
  ChapterOrderKey,
} from '@database/constants';
import { SQL, sql } from 'drizzle-orm';

/**
 * Convert a chapter order key into a raw SQL ordering fragment.
 *
 * @param order - Ordering key that selects which chapter sort expression to use
 * @returns A raw SQL fragment representing the corresponding ORDER BY expression; falls back to the default position-ascending expression if the key is not found
 */
export function chapterOrderToSQL(order: ChapterOrderKey) {
  const o = CHAPTER_ORDER[order] ?? CHAPTER_ORDER.positionAsc;
  return sql.raw(o);
}

/**
 * Builds an SQL condition fragment from an array of chapter filter keys.
 *
 * @param filter - Optional array of chapter filter keys to combine with `AND`; if omitted or empty, no filtering is applied
 * @returns An `SQL` fragment representing the combined `WHERE`-style condition for the provided filters; when `filter` is undefined or empty, returns an expression that evaluates to `true`
 */
export function chapterFilterToSQL(filter?: ChapterFilterKey[]) {
  if (!filter || !filter.length) return sql.raw('true');
  let filters: SQL | undefined;
  filter.forEach(value => {
    if (!filters) {
      filters = sql.raw(CHAPTER_FILTER[value]);
    } else {
      filters.append(sql.raw(` AND ${CHAPTER_FILTER[value]}`));
    }
  });
  return filters ?? sql.raw('true');
}