<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-900 via-brand-900 to-brand-700 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
      <div class="text-center mb-6">
        <div class="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900">Change Your Password</h2>
        <p class="text-sm text-gray-500 mt-1">Your password was reset. Please set a new one to continue.</p>
      </div>

      <div v-if="error" class="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ error }}</div>
      <div v-if="success" class="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{{ success }}</div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="label">Current Password</label>
          <input v-model="form.current" type="password" class="input" required />
        </div>
        <div>
          <label class="label">New Password</label>
          <input v-model="form.newPwd" type="password" class="input" placeholder="Min 4 characters" required />
        </div>
        <div>
          <label class="label">Confirm New Password</label>
          <input v-model="form.confirm" type="password" class="input" required />
        </div>
        <button type="submit" :disabled="loading" class="btn-primary w-full justify-center py-3">
          {{ loading ? 'Saving...' : 'Save New Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../services/api'

const router  = useRouter()
const form    = ref({ current:'', newPwd:'', confirm:'' })
const loading = ref(false)
const error   = ref('')
const success = ref('')

const submit = async () => {
  error.value = ''
  if (form.value.newPwd !== form.value.confirm) { error.value='Passwords do not match.'; return }
  if (form.value.newPwd.length < 4) { error.value='Min 4 characters.'; return }
  loading.value = true
  try {
    await authAPI.changePassword({ currentPassword: form.value.current, newPassword: form.value.newPwd })
    success.value = 'Password changed! Redirecting...'
    // Update localStorage flag
    const user = JSON.parse(localStorage.getItem('user')||'{}')
    user.mustChangePassword = false
    localStorage.setItem('user', JSON.stringify(user))
    setTimeout(() => {
      const dash = { admin:'/admin', teacher:'/teacher', student:'/student' }
      router.push(dash[user.role] || '/login')
    }, 1200)
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to change password.'
  } finally { loading.value=false }
}
</script>
