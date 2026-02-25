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

const setTracker = jest.fn();
const removeTracker = jest.fn();
const setActiveTracker = jest.fn();
const getTrackerAuth = jest.fn(() => undefined);
const isTrackerAuthenticated = jest.fn(() => false);
const getAuthenticatedTrackers = jest.fn(() => []);

const useTracker = jest.fn(() => ({
  tracker: null,
  setTracker,
  removeTracker,
  authenticatedTrackers: {},
  activeTrackerName: undefined,
  setActiveTracker,
  getTrackerAuth,
  isTrackerAuthenticated,
  getAuthenticatedTrackers,
}));

export default useTracker;
