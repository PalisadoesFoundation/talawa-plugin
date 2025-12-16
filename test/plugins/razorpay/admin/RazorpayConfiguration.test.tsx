/**
 * @vitest-environment jsdom
 */
/**
 * Unit Tests for RazorpayConfiguration Component
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedResponse } from '@apollo/client/testing';
import RazorpayConfiguration from '../../../../plugins/Razorpay/admin/pages/RazorpayConfiguration';
import { renderWithProviders, createMockRazorpayConfig } from './testUtils';
import { gql } from '@apollo/client';

const GET_RAZORPAY_CONFIG = gql`
  query GetRazorpayConfig {
    razorpay_getRazorpayConfig {
      keyId
      keySecret
      webhookSecret
      isEnabled
      testMode
      currency
      description
    }
  }
`;

const UPDATE_RAZORPAY_CONFIG = gql`
  mutation UpdateRazorpayConfig($input: RazorpayConfigInput!) {
    razorpay_updateRazorpayConfig(input: $input) {
      keyId
      keySecret
      webhookSecret
      isEnabled
      testMode
      currency
      description
    }
  }
`;

const TEST_RAZORPAY_SETUP = gql`
  mutation TestRazorpaySetup {
    razorpay_testRazorpaySetup {
      success
      message
    }
  }
`;

const mockConfig = createMockRazorpayConfig();

const standardMocks: MockedResponse[] = [
  {
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
  },
  {
    request: {
      query: UPDATE_RAZORPAY_CONFIG,
      variables: {
        input: {
          keyId: 'rzp_live_newkey',
          keySecret: 'secret123', // from mockConfig
          webhookSecret: 'webhook_secret_123', // from mockConfig
          isEnabled: true,
          testMode: true,
          currency: 'INR',
          description: 'Donation to organization',
        },
      },
    },
    result: {
      data: {
        razorpay_updateRazorpayConfig: {
          ...mockConfig,
          keyId: 'rzp_live_newkey',
          __typename: 'RazorpayConfig',
        },
      },
    },
  },
  {
    request: {
      query: TEST_RAZORPAY_SETUP,
      variables: {},
    },
    result: {
      data: {
        razorpay_testRazorpaySetup: {
          success: true,
          message: 'Setup test successful',
          __typename: 'RazorpayTestResult',
        },
      },
    },
  },
];

describe('RazorpayConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading state', async () => {
      renderWithProviders(<RazorpayConfiguration />, {
        mocks: standardMocks,
      });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('should render configuration form', async () => {
      renderWithProviders(<RazorpayConfiguration />, {
        mocks: standardMocks,
      });

      // Wait for loading to finish
      await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

      await waitFor(() => {
        expect(
          screen.getAllByText(/Razorpay Configuration/i)[0],
        ).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText(/rzp_test_.../i)).toHaveValue(
        'rzp_test_abc123',
      );
      expect(screen.getByRole('combobox')).toHaveValue('INR');
      expect(screen.getByLabelText(/Enable Razorpay/i)).toBeChecked();
      expect(screen.getByLabelText(/Test Mode/i)).toBeChecked();
    });
  });

  describe('Form Interaction', () => {
    it('should update fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, {
        mocks: standardMocks,
      });

      // Wait for loading to finish
      await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

      const keyIdInput = screen.getByPlaceholderText(/rzp_test_.../i);
      await user.clear(keyIdInput);
      await user.type(keyIdInput, 'rzp_live_newkey');

      expect(keyIdInput).toHaveValue('rzp_live_newkey');
    });

    it('should toggle visibility of secrets', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, {
        mocks: standardMocks,
      });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter your key secret/i),
        ).toHaveAttribute('type', 'password');
      });

      const toggleBtns = screen.getAllByRole('button', { name: /👁️‍🗨️/i }); // Button text is actually emoji
      await user.click(toggleBtns[0]);

      expect(
        screen.getByPlaceholderText(/Enter your key secret/i),
      ).toHaveAttribute('type', 'text');
    });
  });

  describe('Actions', () => {
    it('should handle save action', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, {
        mocks: standardMocks,
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Save Configuration/i }),
        ).toBeInTheDocument();
      });

      const saveBtn = screen.getByRole('button', {
        name: /Save Configuration/i,
      });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Save Configuration/i }),
        ).not.toBeDisabled();
      });
    });

    it('should handle test setup action', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, {
        mocks: standardMocks,
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Test with Dummy Payment/i }),
        ).toBeInTheDocument();
      });

      const testBtn = screen.getByRole('button', {
        name: /Test with Dummy Payment/i,
      });
      await user.click(testBtn);

      // Expect toast or success message (mocked)
    });
  });
});
