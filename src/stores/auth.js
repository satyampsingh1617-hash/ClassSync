import { reactive, computed } from 'vue'

// Simple reactive auth store (no Pinia needed)
const state = reactive({
  token: localStorage.getItem('token') || null,
  user:  JSON.parse(localStorage.getItem('user') || 'null'),
})

export const useAuth = () => {
  const isLoggedIn = computed(() => !!state.token)
  const role       = computed(() => state.user?.role || null)
  const user       = computed(() => state.user)

  const setAuth = (token, user) => {
    state.token = token
    state.user  = user
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    sessionStorage.setItem('wasLoggedIn', '1')
  }

  const logout = () => {
    state.token = null
    state.user  = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('wasLoggedIn')
  }

  const isAdmin   = computed(() => state.user?.role === 'admin')
  const isTeacher = computed(() => state.user?.role === 'teacher')
  const isStudent = computed(() => state.user?.role === 'student')

  return { isLoggedIn, role, user, setAuth, logout, isAdmin, isTeacher, isStudent }
}
