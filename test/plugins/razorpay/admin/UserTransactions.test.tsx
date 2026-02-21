/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import UserTransactions from '../../../../plugins/razorpay/admin/pages/UserTransactions';
import {
  renderWithProviders,
  GET_USER_TRANSACTIONS,
  GET_USER_TRANSACTION_STATS,
  createMockTransaction,
} from './testUtils';
import {
  standardMocks,
  createTransactionMocks,
  transactionSets,
  emptyStats,
} from './UserTransactions.mocks';
import userEvent from '@testing-library/user-event';

const renderUserTransactions = (mocks = standardMocks) => {
  renderWithProviders(<UserTransactions />, {
    mocks,
    initialEntries: ['/user/razorpay/my-transactions'],
    path: '/user/razorpay/my-transactions',
  });
};

describe('UserTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should show loading state initially', () => {
      renderUserTransactions();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render page with transaction data and controls', async () => {
      renderUserTransactions();

      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });

      // Verify key components are rendered
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('INR 100.00')).toBeInTheDocument();
      expect(screen.getByText('INR 50.00')).toBeInTheDocument();

      // Verify filters exist
      expect(
        screen.getByPlaceholderText('transactions.search'),
      ).toBeInTheDocument();
      expect(
        screen.getAllByLabelText('transactions.filters.statusLabel').length,
      ).toBeGreaterThan(0);
    });

    it('should render empty table gracefully', async () => {
      const emptyMocks = createTransactionMocks(
        transactionSets.empty,
        emptyStats,
      );
      renderUserTransactions(emptyMocks);

      await waitFor(() => {
        const tableBody = screen.getByRole('table')?.querySelector('tbody');
        expect(tableBody).toBeInTheDocument();
      });
    });

    it('should render View buttons for each transaction', async () => {
      renderUserTransactions();

      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText(/View/i);
      expect(viewButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    it('should display error when transactions fail to load', async () => {
      const errorMocks = [
        {
          request: {
            query: GET_USER_TRANSACTIONS,
            variables: { userId: 'test-user-id', limit: 100 },
          },
          error: new Error('Network error'),
        },
        {
          request: {
            query: GET_USER_TRANSACTION_STATS,
            variables: { userId: 'test-user-id' },
          },
          result: {
            data: {
              razorpay_getUserTransactionStats: {
                totalTransactions: 0,
                totalAmount: 0,
              },
            },
          },
        },
      ];

      renderUserTransactions(errorMocks);

      await waitFor(() => {
        const errorElements = screen.queryAllByText(
          /error|failed|failed to load/i,
        );
        expect(
          errorElements.length > 0 || screen.queryByRole('alert'),
        ).toBeTruthy();
      });
    });

    it('should handle transactions with missing donor name', async () => {
      const mocks = createTransactionMocks(transactionSets.anonymous);
      renderUserTransactions(mocks);

      await waitFor(() => {
        expect(screen.getByText('anon@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter transactions by search text (payment ID, name, email)', async () => {
      renderUserTransactions();

      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        'transactions.search',
      ) as HTMLInputElement;

      // Search by payment ID
      fireEvent.change(searchInput, { target: { value: 'pay_abc' } });
      expect(searchInput.value).toBe('pay_abc');

      // Search by donor name
      fireEvent.change(searchInput, { target: { value: 'John' } });
      expect(searchInput.value).toBe('John');

      // Search with special characters
      fireEvent.change(searchInput, { target: { value: '@#$' } });
      expect(searchInput.value).toBe('@#$');

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(searchInput.value).toBe('');
    });

    it('should handle case-insensitive search', async () => {
      renderUserTransactions();

      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        'transactions.search',
      ) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'john' } }); // lowercase
      expect(searchInput.value).toBe('john');
    });
  });

  describe('Status Filtering', () => {
    it('should filter by captured status', async () => {
      const mocks = createTransactionMocks(transactionSets.capturedAndFailed);
      renderUserTransactions(mocks);

      const statusSelect = (await screen.findByLabelText(
        'transactions.filters.statusLabel',
      )) as HTMLSelectElement;

      fireEvent.change(statusSelect, { target: { value: 'captured' } });

      await waitFor(() => {
        expect(screen.getByText('pay_captured')).toBeInTheDocument();
      });
    });

    it('should filter by authorized status', async () => {
      const mocks = createTransactionMocks(transactionSets.authorizedAndFailed);
      renderUserTransactions(mocks);

      const statusSelect = (await screen.findByLabelText(
        'transactions.filters.statusLabel',
      )) as HTMLSelectElement;

      fireEvent.change(statusSelect, { target: { value: 'authorized' } });

      await waitFor(() => {
        expect(screen.getByText('pay_auth1')).toBeInTheDocument();
      });
    });

    it('should filter by refunded status', async () => {
      const mocks = createTransactionMocks(transactionSets.refundedAndCaptured);
      renderUserTransactions(mocks);

      const statusSelect = (await screen.findByLabelText(
        'transactions.filters.statusLabel',
      )) as HTMLSelectElement;

      fireEvent.change(statusSelect, { target: { value: 'refunded' } });

      await waitFor(() => {
        expect(screen.getByText('pay_refund1')).toBeInTheDocument();
      });
    });

    it('should show all transactions when status is set to all', async () => {
      const mocks = createTransactionMocks(transactionSets.capturedAndFailed);
      renderUserTransactions(mocks);

      const statusSelect = (await screen.findByLabelText(
        'transactions.filters.statusLabel',
      )) as HTMLSelectElement;

      // Apply filter
      fireEvent.change(statusSelect, { target: { value: 'captured' } });

      await waitFor(() => {
        expect(screen.getByText('pay_captured')).toBeInTheDocument();
      });

      // Reset to all
      fireEvent.change(statusSelect, { target: { value: 'all' } });

      await waitFor(() => {
        expect(screen.getByText('pay_failed')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Method Coverage', () => {
    it('should render transactions with various payment methods and statuses', async () => {
      const mocks = createTransactionMocks(transactionSets.mixed);
      renderUserTransactions(mocks);

      await waitFor(() => {
        expect(screen.getByText('pay_mix1')).toBeInTheDocument();
        expect(screen.getByText('pay_mix2')).toBeInTheDocument();
        expect(screen.getByText('pay_mix3')).toBeInTheDocument();
      });

      // All variants (card, upi, netbanking, wallet, null) should render without error
    });

    it('should handle each method variant correctly', async () => {
      const methodTests = [
        { set: transactionSets.card, paymentId: 'pay_card123' },
        { set: transactionSets.upi, paymentId: 'pay_upi123' },
        { set: transactionSets.netbanking, paymentId: 'pay_netbanking123' },
        { set: transactionSets.wallet, paymentId: 'pay_wallet123' },
      ];

      for (const test of methodTests) {
        const { unmount } = renderWithProviders(<UserTransactions />, {
          mocks: createTransactionMocks(test.set),
          initialEntries: ['/user/razorpay/my-transactions'],
          path: '/user/razorpay/my-transactions',
        });

        await waitFor(() => {
          expect(screen.getByText(test.paymentId)).toBeInTheDocument();
        });

        unmount();
      }
    });

    it('should handle each status variant correctly', async () => {
      const statusTests = [
        { set: transactionSets.authorized, paymentId: 'pay_auth123' },
        { set: transactionSets.refunded, paymentId: 'pay_refund123' },
        { set: transactionSets.unknown, paymentId: 'pay_unknown123' },
      ];

      for (const test of statusTests) {
        const { unmount } = renderWithProviders(<UserTransactions />, {
          mocks: createTransactionMocks(test.set),
          initialEntries: ['/user/razorpay/my-transactions'],
          path: '/user/razorpay/my-transactions',
        });

        await waitFor(() => {
          expect(screen.getByText(test.paymentId)).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('Button Actions', () => {
    it('should have functional View and Download buttons', async () => {
      const user = userEvent.setup();
      renderUserTransactions();

      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Verify buttons are clickable
      const viewButtons = screen.getAllByText(/View/i);
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
        expect(viewButtons[0]).toBeEnabled();
      }

      const receiptButtons = screen.getAllByRole('button', {
        name: /Receipt|Download/i,
      });
      if (receiptButtons.length > 0) {
        await user.click(receiptButtons[0]);
        expect(receiptButtons[0]).toBeEnabled();
      }
    });
  });

  describe('Data Formatting', () => {
    it('should display transactions with correct formatting and badges', async () => {
      renderUserTransactions();

      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });

      // Verify amounts are formatted correctly
      expect(screen.getByText('INR 100.00')).toBeInTheDocument();
      expect(screen.getByText('INR 50.00')).toBeInTheDocument();

      // Verify status badges are displayed
      expect(screen.getByText('CAPTURED')).toBeInTheDocument();
      expect(screen.getByText('FAILED')).toBeInTheDocument();
    });
  });

  describe('Complete User Workflows', () => {
    it('should handle search, filter, and view workflow', async () => {
      const user = userEvent.setup();
      renderUserTransactions();

      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });

      // Step 1: Search
      const searchInput = screen.getByPlaceholderText(
        'transactions.search',
      ) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'John' } });
      expect(searchInput.value).toBe('John');

      // Step 2: Filter by status
      const statusSelect = (await screen.findByLabelText(
        'transactions.filters.statusLabel',
      )) as HTMLSelectElement;
      fireEvent.change(statusSelect, { target: { value: 'captured' } });

      // Step 3: Verify result and click view
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText(/View/i);
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
      }

      // Clear search and reset filter
      fireEvent.change(searchInput, { target: { value: '' } });
      fireEvent.change(statusSelect, { target: { value: 'all' } });

      // Verify both transactions are now visible
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should handle filter reset with multiple transactions', async () => {
      const mocks = createTransactionMocks(transactionSets.mixed);
      renderUserTransactions(mocks);

      const statusSelect = (await screen.findByLabelText(
        'transactions.filters.statusLabel',
      )) as HTMLSelectElement;

      // Apply filter
      fireEvent.change(statusSelect, { target: { value: 'authorized' } });

      await waitFor(() => {
        expect(screen.getByText('pay_mix1')).toBeInTheDocument();
      });

      // Reset to all
      fireEvent.change(statusSelect, { target: { value: 'all' } });

      await waitFor(() => {
        expect(screen.getByText('pay_mix2')).toBeInTheDocument();
        expect(screen.getByText('pay_mix3')).toBeInTheDocument();
      });
    });

    it('should handle combined search and filter operations', async () => {
      const mocks = createTransactionMocks(transactionSets.capturedAndFailed);
      renderUserTransactions(mocks);

      await waitFor(() => {
        expect(screen.getByText('pay_captured')).toBeInTheDocument();
      });

      // Search
      const searchInput = screen.getByPlaceholderText(
        'transactions.search',
      ) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Test' } });
      expect(searchInput.value).toBe('Test');

      // Filter
      const statusSelect = (await screen.findByLabelText(
        'transactions.filters.statusLabel',
      )) as HTMLSelectElement;
      fireEvent.change(statusSelect, { target: { value: 'captured' } });

      // Both should remain applied
      expect(searchInput.value).toBe('Test');
      expect(statusSelect.value).toBe('captured');
    });
  });

  describe('Advanced Filter Scenarios', () => {
    it('should handle transactions with identical amounts and methods', async () => {
      const { unmount } = renderWithProviders(<UserTransactions />, {
        mocks: standardMocks,
        initialEntries: ['/user/razorpay/my-transactions'],
        path: '/user/razorpay/my-transactions',
      });

      await waitFor(() => {
        expect(screen.getByText('INR 100.00')).toBeInTheDocument();
      });

      // Verify component handles transaction grouping
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThanOrEqual(2);

      unmount();
    });

    it('should handle multiple transactions with same donor', async () => {
      const sameDonorTransactions = [
        createMockTransaction({
          id: 'txn-same-1',
          paymentId: 'pay_same1',
          donorName: 'Same Donor',
          status: 'captured',
          method: 'card',
        }),
        createMockTransaction({
          id: 'txn-same-2',
          paymentId: 'pay_same2',
          donorName: 'Same Donor',
          status: 'authorized',
          method: 'upi',
        }),
      ];

      const mocks = createTransactionMocks(sameDonorTransactions);
      const { unmount } = renderWithProviders(<UserTransactions />, {
        mocks,
        initialEntries: ['/user/razorpay/my-transactions'],
        path: '/user/razorpay/my-transactions',
      });

      await waitFor(() => {
        const donorElements = screen.getAllByText('Same Donor');
        expect(donorElements.length).toBeGreaterThanOrEqual(2);
      });

      unmount();
    });

    it('should filter correctly with edge case null values', async () => {
      const nullFieldTransactions = [
        createMockTransaction({
          id: 'txn-null-1',
          paymentId: 'pay_null1',
          bank: null,
          wallet: null,
          vpa: null,
          status: 'captured',
        }),
        createMockTransaction({
          id: 'txn-null-2',
          paymentId: 'pay_null2',
          donorName: null,
          bank: null,
          method: null,
        }),
      ];

      const mocks = createTransactionMocks(nullFieldTransactions);
      const { unmount } = renderWithProviders(<UserTransactions />, {
        mocks,
        initialEntries: ['/user/razorpay/my-transactions'],
        path: '/user/razorpay/my-transactions',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_null1')).toBeInTheDocument();
      });

      const statusSelect = (await screen.findByLabelText(
        'transactions.filters.statusLabel',
      )) as HTMLSelectElement;

      fireEvent.change(statusSelect, { target: { value: 'captured' } });

      await waitFor(() => {
        expect(screen.getByText('pay_null1')).toBeInTheDocument();
      });

      unmount();
    });

    it('should render correctly with various date ranges', async () => {
      const datedTransactions = [
        createMockTransaction({
          id: 'txn-old',
          paymentId: 'pay_old',
          createdAt: '2024-01-15T10:00:00Z',
        }),
        createMockTransaction({
          id: 'txn-recent',
          paymentId: 'pay_recent',
          createdAt: new Date().toISOString(),
        }),
      ];

      const mocks = createTransactionMocks(datedTransactions);
      const { unmount } = renderWithProviders(<UserTransactions />, {
        mocks,
        initialEntries: ['/user/razorpay/my-transactions'],
        path: '/user/razorpay/my-transactions',
      });

      await waitFor(() => {
        expect(screen.getByText('pay_old')).toBeInTheDocument();
        expect(screen.getByText('pay_recent')).toBeInTheDocument();
      });

      unmount();
    });
  });
});
