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
import RazorpayOrganizationTransactionsInjector from '../../../../plugins/Razorpay/admin/injector/RazorpayOrganizationTransactionsInjector';
import {
  renderWithProviders,
  createMockTransaction,
  createMockTransactionStats,
} from './testUtils';
import { gql } from '@apollo/client';

const GET_ORG_TRANSACTIONS = gql`
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

const GET_ORG_TRANSACTION_STATS = gql`
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
    result: { data: { razorpay_getOrganizationTransactions: mockTransactions } },
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

  it('should render transactions and stats', async () => {
    renderWithProviders(<RazorpayOrganizationTransactionsInjector />, {
      mocks: standardMocks,
      initialEntries: ['/org/test-org-id'],
      path: '/org/:orgId',
    });

    await waitFor(() => {
      expect(screen.getByText('Razorpay Organization Transactions')).toBeInTheDocument();
    });

    expect(screen.getByText('pay_org1')).toBeInTheDocument();
    expect(screen.getByText('Total Transactions')).toBeInTheDocument();
  });
});
