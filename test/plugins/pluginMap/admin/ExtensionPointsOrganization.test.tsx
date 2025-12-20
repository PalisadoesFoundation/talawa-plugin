/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { message } from 'antd';
import ExtensionPointsOrganization from '../../../../plugins/Plugin Map/admin/pages/ExtensionPointsOrganization';
import { GET_PLUGIN_MAP_REQUESTS, LOG_PLUGIN_MAP_REQUEST } from '../../../../plugins/Plugin Map/admin/pages/ExtensionPointsDashboard';
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

// Aggressively mock antd components
vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');
    const MockComponent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
    const MockTypography = ({ children, ...props }: any) => <div {...props}>{children}</div>;
    (MockTypography as any).Title = ({ children, ...props }: any) => <h2 {...props}>{children}</h2>;
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
        message: {
            ...actual.message,
            success: vi.fn(),
            error: vi.fn(),
        },
    };
});

const mockRequests = [
    createMockRequest({ id: 'req-org', pollNumber: 1, extensionPoint: 'RA1', organizationId: 'org-123', userId: 'test-user-id' }),
];

const standardMocks = [
    {
        request: {
            query: GET_PLUGIN_MAP_REQUESTS,
            variables: {
                input: {
                    extensionPoint: 'RA1',
                    userRole: 'admin',
                    organizationId: 'org-123',
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

describe('ExtensionPointsOrganization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
            if (key === 'id') return 'test-user-id';
            return null;
        });
    });

    it('should render the organization extension point for org-123', async () => {
        renderWithProviders(<ExtensionPointsOrganization />, {
            mocks: standardMocks,
            initialEntries: ['/org/org-123/plugin-map'],
            path: '/org/:orgId/plugin-map',
        });

        expect(screen.getByText('RA1 - Admin Organization Extension Point')).toBeInTheDocument();
        expect(screen.getByText('org-123')).toBeInTheDocument();
        await screen.findAllByText('1');
    });

    it('should redirect if orgId is missing', async () => {
        renderWithProviders(<ExtensionPointsOrganization />, {
            mocks: [],
            initialEntries: ['/plugin-map'],
            path: '/plugin-map',
        });

        expect(screen.queryByText('RA1 - Admin Organization Extension Point')).not.toBeInTheDocument();
    });

    it('should log a new request on button click', async () => {
        const logMock = {
            request: {
                query: LOG_PLUGIN_MAP_REQUEST,
                variables: {
                    input: {
                        userId: 'test-user-id',
                        userRole: 'admin',
                        organizationId: 'org-123',
                        extensionPoint: 'RA1',
                    },
                },
            },
            result: {
                data: {
                    plugin_map_logPluginMapRequest: {
                        id: 'req-new',
                        pollNumber: 7,
                        userId: 'test-user-id',
                        userRole: 'admin',
                        organizationId: 'org-123',
                        extensionPoint: 'RA1',
                        createdAt: new Date().toISOString(),
                        __typename: 'PluginMapPoll',
                    },
                },
            },
        };

        renderWithProviders(<ExtensionPointsOrganization />, {
            mocks: [...standardMocks, logMock],
            initialEntries: ['/org/org-123/plugin-map'],
            path: '/org/:orgId/plugin-map',
        });

        await screen.findAllByText('1');
        const button = screen.getByRole('button', { name: /Request RA1/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(message.success).toHaveBeenCalledWith(
                expect.stringContaining('Request 7 logged successfully from RA1'),
            );
        });
    });

    it('should handle error when logging a request', async () => {
        const errorLogMock = {
            request: {
                query: LOG_PLUGIN_MAP_REQUEST,
                variables: expect.anything(),
            },
            error: new Error('Simulation Error'),
        };

        renderWithProviders(<ExtensionPointsOrganization />, {
            mocks: [...standardMocks, errorLogMock],
            initialEntries: ['/org/org-123/plugin-map'],
            path: '/org/:orgId/plugin-map',
        });

        await screen.findAllByText('1');
        const button = screen.getByRole('button', { name: /Request RA1/i });
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

        const unknownUserMocks = [
            {
                request: {
                    query: GET_PLUGIN_MAP_REQUESTS,
                    variables: {
                        input: {
                            extensionPoint: 'RA1',
                            userRole: 'admin',
                            organizationId: 'org-123',
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
                            userRole: 'admin',
                            organizationId: 'org-123',
                            extensionPoint: 'RA1',
                        },
                    },
                },
                result: {
                    data: {
                        plugin_map_logPluginMapRequest: {
                            id: 'req-unknown-org',
                            pollNumber: 66,
                            userId: 'unknown-user',
                            userRole: 'admin',
                            organizationId: 'org-123',
                            extensionPoint: 'RA1',
                            createdAt: new Date().toISOString(),
                            __typename: 'PluginMapPoll',
                        },
                    },
                },
            },
        ];

        renderWithProviders(<ExtensionPointsOrganization />, {
            mocks: unknownUserMocks,
            initialEntries: ['/org/org-123/plugin-map'],
            path: '/org/:orgId/plugin-map',
        });

        await waitFor(() => {
            expect(screen.getByText(/Total requests: 0/i)).toBeInTheDocument();
        });

        const button = screen.getByRole('button', { name: /Request RA1/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(message.success).toHaveBeenCalledWith(expect.stringContaining('66'));
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

        renderWithProviders(<ExtensionPointsOrganization />, {
            mocks: [...standardMocks, missingDataMock],
            initialEntries: ['/org/org-123/plugin-map'],
            path: '/org/:orgId/plugin-map',
        });

        await screen.findAllByText('1');
        const button = screen.getByRole('button', { name: /Request RA1/i });
        fireEvent.click(button);

        await flushPromises();
        expect(message.success).not.toHaveBeenCalled();
    });
});
