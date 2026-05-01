import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  patientId: number | null;
  role: 'ADMIN' | 'PATIENT' | null;
  fullName: string | null;
}

interface AuthState {
  token: string | null;
  user: User;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: {
        patientId: null,
        role: null,
        fullName: null,
      },
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () =>
        set({
          token: null,
          user: { patientId: null, role: null, fullName: null },
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage', // Tên key trong localStorage
    }
  )
);
