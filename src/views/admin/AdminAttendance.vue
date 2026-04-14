<template>
  <AppLayout>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-lg font-bold text-surface-900">Attendance Records</h2>
        <p class="text-sm text-surface-500">{{ records.length }} records</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button @click="generateDefaulterPDF" :disabled="generatingPDF" class="btn-danger self-start sm:self-auto">
          <svg v-if="generatingPDF" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {{ generatingPDF ? 'Generating...' : 'Defaulter PDF' }}
        </button>
        <button @click="showReport = !showReport" class="btn-secondary self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          {{ showReport ? 'Show Records' : 'Show Report' }}
        </button>
      </div>
    </div>

    <!-- Day-of-week Trends Chart -->
    <div class="card mb-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-surface-900">Attendance Trends by Day</h3>
        <span class="text-xs text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">Mon – Sat</span>
      </div>
      <Bar v-if="dayChartData" :data="dayChartData" :options="dayChartOptions" class="max-h-52" />
      <p v-else class="text-sm text-surface-400 text-center py-6">No trend data yet</p>
    </div>

    <!-- Filters -->
    <div class="card mb-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Search -->
        <div class="relative lg:col-span-2">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input v-model="search" type="text" class="input pl-9" placeholder="Search student name or roll..." />
        </div>
        <!-- Subject -->
        <select v-model="filters.subjectId" class="input">
          <option value="">All Subjects</option>
          <option v-for="s in subjects" :key="s._id" :value="s._id">{{ s.name }} ({{ s.code }})</option>
        </select>
        <!-- Date range -->
        <input v-model="filters.startDate" type="date" class="input" />
        <input v-model="filters.endDate"   type="date" class="input" />
      </div>

      <!-- Class chips -->
      <div class="flex flex-wrap gap-1.5 mt-3">
        <button @click="filters.class=''"
          :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-all',
            filters.class==='' ? 'bg-surface-800 text-white border-surface-800' : 'bg-white text-surface-600 border-surface-300 hover:border-surface-500']">
          All Classes
        </button>
        <button v-for="cls in CLASS_LIST" :key="cls"
          @click="filters.class = filters.class===cls ? '' : cls"
          :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-all',
            filters.class===cls ? getClassChip(cls) : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400']">
          {{ cls }}
        </button>
        <button @click="fetchRecords" class="btn-primary text-xs py-1 px-3 ml-auto">Apply</button>
      </div>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />

    <!-- Records Table -->
    <div v-if="!showReport" class="card p-0 overflow-hidden">
      <LoadingSpinner v-if="loading" />
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="table-th">#</th>
              <th class="table-th">Student</th>
              <th class="table-th">Roll</th>
              <th class="table-th">Subject</th>
              <th class="table-th">Topic / Slot</th>
              <th class="table-th">Date</th>
              <th class="table-th">Status</th>
              <th class="table-th">Method</th>
              <th class="table-th">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100">
            <tr v-for="(r, i) in filteredRecords" :key="r._id" class="hover:bg-surface-50 transition-colors">
              <td class="table-td text-surface-400">{{ i+1 }}</td>
              <td class="table-td">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    :class="getClassAvatar(r.studentId?.class)">
                    {{ r.studentId?.name?.charAt(0) }}
                  </div>
                  <span class="font-medium text-surface-900">{{ r.studentId?.name }}</span>
                </div>
              </td>
              <td class="table-td">
                <span class="font-mono text-xs bg-surface-100 px-2 py-0.5 rounded-lg">{{ r.studentId?.roll }}</span>
              </td>
              <td class="table-td text-surface-600">{{ r.subjectId?.name }}</td>
              <td class="table-td">
                <div class="space-y-0.5">
                  <p v-if="r.topicName" class="text-xs text-surface-700 font-medium">{{ r.topicName }}</p>
                  <p v-if="r.timeSlot"  class="text-xs text-surface-400">{{ r.timeSlot }}</p>
                  <p v-if="!r.topicName && !r.timeSlot" class="text-xs text-surface-300">—</p>
                </div>
              </td>
              <td class="table-td text-surface-500 text-xs">{{ r.date }}</td>
              <td class="table-td">
                <span :class="r.status==='Present' ? 'badge-present' : 'badge-absent'">
                  {{ r.status }}
                </span>
              </td>
              <td class="table-td">
                <span :class="['text-xs px-2 py-0.5 rounded-full font-medium',
                  r.method==='otp' ? 'bg-brand-50 text-brand-700' : 'bg-surface-100 text-surface-600']">
                  {{ r.method }}
                </span>
              </td>
              <td class="table-td">
                <!-- Lucide Trash icon -->
                <button @click="deleteRecord(r._id)"
                  class="p-1.5 rounded-lg text-surface-400 hover:text-danger hover:bg-danger-light transition-all"
                  title="Delete record">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </td>
            </tr>
            <tr v-if="!filteredRecords.length">
              <td colspan="9" class="table-td text-center text-surface-400 py-10">No records found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Report Table -->
    <div v-else class="card p-0 overflow-hidden">
      <div class="px-5 py-3 border-b border-surface-100 flex items-center justify-between">
        <p class="text-sm font-semibold text-surface-700">
          {{ filteredReport.length }} records
          <span v-if="defaulterCount > 0" class="ml-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            {{ defaulterCount }} defaulters (&lt;75%)
          </span>
        </p>
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" v-model="showDefaultersOnly" class="rounded" />
          <span class="text-surface-600">Show defaulters only</span>
        </label>
      </div>
      <LoadingSpinner v-if="loadingReport" />
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="table-th">#</th>
              <th class="table-th">Student</th>
              <th class="table-th">Roll</th>
              <th class="table-th">Class</th>
              <th class="table-th">Subject</th>
              <th class="table-th">Total</th>
              <th class="table-th">Present</th>
              <th class="table-th">Absent</th>
              <th class="table-th">Attendance %</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100">
            <tr v-for="(r, i) in displayReport" :key="i"
              class="hover:bg-surface-50 transition-colors"
              :class="parseFloat(r.percentage) < 75 ? 'bg-red-50/40' : ''">
              <td class="table-td text-surface-400">{{ i+1 }}</td>
              <td class="table-td font-medium text-surface-900">{{ r.student?.name }}</td>
              <td class="table-td">
                <span class="font-mono text-xs bg-surface-100 px-2 py-0.5 rounded-lg">{{ r.student?.roll }}</span>
              </td>
              <td class="table-td">
                <span :class="['text-xs font-bold px-2 py-0.5 rounded-full border', getClassChip(r.student?.class)]">
                  {{ r.student?.class }}
                </span>
              </td>
              <td class="table-td text-surface-600">{{ r.subject?.name }}</td>
              <td class="table-td font-medium text-center">{{ r.total }}</td>
              <td class="table-td text-center font-semibold text-emerald-600">{{ r.present }}</td>
              <td class="table-td text-center font-semibold text-red-500">{{ r.absent }}</td>
              <td class="table-td text-center">
                <span :class="[
                  'text-xs font-bold px-2.5 py-1 rounded-full',
                  parseFloat(r.percentage) >= 75
                    ? 'bg-emerald-100 text-emerald-700'
                    : parseFloat(r.percentage) >= 50
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                ]">{{ r.percentage }}%</span>
              </td>
            </tr>
            <tr v-if="!displayReport.length">
              <td colspan="9" class="table-td text-center text-surface-400 py-10">No report data</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import AppLayout from '../../components/AppLayout.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { attendanceAPI, subjectAPI } from '../../services/api'
import { CLASS_LIST, getClassChip, getClassAvatar } from '../../utils/constants'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const records           = ref([])
const report            = ref([])
const subjects          = ref([])
const loading           = ref(true)
const loadingReport     = ref(false)
const showReport        = ref(false)
const showDefaultersOnly = ref(false)
const search            = ref('')
const alert             = ref({ msg:'', type:'success' })
const filters           = ref({ subjectId:'', startDate:'', endDate:'', class:'' })
const dayTrends         = ref([])
const generatingPDF     = ref(false)

const showAlert = (msg, type='success') => {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg='', 3500)
}

const filteredRecords = computed(() => {
  let list = records.value
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(r =>
      r.studentId?.name?.toLowerCase().includes(q) ||
      r.studentId?.roll?.toLowerCase().includes(q)
    )
  }
  return list
})

const filteredReport = computed(() => {
  let list = report.value
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(r =>
      r.student?.name?.toLowerCase().includes(q) ||
      r.student?.roll?.toLowerCase().includes(q)
    )
  }
  return list
})

const defaulterCount = computed(() =>
  filteredReport.value.filter(r => parseFloat(r.percentage) < 75).length
)

const displayReport = computed(() => {
  const list = filteredReport.value
  return showDefaultersOnly.value ? list.filter(r => parseFloat(r.percentage) < 75) : list
})

// Day-of-week chart
const dayChartData = computed(() => {
  if (!dayTrends.value.length) return null
  return {
    labels: dayTrends.value.map(d => d.day),
    datasets: [
      {
        label: 'Present',
        data: dayTrends.value.map(d => d.present),
        backgroundColor: '#7148fc',
        borderRadius: 6,
      },
      {
        label: 'Absent',
        data: dayTrends.value.map(d => d.absent),
        backgroundColor: '#ef4444',
        borderRadius: 6,
      },
    ],
  }
})

const dayChartOptions = {
  responsive: true,
  plugins: { legend: { position: 'top' }, title: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
  },
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.value.subjectId)  params.subjectId  = filters.value.subjectId
    if (filters.value.startDate)  params.startDate  = filters.value.startDate
    if (filters.value.endDate)    params.endDate    = filters.value.endDate
    if (filters.value.class)      params.class      = filters.value.class
    const { data } = await attendanceAPI.getAll(params)
    records.value = data.records
  } catch { showAlert('Failed to load records','error') }
  finally { loading.value = false }
}

const fetchReport = async () => {
  loadingReport.value = true
  try {
    const params = {}
    if (filters.value.subjectId) params.subjectId = filters.value.subjectId
    if (filters.value.class)     params.class     = filters.value.class
    const { data } = await attendanceAPI.getReport(params)
    report.value = data.report
  } catch { showAlert('Failed to load report','error') }
  finally { loadingReport.value = false }
}

const fetchDayTrends = async () => {
  try {
    const { data } = await attendanceAPI.dayTrends(
      filters.value.class ? { class: filters.value.class } : {}
    )
    dayTrends.value = data.trends
  } catch { /* silent */ }
}

const deleteRecord = async (id) => {
  if (!confirm('Delete this attendance record?')) return
  try {
    await attendanceAPI.delete(id)
    showAlert('Record deleted')
    fetchRecords()
  } catch { showAlert('Delete failed','error') }
}

// ── Generate Defaulter PDF ────────────────────────────────────
const generateDefaulterPDF = async () => {
  generatingPDF.value = true
  try {
    // Always fetch fresh — never use stale report.value
    const params = {}
    if (filters.value.class) params.class = filters.value.class
    const { data } = await attendanceAPI.getReport(params)
    const reportData = data.report || []

    // Filter defaulters (<75%) — sorted by percentage ascending (worst first)
    const defaulters = reportData
      .filter(r => parseFloat(r.percentage) < 75)
      .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage))

    if (!defaulters.length) {
      showAlert('No defaulters found — all students above 75%!', 'success')
      return
    }

    // Deduplicate by student (show worst subject per student if multiple)
    // Group by student roll for cleaner PDF
    const studentMap = {}
    for (const r of defaulters) {
      const roll = r.student?.roll
      if (!studentMap[roll]) {
        studentMap[roll] = { ...r, subjects: [] }
      }
      studentMap[roll].subjects.push({
        name: r.subject?.name,
        total: r.total,
        present: r.present,
        absent: r.absent,
        percentage: r.percentage,
      })
    }

    const uniqueStudents = Object.values(studentMap)

    // Build rows — one row per student+subject combination
    const rows = defaulters.map((r, i) => `
      <tr style="border-bottom: 1px solid #e5e7eb; ${parseFloat(r.percentage) < 50 ? 'background:#fff1f2;' : ''}">
        <td style="padding: 8px 10px; text-align: center; color:#6b7280;">${i + 1}</td>
        <td style="padding: 8px 10px; font-weight:600;">${r.student?.name || '—'}</td>
        <td style="padding: 8px 10px; font-family: monospace; color:#7c3aed;">${r.student?.roll || '—'}</td>
        <td style="padding: 8px 10px;">${r.student?.class || '—'}</td>
        <td style="padding: 8px 10px; color:#374151;">${r.subject?.name || '—'}</td>
        <td style="padding: 8px 10px; text-align: center;">${r.total}</td>
        <td style="padding: 8px 10px; text-align: center; color:#16a34a; font-weight:600;">${r.present}</td>
        <td style="padding: 8px 10px; text-align: center; color:#dc2626; font-weight:600;">${r.absent}</td>
        <td style="padding: 8px 10px; text-align: center; font-weight:800; color:${parseFloat(r.percentage) < 50 ? '#dc2626' : '#ea580c'};">${r.percentage}%</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Defaulter List</title>
    <style>
      @page { size: A4 landscape; margin: 12mm 10mm; }
      body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; margin: 0; }
      .header { text-align: center; border-bottom: 3px solid #1e1b4b; padding-bottom: 10px; margin-bottom: 14px; }
      h1 { font-size: 15pt; margin: 0 0 3px; color: #1e1b4b; }
      .sub { font-size: 9pt; color: #555; margin: 0; }
      .stats { display: flex; gap: 20px; margin-bottom: 12px; }
      .stat { background: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 6px; padding: 6px 14px; font-size: 9pt; }
      .stat strong { color: #7c3aed; font-size: 12pt; display: block; }
      table { width: 100%; border-collapse: collapse; }
      thead { background: #1e1b4b; color: #fff; }
      thead th { padding: 9px 10px; text-align: left; font-size: 9pt; white-space: nowrap; }
      tbody tr:hover { background: #faf5ff; }
      .footer { margin-top: 14px; display: flex; justify-content: space-between; font-size: 8pt; color: #888; border-top: 1px solid #e5e7eb; padding-top: 6px; }
    </style></head><body>
    <div class="header">
      <h1>RKT College of Arts, Science &amp; Commerce</h1>
      <p class="sub">Department of CS &amp; IT &nbsp;|&nbsp; Attendance Defaulter Report &nbsp;|&nbsp; Students below 75%</p>
    </div>
    <div class="stats">
      <div class="stat"><strong>${defaulters.length}</strong>Defaulter Records</div>
      <div class="stat"><strong>${uniqueStudents.length}</strong>Unique Students</div>
      <div class="stat"><strong>${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</strong>Generated On</div>
      ${filters.value.class ? `<div class="stat"><strong>${filters.value.class}</strong>Class Filter</div>` : ''}
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Student Name</th><th>Roll No.</th><th>Class</th><th>Subject</th>
        <th>Total Lectures</th><th>Present</th><th>Absent</th><th>Attendance %</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <span>AttendPro — RKT College Management System</span>
      <span>Confidential — For Internal Use Only</span>
    </div>
    </body></html>`

    const win = window.open('', '_blank')
    if (!win) { showAlert('Popup blocked — allow popups and try again', 'error'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 600)
    showAlert(`PDF ready — ${defaulters.length} defaulter records`)
  } catch (e) {
    showAlert('Failed to generate PDF', 'error')
  } finally {
    generatingPDF.value = false
  }
}

watch(showReport, (val) => { if (val) fetchReport() })

onMounted(async () => {
  const { data } = await subjectAPI.getAll()
  subjects.value = data.subjects
  fetchRecords()
  fetchDayTrends()
})
</script>
