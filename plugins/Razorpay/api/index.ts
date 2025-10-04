import type { IPluginContext, IPluginLifecycle } from "../../types";
import { eq } from "drizzle-orm";

// Export database tables and GraphQL resolvers
export * from "./database/tables";
export * from "./graphql/queries";
export * from "./graphql/mutations";

// Export services
export * from "./services/razorpayService";

// Lifecycle hooks
export async function onLoad(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info("Razorpay Plugin loaded successfully");
  }

  // Initialize plugin tables if they don't exist
  try {
    const { configTable, transactionsTable, ordersTable } = await import(
      "./database/tables"
    );

    // Check if tables exist by trying to query them
    if (
      context.db &&
      typeof context.db === "object" &&
      "select" in context.db
    ) {
      const db = context.db as any;
      await db.select().from(configTable).limit(1);
      await db.select().from(transactionsTable).limit(1);
      await db.select().from(ordersTable).limit(1);
    }

    if (context.logger?.info) {
      context.logger.info("Razorpay plugin tables verified");
    }
  } catch (error) {
    if (context.logger?.warn) {
      context.logger.warn("Failed to verify Razorpay plugin tables:", error);
    }
  }
}

export async function onActivate(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info("Razorpay Plugin activated");
  }

  // Initialize Razorpay configuration
  try {
    // Set up default configuration if not exists
    const { configTable } = await import("./database/tables");

    if (
      context.db &&
      typeof context.db === "object" &&
      "select" in context.db
    ) {
      const db = context.db as any;
      const existingConfig = await db.select().from(configTable).limit(1);

      if (existingConfig.length === 0) {
        // Create default configuration
        await db.insert(configTable).values({
          keyId: "",
          keySecret: "",
          webhookSecret: "",
          isEnabled: false,
          testMode: true,
          currency: "INR",
          description: "Donation to organization",
        });

        if (context.logger?.info) {
          context.logger.info("Default Razorpay configuration created");
        }
      }
    }

    if (context.logger?.info) {
      context.logger.info("Razorpay configuration initialized");
    }
  } catch (error) {
    if (context.logger?.error) {
      context.logger.error(
        "Failed to initialize Razorpay configuration:",
        error
      );
    }
  }

  // Register GraphQL schema extensions
  if (context.graphql) {
    try {
      if (context.logger?.info) {
        context.logger.info(
          "GraphQL schema extensions registered for Razorpay Plugin"
        );
      }
    } catch (error) {
      if (context.logger?.error) {
        context.logger.error("Failed to register GraphQL extensions:", error);
      }
    }
  }
}

export async function onDeactivate(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info("Razorpay Plugin deactivated");
  }

  // Cleanup plugin-specific resources
  try {
    // Clean up any active payment sessions
    if (context.logger?.info) {
      context.logger.info("Razorpay plugin cleanup completed");
    }
  } catch (error) {
    if (context.logger?.error) {
      context.logger.error("Failed to cleanup Razorpay plugin:", error);
    }
  }
}

export async function onUnload(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info("Razorpay Plugin unloaded");
  }
}

// Event handlers
export async function onPaymentCreated(
  data: any,
  context: IPluginContext
): Promise<void> {
  try {
    if (context.logger?.info) {
      context.logger.info(`Payment created: ${data.paymentId}`);
    }

    // Notify via pubsub if available
    if (context.pubsub) {
      (context.pubsub as any).publish("payment:notification", {
        type: "payment_created",
        paymentId: data.paymentId,
        organizationId: data.organizationId,
        amount: data.amount,
        message: `New payment of ${data.amount} created`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    if (context.logger?.error) {
      context.logger.error("Error in onPaymentCreated:", error);
    }
  }
}

export async function onPaymentCompleted(
  data: any,
  context: IPluginContext
): Promise<void> {
  try {
    if (context.logger?.info) {
      context.logger.info(`Payment completed: ${data.paymentId}`);
    }

    // Update transaction status
    const { transactionsTable } = await import("./database/tables");

    if (
      context.db &&
      typeof context.db === "object" &&
      "update" in context.db
    ) {
      const db = context.db as any;
      await db
        .update(transactionsTable)
        .set({
          status: "captured",
          updatedAt: new Date(),
        })
        .where(eq(transactionsTable.paymentId, data.paymentId));
    }

    // Notify via pubsub if available
    if (context.pubsub) {
      (context.pubsub as any).publish("payment:notification", {
        type: "payment_completed",
        paymentId: data.paymentId,
        organizationId: data.organizationId,
        amount: data.amount,
        message: `Payment of ${data.amount} completed successfully`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    if (context.logger?.error) {
      context.logger.error("Error in onPaymentCompleted:", error);
    }
  }
}

export async function onPaymentFailed(
  data: any,
  context: IPluginContext
): Promise<void> {
  try {
    if (context.logger?.info) {
      context.logger.info(`Payment failed: ${data.paymentId}`);
    }

    // Update transaction status
    const { transactionsTable } = await import("./database/tables");

    if (
      context.db &&
      typeof context.db === "object" &&
      "update" in context.db
    ) {
      const db = context.db as any;
      await db
        .update(transactionsTable)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(transactionsTable.paymentId, data.paymentId));
    }

    // Notify via pubsub if available
    if (context.pubsub) {
      (context.pubsub as any).publish("payment:notification", {
        type: "payment_failed",
        paymentId: data.paymentId,
        organizationId: data.organizationId,
        amount: data.amount,
        message: `Payment of ${data.amount} failed`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    if (context.logger?.error) {
      context.logger.error("Error in onPaymentFailed:", error);
    }
  }
}

// Utility functions for the plugin
export async function getPluginInfo(context: IPluginContext) {
  return {
    name: "Razorpay Payment Gateway",
    version: "1.0.0",
    description:
      "A payment gateway plugin that integrates Razorpay for donations and payments within organizations.",
    features: [
      "Razorpay payment gateway integration",
      "Payment order creation and management",
      "Transaction tracking and history",
      "Webhook handling for payment updates",
      "Organization-specific transaction summaries",
      "User transaction history across organizations",
      "Payment verification and security",
      "Test and production mode support",
    ],
    tables: ["razorpay_config", "razorpay_transactions", "razorpay_orders"],
    graphqlOperations: [
      "getRazorpayConfig",
      "updateRazorpayConfig",
      "testRazorpayConnection",
      "getOrganizationTransactions",
      "getUserTransactions",
      "getOrganizationTransactionStats",
      "getUserTransactionStats",
      "createPaymentOrder",
      "initiatePayment",
      "verifyPayment",
    ],
    events: ["payment:created", "payment:completed", "payment:failed"],
    webhooks: [
      "POST /api/plugins/razorpay/webhook/ - Razorpay webhook endpoint",
    ],
  };
}

// Webhook handler for Razorpay - Standard implementation per Razorpay docs
export async function handleRazorpayWebhook(
  request: any,
  reply: any
): Promise<void> {
  try {
    const webhookData = request.body;
    
    // Basic webhook data validation
    if (!webhookData || !webhookData.payload || !webhookData.payload.payment) {
      return reply.status(400).send({ 
        error: "Invalid webhook data",
        message: "Missing required webhook payload structure"
      });
    }

    const { payment } = webhookData.payload;
    const paymentEntity = payment.entity;

    // Log the webhook for debugging
    console.log(`🔗 Razorpay webhook received: ${paymentEntity.id} - ${paymentEntity.status}`);

    console.log(`Payment Details:
      - ID: ${paymentEntity.id}
      - Status: ${paymentEntity.status}
      - Amount: ${paymentEntity.amount} ${paymentEntity.currency}
      - Method: ${paymentEntity.method}
      - Order ID: ${paymentEntity.order_id}
      - Email: ${paymentEntity.email}
      - Captured: ${paymentEntity.captured}
    `);

    // Get plugin context from request
    const pluginContext = (request as any).pluginContext;
    if (!pluginContext) {
      console.error("Plugin context not available in webhook");
      return reply.status(500).send({ 
        error: "Plugin context not available",
        message: "Cannot process webhook without plugin context"
      });
    }

    // Verify webhook signature manually
    const signature = request.headers['x-razorpay-signature'] as string;
    const webhookBody = JSON.stringify(webhookData);
    
    // Get webhook secret from config
    const { configTable } = await import("./database/tables");
    const config = await pluginContext.db
      .select()
      .from(configTable)
      .limit(1);

    if (config.length === 0 || !config[0]?.webhookSecret) {
      console.error("Webhook secret not configured");
      return reply.status(500).send({ 
        error: "Webhook secret not configured",
        message: "Cannot verify webhook signature without webhook secret"
      });
    }

    // Verify signature
    const crypto = await import("node:crypto");
    const expectedSignature = crypto
      .createHmac("sha256", config[0].webhookSecret)
      .update(webhookBody)
      .digest("hex");

    const isValidSignature = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
    );

    if (!isValidSignature) {
      console.error("Invalid webhook signature");
      return reply.status(400).send({ 
        error: "Invalid signature",
        message: "Webhook signature verification failed"
      });
    }

    // Process webhook directly with database access
    const { ordersTable, transactionsTable } = await import("./database/tables");
    const { eq } = await import("drizzle-orm");

    // Get order details to get userId and other info
    const orderDetails = await pluginContext.db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.razorpayOrderId, paymentEntity.order_id))
      .limit(1);

    if (orderDetails.length === 0) {
      console.error(`Order not found for payment: ${paymentEntity.id}`);
      return reply.status(400).send({ 
        error: "Order not found",
        message: `Order not found for payment: ${paymentEntity.id}`
      });
    }

    const order = orderDetails[0];

    // Check if transaction already exists
    const existingTransaction = await pluginContext.db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.paymentId, paymentEntity.id))
      .limit(1);

    if (existingTransaction.length === 0) {
      // Create new transaction with userId from order
      await pluginContext.db
        .insert(transactionsTable)
        .values({
          paymentId: paymentEntity.id,
          orderId: order.id,
          organizationId: order.organizationId,
          userId: order.userId, // Use userId from order
          amount: order.amount,
          currency: order.currency,
          status: paymentEntity.status,
          method: paymentEntity.method,
          bank: paymentEntity.bank || undefined,
          wallet: paymentEntity.wallet || undefined,
          vpa: paymentEntity.vpa || undefined,
          email: paymentEntity.email,
          contact: paymentEntity.contact,
          fee: paymentEntity.fee,
          tax: paymentEntity.tax,
          errorCode: paymentEntity.error_code || undefined,
          errorDescription: paymentEntity.error_description || undefined,
          refundStatus: paymentEntity.refund_status || undefined,
          capturedAt: paymentEntity.captured
            ? new Date(paymentEntity.created_at * 1000)
            : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
    } else {
      // Update existing transaction
      await pluginContext.db
        .update(transactionsTable)
        .set({
          status: paymentEntity.status,
          method: paymentEntity.method,
          bank: paymentEntity.bank || undefined,
          wallet: paymentEntity.wallet || undefined,
          vpa: paymentEntity.vpa || undefined,
          email: paymentEntity.email,
          contact: paymentEntity.contact,
          fee: paymentEntity.fee,
          tax: paymentEntity.tax,
          errorCode: paymentEntity.error_code || undefined,
          errorDescription: paymentEntity.error_description || undefined,
          refundStatus: paymentEntity.refund_status || undefined,
          capturedAt: paymentEntity.captured
            ? new Date(paymentEntity.created_at * 1000)
            : undefined,
          updatedAt: new Date(),
        })
        .where(eq(transactionsTable.paymentId, paymentEntity.id));
    }

    // Update order status if payment is captured
    if (paymentEntity.captured) {
      await pluginContext.db
        .update(ordersTable)
        .set({
          status: "paid",
          updatedAt: new Date(),
        })
        .where(eq(ordersTable.razorpayOrderId, paymentEntity.order_id));
    }

    // Return success response as per Razorpay docs
    reply.status(200).send({ 
      status: "success",
      message: "Webhook processed successfully"
    });

  } catch (error) {
    console.error("Razorpay webhook error:", error);
    reply.status(500).send({ 
      error: "Webhook processing failed",
      message: error instanceof Error ? error.message : "Unknown error"
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
