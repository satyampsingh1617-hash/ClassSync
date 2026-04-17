<template>
  <div class="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
    <div class="w-full max-w-lg">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
          <span class="text-white font-bold text-2xl">CA</span>
        </div>
        <h1 class="text-3xl font-bold text-white">ClassSync</h1>
        <p class="text-brand-200 mt-1 text-sm">College Attendance Management System</p>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-1">Create Account</h2>
        <p class="text-sm text-gray-500 mb-6">Fill in your details to get started</p>

        <AlertMessage :message="error"   type="error"   class="mb-4" />
        <AlertMessage :message="success" type="success" class="mb-4" />

        <form @submit.prevent="handleRegister" class="space-y-4">

          <!-- Role selector -->
          <div>
            <label class="label">Select Role</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="r in roles"
                :key="r.value"
                type="button"
                @click="form.role = r.value"
                :class="[
                  'py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                  form.role === r.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                ]"
              >
                {{ r.emoji }} {{ r.label }}
              </button>
            </div>
          </div>

          <!-- Common fields -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Full Name</label>
              <input
                v-model="form.name"
                type="text"
                class="input"
                placeholder="e.g. Rahul Sharma"
                required
              />
            </div>
            <div>
              <label class="label">Username</label>
              <input
                v-model="form.username"
                type="text"
                class="input"
                placeholder="e.g. rahul123"
                required
                autocomplete="username"
              />
            </div>
          </div>

          <div>
            <label class="label">Password</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPass ? 'text' : 'password'"
                class="input pr-10"
                placeholder="Minimum 6 characters"
                required
                autocomplete="new-password"
              />
              <button
                type="button"
                @click="showPass = !showPass"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="!showPass" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Student-specific fields -->
          <template v-if="form.role === 'student'">
            <div class="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p class="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Student Details</p>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Roll Number</label>
                  <input
                    v-model="form.roll"
                    type="text"
                    class="input"
                    placeholder="e.g. CS2024001"
                    :required="form.role === 'student'"
                  />
                </div>
                <div>
                  <label class="label">Class</label>
                  <select v-model="form.studentClass" class="input" :required="form.role === 'student'">
                    <option value="">— Select Class —</option>
                    <option v-for="cls in CLASS_LIST" :key="cls" :value="cls">{{ cls }}</option>
                  </select>
                </div>
              </div>
            </div>
          </template>

          <!-- Teacher-specific fields -->
          <template v-if="form.role === 'teacher'">
            <div class="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <p class="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-3">Teacher Details</p>
              <div>
                <label class="label">Department</label>
                <select v-model="form.department" class="input">
                  <option value="">Select Department</option>
                  <option value="CS">CS (Computer Science)</option>
                  <option value="IT">IT (Information Technology)</option>
                </select>
              </div>
            </div>
          </template>

          <!-- Admin info -->
          <template v-if="form.role === 'admin'">
            <div class="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <p class="text-xs text-yellow-700">
                ⚠ Admin accounts have full system access. Use responsibly.
              </p>
            </div>
          </template>

          <div>
            <label class="label">Email <span class="text-gray-400 font-normal">(optional)</span></label>
            <input
              v-model="form.email"
              type="email"
              class="input"
              placeholder="john@college.edu"
            />
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="btn-primary w-full justify-center py-3 text-base"
            :disabled="loading"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          Already have an account?
          <router-link to="/login" class="text-brand-600 font-medium hover:underline">Sign in</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../services/api'
import { useAuth } from '../stores/auth'
import AlertMessage from '../components/AlertMessage.vue'
import { CLASS_LIST } from '../utils/constants'

const router      = useRouter()
const { setAuth } = useAuth()

const roles = [
  { value: 'student', label: 'Student', emoji: '🎓' },
  { value: 'teacher', label: 'Teacher', emoji: '👨‍🏫' },
  { value: 'admin',   label: 'Admin',   emoji: '🔑' },
]

// NOTE: using "studentClass" instead of "class" — "class" is a reserved JS keyword
const form = ref({
  role:         'student',
  name:         '',
  username:     '',
  password:     '',
  roll:         '',
  studentClass: '',   // maps to "class" field in backend via studentClass key
  department:   '',
  email:        '',
})

const loading  = ref(false)
const error    = ref('')
const success  = ref('')
const showPass = ref(false)

const handleRegister = async () => {
  // Client-side validation
  if (form.value.role === 'student' && (!form.value.roll || !form.value.studentClass)) {
    error.value = 'Roll number and class are required for student registration.'
    return
  }

  loading.value = true
  error.value   = ''
  success.value = ''

  try {
    // Send payload — backend reads "studentClass" key directly
    const payload = { ...form.value }

    const { data } = await authAPI.register(payload)

    if (data.success) {
      setAuth(data.token, data.user)
      success.value = `Account created! Welcome, ${data.user.name}. Redirecting...`
      setTimeout(() => {
        const dashMap = { admin: '/admin', teacher: '/teacher', student: '/student' }
        router.push(dashMap[data.user.role] || '/login')
      }, 1200)
    }
  } catch (err) {
    // Show backend validation errors or message
    const errData = err.response?.data
    if (errData?.errors?.length) {
      error.value = errData.errors.map(e => e.message).join(' • ')
    } else {
      error.value = errData?.message || 'Registration failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>
