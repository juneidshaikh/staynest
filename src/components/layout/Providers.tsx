'use client'

import React, { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }, [])
  
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }
  
  return <>{children}</>
}

function AxiosProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, refreshToken, logout } = useAuthStore()
  
  useEffect(() => {
    // Set auth header if token exists
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    }
    
    // Response interceptor for token refresh
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          
          try {
            await refreshToken()
            const { accessToken: newToken } = useAuthStore.getState()
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`
            return axios(originalRequest)
          } catch {
            logout()
            window.location.href = '/login'
          }
        }
        
        return Promise.reject(error)
      }
    )
    
    return () => {
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [accessToken, refreshToken, logout])
  
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AxiosProvider>
          {children}
        </AxiosProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
