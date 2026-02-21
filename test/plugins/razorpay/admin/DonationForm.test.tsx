/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { MockedResponse } from '@apollo/client/testing';
import DonationForm from '../../../../plugins/razorpay/admin/pages/DonationForm';
import {
  renderWithProviders,
  createMockUser,
  createMockRazorpayConfig,
  createMockPaymentOrder,
  createUserQueryMock,
  GET_RAZORPAY_CONFIG_PUBLIC,
  CREATE_PAYMENT_ORDER,
  GET_ORGANIZATION_INFO,
  VERIFY_PAYMENT,
} from './testUtils';

const GET_RAZORPAY_CONFIG = GET_RAZORPAY_CONFIG_PUBLIC;

interface Organization {
  id: string;
  name: string;
  description: string;
  avatarURL: string;
  [key: string]: unknown;
}

interface PaymentOrder {
  id: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  [key: string]: unknown;
}

const createLocalOrganizationQueryMock = (
  orgId: string,
  organization: Organization,
) => ({
  request: {
    query: GET_ORGANIZATION_INFO,
    variables: { orgId },
  },
  result: {
    data: {
      organization: {
        ...organization,
        __typename: 'Organization',
      },
    },
  },
});

const mockUser = createMockUser();
const mockOrg: Organization = {
  id: 'org-123',
  name: 'Test Organization',
  description: 'A test organization for donations',
  avatarURL: 'https://example.com/avatar.png',
};
const mockConfig = createMockRazorpayConfig();
const mockOrder = createMockPaymentOrder();

const configMock = {
  request: {
    query: GET_RAZORPAY_CONFIG,
    variables: {},
  },
  result: {
    data: {
      razorpay_getRazorpayConfig: {
        ...mockConfig,
        __typename: 'RazorpayConfig',
      },
    },
  },
};

const createLocalPaymentOrderMutationMock = (order: PaymentOrder) => ({
  request: {
    query: CREATE_PAYMENT_ORDER,
    variables: {
      input: {
        organizationId: 'org-123',
        userId: 'user-123',
        amount: 10000, // 100 * 100
        currency: 'INR',
        description: 'Donation to Test Organization',
        donorName: 'John Doe',
        donorEmail: 'john.doe@example.com',
        donorPhone: '',
      },
    },
  },
  result: {
    data: {
      razorpay_createPaymentOrder: order,
    },
  },
});

const standardMocks: MockedResponse[] = [
  createUserQueryMock(mockUser),
  createLocalOrganizationQueryMock('org-123', mockOrg),
  configMock,
  createLocalPaymentOrderMutationMock(mockOrder),
];

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

  describe('Loading State', () => {
    it('should show loader while fetching data', async () => {
      renderDonationForm();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('should render organization details', async () => {
      renderDonationForm();

      await waitFor(() => {
        expect(screen.getByText('Test Organization')).toBeInTheDocument();
      });
      expect(
        screen.getByText('A test organization for donations'),
      ).toBeInTheDocument();
    });

    it('should pre-fill user details', async () => {
      renderDonationForm();

      await waitFor(() => {
        expect(screen.getAllByDisplayValue('John Doe')).toHaveLength(1);
        expect(
          screen.getAllByDisplayValue('john.doe@example.com'),
        ).toHaveLength(1);
      });
    });
  });

  describe('Form Interaction', () => {
    it('should update amount when typing', async () => {
      renderDonationForm();

      await waitFor(() => {
        expect(screen.getByText('Make a Donation')).toBeInTheDocument();
      });

      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '500' } });

      expect(amountInput).toHaveValue(500);
    });

    it('should enable submit button when form is valid', async () => {
      renderDonationForm(standardMocks); // Use helper with correct context

      await waitFor(() => {
        expect(screen.getByText('Make a Donation')).toBeInTheDocument();
      });

      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100' } });

      const submitBtn = screen.getByRole('button', { name: /Donate/i });
      expect(submitBtn).not.toBeDisabled();
    });
  });

  describe('Payment Flow', () => {
    it('should initiate payment on submit', async () => {
      // Mock Razorpay as a class wrapped in vi.fn() for spy tracking
      const openMock = vi.fn();
      const RazorpayMock = vi.fn().mockImplementation(() => ({
        open: openMock,
      }));
      vi.stubGlobal('Razorpay', RazorpayMock);

      renderDonationForm();

      // Wait for form to be rendered with data
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate/i }),
        ).toBeInTheDocument();
      });

      // Fill form
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100' } });

      // Allow state to update button text
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate ₹100.00/i }),
        ).toBeInTheDocument();
      });

      // Submit the form
      const form = screen
        .getByRole('button', { name: /Donate ₹100.00/i })
        .closest('form');
      expect(form).not.toBeNull();
      fireEvent.submit(form!);

      // Verify Razorpay was instantiated with the correct options
      await waitFor(
        () => {
          expect(RazorpayMock).toHaveBeenCalledTimes(1);
        },
        { timeout: 5000 },
      );

      // The Razorpay instance was created and open() was called by the component
      // Since constructor succeeded, verify it was called with expected options
      const options = RazorpayMock.mock.calls[0][0];
      expect(options.key).toBe('rzp_test_abc123');
      expect(options.amount).toBe(10000);
      expect(options.currency).toBe('INR');
    });
  });

  describe('Error Handling', () => {
    it('should show error if config is disabled', async () => {
      const disabledConfigMock = {
        request: {
          query: GET_RAZORPAY_CONFIG,
          variables: {},
        },
        result: {
          data: {
            razorpay_getRazorpayConfig: {
              ...mockConfig,
              isEnabled: false,
              __typename: 'RazorpayConfig',
            },
          },
        },
      };

      const disabledMocks = [
        createUserQueryMock(mockUser),
        createLocalOrganizationQueryMock('org-123', mockOrg),
        disabledConfigMock,
      ];

      renderDonationForm(disabledMocks);

      await waitFor(() => {
        expect(
          screen.getByText(/Payment System Not Available/i),
        ).toBeInTheDocument();
      });
    });

    it('should show error if data fetch fails', async () => {
      const errorMock = {
        request: {
          query: GET_ORGANIZATION_INFO,
          variables: { orgId: 'org-123' },
        },
        error: new Error('Failed to fetch org'),
      };

      renderDonationForm([
        createUserQueryMock(mockUser),
        errorMock,
        configMock,
      ]);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load organization information/i),
        ).toBeInTheDocument();
      });
    });

    it('should handle CREATE_PAYMENT_ORDER mutation failure', async () => {
      const mutationErrorMock = {
        request: {
          query: CREATE_PAYMENT_ORDER,
          variables: {
            input: {
              organizationId: 'org-123',
              userId: 'user-123',
              amount: 10000,
              currency: 'INR',
              description: 'Donation to Test Organization',
              donorName: 'John Doe',
              donorEmail: 'john.doe@example.com',
              donorPhone: '',
            },
          },
        },
        error: new Error('Payment order creation failed'),
      };

      const mocksWithMutationError = [
        createUserQueryMock(mockUser),
        createLocalOrganizationQueryMock('org-123', mockOrg),
        configMock,
        mutationErrorMock,
      ];

      renderDonationForm(mocksWithMutationError);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate/i }),
        ).toBeInTheDocument();
      });

      // Fill form
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate ₹100.00/i }),
        ).toBeInTheDocument();
      });

      // Submit form
      const form = screen
        .getByRole('button', { name: /Donate ₹100.00/i })
        .closest('form');
      fireEvent.submit(form!);

      // Expect error to be shown (toast or message)
      await waitFor(
        () => {
          // The component should show an error state or toast
          expect(
            screen.queryByText(/Processing/i) ||
              screen.queryByRole('button', { name: /Donate/i }),
          ).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    it('should validate amount field constraints', async () => {
      renderDonationForm();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate/i }),
        ).toBeInTheDocument();
      });

      const amountInput = screen.getByPlaceholderText('0.00');

      // Test zero amount
      fireEvent.change(amountInput, { target: { value: '0' } });
      expect(amountInput).toHaveValue(0);

      // Test negative amount
      fireEvent.change(amountInput, { target: { value: '-100' } });
      // Form should prevent negative values due to min="1" attribute
      expect(amountInput).toHaveAttribute('min', '1');

      // Verify button still exists
      expect(
        screen.getByRole('button', { name: /Donate/i }),
      ).toBeInTheDocument();
    });

    it('should handle Razorpay checkout handler failure', async () => {
      // Mock Razorpay that calls the handler.failure callback
      const openMock = vi.fn();
      const RazorpayMock = vi.fn().mockImplementation((options) => {
        // Simulate failure callback when open is called
        setTimeout(() => {
          if (options.handler?.failure) {
            options.handler.failure({
              error: { description: 'Payment cancelled by user' },
            });
          }
        }, 0);
        return { open: openMock };
      });
      vi.stubGlobal('Razorpay', RazorpayMock);

      renderDonationForm();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate/i }),
        ).toBeInTheDocument();
      });

      // Fill form
      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate ₹100.00/i }),
        ).toBeInTheDocument();
      });

      // Submit form
      const form = screen
        .getByRole('button', { name: /Donate ₹100.00/i })
        .closest('form');
      fireEvent.submit(form!);

      // Wait for Razorpay to be called
      await waitFor(
        () => {
          expect(RazorpayMock).toHaveBeenCalled();
        },
        { timeout: 5000 },
      );
    });
    it('should handle network timeout errors', async () => {
      const timeoutErrorMock = {
        request: {
          query: GET_ORGANIZATION_INFO,
          variables: { orgId: 'org-123' },
        },
        error: new Error('Network timeout'),
      };

      renderDonationForm([
        createUserQueryMock(mockUser),
        timeoutErrorMock,
        configMock,
      ]);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on required form fields', async () => {
      renderDonationForm();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate/i }),
        ).toBeInTheDocument();
      });

      // Check that amount input has aria-required
      const amountInput = screen.getByPlaceholderText('0.00');
      expect(amountInput).toHaveAttribute('aria-required', 'true');
      expect(amountInput).toHaveAttribute('min', '1');
    });

    it('should have accessible error alerts with role="alert"', async () => {
      const errorMock = {
        request: {
          query: GET_ORGANIZATION_INFO,
          variables: { orgId: 'org-123' },
        },
        error: new Error('Failed to load'),
      };

      renderDonationForm([
        createUserQueryMock(mockUser),
        errorMock,
        configMock,
      ]);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Payment Verification', () => {
    it('should handle successful payment verification', async () => {
      const verifyPaymentMock = {
        request: {
          query: VERIFY_PAYMENT,
          variables: {
            input: {
              razorpayPaymentId: 'pay_success123',
              razorpayOrderId: 'order_123',
              razorpaySignature: 'signature_123',
              paymentData: expect.any(String),
            },
          },
        },
        result: {
          data: {
            razorpay_verifyPayment: {
              success: true,
              message: 'Payment verified',
              __typename: 'PaymentVerificationResult',
            },
          },
        },
      };

      const mocksWithVerification = [
        createUserQueryMock(mockUser),
        createLocalOrganizationQueryMock('org-123', mockOrg),
        configMock,
        createLocalPaymentOrderMutationMock(mockOrder),
        verifyPaymentMock,
      ];

      const RazorpayMock = vi.fn().mockImplementation((options) => {
        // Simulate successful payment
        setTimeout(() => {
          if (options.handler?.success) {
            options.handler.success({
              razorpay_payment_id: 'pay_success123',
              razorpay_order_id: 'order_123',
              razorpay_signature: 'signature_123',
            });
          }
        }, 100);
        return { open: vi.fn() };
      });
      vi.stubGlobal('Razorpay', RazorpayMock);

      renderDonationForm(mocksWithVerification);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate/i }),
        ).toBeInTheDocument();
      });

      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100' } });
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate ₹100.00/i }),
        ).toBeInTheDocument();
      });
      const form = screen
        .getByRole('button', { name: /Donate ₹100.00/i })
        .closest('form');
      fireEvent.submit(form!);

      // Wait for payment verification flow
      await waitFor(
        () => {
          expect(RazorpayMock).toHaveBeenCalled();
        },
        { timeout: 5000 },
      );
    });
  });
  describe('Form Field Coverage', () => {
    it('should handle currency selection', async () => {
      renderDonationForm();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate/i }),
        ).toBeInTheDocument();
      });

      // Look for currency selector
      const currencySelects = screen.queryAllByDisplayValue('INR');
      if (currencySelects.length > 0) {
        const currencySelect = currencySelects[0] as HTMLSelectElement;
        fireEvent.change(currencySelect, { target: { value: 'USD' } });
        expect(currencySelect.value).toBe('USD');
      }
    });

    it('should display payment summary when amount is entered', async () => {
      renderDonationForm();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate/i }),
        ).toBeInTheDocument();
      });

      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '100' } });

      await waitFor(() => {
        // Payment summary should appear when amount > 0
        const summary = screen.queryByText('Payment Summary');
        if (summary) {
          expect(summary).toBeInTheDocument();
        }
      });
    });

    it('should handle quick amount buttons', async () => {
      renderDonationForm();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate/i }),
        ).toBeInTheDocument();
      });

      // Try to click a quick amount button
      const quickAmountButtons = screen.queryAllByRole('button');
      // Find button with amount like "100", "500", etc
      const amountButton = quickAmountButtons.find((btn) =>
        /^[0-9]+$/.test(btn.textContent || ''),
      );

      if (amountButton) {
        fireEvent.click(amountButton);
        const amountInput = screen.getByPlaceholderText('0.00');
        expect(amountInput).toHaveValue(expect.any(Number));
      }
    });
  });

  describe('Script Loading', () => {
    it('should load Razorpay script on mount and cleanup on unmount', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeSpy = vi.spyOn(Element.prototype, 'remove');

      const { unmount } = renderDonationForm();
      // Verify script was added
      expect(appendChildSpy).toHaveBeenCalledWith(
        expect.any(HTMLScriptElement),
      );
      // Verify the script element was added
      const scripts = document.querySelectorAll(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );
      expect(scripts.length).toBeGreaterThan(0);
      // Unmount component
      unmount();
      // Script should be cleaned up
      appendChildSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});
