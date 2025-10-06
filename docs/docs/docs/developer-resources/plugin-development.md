---
id: plugin-development
title: Plugin Development Guide
slug: /developer-resources/plugin-development
---

# Plugin Development Guide

This guide walks you through creating a complete plugin for the Talawa platform, using the Plugin Map plugin as a reference example.

## Overview

A Talawa plugin consists of two main parts:
- **API Plugin**: Backend functionality (GraphQL, database, hooks)
- **Admin Plugin**: Frontend components (pages, navigation, UI)

## Plugin Structure

```
my-plugin/
├── api/
│   ├── manifest.json          # API plugin manifest
│   ├── index.ts              # Main entry point
│   ├── database/
│   │   └── tables.ts         # Database schema
│   └── graphql/
│       ├── queries.ts         # GraphQL queries
│       ├── mutations.ts       # GraphQL mutations
│       ├── types.ts           # GraphQL types
│       └── inputs.ts          # GraphQL input types
└── admin/
    ├── manifest.json          # Admin plugin manifest
    ├── index.tsx             # Main entry point
    └── pages/
        └── MyComponent.tsx    # React components
```

## Step 1: Create Plugin Directory

First, create your plugin directory in the appropriate locations:

```bash
# API Plugin
mkdir -p talawa-api-fork/src/plugin/available/my_plugin

# Admin Plugin
mkdir -p talawa-admin-fork/src/plugin/available/my_plugin
```

## Step 2: API Plugin Development

### 2.1 Create API Manifest

Create `talawa-api-fork/src/plugin/available/my_plugin/manifest.json`:

```json
{
  "name": "My Plugin",
  "pluginId": "my_plugin",
  "version": "1.0.0",
  "description": "A sample plugin demonstrating plugin development",
  "author": "Your Name",
  "main": "index.ts",
  "extensionPoints": {
    "graphql": [
      {
        "type": "query",
        "name": "myPluginQueries",
        "file": "graphql/queries.ts",
        "builderDefinition": "registerMyPluginQueries",
        "description": "Register all My Plugin query fields"
      },
      {
        "type": "mutation",
        "name": "myPluginMutations",
        "file": "graphql/mutations.ts",
        "builderDefinition": "registerMyPluginMutations",
        "description": "Register all My Plugin mutation fields"
      }
    ],
    "database": [
      {
        "type": "table",
        "name": "myPluginTable",
        "file": "database/tables.ts",
        "description": "My plugin data table"
      }
    ],
    "hooks": [
      {
        "type": "post",
        "event": "plugin:activated",
        "handler": "onPluginActivated",
        "description": "Handle plugin activation events"
      }
    ]
  }
}
```

### 2.2 Create Database Schema

Create `talawa-api-fork/src/plugin/available/my_plugin/database/tables.ts`:

```typescript
import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";

export const myPluginTable = pgTable("my_plugin_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### 2.3 Create GraphQL Types

Create `talawa-api-fork/src/plugin/available/my_plugin/graphql/types.ts`:

```typescript
import { builder } from "~/src/graphql/builder";

// MyPluginData type
export const MyPluginDataRef = builder.objectRef<{
  id: string;
  name: string;
  description: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}>("MyPluginData");

MyPluginDataRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// MyPluginDataList type
export const MyPluginDataListRef = builder.objectRef<{
  data: Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  }>;
  totalCount: number;
}>("MyPluginDataList");

MyPluginDataListRef.implement({
  fields: (t) => ({
    data: t.field({
      type: t.listRef(MyPluginDataRef),
      resolve: (parent) => parent.data,
    }),
    totalCount: t.exposeInt("totalCount"),
  }),
});
```

### 2.4 Create GraphQL Inputs

Create `talawa-api-fork/src/plugin/available/my_plugin/graphql/inputs.ts`:

```typescript
import { z } from "zod";
import { builder } from "~/src/graphql/builder";

// Create MyPluginData Input
export const createMyPluginDataInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const CreateMyPluginDataInput = builder
  .inputRef<z.infer<typeof createMyPluginDataInputSchema>>("CreateMyPluginDataInput")
  .implement({
    description: "Input for creating a new my plugin data entry",
    fields: (t) => ({
      name: t.string({ required: true }),
      description: t.string({ required: false }),
    }),
  });
```

### 2.5 Create GraphQL Queries

Create `talawa-api-fork/src/plugin/available/my_plugin/graphql/queries.ts`:

```typescript
import { desc } from "drizzle-orm";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { myPluginTable } from "../database/tables";
import { MyPluginDataListRef } from "./types";

// Get all my plugin data
export async function getMyPluginDataResolver(
  _parent: unknown,
  _args: Record<string, unknown>,
  ctx: GraphQLContext
) {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: { code: "unauthenticated" },
    });
  }

  try {
    const data = await ctx.drizzleClient
      .select()
      .from(myPluginTable)
      .orderBy(desc(myPluginTable.createdAt));

    return {
      data,
      totalCount: data.length,
    };
  } catch (error) {
    ctx.log?.error("Error getting my plugin data:", error);
    throw new TalawaGraphQLError({
      extensions: { code: "unexpected" },
    });
  }
}

// Register queries with the builder
export function registerMyPluginQueries(
  builderInstance: typeof builder
): void {
  builderInstance.queryField("getMyPluginData", (t) =>
    t.field({
      type: MyPluginDataListRef,
      description: "Get all my plugin data entries",
      resolve: getMyPluginDataResolver,
    })
  );
}
```

### 2.6 Create GraphQL Mutations

Create `talawa-api-fork/src/plugin/available/my_plugin/graphql/mutations.ts`:

```typescript
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { myPluginTable } from "../database/tables";
import { MyPluginDataRef } from "./types";
import { createMyPluginDataInputSchema } from "./inputs";

// Create my plugin data
export async function createMyPluginDataResolver(
  _parent: unknown,
  args: {
    input: {
      name: string;
      description?: string;
    };
  },
  ctx: GraphQLContext
) {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: { code: "unauthenticated" },
    });
  }

  const { success, data: parsedInput, error } = createMyPluginDataInputSchema.safeParse(args.input);

  if (!success) {
    ctx.log?.error("Invalid arguments for createMyPluginData:", error);
    throw new TalawaGraphQLError({
      extensions: { code: "unexpected" },
    });
  }

  try {
    const [newData] = await ctx.drizzleClient
      .insert(myPluginTable)
      .values({
        name: parsedInput.name,
        description: parsedInput.description,
      })
      .returning();

    return newData;
  } catch (error) {
    ctx.log?.error("Error creating my plugin data:", error);
    throw new TalawaGraphQLError({
      extensions: { code: "unexpected" },
    });
  }
}

// Register mutations with the builder
export function registerMyPluginMutations(
  builderInstance: typeof builder
): void {
  builderInstance.mutationField("createMyPluginData", (t) =>
    t.field({
      type: MyPluginDataRef,
      args: {
        input: t.arg({
          type: CreateMyPluginDataInput,
          required: true,
        }),
      },
      description: "Create a new my plugin data entry",
      resolve: createMyPluginDataResolver,
    })
  );
}
```

### 2.7 Create Main Entry Point

Create `talawa-api-fork/src/plugin/available/my_plugin/index.ts`:

```typescript
import type { IPluginContext } from "~/src/plugin/types";

// Export all GraphQL components
export * from "./graphql/queries";
export * from "./graphql/mutations";
export * from "./graphql/types";
export * from "./graphql/inputs";

// Lifecycle hooks
export async function onLoad(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info("My Plugin loaded successfully");
  }

  // Initialize plugin table if it doesn't exist
  try {
    const { myPluginTable } = await import("./database/tables");

    if (
      context.db &&
      typeof context.db === "object" &&
      "select" in context.db
    ) {
      const db = context.db as any;
      await db.select().from(myPluginTable).limit(1);
    }

    if (context.logger?.info) {
      context.logger.info("My Plugin table verified");
    }
  } catch (error) {
    if (context.logger?.warn) {
      context.logger.warn("Failed to verify plugin table:", error);
    }
  }
}

export async function onActivate(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info("My Plugin activated");
  }

  // Register GraphQL schema extensions
  if (context.graphql) {
    try {
      const { registerMyPluginQueries } = await import("./graphql/queries");
      const { registerMyPluginMutations } = await import("./graphql/mutations");

      registerMyPluginQueries(context.graphql as any);
      registerMyPluginMutations(context.graphql as any);

      if (context.logger?.info) {
        context.logger.info("GraphQL schema extensions registered for My Plugin");
      }
    } catch (error) {
      if (context.logger?.error) {
        context.logger.error("Failed to register GraphQL extensions:", error);
      }
    }
  }
}

export async function onDeactivate(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info("My Plugin deactivated");
  }
}

export async function onUnload(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info("My Plugin unloaded");
  }
}

// Hook handlers
export async function onPluginActivated(context: IPluginContext): Promise<void> {
  if (context.logger?.info) {
    context.logger.info("My Plugin activated via hook");
  }
}

// Plugin information
export function getPluginInfo() {
  return {
    name: "My Plugin",
    version: "1.0.0",
    description: "A sample plugin demonstrating plugin development",
    author: "Your Name",
    dependencies: [],
    graphqlOperations: [
      "getMyPluginData",
      "createMyPluginData",
    ],
  };
}
```

## Step 3: Admin Plugin Development

### 3.1 Create Admin Manifest

Create `talawa-admin-fork/src/plugin/available/my_plugin/manifest.json`:

```json
{
  "name": "My Plugin",
  "pluginId": "my_plugin",
  "version": "1.0.0",
  "description": "A sample plugin demonstrating plugin development",
  "author": "Your Name",
  "main": "index.tsx",
  "icon": "/src/assets/svgs/plugins.svg",
  "extensionPoints": {
    "RA1": [
      {
        "path": "/admin/my-plugin/dashboard",
        "component": "MyPluginDashboard"
      }
    ],
    "DA1": [
      {
        "label": "My Plugin",
        "icon": "/src/assets/svgs/plugins.svg",
        "path": "/admin/my-plugin/dashboard",
        "order": 1
      }
    ]
  }
}
```

### 3.2 Create React Components

Create `talawa-admin-fork/src/plugin/available/my_plugin/pages/MyPluginDashboard.tsx`:

```typescript
import React, { useState } from 'react';
import { Card, Typography, Row, Col, Button, message, Space, Table, Form, Input } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from 'graphql-tag';

const { Title, Paragraph } = Typography;

// GraphQL queries and mutations
const GET_MY_PLUGIN_DATA = gql`
  query GetMyPluginData {
    getMyPluginData {
      data {
        id
        name
        description
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`;

const CREATE_MY_PLUGIN_DATA = gql`
  mutation CreateMyPluginData($input: CreateMyPluginDataInput!) {
    createMyPluginData(input: $input) {
      id
      name
      description
      createdAt
      updatedAt
    }
  }
`;

const MyPluginDashboard: React.FC = () => {
  const [form] = Form.useForm();
  const [createData] = useMutation(CREATE_MY_PLUGIN_DATA);
  
  const { data, loading, refetch } = useQuery(GET_MY_PLUGIN_DATA, {
    fetchPolicy: 'network-only',
  });

  const handleCreate = async (values: { name: string; description?: string }) => {
    try {
      await createData({
        variables: {
          input: values,
        },
      });
      
      message.success('Data created successfully');
      form.resetFields();
      refetch();
    } catch (error) {
      console.error('Error creating data:', error);
      message.error('Failed to create data');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => new Date(createdAt).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>My Plugin Dashboard</Title>
      <Paragraph>
        This is a sample plugin dashboard demonstrating plugin development.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Create New Data" style={{ marginBottom: '16px' }}>
            <Form form={form} onFinish={handleCreate} layout="vertical">
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please enter a name' }]}
              >
                <Input placeholder="Enter name" />
              </Form.Item>
              
              <Form.Item name="description" label="Description">
                <Input.TextArea placeholder="Enter description" />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Create Data
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Data List">
            <Table
              columns={columns}
              dataSource={data?.getMyPluginData?.data || []}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MyPluginDashboard;
```

### 3.3 Create Main Entry Point

Create `talawa-admin-fork/src/plugin/available/my_plugin/index.tsx`:

```typescript
import React from 'react';
import MyPluginDashboard from './pages/MyPluginDashboard';

// Export all components
export { MyPluginDashboard };

// Default export for the main component
const MyPlugin: React.FC = () => {
  return <MyPluginDashboard />;
};

export default MyPlugin;
```

## Step 4: Testing Your Plugin

### 4.1 Start the Development Servers

```bash
# Start API server
cd talawa-api-fork
npm run dev

# Start Admin server
cd talawa-admin-fork
npm run dev
```

### 4.2 Test GraphQL Operations

You can test your GraphQL operations using the GraphQL Playground or any GraphQL client:

```graphql
# Query
query GetMyPluginData {
  getMyPluginData {
    data {
      id
      name
      description
      createdAt
      updatedAt
    }
    totalCount
  }
}

# Mutation
mutation CreateMyPluginData($input: CreateMyPluginDataInput!) {
  createMyPluginData(input: $input) {
    id
    name
    description
    createdAt
    updatedAt
  }
}
```

### 4.3 Access Your Plugin

Navigate to your plugin in the admin panel:
- **Global Admin**: `/admin/my-plugin/dashboard`
- Check the drawer menu for "My Plugin" entry

## Best Practices

### 1. Plugin ID Naming
- Use snake_case for plugin IDs
- Make them descriptive and unique
- Avoid special characters except underscores

### 2. GraphQL Operations
- Prefix all operations with your plugin ID
- Use descriptive names for queries and mutations
- Implement proper error handling

### 3. Database Design
- Use descriptive table names
- Include proper indexes for performance
- Follow the existing schema patterns

### 4. UI Components
- Follow the existing design patterns
- Use Ant Design components consistently
- Implement proper loading and error states

### 5. Error Handling
- Always handle GraphQL errors gracefully
- Log errors appropriately
- Provide user-friendly error messages

### 6. Type Safety
- Use TypeScript for all components
- Define proper interfaces for all data structures
- Leverage GraphQL types for type safety

## Next Steps

1. **Add More Features**: Extend your plugin with additional functionality
2. **Add Tests**: Create unit and integration tests
3. **Add Documentation**: Document your plugin's features and usage
4. **Optimize Performance**: Implement caching and optimization strategies
5. **Add Configuration**: Make your plugin configurable through settings
6. **Package Your Plugin**: Use the [Plugin Scripts](./scripts.md) to create distributable zip files

This guide provides a solid foundation for plugin development. Refer to the Plugin Map plugin for a complete working example of all these concepts in action. 