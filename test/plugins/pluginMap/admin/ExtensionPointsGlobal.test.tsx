/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { message } from 'antd';
import ExtensionPointsGlobal from '../../../../plugins/Plugin Map/admin/pages/ExtensionPointsGlobal';
import {
  GET_PLUGIN_MAP_REQUESTS,
  LOG_PLUGIN_MAP_REQUEST,
} from '../../../../plugins/Plugin Map/admin/pages/ExtensionPointsDashboard';
import {
  renderWithProviders,
  createMockRequest,
  flushPromises,
} from './adminTestUtils';

import useLocalStorage from 'utils/useLocalstorage';

// Mock useLocalStorage
vi.mock('utils/useLocalstorage', () => ({
  default: vi.fn(() => ({
    getItem: (key: string) => (key === 'id' ? 'test-user-id' : null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })),
}));

// Aggressively mock antd components
// Aggressively mock antd components using shared helper
vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  const { createAntdMocks } =
    await vi.importActual<typeof import('./antdMocks')>('./antdMocks');
  return {
    ...actual,
    ...createAntdMocks(vi),
    message: {
      ...actual.message,
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

const mockRequests = [
  createMockRequest({
    id: 'req-global',
    pollNumber: 1,
    extensionPoint: 'RU2',
    userId: 'test-user-id',
  }),
];

const standardMocks = [
  {
    request: {
      query: GET_PLUGIN_MAP_REQUESTS,
      variables: {
        input: {
          extensionPoint: 'RU2',
          userRole: 'user',
          organizationId: null,
          userId: 'test-user-id',
        },
      },
    },
    result: {
      data: {
        plugin_map_getPluginMapRequests: {
          requests: mockRequests,
          totalCount: 1,
          hasMore: false,
          __typename: 'PluginMapRequestsResult',
        },
      },
    },
  },
];

describe('ExtensionPointsGlobal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    // Reset useLocalStorage to default authenticated state
    vi.mocked(useLocalStorage).mockReturnValue({
      getItem: (key: string) => (key === 'id' ? 'test-user-id' : null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    // Set default userId
    vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
      if (key === 'id') return 'test-user-id';
      return null;
    });
  });

  it('should render the global extension point title', async () => {
    renderWithProviders(<ExtensionPointsGlobal />, {
      mocks: standardMocks,
    });

    expect(
      screen.getByText('RU2 - User Global Extension Point'),
    ).toBeInTheDocument();
    await screen.findAllByText('1');
  });

  it('should log a new request on button click', async () => {
    const logMock = {
      request: {
        query: LOG_PLUGIN_MAP_REQUEST,
        variables: {
          input: {
            userId: 'test-user-id',
            userRole: 'user',
            organizationId: null,
            extensionPoint: 'RU2',
          },
        },
      },
      result: {
        data: {
          plugin_map_logPluginMapRequest: {
            id: 'req-new',
            pollNumber: 5,
            userId: 'test-user-id',
            userRole: 'user',
            organizationId: null,
            extensionPoint: 'RU2',
            createdAt: new Date().toISOString(),
            __typename: 'PluginMapPoll',
          },
        },
      },
    };

    renderWithProviders(<ExtensionPointsGlobal />, {
      mocks: [...standardMocks, logMock],
    });

    await screen.findAllByText('1');
    const button = screen.getByRole('button', { name: /Request RU2/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith(
        expect.stringContaining('Request 5 logged successfully from RU2'),
      );
    });
  });

  it('should handle error when logging a request', async () => {
    const errorLogMock = {
      request: {
        query: LOG_PLUGIN_MAP_REQUEST,
        variables: {
          input: {
            extensionPoint: 'RU2',
            userRole: 'user',
            organizationId: null,
            userId: 'user-1',
          },
        },
      },
      error: new Error('Simulation Error'),
    };

    renderWithProviders(<ExtensionPointsGlobal />, {
      mocks: [...standardMocks, errorLogMock],
    });

    await screen.findAllByText('1');
    const button = screen.getByRole('button', { name: /Request RU2/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Failed to log request');
    });
  });

  it('should use unknown-user if userId is missing', async () => {
    // Mock useLocalStorage to return null for 'id'
    vi.mocked(useLocalStorage).mockReturnValue({
      getItem: (key: string) => (key === 'id' ? null : null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    const mocks = [
      {
        request: {
          query: GET_PLUGIN_MAP_REQUESTS,
          variables: {
            input: {
              extensionPoint: 'RU2',
              userRole: 'user',
              organizationId: null,
              userId: 'unknown-user',
            },
          },
        },
        result: {
          data: {
            plugin_map_getPluginMapRequests: {
              requests: [],
              totalCount: 0,
              hasMore: false,
              __typename: 'PluginMapRequestsResult',
            },
          },
        },
      },
    ];

    const logMock = {
      request: {
        query: LOG_PLUGIN_MAP_REQUEST,
        variables: {
          input: {
            userId: 'unknown-user',
            userRole: 'user',
            organizationId: null,
            extensionPoint: 'RU2',
          },
        },
      },
      result: {
        data: {
          plugin_map_logPluginMapRequest: {
            id: 'req-unknown-global',
            pollNumber: 88,
            userId: 'unknown-user',
            userRole: 'user',
            organizationId: null,
            extensionPoint: 'RU2',
            createdAt: new Date().toISOString(),
            __typename: 'PluginMapPoll',
          },
        },
      },
    };

    renderWithProviders(<ExtensionPointsGlobal />, {
      mocks: [...mocks, logMock],
    });

    await waitFor(() => {
      expect(screen.getByText(/Total requests: 0/i)).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /Request RU2/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith(
        expect.stringContaining('88'),
      );
    });

    vi.mocked(useLocalStorage).mockRestore();
  });

  it('should handle missing mutation data', async () => {
    const missingDataMock = {
      request: {
        query: LOG_PLUGIN_MAP_REQUEST,
        variables: {
          input: {
            userId: 'user-1',
            userRole: 'user',
            organizationId: null,
            extensionPoint: 'RU2',
          },
        },
      },
      result: {
        data: {
          plugin_map_logPluginMapRequest: null,
        },
      },
    };

    renderWithProviders(<ExtensionPointsGlobal />, {
      mocks: [...standardMocks, missingDataMock],
    });

    await screen.findAllByText('1');
    const button = screen.getByRole('button', { name: /Request RU2/i });
    fireEvent.click(button);

    await flushPromises();
    expect(message.success).not.toHaveBeenCalled();
  });
});
