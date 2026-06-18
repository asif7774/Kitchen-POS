import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface HeaderContextType {
  title: string | null;
  action: ReactNode | null;
  setHeader: (title: string | null, action: ReactNode | null) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [title, setTitle] = useState<string | null>(null);
  const [action, setAction] = useState<ReactNode | null>(null);

  const setHeader = useCallback((newTitle: string | null, newAction: ReactNode | null) => {
    setTitle(newTitle);
    setAction(newAction);
  }, []);

  return (
    <HeaderContext.Provider value={{ title, action, setHeader }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};
