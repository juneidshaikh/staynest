'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthUser } from '@/types'
import axios from 'axios'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  
  login: (credentials: { email?: string; phone?: string; password?: string; otp?: string }) => Promise<void>
  loginWithGoogle: (token: string) => Promise<void>
  signup: (data: { name: string; email?: string; phone?: string; password?: string; gender?: string }) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  updateUser: (user: Partial<AuthUser>) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const { data } = await axios.post('/api/auth/login', credentials)
          if (data.success) {
            set({
              user: data.data.user,
              accessToken: data.data.accessToken,
              isAuthenticated: true,
            })
            // Set cookie via API
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`
          }
        } finally {
          set({ isLoading: false })
        }
      },

      loginWithGoogle: async (token) => {
        set({ isLoading: true })
        try {
          const { data } = await axios.post('/api/auth/google', { token })
          if (data.success) {
            set({
              user: data.data.user,
              accessToken: data.data.accessToken,
              isAuthenticated: true,
            })
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`
          }
        } finally {
          set({ isLoading: false })
        }
      },

      signup: async (signupData) => {
        set({ isLoading: true })
        try {
          const { data } = await axios.post('/api/auth/signup', signupData)
          if (data.success) {
            set({
              user: data.data.user,
              accessToken: data.data.accessToken,
              isAuthenticated: true,
            })
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`
          }
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        try {
          await axios.post('/api/auth/logout')
        } catch {}
        delete axios.defaults.headers.common['Authorization']
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      refreshToken: async () => {
        try {
          const { data } = await axios.post('/api/auth/refresh')
          if (data.success) {
            set({ accessToken: data.data.accessToken })
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`
          } else {
            get().logout()
          }
        } catch {
          get().logout()
        }
      },

      updateUser: (updatedUser) => {
        set(state => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        }))
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'staynest-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
