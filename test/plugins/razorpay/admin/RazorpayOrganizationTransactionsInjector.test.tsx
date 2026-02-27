/**
 * @vitest-environment jsdom
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
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';

vi.mock('react-toastify', () => ({ toast: { info: vi.fn() } }));

const mockStats = createMockTransactionStats();
const ROUTE = { initialEntries: ['/org/test-org-id'], path: '/org/:orgId' };

// DRY helper: create Apollo mocks from transactions + stats
const createOrgMocks = (
  txns: ReturnType<typeof createMockTransaction>[],
  stats = mockStats,
): MockedResponse[] => [
  {
    request: {
      query: GET_ORG_TRANSACTIONS,
      variables: { orgId: 'test-org-id', limit: 10 },
    },
    result: { data: { razorpay_getOrganizationTransactions: txns } },
  },
  {
    request: {
      query: GET_ORG_TRANSACTION_STATS,
      variables: { orgId: 'test-org-id' },
    },
    result: { data: { razorpay_getOrganizationTransactionStats: stats } },
  },
];

const standardMocks = createOrgMocks([
  createMockTransaction({ id: '1', paymentId: 'pay_org1' }),
]);

const renderComp = (mocks = standardMocks) =>
  renderWithProviders(<RazorpayOrganizationTransactionsInjector />, {
    mocks,
    ...ROUTE,
  });

describe('RazorpayOrganizationTransactionsInjector', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should show loading state', () => {
    renderComp();
    expect(screen.getByText('transactions.loadingOrg')).toBeInTheDocument();
  });

  it('should handle errors gracefully', async () => {
    const errorMocks: MockedResponse[] = [
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
    renderComp(errorMocks);
    await waitFor(() => {
      expect(
        screen.getByText(/transactions.error.loadOrgFailed/),
      ).toBeInTheDocument();
    });
  });

  it('should render transactions and stats', async () => {
    renderComp();
    expect(
      await screen.findByText('transactions.orgTitle'),
    ).toBeInTheDocument();
    expect(screen.getByText('pay_org1')).toBeInTheDocument();
    expect(
      screen.getByText('transactions.stats.totalTransactions'),
    ).toBeInTheDocument();
  });

  describe('Status Badges', () => {
    const statusCases = [
      { status: 'captured', label: 'CAPTURED', badge: 'bg-success' },
      { status: 'failed', label: 'FAILED', badge: 'bg-danger' },
      { status: 'authorized', label: 'AUTHORIZED', badge: 'bg-info' },
      { status: 'refunded', label: 'REFUNDED', badge: 'bg-warning' },
      { status: 'unknown', label: 'UNKNOWN', badge: 'bg-secondary' },
    ] as const;
    it.each(statusCases)(
      'should show $badge for $status',
      async ({ status, label, badge }) => {
        const mocks = createOrgMocks([
          createMockTransaction({
            id: `test-${status}`,
            paymentId: `pay_${status}`,
            status,
          }),
        ]);
        renderComp(mocks);
        await waitFor(() => {
          const el = screen.getByText(label);
          expect(el).toHaveClass(badge);
        });
      },
    );
  });

  describe('Ternary Fallback Coverage', () => {
    it('should show N/A for null amount, fee, method, paymentId, donorEmail', async () => {
      const tx = createMockTransaction({
        id: 'null-fields',
        paymentId: null,
        amount: null,
        fee: null,
        method: null,
        donorName: null,
        donorEmail: null,
        status: 'captured',
      });
      const mocks = createOrgMocks([tx]);
      renderComp(mocks);
      await waitFor(() => {
        // paymentId null, amount null, fee null, method null, donorEmail null
        // all render t('common.notAvailable') = 'N/A'; donorName null = 'common.anonymous'
        const naElements = screen.getAllByText('N/A');
        expect(naElements.length).toBeGreaterThanOrEqual(4);
        expect(screen.getByText('common.anonymous')).toBeInTheDocument();
      });
    });

    it('should show 0.00 when stats.totalAmount is null', async () => {
      const mocks = createOrgMocks(
        [createMockTransaction({ id: 'stat-null', paymentId: 'pay_sn' })],
        createMockTransactionStats({
          totalAmount: null,
          totalTransactions: null,
        }),
      );
      renderComp(mocks);
      await waitFor(() => {
        expect(screen.getByText('pay_sn')).toBeInTheDocument();
      });
      // totalAmount null => '0.00', totalTransactions null => 0
      const zeroAmounts = screen.getAllByText(
        (_content, el) =>
          el?.tagName === 'DIV' && /^\s*0\.00\s/.test(el.textContent || ''),
      );
      expect(zeroAmounts.length).toBeGreaterThan(0);
    });

    it('should calculate success rate correctly', async () => {
      const mocks = createOrgMocks(
        [createMockTransaction({ id: 'sr', paymentId: 'pay_sr' })],
        createMockTransactionStats({
          totalTransactions: 10,
          successfulTransactions: 8,
          failedTransactions: 2,
          totalAmount: 100000,
        }),
      );
      renderComp(mocks);
      await waitFor(() => {
        expect(screen.getByText('pay_sr')).toBeInTheDocument();
      });
      // 8/10 * 100 = 80.0%
      expect(screen.getByText(/80\.0/)).toBeInTheDocument();
    });

    it('should calculate success rate with non-zero transactions', async () => {
      const stats = createMockTransactionStats({
        totalAmount: 100000,
        totalTransactions: 10,
        successfulTransactions: 7, // 7/10 = 70.0%
        failedTransactions: 3,
        currency: 'INR',
      });
      const mocks = createOrgMocks([], stats);
      renderComp(mocks);
      await waitFor(() => {
        expect(screen.getByText(/70\.0/)).toBeInTheDocument();
      });
    });

    it('should show 0.0% success rate when totalTransactions is 0', async () => {
      const mocks = createOrgMocks(
        [createMockTransaction({ id: 'z', paymentId: 'pay_z' })],
        createMockTransactionStats({ totalTransactions: 0 }),
      );
      renderComp(mocks);
      await waitFor(() => {
        expect(screen.getByText('pay_z')).toBeInTheDocument();
      });
      // success rate 0.0% rendered in a div with color style
      const rateEl = screen.getAllByText(
        (_content, el) =>
          el?.tagName === 'DIV' && el.textContent?.trim() === '0.0%',
      );
      expect(rateEl.length).toBeGreaterThan(0);
    });
    it('should show formatted fee when fee is not null', async () => {
      const tx = createMockTransaction({
        id: 'fee-test',
        paymentId: 'pay_fee',
        fee: 1000,
        currency: 'INR',
      });
      const mocks = createOrgMocks([tx]);
      renderComp(mocks);
      await waitFor(() => {
        expect(screen.getByText('pay_fee')).toBeInTheDocument();
      });
      // 1000 cents = 10.00
      // 1000 cents = 10.00
      expect(screen.getByText('INR 10.00')).toBeInTheDocument();
    });

    it('should show notAvailable for missing donorEmail', async () => {
      const tx = createMockTransaction({
        id: 'txn-no-email',
        paymentId: 'pay_no_email',
        donorEmail: null,
      });
      const mocks = createOrgMocks([tx]);
      renderComp(mocks);
      await waitFor(() => {
        expect(screen.getByText('pay_no_email')).toBeInTheDocument();
      });
      // The donor field has two divs: one for name ("common.anonymous") and one for email ("common.notAvailable")
      // In tests, common.notAvailable resolves to "N/A"
      expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
    });
  });

  describe('Button Click Handlers', () => {
    it('should call toast.info on View button click', async () => {
      const user = userEvent.setup();
      renderComp();
      await waitFor(() => {
        expect(screen.getByText('pay_org1')).toBeInTheDocument();
      });
      const viewBtn = screen.getAllByRole('button', { name: /View/i })[0];
      await user.click(viewBtn);
      expect(toast.info).toHaveBeenCalledWith(
        'Viewing details for transaction: 1',
      );
    });

    it('should call toast.info on Receipt button click', async () => {
      const user = userEvent.setup();
      renderComp();
      await waitFor(() => {
        expect(screen.getByText('pay_org1')).toBeInTheDocument();
      });
      const receiptBtn = screen.getAllByRole('button', { name: /Receipt/i })[0];
      await user.click(receiptBtn);
      expect(toast.info).toHaveBeenCalledWith(
        'Downloading receipt for transaction: 1',
      );
    });
  });

  it('should format amounts correctly', async () => {
    const mocks = createOrgMocks([
      createMockTransaction({
        id: 'amt',
        paymentId: 'pay_amt',
        amount: 50000,
        currency: 'INR',
      }),
    ]);
    renderComp(mocks);
    await waitFor(() => {
      expect(screen.getByText('pay_amt')).toBeInTheDocument();
    });
    expect(screen.getByText('INR 500.00')).toBeInTheDocument();
  });

  it('should render empty state when no transactions', async () => {
    const mocks = createOrgMocks([]);
    renderComp(mocks);
    await waitFor(() => {
      expect(screen.getByText('transactions.table.noData')).toBeInTheDocument();
    });
  });
});
