<template>
  <div class="min-h-screen bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 font-black text-xl text-white bg-white/20 backdrop-blur-sm border border-white/30 shadow-brand-lg">
          CA
        </div>
        <h1 class="text-3xl font-black text-white tracking-tight">AttendPro</h1>
        <p class="text-brand-200 mt-1 text-sm">College Attendance Management System</p>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-3xl shadow-card-lg p-8">
        <h2 class="text-xl font-bold text-surface-900 mb-1">Welcome back 👋</h2>
        <p class="text-sm text-surface-500 mb-6">Sign in to your account to continue</p>

        <div v-if="error" class="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-danger-light text-danger-dark border border-danger/20">
          <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          {{ error }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="label">Username</label>
            <input v-model="form.username" type="text" class="input" placeholder="Enter your username"
              autocomplete="username" required />
          </div>
          <div>
            <label class="label">Password</label>
            <div class="relative">
              <input v-model="form.password" :type="showPass ? 'text' : 'password'" class="input pr-10"
                placeholder="Enter your password" autocomplete="current-password" required />
              <button type="button" @click="showPass = !showPass"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="!showPass" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full justify-center py-3 text-base mt-2">
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <!-- Quick login -->
        <div class="mt-6 p-4 rounded-2xl bg-surface-50 border border-surface-200">
          <p class="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">Quick Login</p>
          <button @click="fill('pkc001','PKC001')"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white border border-transparent hover:border-surface-200 hover:shadow-card transition-all text-left">
            <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm flex-shrink-0">🔑</div>
            <div>
              <p class="text-xs font-bold text-surface-800">Admin — PKC001</p>
              <p class="text-xs text-surface-400">password: PKC001</p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showChangePwd" class="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-card-lg w-full max-w-sm p-8 border border-surface-200">
        <h3 class="text-lg font-bold text-surface-900 mb-1">Change Your Password</h3>
        <p class="text-sm text-surface-500 mb-5">Your password was reset. Please set a new one.</p>
        <div v-if="changePwdError" class="mb-4 px-3 py-2 rounded-xl text-sm font-medium bg-danger-light text-danger-dark border border-danger/20">
          {{ changePwdError }}
        </div>
        <div class="space-y-4">
          <div>
            <label class="label">Current Password</label>
            <input v-model="changePwd.current" type="password" class="input" />
          </div>
          <div>
            <label class="label">New Password</label>
            <input v-model="changePwd.newPwd" type="password" class="input" placeholder="Min 4 characters" />
          </div>
          <div>
            <label class="label">Confirm New Password</label>
            <input v-model="changePwd.confirm" type="password" class="input" />
          </div>
          <button @click="submitChangePwd" :disabled="changingPwd" class="btn-primary w-full justify-center py-2.5">
            {{ changingPwd ? 'Saving...' : 'Save New Password' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../services/api'
import { useAuth } from '../stores/auth'

const router      = useRouter()
const { setAuth } = useAuth()

const form     = ref({ username: '', password: '' })
const loading  = ref(false)
const error    = ref('')
const showPass = ref(false)

// Show session-expired message if redirected here by 401 interceptor
const route = useRouter().currentRoute
if (typeof window !== 'undefined') {
  const wasLoggedIn = sessionStorage.getItem('wasLoggedIn')
  if (wasLoggedIn && !localStorage.getItem('token')) {
    error.value = 'Your session has expired. Please sign in again.'
    sessionStorage.removeItem('wasLoggedIn')
  }
}

const showChangePwd  = ref(false)
const changePwd      = ref({ current: '', newPwd: '', confirm: '' })
const changingPwd    = ref(false)
const changePwdError = ref('')

const fill = (u, p) => { form.value.username = u; form.value.password = p }

const handleLogin = async () => {
  loading.value = true; error.value = ''
  try {
    const { data } = await authAPI.login(form.value)
    if (data.success) {
      setAuth(data.token, data.user)
      if (data.mustChangePassword) { showChangePwd.value = true; return }
      redirectToDash(data.user.role)
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed. Check your credentials.'
  } finally { loading.value = false }
}

const redirectToDash = (role) => {
  router.push({ admin:'/admin', teacher:'/teacher', student:'/student' }[role] || '/login')
}

const submitChangePwd = async () => {
  changePwdError.value = ''
  if (changePwd.value.newPwd !== changePwd.value.confirm) { changePwdError.value = 'Passwords do not match.'; return }
  if (changePwd.value.newPwd.length < 4) { changePwdError.value = 'Min 4 characters.'; return }
  changingPwd.value = true
  try {
    await authAPI.changePassword({ currentPassword: changePwd.value.current, newPassword: changePwd.value.newPwd })
    showChangePwd.value = false
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    user.mustChangePassword = false
    localStorage.setItem('user', JSON.stringify(user))
    redirectToDash(user.role)
  } catch (e) {
    changePwdError.value = e.response?.data?.message || 'Failed to change password.'
  } finally { changingPwd.value = false }
}
</script>
