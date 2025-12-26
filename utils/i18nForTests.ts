import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Initialize i18n for tests with inline resources
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      'plugin-map': {
        injector: {
          paymentTitle: 'Payment Provider Transactions',
          paymentDescription:
            'Browse transactions made using the following payment provider',
          extensionPoint: 'Extension Point: {{id}} - Transaction Display Area',
          supportText:
            'This location supports component injection via the Plugin Map system. Developers can inject custom components here using the {{id}} extension point.',
          badge: 'Plugin Map Extension Point',
        },
      },
      razorpay: {
        transactions: {
          table: {
            id: 'Transaction ID',
            amount: 'Amount',
            status: 'Status',
            method: 'Payment Method',
            date: 'Date',
            actions: 'Actions',
          },
          loading: 'Loading Razorpay transactions...',
          errorLoading: 'Error loading transactions:',
          userTitle: 'Razorpay Transactions',
          userSubtitle: 'Your payment transactions processed through Razorpay',
          receiptButton: 'Receipt',
          viewButton: 'View',
          viewDetailsAriaLabel: 'View transaction details',
          downloadReceiptAriaLabel: 'Download receipt for transaction',
        },
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
