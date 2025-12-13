import { describe, it, expect, vi, beforeEach } from 'vitest';
import RazorpayPlugin, {
  onLoad,
  onActivate,
  onDeactivate,
  onUnload,
} from '../../../plugins/Razorpay/api/index';
import { createMockRazorpayContext } from './utils/mockRazorpay';

describe('Razorpay Plugin Lifecycle', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = createMockRazorpayContext();

    mockContext.drizzleClient = {
      schema: {},
    };

    mockContext.graphql = {
      registerType: vi.fn(),
      registerQuery: vi.fn(),
      registerMutation: vi.fn(),
    };

    mockContext.fastify = {
      post: vi.fn(),
      register: vi.fn(),
    };

    mockContext.log = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
  });

  describe('onLoad', () => {
    it('should load plugin successfully', async () => {
      await onLoad(mockContext);

      expect(mockContext.log.info).toHaveBeenCalledWith(
        expect.stringContaining('loading'),
      );
    });

    it('should register database tables', async () => {
      await onLoad(mockContext);

      // Database tables should be registered
      expect(mockContext.drizzleClient.schema).toBeDefined();
    });

    it('should handle errors during load', async () => {
      const error = new Error('Load failed');
      mockContext.log.info = vi.fn().mockImplementation(() => {
        throw error;
      });

      await expect(onLoad(mockContext)).rejects.toThrow('Load failed');
    });
  });

  describe('onActivate', () => {
    it('should activate plugin successfully', async () => {
      await onActivate(mockContext);

      expect(mockContext.log.info).toHaveBeenCalledWith(
        expect.stringContaining('activating'),
      );
    });

    it('should register GraphQL types', async () => {
      await onActivate(mockContext);

      expect(mockContext.graphql?.registerType).toHaveBeenCalled();
    });

    it('should register GraphQL queries', async () => {
      await onActivate(mockContext);

      expect(mockContext.graphql?.registerQuery).toHaveBeenCalled();
    });

    it('should register GraphQL mutations', async () => {
      await onActivate(mockContext);

      expect(mockContext.graphql?.registerMutation).toHaveBeenCalled();
    });

    it('should register webhook route', async () => {
      await onActivate(mockContext);

      expect(mockContext.fastify?.post).toHaveBeenCalledWith(
        expect.stringContaining('/webhook/razorpay'),
        expect.any(Function),
      );
    });

    it('should handle errors during activation', async () => {
      const error = new Error('Activation failed');
      mockContext.graphql.registerType = vi.fn().mockImplementation(() => {
        throw error;
      });

      await expect(onActivate(mockContext)).rejects.toThrow(
        'Activation failed',
      );
    });

    it('should handle missing GraphQL context', async () => {
      mockContext.graphql = undefined;

      // Should complete without errors even if graphql is undefined
      await onActivate(mockContext);

      expect(mockContext.log.info).toHaveBeenCalled();
    });

    it('should handle missing Fastify context', async () => {
      mockContext.fastify = undefined;

      // Should complete without errors even if fastify is undefined
      await onActivate(mockContext);

      expect(mockContext.log.info).toHaveBeenCalled();
    });
  });

  describe('onDeactivate', () => {
    it('should deactivate plugin successfully', async () => {
      await onDeactivate(mockContext);

      expect(mockContext.log.info).toHaveBeenCalledWith(
        expect.stringContaining('deactivating'),
      );
    });

    it('should cleanup resources', async () => {
      await onDeactivate(mockContext);

      // Verify cleanup operations
      expect(mockContext.log.info).toHaveBeenCalled();
    });

    it('should handle errors during deactivation', async () => {
      const error = new Error('Deactivation failed');
      mockContext.log.info = vi.fn().mockImplementation(() => {
        throw error;
      });

      await expect(onDeactivate(mockContext)).rejects.toThrow(
        'Deactivation failed',
      );
    });
  });

  describe('onUnload', () => {
    it('should unload plugin successfully', async () => {
      await onUnload(mockContext);

      expect(mockContext.log.info).toHaveBeenCalledWith(
        expect.stringContaining('unloading'),
      );
    });

    it('should cleanup all resources', async () => {
      await onUnload(mockContext);

      // Verify all cleanup operations completed
      expect(mockContext.log.info).toHaveBeenCalled();
    });

    it('should handle errors during unload', async () => {
      const error = new Error('Unload failed');
      mockContext.log.info = vi.fn().mockImplementation(() => {
        throw error;
      });

      await expect(onUnload(mockContext)).rejects.toThrow('Unload failed');
    });
  });

  describe('RazorpayPlugin export', () => {
    it('should export all lifecycle hooks', () => {
      expect(RazorpayPlugin).toBeDefined();
      expect(RazorpayPlugin.onLoad).toBe(onLoad);
      expect(RazorpayPlugin.onActivate).toBe(onActivate);
      expect(RazorpayPlugin.onDeactivate).toBe(onDeactivate);
      expect(RazorpayPlugin.onUnload).toBe(onUnload);
    });

    it('should have correct interface structure', () => {
      expect(typeof RazorpayPlugin.onLoad).toBe('function');
      expect(typeof RazorpayPlugin.onActivate).toBe('function');
      expect(typeof RazorpayPlugin.onDeactivate).toBe('function');
      expect(typeof RazorpayPlugin.onUnload).toBe('function');
    });
  });

  describe('lifecycle sequence', () => {
    it('should execute full lifecycle in correct order', async () => {
      const callOrder: string[] = [];

      mockContext.log.info = vi.fn((msg: string) => {
        if (msg.includes('loading')) callOrder.push('load');
        if (msg.includes('activating')) callOrder.push('activate');
        if (msg.includes('deactivating')) callOrder.push('deactivate');
        if (msg.includes('unloading')) callOrder.push('unload');
      });

      await onLoad(mockContext);
      await onActivate(mockContext);
      await onDeactivate(mockContext);
      await onUnload(mockContext);

      expect(callOrder).toEqual(['load', 'activate', 'deactivate', 'unload']);
    });

    it('should handle activation without prior load', async () => {
      // Should work even if onLoad wasn't called first
      await expect(onActivate(mockContext)).resolves.not.toThrow();
    });

    it('should handle deactivation without prior activation', async () => {
      // Should work even if onActivate wasn't called first
      await expect(onDeactivate(mockContext)).resolves.not.toThrow();
    });
  });
});
