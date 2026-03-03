import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, setAuthToken } from '../api/client';

type AuthState = {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      login: async (username, password) => {
        const res = await auth.login(username, password);
        setAuthToken(res.token);
        set({ token: res.token });
      },
      logout: () => {
        setAuthToken(null);
        set({ token: null });
      },
    }),
    { name: 'league-auth', partialize: (s) => ({ token: s.token }) }
  )
);

export const selectIsAuthenticated = (s: AuthState) => !!s.token;

// Sync token to API client when store updates (e.g. after persist rehydration)
useAuthStore.subscribe((state) => {
  setAuthToken(state.token);
});

// When API returns 401, clear auth so user is sent to login
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout();
  });
}
