/**
 * @vitest-environment jsdom
 */
/**
 * Unit Tests for DonationForm Component
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { MockedResponse } from '@apollo/client/testing';
import DonationForm from '../../../../plugins/Razorpay/admin/pages/DonationForm';
import {
  renderWithProviders,
  createMockUser,
  createMockRazorpayConfig,
  createMockPaymentOrder,
  createUserQueryMock,
} from './testUtils';
import { gql } from '@apollo/client';

// Local definition to ensure exact match
const GET_ORGANIZATION_INFO = gql`
  query GetOrganizationInfo($orgId: String!) {
    organization(input: { id: $orgId }) {
      id
      name
      description
      avatarURL
    }
  }
`;

const GET_RAZORPAY_CONFIG = gql`
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
const CREATE_PAYMENT_ORDER = gql`
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

// Minimal interfaces to replace 'any'
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
      razorpay_createPaymentOrder: {
        ...order,
        __typename: 'PaymentOrder',
      },
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
      // Mock Razorpay as a class (required for 'new' keyword)
      const openMock = vi.fn();
      class RazorpayMock {
        open = openMock;
      }
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

      // Allow state to update button text
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Donate ₹100.00/i }),
        ).toBeInTheDocument();
      });

      const submitBtn = screen.getByRole('button', { name: /Donate ₹100.00/i });
      fireEvent.click(submitBtn);

      // Verify Razorpay was instantiated
      await waitFor(
        () => {
          expect(RazorpayMock).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      // Verify open was called on the instance
      await waitFor(
        () => {
          expect(openMock).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
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
  });
});
