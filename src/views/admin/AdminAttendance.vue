<template>
  <AppLayout>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-lg font-bold text-surface-900">Attendance Records</h2>
        <p class="text-sm text-surface-500">{{ records.length }} records</p>
      </div>
      <button @click="showReport = !showReport" class="btn-secondary self-start sm:self-auto">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        {{ showReport ? 'Show Records' : 'Show Report' }}
      </button>
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
              <th class="table-th">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100">
            <tr v-for="(r, i) in filteredReport" :key="i" class="hover:bg-surface-50">
              <td class="table-td text-surface-400">{{ i+1 }}</td>
              <td class="table-td font-medium text-surface-900">{{ r.student?.name }}</td>
              <td class="table-td"><span class="font-mono text-xs bg-surface-100 px-2 py-0.5 rounded-lg">{{ r.student?.roll }}</span></td>
              <td class="table-td">
                <span :class="['class-chip text-xs font-bold', getClassChip(r.student?.class)]">{{ r.student?.class }}</span>
              </td>
              <td class="table-td text-surface-600">{{ r.subject?.name }}</td>
              <td class="table-td font-medium">{{ r.total }}</td>
              <td class="table-td text-success-dark font-medium">{{ r.present }}</td>
              <td class="table-td text-danger-dark">{{ r.absent }}</td>
              <td class="table-td">
                <span v-if="parseFloat(r.percentage) >= 75" class="chip-good">{{ r.percentage }}%</span>
                <span v-else class="chip-low">{{ r.percentage }}%</span>
              </td>
            </tr>
            <tr v-if="!filteredReport.length">
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
import AppLayout from '../../components/AppLayout.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { attendanceAPI, subjectAPI } from '../../services/api'
import { CLASS_LIST, getClassChip, getClassAvatar } from '../../utils/constants'

const records       = ref([])
const report        = ref([])
const subjects      = ref([])
const loading       = ref(true)
const loadingReport = ref(false)
const showReport    = ref(false)
const search        = ref('')
const alert         = ref({ msg:'', type:'success' })
const filters       = ref({ subjectId:'', startDate:'', endDate:'', class:'' })

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

const deleteRecord = async (id) => {
  if (!confirm('Delete this attendance record?')) return
  try {
    await attendanceAPI.delete(id)
    showAlert('Record deleted')
    fetchRecords()
  } catch { showAlert('Delete failed','error') }
}

watch(showReport, (val) => { if (val) fetchReport() })

onMounted(async () => {
  const { data } = await subjectAPI.getAll()
  subjects.value = data.subjects
  fetchRecords()
})
</script>
