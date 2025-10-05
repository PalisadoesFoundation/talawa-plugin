import crypto from "node:crypto";
import Razorpay from "razorpay";
import type { GraphQLContext } from "~/src/graphql/context";
import {
  configTable,
  ordersTable,
  transactionsTable,
} from "../database/tables";
import { eq } from "drizzle-orm";

export interface RazorpayOrderData {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayPaymentData {
  amount: number;
  currency: string;
  receipt: string;
  payment_capture: number;
  notes?: Record<string, string>;
}

export interface RazorpayWebhookData {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        method: string;
        amount_refunded: number;
        refund_status: string | null;
        captured: boolean;
        description: string;
        card_id: string | null;
        bank: string | null;
        wallet: string | null;
        vpa: string | null;
        email: string;
        contact: string;
        fee: number;
        tax: number;
        error_code: string | null;
        error_description: string | null;
        created_at: number;
      };
    };
  };
}

export class RazorpayService {
  private razorpay: Razorpay | null = null;
  private context: GraphQLContext;

  constructor(context: GraphQLContext) {
    this.context = context;
  }

  async initialize(): Promise<void> {
    try {
      const config = await this.context.drizzleClient
        .select()
        .from(configTable)
        .limit(1);

      if (config.length === 0 || !config[0]?.keyId || !config[0]?.keySecret) {
        throw new Error("Razorpay configuration not found or incomplete");
      }

      const configItem = config[0];
      this.razorpay = new Razorpay({
        key_id: configItem?.keyId,
        key_secret: configItem?.keySecret,
      });

      this.context.log?.info("Razorpay service initialized successfully");
    } catch (error) {
      this.context.log?.error("Failed to initialize Razorpay service:", error);
      throw error;
    }
  }

  async createOrder(orderData: RazorpayOrderData): Promise<any> {
    if (!this.razorpay) {
      await this.initialize();
    }

    try {
      const order = await this.razorpay!.orders.create({
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        notes: orderData.notes,
      });

      this.context.log?.info(`Razorpay order created: ${order.id}`);
      return order;
    } catch (error) {
      this.context.log?.error("Failed to create Razorpay order:", error);
      throw error;
    }
  }

  async createPayment(paymentData: RazorpayPaymentData): Promise<any> {
    if (!this.razorpay) {
      await this.initialize();
    }

    try {
      const payment = await this.razorpay!.payments.create({
        amount: paymentData.amount,
        currency: paymentData.currency,
        receipt: paymentData.receipt,
        payment_capture: paymentData.payment_capture,
        notes: paymentData.notes,
      });

      this.context.log?.info(`Razorpay payment created: ${payment.id}`);
      return payment;
    } catch (error) {
      this.context.log?.error("Failed to create Razorpay payment:", error);
      throw error;
    }
  }

  async verifyPayment(
    paymentId: string,
    orderId: string,
    signature: string,
    paymentData: string,
  ): Promise<boolean> {
    try {
      const config = await this.context.drizzleClient
        .select()
        .from(configTable)
        .limit(1);

      if (config.length === 0 || !config[0]?.webhookSecret) {
        throw new Error("Webhook secret not configured");
      }

      const expectedSignature = crypto
        .createHmac("sha256", config[0]?.webhookSecret)
        .update(paymentData)
        .digest("hex");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(signature, "hex"),
      );

      this.context.log?.info(`Payment verification result: ${isValid}`);
      return isValid;
    } catch (error) {
      this.context.log?.error("Failed to verify payment:", error);
      throw error;
    }
  }

  async processWebhook(webhookData: RazorpayWebhookData): Promise<void> {
    try {
      const { payment } = webhookData.payload;
      const paymentEntity = payment.entity;

      // Update transaction in database
      await this.context.drizzleClient
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

      // Update order status if payment is captured
      if (paymentEntity.captured) {
        await this.context.drizzleClient
          .update(ordersTable)
          .set({
            status: "paid",
            updatedAt: new Date(),
          })
          .where(eq(ordersTable.razorpayOrderId, paymentEntity.order_id));
      }

      this.context.log?.info(
        `Webhook processed for payment: ${paymentEntity.id}`,
      );
    } catch (error) {
      this.context.log?.error("Failed to process webhook:", error);
      throw error;
    }
  }

  async getPaymentDetails(paymentId: string): Promise<any> {
    if (!this.razorpay) {
      await this.initialize();
    }

    try {
      const payment = await this.razorpay!.payments.fetch(paymentId);
      this.context.log?.info(`Payment details retrieved: ${paymentId}`);
      return payment;
    } catch (error) {
      this.context.log?.error("Failed to get payment details:", error);
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    if (!this.razorpay) {
      await this.initialize();
    }

    try {
      const refund = await this.razorpay!.payments.refund(paymentId, {
        amount: amount,
      });

      this.context.log?.info(`Payment refunded: ${paymentId}`);
      return refund;
    } catch (error) {
      this.context.log?.error("Failed to refund payment:", error);
      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Get current configuration
      const config = await this.context.drizzleClient
        .select()
        .from(configTable)
        .limit(1);

      if (config.length === 0 || !config[0]) {
        return {
          success: false,
          message:
            "No Razorpay configuration found. Please configure your API keys first.",
        };
      }

      const configItem = config[0];

      if (!configItem.keyId || !configItem.keySecret) {
        return {
          success: false,
          message:
            "API keys are not configured. Please enter your Key ID and Key Secret.",
        };
      }

      // Validate key format
      if (!configItem.keyId.startsWith("rzp_")) {
        return {
          success: false,
          message:
            "Invalid Key ID format. Razorpay Key ID should start with 'rzp_'.",
        };
      }

      this.context.log?.info(
        `Testing Razorpay connection with Key ID: ${configItem.keyId.substring(0, 8)}...`,
      );

      // Test connection by making a simple API call to Razorpay
      const response = await fetch(
        "https://api.razorpay.com/v1/payments?count=1",
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${Buffer.from(`${configItem.keyId}:${configItem.keySecret}`).toString("base64")}`,
            "Content-Type": "application/json",
            "User-Agent": "Talawa-Razorpay-Plugin/1.0.0",
          },
        },
      );

      this.context.log?.info(
        `Razorpay API response status: ${response.status}`,
      );

      if (response.ok) {
        const data = await response.json();
        this.context.log?.info("Razorpay API test successful");
        return {
          success: true,
          message:
            "Connection successful! Your Razorpay credentials are valid.",
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message:
            "Invalid API credentials. Please check your Key ID and Key Secret. Make sure you're using the correct test/live keys.",
        };
      } else if (response.status === 403) {
        return {
          success: false,
          message:
            "Access forbidden. Please check if your Razorpay account is active and has the necessary permissions.",
        };
      } else if (response.status === 429) {
        return {
          success: false,
          message: "Rate limit exceeded. Please try again in a few minutes.",
        };
      } else if (response.status >= 500) {
        return {
          success: false,
          message: "Razorpay server error. Please try again later.",
        };
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        this.context.log?.error(
          `Razorpay API error: ${response.status} - ${errorText}`,
        );
        return {
          success: false,
          message: `Connection failed with status ${response.status}. ${errorText}`,
        };
      }
    } catch (error) {
      this.context.log?.error("Error testing Razorpay connection:", error);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          success: false,
          message:
            "Network error. Please check your internet connection and try again.",
        };
      } else if (error instanceof Error) {
        return {
          success: false,
          message: `Connection test failed: ${error.message}`,
        };
      } else {
        return {
          success: false,
          message:
            "Connection test failed. Please check your internet connection and try again.",
        };
      }
    }
  }
}

export function createRazorpayService(
  context: GraphQLContext,
): RazorpayService {
  return new RazorpayService(context);
}
