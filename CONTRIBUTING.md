# Devloper guide for Agent Issue Tracker

This document provides guidelines and instructions to help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
- [Development Overview](#development-overview)
    - [Structure](#structure)
    - [Running the Application](#running-the-application)
    - [Workflow](#workflow)
- [Implementation Guidelines](#implementation-guidelines)
    - [Commenting](#commenting)
    - [Linting](#linting)
    - [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Feature Branching](#feature-branching)
- [Automation](#automation)
    - [CI Pipeline](#ci-pipeline)
    - [Changelog](#changelog)
- [Communication](#communication)

## Code of Conduct

We value clear communication, accountability, respect, and support. Please refer to our [Team Contract](admin/misc/rules.md) for more details on our values and conflict resolution strategies.

## Getting Started

### Prerequisites

- **Node.js**: Version 22.0.0 or higher.
- **npm**: Usually comes with Node.js.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/cse110-sp26-group4/cse110-sp26-group4.git
    cd cse110-sp26-group4
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```
    
    This also installs developer dependencies.

## Development Overview

### Structure

- `source/`: Main application source code.
  - `commands/`: CLI command implementations.
  - `models/`: Database models.
  - `services/`: Service layer connecting CLI commands to database operations.
- `tests/`: Unit and integration tests.
- `docs/`: Project documentation.
- `prototypes/`: Prototypes and mockups, created with AI.
- `admin/`: Administrative files.

### Running the Application

The application should be run with the `baton` command. 

During development, you can run it via:

```bash
node source/cli.js [command]
```

### Workflow

1.  **Branching:** 

    Create a new branch for your work from `main`.

    ```bash
    git switch -c branch-name
    ```
2.  **Implementation:** 

    Implement your changes, following the code style and adding tests as needed.
3.  **Verification:** 

    Ensure all tests pass (`npm test`) and linting is clean (`npm run lint`), and updating documentation (`npm run build-docs`) doesn't throw errors.
4.  **Commit:** 

    Commit your changes using commit messages following the Conventional Commits standard.

    ```bash
    git add .
    git commit -m "commit-message"
    ```
5.  **Push and pull request:** 

    Push your branch:
    ```bash
    git push -u origin branch-name
    ```

    Now open a pull request against the `main` branch. 
6.  **Review:** 

    All pull requests at least one review before they can be merged. 

## Implementation Guidelines

### Commenting
For each function created in a Javascript file, please make sure to follow the [jsdoc](https://jsdoc.app/about-getting-started) guidelines. 

Example: 
```js
/**
 * Represents a book.
 * @constructor
 * @param {string} title - The title of the book.
 * @param {string} author - The author of the book.
 */
function Book(title, author) {
}
```

**Note that arrays paired with custom objects are not supported.**

Bad: 

```js
/**
 * @returns {{ title: string, description: string, priority: string }[]}
 */ 
function parseMustRequirements(markdown) {
```

Good: 
```js
/**
 * Represents a discrete requirement parsed from the markdown specs.
 * @typedef {Object} Requirement
 * @property {string} title - The title or ID of the requirement (e.g., FR-1).
 * @property {string} description - The detailed breakdown of the requirement.
 * @property {string} priority - The assigned urgency level.
 */

/**
 * @returns {Requirement[]}
 */ 
function parseMustRequirements() {}
```

### Linting

We use [ESLint](https://eslint.org/) to maintain code quality. Please ensure your code passes linting before submitting a PR.

- **Check for lint errors:**
  ```bash
  npm run lint
  ```
- **Automatically fix lint errors:**
  ```bash
  npm run lint:fix
  ```

### Testing

We use the built-in Node.js test runner. All new features and bug fixes should include relevant tests.

- **Run all tests:**
  ```bash
  npm test
  ```

## Commit Guidelines

We use the guideliens provided by [Conventional Commits](https://www.conventionalcommits.org/). This helps us automate our release process and maintain a clear and concise commit history.

Commit messages should be formatted as:
`<type>(<scope>): <description>`.

Common types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

The scope can be about anything. 

In total, the commit header should not exceed 50 characters. If more characters are needed, paragraphs separated by newlines should be used. 

The header should not end with punctuation, while paragraphs should use puncutation.

**Example:** `feat(cli): add 'next' command to view upcoming tasks`

Husky will automatically validate commit messages at commit time using commitlint.

## Feature Branching

**Please do not directly push to main.**

We use a concept called feature branching, where each new feature should be created on a separate branch. 

When work for the feature is complete, a pull request and merge should be performed. 

Branch names should be formatted as `type/name/feature`.

## Automation

### CI Pipeline
On push, the following automatically happens:

- `npm test` runs unit tests.
- `npm run lint` runs the linter.
- `npm run build-docs` attempts to build jsdoc documentation. 

### Changelog
With the addition of Coventional Commit enforced messages, our changelog is now automatically updated on any push to `main`.

## Communication

- **Slack:** Our primary communication platform. Please check Slack regularly for updates.
- **Meetings:** We expect to meet 3-4 times a week. If you cannot attend, please notify the team in advance.
