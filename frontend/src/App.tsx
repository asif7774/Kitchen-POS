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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {return <Navigate to="/login" replace />;}
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
