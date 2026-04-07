// Mock for react-native-nitro-modules in Jest environment
jest.mock('react-native-nitro-modules', () => ({
  __esModule: true,
  default: {
    createHybridObject: jest.fn(() => {
      // Return a mock object that won't be used since MMKV has its own mock
      return {};
    }),
  ];

module.exports = {
  MMKV,
  useMMKVString: createTupleHook(key => strings.get(key)),
  useMMKVNumber: createTupleHook(key => numbers.get(key)),
  useMMKVBoolean: createTupleHook(key => booleans.get(key)),
  useMMKVObject: createTupleHook(key => {
    const json = strings.get(key);
    if (!json) {
      return undefined;
    }

    try {
      return JSON.parse(json);
    } catch {
      return undefined;
    }
  }),
  NitroModules: {
    createHybridObject: jest.fn(() => ({})),
  },
}));
