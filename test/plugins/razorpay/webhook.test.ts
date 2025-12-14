import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRazorpayWebhook } from '../../../plugins/Razorpay/api/index';
import {
  createMockRazorpayContext,
  createMockRazorpayInstance,
  createMockConfig,
  createMockOrder,
  createMockRazorpayOrder,
  createMockTransaction,
  createMockWebhookData,
  createValidSignature,
} from './utils/mockRazorpay';
import {
  configTable,
  ordersTable,
  transactionsTable,
} from '../../../plugins/Razorpay/api/database/tables';

// Mock the Razorpay module including static methods
vi.mock('razorpay');

import crypto from 'node:crypto';
import type {
  MockFastifyRequest,
  MockFastifyReply,
} from '../../utils/mockClients';
import {
  createMockFastifyRequest,
  createMockFastifyReply,
} from '../../utils/mockClients';

describe('Razorpay Webhook Handler', () => {
  let mockContext: any;
  let mockRequest: MockFastifyRequest;
  let mockReply: MockFastifyReply;

  beforeEach(() => {
    mockContext = createMockRazorpayContext();
    mockRequest = createMockFastifyRequest();
    // Attach plugin context to request as expected by the handler
    (mockRequest as any).pluginContext = mockContext;
    mockReply = createMockFastifyReply();
  });

  describe('signature verification', () => {
    it('should accept valid webhook signature', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const secret = 'webhook_secret_123'; // Still needed for mockConfig

      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();

      // Generate signatures dynamically based on the exact body content
      const signature1 = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(webhookData)) // webhookData is used for mockRequest body
        .digest('hex');

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature1 };

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([]);

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(200);
    });

    it('should reject invalid webhook signature', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig();

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': 'invalid_signature' };

      // Ensure config has webhookSecret
      const configWithSecret = { ...mockConfig, webhookSecret: 'test_secret' };
      mockContext.drizzleClient.limit.mockResolvedValue([configWithSecret]);

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should reject webhook with missing signature', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      mockRequest.body = webhookData;
      mockRequest.headers = {};

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle missing webhook secret in config', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig({ webhookSecret: null });

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': 'some_signature' };

      mockContext.drizzleClient.limit.mockResolvedValue([mockConfig]);

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });

  describe('event processing', () => {
    let validSignature: string;
    const secret = 'webhook_secret_123';

    beforeEach(() => {
      const webhookData = createMockWebhookData('payment.captured');
      const webhookBody = JSON.stringify(webhookData);
      validSignature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex');
    });

    it('should process payment.captured event', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': validSignature };

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([]);

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockContext.drizzleClient.insert).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(200);
    });

    it('should process payment.failed event', async () => {
      const webhookData = createMockWebhookData('payment.failed', {
        status: 'failed',
        captured: false,
        error_code: 'BAD_REQUEST_ERROR',
        error_description: 'Payment failed',
      });
      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();

      const webhookBody = JSON.stringify(webhookData);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex');

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([]);

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(200);
    });

    it('should process payment.authorized event', async () => {
      const webhookData = createMockWebhookData('payment.authorized', {
        status: 'authorized',
        captured: false,
      });
      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();

      const webhookBody = JSON.stringify(webhookData);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex');

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([]);

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(200);
    });

    it('should handle unknown event types gracefully', async () => {
      const webhookData = createMockWebhookData('payment.unknown_event');
      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();

      const webhookBody = JSON.stringify(webhookData);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex');

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([]);

      await handleRazorpayWebhook(mockRequest, mockReply);

      // Should still process even unknown events
      expect(mockReply.code).toHaveBeenCalledWith(200);
    });
  });

  describe('database updates', () => {
    const secret = 'webhook_secret_123';

    it('should create new transaction for new payment', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();

      const webhookBody = JSON.stringify(webhookData);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex');

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([]); // No existing transaction

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockContext.drizzleClient.insert).toHaveBeenCalled();
    });

    it('should update existing transaction', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();
      // Spy on console.error to see why tests are failing
      vi.spyOn(console, 'error').mockImplementation((...args) =>
        console.log('DEBUG_ERROR:', ...args),
      );
      const mockTransaction = createMockTransaction();

      const webhookBody = JSON.stringify(webhookData);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex');

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([mockTransaction]); // Existing transaction

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockContext.drizzleClient.update).toHaveBeenCalled();
    });

    it('should update order status on successful payment', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();

      const webhookBody = JSON.stringify(webhookData);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex');

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([]);

      await handleRazorpayWebhook(mockRequest, mockReply);

      // Should update order status to 'paid'
      expect(mockContext.drizzleClient.update).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig({ webhookSecret: secret });

      const webhookBody = JSON.stringify(webhookData);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex');

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockRejectedValueOnce(new Error('Database error'));

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });

  describe('error handling', () => {
    const secret = 'webhook_secret_123';

    it('should handle malformed webhook payload', async () => {
      mockRequest.body = 'invalid json';
      mockRequest.headers = { 'x-razorpay-signature': 'some_signature' };

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle missing order gracefully', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig({ webhookSecret: secret });

      const webhookBody = JSON.stringify(webhookData);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex');

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([]); // No order found

      await handleRazorpayWebhook(mockRequest, mockReply);

      // Implementation returns 400 for order not found
      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle network failures during processing', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig({ webhookSecret: secret });

      const webhookBody = JSON.stringify(webhookData);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex');

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.limit.mockRejectedValue(
        new Error('Network timeout'),
      );

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
    });

    // Verify database calls (tables are imported at top level or mocked via utils)
    // Here we rely on standard mocks returning success
    vi.mock('~/src/plugins/Razorpay/api/database/tables', () => ({
      configTable: { id: 'config' },
      ordersTable: { id: 'orders' },
      transactionsTable: { id: 'transactions' },
    }));

    describe('error handling', () => {
      // ...
      it('should handle concurrent webhook processing', async () => {
        const secret = 'webhook_secret_123';
        const webhookData = createMockWebhookData('payment.captured');
        const mockConfig = createMockConfig({ webhookSecret: secret });
        const mockOrder = createMockOrder();

        const webhookBody = JSON.stringify(webhookData);
        const signature = crypto
          .createHmac('sha256', secret)
          .update(webhookBody)
          .digest('hex');

        mockRequest.body = webhookData;
        mockRequest.headers = { 'x-razorpay-signature': signature };

        // SMART MOCK for concurrent handling
        let currentTable: any = null;

        // Generate valid signatures for concurrent requests
        // Note: we must use the EXACT object structure that we pass to body for signature to match
        const payload1 = {
          payload: {
            payment: {
              entity: {
                id: 'pay_concurrent_1',
                order_id: 'order_concurrent',
                status: 'captured',
                amount: 50000,
                currency: 'INR',
              },
            },
          },
        };
        const signature1 = crypto
          .createHmac('sha256', secret)
          .update(JSON.stringify(payload1))
          .digest('hex');

        const payload2 = {
          payload: {
            payment: {
              entity: {
                id: 'pay_concurrent_2',
                order_id: 'order_concurrent',
                status: 'captured',
                amount: 50000,
                currency: 'INR',
              },
            },
          },
        };
        const signature2 = crypto
          .createHmac('sha256', secret)
          .update(JSON.stringify(payload2))
          .digest('hex');

        const mockRequest1 = {
          pluginContext: mockContext,
          headers: { 'x-razorpay-signature': signature1 },
          body: payload1,
        } as any;

        const mockRequest2 = {
          pluginContext: mockContext,
          headers: { 'x-razorpay-signature': signature2 },
          body: payload2,
        } as any;

        const mockReply1 = {
          code: vi.fn().mockReturnThis(),
          status: vi.fn().mockReturnThis(),
          send: vi.fn(),
        } as any;

        const mockReply2 = {
          code: vi.fn().mockReturnThis(),
          status: vi.fn().mockReturnThis(),
          send: vi.fn(),
        } as any;

        // Ensure mocks return values for ALL calls
        mockContext.drizzleClient.limit.mockResolvedValue([mockConfig]); // For config
        // For order lookup (return order), then transaction lookup (return empty)
        // Since calls are concurrent, we need robust mocking.
        // We can just rely on limit returning something always.
        // First limit: Config. Second: Order. Third: Transaction.
        // We can check table in args if needed, but simple array is enough if we assume order matters?
        // Actually, code does: select config -> select order -> select transaction.
        // So 3 selects per request. Total 6 selects.
        mockContext.drizzleClient.limit.mockImplementation(() =>
          Promise.resolve([mockConfig]),
        );

        // But wait. select Order needs to return an ORDER. select Transaction needs to return EMPTY (or existing).
        // If we return [mockConfig] for Order query, it might fail if accessing .id?
        // Config has id. Order has id.
        // Config doesn't have userId, organizationId, etc used in Transaction.
        // So we need to mock based on TABLE.
        // But table is passed to `from()`.
        // `drizzleClient.from(table)` -> returns builder.
        // This is complex to mock if not using `when` or table detection.
        // Since we mock `select().from().where().limit()`.
        // We can refine the mock in `beforeEach` or here?
        // Safe Mock for concurrent handling using closures
        const mockOrderConcurrent = {
          ...createMockOrder(),
          id: 'order_concurrent',
        };
        mockContext.drizzleClient.from.mockImplementation((table: any) => {
          // Return a unique object for THIS chain
          return {
            where: vi.fn().mockReturnThis(),
            offset: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockImplementation(async () => {
              const tableAny = table as any;

              // 1. Strict ref check
              if (table === configTable) return [mockConfig];
              if (table === ordersTable) return [mockOrderConcurrent];
              if (table === transactionsTable) return [];

              // 2. Name check (Drizzle internal)
              const name =
                tableAny._?.name ||
                tableAny.name ||
                tableAny[Symbol.for('drizzle:Name')];
              if (name === 'razorpay_config') return [mockConfig];
              if (name === 'razorpay_orders') return [mockOrderConcurrent];
              if (name === 'razorpay_transactions') return [];

              // 3. Column check fallback
              if (tableAny.webhookSecret) return [mockConfig];
              if (tableAny.razorpayOrderId) return [mockOrderConcurrent];
              if (tableAny.paymentId) return [];

              console.error(
                'DEBUG_TABLE_MATCH_FAILED. Keys:',
                Object.keys(tableAny),
              );
              return [];
            }),
          };
        });

        // Fix insert/update to simple success
        mockContext.drizzleClient.insert = vi
          .fn()
          .mockReturnValue({ values: vi.fn().mockResolvedValue({}) });
        mockContext.drizzleClient.update = vi.fn().mockReturnValue({
          set: vi
            .fn()
            .mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
        });

        await Promise.all([
          handleRazorpayWebhook(mockRequest1, mockReply1),
          handleRazorpayWebhook(mockRequest2, mockReply2),
        ]);

        expect(mockReply1.status).toHaveBeenCalledWith(200);
        expect(mockReply2.status).toHaveBeenCalledWith(200);
      });
    });
  });
});
