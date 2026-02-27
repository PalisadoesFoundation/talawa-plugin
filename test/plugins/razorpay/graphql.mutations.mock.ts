// Mock data and helpers for mutations tests
import { vi } from 'vitest';
import type { GraphQLContext } from '~/src/graphql/context';
import crypto from 'node:crypto';
import {
  createMockRazorpayContext,
  createMockTransaction,
  createMockRazorpayPayment,
  createMockDatabaseClient,
  createMockConfig,
  createMockOrder,
  createMockRazorpayOrder,
} from './utils/mockRazorpay';
import { mockOrders, mockPayments } from '../../../__mocks__/razorpay';

export {
  createMockRazorpayContext,
  createMockTransaction,
  createMockRazorpayPayment,
  createMockDatabaseClient,
  createMockConfig,
  createMockOrder,
  createMockRazorpayOrder,
  mockOrders,
  mockPayments,
};

// Standard update config input
export const updateConfigInput = {
  keyId: 'rzp_test_newkey123',
  keySecret: 'rzp_secret_new123',
  webhookSecret: 'webhook_secret_new',
  isEnabled: true,
  testMode: true,
  currency: 'INR',
  description: 'Test donation',
};

// Standard create order input
export const createOrderInput = {
  organizationId: 'org-123',
  userId: 'user-123',
  amount: 100000,
  currency: 'INR',
  donorName: 'Test Donor',
  donorEmail: 'donor@example.com',
  donorPhone: '+919876543210',
  description: 'Test donation',
};

// Standard initiate payment input
export const initiatePaymentInput = {
  orderId: 'order-db-123',
  paymentMethod: 'card',
  customerDetails: {
    name: 'Test Customer',
    email: 'customer@example.com',
    contact: '+919876543210',
  },
};

// Standard verify payment input (signature computed dynamically)
export const createVerifyInput = (secret = 'rzp_test_secret123') => {
  const paymentData = 'order_test123|pay_test123';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(paymentData)
    .digest('hex');
  return {
    razorpayPaymentId: 'pay_test123',
    razorpayOrderId: 'order_test123',
    razorpaySignature: signature,
    paymentData,
  };
};

// Helper to set up a fresh context with default mocks
export function setupContext(): GraphQLContext & {
  request: Record<string, unknown>;
} {
  const ctx = createMockRazorpayContext({
    drizzleClient: createMockDatabaseClient(),
  }) as GraphQLContext & { request: Record<string, unknown> };
  ctx.request = { headers: {} };

  // Defaults
  mockOrders.create.mockResolvedValue(createMockRazorpayOrder());
  mockPayments.fetch.mockResolvedValue(createMockRazorpayPayment());
  ctx.drizzleClient.limit.mockResolvedValue([createMockConfig()]);

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
