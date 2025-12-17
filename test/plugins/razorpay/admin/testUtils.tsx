import React, { ReactNode } from 'react';
import { MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import * as RRD from 'react-router-dom';
const { MemoryRouter, Routes, Route } = RRD;
import { render, RenderOptions, act } from '@testing-library/react';
import { gql, InMemoryCache } from '@apollo/client';
import type { DocumentNode } from 'graphql';

/**
 * Test wrapper that provides Apollo MockedProvider and MemoryRouter
 */
const TestWrapper: React.FC<{
  children: ReactNode;
  mocks: MockedResponse[];
  initialEntries?: string[];
  path?: string;
}> = ({ children, mocks, initialEntries = ['/'], path = '/' }) => {
  // Apollo v4 always adds __typename; mocks must include __typename fields
  const cache = new InMemoryCache();

  return (
    <MockedProvider mocks={mocks} cache={cache}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path={path} element={children} />
        </Routes>
      </MemoryRouter>
    </MockedProvider>
  );
};

/**
 * Custom render function that wraps components with test providers
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options: {
    mocks?: MockedResponse[];
    initialEntries?: string[];
    path?: string;
  } & Omit<RenderOptions, 'wrapper'> = {},
) => {
  const { mocks = [], initialEntries, path, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TestWrapper mocks={mocks} initialEntries={initialEntries} path={path}>
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// GraphQL Query Definitions (matching the actual components)
export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      id
      firstName
      lastName
      email
    }
  }
`;

export const GET_ORGANIZATION_INFO = gql`
  query GetOrganizationInfo($orgId: String!) {
    organization(input: { id: $orgId }) {
      id
      name
      description
      avatarURL
    }
  }
`;

export const GET_RAZORPAY_CONFIG = gql`
  query GetRazorpayConfig {
    razorpay_getRazorpayConfig {
      keyId
      keySecret
      webhookSecret
      isEnabled
      testMode
      currency
      description
    }
  }
`;

export const GET_RAZORPAY_CONFIG_PUBLIC = gql`
  query GetRazorpayConfig {
    razorpay_getRazorpayConfig {
      keyId
      isEnabled
      testMode
      currency
      description
    }
  }
`;

export const CREATE_PAYMENT_ORDER = gql`
  mutation CreatePaymentOrder($input: RazorpayOrderInput!) {
    razorpay_createPaymentOrder(input: $input) {
      id
      razorpayOrderId
      organizationId
      userId
      amount
      currency
      status
      donorName
      donorEmail
      donorPhone
      description
      createdAt
      updatedAt
    }
  }
`;
export const VERIFY_PAYMENT = gql`
  mutation VerifyPayment($input: RazorpayVerificationInput!) {
    razorpay_verifyPayment(input: $input) {
      success
      message
      transaction {
        paymentId
        status
        amount
        currency
      }
    }
  }
`;
export const UPDATE_RAZORPAY_CONFIG = gql`
  mutation UpdateRazorpayConfig($input: RazorpayConfigInput!) {
    razorpay_updateRazorpayConfig(input: $input) {
      keyId
      keySecret
      webhookSecret
      isEnabled
      testMode
      currency
      description
    }
  }
`;
export const TEST_RAZORPAY_SETUP = gql`
  mutation TestRazorpaySetup {
    razorpay_testRazorpaySetup {
      success
      message
    }
  }
`;
export const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions(
    $userId: String!
    $limit: Int
    $offset: Int
    $status: String
    $dateFrom: String
    $dateTo: String
  ) {
    razorpay_getUserTransactions(
      userId: $userId
      limit: $limit
      offset: $offset
      status: $status
      dateFrom: $dateFrom
      dateTo: $dateTo
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
export const GET_USER_TRANSACTION_STATS = gql`
  query GetUserTransactionStats(
    $userId: String!
    $dateFrom: String
    $dateTo: String
  ) {
    razorpay_getUserTransactionStats(
      userId: $userId
      dateFrom: $dateFrom
      dateTo: $dateTo
    ) {
      totalTransactions
      totalAmount
      currency
      successCount
      failedCount
      pendingCount
    }
  }
`;
export const GET_ORG_TRANSACTIONS = gql`
  query GetOrganizationTransactions($orgId: String!, $limit: Int) {
    razorpay_getOrganizationTransactions(orgId: $orgId, limit: $limit) {
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
export const GET_ORG_TRANSACTION_STATS = gql`
  query GetOrganizationTransactionStats($orgId: String!) {
    razorpay_getOrganizationTransactionStats(orgId: $orgId) {
      totalTransactions
      totalAmount
      currency
      successCount
      failedCount
      pendingCount
    }
  }
`;

// Mock Data Factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  __typename: 'User',
  ...overrides,
});
export const createMockOrganization = (overrides = {}) => ({
  id: 'org-123',
  name: 'Test Organization',
  description: 'A test organization for donations',
  avatarURL: 'https://example.com/avatar.png',
  __typename: 'Organization',
  ...overrides,
});
export const createMockRazorpayConfig = (overrides = {}) => ({
  keyId: 'rzp_test_abc123',
  keySecret: 'secret123',
  webhookSecret: 'webhook_secret_123',
  isEnabled: true,
  testMode: true,
  currency: 'INR',
  description: 'Donation to organization',
  __typename: 'RazorpayConfig',
  ...overrides,
});
export const createMockPaymentOrder = (overrides = {}) => ({
  id: 'order-123',
  razorpayOrderId: 'order_abc123',
  organizationId: 'org-123',
  userId: 'user-123',
  amount: 10000, // 100 INR in paise
  currency: 'INR',
  status: 'created',
  donorName: 'John Doe',
  donorEmail: 'john.doe@example.com',
  donorPhone: '+919876543210',
  description: 'Donation to Test Organization',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  __typename: 'RazorpayOrder',
  ...overrides,
});
export const createMockTransaction = (overrides = {}) => ({
  id: 'txn-123',
  paymentId: 'pay_abc123',
  amount: 10000, // 100 INR in paise
  currency: 'INR',
  status: 'captured',
  donorName: 'John Doe',
  donorEmail: 'john.doe@example.com',
  method: 'card',
  bank: null,
  wallet: null,
  vpa: null,
  email: 'john.doe@example.com',
  contact: '+919876543210',
  fee: 236,
  tax: 36,
  errorCode: null,
  errorDescription: null,
  refundStatus: null,
  capturedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  __typename: 'RazorpayTransaction',
  ...overrides,
});
export const createMockTransactionStats = (overrides = {}) => ({
  totalTransactions: 10,
  totalAmount: 100000, // 1000 INR in paise
  currency: 'INR',
  successCount: 8,
  failedCount: 1,
  pendingCount: 1,
  __typename: 'RazorpayTransactionStats',
  ...overrides,
}); // Mock Response Factories for GraphQL
export const createUserQueryMock = (user = createMockUser()) => ({
  request: {
    query: GET_CURRENT_USER,
  },
  result: {
    data: {
      me: user,
    },
  },
});
export const createOrganizationQueryMock = (
  orgId: string,
  organization = createMockOrganization(),
) => ({
  request: {
    query: GET_ORGANIZATION_INFO,
    variables: { orgId },
  },
  result: {
    data: {
      organization,
    },
  },
});
export const createRazorpayConfigQueryMock = (
  config = createMockRazorpayConfig(),
) => ({
  request: {
    query: GET_RAZORPAY_CONFIG,
  },
  result: {
    data: {
      razorpay_getRazorpayConfig: config,
    },
  },
});
export const createRazorpayConfigPublicQueryMock = (
  config = createMockRazorpayConfig(),
) => ({
  request: {
    query: GET_RAZORPAY_CONFIG_PUBLIC,
    variables: {},
  },
  result: {
    data: {
      razorpay_getRazorpayConfig: {
        ...config,
        __typename: 'RazorpayConfig',
      },
    },
  },
});
export const createPaymentOrderMutationMock = (
  order = createMockPaymentOrder(),
) => ({
  request: {
    query: CREATE_PAYMENT_ORDER,
  },
  result: {
    data: {
      razorpay_createPaymentOrder: order,
    },
  },
});
export const createVerifyPaymentMutationMock = (success = true) => ({
  request: {
    query: VERIFY_PAYMENT,
  },
  result: {
    data: {
      razorpay_verifyPayment: {
        success,
        message: success
          ? 'Payment verified successfully'
          : 'Verification failed',
        transaction: success
          ? {
              paymentId: 'pay_abc123',
              status: 'captured',
              amount: 10000,
              currency: 'INR',
            }
          : null,
      },
    },
  },
});
export const createUpdateConfigMutationMock = (
  config = createMockRazorpayConfig(),
) => ({
  request: {
    query: UPDATE_RAZORPAY_CONFIG,
  },
  result: {
    data: {
      razorpay_updateRazorpayConfig: config,
    },
  },
});
export const createTestSetupMutationMock = (success = true) => ({
  request: {
    query: TEST_RAZORPAY_SETUP,
  },
  result: {
    data: {
      razorpay_testRazorpaySetup: {
        success,
        message: success
          ? 'Setup test successful'
          : 'Setup test failed: Invalid credentials',
      },
    },
  },
});
export const createUserTransactionsQueryMock = (
  userId: string,
  transactions = [createMockTransaction()],
) => ({
  request: {
    query: GET_USER_TRANSACTIONS,
    variables: {
      userId,
      limit: 100,
    },
  },
  result: {
    data: {
      razorpay_getUserTransactions: transactions,
    },
  },
});
export const createUserTransactionStatsQueryMock = (
  userId: string,
  stats = createMockTransactionStats(),
) => ({
  request: {
    query: GET_USER_TRANSACTION_STATS,
    variables: {
      userId,
    },
  },
  result: {
    data: {
      razorpay_getUserTransactionStats: stats,
    },
  },
});
export const createOrgTransactionsQueryMock = (
  orgId: string,
  transactions = [createMockTransaction()],
) => ({
  request: {
    query: GET_ORG_TRANSACTIONS,
    variables: {
      orgId,
      limit: 10,
    },
  },
  result: {
    data: {
      razorpay_getOrganizationTransactions: transactions,
    },
  },
});
export const createOrgTransactionStatsQueryMock = (
  orgId: string,
  stats = createMockTransactionStats(),
) => ({
  request: {
    query: GET_ORG_TRANSACTION_STATS,
    variables: {
      orgId,
    },
  },
  result: {
    data: {
      razorpay_getOrganizationTransactionStats: stats,
    },
  },
});

// Error Mock Factories
export const createErrorMock = (query: DocumentNode, errorMessage: string) => ({
  request: {
    query,
  },
  error: new Error(errorMessage),
});

/**
 * Flushes pending promises by yielding to the microtask/macrotask queue.
 * Note: This only yields control to allow pending async operations to complete,
 * it does not poll for or wait on actual loading state indicators.
 */
export const flushPromises = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};
