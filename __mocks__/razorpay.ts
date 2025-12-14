import { vi } from 'vitest';

export const mockOrders = {
    create: vi.fn(),
    fetch: vi.fn(),
    all: vi.fn(),
    fetchPayments: vi.fn(),
};

export const mockPayments = {
    fetch: vi.fn(),
    capture: vi.fn(),
    refund: vi.fn(),
};

export const mockRefunds = {
    create: vi.fn(),
};

const MockRazorpay = vi.fn(function () {
    return {
        orders: mockOrders,
        payments: mockPayments,
        refunds: mockRefunds,
    };
});

export const validateWebhookSignature = vi
    .fn()
    .mockImplementation((body, signature, secret) => {
        if (signature === 'invalid_signature') return false;
        return true;
    });

export default MockRazorpay;
