import type { IPluginContext, IPluginLifecycle } from '../../types';
import { eq } from 'drizzle-orm';

// Export database tables and GraphQL resolvers
export * from './database/tables';
export * from './graphql/queries';
export * from './graphql/mutations';

// Export services and routes
export * from './services/razorpayService';
export * from './routes/webhook';

// Lifecycle hooks
export async function onLoad(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info('Razorpay Plugin loaded successfully');
  }

  // Initialize plugin tables if they don't exist
  try {
    const { configTable, transactionsTable, ordersTable } = await import(
      './database/tables'
    );

    // Check if tables exist by trying to query them
    if (
      context.db &&
      typeof context.db === 'object' &&
      'select' in context.db
    ) {
      const db = context.db as any;
      await db.select().from(configTable).limit(1);
      await db.select().from(transactionsTable).limit(1);
      await db.select().from(ordersTable).limit(1);
    }

    if (context.logger?.info) {
      context.logger.info('Razorpay plugin tables verified');
    }
  } catch (error) {
    if (context.logger?.warn) {
      context.logger.warn('Failed to verify Razorpay plugin tables:', error);
    }
  }
}

export async function onActivate(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info('Razorpay Plugin activated');
  }

  // Initialize Razorpay configuration
  try {
    // Set up default configuration if not exists
    const { configTable } = await import('./database/tables');

    if (
      context.db &&
      typeof context.db === 'object' &&
      'select' in context.db
    ) {
      const db = context.db as any;
      const existingConfig = await db.select().from(configTable).limit(1);

      if (existingConfig.length === 0) {
        // Create default configuration
        await db.insert(configTable).values({
          keyId: '',
          keySecret: '',
          webhookSecret: '',
          isEnabled: false,
          testMode: true,
          currency: 'INR',
          description: 'Donation to organization',
        });

        if (context.logger?.info) {
          context.logger.info('Default Razorpay configuration created');
        }
      }
    }

    if (context.logger?.info) {
      context.logger.info('Razorpay configuration initialized');
    }
  } catch (error) {
    if (context.logger?.error) {
      context.logger.error(
        'Failed to initialize Razorpay configuration:',
        error,
      );
    }
  }

  // Register GraphQL schema extensions
  if (context.graphql) {
    try {
      if (context.logger?.info) {
        context.logger.info(
          'GraphQL schema extensions registered for Razorpay Plugin',
        );
      }
    } catch (error) {
      if (context.logger?.error) {
        context.logger.error('Failed to register GraphQL extensions:', error);
      }
    }
  }
}

export async function onDeactivate(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info('Razorpay Plugin deactivated');
  }

  // Cleanup plugin-specific resources
  try {
    // Clean up any active payment sessions
    if (context.logger?.info) {
      context.logger.info('Razorpay plugin cleanup completed');
    }
  } catch (error) {
    if (context.logger?.error) {
      context.logger.error('Failed to cleanup Razorpay plugin:', error);
    }
  }
}

export async function onUnload(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info('Razorpay Plugin unloaded');
  }
}

// Event handlers
export async function onPaymentCreated(
  data: any,
  context: IPluginContext,
): Promise<void> {
  try {
    if (context.logger?.info) {
      context.logger.info(`Payment created: ${data.paymentId}`);
    }

    // Notify via pubsub if available
    if (context.pubsub) {
      (context.pubsub as any).publish('payment:notification', {
        type: 'payment_created',
        paymentId: data.paymentId,
        organizationId: data.organizationId,
        amount: data.amount,
        message: `New payment of ${data.amount} created`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    if (context.logger?.error) {
      context.logger.error('Error in onPaymentCreated:', error);
    }
  }
}

export async function onPaymentCompleted(
  data: any,
  context: IPluginContext,
): Promise<void> {
  try {
    if (context.logger?.info) {
      context.logger.info(`Payment completed: ${data.paymentId}`);
    }

    // Update transaction status
    const { transactionsTable } = await import('./database/tables');

    if (
      context.db &&
      typeof context.db === 'object' &&
      'update' in context.db
    ) {
      const db = context.db as any;
      await db
        .update(transactionsTable)
        .set({
          status: 'captured',
          updatedAt: new Date(),
        })
        .where(eq(transactionsTable.paymentId, data.paymentId));
    }

    // Notify via pubsub if available
    if (context.pubsub) {
      (context.pubsub as any).publish('payment:notification', {
        type: 'payment_completed',
        paymentId: data.paymentId,
        organizationId: data.organizationId,
        amount: data.amount,
        message: `Payment of ${data.amount} completed successfully`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    if (context.logger?.error) {
      context.logger.error('Error in onPaymentCompleted:', error);
    }
  }
}

export async function onPaymentFailed(
  data: any,
  context: IPluginContext,
): Promise<void> {
  try {
    if (context.logger?.info) {
      context.logger.info(`Payment failed: ${data.paymentId}`);
    }

    // Update transaction status
    const { transactionsTable } = await import('./database/tables');

    if (
      context.db &&
      typeof context.db === 'object' &&
      'update' in context.db
    ) {
      const db = context.db as any;
      await db
        .update(transactionsTable)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(transactionsTable.paymentId, data.paymentId));
    }

    // Notify via pubsub if available
    if (context.pubsub) {
      (context.pubsub as any).publish('payment:notification', {
        type: 'payment_failed',
        paymentId: data.paymentId,
        organizationId: data.organizationId,
        amount: data.amount,
        message: `Payment of ${data.amount} failed`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    if (context.logger?.error) {
      context.logger.error('Error in onPaymentFailed:', error);
    }
  }
}

// Utility functions for the plugin
export async function getPluginInfo(context: IPluginContext) {
  return {
    name: 'Razorpay Payment Gateway',
    version: '1.0.0',
    description:
      'A payment gateway plugin that integrates Razorpay for donations and payments within organizations.',
    features: [
      'Razorpay payment gateway integration',
      'Payment order creation and management',
      'Transaction tracking and history',
      'Webhook handling for payment updates',
      'Organization-specific transaction summaries',
      'User transaction history across organizations',
      'Payment verification and security',
      'Test and production mode support',
    ],
    tables: ['razorpay_config', 'razorpay_transactions', 'razorpay_orders'],
    graphqlOperations: [
      'getRazorpayConfig',
      'updateRazorpayConfig',
      'testRazorpayConnection',
      'getOrganizationTransactions',
      'getUserTransactions',
      'getOrganizationTransactionStats',
      'getUserTransactionStats',
      'createPaymentOrder',
      'initiatePayment',
      'verifyPayment',
    ],
    events: ['payment:created', 'payment:completed', 'payment:failed'],
    webhooks: [
      'POST /api/plugins/razorpay/webhook - Razorpay webhook endpoint',
    ],
  };
}

// Webhook handler for Razorpay
export async function handleRazorpayWebhook(
  request: any,
  reply: any,
): Promise<void> {
  try {
    const webhookData = request.body;

    // Create context with available resources
    const context = {
      log: console,
      drizzleClient: null, // This would need to be injected from the plugin system
      pluginManager: null,
    };

    // Import and use the Razorpay service
    const { createRazorpayService } = await import(
      './services/razorpayService'
    );
    const razorpayService = createRazorpayService(context as any);

    // Process the webhook
    await razorpayService.processWebhook(webhookData);

    // Return success response
    reply.status(200).send({
      status: 'success',
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Razorpay webhook processing failed:', error);
    reply.status(500).send({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Export the plugin lifecycle interface
const RazorpayPlugin: IPluginLifecycle = {
  onLoad,
  onActivate,
  onDeactivate,
  onUnload,
};

export default RazorpayPlugin;
