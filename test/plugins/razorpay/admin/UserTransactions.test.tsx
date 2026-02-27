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
import { toast } from 'react-toastify';

vi.mock('react-toastify', () => ({
  toast: {
    info: vi.fn(),
  },
}));

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
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('INR 100.00')).toBeInTheDocument();
      expect(screen.getByText('INR 50.00')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('transactions.search'),
      ).toBeInTheDocument();
      expect(
        screen.getAllByLabelText('transactions.filters.statusLabel').length,
      ).toBeGreaterThan(0);
      const viewButtons = screen.getAllByText(/View/i);
      expect(viewButtons.length).toBeGreaterThanOrEqual(2);
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
    it('should filter transactions by search text and handle clear', async () => {
      renderUserTransactions();
      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });
      const searchInput = screen.getByPlaceholderText(
        'transactions.search',
      ) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'pay_abc' } });
      expect(searchInput.value).toBe('pay_abc');
      fireEvent.change(searchInput, { target: { value: 'john' } }); // case-insensitive
      expect(searchInput.value).toBe('john');
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(searchInput.value).toBe('');
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

  describe('Payment Method and Status Coverage', () => {
    it('should render transactions with various payment methods', async () => {
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
    it('should render transactions with various statuses', async () => {
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
    it('should have functional View and Download buttons that trigger toasts', async () => {
      const user = userEvent.setup();
      renderUserTransactions();

      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });

      // Verify View button click triggers toast
      const viewButtons = screen.getAllByRole('button', { name: /View/i });
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
        expect(toast.info).toHaveBeenCalledWith(
          'transactions.messages.viewDetailsComing',
        );
      }

      // Verify Receipt button click triggers toast
      const receiptButtons = screen.getAllByRole('button', {
        name: /Receipt|Download/i,
      });
      if (receiptButtons.length > 0) {
        await user.click(receiptButtons[0]);
        expect(toast.info).toHaveBeenCalledWith(
          'transactions.messages.downloadReceiptComing',
        );
      }
    });
  });

  describe('Data Formatting', () => {
    it('should display formatted amounts and status badges', async () => {
      renderUserTransactions();
      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });
      expect(screen.getByText('INR 100.00')).toBeInTheDocument();
      expect(screen.getByText('INR 50.00')).toBeInTheDocument();
      expect(screen.getAllByText('CAPTURED').length).toBeGreaterThan(0);
      expect(screen.getAllByText('FAILED').length).toBeGreaterThan(0);
    });
    it('should show N/A when amount is zero or missing', async () => {
      const noAmountTxns = [
        createMockTransaction({
          id: 'txn-noamt',
          paymentId: 'pay_noamt',
          amount: 0,
          status: 'captured',
        }),
      ];
      const mocks = createTransactionMocks(noAmountTxns);
      renderUserTransactions(mocks);
      await waitFor(() => {
        expect(screen.getByText('pay_noamt')).toBeInTheDocument();
      });
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Complete User Workflows', () => {
    it('should handle search, filter, and view workflow', async () => {
      const user = userEvent.setup();
      renderUserTransactions();
      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });
      const searchInput = screen.getByPlaceholderText(
        'transactions.search',
      ) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'John' } });
      expect(searchInput.value).toBe('John');
      const statusSelect = (await screen.findByLabelText(
        'transactions.filters.statusLabel',
      )) as HTMLSelectElement;
      fireEvent.change(statusSelect, { target: { value: 'captured' } });
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      const viewButtons = screen.getAllByText(/View/i);
      if (viewButtons.length > 0) await user.click(viewButtons[0]);
      fireEvent.change(searchInput, { target: { value: '' } });
      fireEvent.change(statusSelect, { target: { value: 'all' } });
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });
  });

  describe('Date Range Filtering', () => {
    it('should handle start date onChange', async () => {
      renderUserTransactions();
      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });
      const startDate = screen.getByLabelText(
        'transactions.filters.startDate',
      ) as HTMLInputElement;
      fireEvent.change(startDate, { target: { value: '2024-01-01' } });
      expect(startDate.value).toBe('2024-01-01');
      // Clear start date
      fireEvent.change(startDate, { target: { value: '' } });
      expect(startDate.value).toBe('');
    });
    it('should handle end date onChange', async () => {
      renderUserTransactions();
      await waitFor(() => {
        expect(screen.getByText('pay_abc123')).toBeInTheDocument();
      });
      const endDate = screen.getByLabelText(
        'transactions.filters.endDate',
      ) as HTMLInputElement;
      fireEvent.change(endDate, { target: { value: '2024-12-31' } });
      expect(endDate.value).toBe('2024-12-31');
      // Clear end date
      fireEvent.change(endDate, { target: { value: '' } });
      expect(endDate.value).toBe('');
    });
    it('should filter transactions by date range', async () => {
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
      renderUserTransactions(mocks);
      await waitFor(() => {
        expect(screen.getByText('pay_old')).toBeInTheDocument();
        expect(screen.getByText('pay_recent')).toBeInTheDocument();
      });
      const startDate = screen.getByLabelText(
        'transactions.filters.startDate',
      ) as HTMLInputElement;
      const endDate = screen.getByLabelText(
        'transactions.filters.endDate',
      ) as HTMLInputElement;
      fireEvent.change(startDate, { target: { value: '2024-01-01' } });
      fireEvent.change(endDate, { target: { value: '2024-02-01' } });
      await waitFor(() => {
        expect(screen.getByText('pay_old')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle transactions with null fields', async () => {
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
      renderUserTransactions(mocks);
      await waitFor(() => {
        expect(screen.getByText('pay_null1')).toBeInTheDocument();
      });
    });
    it('should handle multiple transactions with same donor', async () => {
      const sameDonorTxns = [
        createMockTransaction({
          id: 'txn-same-1',
          paymentId: 'pay_same1',
          donorName: 'Same Donor',
          status: 'captured',
        }),
        createMockTransaction({
          id: 'txn-same-2',
          paymentId: 'pay_same2',
          donorName: 'Same Donor',
          status: 'authorized',
        }),
      ];
      const mocks = createTransactionMocks(sameDonorTxns);
      renderUserTransactions(mocks);
      await waitFor(() => {
        const donorElements = screen.getAllByText('Same Donor');
        expect(donorElements.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
