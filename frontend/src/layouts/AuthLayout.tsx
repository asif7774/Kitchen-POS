import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "hooks/useAuth";

import Header from "components/organisms/header";
import Footer from "components/organisms/footer";
import Navigation from "components/organisms/navigation";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Navigation
              </h2>
              <Navigation isSidebar={true} />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <main className="bg-white rounded-lg shadow-sm">{children}</main>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AuthLayout;
