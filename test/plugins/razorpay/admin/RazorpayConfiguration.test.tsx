/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedResponse } from '@apollo/client/testing';
import RazorpayConfiguration from '../../../../plugins/razorpay/admin/pages/RazorpayConfiguration';
import { renderWithProviders, UPDATE_RAZORPAY_CONFIG } from './testUtils';
import { toast } from 'react-toastify';
import {
  mockConfig,
  standardMocks,
  configLoadErrorMock,
  saveConfigErrorMock,
  testSetupFailureMock,
  testSetupErrorMock,
  incompleteConfigMock,
  invalidKeyConfigMock,
} from './RazorpayConfiguration.mock';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('RazorpayConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders configuration form correctly', async () => {
      renderWithProviders(<RazorpayConfiguration />, { mocks: standardMocks });

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /Razorpay Configuration/i }),
        ).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('Enter Razorpay Key ID')).toHaveValue(
        mockConfig.keyId,
      );
      expect(screen.getByPlaceholderText('Enter your key secret')).toHaveValue(
        mockConfig.keySecret,
      );
      expect(screen.getByText('Enabled')).toBeInTheDocument();
    });

    it('shows error alert when config load fails', async () => {
      renderWithProviders(<RazorpayConfiguration />, {
        mocks: [configLoadErrorMock],
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load Razorpay configuration/i),
        ).toBeInTheDocument();
      });
    });

    it('toggles key secret visibility', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, { mocks: standardMocks });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Enter your key secret'),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByPlaceholderText('Enter your key secret'),
      ).toHaveAttribute('type', 'password');

      const toggleBtns = screen.getAllByRole('button', {
        name: /Show secret/i,
      });
      await user.click(toggleBtns[0]);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Enter your key secret'),
        ).toHaveAttribute('type', 'text');
      });

      const hideBtns = screen.getAllByRole('button', { name: /Hide secret/i });
      await user.click(hideBtns[0]);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Enter your key secret'),
        ).toHaveAttribute('type', 'password');
      });
    });
  });

  describe('Save Actions', () => {
    it('saves configuration successfully', async () => {
      const user = userEvent.setup();
      const saveMutationMock = vi.fn(() => ({
        data: {
          razorpay_updateRazorpayConfig: {
            ...mockConfig,
            __typename: 'RazorpayConfig',
          },
        },
      }));

      const mocksWithSpy: MockedResponse[] = [
        standardMocks[0],
        {
          request: {
            query: UPDATE_RAZORPAY_CONFIG,
            variables: {
              input: {
                keyId: mockConfig.keyId,
                keySecret: mockConfig.keySecret,
                webhookSecret: mockConfig.webhookSecret,
                isEnabled: true,
                testMode: true,
                currency: 'INR',
                description: 'Donation to organization',
              },
            },
          },
          result: saveMutationMock,
        },
        standardMocks[2],
      ];

      renderWithProviders(<RazorpayConfiguration />, { mocks: mocksWithSpy });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Save Configuration/i }),
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: /Save Configuration/i }),
      );

      await waitFor(() => {
        expect(saveMutationMock).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Razorpay configuration saved successfully!',
        );
      });
    });

    it('shows error toast when save fails (catch block)', async () => {
      const user = userEvent.setup();
      const mocks: MockedResponse[] = [
        standardMocks[0],
        saveConfigErrorMock(mockConfig),
        standardMocks[2],
      ];

      renderWithProviders(<RazorpayConfiguration />, { mocks });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Save Configuration/i }),
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: /Save Configuration/i }),
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to save Razorpay configuration'),
        );
      });
    });

    it('handles invalid form submission (checkValidity false)', async () => {
      const user = userEvent.setup();
      const emptyConfig = {
        ...mockConfig,
        keyId: '',
        keySecret: '',
        webhookSecret: '',
      };
      const mocks: MockedResponse[] = [
        {
          request: { query: standardMocks[0].request.query },
          result: {
            data: {
              razorpay_getRazorpayConfig: {
                ...emptyConfig,
                __typename: 'RazorpayConfig',
              },
            },
          },
        },
        standardMocks[1],
        standardMocks[2],
      ];

      renderWithProviders(<RazorpayConfiguration />, { mocks });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Save Configuration/i }),
        ).toBeInTheDocument();
      });

      // Clear the keyId field to make form invalid
      const keyIdInput = screen.getByPlaceholderText('Enter Razorpay Key ID');
      await user.clear(keyIdInput);

      // Submit the form - checkValidity will return false for required empty fields
      const form = screen
        .getByRole('button', { name: /Save Configuration/i })
        .closest('form')!;
      fireEvent.submit(form);

      // The form should show validation feedback (validated state set to true)
      await waitFor(() => {
        expect(keyIdInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Test Setup Actions', () => {
    it('runs test setup successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, { mocks: standardMocks });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Test with Dummy Payment/i }),
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: /Test with Dummy Payment/i }),
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('Setup test successful'),
        );
      });
    });

    it('shows error when test setup config is missing keys', async () => {
      const _user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, {
        mocks: [incompleteConfigMock, standardMocks[1], standardMocks[2]],
      });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Enter Razorpay Key ID'),
        ).toBeInTheDocument();
      });

      // The test button should be disabled because config is incomplete
      const testBtn = screen.getByRole('button', {
        name: /Test with Dummy Payment/i,
      });
      expect(testBtn).toBeDisabled();
    });

    it('shows error for invalid key format (not starting with rzp_)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, {
        mocks: [invalidKeyConfigMock, standardMocks[1], testSetupFailureMock],
      });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Enter Razorpay Key ID'),
        ).toHaveValue('invalid_key_123');
      });

      const testBtn = screen.getByRole('button', {
        name: /Test with Dummy Payment/i,
      });
      await user.click(testBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Invalid Key ID format'),
        );
      });
    });

    it('shows error when test setup returns failure', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, {
        mocks: [standardMocks[0], standardMocks[1], testSetupFailureMock],
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Test with Dummy Payment/i }),
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: /Test with Dummy Payment/i }),
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Setup test failed'),
        );
      });
    });

    it('shows error when test setup throws a network error (catch block)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, {
        mocks: [standardMocks[0], standardMocks[1], testSetupErrorMock],
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Test with Dummy Payment/i }),
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: /Test with Dummy Payment/i }),
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Network failure during test'),
        );
      });
    });
  });

  describe('Field Interactions', () => {
    it('updates key ID field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, { mocks: standardMocks });

      const keyIdInput = (await screen.findByPlaceholderText(
        'Enter Razorpay Key ID',
      )) as HTMLInputElement;
      await user.clear(keyIdInput);
      await user.type(keyIdInput, 'new_key_id');
      expect(keyIdInput).toHaveValue('new_key_id');
    });

    it('updates key secret field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, { mocks: standardMocks });

      const secretInput = (await screen.findByPlaceholderText(
        'Enter your key secret',
      )) as HTMLInputElement;
      await user.clear(secretInput);
      await user.type(secretInput, 'new_secret');
      expect(secretInput).toHaveValue('new_secret');
    });

    it('updates webhook secret field and toggles its visibility', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, { mocks: standardMocks });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Enter your webhook secret'),
        ).toBeInTheDocument();
      });

      const webhookInput = screen.getByPlaceholderText(
        'Enter your webhook secret',
      ) as HTMLInputElement;
      await user.clear(webhookInput);
      await user.type(webhookInput, 'new_webhook_secret');
      expect(webhookInput).toHaveValue('new_webhook_secret');

      // Toggle visibility via the second show/hide button (webhook's)
      const toggleBtns = screen.getAllByRole('button', {
        name: /Show secret/i,
      });
      if (toggleBtns.length > 1) {
        await user.click(toggleBtns[1]);
        await waitFor(() => {
          expect(webhookInput).toHaveAttribute('type', 'text');
        });
      }
    });

    it('updates currency field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, { mocks: standardMocks });

      const currencySelect = (await screen.findByRole('combobox', {
        name: /Default Currency/i,
      })) as HTMLSelectElement;
      await user.selectOptions(currencySelect, 'USD');
      expect(currencySelect).toHaveValue('USD');
    });

    it('updates description field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, { mocks: standardMocks });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(
            'configuration.form.descriptionPlaceholder',
          ),
        ).toBeInTheDocument();
      });

      const descInput = screen.getByPlaceholderText(
        'configuration.form.descriptionPlaceholder',
      ) as HTMLInputElement;
      await user.clear(descInput);
      await user.type(descInput, 'Custom donation');
      expect(descInput).toHaveValue('Custom donation');
    });

    it('toggles test mode switch', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, { mocks: standardMocks });

      const testModeSwitch = (await screen.findByRole('checkbox', {
        name: /Test Mode/i,
      })) as HTMLInputElement;
      const initial = testModeSwitch.checked;
      await user.click(testModeSwitch);
      expect(testModeSwitch.checked).not.toBe(initial);
    });

    it('toggles enabled switch', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RazorpayConfiguration />, { mocks: standardMocks });

      const enabledCheckbox = (await screen.findByRole('checkbox', {
        name: /Enable Razorpay/i,
      })) as HTMLInputElement;
      const initial = enabledCheckbox.checked;
      await user.click(enabledCheckbox);
      expect(enabledCheckbox.checked).not.toBe(initial);
    });
  });

  describe('Loading & Incomplete Config', () => {
    it('shows loading state while fetching config', () => {
      renderWithProviders(<RazorpayConfiguration />, { mocks: standardMocks });
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows incomplete config alert when fields are missing', async () => {
      renderWithProviders(<RazorpayConfiguration />, {
        mocks: [incompleteConfigMock, standardMocks[1], standardMocks[2]],
      });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Enter Razorpay Key ID'),
        ).toBeInTheDocument();
      });

      // The "complete fields" alert should be visible
      expect(
        screen.getByText(/configuration.help.completeFields/i),
      ).toBeInTheDocument();
    });
  });
});
