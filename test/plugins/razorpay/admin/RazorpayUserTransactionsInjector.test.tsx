/**
 * @vitest-environment jsdom
 */
/**
 * Unit Tests for RazorpayUserTransactionsInjector Component
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { MockedResponse } from '@apollo/client/testing';
import RazorpayUserTransactionsInjector from '../../../../plugins/Razorpay/admin/injector/RazorpayUserTransactionsInjector';
import { renderWithProviders, createMockTransaction } from './testUtils';
import { gql } from '@apollo/client';

// Define local GET_USER_TRANSACTIONS with orgId to match component query

const GET_USER_TXN_INJECTOR = gql`
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

const GET_USER_TRANSACTIONS_STATS = gql`
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

const mockTransactions = [
  createMockTransaction({
    id: 'txn-1',
    paymentId: 'pay_inj123',
    status: 'captured',
    amount: 10000,
  }),
];

const standardMocks: MockedResponse[] = [
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
        razorpay_getUserTransactionStats: {
          totalTransactions: 1,
          totalAmount: 10000,
          currency: 'INR',
          successCount: 1,
          failedCount: 0,
          pendingCount: 0,
        },
      },
    },
  },
];

describe('RazorpayUserTransactionsInjector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading state', async () => {
      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks: standardMocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      expect(
        screen.getByText(/Loading Razorpay transactions/i),
      ).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('should render transaction list', async () => {
      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks: standardMocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(screen.getByText('Razorpay Transactions')).toBeInTheDocument();
      });

      expect(screen.getByText('pay_inj123')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Manually constructing mock to include variables as createErrorMock helper doesn't support them yet
      const errorMocks = [
        {
          request: {
            query: GET_USER_TXN_INJECTOR,
            variables: {
              userId: 'test-user-id',
              orgId: 'test-org-id',
              limit: 10,
            },
          },
          error: new Error('Failed'),
        },
      ];

      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks: errorMocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Error loading transactions/i),
        ).toBeInTheDocument();
      });
    });
  });
});
