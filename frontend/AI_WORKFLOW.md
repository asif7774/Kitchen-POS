# AI Agent Workflow & Best Practices

This document outlines the standard operating procedures and coding standards for any AI agent (e.g., Antigravity, Claude, Cursor) working in this repository. 

**Whenever you are invoked to write or modify code in this project, you must adhere to the following rules:**

## 1. Mandatory Verification (Lint & Build)
- **Always verify your work:** After completing a set of code changes, you MUST automatically run the following commands before completing your turn:
  1. `npm run lint`
  2. `npm run build`
- **Zero-Tolerance for Broken Builds:** Never hand back code that fails linting or the build process. If your changes introduce errors, you must fix them before finishing your task.

## 2. Strict Linting & TypeScript Compliance
- **No Linter Suppressions:** Do NOT use `eslint-disable`, `@ts-ignore`, or `@ts-expect-error` unless absolutely unavoidable and explicitly approved by the user. 
- **Proper Architectural Fixes:** If you encounter a linting or type error (such as `react-hooks/refs` or `react-hooks/immutability`), you must refactor the code to properly solve the issue (e.g., using proper JSX composition or separating hooks from context providers) rather than disabling the rule.
- **Strict Typing:** Avoid the use of `any`. Rely on strict, explicit TypeScript interfaces and types.

## 3. React Best Practices
- **No Refs During Render:** Do not pass ref objects to functions or modify them during the render phase. Use proper `useCallback` or effect patterns to handle ref merging.
- **Derived State:** Avoid setting state inside `useEffect` if it can be derived during rendering. 
- **Fast Refresh Compliance:** Ensure files exporting React components do not also export custom hooks or other non-component entities, adhering to Vite's `react-refresh/only-export-components` guidelines by splitting files when necessary.

## 4. UI & Aesthetic Standards
- **Premium Feel:** Ensure all UI components feel modern, responsive, and polished. Pay attention to accessibility (`aria` attributes), focus states, and smooth interactions.
- **Tailwind First:** Use Tailwind CSS utility classes as much as possible for styling. Strictly avoid inline styles (`style={{...}}`) unless absolutely necessary for highly dynamic calculated values (e.g., positional coordinates).
- **Component Reuse:** Always prioritize using existing global components from the `src/components/` directory (such as `<Button>`, `<Tooltip>`, `<Modal>`, etc.) instead of writing raw HTML equivalents or duplicating component logic.
- **Context Providers:** Context providers should be placed at the root of feature modules (e.g., `src/features/auth/context.tsx`) or the application entry point, not at the top level of shared libraries, to prevent conflicts with other context consumers.

## 5. Tool Usage
- Use the most specific and safe tools available for file reading and writing. 
- Do not overwrite entire files unless you are certain; prefer surgical, targeted edits where possible.

## 6. Commit Messages
- **No AI Mentions:** Never include any mention of AI agents (e.g., Claude, Cursor, Gemini, Antigravity, etc.) in your commit messages. Write commit messages strictly from the perspective of a human developer focusing on the technical changes.
- **No Co-authored-by Tags:** Do not append `Co-authored-by:` lines attributing the commit to an AI assistant or bot.

## 7. Icons & SVGs
- **Follow SVG Sprite Guidelines:** Whenever you need to add or modify an icon, you MUST read and strictly follow `SVG_SPRITE_GUIDE.md`. DO NOT inject raw SVG code directly into the sprite or React components; always use the established boilerplate workflow for icons.

*By reading this file, you agree to execute your tasks with the utmost rigor, ensuring the codebase remains clean, strictly-typed, and continuously deployable.*
