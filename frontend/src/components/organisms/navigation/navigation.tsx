import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "hooks/useAuth";

// Removed Heroicons - using SVG sprite instead
import { SvgIcon } from "components/atoms/svg-sprite-loader";

interface NavigationProps {
  isSidebar?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ isSidebar = false }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const publicNavigation = [
    { name: "Home", href: "/", icon: "home" },
    { name: "About Us", href: "/about", icon: "users" },
    { name: "Contact Us", href: "/contact", icon: "phone" },
  ];

  const authNavigation = [
    { name: "Tables", href: "/tables", icon: "home" },
    { name: "Order", href: "/order/0", icon: "clipboard-list" },
    { name: "Menu", href: "/menu", icon: "folder" },
    { name: "Inventory", href: "/inventory", icon: "clipboard-list" },
    { name: "Reports", href: "/reports", icon: "chart-bar" },
    { name: "Settings", href: "/settings", icon: "settings" },
  ];

  const navigation = isAuthenticated ? authNavigation : publicNavigation;

  const isActive = (path: string) => location.pathname === path;

  const baseClasses = isSidebar ? "space-y-1" : "flex space-x-8";

  const linkClasses = (active: boolean) => {
    const base = isSidebar
      ? "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
      : "px-3 py-2 rounded-md text-sm font-medium transition-colors";

    let activeStyles: string;
    if (active) {
      activeStyles = isSidebar
        ? "bg-blue-100 text-blue-900"
        : "text-blue-600 bg-blue-50";
    } else {
      activeStyles = isSidebar
        ? "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50";
    }

    return `${base} ${activeStyles}`;
  };

  const iconClasses = isSidebar ? "mr-3 h-5 w-5 flex-shrink-0" : "hidden";

  return (
    <nav className={baseClasses}>
      {navigation.map((item) => {
        const active = isActive(item.href);

        return (
          <Link key={item.name} to={item.href} className={linkClasses(active)}>
            <SvgIcon
              name={item.icon}
              width="20"
              height="20"
              className={iconClasses}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
};

export default Navigation;
