import { Button } from '../../../components/atoms';
import React from 'react';
import { SvgIcon } from '../../../components/atoms/svg-sprite-loader';

interface HeaderProps {
  isSidebarPermanent: boolean;
  onOpenMobileDrawer: () => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarPermanent, onOpenMobileDrawer }) => (
  <header className="h-[72px] flex items-center px-4 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10 relative">

    {/* Hamburger — only when sidebar is NOT permanently visible */}
    {!isSidebarPermanent && (
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenMobileDrawer}
        aria-label="Open navigation"
        className="mr-3 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <SvgIcon name="menu" width="24" height="24" />
      </Button>
    )}

    {/* Header Content */}
    <div className="flex-1 flex justify-between items-center">
      {!isSidebarPermanent && (
        <span className="font-bold text-xl text-gray-800">Kitchen POS</span>
      )}
      {isSidebarPermanent && (
        <div className="text-gray-500 text-sm font-medium">
          Dashboard
        </div>
      )}

      {/* Placeholders for user profile, shift status, etc. */}
      <div className="flex items-center space-x-4">
        {/* Placeholder for future header items */}
      </div>
    </div>
  </header>
);

export default Header;
