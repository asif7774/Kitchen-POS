import { create } from 'zustand';
import { api } from '../lib/ipc';

interface Staff {
  id: number;
  name: string;
  role: string;
}

interface AuthState {
  staff: Staff | null;
  isAuthenticated: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  staff: null,
  isAuthenticated: false,
  login: async (pin: string) => {
    const res = await api.staff.login({ pin });
    if (res.success && res.data) {
      set({ staff: res.data, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => { set({ staff: null, isAuthenticated: false }); },
}));
