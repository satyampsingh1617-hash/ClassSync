<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
      @click.self="$emit('close')">
      <div class="bg-white rounded-3xl shadow-card-lg w-full max-w-md border border-surface-100 overflow-hidden">

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="w-10 h-10 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin"></div>
        </div>

        <template v-else-if="data">
          <!-- Header strip -->
          <div class="relative px-6 pt-6 pb-4"
            :class="type === 'teacher' ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-gradient-to-br from-emerald-50 to-teal-50'">
            <button @click="$emit('close')"
              class="absolute top-4 right-4 p-1.5 rounded-xl text-surface-400 hover:text-surface-700 hover:bg-white/60 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <div class="flex items-center gap-4">
              <!-- Avatar -->
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0 shadow-md"
                :class="avatarClass">
                {{ data.name?.charAt(0)?.toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-lg font-black text-surface-900 truncate">{{ data.name }}</h3>
                <!-- Teacher subtitle -->
                <p v-if="type === 'teacher'" class="text-sm text-surface-500 mt-0.5">
                  {{ data.department || 'No department' }}
                </p>
                <!-- Student subtitle -->
                <div v-else class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="font-mono text-xs bg-white/70 text-surface-700 px-2 py-0.5 rounded-lg border border-surface-200">
                    {{ data.roll }}
                  </span>
                  <span :class="['text-xs font-bold px-2 py-0.5 rounded-full border', classChip(data.class)]">
                    {{ data.class }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Badges row -->
            <div class="flex gap-2 mt-3 flex-wrap">
              <span v-if="type === 'teacher'"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200/60">
                👨‍🏫 Teacher
              </span>
              <span v-if="type === 'teacher' && data.isClassTeacher"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200/60">
                🏫 Class Teacher · {{ data.assignedClass }}
              </span>
              <span v-if="type === 'student'"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200/60">
                🎓 Student
              </span>
            </div>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 space-y-4">

            <!-- Teacher details -->
            <template v-if="type === 'teacher'">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="label">Email</p>
                  <p class="text-sm text-surface-700 truncate">{{ data.email || '—' }}</p>
                </div>
                <div>
                  <p class="label">Phone</p>
                  <p class="text-sm text-surface-700">{{ data.phone || '—' }}</p>
                </div>
                <div>
                  <p class="label">Department</p>
                  <p class="text-sm text-surface-700">{{ data.department || '—' }}</p>
                </div>
                <div>
                  <p class="label">Joined</p>
                  <p class="text-sm text-surface-700">{{ formatDate(data.createdAt) }}</p>
                </div>
              </div>

              <!-- Subjects -->
              <div v-if="data.subjects?.length">
                <p class="label mb-2">Assigned Subjects</p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="s in data.subjects" :key="s._id"
                    class="text-xs px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60 font-medium">
                    {{ s.name }} <span class="opacity-60">· {{ s.class }}</span>
                  </span>
                </div>
              </div>
            </template>

            <!-- Student details -->
            <template v-else>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="label">Email</p>
                  <p class="text-sm text-surface-700 truncate">{{ data.email || '—' }}</p>
                </div>
                <div>
                  <p class="label">Phone</p>
                  <p class="text-sm text-surface-700">{{ data.phone || '—' }}</p>
                </div>
                <div>
                  <p class="label">Roll Number</p>
                  <p class="text-sm font-mono font-bold text-surface-900 bg-surface-100 px-2 py-0.5 rounded-lg inline-block">{{ data.roll }}</p>
                </div>
                <div>
                  <p class="label">Joined</p>
                  <p class="text-sm text-surface-700">{{ formatDate(data.createdAt) }}</p>
                </div>
              </div>

              <!-- Attendance bar -->
              <div v-if="data.attendance" class="p-3 rounded-xl bg-surface-50 border border-surface-100">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-xs font-bold text-surface-500 uppercase tracking-wider">Attendance</p>
                  <span class="text-sm font-black"
                    :class="parseFloat(data.attendance.percentage) >= 75 ? 'text-emerald-600' : 'text-red-500'">
                    {{ data.attendance.percentage }}%
                  </span>
                </div>
                <div class="w-full bg-surface-200 rounded-full h-2 mb-2">
                  <div class="h-2 rounded-full transition-all duration-700"
                    :class="parseFloat(data.attendance.percentage) >= 75 ? 'bg-emerald-500' : 'bg-red-400'"
                    :style="{ width: `${Math.min(100, parseFloat(data.attendance.percentage))}%` }">
                  </div>
                </div>
                <div class="flex gap-4 text-xs text-surface-500">
                  <span>✓ Present: <strong class="text-emerald-600">{{ data.attendance.present }}</strong></span>
                  <span>✗ Absent: <strong class="text-red-500">{{ data.attendance.absent }}</strong></span>
                  <span>Total: <strong>{{ data.attendance.total }}</strong></span>
                </div>
              </div>
            </template>
          </div>
        </template>

        <!-- Error state -->
        <div v-else class="text-center py-12 px-6">
          <p class="text-surface-400 text-sm">Failed to load profile.</p>
          <button @click="$emit('close')" class="btn-secondary mt-4 text-xs">Close</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { studentAPI, teacherAPI, subjectAPI } from '../services/api'
import { getClassChip } from '../utils/constants'

const props = defineProps({
  show:   { type: Boolean, default: false },
  type:   { type: String, default: 'student' }, // 'student' | 'teacher'
  itemId: { type: String, default: null },
})
defineEmits(['close'])

const loading = ref(false)
const data    = ref(null)

const avatarClass = computed(() => {
  if (props.type === 'teacher') return 'bg-gradient-to-br from-blue-500 to-indigo-600'
  const colors = {
    FYCS: 'bg-blue-500', FYIT: 'bg-indigo-500',
    SYCS: 'bg-violet-500', SYIT: 'bg-purple-500',
    TYCS: 'bg-emerald-500', TYIT: 'bg-teal-500',
  }
  return colors[data.value?.class] || 'bg-brand-500'
})

const classChip = (cls) => getClassChip(cls)

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—'

watch(() => [props.show, props.itemId], async ([show, id]) => {
  if (!show || !id) { data.value = null; return }
  loading.value = true
  data.value = null
  try {
    if (props.type === 'student') {
      const { data: res } = await studentAPI.getById(id)
      // getById returns student without attendance — fetch from getAll which includes it
      // Use the attendance already embedded if available, else default
      data.value = {
        ...res.student,
        attendance: res.student.attendance || { total: 0, present: 0, absent: 0, percentage: '0.0' }
      }
    } else {
      // Teacher — fetch profile + subjects
      const [profileRes, subjectsRes] = await Promise.all([
        teacherAPI.getById(id),
        subjectAPI.getAll({ teacherId: id }),
      ])
      data.value = {
        ...profileRes.data.teacher,
        subjects: subjectsRes.data.subjects || [],
      }
    }
  } catch { data.value = null }
  finally { loading.value = false }
}, { immediate: false })
</script>
