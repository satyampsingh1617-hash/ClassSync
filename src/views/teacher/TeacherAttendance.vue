<template>
  <AppLayout>
    <div class="mb-5">
      <h2 class="text-lg font-bold text-surface-900">Mark Attendance</h2>
      <p class="text-sm text-surface-500">Select a subject, set lecture details, then mark or generate OTP</p>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />

    <!-- ── Step 1: Lecture Setup ─────────────────────────── -->
    <div class="card mb-5">
      <p class="text-xs font-bold text-surface-400 uppercase tracking-wider mb-4">Lecture Setup</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="label">Subject <span class="text-danger">*</span></label>
          <select v-model="selectedSubject" @change="onSubjectChange" class="input">
            <option value="">— Select Subject —</option>
            <option v-for="s in subjects" :key="s._id" :value="s._id">
              {{ s.name }} · {{ s.class }}
            </option>
          </select>
        </div>
        <div>
          <label class="label">Topic Name</label>
          <input v-model="topicName" type="text" class="input" placeholder="e.g. Arrays & Pointers" />
        </div>
        <div>
          <label class="label">Time Slot</label>
          <select v-model="timeSlot" class="input">
            <option value="">— Select Slot —</option>
            <option v-for="slot in TIME_SLOTS" :key="slot" :value="slot">{{ slot }}</option>
          </select>
        </div>
        <div>
          <label class="label">Date</label>
          <input v-model="selectedDate" type="date" class="input" />
        </div>
      </div>

      <!-- Subject info pill -->
      <div v-if="selectedSubjectObj" class="mt-3 flex items-center gap-2 flex-wrap">
        <span class="text-xs text-surface-500">Subject:</span>
        <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
          {{ selectedSubjectObj.name }} ({{ selectedSubjectObj.code }})
        </span>
        <span class="text-xs text-surface-500">Class:</span>
        <span :class="['px-2 py-0.5 rounded-full text-xs font-bold border', getClassChip(selectedSubjectObj.class)]">
          {{ selectedSubjectObj.class }}
        </span>
        <span class="text-xs text-surface-400 ml-auto">{{ students.length }} students loaded</span>
      </div>
    </div>

    <!-- ── OTP Panel ──────────────────────────────────────── -->
    <div v-if="selectedSubject" class="mb-5">

      <!-- No active OTP -->
      <div v-if="!activeOtp" class="card border-2 border-dashed border-surface-200">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 class="font-bold text-surface-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
              OTP Attendance
            </h3>
            <p class="text-sm text-surface-500 mt-1">Generate a one-time code for students to self-mark attendance</p>
            <p v-if="!topicName || !timeSlot" class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-2 inline-block">
              💡 Tip: Fill Topic Name &amp; Time Slot above for better tracking
            </p>
          </div>
          <button
            @click="generateOTP"
            :disabled="generatingOtp"
            class="btn-primary flex-shrink-0 px-6 py-2.5"
          >
            <svg v-if="generatingOtp" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            {{ generatingOtp ? 'Generating...' : 'Generate OTP' }}
          </button>
        </div>
      </div>

      <!-- Active OTP display -->
      <div v-else class="card bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
        <div class="flex flex-col sm:flex-row items-start gap-6">

          <!-- Code block -->
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-3 flex-wrap">
              <span class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE OTP
              </span>
              <span v-if="activeOtp.topicName" class="text-xs bg-white text-surface-700 px-2 py-0.5 rounded-full border border-surface-200 font-medium">
                📚 {{ activeOtp.topicName }}
              </span>
              <span v-if="activeOtp.timeSlot" class="text-xs bg-white text-surface-700 px-2 py-0.5 rounded-full border border-surface-200 font-medium">
                🕐 {{ activeOtp.timeSlot }}
              </span>
            </div>

            <!-- Big OTP code -->
            <div class="flex items-center gap-3 mb-2">
              <div class="flex gap-1.5">
                <span
                  v-for="(digit, i) in activeOtp.code.split('')" :key="i"
                  class="w-10 h-12 flex items-center justify-center text-2xl font-black text-emerald-800 bg-white rounded-xl border-2 border-emerald-200 shadow-sm"
                >{{ digit }}</span>
              </div>
              <button @click="copyOTP" class="p-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all" title="Copy OTP">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
            </div>
            <p class="text-xs text-emerald-600 font-medium">Share this code with students to mark attendance</p>

            <!-- Usage count -->
            <div class="mt-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="text-sm font-semibold text-emerald-800">
                {{ activeOtp.usedCount || 0 }} / {{ students.length }} students marked
              </span>
            </div>
          </div>

          <!-- Timer ring -->
          <div class="flex flex-col items-center gap-3 flex-shrink-0">
            <div class="relative w-20 h-20">
              <svg class="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#d1fae5" stroke-width="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none"
                  :stroke="timerPercent > 30 ? '#10b981' : timerPercent > 10 ? '#f59e0b' : '#ef4444'"
                  stroke-width="3"
                  :stroke-dasharray="`${timerPercent} 100`"
                  stroke-linecap="round"
                  style="transition: stroke-dasharray 1s linear, stroke 0.5s"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-lg font-black" :class="timerPercent > 30 ? 'text-emerald-700' : timerPercent > 10 ? 'text-amber-600' : 'text-red-600'">
                  {{ otpTimer }}
                </span>
                <span class="text-xs text-surface-400 -mt-0.5">sec</span>
              </div>
            </div>
            <button @click="deactivateOTP" class="btn-danger text-xs py-1.5 px-3">
              Stop OTP
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Students Table ─────────────────────────────────── -->
    <div v-if="selectedSubject" class="card p-0 overflow-hidden">
      <div class="px-5 py-4 border-b border-surface-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 class="font-bold text-surface-900">
            Students
            <span class="ml-1 text-sm font-normal text-surface-400">({{ students.length }})</span>
          </h3>
          <p v-if="topicName || timeSlot" class="text-xs text-surface-500 mt-0.5">
            <span v-if="topicName">📚 {{ topicName }}</span>
            <span v-if="timeSlot" class="ml-2">🕐 {{ timeSlot }}</span>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button @click="markAll('Present')" class="btn-success text-xs py-1.5 px-3">✓ All Present</button>
          <button @click="markAll('Absent')"  class="btn-danger  text-xs py-1.5 px-3">✗ All Absent</button>
          <button @click="submitBulk" :disabled="submitting || !students.length" class="btn-primary text-xs py-1.5 px-3">
            <svg v-if="submitting" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ submitting ? 'Saving...' : 'Save Attendance' }}
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="px-5 py-3 border-b border-surface-100">
        <div class="relative max-w-xs">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input v-model="studentSearch" type="text" class="input pl-9 py-1.5 text-sm" placeholder="Search student..." />
        </div>
      </div>

      <!-- Summary bar -->
      <div class="px-5 py-2 bg-surface-50 border-b border-surface-100 flex items-center gap-4 text-xs font-semibold">
        <span class="text-emerald-600">✓ Present: {{ presentCount }}</span>
        <span class="text-danger">✗ Absent: {{ absentCount }}</span>
        <span class="text-surface-400">— Unmarked: {{ unmarkedCount }}</span>
      </div>

      <LoadingSpinner v-if="loadingStudents" />
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-surface-50">
              <th class="table-th">#</th>
              <th class="table-th">Roll No.</th>
              <th class="table-th">Name</th>
              <th class="table-th text-center">Attendance</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100">
            <tr
              v-for="(s, i) in filteredStudents" :key="s._id"
              class="hover:bg-surface-50 transition-colors"
              :class="attendance[s._id] === 'Present' ? 'bg-emerald-50/30' : attendance[s._id] === 'Absent' ? 'bg-red-50/30' : ''"
            >
              <td class="table-td text-surface-400 text-xs">{{ i + 1 }}</td>
              <td class="table-td">
                <span class="font-mono text-xs bg-surface-100 text-surface-700 px-2 py-0.5 rounded-lg">{{ s.roll }}</span>
              </td>
              <td class="table-td font-medium text-surface-900">{{ s.name }}</td>
              <td class="table-td">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="attendance[s._id] = 'Present'"
                    :class="attendance[s._id] === 'Present'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm scale-105'
                      : 'border-surface-200 text-surface-400 hover:border-emerald-400 hover:text-emerald-600'"
                    class="w-9 h-8 rounded-xl text-xs font-bold border-2 transition-all"
                  >P</button>
                  <button
                    @click="attendance[s._id] = 'Absent'"
                    :class="attendance[s._id] === 'Absent'
                      ? 'bg-red-500 text-white border-red-500 shadow-sm scale-105'
                      : 'border-surface-200 text-surface-400 hover:border-red-400 hover:text-red-600'"
                    class="w-9 h-8 rounded-xl text-xs font-bold border-2 transition-all"
                  >A</button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredStudents.length">
              <td colspan="4" class="table-td text-center text-surface-400 py-10">
                {{ students.length ? 'No students match search' : 'No students in this class' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="card text-center py-20 border-2 border-dashed border-surface-200">
      <svg class="w-14 h-14 mx-auto mb-4 text-surface-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      <p class="text-base font-semibold text-surface-400">Select a subject to begin</p>
      <p class="text-sm text-surface-300 mt-1">Students will load automatically</p>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { teacherAPI, studentAPI, otpAPI, attendanceAPI } from '../../services/api'
import { TIME_SLOTS, getClassChip } from '../../utils/constants'

const subjects        = ref([])
const students        = ref([])
const selectedSubject = ref('')
const selectedDate    = ref(new Date().toISOString().split('T')[0])
const topicName       = ref('')
const timeSlot        = ref('')
const studentSearch   = ref('')
const attendance      = ref({})
const activeOtp       = ref(null)
const otpTimer        = ref(0)
const otpTotalTime    = ref(120)
const loadingStudents = ref(false)
const generatingOtp   = ref(false)
const submitting      = ref(false)
const alert           = ref({ msg: '', type: 'success' })
let timerInterval     = null

const selectedSubjectObj = computed(() =>
  subjects.value.find(s => s._id === selectedSubject.value) || null
)

const filteredStudents = computed(() => {
  if (!studentSearch.value.trim()) return students.value
  const q = studentSearch.value.toLowerCase()
  return students.value.filter(s =>
    s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q)
  )
})

const timerPercent = computed(() =>
  otpTotalTime.value > 0 ? (otpTimer.value / otpTotalTime.value) * 100 : 0
)

const presentCount  = computed(() => Object.values(attendance.value).filter(v => v === 'Present').length)
const absentCount   = computed(() => Object.values(attendance.value).filter(v => v === 'Absent').length)
const unmarkedCount = computed(() => students.value.length - presentCount.value - absentCount.value)

const showAlert = (msg, type = 'success') => {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg = '', 4000)
}

const onSubjectChange = async () => {
  if (!selectedSubject.value) { students.value = []; activeOtp.value = null; return }
  loadingStudents.value = true
  attendance.value = {}
  activeOtp.value = null
  clearInterval(timerInterval)
  try {
    const sub = subjects.value.find(s => s._id === selectedSubject.value)
    if (sub) {
      const [studRes, otpRes] = await Promise.all([
        studentAPI.getAll({ class: sub.class }),
        otpAPI.getActive(selectedSubject.value),
      ])
      students.value = studRes.data.students
      students.value.forEach(s => { attendance.value[s._id] = 'Present' })

      // Restore active OTP if one exists
      if (otpRes.data.otp) {
        activeOtp.value = otpRes.data.otp
        otpTotalTime.value = 120
        startTimer(otpRes.data.otp.expiry)
      }
    }
  } catch { showAlert('Failed to load students', 'error') }
  finally { loadingStudents.value = false }
}

const markAll = (status) => {
  students.value.forEach(s => { attendance.value[s._id] = status })
}

const generateOTP = async () => {
  if (!selectedSubject.value) return
  generatingOtp.value = true
  try {
    const { data } = await otpAPI.generate({
      subjectId: selectedSubject.value,
      topicName: topicName.value,
      timeSlot:  timeSlot.value,
    })
    if (data.success) {
      activeOtp.value    = { ...data.otp, usedCount: 0 }
      otpTotalTime.value = data.otp.expiryMinutes * 60
      startTimer(data.otp.expiry)
      showAlert(`OTP generated — valid for ${data.otp.expiryMinutes} min`)
    }
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to generate OTP', 'error')
  } finally { generatingOtp.value = false }
}

const deactivateOTP = async () => {
  if (!activeOtp.value) return
  try {
    await otpAPI.deactivate(activeOtp.value.id)
    activeOtp.value = null
    clearInterval(timerInterval)
    showAlert('OTP stopped')
  } catch { showAlert('Failed to stop OTP', 'error') }
}

const copyOTP = () => {
  if (!activeOtp.value) return
  navigator.clipboard?.writeText(activeOtp.value.code)
    .then(() => showAlert('OTP copied to clipboard!'))
    .catch(() => showAlert(`OTP: ${activeOtp.value.code}`, 'info'))
}

const startTimer = (expiry) => {
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    const remaining = Math.max(0, Math.floor((new Date(expiry) - Date.now()) / 1000))
    otpTimer.value = remaining
    if (remaining === 0) {
      clearInterval(timerInterval)
      activeOtp.value = null
      showAlert('OTP expired', 'warning')
    }
  }, 1000)
}

const submitBulk = async () => {
  if (!selectedSubject.value || !students.value.length) return
  const unmarked = students.value.filter(s => !attendance.value[s._id])
  if (unmarked.length) {
    showAlert(`${unmarked.length} students not marked — they will be saved as Absent`, 'warning')
  }
  submitting.value = true
  try {
    const records = students.value.map(s => ({
      studentId: s._id,
      status: attendance.value[s._id] || 'Absent',
    }))
    const { data } = await attendanceAPI.markBulk({
      subjectId: selectedSubject.value,
      date:      selectedDate.value,
      topicName: topicName.value,
      timeSlot:  timeSlot.value,
      records,
    })
    showAlert(`✓ Saved — ${data.results.success.length} marked, ${data.results.failed.length} skipped (already exists)`)
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to save attendance', 'error')
  } finally { submitting.value = false }
}

onMounted(async () => {
  try {
    const { data } = await teacherAPI.mySubjects()
    subjects.value = data.subjects
  } catch { showAlert('Failed to load subjects', 'error') }
})
onUnmounted(() => clearInterval(timerInterval))
</script>
