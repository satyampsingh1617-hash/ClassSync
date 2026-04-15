<template>
  <AppLayout>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-lg font-bold text-surface-900 flex items-center gap-2">
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          Violation Dashboard
        </h2>
        <p class="text-sm text-surface-500 mt-0.5">
          Students flagged for Out-of-Bounds or Spoof attempts
        </p>
      </div>
      <button @click="fetchViolations" :disabled="loading" class="btn-secondary self-start sm:self-auto">
        <svg class="w-4 h-4" :class="loading ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Refresh
      </button>
    </div>

    <!-- Summary stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="card border-l-4 border-l-red-400">
        <p class="text-2xl font-black text-red-600">{{ outOfBoundsCount }}</p>
        <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-0.5">Out-of-Bounds</p>
        <p class="text-xs text-surface-400 mt-1">Student outside 100m radius</p>
      </div>
      <div class="card border-l-4 border-l-orange-400">
        <p class="text-2xl font-black text-orange-600">{{ spoofCount }}</p>
        <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-0.5">Spoof Attempts</p>
        <p class="text-xs text-surface-400 mt-1">Mock location / proxy detected</p>
      </div>
      <div class="card border-l-4 border-l-surface-300">
        <p class="text-2xl font-black text-surface-700">{{ violations.length }}</p>
        <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-0.5">Total Violations</p>
        <p class="text-xs text-surface-400 mt-1">All flagged attempts</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-5">
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search -->
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input v-model="search" type="text" class="input pl-9" placeholder="Search by student name or roll..." />
        </div>
        <!-- Status filter -->
        <select v-model="statusFilter" class="input sm:w-44">
          <option value="">All Violations</option>
          <option value="Out-of-Bounds">Out-of-Bounds</option>
          <option value="Spoof-Attempt">Spoof Attempt</option>
        </select>
        <!-- Date filter -->
        <input v-model="dateFilter" type="date" class="input sm:w-40" />
      </div>
    </div>

    <!-- Table -->
    <div class="card p-0 overflow-hidden">
      <LoadingSpinner v-if="loading" />
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="table-th">#</th>
              <th class="table-th">Student</th>
              <th class="table-th">Subject</th>
              <th class="table-th">Violation</th>
              <th class="table-th">Distance</th>
              <th class="table-th">Date & Time</th>
              <th class="table-th">Details</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100">
            <tr v-for="(v, i) in filteredViolations" :key="v._id"
              class="hover:bg-surface-50 transition-colors"
              :class="v.status === 'Spoof-Attempt' ? 'bg-orange-50/40' : 'bg-red-50/30'">

              <td class="table-td text-surface-400">{{ i + 1 }}</td>

              <!-- Student -->
              <td class="table-td">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-red-100 text-red-700">
                    {{ v.studentId?.name?.charAt(0)?.toUpperCase() || '?' }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-surface-900">{{ v.studentId?.name || '—' }}</p>
                    <p class="text-xs font-mono text-surface-400">{{ v.studentId?.roll || '—' }}</p>
                  </div>
                </div>
              </td>

              <!-- Subject -->
              <td class="table-td">
                <p class="text-sm text-surface-700">{{ v.subjectId?.name || '—' }}</p>
                <p class="text-xs text-surface-400">{{ v.subjectId?.code || '' }}</p>
              </td>

              <!-- Violation type — WhatsApp-style red indicator -->
              <td class="table-td">
                <div class="flex items-center gap-2">
                  <!-- Red pulsing dot -->
                  <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
                    :class="v.status === 'Spoof-Attempt' ? 'bg-orange-500' : 'bg-red-500'"
                    :style="v.status === 'Spoof-Attempt'
                      ? 'box-shadow: 0 0 6px rgba(249,115,22,0.7)'
                      : 'box-shadow: 0 0 6px rgba(239,68,68,0.7)'">
                  </span>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                    :class="v.status === 'Spoof-Attempt'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-red-100 text-red-700'">
                    {{ v.status === 'Spoof-Attempt' ? '🚫 Spoof' : '📍 Out-of-Bounds' }}
                  </span>
                </div>
              </td>

              <!-- Distance from gate -->
              <td class="table-td">
                <span v-if="v.distanceMeters !== null && v.distanceMeters !== undefined"
                  class="font-mono text-sm font-bold"
                  :class="v.distanceMeters > 500 ? 'text-red-600' : v.distanceMeters > 200 ? 'text-orange-600' : 'text-amber-600'">
                  {{ v.distanceMeters }}m
                </span>
                <span v-else class="text-surface-300 text-xs">—</span>
              </td>

              <!-- Timestamp -->
              <td class="table-td">
                <p class="text-xs text-surface-700 font-medium">{{ formatDate(v.createdAt) }}</p>
                <p class="text-xs text-surface-400">{{ v.date }}</p>
              </td>

              <!-- Details / message -->
              <td class="table-td max-w-48">
                <p class="text-xs text-surface-500 truncate" :title="v.message">{{ v.message || '—' }}</p>
                <div class="flex gap-1 mt-1 flex-wrap">
                  <span v-if="v.isMockLocation"
                    class="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold">
                    Mock GPS
                  </span>
                  <span v-if="v.isProxy"
                    class="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">
                    Proxy
                  </span>
                  <span v-if="v.accuracy !== null && v.accuracy !== undefined"
                    class="text-xs px-1.5 py-0.5 rounded bg-surface-100 text-surface-500">
                    ±{{ Math.round(v.accuracy) }}m acc
                  </span>
                </div>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="!filteredViolations.length">
              <td colspan="7" class="table-td text-center py-16">
                <svg class="w-12 h-12 mx-auto mb-3 text-surface-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm font-semibold text-surface-400">No violations found</p>
                <p class="text-xs text-surface-300 mt-1">
                  {{ search || statusFilter || dateFilter ? 'Try clearing filters' : 'All students are compliant' }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer count -->
      <div v-if="filteredViolations.length" class="px-5 py-3 border-t border-surface-100 flex items-center justify-between">
        <p class="text-xs text-surface-500">
          Showing {{ filteredViolations.length }} of {{ violations.length }} violations
        </p>
        <p class="text-xs text-surface-400">Last updated: {{ lastUpdated }}</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { otpAPI } from '../../services/api'

const violations   = ref([])
const loading      = ref(true)
const search       = ref('')
const statusFilter = ref('')
const dateFilter   = ref('')
const lastUpdated  = ref('—')

const outOfBoundsCount = computed(() => violations.value.filter(v => v.status === 'Out-of-Bounds').length)
const spoofCount       = computed(() => violations.value.filter(v => v.status === 'Spoof-Attempt').length)

const filteredViolations = computed(() => {
  let list = violations.value
  if (statusFilter.value) list = list.filter(v => v.status === statusFilter.value)
  if (dateFilter.value)   list = list.filter(v => v.date === dateFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(v =>
      v.studentId?.name?.toLowerCase().includes(q) ||
      v.studentId?.roll?.toLowerCase().includes(q) ||
      v.subjectId?.name?.toLowerCase().includes(q)
    )
  }
  return list
})

const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
})

const fetchViolations = async () => {
  loading.value = true
  try {
    const params = {}
    if (statusFilter.value) params.status = statusFilter.value
    if (dateFilter.value)   params.date   = dateFilter.value
    const { data } = await otpAPI.getViolations(params)
    violations.value = data.violations || []
    lastUpdated.value = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    console.error('Failed to load violations:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchViolations)
</script>
