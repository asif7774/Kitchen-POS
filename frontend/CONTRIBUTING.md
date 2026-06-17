# Contributing to Vital

First off, thank you for considering contributing to Vital! It's people like you that make the open source community such an amazing place to learn, inspire, and create.

## 🤝 Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to **asif.ansari7774@gmail.com**.

## 🚀 Getting Started

1.  **Fork** the repository on GitHub.
2.  **Clone** your fork locally:
    ```bash
    git clone https://github.com/your-username/vital.git
    cd vital
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Start the development server**:
    ```bash
    npm run dev
    ```

## 🛠 Development Workflow

1.  Create a new branch for your feature or fix:
    ```bash
    git checkout -b feature/amazing-feature
    # or
    git checkout -b fix/annoying-bug
    ```
2.  Make your changes.
3.  Ensure your code follows the project's style and passes all checks.

### Code Style & Standards

This project uses **ESLint** and **Prettier** to enforce code quality and formatting.

-   **TypeScript**: We use Strict mode. Avoid `any` types whenever possible.
-   **React**: Use Functional Components and Hooks. This template is optimized for React 19.
-   **Styling**: Use **Tailwind CSS**. 
    -   Use utility classes for layout and spacing.
    -   Use the pre-defined component classes (e.g., `.btn-primary`, `.card`) for consistent UI elements.
    -   Follow the Atomic Design structure for components.
-   **SVGs**: Use the SVG Sprite system as described in `SVG_SPRITE_GUIDE.md`.

### Quality Checks

Before committing, please run the following commands to ensure everything is correct:

```bash
# Run the linter
npm run lint

# Run type checking
npm run tsc

# Run tests
npm run test
```

We use `lint-staged`, so these checks (and Prettier formatting) will automatically run on staged files when you commit.

## 🧪 Testing

We use **Vitest** for testing.

-   Write unit tests for utility functions and complex components.
-   Run tests using `npm run test`.
-   You can run the UI for tests using `npm run test:ui`.

## 📬 Submitting a Pull Request

1.  Push your branch to your fork:
    ```bash
    git push origin feature/amazing-feature
    ```
2.  Open a **Pull Request** on the main repository.
3.  Provide a clear title and description of your changes.
4.  Link any relevant issues (e.g., "Fixes #123").
5.  Wait for review. We may ask for changes or clarifications.

## 🐛 Reporting Bugs

If you find a bug, please create an issue with:
1.  A clear title.
2.  Steps to reproduce.
3.  Expected vs. actual behavior.
4.  Your environment details (OS, Browser, Node version).

## 💡 Feature Requests

We welcome ideas for new features! Please open an issue to discuss your idea before submitting a PR to ensure it aligns with the project goals.

---

**Happy Coding!** 🚀
