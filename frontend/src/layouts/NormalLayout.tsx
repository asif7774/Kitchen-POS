import React, { ReactNode } from 'react';

interface NormalLayoutProps {
  children: ReactNode;
}

const NormalLayout: React.FC<NormalLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default NormalLayout;
