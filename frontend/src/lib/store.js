// src/lib/store.js
import { create } from 'zustand'
import { api } from './api.js'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('tarot_token') || null,
  loading: true,

  login: async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password })
    localStorage.setItem('tarot_token', token)
    set({ token, user })
  },

  register: async (data) => {
    const { token, user } = await api.post('/auth/register', data)
    localStorage.setItem('tarot_token', token)
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('tarot_token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    try {
      const { user } = await api.get('/auth/me')
      set({ user, loading: false })
    } catch {
      localStorage.removeItem('tarot_token')
      set({ user: null, token: null, loading: false })
    }
  },
}))

export const useReadingStore = create((set, get) => ({
  readings: [],
  currentReading: null,
  usage: null,

  fetchReadings: async () => {
    const data = await api.get('/reading')
    set({ readings: data.readings })
  },

  fetchUsage: async () => {
    const data = await api.get('/plan/usage')
    set({ usage: data })
  },

  setCurrentReading: (reading) => set({ currentReading: reading }),
}))
