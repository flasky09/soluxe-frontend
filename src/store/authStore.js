import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (userData, authToken) => set({
        user: userData,
        token: authToken,
        isAuthenticated: true
      }),
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      }),
      hasRole: (role) => {
        const state = get();
        if (!state.user || !state.user.roles) return false;
        return state.user.roles.includes(role);
      }
    }),
    {
      name: 'hotel-auth-storage', // name of item in the storage (must be unique)
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
