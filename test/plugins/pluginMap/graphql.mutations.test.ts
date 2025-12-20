import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    logPluginMapRequestResolver,
    clearPluginMapRequestsResolver,
    logPluginMapPollResolver,
    clearPluginMapPollsResolver
} from '../../../plugins/Plugin Map/api/graphql/mutations';
import { TalawaGraphQLError } from '~/src/utilities/TalawaGraphQLError';

const mockCtx = {
    currentClient: { isAuthenticated: true },
    userId: 'user-1',
    user: { id: 'user-1', isSuperAdmin: true },
    drizzleClient: {
        insert: vi.fn(),
        delete: vi.fn(),
        select: vi.fn(),
    },
    organizationId: 'org-1',
    log: {
        error: vi.fn(),
        info: vi.fn(),
    },
};

describe('Plugin Map GraphQL Mutations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCtx.currentClient.isAuthenticated = true;

        // Simpler but robust chaining
        const mockChain = {
            values: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: 'mock-id', pollNumber: 1 }]),
            where: vi.fn().mockResolvedValue({ rowCount: 5 }),
            from: vi.fn().mockReturnThis(),
        };

        mockCtx.drizzleClient.insert.mockReturnValue(mockChain);
        mockCtx.drizzleClient.delete.mockReturnValue(mockChain);
        mockCtx.drizzleClient.select.mockReturnValue(mockChain);

        // For the count check specifically
        mockChain.from.mockResolvedValue([{ count: 5 }]);
    });

    describe('logPluginMapRequestResolver', () => {
        it('should log a request successfully', async () => {
            const result = await logPluginMapRequestResolver(null, { input: { userId: '1', userRole: 'admin', extensionPoint: 'RA1' } }, mockCtx as any);
            expect(result.id).toBe('mock-id');
        });

        it('should throw error when unauthenticated', async () => {
            mockCtx.currentClient.isAuthenticated = false;
            await expect(logPluginMapRequestResolver(null, { input: { userId: '1', userRole: 'admin', extensionPoint: 'RA1' } }, mockCtx as any))
                .rejects.toThrow(TalawaGraphQLError);
        });

        it('should handle invalid input', async () => {
            const args = { input: { userId: 123 } };
            await expect(logPluginMapRequestResolver(null, args as any, mockCtx as any))
                .rejects.toThrow(TalawaGraphQLError);
        });

        it('should handle database error', async () => {
            mockCtx.drizzleClient.insert.mockImplementation(() => { throw new Error('DB Error'); });
            await expect(logPluginMapRequestResolver(null, { input: { userId: '1', userRole: 'admin', extensionPoint: 'RA1' } }, mockCtx as any))
                .rejects.toThrow(TalawaGraphQLError);
        });
    });

    describe('logPluginMapPollResolver', () => {
        it('should log a poll successfully', async () => {
            const result = await logPluginMapPollResolver(null, { input: { userId: '1', userRole: 'user', extensionPoint: 'RU1' } }, mockCtx as any);
            expect(result.id).toBe('mock-id');
        });

        it('should throw error when unauthenticated', async () => {
            mockCtx.currentClient.isAuthenticated = false;
            await expect(logPluginMapPollResolver(null, { input: { userId: '1', userRole: 'user', extensionPoint: 'RU1' } }, mockCtx as any))
                .rejects.toThrow(TalawaGraphQLError);
        });

        it('should handle invalid input', async () => {
            const args = { input: { userId: 123 } };
            await expect(logPluginMapPollResolver(null, args as any, mockCtx as any))
                .rejects.toThrow(TalawaGraphQLError);
        });

        it('should handle database error', async () => {
            mockCtx.drizzleClient.select.mockImplementation(() => { throw new Error('DB Error'); });
            await expect(logPluginMapPollResolver(null, { input: { userId: '1', userRole: 'user', extensionPoint: 'RU1' } }, mockCtx as any))
                .rejects.toThrow(TalawaGraphQLError);
        });
    });

    describe('clearPluginMapRequestsResolver', () => {
        it('should clear requests successfully', async () => {
            const result = await clearPluginMapRequestsResolver(null, {}, mockCtx as any);
            expect(result.success).toBe(true);
            expect(result.clearedCount).toBe(5);
        });

        it('should throw error when unauthenticated', async () => {
            mockCtx.currentClient.isAuthenticated = false;
            await expect(clearPluginMapRequestsResolver(null, {}, mockCtx as any))
                .rejects.toThrow(TalawaGraphQLError);
        });

        it('should handle database error', async () => {
            mockCtx.drizzleClient.select.mockImplementation(() => {
                throw new Error('DB Error');
            });
            await expect(clearPluginMapRequestsResolver(null, {}, mockCtx as any))
                .rejects.toThrow(TalawaGraphQLError);
        });
    });

    describe('clearPluginMapPollsResolver', () => {
        it('should clear polls successfully', async () => {
            const result = await clearPluginMapPollsResolver(null, {}, mockCtx as any);
            expect(result.success).toBe(true);
        });

        it('should throw error when unauthenticated', async () => {
            mockCtx.currentClient.isAuthenticated = false;
            await expect(clearPluginMapPollsResolver(null, {}, mockCtx as any))
                .rejects.toThrow(TalawaGraphQLError);
        });

        it('should handle database error', async () => {
            mockCtx.drizzleClient.delete.mockImplementation(() => { throw new Error('DB Error'); });
            await expect(clearPluginMapPollsResolver(null, {}, mockCtx as any))
                .rejects.toThrow(TalawaGraphQLError);
        });
    });
});
