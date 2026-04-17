<template>
  <div class="min-h-screen flex">

    <!-- ── Left panel (decorative, desktop only) ─────────── -->
    <div class="hidden lg:flex lg:w-1/2 xl:w-2/5 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-violet-600 flex-col items-center justify-center p-12">
      <!-- Background pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
        <div class="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-white blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white blur-3xl"></div>
      </div>

      <!-- Grid dots -->
      <div class="absolute inset-0 opacity-5"
        style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 32px 32px;">
      </div>

      <div class="relative z-10 text-center text-white max-w-sm">
        <!-- Logo -->
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 mb-8 shadow-lg">
          <span class="text-3xl font-black text-white">CA</span>
        </div>

        <h1 class="text-4xl font-black tracking-tight mb-3">ClasSync</h1>
        <p class="text-brand-100 text-lg leading-relaxed mb-10">
          Smart attendance management for modern colleges
        </p>

        <!-- Feature pills -->
        <div class="space-y-3">
          <div v-for="f in features" :key="f.text"
            class="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-left">
            <span class="text-xl flex-shrink-0">{{ f.icon }}</span>
            <span class="text-sm font-medium text-white/90">{{ f.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Right panel (login form) ──────────────────────── -->
    <div class="flex-1 flex items-center justify-center p-6 bg-surface-50">
      <div class="w-full max-w-sm">

        <!-- Mobile logo -->
        <div class="lg:hidden text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 font-black text-xl text-white bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand">
            CA
          </div>
          <h1 class="text-2xl font-black text-surface-900">ClasSync</h1>
          <p class="text-surface-400 text-sm mt-1">College Attendance Management</p>
        </div>

        <!-- Form card -->
        <div class="bg-white rounded-3xl shadow-card-lg border border-surface-100 p-8">
          <div class="mb-7">
            <h2 class="text-2xl font-black text-surface-900 tracking-tight">Welcome back</h2>
            <p class="text-surface-400 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          <!-- Error -->
          <div v-if="error"
            class="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200/60">
            <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            {{ error }}
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <div>
              <label class="label">Username</label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <input v-model="form.username" type="text" class="input pl-9"
                  placeholder="Enter your username" autocomplete="username" required />
              </div>
            </div>

            <div>
              <label class="label">Password</label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <input v-model="form.password" :type="showPass ? 'text' : 'password'"
                  class="input pl-9 pr-10" placeholder="Enter your password"
                  autocomplete="current-password" required />
                <button type="button" @click="showPass = !showPass"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300 hover:text-surface-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="!showPass" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" :disabled="loading"
              class="btn-primary w-full justify-center py-3 text-base mt-1 rounded-xl">
              <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <p class="text-center text-xs text-surface-300 mt-6">
            Contact your administrator if you need access
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Change Password Modal ─────────────────────────────── -->
  <Transition name="modal">
    <div v-if="showChangePwd"
      class="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-3xl shadow-card-lg w-full max-w-sm p-8 border border-surface-100">
        <div class="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-surface-900 mb-1">Set New Password</h3>
        <p class="text-sm text-surface-400 mb-6">Your password was reset. Please choose a new one.</p>
        <div v-if="changePwdError"
          class="mb-4 px-3 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200/60">
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
  </Transition>
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

const features = [
  { icon: '📍', text: 'GPS-verified OTP attendance' },
  { icon: '📊', text: 'Real-time analytics & reports' },
  { icon: '🔔', text: 'Announcements & query system' },
  { icon: '📄', text: 'Question paper architect' },
]

// Show session-expired message if redirected here by 401 interceptor
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
  router.push({ admin: '/admin', teacher: '/teacher', student: '/student' }[role] || '/login')
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
