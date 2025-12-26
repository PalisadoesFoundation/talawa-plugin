import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Verify environment
// Verify environment - Only run setup if window is defined (JSDOM)
if (typeof window !== 'undefined') {
  // Mock React Toastify
  vi.mock('react-toastify', async () => {
    const actual =
      await vi.importActual<typeof import('react-toastify')>('react-toastify');
    return {
      ...actual,
      toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
      },
    };
  });

  // Mock Ant Design message
  vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');
    return {
      ...actual,
      message: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
        loading: vi.fn(() => vi.fn()), // Returns a dismissal function
      },
    };
  });

  // Mock Loader component
  vi.mock('components/Loader/Loader', () => ({
    default: () => 'Loading...',
  }));

  // Mock react-i18next
  vi.mock('react-i18next', async () => {
    const actual =
      await vi.importActual<typeof import('react-i18next')>('react-i18next');
    return {
      ...actual,
      useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => {
          // Simple interpolation support for {{variable}} syntax
          if (typeof options === 'object' && options !== null) {
            return Object.keys(options).reduce(
              (result, optionKey) =>
                result.replace(
                  new RegExp(`{{${optionKey}}}`, 'g'),
                  String(options[optionKey]),
                ),
              key,
            );
          }
          return key;
        },
        i18n: {
          changeLanguage: vi.fn(),
          language: 'en',
        },
      }),
      // Use real I18nextProvider from actual implementation
      I18nextProvider: actual.I18nextProvider,
      initReactI18next: actual.initReactI18next,
    };
  });

  // Mock useLocalstorage hook
  vi.mock('utils/useLocalstorage', () => ({
    default: () => ({
      getItem: (key: string) => {
        if (key === 'id') return 'test-user-id';
        return null;
      },
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }),
  }));

  // Mock window.matchMedia for Ant Design
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Razorpay global mock
  window.Razorpay = vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    on: vi.fn(),
  }));

  // Prevent actual script loading
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = (
    tagName: string,
    options?: ElementCreationOptions,
  ) => {
    if (tagName === 'script') {
      const script = originalCreateElement(
        tagName,
        options,
      ) as HTMLScriptElement;
      setTimeout(() => {
        script.onload?.(new Event('load'));
      }, 0);
      return script;
    }
    return originalCreateElement(tagName, options);
  };
}
