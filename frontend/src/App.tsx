import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';

import LoginPage from './pages/Login';
import TablesPage from './pages/Tables';
import OrderPage from './pages/Order';
import MenuPage from './pages/Menu';
import InventoryPage from './pages/Inventory';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';
import KDSPage from './pages/KDS';
import OpenShiftModal from './components/organisms/modal/OpenShiftModal';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeShift = useAuthStore((state) => state.activeShift);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!activeShift) {
    return <OpenShiftModal />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/tables" 
        element={
          <ProtectedRoute>
            <TablesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/order/:tableId" 
        element={
          <ProtectedRoute>
            <OrderPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/menu" 
        element={
          <ProtectedRoute>
            <MenuPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/inventory" 
        element={
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/kds" 
        element={
          <ProtectedRoute>
            <KDSPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/tables" replace />} />
    </Routes>
  );
};

export default App;
