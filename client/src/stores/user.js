import { defineStore } from 'pinia'
import { ref } from 'vue'
import { setToken, setUser, clearAuth, getToken, getUser } from '@/utils/auth'
import { api } from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken() || '')
  const userInfo = ref(getUser() || null)

  async function login(username, password) {
    try {
      const res = await api.login(username, password)
      const { token: newToken, user } = res.data
      token.value = newToken
      userInfo.value = user
      setToken(newToken)
      setUser(user)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    clearAuth()
  }

  const isLoggedIn = () => !!token.value

  return { token, userInfo, login, logout, isLoggedIn }
})
