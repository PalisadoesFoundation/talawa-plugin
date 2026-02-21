/**
 * Mock data and response builders for UserTransactions tests
 */

import { MockedResponse } from '@apollo/client/testing';
import {
  createMockTransaction,
  createMockTransactionStats,
  GET_USER_TRANSACTIONS,
  GET_USER_TRANSACTION_STATS,
} from './testUtils';

const mockStats = createMockTransactionStats({
  totalTransactions: 2,
  totalAmount: 15000,
});

// Standard mock transactions
export const mockTransactions = [
  createMockTransaction({
    id: 'txn-1',
    paymentId: 'pay_abc123',
    status: 'captured',
    amount: 10000,
    donorName: 'John Doe',
    method: 'card',
  }),
  createMockTransaction({
    id: 'txn-2',
    paymentId: 'pay_def456',
    status: 'failed',
    amount: 5000,
    donorName: 'Jane Smith',
    method: 'upi',
  }),
];

// Helper to create mocks for various status/method combinations
export const createTransactionMocks = (
  transactions: ReturnType<typeof createMockTransaction>[],
  stats = mockStats,
): MockedResponse[] => [
  {
    request: {
      query: GET_USER_TRANSACTIONS,
      variables: { userId: 'test-user-id', limit: 100 },
    },
    result: {
      data: { razorpay_getUserTransactions: transactions },
    },
  },
  {
    request: {
      query: GET_USER_TRANSACTION_STATS,
      variables: { userId: 'test-user-id' },
    },
    result: {
      data: { razorpay_getUserTransactionStats: stats },
    },
  },
];

export const standardMocks = createTransactionMocks(mockTransactions);

// Pre-built transaction sets for common test scenarios
export const transactionSets = {
  // Status variants
  authorized: [
    createMockTransaction({
      id: 'txn-auth',
      paymentId: 'pay_auth123',
      status: 'authorized',
    }),
  ],
  refunded: [
    createMockTransaction({
      id: 'txn-refund',
      paymentId: 'pay_refund123',
      status: 'refunded',
    }),
  ],
  unknown: [
    createMockTransaction({
      id: 'txn-unknown',
      paymentId: 'pay_unknown123',
      status: 'pending',
    }),
  ],

  // Method variants
  card: [
    createMockTransaction({
      id: 'txn-card',
      paymentId: 'pay_card123',
      method: 'card',
    }),
  ],
  upi: [
    createMockTransaction({
      id: 'txn-upi',
      paymentId: 'pay_upi123',
      method: 'upi',
    }),
  ],
  netbanking: [
    createMockTransaction({
      id: 'txn-netbanking',
      paymentId: 'pay_netbanking123',
      method: 'netbanking',
    }),
  ],
  wallet: [
    createMockTransaction({
      id: 'txn-wallet',
      paymentId: 'pay_wallet123',
      method: 'wallet',
    }),
  ],

  // Mixed status and methods
  mixed: [
    createMockTransaction({
      id: 'txn-mix-1',
      paymentId: 'pay_mix1',
      status: 'authorized',
      method: 'wallet',
    }),
    createMockTransaction({
      id: 'txn-mix-2',
      paymentId: 'pay_mix2',
      status: 'refunded',
      method: 'netbanking',
    }),
    createMockTransaction({
      id: 'txn-mix-3',
      paymentId: 'pay_mix3',
      status: 'captured',
      method: null,
    }),
  ],

  // Filter combinations
  capturedAndFailed: [
    createMockTransaction({
      id: '1',
      paymentId: 'pay_captured',
      status: 'captured',
    }),
    createMockTransaction({
      id: '2',
      paymentId: 'pay_failed',
      status: 'failed',
    }),
  ],
  authorizedAndFailed: [
    createMockTransaction({
      id: 'txn-auth-1',
      paymentId: 'pay_auth1',
      status: 'authorized',
    }),
    createMockTransaction({
      id: 'txn-failed-1',
      paymentId: 'pay_failed1',
      status: 'failed',
    }),
  ],
  refundedAndCaptured: [
    createMockTransaction({
      id: 'txn-refund-1',
      paymentId: 'pay_refund1',
      status: 'refunded',
    }),
    createMockTransaction({
      id: 'txn-captured-1',
      paymentId: 'pay_captured1',
      status: 'captured',
    }),
  ],

  // Edge cases
  empty: [],
  anonymous: [
    createMockTransaction({
      id: 'txn-anon',
      paymentId: 'pay_anon',
      donorName: null,
      donorEmail: 'anon@example.com',
      status: 'captured',
    }),
  ],
};

export const emptyStats = {
  ...mockStats,
  totalTransactions: 0,
  totalAmount: 0,
};
