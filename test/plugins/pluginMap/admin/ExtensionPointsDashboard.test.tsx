/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { message } from 'antd';
import ExtensionPointsDashboard, {
    GET_PLUGIN_MAP_REQUESTS,
    LOG_PLUGIN_MAP_REQUEST,
} from '../../../../plugins/Plugin Map/admin/pages/ExtensionPointsDashboard';
import { renderWithProviders, createMockRequest, flushPromises } from './adminTestUtils';
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
    const MockComponent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
    const MockTypography = ({ children, ...props }: any) => <div {...props}>{children}</div>;
    (MockTypography as any).Title = ({ children, ...props }: any) => <h2 {...props}>{children}</h2>;
    (MockTypography as any).Text = ({ children, ...props }: any) => <span {...props}>{children}</span>;
    (MockTypography as any).Paragraph = ({ children, ...props }: any) => <p {...props}>{children}</p>;

    return {
        ...actual,
        Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
        Table: ({ dataSource, columns, pagination, ...props }: any) => (
            <div {...props}>
                <table>
                    <tbody>
                        {dataSource?.map((row: any, i: number) => (
                            <tr key={i}>
                                {columns?.map((col: any, j: number) => (
                                    <td key={j}>{col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {pagination?.showTotal && (
                    <div data-testid="pagination-total">
                        {pagination.showTotal(dataSource?.length || 0, [1, dataSource?.length || 0])}
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
        Spin: () => <div data-testid="loading-spinner">Loading...</div>,
        message: {
            ...actual.message,
            success: vi.fn(),
            error: vi.fn(),
        },
    };
});

// useLocalstorage is already mocked in reactTestSetup.ts

const mockRequests = [
    createMockRequest({ id: 'req-1', pollNumber: 1, extensionPoint: 'RA2' }),
    createMockRequest({ id: 'req-2', pollNumber: 2, extensionPoint: 'RA2' }),
];

const standardMocks = [
    {
        request: {
            query: GET_PLUGIN_MAP_REQUESTS,
            variables: {
                input: {
                    extensionPoint: 'RA2',
                    userRole: 'admin',
                    organizationId: null,
                    userId: 'test-user-id',
                },
            },
        },
        result: {
            data: {
                plugin_map_getPluginMapRequests: {
                    requests: mockRequests,
                    totalCount: 2,
                    hasMore: false,
                    __typename: 'PluginMapRequestsResult',
                },
            },
        },
    },
];

describe('ExtensionPointsDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
    });

    it('should render the dashboard title and description', async () => {
        renderWithProviders(<ExtensionPointsDashboard />, {
            mocks: standardMocks,
        });

        expect(
            screen.getByText('RA2 - Admin Global Extension Point'),
        ).toBeInTheDocument();
    });

    it('should render the request history table', async () => {
        renderWithProviders(<ExtensionPointsDashboard />, {
            mocks: standardMocks,
        });

        // Use findAllByText for the poll numbers
        const ones = await screen.findAllByText('1');
        expect(ones.length).toBeGreaterThan(0);

        const twos = await screen.findAllByText('2');
        expect(twos.length).toBeGreaterThan(0);

        // Verify pagination total (covers line 216)
        expect(screen.getByTestId('pagination-total')).toHaveTextContent(/1-2 of 2 requests/i);
    });

    it('should log a new request when the button is clicked', async () => {
        const logMock = {
            request: {
                query: LOG_PLUGIN_MAP_REQUEST,
                variables: {
                    input: {
                        userId: 'test-user-id',
                        userRole: 'admin',
                        organizationId: null,
                        extensionPoint: 'RA2',
                    },
                },
            },
            result: {
                data: {
                    plugin_map_logPluginMapRequest: {
                        id: 'req-new',
                        pollNumber: 3,
                        userId: 'test-user-id',
                        userRole: 'admin',
                        organizationId: null,
                        extensionPoint: 'RA2',
                        createdAt: new Date().toISOString(),
                        __typename: 'PluginMapPoll',
                    },
                },
            },
        };

        renderWithProviders(<ExtensionPointsDashboard />, {
            mocks: [...standardMocks, logMock],
        });

        // Wait for initial load
        await screen.findAllByText('1');

        const button = screen.getByRole('button', { name: /Request RA2/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(message.success).toHaveBeenCalledWith(
                expect.stringContaining('Request 3 logged successfully from RA2'),
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
                        userRole: 'admin',
                        organizationId: null,
                        extensionPoint: 'RA2',
                    },
                },
            },
            error: new Error('Simulation Error'),
        };

        renderWithProviders(<ExtensionPointsDashboard />, {
            mocks: [...standardMocks, errorLogMock],
        });

        await screen.findAllByText('1');
        const errButton = screen.getByRole('button', { name: /Request RA2/i });
        fireEvent.click(errButton);

        await waitFor(() => {
            expect(message.error).toHaveBeenCalledWith('Failed to log request');
        });
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
                            extensionPoint: 'RA2',
                            userRole: 'admin',
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
                        userRole: 'admin',
                        organizationId: null,
                        extensionPoint: 'RA2',
                    },
                },
            },
            result: {
                data: {
                    plugin_map_logPluginMapRequest: {
                        id: 'req-unknown',
                        pollNumber: 99,
                        userId: 'unknown-user',
                        userRole: 'admin',
                        organizationId: null,
                        extensionPoint: 'RA2',
                        createdAt: new Date().toISOString(),
                        __typename: 'PluginMapPoll',
                    },
                },
            },
        };

        renderWithProviders(<ExtensionPointsDashboard />, {
            mocks: [...unknownUserMocks, logMock],
        });

        await waitFor(() => {
            expect(screen.getByText(/Total requests: 0/i)).toBeInTheDocument();
        });

        const button = screen.getByRole('button', { name: /Request RA2/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(message.success).toHaveBeenCalledWith(expect.stringContaining('99'));
        });

        vi.mocked(useLocalStorage).mockRestore();
    });

    it('should handle missing mutation data gracefully', async () => {
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

        renderWithProviders(<ExtensionPointsDashboard />, {
            mocks: [...standardMocks, missingDataMock],
        });

        await screen.findAllByText('1');
        const button = screen.getByRole('button', { name: /Request RA2/i });
        fireEvent.click(button);

        // Should not show success message if data is null (line 103 branch)
        await flushPromises();
        expect(message.success).not.valueOf(); // Using valueOf/toHaveBeenCalled etc
        expect(message.success).not.toHaveBeenCalled();
    });

    it('should render user role tags correctly', async () => {
        const mixedRoleMocks = [
            createMockRequest({ id: 'req-admin', userRole: 'admin' }),
            createMockRequest({ id: 'req-user', userRole: 'user' }),
        ];

        const mocks = [
            {
                request: {
                    query: GET_PLUGIN_MAP_REQUESTS,
                    variables: {
                        input: {
                            extensionPoint: 'RA2',
                            userRole: 'admin',
                            organizationId: null,
                            userId: 'test-user-id',
                        },
                    },
                },
                result: {
                    data: {
                        plugin_map_getPluginMapRequests: {
                            requests: mixedRoleMocks,
                            totalCount: 2,
                            hasMore: false,
                            __typename: 'PluginMapRequestsResult',
                        },
                    },
                },
            },
        ];

        renderWithProviders(<ExtensionPointsDashboard />, {
            mocks,
        });

        await waitFor(() => {
            expect(screen.getByText('admin')).toBeInTheDocument();
            expect(screen.getByText('user')).toBeInTheDocument();
        });
    });
});
