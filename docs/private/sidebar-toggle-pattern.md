# Sidebar Toggle Pattern

A reusable sidebar with collapsible desktop behavior, hover-to-peek, and mobile drawer mode.

---

## Behavior

### Desktop (mouse/trackpad, width ≥ 1025px)
- Sidebar is always visible — not a drawer
- **Collapsed**: 72px wide, icons only
- **Expanded**: 260px wide, icons + labels
- Pin/unpin toggle button in sidebar header switches between states
- Hovering a collapsed sidebar temporarily expands it (hover-to-peek)
- Collapsed items show a tooltip on hover

### Mobile & Touch (phones, iPads — any touch input)
- Sidebar hidden off-screen by default
- Hamburger button in the header opens the drawer
- Slides in from the left with CSS transform animation
- Semi-transparent backdrop behind open drawer — tap to close
- **iPads always use drawer mode** regardless of screen width (detected via `pointer: fine`)

---

## File Structure

```
src/
├── layouts/
│   └── AppLayout.tsx       ← owns all state + device detection
├── components/
│   ├── Sidebar.tsx         ← pure display, receives everything as props
│   └── Header.tsx          ← shows hamburger when sidebar is not permanent
```

---

## AppLayout — State & Detection

```tsx
import React, { useState, useEffect, useCallback } from 'react';

const SIDEBAR_W = 260;
const COLLAPSED_W = 72;

const AppLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1025);
  const [isPointerFine, setIsPointerFine] = useState(
    () => window.matchMedia('(pointer: fine)').matches
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1025);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const handler = (e) => setIsPointerFine(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Permanent = wide screen AND fine pointer (mouse/trackpad). iPads always drawer.
  const isSidebarPermanent = isDesktop && isPointerFine;
  const sidebarWidth = isCollapsed ? COLLAPSED_W : SIDEBAR_W;

  const handleToggle = useCallback(() => setIsCollapsed(c => !c), []);
  const handleOpen = useCallback(() => setIsMobileOpen(true), []);
  const handleClose = useCallback(() => setIsMobileOpen(false), []);

  return (
    <div className="min-h-screen flex">

      {/* Backdrop — mobile/touch drawer only */}
      <div
        className={[
          'fixed inset-0 bg-black/40 z-30 backdrop-blur-sm',
          'transition-opacity duration-300 ease-in-out',
          !isSidebarPermanent && isMobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={handleClose}
        aria-hidden="true"
      />

      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        isSidebarPermanent={isSidebarPermanent}
        isPointerFine={isPointerFine}
        onCloseMobileDrawer={handleClose}
        onToggleSidebar={handleToggle}
      />

      {/* Main content — margin only when sidebar is permanently visible */}
      <main
        className="flex-1 flex flex-col min-h-screen transition-[margin-left] duration-300"
        style={{ marginLeft: isSidebarPermanent ? `${sidebarWidth}px` : 0 }}
      >
        <Header
          isSidebarPermanent={isSidebarPermanent}
          onOpenMobileDrawer={handleOpen}
        />
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>

    </div>
  );
};

export default AppLayout;
```

---

## Sidebar Component

```tsx
import React, { useState } from 'react';

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isSidebarPermanent: boolean;
  isPointerFine: boolean;
  onCloseMobileDrawer: () => void;
  onToggleSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isMobileOpen,
  isSidebarPermanent,
  isPointerFine,
  onCloseMobileDrawer,
  onToggleSidebar,
}) => {
  // Hover state — only meaningful on pointer (mouse/trackpad) devices
  const [isHovered, setIsHovered] = useState(false);

  // Labels visible when: mobile open, OR desktop not-collapsed, OR desktop collapsed but hovered
  const isEffectivelyExpanded =
    !isSidebarPermanent || !isCollapsed || (isPointerFine && isHovered);

  return (
    <aside
      onMouseEnter={isPointerFine ? () => setIsHovered(true) : undefined}
      onMouseLeave={isPointerFine ? () => setIsHovered(false) : undefined}
      className={[
        'fixed h-full z-50 flex flex-col bg-gray-900 text-white',
        'transition-[width,transform] duration-300 ease-in-out',
        // Slide in/out
        isSidebarPermanent || isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Width
        isSidebarPermanent && isCollapsed && !isHovered ? 'w-[72px]' : 'w-[260px]',
      ].join(' ')}
    >

      {/* ── Header: Logo + Toggle ─────────────────────────────── */}
      <div className="flex items-center h-[72px] px-3 shrink-0 overflow-hidden">

        {/* Logo icon — always visible */}
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          {/* Replace with your logo */}
          <span className="text-lg font-bold">L</span>
        </div>

        {/* App name — animate in/out with max-w trick */}
        <span className={[
          'ml-3 font-bold text-lg overflow-hidden whitespace-nowrap',
          'transition-all duration-300 ease-in-out',
          isEffectivelyExpanded ? 'max-w-[150px] opacity-100' : 'max-w-0 opacity-0',
        ].join(' ')}>
          App Name
        </span>

        {/* Pin/unpin toggle — desktop + pointer device + currently expanded only */}
        {isSidebarPermanent && isPointerFine && isEffectivelyExpanded && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="ml-auto p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={isCollapsed ? 'Pin sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PinIcon /> : <MenuIcon />}
          </button>
        )}
      </div>

      {/* ── Nav Items ─────────────────────────────────────────── */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <a
              key={item.name}
              href={item.path}
              onClick={onCloseMobileDrawer}
              className={[
                'flex items-center h-[46px] rounded-xl mx-3 relative group',
                'transition-all duration-300 ease-in-out whitespace-nowrap',
                !isEffectivelyExpanded ? 'w-12' : 'w-[calc(100%-24px)]',
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/8',
              ].join(' ')}
            >
              {/* Icon — always visible, fixed width */}
              <div className="w-12 h-full flex items-center justify-center shrink-0">
                <item.Icon size={20} />
              </div>

              {/* Label — animate in/out */}
              <span className={[
                'text-sm overflow-hidden transition-all duration-300 ease-in-out',
                isEffectivelyExpanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0',
              ].join(' ')}>
                {item.name}
              </span>

              {/* Tooltip — only when collapsed on desktop */}
              {!isEffectivelyExpanded && (
                <span className={[
                  'absolute left-[calc(100%+8px)] px-2.5 py-1.5 z-50',
                  'bg-gray-900 text-white text-xs rounded shadow-lg font-medium whitespace-nowrap',
                  'opacity-0 group-hover:opacity-100 pointer-events-none',
                  'transition-opacity duration-150',
                  'hidden group-hover:inline-block',
                ].join(' ')}>
                  {item.name}
                </span>
              )}
            </a>
          );
        })}
      </nav>

    </aside>
  );
};

export default Sidebar;
```

---

## Header Component

```tsx
interface HeaderProps {
  isSidebarPermanent: boolean;
  onOpenMobileDrawer: () => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarPermanent, onOpenMobileDrawer }) => (
  <header className="h-[72px] flex items-center px-4 border-b">

    {/* Hamburger — only when sidebar is NOT permanently visible */}
    {!isSidebarPermanent && (
      <button
        onClick={onOpenMobileDrawer}
        aria-label="Open navigation"
        className="mr-3 p-2 rounded-lg hover:bg-gray-100"
      >
        <MenuIcon />
      </button>
    )}

    {/* Rest of your header content */}
  </header>
);
```

---

## How the Key Logic Works

### `isSidebarPermanent`
```ts
const isSidebarPermanent = isDesktop && isPointerFine;
```
- `isDesktop` — `window.innerWidth >= 1025`
- `isPointerFine` — `window.matchMedia('(pointer: fine)').matches`

The `pointer: fine` check is what keeps iPads in drawer mode. An iPad at 1200px still has `pointer: coarse`, so it never gets a permanent sidebar.

### `isEffectivelyExpanded`
```ts
const isEffectivelyExpanded =
  !isSidebarPermanent || !isCollapsed || (isPointerFine && isHovered);
```

| Scenario | Result |
|---|---|
| Mobile drawer open | `!isSidebarPermanent` = true → expanded |
| Desktop, not collapsed | `!isCollapsed` = true → expanded |
| Desktop, collapsed, mouse hovering | `isPointerFine && isHovered` = true → expanded |
| Desktop, collapsed, no hover | all false → collapsed (icon-only) |

### Label animation trick
Use `max-w` + `opacity` instead of `display: none` to get a smooth CSS transition:
```tsx
className={isEffectivelyExpanded
  ? 'max-w-[160px] opacity-100'
  : 'max-w-0 opacity-0'}
```

### `marginLeft` on main content
Only applies a pixel margin when the sidebar is a permanent fixture:
```tsx
style={{ marginLeft: isSidebarPermanent ? `${sidebarWidth}px` : 0 }}
```
This ensures the drawer (mobile/touch) overlays content rather than pushing it.

---

## Dependencies

- React 18+
- Tailwind CSS (for utility classes)
- React Router v6 (for `useLocation` / `NavLink`) — optional, swap for your router
- Any icon library (Lucide, Heroicons, etc.)
