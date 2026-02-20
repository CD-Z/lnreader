const mockCategories = [];

const useCategories = jest.fn(() => ({
  isLoading: false,
  categories: mockCategories,
  error: undefined,
}));

export default useCategories;
export { mockCategories };
