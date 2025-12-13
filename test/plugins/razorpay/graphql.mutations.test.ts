import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateRazorpayConfigResolver,
  createPaymentOrderResolver,
  initiatePaymentResolver,
  verifyPaymentResolver,
  testRazorpaySetupResolver,
} from '../../../plugins/Razorpay/api/graphql/mutations';
import {
  createMockRazorpayContext,
  createMockConfig,
  createMockOrder,
  createMockTransaction,
  createMockRazorpayOrder,
} from './utils/mockRazorpay';
import { TalawaGraphQLError } from '~/src/utilities/TalawaGraphQLError';
import crypto from 'node:crypto';

// Mock Razorpay SDK
vi.mock('razorpay', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      orders: {
        create: vi.fn().mockResolvedValue({
          id: 'order_test123',
          amount: 100000,
          currency: 'INR',
        }),
      },
      payments: {
        fetch: vi.fn(),
      },
    })),
  };
});

describe('Razorpay GraphQL Mutations', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = createMockRazorpayContext({
      isAdmin: true,
      user: {
        id: 'user-123',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin'],
        permissions: [],
        isSuperAdmin: true,
      },
    });

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

    global.fetch = vi.fn();
  });

  describe('updateRazorpayConfigResolver', () => {
    const input = {
      keyId: 'rzp_test_newkey123',
      keySecret: 'rzp_secret_new123',
      webhookSecret: 'webhook_secret_new',
      isEnabled: true,
      testMode: true,
      currency: 'INR',
      description: 'Test donation',
    };

    it('should update config for super admin', async () => {
      const existingConfig = createMockConfig();
      const updatedConfig = { ...existingConfig, ...input };

      mockContext.drizzleClient.limit.mockResolvedValue([existingConfig]);
      mockContext.drizzleClient.returning.mockResolvedValue([updatedConfig]);

      const result = await updateRazorpayConfigResolver(
        {},
        { input },
        mockContext,
      );

      expect(result).toEqual(updatedConfig);
      expect(mockContext.drizzleClient.update).toHaveBeenCalled();
    });

    it('should create new config if none exists', async () => {
      mockContext.drizzleClient.limit.mockResolvedValue([]);
      const newConfig = createMockConfig(input);
      mockContext.drizzleClient.returning.mockResolvedValue([newConfig]);

      const result = await updateRazorpayConfigResolver(
        {},
        { input },
        mockContext,
      );

      expect(mockContext.drizzleClient.insert).toHaveBeenCalled();
      expect(result).toEqual(newConfig);
    });

    it('should throw error for non-super-admin', async () => {
      mockContext.user.isSuperAdmin = false;

      await expect(
        updateRazorpayConfigResolver({}, { input }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should throw error for unauthenticated user', async () => {
      mockContext.user = null;

      await expect(
        updateRazorpayConfigResolver({}, { input }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should handle partial config updates', async () => {
      const existingConfig = createMockConfig();
      const partialInput = {
        isEnabled: false,
        testMode: false,
        currency: 'USD',
        description: 'New description',
      };
      const updatedConfig = { ...existingConfig, ...partialInput };

      mockContext.drizzleClient.limit.mockResolvedValue([existingConfig]);
      mockContext.drizzleClient.returning.mockResolvedValue([updatedConfig]);

      const result = await updateRazorpayConfigResolver(
        {},
        { input: partialInput },
        mockContext,
      );

      expect(result).toEqual(updatedConfig);
    });
  });

  describe('createPaymentOrderResolver', () => {
    const input = {
      organizationId: 'org-123',
      userId: 'user-123',
      amount: 100000,
      currency: 'INR',
      donorName: 'Test Donor',
      donorEmail: 'donor@example.com',
      donorPhone: '+919876543210',
      description: 'Test donation',
    };

    it('should create payment order successfully', async () => {
      const mockConfig = createMockConfig();
      const mockOrder = createMockOrder();
      const mockRzpOrder = createMockRazorpayOrder();

      mockContext.drizzleClient.limit.mockResolvedValue([mockConfig]);
      mockContext.drizzleClient.returning.mockResolvedValue([mockOrder]);

      const result = await createPaymentOrderResolver(
        {},
        { input },
        mockContext,
      );

      expect(result).toBeDefined();
      expect(mockContext.drizzleClient.insert).toHaveBeenCalled();
    });

    it('should throw error if Razorpay config not found', async () => {
      mockContext.drizzleClient.limit.mockResolvedValue([]);

      await expect(
        createPaymentOrderResolver({}, { input }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should throw error if Razorpay is not enabled', async () => {
      const disabledConfig = createMockConfig({ isEnabled: false });
      mockContext.drizzleClient.limit.mockResolvedValue([disabledConfig]);

      await expect(
        createPaymentOrderResolver({}, { input }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should validate amount is positive', async () => {
      const mockConfig = createMockConfig();
      mockContext.drizzleClient.limit.mockResolvedValue([mockConfig]);

      const invalidInput = { ...input, amount: -100 };

      await expect(
        createPaymentOrderResolver({}, { input: invalidInput }, mockContext),
      ).rejects.toThrow();
    });

    it('should handle anonymous donations (no userId)', async () => {
      const mockConfig = createMockConfig();
      const mockOrder = createMockOrder({ userId: null });

      mockContext.drizzleClient.limit.mockResolvedValue([mockConfig]);
      mockContext.drizzleClient.returning.mockResolvedValue([mockOrder]);

      const anonymousInput = { ...input, userId: null };

      const result = await createPaymentOrderResolver(
        {},
        { input: anonymousInput },
        mockContext,
      );

      expect(result).toBeDefined();
    });

    it('should throw error for unauthenticated user', async () => {
      mockContext.user = null;

      await expect(
        createPaymentOrderResolver({}, { input }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });
  });

  describe('initiatePaymentResolver', () => {
    const input = {
      orderId: 'order-db-123',
      paymentMethod: 'card',
      customerDetails: {
        name: 'Test Customer',
        email: 'customer@example.com',
        contact: '+919876543210',
      },
    };

    it('should initiate payment successfully', async () => {
      const mockOrder = createMockOrder();
      const mockConfig = createMockConfig();
      const mockTransaction = createMockTransaction();

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([mockConfig]);
      mockContext.drizzleClient.returning.mockResolvedValue([mockTransaction]);

      const result = await initiatePaymentResolver({}, { input }, mockContext);

      expect(result).toBeDefined();
      expect(mockContext.drizzleClient.insert).toHaveBeenCalled();
    });

    it('should throw error if order not found', async () => {
      mockContext.drizzleClient.limit.mockResolvedValue([]);

      await expect(
        initiatePaymentResolver({}, { input }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should throw error if order already paid', async () => {
      const paidOrder = createMockOrder({ status: 'paid' });
      mockContext.drizzleClient.limit.mockResolvedValue([paidOrder]);

      await expect(
        initiatePaymentResolver({}, { input }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should handle payment without customer details', async () => {
      const mockOrder = createMockOrder();
      const mockConfig = createMockConfig();
      const mockTransaction = createMockTransaction();

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([mockConfig]);
      mockContext.drizzleClient.returning.mockResolvedValue([mockTransaction]);

      const inputWithoutCustomer = {
        orderId: 'order-db-123',
        paymentMethod: 'card',
      };

      const result = await initiatePaymentResolver(
        {},
        { input: inputWithoutCustomer },
        mockContext,
      );

      expect(result).toBeDefined();
    });

    it('should throw error for unauthenticated user', async () => {
      mockContext.user = null;

      await expect(
        initiatePaymentResolver({}, { input }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });
  });

  describe('verifyPaymentResolver', () => {
    const input = {
      razorpayPaymentId: 'pay_test123',
      razorpayOrderId: 'order_test123',
      razorpaySignature: '',
      paymentData: 'order_test123|pay_test123',
    };

    beforeEach(() => {
      // Create valid signature for tests
      const secret = 'webhook_secret_123';
      input.razorpaySignature = crypto
        .createHmac('sha256', secret)
        .update(input.paymentData)
        .digest('hex');
    });

    it('should verify payment successfully', async () => {
      const mockConfig = createMockConfig();
      const mockOrder = createMockOrder();
      const mockTransaction = createMockTransaction();

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([mockTransaction]);

      const result = await verifyPaymentResolver({}, { input }, mockContext);

      expect(result).toBeDefined();
      expect(mockContext.drizzleClient.update).toHaveBeenCalled();
    });

    it('should throw error with invalid signature', async () => {
      const mockConfig = createMockConfig();
      mockContext.drizzleClient.limit.mockResolvedValue([mockConfig]);

      const invalidInput = {
        ...input,
        razorpaySignature: 'invalid_signature_1234567890abcdef',
      };

      await expect(
        verifyPaymentResolver({}, { input: invalidInput }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should throw error if config not found', async () => {
      mockContext.drizzleClient.limit.mockResolvedValue([]);

      await expect(
        verifyPaymentResolver({}, { input }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should throw error if order not found', async () => {
      const mockConfig = createMockConfig();
      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([]);

      await expect(
        verifyPaymentResolver({}, { input }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should throw error if transaction not found', async () => {
      const mockConfig = createMockConfig();
      const mockOrder = createMockOrder();

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([]);

      await expect(
        verifyPaymentResolver({}, { input }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should update order and transaction status on successful verification', async () => {
      const mockConfig = createMockConfig();
      const mockOrder = createMockOrder();
      const mockTransaction = createMockTransaction();

      mockContext.drizzleClient.limit
        .mockResolvedValueOnce([mockConfig])
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([mockTransaction]);

      await verifyPaymentResolver({}, { input }, mockContext);

      // Should update both order and transaction
      expect(mockContext.drizzleClient.update).toHaveBeenCalledTimes(2);
    });

    it('should throw error for unauthenticated user', async () => {
      mockContext.user = null;

      await expect(
        verifyPaymentResolver({}, { input }, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });
  });

  describe('testRazorpaySetupResolver', () => {
    it('should return success for valid setup', async () => {
      const mockConfig = createMockConfig();
      mockContext.drizzleClient.limit.mockResolvedValue([mockConfig]);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ count: 0, items: [] }),
      });

      const result = await testRazorpaySetupResolver({}, {}, mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Connection successful');
    });

    it('should return error when config not found', async () => {
      mockContext.drizzleClient.limit.mockResolvedValue([]);

      const result = await testRazorpaySetupResolver({}, {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No Razorpay configuration');
    });

    it('should return error for invalid credentials', async () => {
      const mockConfig = createMockConfig();
      mockContext.drizzleClient.limit.mockResolvedValue([mockConfig]);

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await testRazorpaySetupResolver({}, {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid API credentials');
    });

    it('should return error for network failure', async () => {
      const mockConfig = createMockConfig();
      mockContext.drizzleClient.limit.mockResolvedValue([mockConfig]);

      (global.fetch as any).mockRejectedValue(new TypeError('fetch failed'));

      const result = await testRazorpaySetupResolver({}, {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });

    it('should throw error for non-admin user', async () => {
      mockContext.isAdmin = false;

      await expect(
        testRazorpaySetupResolver({}, {}, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should throw error for unauthenticated user', async () => {
      mockContext.user = null;

      await expect(
        testRazorpaySetupResolver({}, {}, mockContext),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('should validate key format', async () => {
      const mockConfig = createMockConfig({ keyId: 'invalid_key' });
      mockContext.drizzleClient.limit.mockResolvedValue([mockConfig]);

      const result = await testRazorpaySetupResolver({}, {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid Key ID format');
    });

    it('should handle missing API keys', async () => {
      const mockConfig = createMockConfig({ keyId: null, keySecret: null });
      mockContext.drizzleClient.limit.mockResolvedValue([mockConfig]);

      const result = await testRazorpaySetupResolver({}, {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.message).toContain('API keys are not configured');
    });
  });
});
