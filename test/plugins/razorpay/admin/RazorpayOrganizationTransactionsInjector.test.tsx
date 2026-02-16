/**
 * @vitest-environment jsdom
 */
/**
 * Unit Tests for RazorpayOrganizationTransactionsInjector Component
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { MockedResponse } from '@apollo/client/testing';
import RazorpayOrganizationTransactionsInjector from '../../../../plugins/razorpay/admin/injector/RazorpayOrganizationTransactionsInjector';
import {
  renderWithProviders,
  createMockTransaction,
  createMockTransactionStats,
  GET_ORG_TRANSACTIONS,
  GET_ORG_TRANSACTION_STATS,
} from './testUtils';

const mockTransactions = [
  createMockTransaction({ id: '1', paymentId: 'pay_org1' }),
];
const mockStats = createMockTransactionStats();

const standardMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ORG_TRANSACTIONS,
      variables: { orgId: 'test-org-id', limit: 10 },
    },
    result: {
      data: { razorpay_getOrganizationTransactions: mockTransactions },
    },
  },
  {
    request: {
      query: GET_ORG_TRANSACTION_STATS,
      variables: { orgId: 'test-org-id' },
    },
    result: { data: { razorpay_getOrganizationTransactionStats: mockStats } },
  },
];

describe('RazorpayOrganizationTransactionsInjector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading state', async () => {
      renderWithProviders(<RazorpayOrganizationTransactionsInjector />, {
        mocks: standardMocks,
        initialEntries: ['/org/test-org-id'],
        path: '/org/:orgId',
      });

      expect(screen.getByText('transactions.loadingOrg')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const errorMocks = [
        {
          request: {
            query: GET_ORG_TRANSACTIONS,
            variables: { orgId: 'test-org-id', limit: 10 },
          },
          error: new Error('Failed to fetch'),
        },
        {
          request: {
            query: GET_ORG_TRANSACTION_STATS,
            variables: { orgId: 'test-org-id' },
          },
          error: new Error('Failed to fetch stats'),
        },
      ];

      renderWithProviders(<RazorpayOrganizationTransactionsInjector />, {
        mocks: errorMocks,
        initialEntries: ['/org/test-org-id'],
        path: '/org/:orgId',
      });

      await waitFor(() => {
        expect(
          screen.getByText(/transactions.error.loadOrgFailed/),
        ).toBeInTheDocument();
      });
    });
  });

  it('should render transactions and stats', async () => {
    renderWithProviders(<RazorpayOrganizationTransactionsInjector />, {
      mocks: standardMocks,
      initialEntries: ['/org/test-org-id'],
      path: '/org/:orgId',
    });

    expect(
      await screen.findByText('transactions.orgTitle'),
    ).toBeInTheDocument();

    expect(screen.getByText('pay_org1')).toBeInTheDocument();
    expect(
      screen.getByText('transactions.stats.totalTransactions'),
    ).toBeInTheDocument();
  });

  describe('Status Variants & Helper Coverage', () => {
    it('should handle captured status with success badge', async () => {
      const tx = createMockTransaction({
        id: 'test-1',
        paymentId: 'pay_captured_test',
        status: 'captured',
      });

      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_ORG_TRANSACTIONS,
            variables: { orgId: 'test-org-id', limit: 10 },
          },
          result: {
            data: {
              razorpay_getOrganizationTransactions: [tx],
            },
          },
        },
        {
          request: {
            query: GET_ORG_TRANSACTION_STATS,
            variables: { orgId: 'test-org-id' },
          },
          result: {
            data: { razorpay_getOrganizationTransactionStats: mockStats },
          },
        },
      ];

      renderWithProviders(<RazorpayOrganizationTransactionsInjector />, {
        mocks,
        initialEntries: ['/org/test-org-id'],
        path: '/org/:orgId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_captured_test')).toBeInTheDocument();
        const capturedBadge = screen.getByText('CAPTURED');
        expect(capturedBadge).toHaveClass('bg-success');
      });
    });

    it('should handle failed status with danger badge', async () => {
      const tx = createMockTransaction({
        id: 'test-2',
        paymentId: 'pay_failed_test',
        status: 'failed',
      });

      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_ORG_TRANSACTIONS,
            variables: { orgId: 'test-org-id', limit: 10 },
          },
          result: {
            data: {
              razorpay_getOrganizationTransactions: [tx],
            },
          },
        },
        {
          request: {
            query: GET_ORG_TRANSACTION_STATS,
            variables: { orgId: 'test-org-id' },
          },
          result: {
            data: { razorpay_getOrganizationTransactionStats: mockStats },
          },
        },
      ];

      renderWithProviders(<RazorpayOrganizationTransactionsInjector />, {
        mocks,
        initialEntries: ['/org/test-org-id'],
        path: '/org/:orgId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_failed_test')).toBeInTheDocument();
        const failedBadge = screen.getByText('FAILED');
        expect(failedBadge).toHaveClass('bg-danger');
      });
    });

    it('should handle authorized status with info badge', async () => {
      const tx = createMockTransaction({
        id: 'test-3',
        paymentId: 'pay_auth_test',
        status: 'authorized',
      });

      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_ORG_TRANSACTIONS,
            variables: { orgId: 'test-org-id', limit: 10 },
          },
          result: {
            data: {
              razorpay_getOrganizationTransactions: [tx],
            },
          },
        },
        {
          request: {
            query: GET_ORG_TRANSACTION_STATS,
            variables: { orgId: 'test-org-id' },
          },
          result: {
            data: { razorpay_getOrganizationTransactionStats: mockStats },
          },
        },
      ];

      renderWithProviders(<RazorpayOrganizationTransactionsInjector />, {
        mocks,
        initialEntries: ['/org/test-org-id'],
        path: '/org/:orgId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_auth_test')).toBeInTheDocument();
        const authorizedBadge = screen.getByText('AUTHORIZED');
        expect(authorizedBadge).toHaveClass('bg-info');
      });
    });

    it('should handle refunded status with warning badge', async () => {
      const tx = createMockTransaction({
        id: 'test-4',
        paymentId: 'pay_refund_test',
        status: 'refunded',
      });

      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_ORG_TRANSACTIONS,
            variables: { orgId: 'test-org-id', limit: 10 },
          },
          result: {
            data: {
              razorpay_getOrganizationTransactions: [tx],
            },
          },
        },
        {
          request: {
            query: GET_ORG_TRANSACTION_STATS,
            variables: { orgId: 'test-org-id' },
          },
          result: {
            data: { razorpay_getOrganizationTransactionStats: mockStats },
          },
        },
      ];

      renderWithProviders(<RazorpayOrganizationTransactionsInjector />, {
        mocks,
        initialEntries: ['/org/test-org-id'],
        path: '/org/:orgId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_refund_test')).toBeInTheDocument();
        const refundedBadge = screen.getByText('REFUNDED');
        expect(refundedBadge).toHaveClass('bg-warning');
      });
    });

    it('should display anonymous fallback when donor name is null', async () => {
      const tx = createMockTransaction({
        id: 'test-anon',
        paymentId: 'pay_anon',
        donorName: null,
      });

      const mocks: MockedResponse[] = [
        {
          request: {
            query: GET_ORG_TRANSACTIONS,
            variables: { orgId: 'test-org-id', limit: 10 },
          },
          result: {
            data: {
              razorpay_getOrganizationTransactions: [tx],
            },
          },
        },
        {
          request: {
            query: GET_ORG_TRANSACTION_STATS,
            variables: { orgId: 'test-org-id' },
          },
          result: {
            data: { razorpay_getOrganizationTransactionStats: mockStats },
          },
        },
      ];

      renderWithProviders(<RazorpayOrganizationTransactionsInjector />, {
        mocks,
        initialEntries: ['/org/test-org-id'],
        path: '/org/:orgId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_anon')).toBeInTheDocument();
        // Verify anonymous fallback text is rendered
        expect(screen.getByText('common.anonymous')).toBeInTheDocument();
      });
    });
  });
});
