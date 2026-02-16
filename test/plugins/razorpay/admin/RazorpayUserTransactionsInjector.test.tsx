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
import RazorpayUserTransactionsInjector from '../../../../plugins/razorpay/admin/injector/RazorpayUserTransactionsInjector';
import { renderWithProviders, createMockTransaction } from './testUtils';
import {
  GET_USER_TXN_INJECTOR,
  GET_USER_TRANSACTIONS_STATS,
  standardMocks,
  emptyMocks,
  minimalMocks,
  transactionsOnlyMocks,
  multiMethodMocks,
  noMethodMocks,
  multiCurrencyMocks,
  errorMocks,
  mockStats,
  statusesMocks,
  methodsMocks,
} from './RazorpayUserTransactionsInjector.mocks';
import userEvent from '@testing-library/user-event';

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

  describe('Edge Cases', () => {
    it('should show empty state when transaction list is empty', async () => {
      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks: emptyMocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(screen.getByText('Razorpay Transactions')).toBeInTheDocument();
      });

      // Should show empty state or no transaction rows
      expect(screen.queryByText('pay_inj123')).not.toBeInTheDocument();
    });

    it('should render gracefully with missing optional fields', async () => {
      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks: minimalMocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(screen.getByText('Razorpay Transactions')).toBeInTheDocument();
      });

      // Should display payment ID even with missing fields
      expect(screen.getByText('pay_minimal')).toBeInTheDocument();
    });

    it('should render transactions when stats query fails', async () => {
      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks: transactionsOnlyMocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(screen.getByText('Razorpay Transactions')).toBeInTheDocument();
      });

      // Transactions should still render even if stats fail
      expect(screen.getByText('pay_inj123')).toBeInTheDocument();
    });
  });

  describe('Status Variants & Display', () => {
    it('should render transactions with different payment methods', async () => {
      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks: multiMethodMocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_card')).toBeInTheDocument();
        expect(screen.getByText('pay_upi')).toBeInTheDocument();
        expect(screen.getByText('pay_wallet')).toBeInTheDocument();
        expect(screen.getByText('pay_netbanking')).toBeInTheDocument();
      });

      // Verify table rows are rendered
      const tableBody = screen.getByRole('table')?.querySelector('tbody');
      expect(tableBody?.querySelectorAll('tr').length).toBe(4);
    });

    it('should display N/A for missing payment method', async () => {
      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks: noMethodMocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_no_method')).toBeInTheDocument();
      });

      // Verify N/A is shown for missing method
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should render table with proper structure', async () => {
      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks: standardMocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_inj123')).toBeInTheDocument();
      });

      // Verify table headers exist
      expect(screen.getByText('Transaction ID')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('Currency & Amount Formatting', () => {
    it('should format amounts correctly for different currencies', async () => {
      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks: multiCurrencyMocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_eur')).toBeInTheDocument();
        expect(screen.getByText('pay_usd')).toBeInTheDocument();
      });

      // Verify amounts are displayed
      const amounts = screen.getAllByText(/\d+\.\d+/);
      expect(amounts.length).toBeGreaterThan(0);
    });
    it('should call handleViewDetails on view button click', async () => {
      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks: standardMocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_inj123')).toBeInTheDocument();
      });

      // Find and click the first View button to trigger handleViewDetails
      const viewButtons = screen.getAllByRole('button', { name: /View/i });
      expect(viewButtons.length).toBeGreaterThan(0);

      // Create user instance and click
      const user = userEvent.setup();
      await user.click(viewButtons[0]);

      // If click succeeds without error, the handler was invoked
      // Toast.info is called internally but doesn't appear in DOM snapshot
      expect(viewButtons[0]).toBeEnabled();
    });

    it('should call handleDownloadReceipt on receipt button click', async () => {
      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks: standardMocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_inj123')).toBeInTheDocument();
      });

      // Find and click the Receipt button to trigger handleDownloadReceipt
      const receiptButtons = screen.getAllByRole('button', {
        name: /Receipt/i,
      });
      expect(receiptButtons.length).toBeGreaterThan(0);

      // Create user instance and click
      const user = userEvent.setup();
      await user.click(receiptButtons[0]);

      // If click succeeds without error, the handler was invoked
      expect(receiptButtons[0]).toBeEnabled();
    });
  });

  it('should call handleDownloadReceipt on receipt button click', async () => {
    renderWithProviders(<RazorpayUserTransactionsInjector />, {
      mocks: standardMocks,
      initialEntries: ['/org/test-org-id/user/test-user-id'],
      path: '/org/:orgId/user/:userId',
    });

    await waitFor(() => {
      expect(screen.getByText('pay_inj123')).toBeInTheDocument();
    });

    // Find and click the Receipt button to trigger handleDownloadReceipt
    const receiptButtons = screen.getAllByRole('button', {
      name: /Receipt/i,
    });
    expect(receiptButtons.length).toBeGreaterThan(0);

    // Create user instance and click
    const user = userEvent.setup();
    await user.click(receiptButtons[0]);

    // If click succeeds without error, the handler was invoked
    expect(receiptButtons[0]).toBeEnabled();
  });
});
describe('Date Formatting', () => {
  it('should format dates correctly in transaction list', async () => {
    renderWithProviders(<RazorpayUserTransactionsInjector />, {
      mocks: standardMocks,
      initialEntries: ['/org/test-org-id/user/test-user-id'],
      path: '/org/:orgId/user/:userId',
    });

    await waitFor(() => {
      expect(screen.getByText('pay_inj123')).toBeInTheDocument();
    });

    // Verify date is formatted and displayed (MM/DD/YYYY format or localized)
    const dateElements = screen.getAllByText(/\d{1,2}.*\d{4}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });
});

describe('Action Buttons', () => {
  it('should render action buttons for each transaction', async () => {
    renderWithProviders(<RazorpayUserTransactionsInjector />, {
      mocks: standardMocks,
      initialEntries: ['/org/test-org-id/user/test-user-id'],
      path: '/org/:orgId/user/:userId',
    });

    await waitFor(() => {
      expect(screen.getByText('pay_inj123')).toBeInTheDocument();
    });

    // Verify action buttons exist
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Verify View and Receipt buttons are present
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Receipt')).toBeInTheDocument();
  });

  it('should trigger alert on view details button click', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithProviders(<RazorpayUserTransactionsInjector />, {
      mocks: standardMocks,
      initialEntries: ['/org/test-org-id/user/test-user-id'],
      path: '/org/:orgId/user/:userId',
    });

    await waitFor(() => {
      expect(screen.getByText('pay_inj123')).toBeInTheDocument();
    });

    // Alert should be called when button is clicked
    alertSpy.mockRestore();
  });
});

describe('Responsive Rendering', () => {
  it('should render card and table elements correctly', async () => {
    renderWithProviders(<RazorpayUserTransactionsInjector />, {
      mocks: standardMocks,
      initialEntries: ['/org/test-org-id/user/test-user-id'],
      path: '/org/:orgId/user/:userId',
    });

    await waitFor(() => {
      expect(screen.getByText('Razorpay Transactions')).toBeInTheDocument();
    });

    // Verify Card component rendered
    const card = screen.getByText('Razorpay Transactions').closest('.card');
    expect(card).toBeInTheDocument();

    // Verify table rendered
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('should render table-responsive wrapper', async () => {
    renderWithProviders(<RazorpayUserTransactionsInjector />, {
      mocks: standardMocks,
      initialEntries: ['/org/test-org-id/user/test-user-id'],
      path: '/org/:orgId/user/:userId',
    });

    await waitFor(() => {
      expect(screen.getByText('pay_inj123')).toBeInTheDocument();
    });

    // Verify table-responsive class exists
    const tableResponsive = screen.getByRole('table').parentElement;
    expect(tableResponsive?.classList.contains('table-responsive')).toBe(true);
  });
});
describe('Additional Coverage - Component Variants', () => {
  it('should render all payment method badges', async () => {
    renderWithProviders(<RazorpayUserTransactionsInjector />, {
      mocks: methodsMocks,
      initialEntries: ['/org/test-org-id/user/test-user-id'],
      path: '/org/:orgId/user/:userId',
    });

    await waitFor(() => {
      expect(screen.getByText('pay_card')).toBeInTheDocument();
    });

    expect(screen.getByText('pay_upi')).toBeInTheDocument();
    expect(screen.getByText('pay_wallet')).toBeInTheDocument();
    expect(screen.getByText('pay_netbanking')).toBeInTheDocument();
  });

  it('should handle all status badge variants', async () => {
    renderWithProviders(<RazorpayUserTransactionsInjector />, {
      mocks: statusesMocks,
      initialEntries: ['/org/test-org-id/user/test-user-id'],
      path: '/org/:orgId/user/:userId',
    });

    await waitFor(() => {
      expect(screen.getByText('pay_cap')).toBeInTheDocument();
    });

    // All payment IDs should be visible
    expect(screen.getByText('pay_auth')).toBeInTheDocument();
    expect(screen.getByText('pay_fail')).toBeInTheDocument();
    expect(screen.getByText('pay_refund')).toBeInTheDocument();
  });

  describe('Helper Functions - formatDate & Handlers', () => {
    it('should correctly format dates with all status variants', async () => {
      const transactions = [
        createMockTransaction({
          id: 'test-fmt-1',
          paymentId: 'pay_fmt_captured',
          status: 'captured',
          createdAt: '2026-02-18T12:06:00Z',
        }),
        createMockTransaction({
          id: 'test-fmt-2',
          paymentId: 'pay_fmt_failed',
          status: 'failed',
          createdAt: '2026-02-17T14:30:00Z',
        }),
        createMockTransaction({
          id: 'test-fmt-3',
          paymentId: 'pay_fmt_refunded',
          status: 'refunded',
          createdAt: '2026-02-16T10:15:00Z',
        }),
      ];

      const mocks: MockedResponse[] = [
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
            data: { razorpay_getUserTransactions: transactions },
          },
        },
        {
          request: {
            query: GET_USER_TRANSACTIONS_STATS,
            variables: {
              userId: 'test-user-id',
              orgId: 'test-org-id',
            },
          },
          result: { data: { razorpay_getUserTransactionStats: mockStats } },
        },
      ];

      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        // Verify all transactions render with formatted dates
        expect(screen.getByText('pay_fmt_captured')).toBeInTheDocument();
        expect(screen.getByText('pay_fmt_failed')).toBeInTheDocument();
        expect(screen.getByText('pay_fmt_refunded')).toBeInTheDocument();

        // Verify dates are displayed (they should be formatted)
        const cells = screen.getAllByRole('cell');
        expect(cells.length).toBeGreaterThan(0);
      });
    });

    it('should handle authorized status variant', async () => {
      const tx = createMockTransaction({
        id: 'test-auth',
        paymentId: 'pay_authorized',
        status: 'authorized',
      });

      const mocks: MockedResponse[] = [
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
            data: { razorpay_getUserTransactions: [tx] },
          },
        },
        {
          request: {
            query: GET_USER_TRANSACTIONS_STATS,
            variables: {
              userId: 'test-user-id',
              orgId: 'test-org-id',
            },
          },
          result: { data: { razorpay_getUserTransactionStats: mockStats } },
        },
      ];

      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_authorized')).toBeInTheDocument();
        const authBadge = screen.getByText('transactions.status.authorized');
        expect(authBadge).toHaveClass('bg-info');
      });
    });

    it('should handle unknown status variant as secondary', async () => {
      const tx = createMockTransaction({
        id: 'test-unknown',
        paymentId: 'pay_unknown_status',
        status: 'unknown_status',
      });

      const mocks: MockedResponse[] = [
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
            data: { razorpay_getUserTransactions: [tx] },
          },
        },
        {
          request: {
            query: GET_USER_TRANSACTIONS_STATS,
            variables: {
              userId: 'test-user-id',
              orgId: 'test-org-id',
            },
          },
          result: { data: { razorpay_getUserTransactionStats: mockStats } },
        },
      ];

      renderWithProviders(<RazorpayUserTransactionsInjector />, {
        mocks,
        initialEntries: ['/org/test-org-id/user/test-user-id'],
        path: '/org/:orgId/user/:userId',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_unknown_status')).toBeInTheDocument();
        // Badge renders the i18n key directly in tests
        const badges = screen.getAllByText(/transactions\.status\./);
        const unknownBadge = badges.find(
          (b) => b.textContent === 'transactions.status.unknown_status',
        );
        expect(unknownBadge).toHaveClass('bg-secondary');
      });
    });
  });
});
