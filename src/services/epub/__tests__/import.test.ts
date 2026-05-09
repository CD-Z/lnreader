import { importEpub } from '@services/epub/import';
import NativeFile from '@specs/NativeFile';
import NativeZipArchive from '@specs/NativeZipArchive';
import NativeEpub from '@specs/NativeEpub';
import { insertChapters, getNovelChapters } from '@database/queries/ChapterQueries';
import {
  updateNovelCategoryById,
  updateNovelInfo,
} from '@database/queries/NovelQueries';
import { dbManager } from '@database/db';

jest.mock('@database/db', () => ({
  dbManager: {
    write: jest.fn(async (callback: (tx: { update: jest.Mock }) => void) => {
      const tx = {
        update: jest.fn(() => ({
          set: jest.fn(() => ({
            where: jest.fn(() => ({
              run: jest.fn(),
            })),
          })),
        })),
      };
      return callback(tx);
    }),
  },
}));

jest.mock('@strings/translations', () => ({
  getString: jest.fn((key: string) => key),
}));

const setMeta = jest.fn((transformer: (meta: any) => any) => transformer({}));

const mockNativeFile = NativeFile as jest.Mocked<typeof NativeFile>;
const mockNativeZip = NativeZipArchive as jest.Mocked<typeof NativeZipArchive>;
const mockNativeEpub = NativeEpub as jest.Mocked<typeof NativeEpub>;
const mockInsertChapters = insertChapters as jest.MockedFunction<
  typeof insertChapters
>;
const mockGetNovelChapters = getNovelChapters as jest.MockedFunction<
  typeof getNovelChapters
>;
const mockUpdateNovelCategoryById =
  updateNovelCategoryById as jest.MockedFunction<
    typeof updateNovelCategoryById
  >;
const mockUpdateNovelInfo = updateNovelInfo as jest.MockedFunction<
  typeof updateNovelInfo
>;

const chapterTitleOnly = `<?xml version='1.0' encoding='utf-8'?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
  <head>
    <title>Unknown</title>
  </head>
  <body class="calibre">
    <p>prologue</p>
  </body>
</html>`;

const chapterContent = `<?xml version='1.0' encoding='utf-8'?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
  <head>
    <title>Unknown</title>
  </head>
  <body class="calibre">
    <p>The Problem-Solver</p>
  </body>
</html>`;

describe('importEpub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNativeFile.getConstants.mockReturnValue({
      ExternalDirectoryPath: '/mock/external',
      ExternalCachesDirectoryPath: '/mock/caches',
    });
    mockNativeFile.exists.mockReturnValue(true);
    mockNativeZip.unzip.mockResolvedValue();
    mockUpdateNovelCategoryById.mockResolvedValue();
    mockUpdateNovelInfo.mockResolvedValue();
  });

  it('batches chapter inserts and writes content using db ids', async () => {
    mockNativeEpub.parseNovelAndChapters.mockReturnValue({
      name: 'Test Novel',
      cover: null,
      summary: null,
      author: null,
      artist: null,
      chapters: [
        { name: 'prologue', path: '/mock/epub/1_index_split_000.html' },
        { name: 'prologue (2)', path: '/mock/epub/1_index_split_001.html' },
      ],
      cssPaths: [],
      imagePaths: [],
    });

    mockNativeFile.readFile.mockImplementation(path => {
      if (path === '/mock/epub/1_index_split_000.html') return chapterTitleOnly;
      if (path === '/mock/epub/1_index_split_001.html') return chapterContent;
      return '';
    });

    mockGetNovelChapters.mockResolvedValue([
      {
        id: 101,
        novelId: 1,
        path: '/mock/external/Novels/local/1/0',
        name: 'prologue',
        releaseTime: 'now',
        position: 0,
        page: '1',
        chapterNumber: 1,
      },
    ] as any);

    await importEpub(
      { uri: '/mock/source.epub', filename: 'source.epub' },
      setMeta,
    );

    expect(mockNativeZip.unzip).toHaveBeenCalled();
    expect(mockInsertChapters).toHaveBeenCalledTimes(1);
    expect(mockInsertChapters).toHaveBeenCalledWith(1, [
      {
        name: 'prologue',
        path: '/mock/external/Novels/local/1/0',
        releaseTime: expect.any(String),
        chapterNumber: 1,
        page: '1',
      },
    ]);
    expect(mockGetNovelChapters).toHaveBeenCalledWith(
      1,
      'positionAsc',
      undefined,
      undefined,
      1,
    );
    expect(mockNativeFile.writeFile).toHaveBeenCalledWith(
      '/mock/external/Novels/local/1/101/index.html',
      expect.stringContaining('The Problem-Solver'),
    );
    expect(dbManager.write).toHaveBeenCalled();
  });
});
