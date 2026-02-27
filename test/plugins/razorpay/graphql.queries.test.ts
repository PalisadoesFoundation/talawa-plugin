import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRazorpayConfigResolver,
  getOrganizationTransactionsResolver,
  getUserTransactionsResolver,
  getOrganizationTransactionStatsResolver,
  getUserTransactionStatsResolver,
  registerRazorpayQueries,
} from '../../../plugins/razorpay/api/graphql/queries';
import { expectTransaction, expectConfig } from './graphql.queries.helpers';
import { TalawaGraphQLError } from '~/src/utilities/TalawaGraphQLError';
import {
  createMockRazorpayContext,
  createMockConfig,
  createMockTransaction,
  setupContext,
  setupFindFirstWithCallback,
  orgTransactionsArgs,
  userTransactionsArgs,
  orgStatsArgs,
  userStatsArgs,
} from './graphql.queries.mock';
vi.mock('razorpay');

describe('Razorpay GraphQL Queries', () => {
  let ctx: ReturnType<typeof setupContext>;
  const DEFAULT_CONFIG = {
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    isEnabled: false,
    testMode: true,
    currency: 'INR',
    description: 'Donation to organization',
  };
  beforeEach(() => {
    ctx = setupContext();
  });
  describe('getRazorpayConfigResolver', () => {
    it('returns config for super admin', async () => {
      ctx.user.isSuperAdmin = true;
      const config = createMockConfig();
      ctx.drizzleClient.limit.mockResolvedValue([config]);
      const result = await getRazorpayConfigResolver({}, {}, ctx);
      expect(result).toEqual(expectConfig(config));
      expect(ctx.drizzleClient.select).toHaveBeenCalled();
    });

    it('throws for non-super-admin', async () => {
      const nonAdmin = createMockRazorpayContext({ userRole: 'user' });
      await expect(getRazorpayConfigResolver({}, {}, nonAdmin)).rejects.toThrow(
        TalawaGraphQLError,
      );
    });

    it('returns default config when not found', async () => {
      ctx.user = { isSuperAdmin: true };
      ctx.drizzleClient.limit.mockResolvedValue([]);
      const result = await getRazorpayConfigResolver({}, {}, ctx);
      expect(result).toEqual(DEFAULT_CONFIG);
    });

    it('throws when user is not authenticated', async () => {
      ctx.currentClient.isAuthenticated = false;
      await expect(getRazorpayConfigResolver({}, {}, ctx)).rejects.toThrow(
        TalawaGraphQLError,
      );
    });

    it('throws when currentUser not found in DB', async () => {
      ctx.user.isSuperAdmin = false;
      ctx.drizzleClient.query = {
        usersTable: { findFirst: vi.fn().mockResolvedValue(null) },
      };
      await expect(getRazorpayConfigResolver({}, {}, ctx)).rejects.toThrow(
        TalawaGraphQLError,
      );
    });

    it('throws TalawaGraphQLError on database error', async () => {
      ctx.user.isSuperAdmin = true;
      ctx.drizzleClient.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });
      await expect(getRazorpayConfigResolver({}, {}, ctx)).rejects.toThrow(
        TalawaGraphQLError,
      );
    });

    it('returns default when configItem is undefined', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([undefined]);
      const result = await getRazorpayConfigResolver({}, {}, ctx);
      expect(result).toEqual(DEFAULT_CONFIG);
    });
  });
  describe('getOrganizationTransactionsResolver', () => {
    const args = orgTransactionsArgs;

    it('returns organization transactions for admin', async () => {
      const txns = [
        createMockTransaction(),
        createMockTransaction({ id: 'transaction-2' }),
      ];
      ctx.drizzleClient.execute.mockResolvedValue(txns);
      const result = await getOrganizationTransactionsResolver({}, args, ctx);
      expect(result).toEqual(txns.map(expectTransaction));
    });

    it('filters by status', async () => {
      const txns = [createMockTransaction({ status: 'captured' })];
      ctx.drizzleClient.execute.mockResolvedValue(txns);
      const result = await getOrganizationTransactionsResolver(
        {},
        { ...args, status: 'captured' },
        ctx,
      );
      expect(ctx.drizzleClient.where).toHaveBeenCalled();
      expect(result).toEqual(txns.map(expectTransaction));
    });

    it('filters by date range', async () => {
      const txns = [createMockTransaction()];
      ctx.drizzleClient.execute.mockResolvedValue(txns);
      const result = await getOrganizationTransactionsResolver(
        {},
        { ...args, dateFrom: '2024-01-01', dateTo: '2024-12-31' },
        ctx,
      );
      expect(result).toEqual(txns.map(expectTransaction));
    });

    it('applies pagination', async () => {
      ctx.drizzleClient.execute.mockResolvedValue([createMockTransaction()]);
      await getOrganizationTransactionsResolver(
        {},
        { ...args, limit: 5, offset: 10 },
        ctx,
      );
      expect(ctx.drizzleClient.limit).toHaveBeenCalledWith(5);
      expect(ctx.drizzleClient.offset).toHaveBeenCalledWith(10);
    });

    it('throws for non-admin user', async () => {
      const nonAdmin = createMockRazorpayContext({ userRole: 'user' });
      await expect(
        getOrganizationTransactionsResolver({}, args, nonAdmin),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('throws for unauthenticated user', async () => {
      ctx.currentClient.isAuthenticated = false;
      await expect(
        getOrganizationTransactionsResolver({}, args, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('returns empty array when no transactions', async () => {
      ctx.drizzleClient.execute.mockResolvedValue([]);
      const result = await getOrganizationTransactionsResolver({}, args, ctx);
      expect(result).toEqual([]);
    });

    it('throws for invalid organizationId type', async () => {
      await expect(
        getOrganizationTransactionsResolver(
          {},
          { ...args, organizationId: 123 as unknown as string },
          ctx,
        ),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('throws for invalid limit type', async () => {
      await expect(
        getOrganizationTransactionsResolver(
          {},
          { ...args, limit: 'invalid' as unknown as number },
          ctx,
        ),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('throws Forbidden when DB user is non-admin', async () => {
      ctx.drizzleClient.query = {
        usersTable: {
          findFirst: vi
            .fn()
            .mockResolvedValue({ id: 'user-123', role: 'user' }),
        },
      };
      await expect(
        getOrganizationTransactionsResolver({}, args, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('throws TalawaGraphQLError on database error', async () => {
      ctx.drizzleClient.select.mockImplementation(() => {
        throw new Error('Database query failed');
      });
      await expect(
        getOrganizationTransactionsResolver({}, args, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });
  });
  describe('getUserTransactionsResolver', () => {
    const args = userTransactionsArgs;

    it('returns user transactions for own account', async () => {
      const txns = [createMockTransaction()];
      ctx.drizzleClient.execute.mockResolvedValue(txns);
      const result = await getUserTransactionsResolver({}, args, ctx);
      expect(result).toEqual(txns.map(expectTransaction));
    });

    it('allows admin to view any user transactions', async () => {
      const txns = [createMockTransaction({ userId: 'other-user' })];
      ctx.drizzleClient.execute.mockResolvedValue(txns);
      const result = await getUserTransactionsResolver(
        {},
        { ...args, userId: 'other-user' },
        ctx,
      );
      expect(result).toEqual(txns.map(expectTransaction));
    });

    it('throws when non-admin views other user transactions', async () => {
      const nonAdmin = createMockRazorpayContext({ userRole: 'user' });
      await expect(
        getUserTransactionsResolver(
          {},
          { ...args, userId: 'other-user' },
          nonAdmin,
        ),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('filters by organization', async () => {
      const txns = [createMockTransaction()];
      ctx.drizzleClient.execute.mockResolvedValue(txns);
      const result = await getUserTransactionsResolver(
        {},
        { ...args, orgId: 'org-456' },
        ctx,
      );
      expect(result).toEqual(txns.map(expectTransaction));
    });

    it('filters by status and date range', async () => {
      const txns = [createMockTransaction()];
      ctx.drizzleClient.execute.mockResolvedValue(txns);
      const result = await getUserTransactionsResolver(
        {},
        {
          ...args,
          status: 'captured',
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
        },
        ctx,
      );
      expect(result).toEqual(txns.map(expectTransaction));
    });

    it('throws for unauthenticated user', async () => {
      ctx.currentClient.isAuthenticated = false;
      await expect(getUserTransactionsResolver({}, args, ctx)).rejects.toThrow(
        TalawaGraphQLError,
      );
    });

    it('throws for invalid userId type', async () => {
      await expect(
        getUserTransactionsResolver(
          {},
          { ...args, userId: true as unknown as string },
          ctx,
        ),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('throws Forbidden when user accesses other user data', async () => {
      ctx.currentClient.user.id = 'current-user-id';
      ctx.drizzleClient.query = {
        usersTable: {
          findFirst: vi
            .fn()
            .mockResolvedValue({ id: 'current-user-id', role: 'user' }),
        },
      };
      await expect(
        getUserTransactionsResolver(
          {},
          { ...args, userId: 'other-user-id' },
          ctx,
        ),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('throws TalawaGraphQLError on database error', async () => {
      ctx.drizzleClient.select.mockImplementation(() => {
        throw new Error('Database timeout');
      });
      await expect(getUserTransactionsResolver({}, args, ctx)).rejects.toThrow(
        TalawaGraphQLError,
      );
    });
  });
  describe('getOrganizationTransactionStatsResolver', () => {
    const args = orgStatsArgs;

    it('returns transaction stats for admin', async () => {
      ctx.drizzleClient.execute.mockResolvedValue([
        {
          totalTransactions: 10,
          totalAmount: 1000000,
          currency: 'INR',
          successCount: 8,
          failedCount: 1,
          pendingCount: 0,
        },
      ]);
      const result = await getOrganizationTransactionStatsResolver(
        {},
        args,
        ctx,
      );
      expect(result).toEqual({
        totalTransactions: 10,
        totalAmount: 1000000,
        currency: 'INR',
        successfulTransactions: 8,
        failedTransactions: 1,
        averageTransactionAmount: 100000,
      });
    });

    it('filters stats by date range', async () => {
      ctx.drizzleClient.execute.mockResolvedValue([
        {
          total: 5,
          totalAmount: 500000,
          successful: 5,
          successfulAmount: 500000,
          failed: 0,
          failedAmount: 0,
          pending: 0,
          pendingAmount: 0,
        },
      ]);
      const result = await getOrganizationTransactionStatsResolver(
        {},
        { ...args, dateFrom: '2024-01-01', dateTo: '2024-12-31' },
        ctx,
      );
      expect(result).toBeDefined();
    });

    it('throws for non-admin', async () => {
      const nonAdmin = createMockRazorpayContext({ userRole: 'user' });
      await expect(
        getOrganizationTransactionStatsResolver({}, args, nonAdmin),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('throws for unauthenticated user', async () => {
      ctx.currentClient.isAuthenticated = false;
      await expect(
        getOrganizationTransactionStatsResolver({}, args, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('handles empty stats', async () => {
      ctx.drizzleClient.execute.mockResolvedValue([]);
      const result = await getOrganizationTransactionStatsResolver(
        {},
        args,
        ctx,
      );
      expect(result).toBeDefined();
    });

    it('throws for invalid organizationId', async () => {
      await expect(
        getOrganizationTransactionStatsResolver(
          {},
          { ...args, organizationId: null as unknown as string },
          ctx,
        ),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('throws TalawaGraphQLError on database error', async () => {
      ctx.drizzleClient.execute.mockRejectedValue(
        new Error('Database unavailable'),
      );
      await expect(
        getOrganizationTransactionStatsResolver({}, args, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });
  });
  describe('getUserTransactionStatsResolver', () => {
    const args = userStatsArgs;

    it('returns user transaction stats', async () => {
      ctx.drizzleClient.execute.mockResolvedValue([
        {
          totalTransactions: 5,
          totalAmount: 500000,
          currency: 'INR',
          successfulTransactions: 4,
          failedTransactions: 1,
          averageTransactionAmount: 10000,
        },
      ]);
      const result = await getUserTransactionStatsResolver({}, args, ctx);
      expect(result).toBeDefined();
    });

    it('allows admin to view any user stats', async () => {
      ctx.drizzleClient.execute.mockResolvedValue([
        {
          total: 3,
          totalAmount: 300000,
          successful: 3,
          successfulAmount: 300000,
          failed: 0,
          failedAmount: 0,
          pending: 0,
          pendingAmount: 0,
        },
      ]);
      const result = await getUserTransactionStatsResolver(
        {},
        { ...args, userId: 'other-user' },
        ctx,
      );
      expect(result).toBeDefined();
    });

    it('throws when non-admin views other user stats', async () => {
      const nonAdmin = createMockRazorpayContext({ userRole: 'user' });
      await expect(
        getUserTransactionStatsResolver(
          {},
          { ...args, userId: 'other-user' },
          nonAdmin,
        ),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('filters stats by date range', async () => {
      ctx.drizzleClient.execute.mockResolvedValue([
        {
          total: 2,
          totalAmount: 200000,
          successful: 2,
          successfulAmount: 200000,
          failed: 0,
          failedAmount: 0,
          pending: 0,
          pendingAmount: 0,
        },
      ]);
      const result = await getUserTransactionStatsResolver(
        {},
        { ...args, dateFrom: '2024-01-01', dateTo: '2024-12-31' },
        ctx,
      );
      expect(result).toBeDefined();
    });

    it('throws for unauthenticated user', async () => {
      ctx.currentClient.isAuthenticated = false;
      await expect(
        getUserTransactionStatsResolver({}, args, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('throws for invalid userId type', async () => {
      await expect(
        getUserTransactionStatsResolver(
          {},
          {
            userId: [1, 2, 3] as unknown as string,
            dateFrom: null,
            dateTo: null,
          },
          ctx,
        ),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('throws TalawaGraphQLError on database error', async () => {
      ctx.drizzleClient.execute.mockRejectedValue(
        new Error('Database connection lost'),
      );
      await expect(
        getUserTransactionStatsResolver({}, args, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('returns default stats when empty', async () => {
      ctx.drizzleClient.execute.mockResolvedValue([]);
      const result = await getUserTransactionStatsResolver({}, args, ctx);
      expect(result).toEqual({
        totalTransactions: 0,
        totalAmount: 0,
        currency: 'INR',
        successfulTransactions: 0,
        failedTransactions: 0,
        averageTransactionAmount: 0,
      });
    });
  });
  describe('unauthenticated (no user object) coverage', () => {
    const resolverCases = [
      [
        'getRazorpayConfig',
        (c: typeof ctx) => getRazorpayConfigResolver({}, {}, c),
      ],
      [
        'getOrgTransactions',
        (c: typeof ctx) =>
          getOrganizationTransactionsResolver({}, orgTransactionsArgs, c),
      ],
      [
        'getUserTransactions',
        (c: typeof ctx) =>
          getUserTransactionsResolver({}, userTransactionsArgs, c),
      ],
      [
        'getOrgTransactionStats',
        (c: typeof ctx) =>
          getOrganizationTransactionStatsResolver({}, orgStatsArgs, c),
      ],
      [
        'getUserTransactionStats',
        (c: typeof ctx) =>
          getUserTransactionStatsResolver({}, userStatsArgs, c),
      ],
    ] as const;
    it.each(resolverCases)(
      '%s throws when user is undefined',
      async (_name, fn) => {
        ctx.currentClient.user = undefined;
        await expect(fn(ctx)).rejects.toThrow(TalawaGraphQLError);
      },
    );
  });
  describe('findFirst where-callback invocation', () => {
    it('getRazorpayConfig invokes where callback', async () => {
      const ops = setupFindFirstWithCallback(ctx);
      ctx.drizzleClient.limit.mockResolvedValue([createMockConfig()]);
      await getRazorpayConfigResolver({}, {}, ctx);
      expect(ops.eq).toHaveBeenCalledWith('id_field', 'user-123');
    });
    it('getOrganizationTransactions invokes where callback', async () => {
      const ops = setupFindFirstWithCallback(ctx);
      ctx.drizzleClient.execute.mockResolvedValue([]);
      await getOrganizationTransactionsResolver({}, orgTransactionsArgs, ctx);
      expect(ops.eq).toHaveBeenCalledWith('id_field', 'user-123');
    });
    it('getUserTransactions invokes where callback', async () => {
      const ops = setupFindFirstWithCallback(ctx);
      ctx.drizzleClient.execute.mockResolvedValue([]);
      await getUserTransactionsResolver({}, userTransactionsArgs, ctx);
      expect(ops.eq).toHaveBeenCalledWith('id_field', 'user-123');
    });
    it('getOrgTransactionStats invokes where callback', async () => {
      const ops = setupFindFirstWithCallback(ctx);
      ctx.drizzleClient.execute.mockResolvedValue([]);
      await getOrganizationTransactionStatsResolver({}, orgStatsArgs, ctx);
      expect(ops.eq).toHaveBeenCalledWith('id_field', 'user-123');
    });
    it('getUserTransactionStats invokes where callback', async () => {
      const ops = setupFindFirstWithCallback(ctx);
      ctx.drizzleClient.execute.mockResolvedValue([]);
      await getUserTransactionStatsResolver({}, userStatsArgs, ctx);
      expect(ops.eq).toHaveBeenCalledWith('id_field', 'user-123');
    });
  });
  describe('registerRazorpayQueries', () => {
    it('registers all query fields on the builder', () => {
      const mockBuilder = { queryField: vi.fn() };
      registerRazorpayQueries(
        mockBuilder as unknown as Parameters<typeof registerRazorpayQueries>[0],
      );
      expect(mockBuilder.queryField).toHaveBeenCalledTimes(5);
      for (const name of [
        'getRazorpayConfig',
        'getOrganizationTransactions',
        'getUserTransactions',
        'getOrganizationTransactionStats',
        'getUserTransactionStats',
      ]) {
        expect(mockBuilder.queryField).toHaveBeenCalledWith(
          name,
          expect.any(Function),
        );
      }
    });
    it('passes correct field config to builder callbacks', () => {
      const fieldConfigs: Record<string, unknown> = {};
      const mockBuilder = {
        queryField: vi.fn(
          (name: string, configFn: (t: Record<string, unknown>) => unknown) => {
            const mockT = {
              field: vi.fn((config: unknown) => config),
              arg: {
                string: vi.fn((c: unknown) => c),
                int: vi.fn((c: unknown) => c),
              },
              listRef: vi.fn((ref: unknown) => ref),
            };
            fieldConfigs[name] = configFn(mockT);
          },
        ),
      };
      registerRazorpayQueries(
        mockBuilder as unknown as Parameters<typeof registerRazorpayQueries>[0],
      );
      expect(Object.keys(fieldConfigs)).toHaveLength(5);
    });
  });
});
