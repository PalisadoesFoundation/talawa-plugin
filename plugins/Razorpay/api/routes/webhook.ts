import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createRazorpayService } from "../services/razorpayService";
import type { GraphQLContext } from "~/src/graphql/context";

interface WebhookRequest extends FastifyRequest {
  body: {
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
  };
}

export async function registerRazorpayWebhookRoutes(fastify: FastifyInstance) {
  // Webhook endpoint for Razorpay payment notifications
  fastify.post(
    "/api/plugins/razorpay/webhook",
    async (request: WebhookRequest, reply: FastifyReply) => {
      try {
        const webhookData = request.body;

        // Get the context from the request
        const context = request.injections?.context as GraphQLContext;
        if (!context) {
          reply.status(500).send({ error: "Context not available" });
          return;
        }

        // Create Razorpay service
        const razorpayService = createRazorpayService(context);

        // Process the webhook
        await razorpayService.processWebhook(webhookData);

        // Return success response
        reply.status(200).send({ status: "success" });
      } catch (error) {
        context?.log?.error("Webhook processing failed:", error);
        reply.status(500).send({ error: "Webhook processing failed" });
      }
    }
  );

  // Health check endpoint for the webhook
  fastify.get(
    "/api/plugins/razorpay/webhook/health",
    async (request, reply) => {
      reply.status(200).send({
        status: "healthy",
        timestamp: new Date().toISOString(),
        plugin: "razorpay",
      });
    }
  );
}
