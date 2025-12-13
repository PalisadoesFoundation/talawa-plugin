import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRazorpayWebhook } from '../../../plugins/Razorpay/api/index';
import {
  createMockRazorpayContext,
  createMockWebhookData,
  createMockConfig,
  createMockOrder,
  createMockTransaction,
} from './utils/mockRazorpay';
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
    mockReply = createMockFastifyReply();

    mockContext.drizzleClient = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      execute: vi.fn(),
    };
  });

  describe('signature verification', () => {
    it('should accept valid webhook signature', async () => {
      const webhookData = createMockWebhookData('payment.captured');
      const webhookBody = JSON.stringify(webhookData);
      const secret = 'webhook_secret_123';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex');

      const mockConfig = createMockConfig({ webhookSecret: secret });
      const mockOrder = createMockOrder();

      mockRequest.body = webhookData;
      mockRequest.headers = { 'x-razorpay-signature': signature };

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

      mockContext.drizzleClient.limit.mockResolvedValue([mockConfig]);

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

      expect(mockReply.code).toHaveBeenCalledWith(404);
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

    it('should handle concurrent webhook processing', async () => {
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

      // Process same webhook twice
      await Promise.all([
        handleRazorpayWebhook(mockRequest, mockReply),
        handleRazorpayWebhook(mockRequest, mockReply),
      ]);

      // Both should succeed (idempotent processing)
      expect(mockReply.code).toHaveBeenCalledWith(200);
    });
  });
});
