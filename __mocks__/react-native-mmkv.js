// Mock for react-native-mmkv (v3 uses NitroModules under the hood)
module.exports = {
  NitroModules: {
    createHybridObject: jest.fn(() => {
      // Return a mock object that won't be used since MMKV has its own mock
      return {};
    }),
  },
};
