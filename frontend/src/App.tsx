import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { api } from './lib/ipc';

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
import CustomerHistoryPage from './pages/CustomerHistory';
import ComponentsPage from './pages/Components';
import PastOrdersPage from './pages/PastOrders';
import OpenShiftModal from './components/organisms/modal/OpenShiftModal';
import AppLayout from './layouts/AppLayout';
import SetupPage from './pages/Setup';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSetupComplete = useAuthStore((state) => state.isSetupComplete);
  const activeShift = useAuthStore((state) => state.activeShift);
  const fetchActiveShift = useAuthStore((state) => state.fetchActiveShift);
  const [isChecking, setIsChecking] = React.useState(isAuthenticated);

  const [isShiftTrackingEnabled, setIsShiftTrackingEnabled] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    if (isAuthenticated) {
      Promise.all([
        fetchActiveShift(),
        api.settings.get()
      ]).then(([_, settingsRes]) => {
        if (active) {
          if (settingsRes.success && settingsRes.data) {
            setIsShiftTrackingEnabled((settingsRes.data as Record<string, unknown>).is_shift_tracking_enabled !== false);
          }
          setIsChecking(false);
        }
      }).catch(() => {
        if (active) { setIsChecking(false); }
      });
    } else {
      setTimeout(() => { 
        if (active) { setIsChecking(false); } 
      }, 0);
    }
    return () => { active = false; };
  }, [isAuthenticated, fetchActiveShift]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (isSetupComplete === false) {
    return <Navigate to="/setup" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isShiftTrackingEnabled && !activeShift) {
    return <OpenShiftModal />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/components" element={<ComponentsPage />} />
      <Route path="/login" element={
        useAuthStore(state => state.isSetupComplete) === false 
          ? <Navigate to="/setup" replace /> 
          : <LoginPage />
      } />
      <Route path="/setup" element={<SetupPage />} />
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
        path="/customers/:id/history" 
        element={
          <ProtectedRoute>
            <CustomerHistoryPage />
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
