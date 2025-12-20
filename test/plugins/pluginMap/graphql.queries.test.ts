import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getExtensionPointsOverviewResolver,
  getPluginMapRequestsResolver,
  getPluginMapPollsResolver,
} from '../../../plugins/Plugin Map/api/graphql/queries';
import { TalawaGraphQLError } from '~/src/utilities/TalawaGraphQLError';

const mockCtx = {
  currentClient: { isAuthenticated: true },
  userId: 'user-1',
  user: { id: 'user-1', isSuperAdmin: true },
  drizzleClient: {
    select: vi.fn(),
  },
  organizationId: 'org-1',
  log: {
    error: vi.fn(),
    info: vi.fn(),
  },
};

describe('Plugin Map GraphQL Queries', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCtx.currentClient.isAuthenticated = true;

    // Standard mock chain
    const mockChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue([]),
    };

    mockCtx.drizzleClient.select.mockReturnValue(mockChain);

    // Customize the mock chain behavior to be awaitable and return arrays
    // This handles cases where the chain ends at different points
    mockChain.from.mockImplementation(() => mockChain);
    mockChain.where.mockImplementation(() => mockChain);
    mockChain.orderBy.mockImplementation(() => mockChain);
    mockChain.limit.mockImplementation(() => mockChain);

    // Make the mock chain thenable so it can be awaited at any point
    (mockChain as any).then = (resolve: any) => resolve([]);

    // For count queries specifically: select().from().where()
    // We want it to resolve to [{ count: 0 }] by default
    mockCtx.drizzleClient.select.mockImplementation((args: any) => {
      if (args && args.count) {
        const countChain = { ...mockChain };
        (countChain as any).then = (resolve: any) => resolve([{ count: 0 }]);
        return countChain;
      }
      return mockChain;
    });
  });

  describe('getExtensionPointsOverviewResolver', () => {
    it('should return overview data', async () => {
      const result = await getExtensionPointsOverviewResolver(
        {},
        {},
        mockCtx as any,
      );
      expect(result.extensionPoints).toBeDefined();
      expect(result.extensionPoints.length).toBeGreaterThan(0);
    });

    it('should throw error when unauthenticated', async () => {
      mockCtx.currentClient.isAuthenticated = false;
      await expect(
        getExtensionPointsOverviewResolver({}, {}, mockCtx as any),
      ).rejects.toThrow(TalawaGraphQLError);
    });
  });

  describe('getPluginMapRequestsResolver', () => {
    it('should fetch requests with pagination', async () => {
      mockCtx.drizzleClient.select
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue([{ id: '1' }]),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue([{ id: '1' }]),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 1 }]),
          }),
        });

      const args = {
        input: {
          extensionPoint: 'RA1',
          limit: 10,
          userId: 'user-1',
          userRole: 'admin',
          organizationId: 'org-1',
        },
      };

      const result = await getPluginMapRequestsResolver(
        null,
        args,
        mockCtx as any,
      );
      expect(result.requests.length).toBe(1);
      expect(result.totalCount).toBe(1);
    });

    it('should handle organizationId: null', async () => {
      const result = await getPluginMapRequestsResolver(
        null,
        { input: { organizationId: null } },
        mockCtx as any,
      );
      expect(result.requests).toBeDefined();
    });

    it('should throw error when unauthenticated', async () => {
      mockCtx.currentClient.isAuthenticated = false;
      await expect(
        getPluginMapRequestsResolver({}, {}, mockCtx as any),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should handle invalid input', async () => {
      const args = {
        input: {
          userId: 123, // Invalid type for string
        },
      };
      await expect(
        getPluginMapRequestsResolver(null, args as any, mockCtx as any),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should handle database error', async () => {
      mockCtx.drizzleClient.select.mockImplementation(() => {
        throw new Error('DB Error');
      });
      await expect(
        getPluginMapRequestsResolver(null, {}, mockCtx as any),
      ).rejects.toThrow(TalawaGraphQLError);
    });
  });

  describe('getPluginMapPollsResolver', () => {
    it('should fetch polls with filters', async () => {
      const args = {
        input: {
          userRole: 'user',
          organizationId: 'org-1',
        },
      };

      const result = await getPluginMapPollsResolver(
        null,
        args,
        mockCtx as any,
      );
      expect(result.polls).toBeDefined();
      expect(result.totalCount).toBeDefined();
    });

    it('should handle organizationId: null', async () => {
      const result = await getPluginMapPollsResolver(
        null,
        { input: { organizationId: null } },
        mockCtx as any,
      );
      expect(result.polls).toBeDefined();
    });

    it('should throw error when unauthenticated', async () => {
      mockCtx.currentClient.isAuthenticated = false;
      await expect(
        getPluginMapPollsResolver({}, {}, mockCtx as any),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should handle invalid input', async () => {
      const args = {
        input: {
          userRole: 123, // Invalid type for string
        },
      };
      await expect(
        getPluginMapPollsResolver(null, args as any, mockCtx as any),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should handle database error', async () => {
      mockCtx.drizzleClient.select.mockImplementation(() => {
        throw new Error('DB Error');
      });
      await expect(
        getPluginMapPollsResolver(null, {}, mockCtx as any),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should handle extensionPoint filter', async () => {
      const args = {
        input: {
          extensionPoint: 'RA1',
        },
      };
      const result = await getPluginMapPollsResolver(
        null,
        args,
        mockCtx as any,
      );
      expect(result.polls).toBeDefined();
    });
  });
});
