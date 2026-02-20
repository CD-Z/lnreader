const useTrackedNovel = jest.fn(() => ({
  trackedNovel: undefined,
  trackNovel: jest.fn(() => Promise.resolve()),
  untrackNovel: jest.fn(),
  updateTrackedNovel: jest.fn(() => Promise.resolve()),
  trackedNovels: {},
  getTrackedNovel: jest.fn(() => undefined),
  isTrackedOn: jest.fn(() => false),
  getTrackedOn: jest.fn(() => []),
  trackNovelOn: jest.fn(() => Promise.resolve()),
  untrackNovelFrom: jest.fn(),
  updateAllTrackedNovels: jest.fn(() => Promise.resolve()),
}));

export const TRACKED_NOVEL_PREFIX = 'TRACKED_NOVEL_PREFIX';
export const TRACKED_NOVEL_MIGRATION = 'TRACKED_NOVEL_MIGRATION_V1';

export default useTrackedNovel;
