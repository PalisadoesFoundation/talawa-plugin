# Fix Razorpay Plugin Tests and CodeRabbit Issues

## Description
This PR finalizes the Razorpay unit tests and addresses comprehensive feedback from CodeRabbit reviews. It ensures robust type safety, correct test isolation, and clean code practices across the Razorpay plugin.

## Key Changes

### CodeRabbit Review Fixes (30 Issues Resolved)
*   **Type Safety & Logic:**
    *   Tightened `razorpayInstance` type in `razorpayService.ts`.
    *   Added null checks for `ctx.user` and strict authorization checks.
    *   Improved nullish coalescing in test helpers.
*   **Test Improvements:**
    *   **Isolation:** Moved `beforeEach` blocks to correct scopes in `graphql.mutations.test.ts`.
    *   **Correctness:** Fixed `getRazorpayConfigResolver` tests to use super-admin context.
    *   **Lifecycle:** Added error handling verification to `onUnload` and improved sequence matching in `lifecycle.test.ts`.
    *   **Stats:** Updated transaction stats test mocks to match actual resolver field names (`totalTransactions` etc.).
    *   **Mocking:** Restored `then` method to `mockDb` to support `await query` syntax, with documentation.
    *   **Cleanup:** Removed unused imports (`zod`, `createMock*`) and sensitive logging.
*   **Frontend updates:**
    *   Updated `DonationForm.tsx` to use `useQuery(GET_CURRENT_USER)` instead of `localStorage`.
    *   Added strict loading/error states for user data prefilling.

### CI/CD
*   Re-enabled "Check for localStorage Usage" in `.github/workflows/pull-request.yml`.
*   Standardized `pnpm exec tsx` usage.

## Verification
*   **Unit Tests:** All Razorpay tests are passing (Verify with `pnpm test -- plugins/razorpay`).
*   **Manual Testing:** Validated donation form user prefill logic.
