import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from 'components/organisms/navigation/Sidebar';
import Header from 'components/organisms/navigation/Header';

const SIDEBAR_W = 260;
const COLLAPSED_W = 72;

interface Props {
  children: React.ReactNode;
}

const AppLayout: React.FC<Props> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1025);
  const [isPointerFine, setIsPointerFine] = useState(
    () => window.matchMedia('(pointer: fine)').matches
  );

  useEffect(() => {
    const handleResize = () => { setIsDesktop(window.innerWidth >= 1025); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const handler = (e: MediaQueryListEvent) => { setIsPointerFine(e.matches); };
    mq.addEventListener('change', handler);
    return () => { mq.removeEventListener('change', handler); };
  }, []);

  // Permanent = wide screen AND fine pointer (mouse/trackpad). iPads always drawer.
  const isSidebarPermanent = isDesktop && isPointerFine;
  const sidebarWidth = isCollapsed ? COLLAPSED_W : SIDEBAR_W;

  const handleToggle = useCallback(() => { setIsCollapsed(c => !c); }, []);
  const handleOpen = useCallback(() => { setIsMobileOpen(true); }, []);
  const handleClose = useCallback(() => { setIsMobileOpen(false); }, []);

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">

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
        className="flex-1 flex flex-col h-screen transition-[margin-left] duration-300 overflow-hidden"
        style={{ marginLeft: isSidebarPermanent ? `${sidebarWidth}px` : 0 }}
      >
        <Header
          isSidebarPermanent={isSidebarPermanent}
          onOpenMobileDrawer={handleOpen}
        />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>

    </div>
  );
};

export default AppLayout;
