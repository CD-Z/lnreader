import type { BackupNovel, ChapterInfo } from '@database/types';

type NullableString = string | null;
type NullableNumber = number | null;
type NullableBoolean = boolean | null;

type CompactChapter = [
  number,
  string,
  string,
  NullableString,
  NullableBoolean,
  NullableBoolean,
  NullableString,
  NullableBoolean,
  NullableString,
  NullableNumber,
  NullableString,
  NullableNumber,
  NullableNumber,
  NullableString,
  NullableNumber,
];

type CompactNovel = {
  c: CompactChapter[];
  id: number;
  p: string;
  pi: string;
  n: string;
  co: NullableString;
  s: NullableString;
  a: NullableString;
  ar: NullableString;
  st: NullableString;
  g: NullableString;
  l: NullableBoolean;
  lo: NullableBoolean;
  t: NullableNumber;
  d: NullableNumber;
  u: NullableNumber;
  tc: NullableNumber;
  lr: NullableString;
  lu: NullableString;
};

type BackupNovelWithAggregates = BackupNovel & {
  chaptersDownloaded?: number | null;
  chaptersUnread?: number | null;
  totalChapters?: number | null;
  lastReadAt?: string | null;
  lastUpdatedAt?: string | null;
};

const NOVEL_KEYS = [
  'c',
  'id',
  'p',
  'pi',
  'n',
  'co',
  's',
  'a',
  'ar',
  'st',
  'g',
  'l',
  'lo',
  't',
  'd',
  'u',
  'tc',
  'lr',
  'lu',
] as const;

const isNullable = <T>(
  value: unknown,
  predicate: (value: unknown) => value is T,
): value is T | null => value === null || predicate(value);

const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isId = (value: unknown): value is number =>
  isNumber(value) && Number.isInteger(value);
const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

const nullableString = (value: unknown): value is NullableString =>
  isNullable(value, isString);
const nullableNumber = (value: unknown): value is NullableNumber =>
  isNullable(value, isNumber);
const nullableBoolean = (value: unknown): value is NullableBoolean =>
  isNullable(value, isBoolean);

const assertNovelKeys = (novel: Record<string, unknown>) => {
  const keys = Object.keys(novel).sort();
  const expected = [...NOVEL_KEYS].sort();
  if (
    keys.length !== expected.length ||
    keys.some((key, index) => key !== expected[index])
  ) {
    throw new Error('Invalid compact novel keys');
  }
};

const isCompactChapter = (value: unknown): value is CompactChapter => {
  if (!Array.isArray(value) || value.length !== 15) {
    return false;
  }

  return (
    isId(value[0]) &&
    isString(value[1]) &&
    isString(value[2]) &&
    nullableString(value[3]) &&
    nullableBoolean(value[4]) &&
    nullableBoolean(value[5]) &&
    nullableString(value[6]) &&
    nullableBoolean(value[7]) &&
    nullableString(value[8]) &&
    nullableNumber(value[9]) &&
    nullableString(value[10]) &&
    nullableNumber(value[11]) &&
    nullableNumber(value[12]) &&
    nullableString(value[13]) &&
    nullableNumber(value[14])
  );
};

const isCompactNovel = (value: unknown): value is CompactNovel => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const novel = value as Record<string, unknown>;
  assertNovelKeys(novel);
  return (
    Array.isArray(novel.c) &&
    novel.c.every(isCompactChapter) &&
    isId(novel.id) &&
    isString(novel.p) &&
    isString(novel.pi) &&
    isString(novel.n) &&
    nullableString(novel.co) &&
    nullableString(novel.s) &&
    nullableString(novel.a) &&
    nullableString(novel.ar) &&
    nullableString(novel.st) &&
    nullableString(novel.g) &&
    nullableBoolean(novel.l) &&
    nullableBoolean(novel.lo) &&
    nullableNumber(novel.t) &&
    nullableNumber(novel.d) &&
    nullableNumber(novel.u) &&
    nullableNumber(novel.tc) &&
    nullableString(novel.lr) &&
    nullableString(novel.lu)
  );
};

const nullable = <T>(value: T | undefined | null): T | null => value ?? null;

const encodeChapter = (chapter: ChapterInfo): CompactChapter => [
  chapter.id,
  chapter.path,
  chapter.name,
  nullable(chapter.releaseTime),
  nullable(chapter.bookmark),
  nullable(chapter.unread),
  nullable(chapter.readTime),
  nullable(chapter.isDownloaded),
  nullable(chapter.updatedTime),
  nullable(chapter.chapterNumber),
  nullable(chapter.page),
  nullable(chapter.position),
  nullable(chapter.progress),
  nullable(chapter.scanlator),
  nullable(chapter.timeSpent),
];

const encodeNovel = (novel: BackupNovel): CompactNovel => {
  const novelWithAggregates = novel as BackupNovelWithAggregates;
  return {
    c: novel.chapters.map(encodeChapter),
    id: novel.id,
    p: novel.path,
    pi: novel.pluginId,
    n: novel.name,
    co: nullable(novel.cover),
    s: nullable(novel.summary),
    a: nullable(novel.author),
    ar: nullable(novel.artist),
    st: nullable(novel.status),
    g: nullable(novel.genres),
    l: nullable(novel.inLibrary),
    lo: nullable(novel.isLocal),
    t: nullable(novel.totalPages),
    d: nullable(novelWithAggregates.chaptersDownloaded),
    u: nullable(novelWithAggregates.chaptersUnread),
    tc: nullable(novelWithAggregates.totalChapters),
    lr: nullable(novelWithAggregates.lastReadAt),
    lu: nullable(novelWithAggregates.lastUpdatedAt),
  };
};

const decodeNovel = (novel: CompactNovel): BackupNovel => {
  const decoded: BackupNovelWithAggregates = {
    id: novel.id,
    path: novel.p,
    pluginId: novel.pi,
    name: novel.n,
    cover: novel.co,
    summary: novel.s,
    author: novel.a,
    artist: novel.ar,
    status: novel.st,
    genres: novel.g,
    inLibrary: novel.l,
    isLocal: novel.lo,
    totalPages: novel.t,
    chaptersDownloaded: novel.d,
    chaptersUnread: novel.u,
    totalChapters: novel.tc,
    lastReadAt: novel.lr,
    lastUpdatedAt: novel.lu,
    chapters: novel.c.map(chapter => ({
      id: chapter[0],
      novelId: novel.id,
      path: chapter[1],
      name: chapter[2],
      releaseTime: chapter[3],
      bookmark: chapter[4],
      unread: chapter[5],
      readTime: chapter[6],
      isDownloaded: chapter[7],
      updatedTime: chapter[8],
      chapterNumber: chapter[9],
      page: chapter[10],
      position: chapter[11],
      progress: chapter[12],
      scanlator: chapter[13],
      timeSpent: chapter[14],
    })),
  };
  return decoded;
};

export const encodeNovelBatch = (novels: BackupNovel[]): CompactNovel[] => {
  if (novels.length > 100) {
    throw new Error('Compact novel batch exceeds 100 novels');
  }
  return novels.map(encodeNovel);
};

export const decodeNovelBatch = (payload: unknown): BackupNovel[] => {
  if (!Array.isArray(payload) || payload.length > 100) {
    throw new Error('Invalid compact novel batch');
  }
  return payload.map(value => {
    if (!isCompactNovel(value)) {
      throw new Error('Invalid compact novel record');
    }
    return decodeNovel(value);
  });
};
