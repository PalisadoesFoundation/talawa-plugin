/**
 * Razorpay Payment Gateway Plugin for Talawa Admin
 *
 * This plugin integrates Razorpay payment gateway for donations and payments within organizations.
 * It provides:
 * - G1: User transaction history injector (injected into user transactions page)
 * - G2: Organization transaction management injector (injected into admin transactions page)
 * - RA1: Global admin configuration for Razorpay keys and settings
 * - RU1: User donation form for making payments to organizations
 * - RU2: Global user transactions page showing all transactions across organizations
 */

import { IPluginLifecycle } from '../../types';

// Import all components
import RazorpayConfiguration from './pages/RazorpayConfiguration';
import DonationForm from './pages/DonationForm';
import UserTransactions from './pages/UserTransactions';
import RazorpayUserTransactionsInjector from './injector/RazorpayUserTransactionsInjector';
import RazorpayOrganizationTransactionsInjector from './injector/RazorpayOrganizationTransactionsInjector';

// Plugin lifecycle implementation
const RazorpayLifecycle: IPluginLifecycle = {
  onActivate: async () => {
    // Initialize plugin-specific data
    // Set up Razorpay configuration
    // Initialize payment gateway
    // Set up transaction tracking
    // Razorpay plugin initialization completed
  },

  onDeactivate: async () => {
    // Cleanup plugin-specific resources
    try {
      // Clean up payment gateway connections
      // Remove transaction tracking
      // Clean up configuration
      // Razorpay plugin cleanup completed
    } catch (error) {
      console.error('Razorpay plugin cleanup failed:', error);
    }
  },

  onInstall: async () => {
    // Perform installation tasks
    try {
      // This could include:
      // - Setting up default configuration
      // - Creating initial database records
      // - Setting up webhook endpoints
      // - Configuring payment gateway
      // Razorpay plugin installation completed
    } catch (error) {
      console.error('Razorpay plugin installation failed:', error);
      throw error; // Re-throw to indicate installation failure
    }
  },

  onUninstall: async () => {
    // Perform uninstallation cleanup
    try {
      // This could include:
      // - Removing configuration data
      // - Cleaning up database records
      // - Removing webhook endpoints
      // - Cleaning up payment gateway
      // Razorpay plugin uninstallation completed
    } catch (error) {
      console.error('Razorpay plugin uninstallation failed:', error);
      throw error; // Re-throw to indicate uninstallation failure
    }
  },

  onUpdate: async () => {
    // Perform version-specific updates
    try {
      // This could include:
      // - Updating configuration schema
      // - Migrating transaction data
      // - Updating payment gateway integration
      // - Refreshing webhook configurations
      // Razorpay plugin update completed
    } catch (error) {
      console.error('Razorpay plugin update failed:', error);
      throw error; // Re-throw to indicate update failure
    }
  },
};

// Export the lifecycle as default
export default RazorpayLifecycle;

// Export all components
export {
  RazorpayConfiguration,
  DonationForm,
  UserTransactions,
  RazorpayUserTransactionsInjector,
  RazorpayOrganizationTransactionsInjector,
};
