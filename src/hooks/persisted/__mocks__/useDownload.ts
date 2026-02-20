export const DOWNLOAD_QUEUE = 'DOWNLOAD';
export const CHAPTER_DOWNLOADING = 'CHAPTER_DOWNLOADING';

const mockDownloadQueue: any[] = [];
const mockDownloadingChapterIds = new Set<number>();

export default function useDownload() {
  return {
    downloadQueue: mockDownloadQueue,
    downloadingChapterIds: mockDownloadingChapterIds,
    resumeDowndload: jest.fn(),
    downloadChapter: jest.fn(),
    downloadChapters: jest.fn(),
    pauseDownload: jest.fn(),
    cancelDownload: jest.fn(),
  };
}
