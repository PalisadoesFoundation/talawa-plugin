/**
 * Mock for utils/useLocalstorage from talawa-admin
 * Used for testing admin UI components that depend on this hook
 */
const useLocalStorage = () => ({
  getItem: (key: string) => {
    if (key === 'id') return 'test-user-id';
    return null;
  },
  setItem: (_key: string, _value: unknown) => {},
  removeItem: (_key: string) => {},
});

export default useLocalStorage;
