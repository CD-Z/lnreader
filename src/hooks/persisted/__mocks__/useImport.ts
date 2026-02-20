const mockQueue: any[] = [];

const mockUseImport = jest.fn(() => ({
  importQueue: mockQueue,
  importNovel: jest.fn(),
  resumeImport: jest.fn(),
  pauseImport: jest.fn(),
  cancelImport: jest.fn(),
}));

export default mockUseImport;
export { mockQueue };
