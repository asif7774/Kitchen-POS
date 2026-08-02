import { Button } from '../../../components/atoms';
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { SvgIcon } from '../../../components/atoms/svg-sprite-loader';
import { api } from '../../../lib/ipc';
import { useAuthStore } from '../../../store/auth';
import { useModal } from '../../../hooks/useModal';
import CloseShiftModal from '../../../pages/Settings/components/CloseShiftModal';
import { Dropdown } from '../dropdown/dropdown';

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isSidebarPermanent: boolean;
  isPointerFine: boolean;
  onCloseMobileDrawer: () => void;
  onToggleSidebar?: () => void;
}

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
  { name: "Tables", path: "/tables", icon: "grid" },
  { name: "Take Away", path: "/order/0", icon: "list" },
  { name: "KDS", path: "/kds", icon: "chef-hat" },
  { name: "Past Orders", path: "/past-orders", icon: "clock" },
  { name: "Customers", path: "/customers", icon: "users" },
  { name: "Menu", path: "/menu", icon: "book-open" },
  { name: "Inventory", path: "/inventory", icon: "inventory" },
  { name: "Expenses", path: "/expenses", icon: "dollar" },
  { name: "Reports", path: "/reports", icon: "analytics" },
  { name: "Staff", path: "/staff", icon: "user" },
  { name: "Settings", path: "/settings", icon: "settings" },
];

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
  const [isKdsEnabled, setIsKdsEnabled] = useState(true);
  const [isShiftTrackingEnabled, setIsShiftTrackingEnabled] = useState(true);
  
  const { showModal, hideModal } = useModal();
  const staff = useAuthStore(state => state.staff);
  const logout = useAuthStore(state => state.logout);

  const userMenuItems = [
    ...(isShiftTrackingEnabled ? [{
      id: 'close-shift',
      label: 'Close Shift Register',
      icon: 'clock',
      onClick: () => {
        showModal({
          title: 'Close Shift Register',
          content: <CloseShiftModal onSuccess={hideModal} />,
          actions: (
            <>
              <Button variant="ghost" onClick={hideModal}>Cancel</Button>
              <Button type="submit" form="close-shift-form" variant="danger">Reconcile & Close Shift</Button>
            </>
          ),
        });
      }
    }] : []),
    {
      id: 'logout',
      label: 'Logout',
      icon: 'logout',
      danger: true,
      onClick: () => {
        logout();
      }
    }
  ];

  React.useEffect(() => {
    const fetchSettings = () => {
      api.settings.get().then(res => {
        if (res.success && res.data) {
          const data = res.data as Record<string, unknown>;
          setIsKdsEnabled(data.is_kds_enabled !== false);
          setIsShiftTrackingEnabled(data.is_shift_tracking_enabled !== false);
        }
      }).catch(console.error);
    };
    fetchSettings();
    window.addEventListener('settings-updated', fetchSettings);
    return () => { window.removeEventListener('settings-updated', fetchSettings); };
  }, []);

  // Labels visible when: mobile open, OR desktop not-collapsed, OR desktop collapsed but hovered
  const isEffectivelyExpanded =
    !isSidebarPermanent || !isCollapsed || (isPointerFine && isHovered);

  const visibleNavItems = navItems.filter(item => {
    if (item.name === 'KDS' && !isKdsEnabled) { return false; }
    return true;
  });

  return (
    <aside
      onMouseEnter={isPointerFine ? () => { setIsHovered(true); } : undefined}
      onMouseLeave={isPointerFine ? () => { setIsHovered(false); } : undefined}
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
      <div className="flex items-center h-[72px] px-3 shrink-0 overflow-hidden border-b border-white/10">

        {/* Logo icon — always visible */}
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
          <img src="./icon.png" alt="Logo" className="w-full h-full object-cover" />
        </div>

        {/* App name — animate in/out with max-w trick */}
        <span className={[
          'ml-3 font-bold text-lg overflow-hidden whitespace-nowrap',
          'transition-all duration-300 ease-in-out',
          isEffectivelyExpanded ? 'max-w-[150px] opacity-100' : 'max-w-0 opacity-0',
        ].join(' ')}>
          Kitchen POS
        </span>

        {/* Pin/unpin toggle — desktop + pointer device + currently expanded only */}
        {isSidebarPermanent && isPointerFine && isEffectivelyExpanded && onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="ml-auto text-white/60 hover:text-white hover:bg-white/10"
            aria-label={isCollapsed ? 'Pin sidebar' : 'Collapse sidebar'}
          >
            <SvgIcon name={isCollapsed ? "pinned" : "menu"} width="20" height="20" className="opacity-70 hover:opacity-100" />
          </Button>
        )}
      </div>

      {/* ── Nav Items ─────────────────────────────────────────── */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onCloseMobileDrawer}
            className={({ isActive }) => [
              'flex items-center h-[46px] rounded-xl mx-3 relative group cursor-pointer',
              'transition-all duration-300 ease-in-out whitespace-nowrap',
              !isEffectivelyExpanded ? 'w-12' : 'w-[calc(100%-24px)]',
              isActive
                ? 'bg-white/15 text-white font-medium'
                : 'text-white/60 hover:text-white hover:bg-white/10',
            ].join(' ')}
          >
            {/* Icon — always visible, fixed width */}
            <div className="w-12 h-full flex items-center justify-center shrink-0">
              <SvgIcon name={item.icon} width="20" height="20" />
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
          </NavLink>
        ))}
      </nav>

      {/* ── User Section ──────────────────────────────────────── */}
      <div className="border-t border-white/10 shrink-0 p-3 mt-auto">
        <Dropdown items={userMenuItems} align="right" fullWidth>
          <button 
            className={[
              'flex items-center rounded-xl p-2 w-full cursor-pointer transition-colors hover:bg-white/10 relative group',
              !isEffectivelyExpanded ? 'justify-center' : ''
            ].join(' ')}
          >
            {/* Avatar / Initial */}
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {staff?.name.charAt(0).toUpperCase() ?? 'U'}
            </div>

            {/* User details — animate in/out */}
            <div className={[
              'flex flex-col ml-3 overflow-hidden transition-all duration-300 ease-in-out text-left',
              isEffectivelyExpanded ? 'max-w-[150px] opacity-100' : 'max-w-0 opacity-0',
            ].join(' ')}>
              <span className="text-sm font-medium text-white truncate leading-tight">
                {staff?.name ?? 'User'}
              </span>
              <span className="text-xs text-white/60 font-medium truncate leading-tight mt-0.5 transition-colors">
                {staff?.role ?? 'Staff'}
              </span>
            </div>

            {/* Tooltip when collapsed */}
            {!isEffectivelyExpanded && (
              <span className={[
                'absolute left-[calc(100%+8px)] px-2.5 py-1.5 z-50',
                'bg-gray-900 text-white text-xs rounded shadow-lg font-medium whitespace-nowrap',
                'opacity-0 group-hover:opacity-100 pointer-events-none',
                'transition-opacity duration-150',
                'hidden group-hover:inline-block',
              ].join(' ')}>
                {staff?.name ?? 'User'}
              </span>
            )}
          </button>
        </Dropdown>
      </div>

    </aside>
  );
};

export default Sidebar;
