<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto">

      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-xl font-black text-surface-900">My Profile</h2>
        <p class="text-sm text-surface-400 mt-0.5">Your personal and academic details</p>
      </div>

      <LoadingSpinner v-if="loading" />

      <div v-else-if="!student" class="card text-center py-16">
        <svg class="w-12 h-12 mx-auto mb-3 text-surface-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
        <p class="font-semibold text-surface-400">Profile not found</p>
        <p class="text-sm text-surface-300 mt-1">Please contact admin.</p>
      </div>

      <template v-else>
        <!-- Profile card -->
        <div class="card mb-5">

          <!-- Avatar + name row -->
          <div class="flex items-center gap-5 mb-6 pb-6 border-b border-surface-100">
            <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white flex-shrink-0 shadow-md"
              :class="avatarColor">
              {{ student.name?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-xl font-black text-surface-900 truncate">{{ student.name }}</h3>
              <p class="text-sm text-surface-500 mt-0.5 font-mono">Roll No: {{ student.roll }}</p>
              <div class="flex items-center gap-2 mt-2 flex-wrap">
                <span :class="['text-xs font-bold px-2.5 py-0.5 rounded-full border', getClassChip(student.class)]">
                  {{ student.class }}
                </span>
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  🎓 Student
                </span>
              </div>
            </div>
          </div>

          <!-- Details grid — read view -->
          <div v-if="!editing" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p class="label">Full Name</p>
                <p class="text-sm font-semibold text-surface-800">{{ student.name }}</p>
              </div>
              <div>
                <p class="label">Roll Number</p>
                <p class="text-sm font-mono font-bold text-surface-800 bg-surface-50 px-2 py-1 rounded-lg inline-block border border-surface-100">
                  {{ student.roll }}
                </p>
              </div>
              <div>
                <p class="label">Email</p>
                <p class="text-sm text-surface-700">{{ student.email || '—' }}</p>
              </div>
              <div>
                <p class="label">Phone</p>
                <p class="text-sm text-surface-700">{{ student.phone || '—' }}</p>
              </div>
              <div>
                <p class="label">Username</p>
                <p class="text-sm font-mono text-surface-600 bg-surface-50 px-2 py-1 rounded-lg inline-block border border-surface-100">
                  {{ user?.username }}
                </p>
              </div>
              <div>
                <p class="label">Member Since</p>
                <p class="text-sm text-surface-700">{{ formatDate(student.createdAt) }}</p>
              </div>
            </div>

            <div class="pt-4 flex gap-3">
              <button @click="startEdit" class="btn-primary">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit Contact
              </button>
              <router-link to="/change-password" class="btn-secondary">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
                Change Password
              </router-link>
            </div>
          </div>

          <!-- Edit form — only email + phone editable -->
          <form v-else @submit.prevent="saveProfile" class="space-y-4">
            <AlertMessage :message="alert.msg" :type="alert.type" class="mb-2" />

            <!-- Read-only fields -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p class="label">Full Name</p>
                <p class="text-sm font-semibold text-surface-500">{{ student.name }} <span class="text-xs text-surface-300">(read-only)</span></p>
              </div>
              <div>
                <p class="label">Roll Number</p>
                <p class="text-sm font-mono text-surface-500">{{ student.roll }} <span class="text-xs text-surface-300">(read-only)</span></p>
              </div>
            </div>

            <!-- Editable fields -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="label">Email</label>
                <input v-model="form.email" type="email" class="input" placeholder="your@email.com" />
              </div>
              <div>
                <label class="label">Phone</label>
                <input v-model="form.phone" type="tel" class="input" placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="submit" :disabled="saving" class="btn-primary">
                <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
              <button type="button" @click="cancelEdit" class="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>

        <!-- Attendance card -->
        <div class="card">
          <h3 class="font-bold text-surface-900 mb-5 flex items-center gap-2">
            <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            Attendance Summary
          </h3>

          <!-- Stat boxes -->
          <div class="grid grid-cols-3 gap-3 mb-5">
            <div class="text-center p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p class="text-2xl font-black text-surface-900">{{ attendance.total }}</p>
              <p class="text-xs text-surface-400 mt-0.5">Total</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <p class="text-2xl font-black text-emerald-600">{{ attendance.present }}</p>
              <p class="text-xs text-emerald-500 mt-0.5">Present</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-red-50 border border-red-100">
              <p class="text-2xl font-black text-red-500">{{ attendance.absent }}</p>
              <p class="text-xs text-red-400 mt-0.5">Absent</p>
            </div>
          </div>

          <!-- Progress bar -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-semibold text-surface-500">Overall Attendance</span>
              <span class="text-sm font-black"
                :class="parseFloat(attendance.percentage) >= 75 ? 'text-emerald-600' : 'text-red-500'">
                {{ attendance.percentage }}%
              </span>
            </div>
            <div class="w-full bg-surface-100 rounded-full h-2.5">
              <div class="h-2.5 rounded-full transition-all duration-700"
                :class="parseFloat(attendance.percentage) >= 75 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-rose-400'"
                :style="{ width: `${Math.min(100, parseFloat(attendance.percentage))}%` }">
              </div>
            </div>
            <div class="flex items-center gap-1.5 mt-2">
              <span v-if="parseFloat(attendance.percentage) >= 75"
                class="text-xs text-emerald-600 font-semibold">✓ Good standing — above 75%</span>
              <span v-else
                class="text-xs text-red-500 font-semibold">⚠ Below 75% — attendance shortage</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import { studentAPI } from '../../services/api'
import { useAuth } from '../../stores/auth'
import { getClassChip } from '../../utils/constants'

const { user } = useAuth()
const loading  = ref(true)
const editing  = ref(false)
const saving   = ref(false)
const student  = ref(null)
const attendance = ref({ total: 0, present: 0, absent: 0, percentage: '0.0' })
const alert    = ref({ msg: '', type: 'success' })
const form     = ref({ email: '', phone: '' })

const showAlert = (msg, type = 'success') => {
  alert.value = { msg, type }
  setTimeout(() => { alert.value.msg = '' }, 4000)
}

const startEdit = () => {
  form.value = { email: student.value.email || '', phone: student.value.phone || '' }
  editing.value = true
}

const cancelEdit = () => {
  editing.value = false
  alert.value = { msg: '', type: 'success' }
}

const saveProfile = async () => {
  saving.value = true
  try {
    const { data } = await studentAPI.updateMyProfile(form.value)
    student.value = data.student
    editing.value = false
    showAlert('Contact details updated ✓')
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to update', 'error')
  } finally { saving.value = false }
}

const avatarColor = computed(() => {
  const colors = {
    FYCS: 'bg-blue-500',    FYIT: 'bg-indigo-500',
    SYCS: 'bg-violet-500',  SYIT: 'bg-purple-500',
    TYCS: 'bg-emerald-500', TYIT: 'bg-teal-500',
  }
  return colors[student.value?.class] || 'bg-brand-500'
})

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  : '—'

onMounted(async () => {
  try {
    const [profileRes, attRes] = await Promise.all([
      studentAPI.myProfile(),
      studentAPI.myAttendance(),
    ])
    student.value    = profileRes.data.student
    attendance.value = attRes.data.overall
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
