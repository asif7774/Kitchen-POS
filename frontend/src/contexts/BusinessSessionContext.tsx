import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BusinessSession } from '../types/models';
import { api } from '../lib/ipc';

interface BusinessSessionContextType {
  activeSession: BusinessSession | null;
  isLoading: boolean;
  startSession: (staffId: number, notes?: string) => Promise<{ ok: boolean; error?: string }>;
  closeSession: (sessionId: number, staffId: number, notes?: string) => Promise<{ ok: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

const BusinessSessionContext = createContext<BusinessSessionContextType | undefined>(undefined);

export const BusinessSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<BusinessSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await api.businessSession.getActive();
    if (res.success) {
      setActiveSession(res.data ?? null);
    }
    setIsLoading(false);
  }, []);

  // Initial load — runs once on mount, async so setState is not synchronous
  useEffect(() => {
    let cancelled = false;
    api.businessSession.getActive().then(res => {
      if (cancelled) { return; }
      if (res.success) { setActiveSession(res.data ?? null); }
      setIsLoading(false);
    }).catch(() => { setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const startSession = useCallback(async (staffId: number, notes?: string) => {
    const res = await api.businessSession.start({ staffId, notes });
    if (res.success && res.data) {
      setActiveSession(res.data);
      return { ok: true };
    }
    return { ok: false, error: res.error ?? 'Failed to start session' };
  }, []);

  const closeSession = useCallback(async (sessionId: number, staffId: number, notes?: string) => {
    const res = await api.businessSession.close({ sessionId, staffId, notes });
    if (res.success) {
      setActiveSession(null);
      return { ok: true };
    }
    return { ok: false, error: res.error ?? 'Failed to close session' };
  }, []);

  return (
    <BusinessSessionContext.Provider value={{ activeSession, isLoading, startSession, closeSession, refresh }}>
      {children}
    </BusinessSessionContext.Provider>
  );
};

export function useBusinessSession(): BusinessSessionContextType {
  const ctx = useContext(BusinessSessionContext);
  if (!ctx) { throw new Error('useBusinessSession must be used within BusinessSessionProvider'); }
  return ctx;
}
