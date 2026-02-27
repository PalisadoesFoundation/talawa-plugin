import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateRazorpayConfigResolver,
  createPaymentOrderResolver,
  initiatePaymentResolver,
  verifyPaymentResolver,
  testRazorpaySetupResolver,
  registerRazorpayMutations,
} from '../../../plugins/razorpay/api/graphql/mutations';
import { TalawaGraphQLError } from '~/src/utilities/TalawaGraphQLError';
import {
  createMockRazorpayContext,
  createMockTransaction,
  createMockConfig,
  createMockOrder,
  createMockRazorpayOrder,
  mockOrders,
  updateConfigInput,
  createOrderInput,
  initiatePaymentInput,
  createVerifyInput,
  setupContext,
  setupFindFirstWithCallback,
} from './graphql.mutations.mock';

vi.mock('razorpay');

describe('Razorpay GraphQL Mutations', () => {
  let ctx: ReturnType<typeof setupContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = setupContext();
    global.fetch = vi.fn();
  });

  // --- updateRazorpayConfigResolver ---
  describe('updateRazorpayConfigResolver', () => {
    const input = updateConfigInput;

    it('updates config for super admin', async () => {
      ctx.user.isSuperAdmin = true;
      const existing = createMockConfig();
      ctx.drizzleClient.limit.mockResolvedValue([existing]);
      ctx.drizzleClient.returning.mockResolvedValue([
        { ...existing, ...input },
      ]);

      const result = await updateRazorpayConfigResolver({}, { input }, ctx);
      expect(ctx.drizzleClient.update).toHaveBeenCalled();
      expect(result).toMatchObject(input);
    });

    it('creates new config if none exists', async () => {
      ctx.user.isSuperAdmin = true;
      ctx.drizzleClient.limit.mockResolvedValue([]);
      ctx.drizzleClient.returning.mockResolvedValue([createMockConfig(input)]);

      const result = await updateRazorpayConfigResolver({}, { input }, ctx);
      expect(ctx.drizzleClient.insert).toHaveBeenCalled();
      expect(result).toMatchObject(input);
    });

    it('throws for non-super-admin', async () => {
      const nonAdmin = createMockRazorpayContext({ userRole: 'user' });
      await expect(
        updateRazorpayConfigResolver({}, { input }, nonAdmin),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('throws for unauthenticated user', async () => {
      const unauth = createMockRazorpayContext({ isAuthenticated: false });
      await expect(
        updateRazorpayConfigResolver({}, { input }, unauth),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('handles partial config updates', async () => {
      ctx.user.isSuperAdmin = true;
      const existing = createMockConfig();
      const partial = { isEnabled: false, description: 'New description' };
      ctx.drizzleClient.limit.mockResolvedValue([existing]);
      ctx.drizzleClient.returning.mockResolvedValue([
        { ...existing, ...partial },
      ]);

      const result = await updateRazorpayConfigResolver(
        {},
        { input: { ...existing, ...partial } },
        ctx,
      );
      expect(result).toMatchObject(partial);
    });
  });

  // --- createPaymentOrderResolver ---
  describe('createPaymentOrderResolver', () => {
    const input = createOrderInput;

    it('creates payment order successfully', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([createMockConfig()]);
      ctx.drizzleClient.returning.mockResolvedValue([createMockOrder()]);

      const result = await createPaymentOrderResolver({}, { input }, ctx);
      expect(result).toBeDefined();
      expect(ctx.drizzleClient.insert).toHaveBeenCalled();
    });

    it('throws if Razorpay config not found', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([]);
      await expect(
        createPaymentOrderResolver({}, { input }, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('handles anonymous donations (no userId)', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([createMockConfig()]);
      mockOrders.create.mockResolvedValue(createMockRazorpayOrder());

      await expect(
        createPaymentOrderResolver(
          {},
          {
            input: {
              ...input,
              userId: undefined,
              anonymous: true,
            } as unknown as typeof input & { anonymous: boolean },
          },
          ctx,
        ),
      ).resolves.not.toThrow();
    });

    it('throws for unauthenticated user (null user)', async () => {
      ctx.user = null;
      await expect(
        createPaymentOrderResolver({}, { input }, ctx),
      ).rejects.toThrow();
    });
  });

  // --- initiatePaymentResolver ---
  describe('initiatePaymentResolver', () => {
    const input = initiatePaymentInput;

    it('initiates payment successfully', async () => {
      const order = createMockOrder();
      const config = createMockConfig();
      const txn = createMockTransaction();
      ctx.drizzleClient.limit
        .mockResolvedValueOnce([order])
        .mockResolvedValueOnce([config]);
      ctx.drizzleClient.returning.mockResolvedValue([txn]);

      const result = await initiatePaymentResolver({}, { input }, ctx);
      expect(result).toBeDefined();
      expect(ctx.drizzleClient.insert).toHaveBeenCalled();
    });

    it('returns error if order not found', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([]);
      const result = await initiatePaymentResolver({}, { input }, ctx);
      expect(result.success).toBe(false);
    });

    it('returns error if order already paid', async () => {
      ctx.drizzleClient.limit.mockResolvedValueOnce([
        createMockOrder({ status: 'paid' }),
      ]);
      const result = await initiatePaymentResolver({}, { input }, ctx);
      expect(result.success).toBe(false);
    });

    it('handles payment without customer details', async () => {
      const order = createMockOrder();
      const config = createMockConfig();
      const txn = createMockTransaction();
      ctx.drizzleClient.limit
        .mockResolvedValueOnce([order])
        .mockResolvedValueOnce([config]);
      ctx.drizzleClient.returning.mockResolvedValue([txn]);

      const result = await initiatePaymentResolver(
        {},
        { input: { orderId: 'order-db-123', paymentMethod: 'card' } },
        ctx,
      );
      expect(result).toBeDefined();
    });

    it('throws for unauthenticated user', async () => {
      const unauth = createMockRazorpayContext({
        isAdmin: false,
        user: null,
      } as Partial<Parameters<typeof createMockRazorpayContext>[0]>);
      unauth.currentClient.isAuthenticated = false;
      await expect(
        initiatePaymentResolver({}, { input }, unauth),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('returns error when config is not enabled (line 387)', async () => {
      const order = createMockOrder();
      const disabledConfig = createMockConfig({ isEnabled: false });
      ctx.drizzleClient.limit
        .mockResolvedValueOnce([order])
        .mockResolvedValueOnce([disabledConfig]);

      const result = await initiatePaymentResolver({}, { input }, ctx);
      expect(result.success).toBe(false);
    });

    it('returns error when config array is empty (line 387)', async () => {
      const order = createMockOrder();
      ctx.drizzleClient.limit
        .mockResolvedValueOnce([order])
        .mockResolvedValueOnce([]);

      const result = await initiatePaymentResolver({}, { input }, ctx);
      expect(result.success).toBe(false);
    });
  });

  // --- verifyPaymentResolver ---
  describe('verifyPaymentResolver', () => {
    it('verifies payment successfully', async () => {
      const input = createVerifyInput();
      const config = createMockConfig();
      const order = createMockOrder();
      const txn = createMockTransaction();
      ctx.drizzleClient.limit
        .mockResolvedValueOnce([config])
        .mockResolvedValueOnce([order])
        .mockResolvedValueOnce([txn]);

      const result = await verifyPaymentResolver({}, { input }, ctx);
      expect(result).toBeDefined();
      expect(ctx.drizzleClient.update).toHaveBeenCalled();
    });

    it('returns error with invalid signature', async () => {
      const input = {
        razorpayOrderId: 'order_test_123',
        razorpayPaymentId: 'pay_test_123',
        razorpaySignature: 'invalid',
        paymentData: '{}',
      };
      const result = await verifyPaymentResolver({}, { input }, ctx);
      expect(result.success).toBe(false);
    });

    it('returns error if config not found', async () => {
      const input = createVerifyInput();
      ctx.drizzleClient.limit.mockResolvedValue([]);
      const result = await verifyPaymentResolver({}, { input }, ctx);
      expect(result.success).toBe(false);
    });

    it('returns error if order not found', async () => {
      const input = createVerifyInput();
      ctx.drizzleClient.limit
        .mockResolvedValueOnce([createMockConfig()])
        .mockResolvedValueOnce([]);
      const result = await verifyPaymentResolver({}, { input }, ctx);
      expect(result.success).toBe(false);
    });

    it('creates transaction if not found during verification', async () => {
      const input = createVerifyInput();
      ctx.drizzleClient.limit
        .mockResolvedValueOnce([createMockConfig()])
        .mockResolvedValueOnce([createMockOrder()])
        .mockResolvedValueOnce([]);

      const result = await verifyPaymentResolver({}, { input }, ctx);
      expect(result.success).toBe(true);
      expect(ctx.drizzleClient.insert).toHaveBeenCalled();
    });

    it('throws for unauthenticated user (no user id)', async () => {
      const input = createVerifyInput();
      const unauth = createMockRazorpayContext({ isAuthenticated: false });
      unauth.currentClient.user = undefined;
      await expect(
        verifyPaymentResolver({}, { input }, unauth),
      ).rejects.toThrow(TalawaGraphQLError);
    });

    it('throws for unauthenticated client (isAuthenticated false)', async () => {
      const input = createVerifyInput();
      const unauth = createMockRazorpayContext({});
      unauth.currentClient.isAuthenticated = false;
      await expect(
        verifyPaymentResolver({}, { input }, unauth),
      ).rejects.toThrow(TalawaGraphQLError);
    });
  });
  describe('testRazorpaySetupResolver', () => {
    it('returns success for valid setup', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([createMockConfig()]);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ count: 0, items: [] }),
      } as Response);

      const result = await testRazorpaySetupResolver({}, {}, ctx);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Setup verified!');
    });

    it('returns error when config not found', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([]);
      const result = await testRazorpaySetupResolver({}, {}, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('No Razorpay configuration');
    });

    it('returns error for network failure', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([createMockConfig()]);
      vi.mocked(global.fetch).mockRejectedValue(new TypeError('fetch failed'));
      mockOrders.create.mockRejectedValueOnce(new Error('Network error'));

      const result = await testRazorpaySetupResolver({}, {}, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });

    it('throws for non-admin user', async () => {
      const nonAdmin = createMockRazorpayContext({ userRole: 'user' });
      await expect(testRazorpaySetupResolver({}, {}, nonAdmin)).rejects.toThrow(
        TalawaGraphQLError,
      );
    });

    it('throws for unauthenticated user', async () => {
      const unauth = createMockRazorpayContext({
        isAdmin: false,
        user: null,
      } as Partial<Parameters<typeof createMockRazorpayContext>[0]>);
      unauth.currentClient.isAuthenticated = false;
      await expect(testRazorpaySetupResolver({}, {}, unauth)).rejects.toThrow(
        TalawaGraphQLError,
      );
    });

    it('validates key format (API rejection)', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([
        createMockConfig({ keyId: 'invalid_key' }),
      ]);
      mockOrders.create.mockRejectedValueOnce({
        error: { code: 'BAD_REQUEST_ERROR', description: 'Key ID format ...' },
      });

      const result = await testRazorpaySetupResolver({}, {}, ctx);
      expect(result.success).toBe(false);
    });

    it('returns error for missing API keys (null keyId/keySecret)', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([
        createMockConfig({ keyId: null, keySecret: null }),
      ]);
      const result = await testRazorpaySetupResolver({}, {}, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('API keys are not configured');
    });

    it('returns error for missing webhook secret (line 676)', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([
        createMockConfig({ webhookSecret: null }),
      ]);
      const result = await testRazorpaySetupResolver({}, {}, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Webhook secret is not configured');
    });

    it('returns specific error for invalid API credentials', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([createMockConfig()]);
      mockOrders.create.mockRejectedValueOnce(
        new Error('Invalid API credentials'),
      );

      const result = await testRazorpaySetupResolver({}, {}, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid API credentials');
    });

    it('returns specific error for webhook secret not configured error', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([createMockConfig()]);
      mockOrders.create.mockRejectedValueOnce(
        new Error('Webhook secret not configured'),
      );

      const result = await testRazorpaySetupResolver({}, {}, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Webhook secret not configured');
    });

    it('handles non-Error thrown values (line 734)', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([createMockConfig()]);
      mockOrders.create.mockRejectedValueOnce('string error');

      const result = await testRazorpaySetupResolver({}, {}, ctx);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Setup test failed');
    });

    it('throws for unauthenticated client (no user id, line 621)', async () => {
      const unauth = createMockRazorpayContext({});
      unauth.currentClient.user = undefined;
      await expect(testRazorpaySetupResolver({}, {}, unauth)).rejects.toThrow(
        TalawaGraphQLError,
      );
    });

    it('throws for non-authenticated isAuthenticated=false (line 637)', async () => {
      const unauth = createMockRazorpayContext({});
      unauth.currentClient.isAuthenticated = false;
      await expect(testRazorpaySetupResolver({}, {}, unauth)).rejects.toThrow(
        TalawaGraphQLError,
      );
    });
  });

  // --- Coverage: unauthenticated (no user.id) throws ---
  describe('unauthenticated (user undefined) coverage', () => {
    const cases = [
      [
        'updateRazorpayConfig',
        (c: typeof ctx) =>
          updateRazorpayConfigResolver({}, { input: updateConfigInput }, c),
      ],
      [
        'createPaymentOrder',
        (c: typeof ctx) =>
          createPaymentOrderResolver({}, { input: createOrderInput }, c),
      ],
      [
        'initiatePayment',
        (c: typeof ctx) =>
          initiatePaymentResolver({}, { input: initiatePaymentInput }, c),
      ],
    ] as const;
    it.each(cases)('%s throws when user is undefined', async (_name, fn) => {
      ctx.currentClient.user = undefined;
      await expect(fn(ctx)).rejects.toThrow(TalawaGraphQLError);
    });
  });

  // --- Coverage: isAuthenticated=false throws ---
  describe('isAuthenticated=false coverage', () => {
    it('createPaymentOrder throws for unauthenticated', async () => {
      ctx.currentClient.isAuthenticated = false;
      await expect(
        createPaymentOrderResolver({}, { input: createOrderInput }, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });
    it('initiatePayment throws for unauthenticated', async () => {
      ctx.currentClient.isAuthenticated = false;
      await expect(
        initiatePaymentResolver({}, { input: initiatePaymentInput }, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });
  });

  // --- Coverage: findFirst where-callback (operators.eq) ---
  describe('findFirst where-callback invocation', () => {
    it('updateRazorpayConfig invokes where callback', async () => {
      const ops = setupFindFirstWithCallback(ctx);
      ctx.drizzleClient.limit.mockResolvedValue([createMockConfig()]);
      ctx.drizzleClient.returning.mockResolvedValue([createMockConfig()]);
      await updateRazorpayConfigResolver({}, { input: updateConfigInput }, ctx);
      expect(ops.eq).toHaveBeenCalledWith('id_field', 'user-123');
    });
    it('testRazorpaySetup invokes where callback', async () => {
      const ops = setupFindFirstWithCallback(ctx);
      ctx.drizzleClient.limit.mockResolvedValue([createMockConfig()]);
      await testRazorpaySetupResolver({}, {}, ctx);
      expect(ops.eq).toHaveBeenCalledWith('id_field', 'user-123');
    });
  });

  // --- Coverage: catch blocks ---
  describe('catch block coverage', () => {
    it('updateRazorpayConfig catch block on DB error', async () => {
      ctx.drizzleClient.select.mockImplementation(() => {
        throw new Error('DB connection failed');
      });
      await expect(
        updateRazorpayConfigResolver({}, { input: updateConfigInput }, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });
    it('createPaymentOrder catch block on service error', async () => {
      mockOrders.create.mockRejectedValue(new Error('Razorpay API down'));
      await expect(
        createPaymentOrderResolver({}, { input: createOrderInput }, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });
  });

  // --- Coverage: internal null checks ---
  describe('internal null/undefined checks', () => {
    it('updateRazorpayConfig throws when newConfig is undefined (insert)', async () => {
      // Use fresh context to avoid mock state interference
      const freshCtx = setupContext();
      freshCtx.user.isSuperAdmin = true;

      // SELECT chain returns empty → triggers INSERT path
      freshCtx.drizzleClient.limit.mockResolvedValueOnce([]);
      // INSERT chain returns empty → newConfig = undefined
      freshCtx.drizzleClient.returning.mockResolvedValueOnce([]);

      await expect(
        updateRazorpayConfigResolver(
          {},
          { input: updateConfigInput },
          freshCtx,
        ),
      ).rejects.toThrow('Failed to create Razorpay configuration');
    });
    it('updateRazorpayConfig throws when existingConfigItem is undefined', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([undefined]);
      await expect(
        updateRazorpayConfigResolver({}, { input: updateConfigInput }, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });
    it('updateRazorpayConfig throws when updatedConfig is undefined', async () => {
      ctx.drizzleClient.limit.mockResolvedValue([createMockConfig()]);
      ctx.drizzleClient.returning.mockResolvedValue([undefined]);
      await expect(
        updateRazorpayConfigResolver({}, { input: updateConfigInput }, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });
    it('initiatePayment handles orderItem undefined', async () => {
      // Use fresh context to avoid mock state interference
      const freshCtx = setupContext();

      // SELECT chain returns [undefined] → orderItem = undefined
      freshCtx.drizzleClient.limit.mockResolvedValueOnce([undefined]);

      const result = await initiatePaymentResolver(
        {},
        { input: initiatePaymentInput },
        freshCtx,
      );
      expect(result.success).toBe(false);
    });
    it('verifyPayment handles configItem undefined', async () => {
      const input = createVerifyInput();
      ctx.drizzleClient.limit.mockResolvedValueOnce([undefined]);
      const result = await verifyPaymentResolver({}, { input }, ctx);
      expect(result.success).toBe(false);
    });
    it('verifyPayment handles orderItem undefined', async () => {
      const input = createVerifyInput();
      ctx.drizzleClient.limit
        .mockResolvedValueOnce([createMockConfig()])
        .mockResolvedValueOnce([undefined])
        .mockResolvedValueOnce([]);
      const result = await verifyPaymentResolver({}, { input }, ctx);
      expect(result.success).toBe(false);
    });
    it('createPaymentOrder throws when ctx.user is null', async () => {
      mockOrders.create.mockResolvedValue(createMockRazorpayOrder());
      ctx.user = null;
      await expect(
        createPaymentOrderResolver({}, { input: createOrderInput }, ctx),
      ).rejects.toThrow(TalawaGraphQLError);
    });
  });

  // --- registerRazorpayMutations ---
  describe('registerRazorpayMutations', () => {
    it('registers all mutation fields on the builder', () => {
      const mockBuilder = { mutationField: vi.fn() };
      registerRazorpayMutations(
        mockBuilder as unknown as Parameters<
          typeof registerRazorpayMutations
        >[0],
      );
      expect(mockBuilder.mutationField).toHaveBeenCalledTimes(5);
      for (const name of [
        'updateRazorpayConfig',
        'createPaymentOrder',
        'initiatePayment',
        'verifyPayment',
        'testRazorpaySetup',
      ]) {
        expect(mockBuilder.mutationField).toHaveBeenCalledWith(
          name,
          expect.any(Function),
        );
      }
    });
    it('passes correct field config to builder callbacks', () => {
      const fieldConfigs: Record<string, unknown> = {};
      const mockBuilder = {
        mutationField: vi.fn(
          (name: string, configFn: (t: Record<string, unknown>) => unknown) => {
            const mockT = {
              field: vi.fn((config: unknown) => config),
              arg: vi.fn((config: unknown) => config),
            };
            fieldConfigs[name] = configFn(mockT);
          },
        ),
      };
      registerRazorpayMutations(
        mockBuilder as unknown as Parameters<
          typeof registerRazorpayMutations
        >[0],
      );
      expect(Object.keys(fieldConfigs)).toHaveLength(5);
    });
  });

  // Smoke test for the Razorpay mock
  it('uses mocked razorpay', async () => {
    mockOrders.create.mockResolvedValue({ id: 'order_mock_123', amount: 100 });
    const Razorpay = (await import('razorpay')).default;
    const instance = new Razorpay({ key_id: '1', key_secret: '2' });
    const order = await instance.orders.create({
      amount: 100,
      currency: 'INR',
    });
    expect(order.id).toBe('order_mock_123');
  });
});
