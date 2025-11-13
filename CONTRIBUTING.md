# Contributing to Talawa-Plugin

Thank you for your interest in contributing to Talawa Plugin. Regardless of the size of the contribution you make, all contributions are welcome and are appreciated.

If you are new to contributing to open source, please read the Open Source Guides on [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/).

## Table of Contents

<!-- toc -->

- [Contributing to Talawa-Plugin](#contributing-to-talawa-plugin)
  - [Table of Contents](#table-of-contents)
  - [General](#general)
    - [Contributing Code](#contributing-code)
    - [General:](#general-1)
    - [Testing:](#testing)
      - [Jest Testing](#jest-testing)
      - [Vitest Testing](#vitest-testing)
      - [Combined testing and coverage](#combined-testing-and-coverage)
      - [Test Code Coverage:](#test-code-coverage)

<!-- tocstop -->

## General

Please read the [Palisadoes Contributing Guidelines](https://github.com/PalisadoesFoundation/.github/blob/main/profile/CONTRIBUTING.md).

### Contributing Code

Code contributions to Talawa come in the form of pull requests. These are done by forking the repo and making changes locally.

Make sure you have read the [Documentation for Setting up the Project](https://github.com/PalisadoesFoundation/talawa-plugin#project-setup)

The process of proposing a change to Talawa Plugin can be summarized as:

1. Fork the Talawa Plugin repository and branch off `develop`.
1. Your newly forked repository can be cloned locally using `git clone <YOUR FORKED REPO URL>`.
1. Make the Palisadoes Foundation's repo your `git upstream` for your local repo.
1. Make the desired changes to the Talawa Plugin project.
1. Run the app and test your changes.
1. If you've added code, then test suites must be added.

   ### General:
   - We need to get to 100% test coverage for the app. We periodically increase the desired test coverage for our pull requests to meet this goal.
   - Pull requests that don't meet the minimum test coverage levels will not be accepted. This may mean that you will have to create tests for code you did not write. You can decide which part of the code base needs additional tests if this happens to you.

   ### Testing:

   This section outlines the different testing strategies and tools used in this project. It includes instructions on running tests, viewing code coverage, and debugging using Jest and Vitest. Following these guidelines ensures code reliability and maintains the project's high standards for quality.

   #### Jest Testing
   - Running a single test:
     ```
     pnpm run test path/to/test/file
     ```
   - Running all tests:
     ```
     pnpm run test --watchAll=false
     ```
   - Viewing the code coverage of a single test file:
     ```
     pnpm run test --watchAll=false --coverage /path/to/test/file
     ```
   - Viewing the code coverage of all test files:
     ```
     pnpm run test --watchAll=false --coverage
     ```
   - Debug tests in browser
     You can see the output of failing tests in broswer by running `jest-preview` package before running your tests

     ```
     pnpm run jest-preview
     pnpm run test --watchAll=false --coverage
     ```

     You don't need to re-run the `pnpm run jest-preview` command each time, simply run the `pnpm run test` command if the Jest Preview server is already running in the background, it'll automatically detect any failing tests and show the preview at `http://localhost:3336` as shown in this screenshot -

     ![Debugging Test Demo](./public/images/jest-preview.webp)

   #### Vitest Testing
   - Running a single test:
     ```
     pnpm run test:vitest /path/to/test/file
     ```
   - Running all tests:
     ```
     pnpm run test:vitest
     ```
   - Viewing the code coverage of a single test file:
     ```
     pnpm run test:vitest:coverage /path/to/test/file
     ```
   - Viewing the code coverage of all test files:
     ```
     pnpm run test:vitest:coverage
     ```

   #### Combined testing and coverage
   - Running all tests:
     ```
     pnpm run test && pnpm run test:vitest
     ```
   - Viewing combined code coverage:
     ```
     pnpm run test --watchAll=false --coverage && pnpm run test:vitest:coverage
     ```

   #### Test Code Coverage:
   1. _General Information_
      - The current code coverage of the repo is: [![codecov](https://codecov.io/gh/PalisadoesFoundation/talawa-plugin/branch/develop/graph/badge.svg?token=II0R0RREES)](https://codecov.io/gh/PalisadoesFoundation/talawa-plugin)
      - You can determine the percentage test coverage of your code by running these two commands in sequence:
        ```
        pnpm install
        pnpm run test --watchAll=false --coverage
        genhtml coverage/lcov.info -o coverage
        ```
      - The output of the `pnpm run test` command will give you a tablular coverage report per file
      - The overall coverage rate will be visible on the penultimate line of the `genhtml` command's output.
      - The `genhtml` command is part of the Linux `lcov` package. Similar packages can be found for Windows and MacOS.
      - The currently acceptable coverage rate can be found in the [GitHub Pull Request file](.github/workflows/pull-requests.yml). Search for the value below the line containing `min_coverage`.
   2. _Testing Individual Files_
      - You can test an individual file by running this command:
        ```
        pnpm run test --watchAll=false /path/to/test/file
        ```
      - You can get the test coverage report for that file by running this command. The report will list all tests in the suite. Those tests that are not run will have zero values. You will need to look for the output line relevant to your test file.
        ```
        pnpm run test --watchAll=false --coverage /path/to/test/file
        ```
   3. _Creating your code coverage account_
      - You can also see your code coverage online for your fork of the repo. This is provided by `codecov.io`
        1. Go to this link: `https://app.codecov.io/gh/XXXX/YYYY` where XXXX is your GitHub account username and YYYY is the name of the repository
        2. Login to `codecov.io` using your GitHub account, and add your **repo** and **branches** to the `codecov.io` dashboard.
           ![Debugging Test Demo](/public/images/codecov/authorise-codecov-github.jpg)
        3. Remember to add the `Repository Upload Token` for your forked repo. This can be found under `Settings` of your `codecov.io` account.

        4. Click on Setup Repo option
           ![Debugging Test Demo](</public/images/codecov/homescrenn%20(1).jpg>)
        5. Use the value of this token to create a secret named CODE_COV for your forked repo.
           [![Code-cov-token.jpg](/public/images/codecov/Code-cov-token.jpg)]()
           [![addd-your-key.jpg](/public/images/codecov/addd-your-key.jpg)]()
        6. You will see your code coverage reports with every push to your repo after following these steps
           [![results.jpg](/public/images/codecov/results.jpg)]()

1. After making changes you can add them to git locally using `git add <file_name>`(to add changes only in a particular file) or `git add .` (to add all changes).
1. After adding the changes you need to commit them using `git commit -m '<commit message>'`(look at the commit guidelines below for commit messages).
1. Once you have successfully commited your changes, you need to push the changes to the forked repo on github using: `git push origin <branch_name>`.(Here branch name must be name of the branch you want to push the changes to.)
1. Now create a pull request to the Talawa-plugin repository from your forked repo. Open an issue regarding the same and link your PR to it.
1. Ensure the test suite passes, either locally or on CI once a PR has been created.
1. Review and address comments on your pull request if requested.
