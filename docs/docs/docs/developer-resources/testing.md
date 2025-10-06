---
id: testing
title: Testing
slug: /developer-resources/testing
sidebar_position: 4
---

# Testing Plugins

To ensure quality and stability, all plugins must include appropriate unit and integration tests. Testing helps verify that plugin logic works correctly across the server, admin, and mobile components.

## Folder Structure for Tests

Each plugin should include tests in subfolders as follows:

```
plugins/
└── my-plugin/
    ├── server/
    │   └── __tests__/
    │       └── plugin-service.test.ts
    ├── admin/
    │   └── __tests__/
    │       └── PluginComponent.test.tsx
    └── mobile/
        └── test/
            └── plugin_test.dart
```

## 1. Server (API) Tests

- Use [Vitest](https://vitest.dev) for testing GraphQL resolvers and service logic.
- Mock external dependencies and DB calls.

### Example (Vitest + TypeORM)

```ts
import { describe, it, expect } from "vitest";
import { getGreeting } from "../plugin-service";

describe("plugin-service", () => {
  it("should return the correct greeting", () => {
    const result = getGreeting("Talawa");
    expect(result).toBe("Hello, Talawa!");
  });
});
```

## 2. Admin Panel Tests

- Use [Vitest](https://vitest.dev) along with [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) for testing UI components.
- Validate rendering, interactions, and conditional UI.

### Example

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PluginCard from "../PluginCard";

describe("PluginCard", () => {
  it("renders plugin name", () => {
    render(<PluginCard name="Survey Plugin" />);
    expect(screen.getByText(/Survey Plugin/)).toBeInTheDocument();
  });
});
```

## 3. Mobile App Tests

- Use [Flutter’s built-in test framework](https://docs.flutter.dev/testing).
- Focus on widget tests and logic inside the plugin folder.

### Example

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:my_plugin/my_plugin.dart';

void main() {
  test('greeting message is correct', () {
    final greeting = getGreeting('Talawa');
    expect(greeting, 'Hello, Talawa!');
  });
}
```

## Writing Good Tests

- Cover both success and failure scenarios
- Use mocks for external services
- Keep test files close to the code they test
- Run tests using CI before merging changes

## Running Tests

### Server / Admin

```bash
pnpm test
```

### Mobile (Flutter)

```bash
flutter test
```

Consistent testing ensures Talawa Plugins remain stable, maintainable, and easy to trust across organisations.
