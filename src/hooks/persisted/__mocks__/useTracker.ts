export const TRACKERS = 'TRACKERS';
export const ACTIVE_TRACKER = 'ACTIVE_TRACKER';
export const TRACKED_NOVELS = 'TRACKED_NOVELS';

const trackers = {
  AniList: {},
  MyAnimeList: {},
  MangaUpdates: {},
  Kitsu: {},
};

export const getTracker = jest.fn(
  name => trackers[name as keyof typeof trackers],
);

export const getAllTrackerNames = jest.fn(() => Object.keys(trackers) as any[]);

export function useTracker() {
  return {
    tracker: null,
    setTracker: jest.fn(),
    removeTracker: jest.fn(),
    authenticatedTrackers: {},
    activeTrackerName: undefined,
    setActiveTracker: jest.fn(),
    getTrackerAuth: jest.fn(() => undefined),
    isTrackerAuthenticated: jest.fn(() => false),
    getAuthenticatedTrackers: jest.fn(() => []),
  };
}
