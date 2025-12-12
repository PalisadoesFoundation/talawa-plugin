
import { describe, it, expect, vi } from 'vitest';
import {
    createMockFastifyRequest,
    createMockFastifyReply,
    createMockGraphQLClient,
    createMockPaymentGateway
} from './mockClients';

describe('mockClients utilities', () => {
    describe('createMockFastifyRequest', () => {
        it('should create a request with default values', () => {
            const req = createMockFastifyRequest();
            expect(req.id).toBe('req-123');
            expect(req.log.info).toBeDefined();
        });

        it('should allow overrides', () => {
            const req = createMockFastifyRequest({ body: { foo: 'bar' } });
            expect(req.body).toEqual({ foo: 'bar' });
        });
    });

    describe('createMockFastifyReply', () => {
        it('should create a chainable reply mock', () => {
            const reply = createMockFastifyReply();
            expect(reply.code(200)).toBe(reply); // Chainable
            expect(reply.send({})).toBe(reply); // Chainable
            expect(reply.header('x', 'y')).toBe(reply); // Chainable
        });
    });

    describe('createMockGraphQLClient', () => {
        it('should create a client with mocked methods', async () => {
            const client = createMockGraphQLClient();
            expect(client.query).toBeDefined();
            expect(client.mutate).toBeDefined();

            await expect(client.query()).resolves.toEqual({ data: {} });
        });
    });

    describe('createMockPaymentGateway', () => {
        it('should create a gateway with mocked methods', async () => {
            const gateway = createMockPaymentGateway();
            expect(gateway.processPayment).toBeDefined();

            const result = await gateway.processPayment();
            expect(result.success).toBe(true);
        });
    });
});
