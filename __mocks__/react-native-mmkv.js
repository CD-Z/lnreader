jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getAllKeys: jest.fn(),
    clearAll: jest.fn(),
  })),
  useMMKVString: jest.fn().mockReturnValue(['', jest.fn()]),
  useMMKVNumber: jest.fn().mockReturnValue([0, jest.fn()]),
  useMMKVBoolean: jest.fn().mockReturnValue([false, jest.fn()]),
  useMMKVObject: jest.fn().mockReturnValue([{}, jest.fn()]),
}));
