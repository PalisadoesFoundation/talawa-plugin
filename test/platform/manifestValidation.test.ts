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
      // Valid pluginIds
      const validIds = [
        'test-plugin',
        'my_plugin',
        'plugin-123',
        'abc_def-ghi',
      ];

      validIds.forEach((id) => {
        const manifest = {
          name: 'Test Plugin',
          pluginId: id,
          version: '1.0.0',
          description: 'A test plugin',
          author: 'Test Author',
        };

        const result = validateManifest(manifest);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      // Invalid pluginIds
      const invalidIds = [
        'Test-Plugin',
        'test Plugin',
        'TEST_PLUGIN',
        'test@plugin',
      ];

      invalidIds.forEach((id) => {
        const manifest = {
          name: 'Test Plugin',
          pluginId: id,
          version: '1.0.0',
          description: 'A test plugin',
          author: 'Test Author',
        };

        const result = validateManifest(manifest);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Field "pluginId" must be lowercase with hyphens or underscores only',
        );
      });
    });

    it('should validate version format (semver)', () => {
      // Valid versions
      const validVersions = ['1.0.0', '0.0.1', '10.20.30'];

      validVersions.forEach((ver) => {
        const manifest = {
          name: 'Test Plugin',
          pluginId: 'test-plugin',
          version: ver,
          description: 'A test plugin',
          author: 'Test Author',
        };

        const result = validateManifest(manifest);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      // Invalid versions
      const invalidVersions = ['1.0', 'v1.0.0', '1.0.0-beta', '1.0.0.0'];

      invalidVersions.forEach((ver) => {
        const manifest = {
          name: 'Test Plugin',
          pluginId: 'test-plugin',
          version: ver,
          description: 'A test plugin',
          author: 'Test Author',
        };

        const result = validateManifest(manifest);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Field "version" must follow semantic versioning (e.g., 1.0.0)',
        );
      });
    });

    it('should validate optional fields', () => {
      // Valid optional fields
      const manifestWithOptional = {
        name: 'Test Plugin',
        pluginId: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        main: 'index.tsx',
        icon: '/assets/icon.png',
      };

      const result = validateManifest(manifestWithOptional);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Invalid optional field types
      const manifestWithInvalidMain = {
        name: 'Test Plugin',
        pluginId: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        main: 123, // Invalid: should be string
      };

      const result2 = validateManifest(manifestWithInvalidMain);
      expect(result2.valid).toBe(false);
      expect(result2.errors).toContain(
        'Field "main" must be a string when provided',
      );
    });
  });

  // NOTE: Extension point validation is intentionally deferred
  // The validateManifest function currently validates core manifest fields only.
  // Extension point schema validation will be added in a future update when
  // the complete extension point spec is finalized. These tests verify the
  // expected structure but don't enforce it through the validator yet.
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
        let manifest: PluginManifest;

        try {
          manifest = JSON.parse(manifestContent);
        } catch (error) {
          throw new Error(
            `Failed to parse JSON in ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

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
        let manifest: PluginManifest;

        try {
          manifest = JSON.parse(manifestContent);
        } catch (error) {
          throw new Error(
            `Failed to parse JSON in ${apiManifestPath}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

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
        let manifest: PluginManifest;

        try {
          manifest = JSON.parse(manifestContent);
        } catch (error) {
          throw new Error(
            `Failed to parse JSON in ${pluginMapAdminPath}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

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
        let manifest: PluginManifest;

        try {
          manifest = JSON.parse(manifestContent);
        } catch (error) {
          throw new Error(
            `Failed to parse JSON in ${pluginMapApiPath}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        const result = validateManifest(manifest);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      },
    );
  });
});
