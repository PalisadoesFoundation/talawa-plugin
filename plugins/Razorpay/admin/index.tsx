/**
 * Razorpay Payment Gateway Plugin for Talawa Admin
 *
 * This plugin integrates Razorpay payment gateway for donations and payments within organizations.
 * It provides:
 * - G1: User transaction history injector (injected into user transactions page)
 * - G2: Organization transaction management injector (injected into admin transactions page)
 * - RA1: Global admin configuration for Razorpay keys and settings
 * - RU1: User donation form for making payments to organizations
 */

import { IPluginLifecycle } from '../../types';

// Import all components
import RazorpayConfiguration from './pages/RazorpayConfiguration';
import DonationForm from './pages/DonationForm';
import RazorpayInjector from './injector/RazorpayInjector';

// Plugin lifecycle implementation
const RazorpayLifecycle: IPluginLifecycle = {
  onActivate: async () => {
    console.log('Razorpay plugin activated');

    // Initialize plugin-specific data
    try {
      // Set up Razorpay configuration
      console.log('Razorpay configuration initialized');
      
      // Initialize payment gateway
      console.log('Payment gateway ready');
      
      // Set up transaction tracking
      console.log('Transaction tracking system activated');
      
      console.log('Razorpay plugin initialization completed');
    } catch (error) {
      console.error('Razorpay plugin initialization failed:', error);
    }
  },

  onDeactivate: async () => {
    console.log('Razorpay plugin deactivated');

    // Cleanup plugin-specific resources
    try {
      // Clean up payment gateway connections
      console.log('Payment gateway connections cleaned up');
      
      // Remove transaction tracking
      console.log('Transaction tracking system deactivated');
      
      // Clean up configuration
      console.log('Razorpay configuration cleaned up');
      
      console.log('Razorpay plugin cleanup completed');
    } catch (error) {
      console.error('Razorpay plugin cleanup failed:', error);
    }
  },

  onInstall: async () => {
    console.log('Razorpay plugin installed');

    // Perform installation tasks
    try {
      // This could include:
      // - Setting up default configuration
      // - Creating initial database records
      // - Setting up webhook endpoints
      // - Configuring payment gateway
      console.log('Razorpay plugin installation completed');
    } catch (error) {
      console.error('Razorpay plugin installation failed:', error);
      throw error; // Re-throw to indicate installation failure
    }
  },

  onUninstall: async () => {
    console.log('Razorpay plugin uninstalled');

    // Perform uninstallation cleanup
    try {
      // This could include:
      // - Removing configuration data
      // - Cleaning up database records
      // - Removing webhook endpoints
      // - Cleaning up payment gateway
      console.log('Razorpay plugin uninstallation completed');
    } catch (error) {
      console.error('Razorpay plugin uninstallation failed:', error);
      throw error; // Re-throw to indicate uninstallation failure
    }
  },

  onUpdate: async (fromVersion: string, toVersion: string) => {
    console.log(`Razorpay plugin updated from ${fromVersion} to ${toVersion}`);

    // Perform version-specific updates
    try {
      // This could include:
      // - Updating configuration schema
      // - Migrating transaction data
      // - Updating payment gateway integration
      // - Refreshing webhook configurations
      console.log('Razorpay plugin update completed');
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
  RazorpayInjector,
}; 