<template>
  <AppLayout>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-lg font-bold text-surface-900 flex items-center gap-2">
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          Defaulter List
        </h2>
        <p class="text-sm text-surface-500 mt-0.5">Students below 75% attendance in your subjects</p>
      </div>
      <div class="flex gap-2 flex-wrap self-start sm:self-auto">
        <button @click="generatePDF" :disabled="generatingPDF || !defaulters.length" class="btn-danger">
          <svg v-if="generatingPDF" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {{ generatingPDF ? 'Generating...' : 'Export PDF' }}
        </button>
        <button @click="fetchReport" :disabled="loading" class="btn-secondary">
          <svg class="w-4 h-4" :class="loading ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="card border-l-4 border-l-red-400">
        <p class="text-2xl font-black text-red-600">{{ defaulters.length }}</p>
        <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-0.5">Defaulters</p>
        <p class="text-xs text-surface-400 mt-1">Below 75%</p>
      </div>
      <div class="card border-l-4 border-l-orange-400">
        <p class="text-2xl font-black text-orange-600">{{ criticalCount }}</p>
        <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-0.5">Critical</p>
        <p class="text-xs text-surface-400 mt-1">Below 50%</p>
      </div>
      <div class="card border-l-4 border-l-emerald-400">
        <p class="text-2xl font-black text-emerald-600">{{ safeCount }}</p>
        <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-0.5">Safe</p>
        <p class="text-xs text-surface-400 mt-1">75% and above</p>
      </div>
      <div class="card border-l-4 border-l-brand-400">
        <p class="text-2xl font-black text-brand-600">{{ totalStudents }}</p>
        <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-0.5">Total Records</p>
        <p class="text-xs text-surface-400 mt-1">All subjects</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-5">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input v-model="search" type="text" class="input pl-9" placeholder="Search by name or roll..." />
        </div>
        <select v-model="subjectFilter" class="input sm:w-52">
          <option value="">All My Subjects</option>
          <option v-for="s in mySubjects" :key="s._id" :value="s._id">
            {{ s.name }} ({{ s.code }})
          </option>
        </select>
        <select v-model="showOnly" class="input sm:w-40">
          <option value="defaulters">Defaulters only</option>
          <option value="all">All students</option>
        </select>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else class="card p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="table-th">#</th>
              <th class="table-th">Student</th>
              <th class="table-th">Roll</th>
              <th class="table-th">Class</th>
              <th class="table-th">Subject</th>
              <th class="table-th">Present / Total</th>
              <th class="table-th">Attendance %</th>
              <th class="table-th">Needs</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100">
            <tr
              v-for="(r, i) in filteredReport" :key="`${r.student?._id}_${r.subject?._id}`"
              class="transition-colors"
              :class="parseFloat(r.percentage) < 50
                ? 'bg-red-50/60 hover:bg-red-50'
                : parseFloat(r.percentage) < 75
                  ? 'bg-orange-50/40 hover:bg-orange-50'
                  : 'hover:bg-surface-50'"
            >
              <td class="table-td text-surface-400">{{ i + 1 }}</td>

              <!-- Student -->
              <td class="table-td">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    :class="parseFloat(r.percentage) < 50
                      ? 'bg-red-100 text-red-700'
                      : parseFloat(r.percentage) < 75
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-emerald-100 text-emerald-700'">
                    {{ r.student?.name?.charAt(0)?.toUpperCase() }}
                  </div>
                  <p class="text-sm font-semibold text-surface-900">{{ r.student?.name }}</p>
                </div>
              </td>

              <td class="table-td">
                <span class="font-mono text-xs bg-surface-100 text-surface-700 px-2 py-0.5 rounded-lg">
                  {{ r.student?.roll }}
                </span>
              </td>

              <td class="table-td">
                <span :class="['text-xs font-bold px-2 py-0.5 rounded-full border', getClassChip(r.student?.class)]">
                  {{ r.student?.class }}
                </span>
              </td>

              <td class="table-td">
                <p class="text-sm text-surface-700 font-medium">{{ r.subject?.name }}</p>
                <p class="text-xs text-surface-400">{{ r.subject?.code }}</p>
              </td>

              <!-- Present / Total with mini bar -->
              <td class="table-td">
                <div class="flex items-center gap-2 min-w-28">
                  <div class="flex-1 bg-surface-100 rounded-full h-1.5">
                    <div class="h-1.5 rounded-full transition-all"
                      :class="parseFloat(r.percentage) >= 75 ? 'bg-emerald-500' : parseFloat(r.percentage) >= 50 ? 'bg-orange-400' : 'bg-red-500'"
                      :style="{ width: `${Math.min(100, parseFloat(r.percentage))}%` }">
                    </div>
                  </div>
                  <span class="text-xs text-surface-500 whitespace-nowrap">{{ r.present }}/{{ r.total }}</span>
                </div>
              </td>

              <!-- Percentage badge -->
              <td class="table-td">
                <span class="text-sm font-black px-2.5 py-1 rounded-full"
                  :class="parseFloat(r.percentage) >= 75
                    ? 'bg-emerald-100 text-emerald-700'
                    : parseFloat(r.percentage) >= 50
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-red-100 text-red-700'">
                  {{ r.percentage }}%
                </span>
              </td>

              <!-- Lectures needed to reach 75% -->
              <td class="table-td">
                <span v-if="parseFloat(r.percentage) >= 75" class="text-xs text-emerald-600 font-semibold">
                  ✓ Safe
                </span>
                <span v-else class="text-xs font-semibold text-red-600">
                  +{{ Math.ceil((0.75 * r.total - r.present) / 0.25) }} lectures
                </span>
              </td>
            </tr>

            <tr v-if="!filteredReport.length">
              <td colspan="8" class="table-td text-center py-16">
                <svg class="w-12 h-12 mx-auto mb-3 text-surface-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm font-semibold text-surface-400">
                  {{ loading ? 'Loading...' : 'No defaulters found' }}
                </p>
                <p class="text-xs text-surface-300 mt-1">All students are above 75%</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredReport.length" class="px-5 py-3 border-t border-surface-100 flex items-center justify-between">
        <p class="text-xs text-surface-500">
          Showing {{ filteredReport.length }} records
          <span v-if="showOnly === 'defaulters'" class="text-red-500 font-semibold">
            ({{ defaulters.length }} defaulters)
          </span>
        </p>
        <p class="text-xs text-surface-400">Threshold: 75%</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { attendanceAPI, teacherAPI } from '../../services/api'
import { getClassChip } from '../../utils/constants'

const report       = ref([])
const mySubjects   = ref([])
const loading      = ref(true)
const generatingPDF = ref(false)
const search       = ref('')
const subjectFilter = ref('')
const showOnly     = ref('defaulters')

// ── Computed ──────────────────────────────────────────────────
const defaulters = computed(() =>
  report.value.filter(r => parseFloat(r.percentage) < 75)
)
const criticalCount = computed(() =>
  report.value.filter(r => parseFloat(r.percentage) < 50).length
)
const safeCount = computed(() =>
  report.value.filter(r => parseFloat(r.percentage) >= 75).length
)
const totalStudents = computed(() => report.value.length)

const filteredReport = computed(() => {
  let list = showOnly.value === 'defaulters' ? defaulters.value : report.value

  if (subjectFilter.value) {
    list = list.filter(r => r.subject?._id === subjectFilter.value || r.subject === subjectFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(r =>
      r.student?.name?.toLowerCase().includes(q) ||
      r.student?.roll?.toLowerCase().includes(q)
    )
  }
  return list
})

// ── Data ──────────────────────────────────────────────────────
const fetchReport = async () => {
  loading.value = true
  try {
    const { data } = await attendanceAPI.getReport()
    report.value = data.report || []
  } catch (e) {
    console.error('Failed to load report:', e)
  } finally {
    loading.value = false
  }
}

// ── PDF Export ────────────────────────────────────────────────
const generatePDF = () => {
  generatingPDF.value = true
  try {
    const list = filteredReport.value.filter(r => parseFloat(r.percentage) < 75)
    if (!list.length) return

    const rows = list.map((r, i) => `
      <tr style="border-bottom:1px solid #e5e7eb;${parseFloat(r.percentage) < 50 ? 'background:#fff1f2;' : ''}">
        <td style="padding:7px 10px;text-align:center;color:#6b7280;">${i + 1}</td>
        <td style="padding:7px 10px;font-weight:600;">${r.student?.name || '—'}</td>
        <td style="padding:7px 10px;font-family:monospace;color:#7c3aed;">${r.student?.roll || '—'}</td>
        <td style="padding:7px 10px;">${r.student?.class || '—'}</td>
        <td style="padding:7px 10px;">${r.subject?.name || '—'} (${r.subject?.code || ''})</td>
        <td style="padding:7px 10px;text-align:center;">${r.present}/${r.total}</td>
        <td style="padding:7px 10px;text-align:center;font-weight:800;color:${parseFloat(r.percentage) < 50 ? '#dc2626' : '#ea580c'};">${r.percentage}%</td>
        <td style="padding:7px 10px;text-align:center;color:#dc2626;font-weight:600;">+${Math.ceil((0.75 * r.total - r.present) / 0.25)}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Defaulter List</title>
    <style>
      @page{size:A4 landscape;margin:12mm 10mm;}
      body{font-family:Arial,sans-serif;font-size:10pt;color:#111;margin:0;}
      .header{text-align:center;border-bottom:3px solid #1e1b4b;padding-bottom:10px;margin-bottom:14px;}
      h1{font-size:14pt;font-weight:900;color:#1e1b4b;margin:0 0 3px;}
      .sub{font-size:9pt;color:#555;margin:0;}
      .stats{display:flex;gap:16px;margin-bottom:12px;}
      .stat{background:#f5f3ff;border:1px solid #c4b5fd;border-radius:6px;padding:5px 12px;font-size:9pt;}
      .stat strong{color:#7c3aed;font-size:11pt;display:block;}
      table{width:100%;border-collapse:collapse;}
      thead{background:#1e1b4b;color:#fff;}
      thead th{padding:8px 10px;text-align:left;font-size:9pt;white-space:nowrap;}
      .footer{margin-top:12px;display:flex;justify-content:space-between;font-size:8pt;color:#888;border-top:1px solid #e5e7eb;padding-top:6px;}
    </style></head><body>
    <div class="header">
      <h1>RKT College of Arts, Science &amp; Commerce</h1>
      <p class="sub">Department of CS &amp; IT &nbsp;|&nbsp; Attendance Defaulter Report &nbsp;|&nbsp; Students below 75%</p>
    </div>
    <div class="stats">
      <div class="stat"><strong>${list.length}</strong>Defaulters</div>
      <div class="stat"><strong>${list.filter(r => parseFloat(r.percentage) < 50).length}</strong>Critical (&lt;50%)</div>
      <div class="stat"><strong>${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</strong>Generated On</div>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Student Name</th><th>Roll No.</th><th>Class</th>
        <th>Subject</th><th>Present/Total</th><th>Attendance %</th><th>Lectures Needed</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <span>AttendPro — RKT College Management System</span>
      <span>Confidential — For Internal Use Only</span>
    </div>
    </body></html>`

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
  } finally {
    generatingPDF.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await teacherAPI.mySubjects()
    mySubjects.value = data.subjects || []
  } catch { /* ignore */ }
  fetchReport()
})
</script>