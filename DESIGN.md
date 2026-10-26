# Kitchen POS Design System

## 1. Introduction
This design system governs the Kitchen POS application, focusing on a clean, modern, and accessible user interface for restaurant management. It leverages Tailwind CSS and custom utilities for responsive and consistent design.

## 2. Design Tokens

### Colors
- **Brand Gradient:** A vibrant gradient from Emerald (`#10b981`) to Amber (`#eab308`), typically at a 134.82-degree angle.
- **Primary Text:** Emerald (`#10b981`) or Gray-900 depending on contrast needs.
- **Backgrounds:** Primarily clean white or very subtle grays (`bg-gray-50`) for the application background, with white cards for content. Dark mode utilities use `white/5` or `white/10` with text-gray-300.
- **States:**
  - Success/Brand: Emerald
  - Danger/Error: Red (`#ef4444`)
  - Warning: Amber
  - Info: Blue

### Typography
- **Base Font:** System sans-serif (Tailwind default), heavily utilizing `font-display: swap` for performance.
- **Heading Primary:** 6xl to 7xl, extra bold, tight tracking, used for major page titles.
- **Heading Secondary:** 2xl to 4xl, bold, tight tracking.
- **Body Text:** Large to XL, medium font weight, relaxed line height.

### Spacing & Layout
- **Container:** Centered responsive containers.
- **Grid:** Responsive grids (1 column mobile, 2 columns tablet, 3+ columns desktop).
- **Rounding:** Heavy use of `rounded-xl` and `rounded-lg` for cards and buttons.

## 3. Core Components

### Buttons
- **Primary Button (`.btn-primary`)**: Uses the brand gradient background, white text, large semi-bold font, `rounded-xl`, with drop shadows (`shadow-lg`). Hover states intensify the shadow and slightly shift the gradient.
- **Secondary Button (`.btn-secondary`)**: Gray-100 background, gray-800 text, monospace font, `rounded-xl`. Includes a subtle border and hover transitions.

### Cards
- **Base Card (`.card`)**: Rounded-lg, shadow-lg, relative overflow-hidden. Often uses subtle translucent backgrounds (`bg-white/5` or `bg-white`) depending on the theme.
- **Card Header (`.card-header`)**: 2xl, bold, emerald-500 text.
- **Card Body (`.card-body`)**: Base text size, relaxed line-height.

### Inputs & Forms
- Standard input fields with focus rings (`focus:ring-2 focus:ring-emerald-500 focus:outline-none`).

### Navigation
- Vertical collapsible sidebar on the left, with primary app content occupying the remaining viewport. Active items use `bg-emerald-50 text-emerald-600`.

## 4. Animation & Interactions
- **Fade In:** `animate-fade-in` (0.5s ease-in-out).
- **Slide Up:** `animate-slide-up` (0.3s ease-out).
- **Hover Lift:** `transition-transform duration-200 hover:-translate-y-1`.
- **Hover Glow:** Adds blue/emerald shadow glow on hover.
- **Reduced Motion:** Fully supports `prefers-reduced-motion` by disabling animations automatically.

## 5. Accessibility
- All interactive elements must have clear focus states (e.g. `focus-ring`).
- Visually hidden text is supported via `.sr-only`.
- Skip-links are available for keyboard navigation.
- High-contrast mode adaptations are provided natively.
