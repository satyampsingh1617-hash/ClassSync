<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-lg font-bold text-surface-900">My Profile</h2>
      <p class="text-sm text-surface-500">Your personal and academic details</p>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="!student" class="card text-center py-16 text-surface-400">
      <svg class="w-12 h-12 mx-auto mb-3 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
      <p class="font-medium">Profile not found</p>
      <p class="text-sm mt-1">Please contact admin.</p>
    </div>

    <div v-else class="max-w-2xl space-y-5">

      <!-- Avatar + name card -->
      <div class="card flex items-center gap-5">
        <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white flex-shrink-0"
          :class="avatarColor">
          {{ student.name?.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-black text-surface-900 truncate">{{ student.name }}</h3>
          <div class="flex flex-wrap items-center gap-2 mt-1">
            <span :class="['class-chip text-xs font-bold', getClassChip(student.class)]">
              {{ student.class }}
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              Student
            </span>
          </div>
          <p class="text-sm text-surface-400 mt-1 font-mono">Roll: {{ student.roll }}</p>
        </div>
      </div>

      <!-- Details grid -->
      <div class="card">
        <p class="text-xs font-bold text-surface-400 uppercase tracking-wider mb-4">Academic Details</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1">
            <p class="text-xs font-semibold text-surface-400 uppercase tracking-wide">Full Name</p>
            <p class="text-sm font-semibold text-surface-900">{{ student.name }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-semibold text-surface-400 uppercase tracking-wide">Roll Number</p>
            <p class="text-sm font-mono font-bold text-surface-900 bg-surface-100 px-2 py-0.5 rounded-lg inline-block">
              {{ student.roll }}
            </p>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-semibold text-surface-400 uppercase tracking-wide">Class</p>
            <span :class="['class-chip text-xs font-bold', getClassChip(student.class)]">
              {{ student.class }}
            </span>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-semibold text-surface-400 uppercase tracking-wide">Username</p>
            <p class="text-sm font-mono text-surface-700">{{ user?.username }}</p>
          </div>
        </div>
      </div>

      <!-- Contact details -->
      <div class="card">
        <p class="text-xs font-bold text-surface-400 uppercase tracking-wider mb-4">Contact Details</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1">
            <p class="text-xs font-semibold text-surface-400 uppercase tracking-wide">Email</p>
            <p class="text-sm text-surface-700">
              {{ student.email || '—' }}
            </p>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-semibold text-surface-400 uppercase tracking-wide">Phone</p>
            <p class="text-sm text-surface-700">
              {{ student.phone || '—' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Attendance summary -->
      <div class="card">
        <p class="text-xs font-bold text-surface-400 uppercase tracking-wider mb-4">Attendance Summary</p>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="p-3 rounded-xl bg-surface-50 border border-surface-100">
            <p class="text-2xl font-black text-surface-900">{{ attendance.total }}</p>
            <p class="text-xs text-surface-400 mt-0.5">Total Classes</p>
          </div>
          <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <p class="text-2xl font-black text-emerald-600">{{ attendance.present }}</p>
            <p class="text-xs text-emerald-500 mt-0.5">Present</p>
          </div>
          <div class="p-3 rounded-xl bg-red-50 border border-red-100">
            <p class="text-2xl font-black text-red-500">{{ attendance.absent }}</p>
            <p class="text-xs text-red-400 mt-0.5">Absent</p>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-surface-500 font-medium">Overall Attendance</span>
            <span class="text-sm font-black"
              :class="parseFloat(attendance.percentage) >= 75 ? 'text-emerald-600' : 'text-red-500'">
              {{ attendance.percentage }}%
            </span>
          </div>
          <div class="w-full bg-surface-100 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-700"
              :class="parseFloat(attendance.percentage) >= 75 ? 'bg-emerald-500' : 'bg-red-400'"
              :style="{ width: `${Math.min(100, parseFloat(attendance.percentage))}%` }"
            ></div>
          </div>
          <p v-if="parseFloat(attendance.percentage) < 75" class="text-xs text-red-500 mt-1.5">
            ⚠ Below 75% — attendance shortage
          </p>
          <p v-else class="text-xs text-emerald-600 mt-1.5">✓ Good standing</p>
        </div>
      </div>

      <!-- Account info -->
      <div class="card">
        <p class="text-xs font-bold text-surface-400 uppercase tracking-wider mb-4">Account</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1">
            <p class="text-xs font-semibold text-surface-400 uppercase tracking-wide">Account Created</p>
            <p class="text-sm text-surface-700">{{ formatDate(student.createdAt) }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-semibold text-surface-400 uppercase tracking-wide">Login Username</p>
            <p class="text-sm font-mono text-surface-700 bg-surface-100 px-2 py-0.5 rounded-lg inline-block">
              {{ student.roll?.toLowerCase() }}
            </p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-surface-100">
          <router-link to="/change-password" class="btn-secondary text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
            Change Password
          </router-link>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { studentAPI } from '../../services/api'
import { useAuth } from '../../stores/auth'
import { getClassChip, CLASS_COLORS } from '../../utils/constants'

const { user } = useAuth()
const loading    = ref(true)
const student    = ref(null)
const attendance = ref({ total: 0, present: 0, absent: 0, percentage: '0.0' })

const avatarColor = computed(() => {
  const colors = {
    FYCS: 'bg-blue-500',   FYIT: 'bg-indigo-500',
    SYCS: 'bg-violet-500', SYIT: 'bg-purple-500',
    TYCS: 'bg-emerald-500',TYIT: 'bg-teal-500',
  }
  return colors[student.value?.class] || 'bg-brand-500'
})

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

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
