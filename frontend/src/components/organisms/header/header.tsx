import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "hooks/useAuth";

import { SvgIcon } from "components/atoms/svg-sprite-loader";

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", requiresAuth: true, icon: "home" },
    { name: "About Us", href: "/about", requiresAuth: false, icon: "info" },
    { name: "Contact Us", href: "/contact", requiresAuth: false, icon: "mail" },
    { name: "Icons", href: "/icons", requiresAuth: false, icon: "wrench" },
    {
      name: "Components",
      href: "/components",
      requiresAuth: false,
      icon: "collection",
    },
  ];

  const filteredNavigation = navigation.filter(
    (item) => !item.requiresAuth || isAuthenticated,
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className="bg-white shadow-sm border-b border-gray-200"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="shrink-0">
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="flex items-center"
              aria-label="Vital Home"
            >
              <SvgIcon
                name="logo"
                width="32"
                height="32"
                className="text-blue-600"
                aria-hidden={true}
              />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Vital
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav
            id="navigation"
            className="hidden md:flex space-x-8"
            role="navigation"
            aria-label="Main navigation"
          >
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center ${
                  isActive(item.href)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <SvgIcon
                  name={item.icon}
                  width="16"
                  height="16"
                  className="mr-2"
                />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <SvgIcon
                      name="user"
                      width="20"
                      height="20"
                      className="text-gray-600"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                  title="Logout"
                  aria-label="Logout from Vital"
                >
                  <SvgIcon
                    name="logout"
                    width="20"
                    height="20"
                    aria-hidden={true}
                  />
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <SvgIcon
                  name="close"
                  width="24"
                  height="24"
                  aria-hidden={true}
                />
              ) : (
                <SvgIcon
                  name="menu"
                  width="24"
                  height="24"
                  aria-hidden={true}
                />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <nav
              className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200"
              role="navigation"
              aria-label="Mobile navigation"
            >
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-base font-medium flex items-center ${
                    isActive(item.href)
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                  }}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  <SvgIcon
                    name={item.icon}
                    width="20"
                    height="20"
                    className="mr-3"
                  />
                  {item.name}
                </Link>
              ))}
              {isAuthenticated && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center px-3 py-2">
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <SvgIcon
                        name="user"
                        width="20"
                        height="20"
                        className="text-gray-600"
                      />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {user?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                    aria-label="Logout from Vital"
                  >
                    Logout
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
