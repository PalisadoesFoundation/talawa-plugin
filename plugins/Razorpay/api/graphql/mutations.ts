import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { z } from 'zod';
import { builder } from '~/src/graphql/builder';
import type { GraphQLContext } from '~/src/graphql/context';
import { TalawaGraphQLError } from '~/src/utilities/TalawaGraphQLError';
import {
  configTable,
  ordersTable,
  transactionsTable,
} from '../database/tables';
import {
  RazorpayConfigRef,
  RazorpayOrderRef,
  RazorpayPaymentResultRef,
  RazorpayTestResultRef,
} from './types';
import {
  RazorpayConfigInput,
  RazorpayOrderInput,
  RazorpayPaymentInput,
  RazorpayVerificationInput,
  razorpayConfigInputSchema,
  razorpayOrderInputSchema,
  razorpayPaymentInputSchema,
  razorpayVerificationInputSchema,
} from './inputs';

// Update Razorpay configuration resolver
const updateRazorpayConfigArgumentsSchema = z.object({
  input: razorpayConfigInputSchema,
});

export async function updateRazorpayConfigResolver(
  _parent: unknown,
  args: z.infer<typeof updateRazorpayConfigArgumentsSchema>,
  ctx: GraphQLContext,
) {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: { code: 'unauthenticated' },
    });
  }

  const {
    success,
    data: parsedArgs,
    error,
  } = updateRazorpayConfigArgumentsSchema.safeParse(args);

  if (!success) {
    throw new TalawaGraphQLError({
      extensions: {
        code: 'invalid_arguments',
        issues: error.issues.map((issue) => ({
          argumentPath: issue.path,
          message: issue.message,
        })),
      },
    });
  }

  try {
    // Check if config exists
    const existingConfig = await ctx.drizzleClient
      .select()
      .from(configTable)
      .limit(1);

    if (existingConfig.length === 0) {
      // Create new config
      const [newConfig] = await ctx.drizzleClient
        .insert(configTable)
        .values({
          keyId: parsedArgs.input.keyId,
          keySecret: parsedArgs.input.keySecret,
          webhookSecret: parsedArgs.input.webhookSecret,
          isEnabled: parsedArgs.input.isEnabled,
          testMode: parsedArgs.input.testMode,
          currency: parsedArgs.input.currency,
          description: parsedArgs.input.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newConfig) {
        throw new TalawaGraphQLError({
          extensions: { code: 'unexpected' },
        });
      }

      return {
        keyId: newConfig.keyId || undefined,
        keySecret: newConfig.keySecret || undefined,
        webhookSecret: newConfig.webhookSecret || undefined,
        isEnabled: newConfig.isEnabled || false,
        testMode: newConfig.testMode || true,
        currency: newConfig.currency || 'INR',
        description: newConfig.description || 'Donation to organization',
      };
    } else {
      // Update existing config
      const existingConfigItem = existingConfig[0];
      if (!existingConfigItem) {
        throw new TalawaGraphQLError({
          extensions: { code: 'unexpected' },
        });
      }

      const [updatedConfig] = await ctx.drizzleClient
        .update(configTable)
        .set({
          keyId: parsedArgs.input.keyId,
          keySecret: parsedArgs.input.keySecret,
          webhookSecret: parsedArgs.input.webhookSecret,
          isEnabled: parsedArgs.input.isEnabled,
          testMode: parsedArgs.input.testMode,
          currency: parsedArgs.input.currency,
          description: parsedArgs.input.description,
          updatedAt: new Date(),
        })
        .where(eq(configTable.id, existingConfigItem.id))
        .returning();

      if (!updatedConfig) {
        throw new TalawaGraphQLError({
          extensions: { code: 'unexpected' },
        });
      }

      return {
        keyId: updatedConfig.keyId || undefined,
        keySecret: updatedConfig.keySecret || undefined,
        webhookSecret: updatedConfig.webhookSecret || undefined,
        isEnabled: updatedConfig.isEnabled || false,
        testMode: updatedConfig.testMode || true,
        currency: updatedConfig.currency || 'INR',
        description: updatedConfig.description || 'Donation to organization',
      };
    }
  } catch (error) {
    ctx.log?.error('Error updating Razorpay config:', error);
    throw new TalawaGraphQLError({
      extensions: { code: 'unexpected' },
    });
  }
}

// Create payment order resolver
const createPaymentOrderArgumentsSchema = z.object({
  input: razorpayOrderInputSchema,
});

export async function createPaymentOrderResolver(
  _parent: unknown,
  args: z.infer<typeof createPaymentOrderArgumentsSchema>,
  ctx: GraphQLContext,
) {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: { code: 'unauthenticated' },
    });
  }

  const {
    success,
    data: parsedArgs,
    error,
  } = createPaymentOrderArgumentsSchema.safeParse(args);

  if (!success) {
    throw new TalawaGraphQLError({
      extensions: {
        code: 'invalid_arguments',
        issues: error.issues.map((issue) => ({
          argumentPath: issue.path,
          message: issue.message,
        })),
      },
    });
  }

  try {
    // Generate Razorpay order ID
    const razorpayOrderId = `order_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const [order] = await ctx.drizzleClient
      .insert(ordersTable)
      .values({
        razorpayOrderId,
        organizationId: parsedArgs.input.organizationId,
        userId: parsedArgs.input.userId,
        amount: parsedArgs.input.amount,
        currency: parsedArgs.input.currency,
        receipt: `receipt_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        status: 'created',
        donorName: parsedArgs.input.donorName,
        donorEmail: parsedArgs.input.donorEmail,
        description: parsedArgs.input.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!order) {
      throw new TalawaGraphQLError({
        extensions: { code: 'unexpected' },
      });
    }

    return {
      id: order.id,
      razorpayOrderId: order.razorpayOrderId || undefined,
      organizationId: order.organizationId || undefined,
      userId: order.userId || undefined,
      amount: order.amount || undefined,
      currency: order.currency || 'INR',
      status: order.status || 'created',
      donorName: order.donorName || undefined,
      donorEmail: order.donorEmail || undefined,
      donorPhone: order.donorPhone || undefined,
      description: order.description || undefined,
      anonymous: order.anonymous || false,
      createdAt: order.createdAt || new Date(),
      updatedAt: order.updatedAt || new Date(),
    };
  } catch (error) {
    ctx.log?.error('Error creating payment order:', error);
    throw new TalawaGraphQLError({
      extensions: { code: 'unexpected' },
    });
  }
}

// Initiate payment resolver
const initiatePaymentArgumentsSchema = z.object({
  input: razorpayPaymentInputSchema,
});

export async function initiatePaymentResolver(
  _parent: unknown,
  args: z.infer<typeof initiatePaymentArgumentsSchema>,
  ctx: GraphQLContext,
) {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: { code: 'unauthenticated' },
    });
  }

  const {
    success,
    data: parsedArgs,
    error,
  } = initiatePaymentArgumentsSchema.safeParse(args);

  if (!success) {
    throw new TalawaGraphQLError({
      extensions: {
        code: 'invalid_arguments',
        issues: error.issues.map((issue) => ({
          argumentPath: issue.path,
          message: issue.message,
        })),
      },
    });
  }

  try {
    // Get order details
    const order = await ctx.drizzleClient
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, parsedArgs.input.orderId))
      .limit(1);

    if (order.length === 0) {
      throw new TalawaGraphQLError({
        extensions: {
          code: 'arguments_associated_resources_not_found',
          issues: [{ argumentPath: ['input', 'orderId'] }],
        },
      });
    }

    const orderItem = order[0];
    if (!orderItem) {
      throw new TalawaGraphQLError({
        extensions: { code: 'unexpected' },
      });
    }

    // Get Razorpay configuration
    const config = await ctx.drizzleClient.select().from(configTable).limit(1);

    if (config.length === 0) {
      throw new TalawaGraphQLError({
        extensions: {
          code: 'arguments_associated_resources_not_found',
          issues: [{ argumentPath: ['input', 'orderId'] }],
        },
      });
    }

    // Generate payment ID
    const paymentId = `pay_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create transaction record
    const [transaction] = await ctx.drizzleClient
      .insert(transactionsTable)
      .values({
        paymentId,
        orderId: orderItem.id,
        organizationId: orderItem.organizationId,
        userId: orderItem.userId,
        amount: orderItem.amount,
        currency: orderItem.currency,
        status: 'pending',
        method: parsedArgs.input.paymentMethod,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update order status
    await ctx.drizzleClient
      .update(ordersTable)
      .set({
        status: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, orderItem.id));

    return {
      success: true,
      message: 'Payment initiated successfully',
      orderId: orderItem.id,
      paymentId: paymentId,
      amount: orderItem.amount || undefined,
      currency: orderItem.currency || 'INR',
      transaction: {
        paymentId: paymentId,
        status: 'pending',
        amount: orderItem.amount || undefined,
        currency: orderItem.currency || 'INR',
      },
    };
  } catch (error) {
    ctx.log?.error('Error initiating payment:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to initiate payment',
      transaction: null,
    };
  }
}

// Verify payment resolver
const verifyPaymentArgumentsSchema = z.object({
  input: razorpayVerificationInputSchema,
});

export async function verifyPaymentResolver(
  _parent: unknown,
  args: z.infer<typeof verifyPaymentArgumentsSchema>,
  ctx: GraphQLContext,
) {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: { code: 'unauthenticated' },
    });
  }

  const {
    success,
    data: parsedArgs,
    error,
  } = verifyPaymentArgumentsSchema.safeParse(args);

  if (!success) {
    throw new TalawaGraphQLError({
      extensions: {
        code: 'invalid_arguments',
        issues: error.issues.map((issue) => ({
          argumentPath: issue.path,
          message: issue.message,
        })),
      },
    });
  }

  try {
    // Get Razorpay configuration
    const config = await ctx.drizzleClient.select().from(configTable).limit(1);

    if (config.length === 0) {
      throw new TalawaGraphQLError({
        extensions: {
          code: 'arguments_associated_resources_not_found',
          issues: [{ argumentPath: ['input', 'razorpayOrderId'] }],
        },
      });
    }

    const configItem = config[0];
    if (!configItem) {
      throw new TalawaGraphQLError({
        extensions: { code: 'unexpected' },
      });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', configItem.webhookSecret || '')
      .update(
        `${parsedArgs.input.razorpayOrderId}|${parsedArgs.input.razorpayPaymentId}`,
      )
      .digest('hex');

    if (expectedSignature !== parsedArgs.input.razorpaySignature) {
      throw new TalawaGraphQLError({
        extensions: {
          code: 'unauthorized_action_on_arguments_associated_resources',
          issues: [{ argumentPath: ['input', 'razorpaySignature'] }],
        },
      });
    }

    // Get order details
    const order = await ctx.drizzleClient
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.razorpayOrderId, parsedArgs.input.razorpayOrderId))
      .limit(1);

    if (order.length === 0) {
      throw new TalawaGraphQLError({
        extensions: {
          code: 'arguments_associated_resources_not_found',
          issues: [{ argumentPath: ['input', 'razorpayOrderId'] }],
        },
      });
    }

    // Parse payment data
    const paymentData = JSON.parse(parsedArgs.input.paymentData);

    // Create or update transaction
    const existingTransaction = await ctx.drizzleClient
      .select()
      .from(transactionsTable)
      .where(
        eq(transactionsTable.paymentId, parsedArgs.input.razorpayPaymentId),
      )
      .limit(1);

    const orderItem = order[0];
    if (!orderItem) {
      throw new TalawaGraphQLError({
        extensions: { code: 'unexpected' },
      });
    }

    const transactionData = {
      paymentId: parsedArgs.input.razorpayPaymentId,
      orderId: orderItem.id,
      organizationId: orderItem.organizationId,
      userId: orderItem.userId,
      amount: orderItem.amount,
      currency: orderItem.currency,
      status: 'captured',
      method: paymentData.method,
      bank: paymentData.bank,
      wallet: paymentData.wallet,
      cardId: paymentData.card_id,
      vpa: paymentData.vpa,
      email: paymentData.email,
      contact: paymentData.contact,
      fee: paymentData.fee,
      tax: paymentData.tax,
      capturedAt: new Date(),
    };

    if (existingTransaction.length === 0) {
      // Create new transaction
      await ctx.drizzleClient.insert(transactionsTable).values(transactionData);
    } else {
      // Update existing transaction
      await ctx.drizzleClient
        .update(transactionsTable)
        .set({
          ...transactionData,
          updatedAt: new Date(),
        })
        .where(
          eq(transactionsTable.paymentId, parsedArgs.input.razorpayPaymentId),
        );
    }

    // Update order status
    await ctx.drizzleClient
      .update(ordersTable)
      .set({
        status: 'paid',
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, orderItem.id));

    return {
      success: true,
      message: 'Payment verified successfully',
      transaction: {
        paymentId: parsedArgs.input.razorpayPaymentId,
        status: 'captured',
        amount: orderItem.amount || undefined,
        currency: orderItem.currency || 'INR',
      },
    };
  } catch (error) {
    ctx.log?.error('Error verifying payment:', error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to verify payment',
      transaction: null,
    };
  }
}

// Test Razorpay connection resolver
export async function testRazorpayConnectionResolver(
  _parent: unknown,
  _args: Record<string, unknown>,
  ctx: GraphQLContext,
) {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: { code: 'unauthenticated' },
    });
  }

  try {
    // Get current configuration
    const config = await ctx.drizzleClient.select().from(configTable).limit(1);

    if (config.length === 0 || !config[0]) {
      return {
        success: false,
        message:
          'No Razorpay configuration found. Please configure your API keys first.',
      };
    }

    const configItem = config[0];

    if (!configItem.keyId || !configItem.keySecret) {
      return {
        success: false,
        message:
          'API keys are not configured. Please enter your Key ID and Key Secret.',
      };
    }

    // Import Razorpay service to test connection
    const { createRazorpayService } = await import(
      '../services/razorpayService'
    );
    const razorpayService = createRazorpayService(ctx);

    // Test the connection by making a simple API call
    const testResult = await razorpayService.testConnection();

    return {
      success: testResult.success,
      message: testResult.message,
    };
  } catch (error) {
    ctx.log?.error('Error testing Razorpay connection:', error);
    return {
      success: false,
      message:
        'Connection test failed. Please check your API keys and try again.',
    };
  }
}

// Register all Razorpay mutations with the builder
export function registerRazorpayMutations(
  builderInstance: typeof builder,
): void {
  // Update Razorpay configuration
  builderInstance.mutationField('updateRazorpayConfig', (t) =>
    t.field({
      type: RazorpayConfigRef,
      args: {
        input: t.arg({
          type: RazorpayConfigInput,
          required: true,
          description: 'Razorpay configuration input',
        }),
      },
      description: 'Update Razorpay configuration settings',
      resolve: updateRazorpayConfigResolver,
    }),
  );

  // Create payment order
  builderInstance.mutationField('createPaymentOrder', (t) =>
    t.field({
      type: RazorpayOrderRef,
      args: {
        input: t.arg({
          type: RazorpayOrderInput,
          required: true,
          description: 'Payment order input',
        }),
      },
      description: 'Create a new payment order',
      resolve: createPaymentOrderResolver,
    }),
  );

  // Initiate payment
  builderInstance.mutationField('initiatePayment', (t) =>
    t.field({
      type: RazorpayPaymentResultRef,
      args: {
        input: t.arg({
          type: RazorpayPaymentInput,
          required: true,
          description: 'Payment initiation input',
        }),
      },
      description: 'Initiate a payment transaction',
      resolve: initiatePaymentResolver,
    }),
  );

  // Verify payment
  builderInstance.mutationField('verifyPayment', (t) =>
    t.field({
      type: RazorpayPaymentResultRef,
      args: {
        input: t.arg({
          type: RazorpayVerificationInput,
          required: true,
          description: 'Payment verification input',
        }),
      },
      description: 'Verify payment signature and update transaction status',
      resolve: verifyPaymentResolver,
    }),
  );

  // Test Razorpay connection
  builderInstance.mutationField('testRazorpayConnection', (t) =>
    t.field({
      type: RazorpayTestResultRef,
      description: 'Test Razorpay API connection with current credentials',
      resolve: testRazorpayConnectionResolver,
    }),
  );
}
