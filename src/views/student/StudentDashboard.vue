<template>
  <AppLayout>
    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- ── Attendance Analytics Hero ─────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        <!-- Circular Progress Card -->
        <div class="card flex flex-col items-center justify-center py-6 lg:col-span-1"
          style="background: linear-gradient(135deg, #1a1040 0%, #2d1b69 100%); border: 1px solid #4c2fa0;">
          <!-- SVG Circular Progress -->
          <div class="relative w-36 h-36 mb-4">
            <svg class="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
              <!-- Track -->
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2d2660" stroke-width="3"/>
              <!-- 75% goal marker -->
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#4c2fa0" stroke-width="1"
                stroke-dasharray="75 25" stroke-dashoffset="0" stroke-linecap="round"/>
              <!-- Progress arc -->
              <circle cx="18" cy="18" r="15.9" fill="none"
                :stroke="attendanceStatus.color"
                stroke-width="3.5"
                :stroke-dasharray="`${Math.min(100, parseFloat(overall.percentage))} 100`"
                stroke-linecap="round"
                style="transition: stroke-dasharray 1s ease, stroke 0.5s;"/>
            </svg>
            <!-- Center text -->
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-black" :style="{ color: attendanceStatus.color }">
                {{ overall.percentage }}%
              </span>
              <span class="text-xs font-bold mt-0.5" :style="{ color: attendanceStatus.color }">
                {{ attendanceStatus.label }}
              </span>
            </div>
          </div>

          <!-- Stats row -->
          <div class="flex gap-6 text-center">
            <div>
              <p class="text-xl font-black text-emerald-400">{{ overall.present }}</p>
              <p class="text-xs" style="color: #8b7db0;">Present</p>
            </div>
            <div style="width: 1px; background: #2d2660;"></div>
            <div>
              <p class="text-xl font-black text-red-400">{{ overall.absent }}</p>
              <p class="text-xs" style="color: #8b7db0;">Absent</p>
            </div>
            <div style="width: 1px; background: #2d2660;"></div>
            <div>
              <p class="text-xl font-black" style="color: #a78bfa;">{{ overall.total }}</p>
              <p class="text-xs" style="color: #8b7db0;">Total</p>
            </div>
          </div>
        </div>

        <!-- 75% Goal Tracker -->
        <div class="card lg:col-span-2 flex flex-col justify-center"
          style="background: #1b163d; border: 1px solid #2d2660;">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style="background: rgba(113,72,252,0.2);">
              <svg class="w-4 h-4" style="color: #7148fc;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="font-bold" style="color: #e9d5ff;">75% Goal Tracker</h3>
          </div>

          <!-- Safe -->
          <div v-if="parseFloat(overall.percentage) >= 75" class="rounded-xl p-4"
            style="background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.3);">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🎯</span>
              <div>
                <p class="font-bold text-emerald-400">You're on track!</p>
                <p class="text-sm mt-0.5" style="color: #6ee7b7;">
                  You can afford to miss
                  <strong class="text-emerald-300">{{ canMiss }}</strong> more lecture{{ canMiss !== 1 ? 's' : '' }}
                  and still stay above 75%.
                </p>
              </div>
            </div>
          </div>

          <!-- Below 75% -->
          <div v-else class="rounded-xl p-4"
            style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);">
            <div class="flex items-center gap-3 mb-3">
              <span class="text-2xl">⚠️</span>
              <div>
                <p class="font-bold text-red-400">Attendance Shortage!</p>
                <p class="text-sm mt-0.5" style="color: #fca5a5;">
                  Attend <strong class="text-red-300">{{ needToAttend }}</strong> consecutive lecture{{ needToAttend !== 1 ? 's' : '' }} to reach 75%.
                </p>
              </div>
            </div>
            <!-- Mini progress to 75% -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs" style="color: #8b7db0;">
                <span>Current: {{ overall.percentage }}%</span>
                <span>Goal: 75%</span>
              </div>
              <div class="w-full rounded-full h-2" style="background: #2d2660;">
                <div class="h-2 rounded-full transition-all duration-700"
                  style="background: linear-gradient(90deg, #ef4444, #f97316);"
                  :style="{ width: `${Math.min(100, (parseFloat(overall.percentage) / 75) * 100)}%` }">
                </div>
              </div>
            </div>
          </div>

          <!-- Subject defaulter warnings -->
          <div v-if="defaulterSubjects.length" class="mt-4 space-y-2">
            <p class="text-xs font-bold uppercase tracking-wider" style="color: #6b5fa0;">Subjects Below 75%</p>
            <div v-for="sub in defaulterSubjects" :key="sub.subject?._id"
              class="flex items-center justify-between px-3 py-2 rounded-lg"
              style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);">
              <span class="text-sm font-medium" style="color: #fca5a5;">{{ sub.subject?.name }}</span>
              <span class="text-xs font-bold text-red-400">{{ sub.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── OTP Entry Card ──────────────────────────────── -->
      <div class="card mb-6 border-2" :class="otpSuccess ? 'border-emerald-300 bg-emerald-50' : 'border-brand-100'">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <h3 class="font-bold text-surface-900">Mark Attendance via OTP</h3>
        </div>

        <!-- Success state -->
        <div v-if="otpSuccess" class="text-center py-4">
          <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p class="font-bold text-emerald-700 text-lg">Attendance Marked!</p>
          <p class="text-sm text-emerald-600 mt-1">You are marked Present ✓</p>
          <button @click="otpSuccess = false; otpForm.code = ''" class="mt-3 text-xs text-surface-400 hover:text-surface-600 underline">
            Mark another subject
          </button>
        </div>

        <!-- Entry form -->
        <div v-else>
          <AlertMessage :message="otpAlert.msg" :type="otpAlert.type" class="mb-4" />

          <div class="flex flex-col sm:flex-row gap-3 items-end">
            <div class="flex-1">
              <label class="label">Subject</label>
              <select v-model="otpForm.subjectId" class="input">
                <option value="">— Select Subject —</option>
                <option v-for="s in subjects" :key="s._id" :value="s._id">
                  {{ s.name }} ({{ s.code }})
                </option>
              </select>
            </div>

            <div class="w-full sm:w-52">
              <label class="label">OTP Code</label>
              <div class="relative">
                <input
                  v-model="otpForm.code"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="6"
                  class="input text-center text-2xl font-black tracking-[0.4em] pr-10"
                  placeholder="······"
                  @keyup.enter="verifyOTP"
                />
                <button v-if="otpForm.code" @click="otpForm.code = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300 hover:text-surface-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <button
              @click="verifyOTP"
              :disabled="verifying || !otpForm.code || otpForm.code.length < 6 || !otpForm.subjectId"
              class="btn-success w-full sm:w-auto px-6 py-2.5 justify-center"
            >
              <svg v-if="verifying" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ verifying ? 'Verifying...' : 'Submit OTP' }}
            </button>
          </div>

          <p class="text-xs text-surface-400 mt-3">
            Enter the 6-digit code shared by your teacher to mark yourself present.
          </p>
        </div>
      </div>

      <!-- Subject-wise breakdown + chart -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <!-- Doughnut chart -->
        <div class="card">
          <h3 class="font-bold text-surface-900 mb-4">Attendance Overview</h3>
          <div class="flex items-center justify-center">
            <div class="w-52 h-52">
              <Doughnut v-if="chartData" :data="chartData" :options="chartOptions" />
              <div v-else class="flex items-center justify-center h-full text-surface-300 text-sm">No data yet</div>
            </div>
          </div>
          <div class="flex justify-center gap-6 mt-4">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span class="text-sm text-surface-600">Present ({{ overall.present }})</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-red-400"></div>
              <span class="text-sm text-surface-600">Absent ({{ overall.absent }})</span>
            </div>
          </div>
        </div>

        <!-- Subject breakdown -->
        <div class="card">
          <h3 class="font-bold text-surface-900 mb-4">Subject-wise Attendance</h3>
          <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
            <div v-for="sub in bySubject" :key="sub.subject?._id"
              class="p-3 rounded-xl border border-surface-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <p class="text-sm font-semibold text-surface-900">{{ sub.subject?.name }}</p>
                  <p class="text-xs text-surface-400">{{ sub.present }}/{{ sub.total }} classes</p>
                </div>
                <span :class="parseFloat(sub.percentage) >= 75 ? 'text-emerald-600' : 'text-red-500'"
                  class="text-base font-black">{{ sub.percentage }}%</span>
              </div>
              <div class="w-full bg-surface-100 rounded-full h-1.5">
                <div
                  class="h-1.5 rounded-full transition-all duration-700"
                  :class="parseFloat(sub.percentage) >= 75 ? 'bg-emerald-500' : 'bg-red-400'"
                  :style="{ width: `${Math.min(100, sub.percentage)}%` }"
                ></div>
              </div>
              <p v-if="parseFloat(sub.percentage) < 75" class="text-xs text-red-500 mt-1.5">
                ⚠ Need {{ Math.max(0, Math.ceil((0.75 * sub.total - sub.present) / 0.25)) }} more classes to reach 75%
              </p>
            </div>
            <p v-if="!bySubject.length" class="text-sm text-surface-400 text-center py-6">No attendance data yet</p>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import { studentAPI, subjectAPI, otpAPI } from '../../services/api'

ChartJS.register(ArcElement, Tooltip, Legend)

const loading    = ref(true)
const verifying  = ref(false)
const otpSuccess = ref(false)
const overall    = ref({ total: 0, present: 0, absent: 0, percentage: '0.0' })
const bySubject  = ref([])
const subjects   = ref([])
const otpForm    = ref({ subjectId: '', code: '' })
const otpAlert   = ref({ msg: '', type: 'success' })

const chartData = computed(() => {
  if (!overall.value.total) return null
  return {
    labels: ['Present', 'Absent'],
    datasets: [{
      data: [overall.value.present, overall.value.absent],
      backgroundColor: ['#22c55e', '#f87171'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }
})

// ── Attendance analytics computed ─────────────────────────────
const attendanceStatus = computed(() => {
  const pct = parseFloat(overall.value.percentage)
  if (pct >= 75) return { label: 'Safe',      color: '#4ade80' }
  if (pct >= 60) return { label: 'Warning',   color: '#fb923c' }
  return              { label: 'Defaulter',  color: '#ef4444' }
})

// How many more lectures can be missed and stay ≥75%
const canMiss = computed(() => {
  const { present, total } = overall.value
  if (!total) return 0
  // present / (total + x) >= 0.75 → x <= present/0.75 - total
  return Math.max(0, Math.floor(present / 0.75 - total))
})

// How many consecutive lectures needed to reach 75%
const needToAttend = computed(() => {
  const { present, total } = overall.value
  if (!total) return 0
  // (present + x) / (total + x) >= 0.75 → x >= (0.75*total - present) / 0.25
  return Math.max(0, Math.ceil((0.75 * total - present) / 0.25))
})

// Subjects below 75%
const defaulterSubjects = computed(() =>
  bySubject.value.filter(s => parseFloat(s.percentage) < 75)
)

const chartOptions = {
  responsive: true,
  cutout: '72%',
  plugins: { legend: { display: false }, tooltip: { callbacks: {
    label: (ctx) => ` ${ctx.label}: ${ctx.raw} classes`
  }}},
}

const showOtpAlert = (msg, type = 'success') => {
  otpAlert.value = { msg, type }
  setTimeout(() => otpAlert.value.msg = '', 4000)
}

const verifyOTP = async () => {
  if (!otpForm.value.code || otpForm.value.code.length < 6 || !otpForm.value.subjectId) return
  verifying.value = true
  try {
    const { data } = await otpAPI.verify(otpForm.value)
    if (data.success) {
      otpSuccess.value = true
      otpForm.value = { subjectId: '', code: '' }
      fetchAttendance()
    }
  } catch (e) {
    showOtpAlert(e.response?.data?.message || 'Invalid or expired OTP', 'error')
  } finally {
    verifying.value = false
  }
}

const fetchAttendance = async () => {
  try {
    const { data } = await studentAPI.myAttendance()
    overall.value   = data.overall
    bySubject.value = data.bySubject
  } catch (e) { console.error(e) }
}

onMounted(async () => {
  try {
    const profile = await studentAPI.myProfile()
    const studentClass = profile.data.student?.class
    const [, subRes] = await Promise.all([
      fetchAttendance(),
      subjectAPI.getAll(studentClass ? { class: studentClass } : {}),
    ])
    subjects.value = subRes.data.subjects
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>
