# Contributing to Talawa-Plugin

Thank you for your interest in contributing to Talawa Plugin. Regardless of the size of the contribution you make, all contributions are welcome and are appreciated.

If you are new to contributing to open source, please read the Open Source Guides on [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/).

## Table of Contents

<!-- toc -->

- [Contributing to Talawa-Plugin](#contributing-to-talawa-plugin)
  - [Table of Contents](#table-of-contents)
  - [General](#general)
  - [Testing:](#testing)
    - [Vitest Testing](#vitest-testing)
      - [Combined Testing and Coverage](#combined-testing-and-coverage)
      - [Test Code Coverage:](#test-code-coverage)

<!-- tocstop -->

## General

Please read the [Palisadoes Contributing Guidelines](https://github.com/PalisadoesFoundation/.github/blob/main/profile/CONTRIBUTING.md).

## Testing:

This section outlines the different testing strategies and tools used in this project. It includes instructions on running tests, viewing code coverage, and debugging using Jest and Vitest. Following these guidelines ensures code reliability and maintains the project's high standards for quality.

### Vitest Testing

1. Running a single test:
  
    ```
    pnpm run test:vitest /path/to/test/file
    ```

1. Running all tests:
  
    ```
    pnpm run test:vitest
    ```

1. Viewing the code coverage of a single test file:
  
    ```
    pnpm run test:vitest:coverage /path/to/test/file
    ```

1. Viewing the code coverage of all test files:
  
    ```
    pnpm run test:vitest:coverage
    ```

#### Combined Testing and Coverage

1. Running all tests:
    ```
    pnpm run test && pnpm run test:vitest
    ```

1. Viewing combined code coverage:
    ```
    pnpm run test --watchAll=false --coverage && pnpm run test:vitest:coverage
    ```

#### Test Code Coverage:

1. _General Information_

   1. The current code coverage of the repo is: [![codecov](https://codecov.io/gh/PalisadoesFoundation/talawa-plugin/branch/develop/graph/badge.svg?token=II0R0RREES)](https://codecov.io/gh/PalisadoesFoundation/talawa-plugin)

   2. You can determine the percentage test coverage of your code by running these two commands in sequence:
      ```
      pnpm install
      pnpm run test --watchAll=false --coverage
      genhtml coverage/lcov.info -o coverage
      ```
   3. The output of the `pnpm run test` command will give you a tablular coverage report per file

   4. The overall coverage rate will be visible on the penultimate line of the `genhtml` command's output.

   5. The `genhtml` command is part of the Linux `lcov` package. Similar packages can be found for Windows and MacOS.

   6. The currently acceptable coverage rate can be found in the [GitHub Pull Request file](.github/workflows/pull-requests.yml). Search for the value below the line containing `min_coverage`.
   
2. _Testing Individual Files_

   1. You can test an individual file by running this command:
    ```
    pnpm run test --watchAll=false /path/to/test/file
    ```

   2. You can get the test coverage report for that file by running this command. The report will list all tests in the suite. Those tests that are not run will have zero values. You will need to look for the output line relevant to your test file.
    ```
    pnpm run test --watchAll=false --coverage /path/to/test/file
    ```
