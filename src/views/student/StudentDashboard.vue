<template>
  <AppLayout>
    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- ── Attendance Analytics Hero ─────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        <!-- Circular Progress Card -->
        <div class="card flex flex-col items-center justify-center py-6 lg:col-span-1 bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100">
          <!-- SVG Circular Progress -->
          <div class="relative w-36 h-36 mb-4">
            <svg class="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
              <!-- Track -->
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e0e7ff" stroke-width="3"/>
              <!-- 75% goal marker -->
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#c7d2fe" stroke-width="1"
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
              <p class="text-xl font-black text-emerald-600">{{ overall.present }}</p>
              <p class="text-xs text-surface-400">Present</p>
            </div>
            <div class="w-px bg-surface-200"></div>
            <div>
              <p class="text-xl font-black text-red-500">{{ overall.absent }}</p>
              <p class="text-xs text-surface-400">Absent</p>
            </div>
            <div class="w-px bg-surface-200"></div>
            <div>
              <p class="text-xl font-black text-brand-600">{{ overall.total }}</p>
              <p class="text-xs text-surface-400">Total</p>
            </div>
          </div>
        </div>

        <!-- 75% Goal Tracker -->
        <div class="card lg:col-span-2 flex flex-col justify-center">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="font-bold text-surface-900">75% Goal Tracker</h3>
          </div>

          <!-- Safe -->
          <div v-if="parseFloat(overall.percentage) >= 75" class="rounded-xl p-4 bg-emerald-50 border border-emerald-200">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🎯</span>
              <div>
                <p class="font-bold text-emerald-700">You're on track!</p>
                <p class="text-sm mt-0.5 text-emerald-600">
                  You can afford to miss
                  <strong class="text-emerald-700">{{ canMiss }}</strong> more lecture{{ canMiss !== 1 ? 's' : '' }}
                  and still stay above 75%.
                </p>
              </div>
            </div>
          </div>

          <!-- Below 75% -->
          <div v-else class="rounded-xl p-4 bg-red-50 border border-red-200">
            <div class="flex items-center gap-3 mb-3">
              <span class="text-2xl">⚠️</span>
              <div>
                <p class="font-bold text-red-700">Attendance Shortage!</p>
                <p class="text-sm mt-0.5 text-red-600">
                  Attend <strong class="text-red-700">{{ needToAttend }}</strong> consecutive lecture{{ needToAttend !== 1 ? 's' : '' }} to reach 75%.
                </p>
              </div>
            </div>
            <!-- Mini progress to 75% -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs text-surface-500">
                <span>Current: {{ overall.percentage }}%</span>
                <span>Goal: 75%</span>
              </div>
              <div class="w-full rounded-full h-2 bg-red-100">
                <div class="h-2 rounded-full transition-all duration-700 bg-gradient-to-r from-red-400 to-orange-400"
                  :style="{ width: `${Math.min(100, (parseFloat(overall.percentage) / 75) * 100)}%` }">
                </div>
              </div>
            </div>
          </div>

          <!-- Subject defaulter warnings -->
          <div v-if="defaulterSubjects.length" class="mt-4 space-y-2">
            <p class="text-xs font-bold uppercase tracking-wider text-surface-400">Subjects Below 75%</p>
            <div v-for="sub in defaulterSubjects" :key="sub.subject?._id"
              class="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 border border-red-100">
              <span class="text-sm font-medium text-red-700">{{ sub.subject?.name }}</span>
              <span class="text-xs font-bold text-red-600">{{ sub.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── OTP Entry Card ──────────────────────────────── -->
      <div class="card mb-6 border-2 transition-colors duration-300"
        :class="otpSuccess ? 'border-emerald-300 bg-emerald-50/60' : 'border-brand-100'">

        <!-- Card header -->
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-surface-900 leading-tight">Mark Attendance via OTP</h3>
            <p class="text-xs text-surface-400">Location verified at submission</p>
          </div>
        </div>

        <!-- ── SUCCESS ──────────────────────────────────────── -->
        <div v-if="otpSuccess" class="text-center py-5">
          <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p class="font-bold text-emerald-700 text-lg">Attendance Marked!</p>
          <p class="text-sm text-emerald-600 mt-1">You are marked Present ✓</p>
          <p v-if="lastDistance !== null" class="text-xs text-emerald-500 mt-1.5 flex items-center justify-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {{ lastDistance }}m from campus gate
          </p>
          <button @click="otpSuccess = false; otpForm.code = ''; lastDistance = null"
            class="mt-4 text-xs text-surface-400 hover:text-surface-600 underline">
            Mark another subject
          </button>
        </div>

        <!-- ── LOCATION ERROR BANNER ────────────────────────── -->
        <div v-else-if="locationError" class="mb-4 rounded-xl p-4 border"
          :class="{
            'bg-amber-50 border-amber-200': locationError.code === 'PERMISSION_DENIED',
            'bg-orange-50 border-orange-200': locationError.code === 'TIMEOUT',
            'bg-red-50 border-red-200': locationError.code === 'GPS_OFF' || locationError.code === 'SPOOF',
            'bg-surface-50 border-surface-200': !['PERMISSION_DENIED','TIMEOUT','GPS_OFF','SPOOF'].includes(locationError.code),
          }">
          <div class="flex items-start gap-3">
            <span class="text-2xl flex-shrink-0 mt-0.5">
              {{ { PERMISSION_DENIED: '🔒', TIMEOUT: '📡', GPS_OFF: '📍', SPOOF: '🚫' }[locationError.code] || '⚠️' }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold"
                :class="{
                  'text-amber-800': locationError.code === 'PERMISSION_DENIED',
                  'text-orange-800': locationError.code === 'TIMEOUT',
                  'text-red-800': ['GPS_OFF','SPOOF'].includes(locationError.code),
                  'text-surface-800': !['PERMISSION_DENIED','TIMEOUT','GPS_OFF','SPOOF'].includes(locationError.code),
                }">
                {{ {
                  PERMISSION_DENIED: 'Location Permission Required',
                  TIMEOUT: 'Poor GPS Signal',
                  GPS_OFF: 'GPS / Location Services Off',
                  SPOOF: 'Security Check Failed',
                }[locationError.code] || 'Location Error' }}
              </p>
              <p class="text-xs mt-1 leading-relaxed"
                :class="{
                  'text-amber-700': locationError.code === 'PERMISSION_DENIED',
                  'text-orange-700': locationError.code === 'TIMEOUT',
                  'text-red-700': ['GPS_OFF','SPOOF'].includes(locationError.code),
                  'text-surface-600': !['PERMISSION_DENIED','TIMEOUT','GPS_OFF','SPOOF'].includes(locationError.code),
                }">
                {{ locationError.message }}
              </p>
              <!-- Settings deep-link for permission denied -->
              <button v-if="locationError.code === 'PERMISSION_DENIED'"
                @click="openAppSettings"
                class="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Open App Settings
              </button>
              <button v-else
                @click="locationError = null"
                class="mt-2 text-xs font-semibold underline opacity-60 hover:opacity-100">
                Dismiss
              </button>
            </div>
          </div>
        </div>

        <!-- ── VERIFYING LOCATION SPINNER ───────────────────── -->
        <div v-else-if="fetchingLocation" class="flex flex-col items-center justify-center py-8 gap-3">
          <div class="relative">
            <div class="w-14 h-14 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <svg class="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
          </div>
          <div class="text-center">
            <p class="text-sm font-semibold text-surface-700">Verifying Location...</p>
            <p class="text-xs text-surface-400 mt-0.5">Please stay still. GPS acquiring signal.</p>
          </div>
          <!-- 10s timeout progress bar -->
          <div class="w-48 h-1.5 bg-surface-100 rounded-full overflow-hidden">
            <div class="h-full bg-brand-400 rounded-full" style="animation: locationTimeout 10s linear forwards;"></div>
          </div>
        </div>

        <!-- ── ENTRY FORM ────────────────────────────────────── -->
        <div v-else>
          <AlertMessage :message="otpAlert.msg" :type="otpAlert.type" class="mb-4" />

          <div class="flex flex-col sm:flex-row gap-3 items-end">
            <!-- Subject -->
            <div class="flex-1">
              <label class="label">Subject</label>
              <select v-model="otpForm.subjectId" class="input" :disabled="verifying">
                <option value="">— Select Subject —</option>
                <option v-for="s in subjects" :key="s._id" :value="s._id">
                  {{ s.name }} ({{ s.code }})
                </option>
              </select>
            </div>

            <!-- OTP input -->
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
                  :disabled="verifying"
                  @keyup.enter="handleSubmitOTP"
                />
                <button v-if="otpForm.code && !verifying" @click="otpForm.code = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300 hover:text-surface-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Submit button — disabled while verifying to prevent double-tap -->
            <button
              @click="handleSubmitOTP"
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
              {{ verifying ? 'Submitting...' : 'Submit OTP' }}
            </button>
          </div>

          <!-- Location info hint -->
          <div class="mt-3 flex items-center gap-2 text-xs text-surface-400">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Your location will be verified when you submit. You must be within 100m of campus.
          </div>
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
import { Chart as ChartJS, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import { studentAPI, subjectAPI, otpAPI } from '../../services/api'
import { requestLocation, GeofenceError } from '../../utils/useGeofence.js'

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController)

// ── State ─────────────────────────────────────────────────────
const loading         = ref(true)
const verifying       = ref(false)   // OTP API call in progress — blocks double-tap
const fetchingLocation = ref(false)  // GPS acquiring — shows spinner
const otpSuccess      = ref(false)
const lastDistance    = ref(null)    // metres from campus gate on success
const locationError   = ref(null)    // { code, message } — shown in error banner
const overall         = ref({ total: 0, present: 0, absent: 0, percentage: '0.0' })
const bySubject       = ref([])
const subjects        = ref([])
const otpForm         = ref({ subjectId: '', code: '' })
const otpAlert        = ref({ msg: '', type: 'success' })

// ── Chart ─────────────────────────────────────────────────────
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

const chartOptions = {
  responsive: true,
  cutout: '72%',
  plugins: { legend: { display: false }, tooltip: { callbacks: {
    label: (ctx) => ` ${ctx.label}: ${ctx.raw} classes`
  }}},
}

// ── Attendance analytics ──────────────────────────────────────
const attendanceStatus = computed(() => {
  const pct = parseFloat(overall.value.percentage)
  if (pct >= 75) return { label: 'Safe',     color: '#16a34a' }
  if (pct >= 60) return { label: 'Warning',  color: '#d97706' }
  return               { label: 'Defaulter', color: '#dc2626' }
})

const canMiss = computed(() => {
  const { present, total } = overall.value
  if (!total) return 0
  return Math.max(0, Math.floor(present / 0.75 - total))
})

const needToAttend = computed(() => {
  const { present, total } = overall.value
  if (!total) return 0
  return Math.max(0, Math.ceil((0.75 * total - present) / 0.25))
})

const defaulterSubjects = computed(() =>
  bySubject.value.filter(s => parseFloat(s.percentage) < 75)
)

// ── Helpers ───────────────────────────────────────────────────
const showOtpAlert = (msg, type = 'success') => {
  otpAlert.value = { msg, type }
  setTimeout(() => { otpAlert.value.msg = '' }, 4000)
}

// Open device app settings (works in Capacitor/Android via deep link)
const openAppSettings = () => {
  // On Android Capacitor, open app settings via intent URL
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    window.location.href = 'app-settings:'
  } else {
    // Web browser — instruct user manually
    showOtpAlert('Please allow location access in your browser/app settings, then try again.', 'info')
  }
}

// ── Main OTP submit handler ───────────────────────────────────
// Step 1: Get location → Step 2: Verify OTP with coords
const handleSubmitOTP = async () => {
  if (!otpForm.value.code || otpForm.value.code.length < 6 || !otpForm.value.subjectId) return
  if (verifying.value || fetchingLocation.value) return  // prevent double-tap

  locationError.value = null
  otpAlert.value = { msg: '', type: 'success' }

  // ── Step 1: Acquire GPS location ─────────────────────────
  fetchingLocation.value = true
  let locationData = null

  try {
    locationData = await requestLocation()
  } catch (err) {
    fetchingLocation.value = false
    if (err instanceof GeofenceError) {
      locationError.value = { code: err.code, message: err.message }
    } else {
      locationError.value = { code: 'POSITION_ERROR', message: 'Could not get your location. Please try again.' }
    }
    return
  } finally {
    fetchingLocation.value = false
  }

  // ── Step 2: Submit OTP with location to backend ───────────
  verifying.value = true
  try {
    const payload = {
      code:           otpForm.value.code,
      subjectId:      otpForm.value.subjectId,
      latitude:       locationData.latitude,
      longitude:      locationData.longitude,
      accuracy:       locationData.accuracy,
      isMockLocation: locationData.isMockLocation,
      isProxy:        locationData.isProxy,
    }

    const { data } = await otpAPI.verify(payload)

    if (data.success) {
      otpSuccess.value = true
      lastDistance.value = data.distance ?? locationData.distance ?? null
      otpForm.value = { subjectId: '', code: '' }
      fetchAttendance()
    }
  } catch (e) {
    const errCode = e.response?.data?.code
    const errMsg  = e.response?.data?.message || 'Invalid or expired OTP'

    if (errCode === 'OUT_OF_BOUNDS') {
      const dist  = e.response?.data?.distance
      const limit = e.response?.data?.limit
      locationError.value = {
        code: 'OUT_OF_BOUNDS',
        message: `You are ${dist}m from campus. Must be within ${limit}m to mark attendance.`,
      }
    } else if (errCode === 'SPOOF_DETECTED') {
      locationError.value = {
        code: 'SPOOF',
        message: 'Security check failed. Mock location or proxy detected. Disable any fake GPS apps and try again.',
      }
    } else {
      showOtpAlert(errMsg, 'error')
    }
  } finally {
    verifying.value = false
  }
}

// ── Data fetching ─────────────────────────────────────────────
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
