# Components

This directory contains the highly reusable, fully accessible UI components for the Vital project. The architecture follows **Atomic Design** principles to ensure modularity and scalability.

## 🏗 Architecture (Atomic Design)

- **`atoms/`**: The basic building blocks of the UI. These components are simple, single-purpose, and rely strictly on props (e.g., `Button`, `Tooltip`, `LazyImage`). They do not manage complex state or context.
- **`molecules/`**: Slightly more complex components formed by grouping atoms together (e.g., input fields with labels, search bars).
- **`organisms/`**: Complex, distinct sections of the interface made up of molecules and atoms. These components often handle their own local state, use React Context, or manage sophisticated DOM interactions (e.g., `Modal`, `Toast`, `Dropdown`, `Tabs`).

## 🧩 Built-in UI Components

We have implemented a suite of advanced, robust components from scratch without relying on heavy third-party positioning libraries (like Popper.js or Floating UI).

### 1. Toast (`organisms/toast`)
A fully accessible toast notification system.
- Uses `role="alert"` and `role="status"`.
- Operated via `ToastContext` and the `useToast` hook.

### 2. Modal (`organisms/modal`)
A robust dialog component.
- Built using the native HTML5 `<dialog>` element.
- Inherently traps focus, manages the Escape key, and provides perfect WCAG semantics out of the box.
- Triggered globally via `ModalContext`.

### 3. Tooltip (`atoms/tooltip`)
A zero-dependency, hover-activated tooltip.
- Uses **React Portals** (`createPortal`) to render directly into `document.body` so it is never clipped by `overflow: hidden` containers.
- Dynamically attaches `aria-describedby` to the trigger element for screen readers.

### 4. Dropdown (`organisms/dropdown`)
A smart dropdown menu with viewport collision detection.
- Uses React Portals to prevent clipping.
- Automatically calculates available screen space using `getBoundingClientRect()`. If it touches the bottom of the viewport, it smoothly flips to open upwards.
- Full keyboard support (`Enter` to open, `ArrowUp`/`ArrowDown` to navigate items, `Escape` to close).

### 5. Tabs (`organisms/tabs`)
An accessible tab container.
- Implements strict W3C ARIA roles (`tablist`, `tab`, `tabpanel`).
- Full keyboard support (arrow keys cycle through tabs).
- Smooth CSS transition animations without breaking accessibility trees.

## 📝 Guidelines for New Components

When building a new component for this directory, please adhere to these strict guidelines:

1. **Zero Dependencies**: Try to avoid installing external libraries unless absolutely necessary. Rely on native CSS, HTML5, and React features.
2. **WCAG Compliance by Default**: Every component must be fully accessible. This means managing focus rings (`focus-visible`), providing correct ARIA roles, and ensuring the component can be operated completely via the keyboard.
3. **Avoid `overflow` Issues**: For overlays (modals, popovers, tooltips, dropdowns), always use React Portals (`createPortal(..., document.body)`) to escape the DOM hierarchy.
4. **Style with Tailwind**: Use inline Tailwind utility classes. Maintain the aesthetic set by the global `index.css`.
