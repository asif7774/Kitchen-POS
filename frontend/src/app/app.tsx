import React, { Suspense } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AuthProvider } from 'contexts/AuthContext';
import { SvgSpriteLoader } from 'components/atoms/svg-sprite-loader';
import { ErrorBoundary, AppErrorFallback } from 'components/atoms/error-boundary';
import PosApp from '../App';

import { ToastProvider } from 'contexts/ToastContext';
import { ToastContainer } from 'components/organisms/toast/toast-container';

import { ModalProvider } from 'contexts/ModalContext';
import { HeaderProvider } from 'contexts/HeaderContext';
import { ModalContainer } from 'components/organisms/modal/modal-container';
import { useToast } from 'hooks/useToast';
import { api } from '../lib/ipc';

const GlobalListeners = () => {
  const { showToast } = useToast();

  React.useEffect(() => {
    api.onMenuScheduleTriggered((data: { menuId: number; menuName: string; action: 'enabled' | 'disabled' }) => {
      showToast({
        message: `Scheduled Menu: ${data.menuName} has been automatically ${data.action}.`,
        variant: 'info',
        duration: 0 // persistent
      });
    });
  }, [showToast]);

  return null;
};

// Lazy load pages for POS App
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    // Level 1: App-level error boundary — last resort for catastrophic failures
    <ErrorBoundary fallbackRender={AppErrorFallback}>
      <AuthProvider>
        <ToastProvider>
          <HeaderProvider>
          <ModalProvider>
            {/* SvgSpriteLoader wraps Router to provide context, but loading is deferred internally */}
            <SvgSpriteLoader
              url="./sprites/app-icons.svg"
              version="1.0.1"
              // eslint-disable-next-line no-console
              onLoad={import.meta.env.DEV ? () => { console.log('✅ SVG sprite loaded successfully'); } : undefined}
              onError={import.meta.env.DEV ? (error) => { console.error('❌ Failed to load SVG sprite:', error); } : undefined}
            >
              <ToastContainer />
              <ModalContainer />
              <GlobalListeners />
            <Router>
              <Suspense fallback={<LoadingSpinner />}>
                <PosApp />
              </Suspense>
          </Router>
        </SvgSpriteLoader>
          </ModalProvider>
          </HeaderProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
