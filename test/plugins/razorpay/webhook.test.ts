import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRazorpayWebhook } from '../../../plugins/Razorpay/api/index';
import {
  createMockRazorpayContext,
  createMockConfig,
  createMockOrder,
  createMockTransaction,
  createMockWebhookData,
  createWebhookSignature,
} from './utils/mockRazorpay';
import {
  configTable,
  ordersTable,
  transactionsTable,
} from '../../../plugins/Razorpay/api/database/tables';

// Mock the table objects before tests run to avoid DB connection issues
vi.mock('~/src/plugins/Razorpay/api/database/tables', () => ({
  configTable: { id: 'config' },
  ordersTable: { id: 'orders' },
  transactionsTable: { id: 'transactions' },
}));
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
  const secret = 'webhook_secret_123';

  beforeEach(() => {
    mockContext = createMockRazorpayContext();
    mockRequest = createMockFastifyRequest();
    // Attach plugin context to request as expected by the handler
    (mockRequest as any).pluginContext = mockContext;
    // Fix logger mismatch: api/index.ts expects 'logger', mock provides 'log'
    mockContext.logger = mockContext.log;
    (mockRequest as any).organizationId = 'org-123';
    mockReply = createMockFastifyReply();
    // Reset and properly configure all mocks
    vi.clearAllMocks();

    // Configure insert mock chain
    mockContext.drizzleClient.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    });

    // Configure update mock chain
    mockContext.drizzleClient.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    });

    // Configure select chain properly with default empty return
    mockContext.drizzleClient.from = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    });
  });

  describe('signature verification', () => {
    it('should accept valid webhook signature', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const secret = 'webhook_secret_123'; // Still needed for mockConfig

      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();

      // Generate signatures dynamically based on the exact body content
      const signature1 = createWebhookSignature(
        JSON.stringify(webhookData),
        secret,
      );

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature1 };

      // Configure mocks in correct order: config -> order -> transaction
      mockContext.drizzleClient.from
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockConfig]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockOrder]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        });

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
      mockContext.drizzleClient.from.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([configWithSecret]),
      });

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

      mockContext.drizzleClient.from.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockConfig]),
      });

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
      validSignature = createWebhookSignature(webhookBody, secret);
    });

    it('should process payment.captured event', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': validSignature };

      mockContext.drizzleClient.from
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockConfig]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockOrder]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        });

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
      const signature = createWebhookSignature(webhookBody, secret);

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.from
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockConfig]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockOrder]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        });

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
      const signature = createWebhookSignature(webhookBody, secret);

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.from
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockConfig]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockOrder]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        });

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(200);
    });

    it('should handle unknown event types gracefully', async () => {
      const webhookData = createMockWebhookData('payment.unknown_event');
      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();

      const webhookBody = JSON.stringify(webhookData);
      const signature = createWebhookSignature(webhookBody, secret);

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.from
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockConfig]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockOrder]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        });

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
      const signature = createWebhookSignature(webhookBody, secret);

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.from
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockConfig]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockOrder]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        }); // No existing transaction

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockContext.drizzleClient.insert).toHaveBeenCalled();
    });

    it('should update existing transaction', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();
      const mockTransaction = createMockTransaction();

      const webhookBody = JSON.stringify(webhookData);
      const signature = createWebhookSignature(webhookBody, secret);

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.from
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockConfig]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockOrder]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockTransaction]),
        }); // Existing transaction

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockContext.drizzleClient.update).toHaveBeenCalled();
    });

    it('should update order status on successful payment', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();

      const webhookBody = JSON.stringify(webhookData);
      const signature = createWebhookSignature(webhookBody, secret);

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.from
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockConfig]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockOrder]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        });

      await handleRazorpayWebhook(mockRequest, mockReply);

      // Should update order status to 'paid'
      expect(mockContext.drizzleClient.update).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const mockConfig = createMockConfig({ webhookSecret: secret });

      const webhookBody = JSON.stringify(webhookData);
      const signature = createWebhookSignature(webhookBody, secret);

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

      mockContext.drizzleClient.from
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockConfig]),
        })
        .mockReturnValueOnce({
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockRejectedValueOnce(new Error('Database error')),
        });

      await handleRazorpayWebhook(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });

  it('should handle missing order gracefully', async () => {
    const webhookData = createMockWebhookData('payment.captured');
    const mockConfig = createMockConfig({ webhookSecret: secret });

    const webhookBody = JSON.stringify(webhookData);
    const signature = createWebhookSignature(webhookBody, secret);

    mockRequest.body = webhookData;
    mockRequest.headers = { 'x-razorpay-signature': signature };

    mockContext.drizzleClient.from
      .mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockConfig]),
      })
      .mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }); // No order found

    await handleRazorpayWebhook(mockRequest, mockReply);

    // Implementation returns 400 for order not found
    expect(mockReply.code).toHaveBeenCalledWith(400);
  });

  it('should handle network failures during processing', async () => {
    const webhookData = createMockWebhookData('payment.captured');
    const signature = createWebhookSignature(
      JSON.stringify(webhookData),
      secret,
    );

    mockRequest.body = webhookData;
    mockRequest.headers = { 'x-razorpay-signature': signature };

    mockContext.drizzleClient.from.mockReturnValue({
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(new Error('Network timeout')),
    });

    await handleRazorpayWebhook(mockRequest, mockReply);

    expect(mockReply.code).toHaveBeenCalledWith(500);
  });

  // Verify database calls (tables are imported at top level or mocked via utils)
  // Here we rely on standard mocks returning success
  it('should handle concurrent webhook processing', async () => {
    const mockConfig = createMockConfig({ webhookSecret: secret });

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
    const signature1 = createWebhookSignature(JSON.stringify(payload1), secret);

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

    const mockRequest1 = {
      pluginContext: mockContext,
      headers: { 'x-razorpay-signature': signature1 },
      body: payload1,
      organizationId: 'org-123',
    } as any;

    const mockRequest2 = {
      pluginContext: mockContext,
      headers: {}, // Missing signature as per test intent
      body: payload2,
      organizationId: 'org-123',
    } as any;

    const mockReply1 = createMockFastifyReply();

    const mockReply2 = createMockFastifyReply();

    // For concurrent handling, we need robust mocking based on tables
    const mockOrderConcurrent = {
      ...createMockOrder(),
      id: 'order_concurrent',
      razorpayOrderId: 'order_concurrent',
    };

    mockContext.drizzleClient.from.mockImplementation((table: any) => {
      // 1. Name check (Refined)
      const tableName =
        table === configTable
          ? 'config'
          : table === ordersTable
            ? 'orders'
            : table === transactionsTable
              ? 'transactions'
              : table?._?.name || table?.name || '';

      // Return a unique builder object for THIS chain
      return {
        where: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(async () => {
          // Identify table based on known refs or properties
          if (tableName === 'config' || table?.webhookSecret)
            return [mockConfig];
          if (tableName === 'orders' || table?.razorpayOrderId)
            return [mockOrderConcurrent];
          if (tableName === 'transactions' || table?.paymentId) return [];

          return [];
        }),
      };
    });

    await Promise.all([
      handleRazorpayWebhook(mockRequest1, mockReply1),
      handleRazorpayWebhook(mockRequest2, mockReply2),
    ]);

    expect(mockReply1.code).toHaveBeenCalledWith(200);
    expect(mockReply1.send).toHaveBeenCalledWith({
      status: 'success',
      message: 'Webhook processed successfully',
    });

    // Verify second call (missing signature)
    expect(mockReply2.code).toHaveBeenCalledWith(400);
    expect(mockReply2.send).toHaveBeenCalledWith({
      error: 'Missing signature',
      message: 'Missing x-razorpay-signature header',
    });
  });
});
