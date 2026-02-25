const mockUsePlugins = jest.fn(() => ({
  filteredAvailablePlugins: [],
  filteredInstalledPlugins: [],
  lastUsedPlugin: null,
  pinnedPlugins: [],
  languagesFilter: ['English'],
  setLastUsedPlugin: jest.fn(),
  refreshPlugins: jest.fn(),
  toggleLanguageFilter: jest.fn(),
  installPlugin: jest.fn(),
  uninstallPlugin: jest.fn(),
  updatePlugin: jest.fn(),
  togglePinPlugin: jest.fn(),
  isPinned: jest.fn(() => false),
}));

export default mockUsePlugins;
