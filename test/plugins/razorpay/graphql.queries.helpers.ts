import { expect } from 'vitest';
import type { GraphQLContext } from '~/src/graphql/context';

// Helper to sanitize transaction for GraphQL response expectation
export const expectTransaction = (t: any) => ({
  id: t.id,
  paymentId: t.paymentId,
  amount: t.amount,
  currency: t.currency || 'INR',
  status: t.status || 'pending',
  // Optional fields from DB are null, Resolver passes them through.
  // Joined fields are undefined if missing in DB mock.
  donorName: t.donorName,
  donorEmail: t.donorEmail,
  method: t.method,
  bank: t.bank,
  wallet: t.wallet,
  vpa: t.vpa,
  email: t.email,
  contact: t.contact,
  fee: t.fee,
  tax: t.tax,
  errorCode: t.errorCode,
  errorDescription: t.errorDescription,
  refundStatus: t.refundStatus,
  capturedAt: t.capturedAt,
  createdAt: t.createdAt || expect.any(Date),
  updatedAt: t.updatedAt || expect.any(Date),
});

// Helper for config
export const expectConfig = (c: any) => ({
  keyId: c.keyId || undefined,
  keySecret: c.keySecret || undefined,
  webhookSecret: c.webhookSecret || undefined,
  isEnabled: c.isEnabled,
  testMode: c.testMode,
  currency: c.currency || 'INR',
  description: c.description || 'Donation to organization',
});
