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

const MockRazorpay = vi.fn(function () {
  return {
    orders: mockOrders,
    payments: mockPayments,
  };
});

export const validateWebhookSignature = vi
  .fn()
  .mockImplementation((body, signature, secret) => {
    // Simple mock logic: return true if signature matches body+secret (or just mocked in test)
    // For "invalid_signature" test, we expect false/throw?
    // SDK throws if invalid.
    if (signature === 'invalid_signature') return false;
    return true;
  });

module.exports = MockRazorpay;
// @ts-ignore
module.exports.default = MockRazorpay;
// @ts-ignore
module.exports.validateWebhookSignature = validateWebhookSignature;
