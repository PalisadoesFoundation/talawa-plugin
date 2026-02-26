import { vi } from 'vitest';
import { createMockRazorpayContext } from './utils/mockRazorpay';

export {
  createMockRazorpayContext,
  createMockConfig,
  createMockTransaction,
} from './utils/mockRazorpay';

// Standard args for organization transactions
export const orgTransactionsArgs = {
  organizationId: 'org-123',
  limit: 10,
  offset: 0,
  status: null,
  dateFrom: null,
  dateTo: null,
};

// Standard args for user transactions
export const userTransactionsArgs = {
  userId: 'user-123',
  orgId: null,
  limit: 10,
  offset: 0,
  status: null,
  dateFrom: null,
  dateTo: null,
};

// Standard args for organization transaction stats
export const orgStatsArgs = {
  organizationId: 'org-123',
  dateFrom: null,
  dateTo: null,
};

// Standard args for user transaction stats
export const userStatsArgs = {
  userId: 'user-123',
  dateFrom: undefined as string | undefined,
  dateTo: undefined as string | undefined,
};

// Helper to create a fresh context for each test
export function setupContext() {
  const ctx = createMockRazorpayContext({
    isAdmin: true,
    user: { id: 'user-123' },
  } as Partial<Parameters<typeof createMockRazorpayContext>[0]>);
  ctx.log = { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() };
  return ctx;
}

// Helper to mock findFirst so it invokes the where callback for coverage
export function setupFindFirstWithCallback(
  ctx: ReturnType<typeof setupContext>,
) {
  const mockFields = { id: 'id_field' };
  const mockOps = { eq: vi.fn().mockReturnValue(true) };
  ctx.drizzleClient.query = {
    usersTable: {
      findFirst: vi.fn().mockImplementation((opts: Record<string, unknown>) => {
        if (typeof opts.where === 'function') {
          (opts.where as (f: typeof mockFields, o: typeof mockOps) => unknown)(
            mockFields,
            mockOps,
          );
        }
        return Promise.resolve({
          id: 'user-123',
          role: 'administrator',
        });
      }),
    },
  };
  return mockOps;
}
