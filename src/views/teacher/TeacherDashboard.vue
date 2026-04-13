<template>
  <AppLayout>
    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          label="My Subjects"
          :value="subjects.length"
          sub="Assigned to you"
          :icon="icons.subjects"
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatCard
          label="Today's Classes"
          :value="todayClasses"
          sub="Scheduled today"
          :icon="icons.calendar"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Active OTPs"
          :value="activeOtpCount"
          sub="Currently running"
          :icon="icons.otp"
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
      </div>

      <!-- Subjects with OTP generation -->
      <div class="card mb-6">
        <h3 class="text-base font-semibold text-gray-900 mb-4">My Subjects</h3>
        <div v-if="subjects.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="sub in subjects"
            :key="sub._id"
            class="border border-gray-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="font-semibold text-gray-900">{{ sub.name }}</h4>
                <span class="font-mono text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded mt-1 inline-block">{{ sub.code }}</span>
              </div>
              <span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{{ sub.class }}</span>
            </div>

            <!-- OTP section -->
            <div v-if="otpMap[sub._id]" class="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
              <p class="text-xs text-green-600 font-medium mb-1">Active OTP</p>
              <p class="text-3xl font-bold text-green-700 tracking-widest text-center py-1">{{ otpMap[sub._id].code }}</p>
              <p class="text-xs text-green-600 text-center">Expires: {{ formatExpiry(otpMap[sub._id].expiry) }}</p>
              <p class="text-xs text-gray-500 text-center mt-1">{{ otpMap[sub._id].usedCount || 0 }} students marked</p>
            </div>

            <div class="flex gap-2">
              <button
                @click="generateOTP(sub._id)"
                class="btn-primary flex-1 justify-center text-xs py-2"
                :disabled="generatingOtp === sub._id"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
                {{ generatingOtp === sub._id ? 'Generating...' : 'Generate OTP' }}
              </button>
              <router-link to="/teacher/attendance" class="btn-secondary text-xs py-2 px-3">
                Mark
              </router-link>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 text-center py-8">No subjects assigned to you yet.</p>
      </div>

      <!-- Recent attendance -->
      <div class="card">
        <h3 class="text-base font-semibold text-gray-900 mb-4">Recent Attendance</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="table-th">Student</th>
                <th class="table-th">Subject</th>
                <th class="table-th">Date</th>
                <th class="table-th">Status</th>
                <th class="table-th">Method</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="rec in recentRecords" :key="rec._id" class="hover:bg-gray-50">
                <td class="table-td font-medium">{{ rec.studentId?.name }}</td>
                <td class="table-td text-gray-500">{{ rec.subjectId?.code }}</td>
                <td class="table-td text-gray-500">{{ rec.date }}</td>
                <td class="table-td">
                  <span :class="rec.status === 'Present' ? 'badge-present' : 'badge-absent'">{{ rec.status }}</span>
                </td>
                <td class="table-td">
                  <span class="text-xs px-2 py-0.5 rounded-full" :class="rec.method === 'otp' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'">
                    {{ rec.method }}
                  </span>
                </td>
              </tr>
              <tr v-if="!recentRecords.length">
                <td colspan="5" class="table-td text-center text-gray-400 py-6">No recent records</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <AlertMessage :message="alert.msg" :type="alert.type" class="fixed bottom-6 right-6 max-w-sm shadow-lg" />
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import StatCard from '../../components/StatCard.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import { teacherAPI, otpAPI, attendanceAPI } from '../../services/api'

const subjects      = ref([])
const recentRecords = ref([])
const otpMap        = ref({}) // subjectId -> otp info
const loading       = ref(true)
const generatingOtp = ref(null)
const alert         = ref({ msg: '', type: 'success' })

const todayClasses  = computed(() => subjects.value.length)
const activeOtpCount = computed(() => Object.keys(otpMap.value).length)

const icons = {
  subjects: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  calendar: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
  otp:      `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>`,
}

const showAlert = (msg, type = 'success') => {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg = '', 4000)
}

const formatExpiry = (expiry) => {
  return new Date(expiry).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const generateOTP = async (subjectId) => {
  generatingOtp.value = subjectId
  try {
    const { data } = await otpAPI.generate({ subjectId, topicName: '', timeSlot: '' })
    if (data.success) {
      otpMap.value = { ...otpMap.value, [subjectId]: { code: data.otp.code, expiry: data.otp.expiry, usedCount: 0 } }
      showAlert(`OTP generated: ${data.otp.code} — valid for ${data.otp.expiryMinutes} minutes`)
      // Auto-clear after expiry
      setTimeout(() => {
        const updated = { ...otpMap.value }
        delete updated[subjectId]
        otpMap.value = updated
      }, data.otp.expiryMinutes * 60 * 1000)
    }
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to generate OTP', 'error')
  } finally {
    generatingOtp.value = null
  }
}

onMounted(async () => {
  try {
    const [subRes, attRes] = await Promise.all([
      teacherAPI.mySubjects(),
      attendanceAPI.getAll(),
    ])
    subjects.value      = subRes.data.subjects
    recentRecords.value = attRes.data.records.slice(0, 15)

    // Check for active OTPs on each subject
    const otpResults = await Promise.allSettled(
      subjects.value.map(sub => otpAPI.getActive(sub._id))
    )
    const newMap = {}
    otpResults.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.data.otp) {
        newMap[subjects.value[i]._id] = result.value.data.otp
      }
    })
    otpMap.value = newMap
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
