import React from 'react';
import { SvgIcon } from 'components/atoms/svg-sprite-loader';

const ICONS = [
  'ai', 'analytics', 'arrow-left', 'arrow-right', 'arrow-top-right', 'attachment', 
  'back-arrow', 'bell', 'calendar', 'caret-down', 'caret-left', 'caret-right', 'cart', 
  'chart-bar', 'check-circle', 'check', 'checklist', 'clients', 'clipboard-list', 'clock', 
  'close', 'copy', 'dashboard', 'default-image', 'diamond', 'dollar', 'double-check', 
  'download', 'edit', 'email', 'events', 'external-link', 'eye-off', 'eye', 'favorite', 'filter', 
  'folder', 'gift', 'graph', 'grid', 'home', 'info', 'inventory', 'job', 'launch', 'layaway', 'list', 
  'loader', 'location', 'logout', 'map-pin', 'megaphone', 'menu', 'messages', 'moon', 
  'necklace', 'notification', 'paper-plane', 'pause', 'phone', 'pinned', 'play', 
  'plus', 'save', 'search', 'send', 'settings', 'sidebar-collapse', 'sidebar-expand', 
  'sliders-vertical', 'star', 'sun', 'support', 'target', 'trash', 'trend-up', 'user', 'users', 
  'video-call', 'waitlist', 'warning', 'watch', 'workflow', 'wrench'
];

const Icons: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Icons</h1>
        <p className="text-gray-600">
          Showing {ICONS.length} available icons from the global SVG sprite.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
        {ICONS.map((iconName) => (
          <div 
            key={iconName} 
            className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
          >
            <div className="text-gray-500 group-hover:text-blue-600 mb-3 transition-colors">
              <SvgIcon name={iconName} width="32" height="32" />
            </div>
            <span className="text-xs font-medium text-gray-600 text-center break-all select-all">
              {iconName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Icons;
