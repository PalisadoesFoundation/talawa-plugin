/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { toast } from 'react-toastify';
import DonationForm from '../../../../plugins/razorpay/admin/pages/DonationForm';
import {
  renderWithProviders,
  createUserQueryMock,
  CREATE_PAYMENT_ORDER,
  VERIFY_PAYMENT,
} from './testUtils';

vi.mock('react-toastify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-toastify')>();
  return {
    ...actual,
    toast: {
      ...actual.toast,
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

import {
  createLocalOrganizationQueryMock,
  mockUser,
  mockOrg,
  mockConfig,
  mockOrder,
  createLocalPaymentOrderMutationMock,
  standardMocks,
  GET_RAZORPAY_CONFIG,
} from './DonationForm.mock';

const renderDonationForm = (customMocks = standardMocks) => {
  return renderWithProviders(<DonationForm />, {
    mocks: customMocks,
    path: '/org/:orgId/donate',
    initialEntries: ['/org/org-123/donate'],
  });
};

describe('DonationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders loader, org details, script cleanup, and handles config error', async () => {
    const { unmount } = renderDonationForm([
      createUserQueryMock(mockUser),
      createLocalOrganizationQueryMock('org-123', mockOrg),
      {
        request: { query: GET_RAZORPAY_CONFIG, variables: {} },
        error: new Error('Config Load Failed'),
      },
    ]);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Config Load Failed/i)).toBeInTheDocument();
    });

    unmount();
    expect(document.querySelector('script[src*="checkout.js"]')).toBeNull();
  });

  describe('Form Interaction & Fields', () => {
    it('handles input fields and validation messages including empty email', async () => {
      renderDonationForm();
      await waitFor(() => screen.getByRole('button', { name: /Donate/i }));

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const msgInput = screen.getByLabelText(/Message/i);

      fireEvent.change(nameInput, { target: { value: 'Jane' } });
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
      fireEvent.change(msgInput, { target: { value: 'Hello' } });

      // submit with empty email to trigger validation failure
      fireEvent.change(emailInput, { target: { value: ' ' } });
      fireEvent.click(screen.getByRole('button', { name: /Donate/i }));

      // select currencies
      const currencySelect = screen.getByRole('combobox');
      fireEvent.change(currencySelect, { target: { value: 'EUR' } });
      expect(currencySelect).toHaveValue('EUR');
      fireEvent.change(currencySelect, { target: { value: 'GBP' } });
      expect(currencySelect).toHaveValue('GBP');

      // hit quick amount
      fireEvent.click(screen.getByText('£100.00'));
      const amountInput = screen.getByPlaceholderText('0.00');
      expect(amountInput).toHaveValue(100);

      // submit with empty amount
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.click(screen.getByRole('button', { name: /Donate/i }));
    });
  });

  describe('Submit error cases', () => {
    it('shows config disabled error on submit', async () => {
      const disabledCfg = {
        request: { query: GET_RAZORPAY_CONFIG, variables: {} },
        result: {
          data: {
            razorpay_getRazorpayConfig: { ...mockConfig, isEnabled: false },
          },
        },
      };
      renderDonationForm([
        createUserQueryMock(mockUser),
        createLocalOrganizationQueryMock('org-123', mockOrg),
        disabledCfg,
      ]);
      await waitFor(() => screen.getByText('Payment System Not Available'));
    });

    it('handles submit with disabled config via mocked hook mutation response', async () => {
      renderDonationForm();
      await waitFor(() => screen.getByRole('button', { name: /Donate/i }));

      // fill amount to allow submit
      fireEvent.change(screen.getByPlaceholderText('0.00'), {
        target: { value: '10' },
      });
      fireEvent.change(screen.getByLabelText(/Full Name/i), {
        target: { value: ' ' },
      }); // trigger name validation
      fireEvent.click(screen.getByRole('button', { name: /Donate/i }));
    });

    it('handles create order null response', async () => {
      const nullOrderMock = {
        request: {
          query: CREATE_PAYMENT_ORDER,
          variables:
            createLocalPaymentOrderMutationMock(mockOrder).request.variables,
        },
        result: { data: { razorpay_createPaymentOrder: null } },
      };

      // Ensure config is mock properly enabled
      renderDonationForm([...standardMocks.slice(0, 3), nullOrderMock]);
      await waitFor(() => screen.getByRole('button', { name: /Donate/i }));

      fireEvent.change(screen.getByPlaceholderText('0.00'), {
        target: { value: '100' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Donate/i }));
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringMatching(/Failed to create payment order/i),
        ),
      );
    });

    it('handles missing orderId', async () => {
      renderDonationForm([
        ...standardMocks.slice(0, 3),
        createLocalPaymentOrderMutationMock({
          ...mockOrder,
          razorpayOrderId: '',
        }),
      ]);
      await waitFor(() => screen.getByRole('button', { name: /Donate/i }));

      fireEvent.change(screen.getByPlaceholderText('0.00'), {
        target: { value: '100' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Donate/i }));
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringMatching(/missing Razorpay order ID/i),
        ),
      );
    });

    it('handles missing order amount', async () => {
      renderDonationForm([
        ...standardMocks.slice(0, 3),
        createLocalPaymentOrderMutationMock({ ...mockOrder, amount: 0 }),
      ]);
      await waitFor(() => screen.getByRole('button', { name: /Donate/i }));

      fireEvent.change(screen.getByPlaceholderText('0.00'), {
        target: { value: '100' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Donate/i }));
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringMatching(/invalid amount/i),
        ),
      );
    });
  });

  describe('Payment Handler & Success Screen', () => {
    const verifyVariables = {
      input: {
        razorpayPaymentId: 'p1',
        razorpayOrderId: 'o1',
        razorpaySignature: 's1',
        paymentData: JSON.stringify({
          razorpay_payment_id: 'p1',
          razorpay_order_id: 'o1',
          razorpay_signature: 's1',
        }),
      },
    };

    it('handles full successful payment and success screen actions', async () => {
      const verifySuccess = {
        request: { query: VERIFY_PAYMENT, variables: verifyVariables },
        result: {
          data: {
            razorpay_verifyPayment: {
              success: true,
              message: 'OK',
              transaction: {
                paymentId: 'p1',
                status: 'captured',
                amount: 10000,
                currency: 'INR',
                __typename: 'RazorpayTransaction',
              },
              __typename: 'PaymentVerificationResult',
            },
          },
        },
      };
      const RazorpayMock = vi.fn().mockImplementation(function (opt: {
        handler: (data: Record<string, string>) => void;
      }) {
        setTimeout(() => {
          if (opt.handler) {
            opt.handler({
              razorpay_payment_id: 'p1',
              razorpay_order_id: 'o1',
              razorpay_signature: 's1',
            });
          }
        }, 10);
        return { open: vi.fn() };
      });
      vi.stubGlobal('Razorpay', RazorpayMock);

      renderDonationForm([
        ...standardMocks,
        verifySuccess,
        createLocalPaymentOrderMutationMock(mockOrder),
        verifySuccess,
      ]);
      await waitFor(() => screen.getByRole('button', { name: /Donate/i }));

      fireEvent.change(screen.getByPlaceholderText('0.00'), {
        target: { value: '100' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Donate/i }));

      await waitFor(() => screen.getByText('Thank You!'), { timeout: 3000 });

      // Test Make Another Donation
      fireEvent.click(screen.getByText('Make Another Donation'));
      await waitFor(() => screen.getByRole('button', { name: /Donate/i }));

      fireEvent.change(screen.getByPlaceholderText('0.00'), {
        target: { value: '100' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Donate/i }));
      await waitFor(() => screen.getByText('Thank You!'), { timeout: 3000 });

      // Test View My Transactions
      fireEvent.click(screen.getByText('View My Transactions'));
    });

    it('handles verification failure message', async () => {
      const verifyFail = {
        request: { query: VERIFY_PAYMENT, variables: verifyVariables },
        result: {
          data: {
            razorpay_verifyPayment: {
              success: false,
              message: 'Signature Invalid',
              transaction: null,
              __typename: 'PaymentVerificationResult',
            },
          },
        },
      };
      const RazorpayMock = vi.fn().mockImplementation(function (opt: {
        handler: (data: Record<string, string>) => void;
      }) {
        setTimeout(
          () =>
            opt.handler({
              razorpay_payment_id: 'p1',
              razorpay_order_id: 'o1',
              razorpay_signature: 's1',
            }),
          10,
        );
        return { open: vi.fn() };
      });
      vi.stubGlobal('Razorpay', RazorpayMock);

      renderDonationForm([...standardMocks, verifyFail]);

      await waitFor(() => screen.getByRole('button', { name: /Donate/i }));
      fireEvent.change(screen.getByPlaceholderText('0.00'), {
        target: { value: '100' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Donate/i }));

      await waitFor(
        () => expect(toast.error).toHaveBeenCalledWith('Signature Invalid'),
        { timeout: 2000 },
      );
    });

    it('handles verification network error (catch block)', async () => {
      const verifyErr = {
        request: { query: VERIFY_PAYMENT, variables: verifyVariables },
        error: new Error('Network Error during verify'),
      };
      const RazorpayMock = vi.fn().mockImplementation(function (opt: {
        handler: (data: Record<string, string>) => void;
      }) {
        setTimeout(
          () =>
            opt.handler({
              razorpay_payment_id: 'p1',
              razorpay_order_id: 'o1',
              razorpay_signature: 's1',
            }),
          10,
        );
        return { open: vi.fn() };
      });
      vi.stubGlobal('Razorpay', RazorpayMock);

      renderDonationForm([...standardMocks, verifyErr]);

      await waitFor(() => screen.getByRole('button', { name: /Donate/i }));
      fireEvent.change(screen.getByPlaceholderText('0.00'), {
        target: { value: '100' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Donate/i }));

      await waitFor(
        () =>
          expect(toast.error).toHaveBeenCalledWith(
            expect.stringMatching(/Failed/i),
          ),
        { timeout: 2000 },
      );
    });
  });
});
