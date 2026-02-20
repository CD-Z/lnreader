export const SHOW_LAST_UPDATE_TIME = 'SHOW_LAST_UPDATE_TIME';
export const LAST_UPDATE_TIME = 'LAST_UPDATE_TIME';

export const useLastUpdate = jest.fn(() => ({
  lastUpdateTime: null,
  showLastUpdateTime: true,
  setLastUpdateTime: jest.fn(),
  setShowLastUpdateTime: jest.fn(),
}));

export const useUpdates = jest.fn(() => ({
  isLoading: false,
  updatesOverview: [],
  getUpdates: jest.fn(),
  getDetailedUpdates: jest.fn(),
  lastUpdateTime: null,
  showLastUpdateTime: true,
  error: '',
}));
