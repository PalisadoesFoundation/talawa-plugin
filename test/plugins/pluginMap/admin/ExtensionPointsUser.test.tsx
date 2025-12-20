/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { message } from 'antd';
import ExtensionPointsUser, {
  GET_PLUGIN_MAP_REQUESTS,
  LOG_PLUGIN_MAP_REQUEST,
} from '../../../../plugins/Plugin Map/admin/pages/ExtensionPointsUser';
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

// Aggressively mock antd components to avoid JSDOM CSS parsing issues with CSS variables
vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  const MockComponent = ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  );
  const MockTypography = ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  );
  (MockTypography as any).Title = ({ children, ...props }: any) => (
    <h2 {...props}>{children}</h2>
  );
  (MockTypography as any).Text = ({ children, ...props }: any) => (
    <span {...props}>{children}</span>
  );
  (MockTypography as any).Paragraph = ({ children, ...props }: any) => (
    <p {...props}>{children}</p>
  );

  return {
    ...actual,
    Button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
    Table: ({ dataSource, columns, pagination, ...props }: any) => (
      <div {...props}>
        <table>
          <tbody>
            {dataSource?.map((row: any, i: number) => (
              <tr key={i}>
                {columns?.map((col: any, j: number) => (
                  <td key={j}>
                    {col.render
                      ? col.render(row[col.dataIndex], row)
                      : row[col.dataIndex]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {pagination?.showTotal && (
          <div data-testid="pagination-total">
            {pagination.showTotal(dataSource?.length || 0, [
              1,
              dataSource?.length || 0,
            ])}
          </div>
        )}
      </div>
    ),
    Tag: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    Card: MockComponent,
    Space: MockComponent,
    Row: MockComponent,
    Col: MockComponent,
    Typography: MockTypography,
    Tooltip: ({ children, title }: any) => <div title={title}>{children}</div>,
    message: {
      ...actual.message,
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

// useLocalstorage is already mocked in reactTestSetup.ts

const mockRequests = [
  createMockRequest({
    id: 'req-1',
    pollNumber: 1,
    userRole: 'user',
    extensionPoint: 'RU1',
    organizationId: 'org-test',
    userId: 'test-user-id',
  }),
];

const standardMocks = [
  {
    request: {
      query: GET_PLUGIN_MAP_REQUESTS,
      variables: {
        input: {
          extensionPoint: 'RU1',
          userRole: 'user',
          organizationId: 'org-test',
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

describe('ExtensionPointsUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('should render the dashboard for a specific organization', async () => {
    renderWithProviders(<ExtensionPointsUser />, {
      mocks: standardMocks,
      initialEntries: ['/org/org-test/plugin-map'],
      path: '/org/:orgId/plugin-map',
    });

    expect(
      screen.getByText('RU1 - User Organization Extension Point'),
    ).toBeInTheDocument();

    await screen.findAllByText('1');

    // Verify pagination total (covers line 224)
    expect(screen.getByTestId('pagination-total')).toHaveTextContent(
      /1-1 of 1 requests/i,
    );
  });

  it('should log a new request on button click', async () => {
    const logMock = {
      request: {
        query: LOG_PLUGIN_MAP_REQUEST,
        variables: {
          input: {
            userId: 'test-user-id',
            userRole: 'user',
            organizationId: 'org-test',
            extensionPoint: 'RU1',
          },
        },
      },
      result: {
        data: {
          plugin_map_logPluginMapRequest: {
            id: 'req-new',
            pollNumber: 10,
            userId: 'test-user-id',
            userRole: 'user',
            organizationId: 'org-test',
            extensionPoint: 'RU1',
            createdAt: new Date().toISOString(),
            __typename: 'PluginMapPoll',
          },
        },
      },
    };

    renderWithProviders(<ExtensionPointsUser />, {
      mocks: [...standardMocks, logMock],
      initialEntries: ['/org/org-test/plugin-map'],
      path: '/org/:orgId/plugin-map',
    });

    // Wait for initial load
    await screen.findAllByText('1');

    const button = screen.getByRole('button', { name: /Request RU1/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith(
        expect.stringContaining('Request 10 logged successfully from RU1'),
      );
    });
  });

  it('should handle error when logging a request', async () => {
    const errorLogMock = {
      request: {
        query: LOG_PLUGIN_MAP_REQUEST,
        variables: {
          input: {
            userId: 'test-user-id',
            userRole: 'user',
            organizationId: 'org-test',
            extensionPoint: 'RU1',
          },
        },
      },
      error: new Error('Simulation Error'),
    };

    renderWithProviders(<ExtensionPointsUser />, {
      mocks: [...standardMocks, errorLogMock],
      initialEntries: ['/org/org-test/plugin-map'],
      path: '/org/:orgId/plugin-map',
    });

    await screen.findAllByText('1');
    const errButton = screen.getByRole('button', { name: /Request RU1/i });
    fireEvent.click(errButton);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Failed to log request');
    });
  });

  it('should redirect if orgId is missing', async () => {
    renderWithProviders(<ExtensionPointsUser />, {
      mocks: [],
      initialEntries: ['/plugin-map'],
      path: '/plugin-map',
    });

    expect(
      screen.queryByText('RU1 - User Organization Extension Point'),
    ).not.toBeInTheDocument();
  });

  it('should use unknown-user if userId is missing in localStorage', async () => {
    // Mock useLocalStorage to return null for 'id'
    vi.mocked(useLocalStorage).mockReturnValue({
      getItem: (key: string) => (key === 'id' ? null : null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    const unknownUserMocks = [
      {
        request: {
          query: GET_PLUGIN_MAP_REQUESTS,
          variables: {
            input: {
              extensionPoint: 'RU1',
              userRole: 'user',
              organizationId: 'org-test',
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
      {
        request: {
          query: LOG_PLUGIN_MAP_REQUEST,
          variables: {
            input: {
              userId: 'unknown-user',
              userRole: 'user',
              organizationId: 'org-test',
              extensionPoint: 'RU1',
            },
          },
        },
        result: {
          data: {
            plugin_map_logPluginMapRequest: {
              id: 'req-unknown',
              pollNumber: 77,
              userId: 'unknown-user',
              userRole: 'user',
              organizationId: 'org-test',
              extensionPoint: 'RU1',
              createdAt: new Date().toISOString(),
              __typename: 'PluginMapPoll',
            },
          },
        },
      },
    ];

    renderWithProviders(<ExtensionPointsUser />, {
      mocks: [...unknownUserMocks],
      initialEntries: ['/org/org-test/plugin-map'],
      path: '/org/:orgId/plugin-map',
    });

    await waitFor(() => {
      expect(screen.getByText(/Total requests: 0/i)).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /Request RU1/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith(
        expect.stringContaining('77'),
      );
    });

    vi.mocked(useLocalStorage).mockRestore();
  });

  it('should handle missing mutation data', async () => {
    const missingDataMock = {
      request: {
        query: LOG_PLUGIN_MAP_REQUEST,
        variables: expect.anything(),
      },
      result: {
        data: {
          plugin_map_logPluginMapRequest: null,
        },
      },
    };

    renderWithProviders(<ExtensionPointsUser />, {
      mocks: [...standardMocks, missingDataMock],
      initialEntries: ['/org/org-test/plugin-map'],
      path: '/org/:orgId/plugin-map',
    });

    await screen.findAllByText('1');
    const button = screen.getByRole('button', { name: /Request RU1/i });
    fireEvent.click(button);

    await flushPromises();
    expect(message.success).not.toHaveBeenCalled();
  });
});
