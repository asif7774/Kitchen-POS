import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';

import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import TablesPage from './pages/Tables';
import OrderPage from './pages/Order';
import MenuPage from './pages/Menu';
import InventoryPage from './pages/Inventory';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';
import ExpensesPage from './pages/Expenses/index';
import StaffPage from './pages/Staff';
import KDSPage from './pages/KDS';
import CustomersPage from './pages/Customers';
import CustomerDetailPage from './pages/CustomerDetail';
import ComponentsPage from './pages/Components';
import PastOrdersPage from './pages/PastOrders';
import OpenShiftModal from './components/organisms/modal/OpenShiftModal';
import AppLayout from './layouts/AppLayout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeShift = useAuthStore((state) => state.activeShift);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!activeShift) {
    return <OpenShiftModal />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/components" element={<ComponentsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
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
        path="/expenses" 
        element={
          <ProtectedRoute>
            <ExpensesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customers" 
        element={
          <ProtectedRoute>
            <CustomersPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customers/:id" 
        element={
          <ProtectedRoute>
            <CustomerDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/staff" 
        element={
          <ProtectedRoute>
            <StaffPage />
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
        path="/past-orders" 
        element={
          <ProtectedRoute>
            <PastOrdersPage />
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
