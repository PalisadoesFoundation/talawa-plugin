/**
 * @vitest-environment jsdom
 */
/**
 * Shared mocks for RazorpayUserTransactionsInjector tests
 */
import { MockedResponse } from '@apollo/client/testing';
import { gql } from '@apollo/client';
import { createMockTransaction } from './testUtils';

// Define local GET_USER_TRANSACTIONS with orgId to match component query
export const GET_USER_TXN_INJECTOR = gql`
  query GetUserTransactions($userId: String!, $orgId: String!, $limit: Int) {
    razorpay_getUserTransactions(
      userId: $userId
      orgId: $orgId
      limit: $limit
    ) {
      id
      paymentId
      amount
      currency
      status
      donorName
      donorEmail
      method
      bank
      wallet
      vpa
      email
      contact
      fee
      tax
      errorCode
      errorDescription
      refundStatus
      capturedAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_USER_TRANSACTIONS_STATS = gql`
  query GetUserPaymentStats($userId: ID!) {
    razorpay_getUserTransactionStats(userId: $userId) {
      totalTransactions
      totalAmount
      currency
      successfulTransactions
      failedTransactions
      averageTransactionAmount
    }
  }
`;

export const mockTransactions = [
  createMockTransaction({
    id: 'txn-1',
    paymentId: 'pay_inj123',
    status: 'captured',
    amount: 10000,
  }),
];

export const mockStats = {
  totalTransactions: 1,
  totalAmount: 10000,
  currency: 'INR',
  successfulTransactions: 1,
  failedTransactions: 0,
  averageTransactionAmount: 10000,
};

export const standardMocks: MockedResponse[] = [
  {
    request: {
      query: GET_USER_TXN_INJECTOR,
      variables: { userId: 'test-user-id', orgId: 'test-org-id', limit: 10 },
    },
    result: {
      data: { razorpay_getUserTransactions: mockTransactions },
    },
  },
  {
    request: {
      query: GET_USER_TRANSACTIONS_STATS,
      variables: { userId: 'test-user-id' },
    },
    result: {
      data: {
        razorpay_getUserTransactionStats: mockStats,
      },
    },
  },
];

export const emptyMocks: MockedResponse[] = [
  {
    request: {
      query: GET_USER_TXN_INJECTOR,
      variables: {
        userId: 'test-user-id',
        orgId: 'test-org-id',
        limit: 10,
      },
    },
    result: {
      data: { razorpay_getUserTransactions: [] },
    },
  },
  {
    request: {
      query: GET_USER_TRANSACTIONS_STATS,
      variables: { userId: 'test-user-id' },
    },
    result: {
      data: {
        razorpay_getUserTransactionStats: {
          totalTransactions: 0,
          totalAmount: 0,
          currency: 'INR',
          successfulTransactions: 0,
          failedTransactions: 0,
          averageTransactionAmount: 0,
          __typename: 'RazorpayTransactionStats',
        },
      },
    },
  },
];

export const minimalTransaction = {
  id: 'txn-minimal',
  paymentId: 'pay_minimal',
  amount: 5000,
  currency: 'INR',
  status: 'captured',
  donorName: 'Minimal Donor',
  donorEmail: 'minimal@example.com',
  method: 'card',
  bank: null,
  wallet: null,
  vpa: null,
  email: 'minimal@example.com',
  contact: '+919876543210',
  fee: 100,
  tax: 18,
  errorCode: null,
  errorDescription: null,
  refundStatus: null,
  capturedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const minimalMocks: MockedResponse[] = [
  {
    request: {
      query: GET_USER_TXN_INJECTOR,
      variables: {
        userId: 'test-user-id',
        orgId: 'test-org-id',
        limit: 10,
      },
    },
    result: {
      data: { razorpay_getUserTransactions: [minimalTransaction] },
    },
  },
  {
    request: {
      query: GET_USER_TRANSACTIONS_STATS,
      variables: { userId: 'test-user-id' },
    },
    result: {
      data: {
        razorpay_getUserTransactionStats: {
          totalTransactions: 1,
          totalAmount: 5000,
          currency: 'INR',
          successfulTransactions: 1,
          failedTransactions: 0,
          averageTransactionAmount: 5000,
        },
      },
    },
  },
];

export const transactionsOnlyMocks: MockedResponse[] = [
  {
    request: {
      query: GET_USER_TXN_INJECTOR,
      variables: {
        userId: 'test-user-id',
        orgId: 'test-org-id',
        limit: 10,
      },
    },
    result: {
      data: { razorpay_getUserTransactions: mockTransactions },
    },
  },
];

export const multiMethodTransactions = [
  createMockTransaction({
    id: 'txn-card',
    paymentId: 'pay_card',
    method: 'card',
  }),
  createMockTransaction({
    id: 'txn-upi',
    paymentId: 'pay_upi',
    method: 'upi',
  }),
  createMockTransaction({
    id: 'txn-wallet',
    paymentId: 'pay_wallet',
    method: 'wallet',
  }),
  createMockTransaction({
    id: 'txn-netbanking',
    paymentId: 'pay_netbanking',
    method: 'netbanking',
  }),
];

export const multiMethodMocks: MockedResponse[] = [
  {
    request: {
      query: GET_USER_TXN_INJECTOR,
      variables: {
        userId: 'test-user-id',
        orgId: 'test-org-id',
        limit: 10,
      },
    },
    result: {
      data: { razorpay_getUserTransactions: multiMethodTransactions },
    },
  },
  {
    request: {
      query: GET_USER_TRANSACTIONS_STATS,
      variables: { userId: 'test-user-id' },
    },
    result: {
      data: {
        razorpay_getUserTransactionStats: {
          totalTransactions: 4,
          totalAmount: 40000,
          currency: 'INR',
          successfulTransactions: 4,
          failedTransactions: 0,
          averageTransactionAmount: 10000,
        },
      },
    },
  },
];

export const noMethodTransaction = createMockTransaction({
  id: 'txn-no-method',
  paymentId: 'pay_no_method',
  method: undefined,
});

export const noMethodMocks: MockedResponse[] = [
  {
    request: {
      query: GET_USER_TXN_INJECTOR,
      variables: {
        userId: 'test-user-id',
        orgId: 'test-org-id',
        limit: 10,
      },
    },
    result: {
      data: { razorpay_getUserTransactions: [noMethodTransaction] },
    },
  },
  {
    request: {
      query: GET_USER_TRANSACTIONS_STATS,
      variables: { userId: 'test-user-id' },
    },
    result: {
      data: {
        razorpay_getUserTransactionStats: {
          totalTransactions: 1,
          totalAmount: 10000,
          currency: 'INR',
          successfulTransactions: 1,
          failedTransactions: 0,
          averageTransactionAmount: 10000,
        },
      },
    },
  },
];

export const eurTransaction = createMockTransaction({
  id: 'txn-eur',
  paymentId: 'pay_eur',
  currency: 'EUR',
  amount: 7500,
});

export const usdTransaction = createMockTransaction({
  id: 'txn-usd',
  paymentId: 'pay_usd',
  currency: 'USD',
  amount: 5000,
});

export const multiCurrencyMocks: MockedResponse[] = [
  {
    request: {
      query: GET_USER_TXN_INJECTOR,
      variables: {
        userId: 'test-user-id',
        orgId: 'test-org-id',
        limit: 10,
      },
    },
    result: {
      data: {
        razorpay_getUserTransactions: [
          mockTransactions[0],
          eurTransaction,
          usdTransaction,
        ],
      },
    },
  },
  {
    request: {
      query: GET_USER_TRANSACTIONS_STATS,
      variables: { userId: 'test-user-id' },
    },
    result: {
      data: {
        razorpay_getUserTransactionStats: {
          totalTransactions: 3,
          totalAmount: 22500,
          currency: 'INR',
          successfulTransactions: 3,
          failedTransactions: 0,
          averageTransactionAmount: 7500,
        },
      },
    },
  },
];

export const errorMocks = [
  {
    request: {
      query: GET_USER_TXN_INJECTOR,
      variables: {
        userId: 'test-user-id',
        orgId: 'test-org-id',
        limit: 10,
      },
    },
    error: new Error('Failed to fetch transactions'),
  },
];

export const statusTransactions = [
  createMockTransaction({
    id: 'txn-cap',
    paymentId: 'pay_cap',
    status: 'captured',
  }),
  createMockTransaction({
    id: 'txn-auth',
    paymentId: 'pay_auth',
    status: 'authorized',
  }),
  createMockTransaction({
    id: 'txn-fail',
    paymentId: 'pay_fail',
    status: 'failed',
  }),
  createMockTransaction({
    id: 'txn-refund',
    paymentId: 'pay_refund',
    status: 'refunded',
  }),
];

export const statusesMocks: MockedResponse[] = [
  {
    request: {
      query: GET_USER_TXN_INJECTOR,
      variables: {
        userId: 'test-user-id',
        orgId: 'test-org-id',
        limit: 10,
      },
    },
    result: {
      data: {
        razorpay_getUserTransactions: statusTransactions,
      },
    },
  },
  {
    request: {
      query: GET_USER_TRANSACTIONS_STATS,
      variables: { userId: 'test-user-id' },
    },
    result: {
      data: {
        razorpay_getUserTransactionStats: {
          totalTransactions: 4,
          totalAmount: 40000,
          currency: 'INR',
          successfulTransactions: 3,
          failedTransactions: 1,
          averageTransactionAmount: 10000,
          __typename: 'RazorpayTransactionStats',
        },
      },
    },
  },
];

export const methodsMocks: MockedResponse[] = [
  {
    request: {
      query: GET_USER_TXN_INJECTOR,
      variables: {
        userId: 'test-user-id',
        orgId: 'test-org-id',
        limit: 10,
      },
    },
    result: {
      data: {
        razorpay_getUserTransactions: [
          createMockTransaction({
            id: 'txn-card',
            paymentId: 'pay_card',
            method: 'card',
          }),
          createMockTransaction({
            id: 'txn-upi',
            paymentId: 'pay_upi',
            method: 'upi',
          }),
          createMockTransaction({
            id: 'txn-wallet',
            paymentId: 'pay_wallet',
            method: 'wallet',
          }),
          createMockTransaction({
            id: 'txn-netbanking',
            paymentId: 'pay_netbanking',
            method: 'netbanking',
          }),
        ],
      },
    },
  },
  {
    request: {
      query: GET_USER_TRANSACTIONS_STATS,
      variables: { userId: 'test-user-id' },
    },
    result: {
      data: {
        razorpay_getUserTransactionStats: {
          totalTransactions: 4,
          totalAmount: 40000,
          currency: 'INR',
          successfulTransactions: 4,
          failedTransactions: 0,
          averageTransactionAmount: 10000,
          __typename: 'RazorpayTransactionStats',
        },
      },
    },
  },
];
