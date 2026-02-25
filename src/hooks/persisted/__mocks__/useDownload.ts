const mockDownloadQueue: any[] = [];
const mockDownloadingChapterIds = new Set<number>();

const useDownload = jest.fn(() => ({
  downloadQueue: mockDownloadQueue,
  downloadingChapterIds: mockDownloadingChapterIds,
  resumeDownload: jest.fn(),
  downloadChapter: jest.fn(),
  downloadChapters: jest.fn(),
  pauseDownload: jest.fn(),
  cancelDownload: jest.fn(),
}));

export default useDownload;
