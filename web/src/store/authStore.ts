import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  screens: string[]
  login: (user: User, token: string, screens?: string[]) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setScreens: (screens: string[]) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      screens: [],
      login: (user, token, screens = []) => set({ user, token, isAuthenticated: true, screens }),
      logout: () => set({ user: null, token: null, isAuthenticated: false, screens: [] }),
      updateUser: (userData) => set((state) => ({ 
        user: state.user ? { ...state.user, ...userData } : null 
      })),
      setScreens: (screens) => set({ screens }),
    }),
    {
      name: 'caliza-auth',
    }
  )
)
