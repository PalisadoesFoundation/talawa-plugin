---
id: extension-points
title: Extension Points Reference
slug: /developer-resources/extension-points
---

# Extension Points Reference

This document provides a comprehensive reference for all extension points available in the Talawa plugin system.

## Overview

Extension points are predefined locations in the Talawa system where plugins can inject functionality. Each extension point serves a specific purpose and context.

## Route Extensions

Route extensions allow plugins to add new pages and navigation to the admin panel.

### RA1 - Admin Global Routes

**Purpose**: System-wide admin functionality accessible to global administrators.

**Context**: Global (no organization-specific)

**Use Cases**:

- System-wide settings and configuration
- Global user management
- Cross-organization analytics
- System administration tools

**Example**:

```json
{
  "extensionPoints": {
    "RA1": [
      {
        "path": "/admin/system/analytics",
        "component": "SystemAnalytics"
      }
    ]
  }
}
```

### RA2 - Admin Organization Routes

**Purpose**: Organization-specific admin functionality.

**Context**: Organization-specific (requires `orgId` parameter)

**Use Cases**:

- Organization settings and configuration
- Member management
- Organization-specific analytics
- Event management tools

**Example**:

```json
{
  "extensionPoints": {
    "RA2": [
      {
        "path": "/admin/organization/:orgId/members",
        "component": "MemberManagement"
      }
    ]
  }
}
```

### RU1 - User Organization Routes

**Purpose**: Organization-specific user functionality.

**Context**: Organization-specific (requires `orgId` parameter)

**Use Cases**:

- Organization participation features
- Member-specific tools
- Organization event participation
- User organization settings

**Example**:

```json
{
  "extensionPoints": {
    "RU1": [
      {
        "path": "/user/organization/:orgId/events",
        "component": "UserEvents"
      }
    ]
  }
}
```

### RU2 - User Global Routes

**Purpose**: System-wide user functionality accessible to all users.

**Context**: Global (no organization-specific)

**Use Cases**:

- Global user profile management
- Cross-organization features
- Global user preferences
- System-wide user tools

**Example**:

```json
{
  "extensionPoints": {
    "RU2": [
      {
        "path": "/user/profile/global",
        "component": "GlobalUserProfile"
      }
    ]
  }
}
```

## Drawer Extensions

Drawer extensions allow plugins to add menu items to the navigation drawer.

### DA1 - Admin Global Drawer

**Purpose**: Menu items for global administrators.

**Context**: Global admin navigation

**Properties**:

- `label`: Display text for the menu item
- `icon`: Icon path or component
- `path`: Navigation path
- `order`: Display order (optional)

**Example**:

```json
{
  "extensionPoints": {
    "DA1": [
      {
        "label": "System Analytics",
        "icon": "/src/assets/svgs/analytics.svg",
        "path": "/admin/system/analytics",
        "order": 1
      }
    ]
  }
}
```

### DA2 - Admin Organization Drawer

**Purpose**: Menu items for organization administrators.

**Context**: Organization admin navigation

**Example**:

```json
{
  "extensionPoints": {
    "DA2": [
      {
        "label": "Member Management",
        "icon": "/src/assets/svgs/users.svg",
        "path": "/admin/organization/:orgId/members",
        "order": 1
      }
    ]
  }
}
```

### DU1 - User Organization Drawer

**Purpose**: Menu items for organization users.

**Context**: Organization user navigation

**Example**:

```json
{
  "extensionPoints": {
    "DU1": [
      {
        "label": "My Events",
        "icon": "/src/assets/svgs/events.svg",
        "path": "/user/organization/:orgId/events",
        "order": 1
      }
    ]
  }
}
```

### DU2 - User Global Drawer

**Purpose**: Menu items for global users.

**Context**: Global user navigation

**Example**:

```json
{
  "extensionPoints": {
    "DU2": [
      {
        "label": "Global Profile",
        "icon": "/src/assets/svgs/profile.svg",
        "path": "/user/profile/global",
        "order": 1
      }
    ]
  }
}
```

## Injector Extensions

Injector extensions allow plugins to inject code into existing components.

### G1-G5 - General Injectors

**Purpose**: Code injection points for UI components.

**Context**: Various UI locations throughout the application

**Use Cases**:

- Adding buttons to existing pages
- Injecting content into forms
- Adding widgets to dashboards
- Customizing existing components

**Properties**:

- `injector`: Component name to inject
- `description`: Description of what the injector does
- `target`: Optional target identifier for specific injection points
- `order`: Optional display order

**Example**:

```json
{
  "extensionPoints": {
    "G1": [
      {
        "injector": "DashboardWidget",
        "description": "Add analytics widget to dashboard",
        "target": "dashboard-main",
        "order": 1
      }
    ],
    "G2": [
      {
        "injector": "FormButton",
        "description": "Add custom button to user form",
        "target": "user-form-actions",
        "order": 2
      }
    ]
  }
}
```

## API Extensions

API extensions allow plugins to extend the backend functionality.

### GraphQL Extensions

**Purpose**: Add GraphQL queries, mutations, and subscriptions.

**Types**:

- `query`: Read operations
- `mutation`: Write operations
- `subscription`: Real-time operations

**Builder-First Approach**:

```json
{
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
    ]
  }
}
```

### Database Extensions

**Purpose**: Add database tables, enums, and relations.

**Types**:

- `table`: Database tables
- `enum`: Database enums
- `relation`: Database relations

**Example**:

```json
{
  "extensionPoints": {
    "database": [
      {
        "type": "table",
        "name": "myPluginTable",
        "file": "database/tables.ts",
        "description": "My plugin data table"
      }
    ]
  }
}
```

### Hook Extensions

**Purpose**: Register event handlers for system events.

**Types**:

- `pre`: Execute before an event
- `post`: Execute after an event

**Events**:

- `plugin:activated`: Plugin activation events
- `plugin:deactivated`: Plugin deactivation events
- `user:created`: User creation events
- `organization:created`: Organization creation events

**Example**:

```json
{
  "extensionPoints": {
    "hooks": [
      {
        "type": "post",
        "event": "plugin:activated",
        "handler": "onPluginActivated",
        "description": "Handle plugin activation events"
      },
      {
        "type": "pre",
        "event": "user:created",
        "handler": "onUserCreated",
        "description": "Handle user creation events"
      }
    ]
  }
}
```

## Extension Point Best Practices

### Route Extensions

1. **Use Descriptive Paths**: Make paths clear and meaningful
2. **Follow URL Conventions**: Use kebab-case for URLs
3. **Handle Parameters**: Properly handle route parameters like `orgId`
4. **Implement Permissions**: Add appropriate permission checks

### Drawer Extensions

1. **Use Clear Labels**: Make menu items self-explanatory
2. **Choose Appropriate Icons**: Use consistent icon patterns
3. **Set Proper Order**: Use order to organize menu items logically
4. **Handle Active States**: Implement proper active state handling

### Injector Extensions

1. **Be Specific**: Target specific injection points when possible
2. **Provide Descriptions**: Document what each injector does
3. **Use Proper Ordering**: Set order for consistent display
4. **Handle Errors**: Implement proper error handling

### API Extensions

1. **Use Builder-First**: Always use the builder-first approach for GraphQL
2. **Validate Inputs**: Implement proper input validation
3. **Handle Errors**: Provide meaningful error messages
4. **Follow Naming Conventions**: Use consistent naming patterns

## Extension Point Contexts

### Global Context (RA1, RU2, DA1, DU2)

- **Access**: Available to all users or global admins
- **Data**: System-wide data, no organization context
- **Use Cases**: Global settings, cross-organization features
- **Permissions**: Global permissions required

### Organization Context (RA2, RU1, DA2, DU1)

- **Access**: Available to organization members or admins
- **Data**: Organization-specific data
- **Use Cases**: Organization management, member features
- **Permissions**: Organization-specific permissions required

## Security Considerations

### Permission Validation

- Always validate user permissions for extension points
- Check organization membership for organization-specific extensions
- Implement proper role-based access control

### Data Isolation

- Ensure organization data is properly isolated
- Validate organization context for organization-specific features
- Implement proper data access controls

### Input Validation

- Validate all user inputs
- Sanitize data before processing
- Implement proper error handling

## Performance Considerations

### Lazy Loading

- Load extension components on demand
- Implement proper code splitting
- Use dynamic imports for large components

### Caching

- Cache frequently accessed data
- Implement proper cache invalidation
- Use appropriate caching strategies

### Optimization

- Minimize bundle size for extensions
- Optimize database queries
- Implement proper indexing

## Testing Extension Points

### Unit Testing

- Test individual extension components
- Mock dependencies appropriately
- Test error conditions

### Integration Testing

- Test extension point integration
- Verify proper context handling
- Test permission validation

### End-to-End Testing

- Test complete user workflows
- Verify proper navigation
- Test cross-extension interactions

## Debugging Extension Points

### Common Issues

1. **Permission Errors**: Check user permissions and roles
2. **Context Errors**: Verify proper context handling
3. **Navigation Issues**: Check route definitions and parameters
4. **Data Isolation**: Verify organization context is properly handled

### Debugging Tools

1. **GraphQL Playground**: Test GraphQL extensions
2. **Browser DevTools**: Debug frontend extensions
3. **Server Logs**: Check backend extension logs
4. **Plugin Manager**: Review plugin status and errors

This reference provides comprehensive information about all available extension points and how to use them effectively in your plugins.
