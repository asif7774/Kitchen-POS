import { Button } from '../../../components/atoms';
import React from 'react';
import { SvgIcon } from '../../../components/atoms/svg-sprite-loader';
import { useLocation } from 'react-router-dom';
import { useHeader } from '../../../contexts/HeaderContext';

interface HeaderProps {
  isSidebarPermanent: boolean;
  onOpenMobileDrawer: () => void;
}

const getPageName = (pathname: string) => {
  if (pathname.startsWith('/menu')) { return 'Menu Management'; }
  if (pathname.startsWith('/inventory')) { return 'Inventory Management'; }
  if (pathname.startsWith('/staff')) { return 'Staff Management'; }
  if (pathname.startsWith('/tables')) { return 'Table Management'; }
  if (pathname.startsWith('/settings')) { return 'Settings'; }
  if (pathname.startsWith('/reports')) { return 'Reports'; }
  if (pathname.startsWith('/order')) { return 'Order Terminal'; }
  if (pathname.startsWith('/expenses')) { return 'Expenses'; }
  if (pathname.startsWith('/kds')) { return 'Kitchen Display System'; }
  if (pathname.startsWith('/components')) { return 'Components'; }
  return 'Dashboard';
};

const Header: React.FC<HeaderProps> = ({ isSidebarPermanent, onOpenMobileDrawer }) => {
  const location = useLocation();
  const { title, action } = useHeader();
  const pageName = title ?? getPageName(location.pathname);

  return (
    <header className="h-[72px] flex items-center px-4 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10 sticky top-0">

      {/* Hamburger — only when sidebar is NOT permanently visible */}
      {!isSidebarPermanent && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileDrawer}
          aria-label="Open navigation"
          className="mr-3 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <SvgIcon name="menu" width="24" height="24" />
        </Button>
      )}

      {/* Header Content */}
      <div className="flex-1 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {!isSidebarPermanent && (
            <span className="font-bold text-xl text-gray-800 hidden sm:block mr-2 border-r pr-3 border-gray-300">Kitchen POS</span>
          )}
          <h1 className="text-xl font-bold text-gray-900">{pageName}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {action}
        </div>
      </div>
    </header>
  );
};

export default Header;
