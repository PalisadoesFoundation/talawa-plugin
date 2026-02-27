import { MockedResponse } from '@apollo/client/testing';
import {
  createMockRazorpayConfig,
  createRazorpayConfigQueryMock,
  createUpdateConfigMutationMock,
  createTestSetupMutationMock,
  UPDATE_RAZORPAY_CONFIG,
  TEST_RAZORPAY_SETUP,
  GET_RAZORPAY_CONFIG,
} from './testUtils';

export const mockConfig = createMockRazorpayConfig();

export const standardMocks: MockedResponse[] = [
  createRazorpayConfigQueryMock(mockConfig),
  createUpdateConfigMutationMock(mockConfig),
  createTestSetupMutationMock(true),
];

/** Mock that returns a GraphQL error when loading config */
export const configLoadErrorMock: MockedResponse = {
  request: { query: GET_RAZORPAY_CONFIG },
  error: new Error('Network Error'),
};

/** Save mutation mock that throws a GraphQL error */
export const saveConfigErrorMock = (
  config: typeof mockConfig,
): MockedResponse => ({
  request: {
    query: UPDATE_RAZORPAY_CONFIG,
    variables: {
      input: {
        keyId: config.keyId,
        keySecret: config.keySecret,
        webhookSecret: config.webhookSecret,
        isEnabled: config.isEnabled,
        testMode: config.testMode,
        currency: config.currency,
        description: config.description,
      },
    },
  },
  error: new Error('Save failed: server error'),
});

/** Test setup mutation mock that returns success: false */
export const testSetupFailureMock: MockedResponse = {
  request: { query: TEST_RAZORPAY_SETUP },
  result: {
    data: {
      razorpay_testRazorpaySetup: {
        success: false,
        message: 'Setup test failed: Invalid credentials',
      },
    },
  },
};

/** Test setup mutation mock that throws a network error */
export const testSetupErrorMock: MockedResponse = {
  request: { query: TEST_RAZORPAY_SETUP },
  error: new Error('Network failure during test'),
};

/** Config with missing keys for testing validation */
export const incompleteConfig = createMockRazorpayConfig({
  keyId: '',
  keySecret: '',
  webhookSecret: '',
});

/** Config with invalid key format */
export const invalidKeyConfig = createMockRazorpayConfig({
  keyId: 'invalid_key_123',
});

export const incompleteConfigMock: MockedResponse = {
  request: { query: GET_RAZORPAY_CONFIG },
  result: {
    data: {
      razorpay_getRazorpayConfig: incompleteConfig,
    },
  },
};

export const invalidKeyConfigMock: MockedResponse = {
  request: { query: GET_RAZORPAY_CONFIG },
  result: {
    data: {
      razorpay_getRazorpayConfig: invalidKeyConfig,
    },
  },
};
