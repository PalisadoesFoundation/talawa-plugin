import { MockedResponse } from '@apollo/client/testing';
import {
  createMockUser,
  createMockRazorpayConfig,
  createMockPaymentOrder,
  createUserQueryMock,
  GET_RAZORPAY_CONFIG_PUBLIC,
  CREATE_PAYMENT_ORDER,
  GET_ORGANIZATION_INFO,
} from './testUtils';

export const GET_RAZORPAY_CONFIG = GET_RAZORPAY_CONFIG_PUBLIC;

export interface Organization {
  id: string;
  name: string;
  description: string;
  avatarURL: string;
  [key: string]: unknown;
}

export interface PaymentOrder {
  id: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  [key: string]: unknown;
}

export const createLocalOrganizationQueryMock = (
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

export const mockUser = createMockUser();
export const mockOrg: Organization = {
  id: 'org-123',
  name: 'Test Organization',
  description: 'A test organization for donations',
  avatarURL: 'https://example.com/avatar.png',
};
export const mockConfig = createMockRazorpayConfig();
export const mockOrder = createMockPaymentOrder();

export const configMock = {
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

export const createLocalPaymentOrderMutationMock = (order: PaymentOrder) => ({
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
  result: {
    data: {
      razorpay_createPaymentOrder: order,
    },
  },
});

export const standardMocks: MockedResponse[] = [
  createUserQueryMock(mockUser),
  createLocalOrganizationQueryMock('org-123', mockOrg),
  configMock,
  createLocalPaymentOrderMutationMock(mockOrder),
];
