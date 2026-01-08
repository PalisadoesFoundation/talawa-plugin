import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Storage for the captured callback
let failedLoadingHandler:
  | ((lng: string, ns: string, msg: string) => void)
  | undefined;

vi.mock('i18next', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal<{ default: any }>();
  const mockI18n = {
    ...actual.default, // Preserve constants if any
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
    on: vi.fn((event, callback) => {
      if (event === 'failedLoading') {
        failedLoadingHandler = callback;
      }
    }),
    changeLanguage: vi.fn(),
  };
  return {
    __esModule: true,
    default: mockI18n,
  };
});

describe('Plugin Map i18n utils', () => {
  let i18nModule: typeof import('../../../../../plugins/pluginMap/admin/utils/i18n');

  beforeEach(async () => {
    vi.resetModules();
    failedLoadingHandler = undefined;
    // Import triggers execution
    i18nModule =
      await import('../../../../../plugins/pluginMap/admin/utils/i18n');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should register failedLoading handler', () => {
    expect(failedLoadingHandler).toBeDefined();
    expect(i18nModule.default.on).toHaveBeenCalledWith(
      'failedLoading',
      expect.any(Function),
    );
  });

  it('should log error and handle failedLoading', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(failedLoadingHandler).toBeDefined();

    // Invoke handler
    failedLoadingHandler!('fr', 'plugin-map', 'Network Error');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load plugin-map for language fr'),
      'Network Error',
    );
    expect(i18nModule.default.changeLanguage).toHaveBeenCalledWith('en');
  });

  it('should not switch language if already en', () => {
    vi.clearAllMocks();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    failedLoadingHandler!('en', 'plugin-map', 'Error');

    expect(consoleSpy).toHaveBeenCalled();
    // Should NOT call changeLanguage('en') because lng is 'en'
    expect(i18nModule.default.changeLanguage).not.toHaveBeenCalled();
  });
});
