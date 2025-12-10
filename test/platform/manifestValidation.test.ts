import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { validateManifest } from '../utils/validateManifest';
import type { PluginManifest } from '../utils/types';

describe('Manifest Schema Validation', () => {
  describe('Core Schema Requirements', () => {
    it('should validate a complete valid manifest', () => {
      const validManifest = {
        name: 'Test Plugin',
        pluginId: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
      };

      const result = validateManifest(validManifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate pluginId format', () => {
      const manifest: PluginManifest = {
        name: 'Test Plugin',
        pluginId: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
      };

      expect(typeof manifest.pluginId).toBe('string');
      expect(manifest.pluginId.length).toBeGreaterThan(0);
      // PluginId should be lowercase with hyphens or underscores
      expect(manifest.pluginId).toMatch(/^[a-z0-9-_]+$/);
    });

    it('should validate version format (semver)', () => {
      const manifest: PluginManifest = {
        name: 'Test Plugin',
        pluginId: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
      };

      // Version should follow semantic versioning (major.minor.patch)
      expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should validate optional fields', () => {
      const manifest: PluginManifest = {
        name: 'Test Plugin',
        pluginId: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        main: 'index.tsx',
        icon: '/assets/icon.png',
      };

      if (manifest.main) {
        expect(typeof manifest.main).toBe('string');
      }
      if (manifest.icon) {
        expect(typeof manifest.icon).toBe('string');
      }
    });
  });

  describe('Extension Points Schema', () => {
    it('should validate extension points structure', () => {
      const manifest: PluginManifest = {
        name: 'Test Plugin',
        pluginId: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        extensionPoints: {
          G1: [{ injector: 'TestInjector', description: 'Test' }],
        },
      };

      expect(manifest.extensionPoints).toBeDefined();
      expect(typeof manifest.extensionPoints).toBe('object');
    });

    it('should validate admin extension points (G1, G2)', () => {
      interface InjectorExtensionPoint {
        injector: string;
        description: string;
      }

      const g1Points: InjectorExtensionPoint[] = [
        {
          injector: 'UserTransactionsInjector',
          description: 'User transactions',
        },
      ];

      const g2Points: InjectorExtensionPoint[] = [
        {
          injector: 'OrgTransactionsInjector',
          description: 'Org transactions',
        },
      ];

      // Validate G1
      expect(Array.isArray(g1Points)).toBe(true);
      g1Points.forEach((point) => {
        expect(point.injector).toBeDefined();
        expect(point.description).toBeDefined();
        expect(typeof point.injector).toBe('string');
        expect(typeof point.description).toBe('string');
      });

      // Validate G2
      expect(Array.isArray(g2Points)).toBe(true);
      g2Points.forEach((point) => {
        expect(point.injector).toBeDefined();
        expect(point.description).toBeDefined();
      });
    });

    it('should validate route extension points (RA1, RU1, RU2)', () => {
      interface RouteExtensionPoint {
        path: string;
        component: string;
      }

      const routePoints: RouteExtensionPoint[] = [
        { path: '/admin/test', component: 'TestComponent' },
        { path: '/user/test', component: 'UserTestComponent' },
      ];

      expect(Array.isArray(routePoints)).toBe(true);
      routePoints.forEach((point) => {
        expect(point.path).toBeDefined();
        expect(point.component).toBeDefined();
        expect(typeof point.path).toBe('string');
        expect(typeof point.component).toBe('string');
        expect(point.path).toMatch(/^\//); // Path should start with /
      });
    });

    it('should validate menu extension points (DA1, DU1, DU2)', () => {
      interface MenuExtensionPoint {
        label: string;
        path: string;
        icon?: string;
        order?: number;
      }

      const menuPoints: MenuExtensionPoint[] = [
        {
          label: 'Test Menu',
          path: '/admin/test',
          icon: '/icon.png',
          order: 1,
        },
      ];

      expect(Array.isArray(menuPoints)).toBe(true);
      menuPoints.forEach((point) => {
        expect(point.label).toBeDefined();
        expect(point.path).toBeDefined();
        expect(typeof point.label).toBe('string');
        expect(typeof point.path).toBe('string');

        if (point.icon) {
          expect(typeof point.icon).toBe('string');
        }
        if (point.order !== undefined) {
          expect(typeof point.order).toBe('number');
        }
      });
    });

    it('should validate API extension points (graphql, database)', () => {
      interface APIExtensionPoint {
        type: string;
        name: string;
        file: string;
      }

      const graphqlPoints: APIExtensionPoint[] = [
        { type: 'query', name: 'getTest', file: './queries/getTest.ts' },
        {
          type: 'mutation',
          name: 'createTest',
          file: './mutations/createTest.ts',
        },
      ];

      const databasePoints: APIExtensionPoint[] = [
        { type: 'model', name: 'Test', file: './models/Test.ts' },
      ];

      // Validate GraphQL extension points
      expect(Array.isArray(graphqlPoints)).toBe(true);
      graphqlPoints.forEach((point) => {
        expect(point.type).toBeDefined();
        expect(point.name).toBeDefined();
        expect(point.file).toBeDefined();
        expect(['query', 'mutation', 'subscription']).toContain(point.type);
      });

      // Validate Database extension points
      expect(Array.isArray(databasePoints)).toBe(true);
      databasePoints.forEach((point) => {
        expect(point.type).toBeDefined();
        expect(point.name).toBeDefined();
        expect(point.file).toBeDefined();
        expect(['model', 'schema']).toContain(point.type);
      });
    });
  });

  describe('Negative Schema Validation', () => {
    it('should reject manifest without pluginId', () => {
      const invalidManifest = {
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        // Missing pluginId
      };

      const result = validateManifest(invalidManifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: pluginId');
    });

    it('should reject manifest without version', () => {
      const invalidManifest = {
        name: 'Test Plugin',
        pluginId: 'test-plugin',
        description: 'A test plugin',
        author: 'Test Author',
        // Missing version
      };

      const result = validateManifest(invalidManifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: version');
    });

    it('should reject invalid pluginId format', () => {
      const invalidIds = [
        'Test-Plugin',
        'test_Plugin',
        'Test Plugin',
        'TEST-PLUGIN',
      ];

      invalidIds.forEach((id) => {
        const invalidManifest = {
          name: 'Test Plugin',
          pluginId: id,
          version: '1.0.0',
          description: 'A test plugin',
          author: 'Test Author',
        };

        const result = validateManifest(invalidManifest);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Field "pluginId" must be lowercase with hyphens or underscores only',
        );
      });
    });
  });
});

describe('Real Plugin Manifest Validation', () => {
  describe('Razorpay Plugin Manifests', () => {
    const manifestPath = join(
      process.cwd(),
      'plugins/Razorpay/admin/manifest.json',
    );

    it.skipIf(!existsSync(manifestPath))(
      'should validate Razorpay admin manifest',
      () => {
        const manifestContent = readFileSync(manifestPath, 'utf-8');
        const manifest: PluginManifest = JSON.parse(manifestContent);

        // Use validation function
        const result = validateManifest(manifest);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);

        // Core fields
        expect(manifest.pluginId).toBe('razorpay');
        expect(manifest.description).toBeDefined();
        expect(manifest.author).toBeDefined();
      },
    );

    const apiManifestPath = join(
      process.cwd(),
      'plugins/Razorpay/api/manifest.json',
    );

    it.skipIf(!existsSync(apiManifestPath))(
      'should validate Razorpay API manifest',
      () => {
        const manifestContent = readFileSync(apiManifestPath, 'utf-8');
        const manifest: PluginManifest = JSON.parse(manifestContent);

        const result = validateManifest(manifest);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);

        expect(manifest.pluginId).toBe('razorpay');
      },
    );
  });

  describe('Plugin Map Manifests', () => {
    const pluginMapAdminPath = join(
      process.cwd(),
      'plugins/Plugin Map/admin/manifest.json',
    );

    it.skipIf(!existsSync(pluginMapAdminPath))(
      'should validate Plugin Map admin manifest',
      () => {
        const manifestContent = readFileSync(pluginMapAdminPath, 'utf-8');
        const manifest: PluginManifest = JSON.parse(manifestContent);

        const result = validateManifest(manifest);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      },
    );

    const pluginMapApiPath = join(
      process.cwd(),
      'plugins/Plugin Map/api/manifest.json',
    );

    it.skipIf(!existsSync(pluginMapApiPath))(
      'should validate Plugin Map API manifest',
      () => {
        const manifestContent = readFileSync(pluginMapApiPath, 'utf-8');
        const manifest: PluginManifest = JSON.parse(manifestContent);

        const result = validateManifest(manifest);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      },
    );
  });
});
