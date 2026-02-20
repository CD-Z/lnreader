import React from 'react';

const defaultLibraryContext = {
  library: [],
  categories: [],
  isLoading: false,
  setCategories: () => {},
  refreshCategories: async () => {},
  setLibrary: () => {},
  novelInLibrary: () => false,
  switchNovelToLibrary: async () => {},
  refetchLibrary: () => {},
  setLibrarySearchText: () => {},
  settings: {
    sortOrder: undefined,
    filter: undefined,
    showDownloadBadges: false,
    showUnreadBadges: false,
    showNumberOfNovels: false,
    displayMode: undefined,
    novelsPerRow: undefined,
    incognitoMode: false,
    downloadedOnlyMode: false,
  },
};

export const LibraryContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <>{children}</>;
};

export const useLibraryContext = jest.fn(() => defaultLibraryContext);
