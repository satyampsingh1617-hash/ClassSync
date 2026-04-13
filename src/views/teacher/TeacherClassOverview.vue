<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-surface-900 flex items-center gap-2">
        <span v-html="overviewIcon" class="w-5 h-5 text-brand-500"></span>
        Class Overview
        <span v-if="assignedClass" class="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
          {{ assignedClass }}
        </span>
      </h2>
      <p class="text-sm text-surface-500">Performance and queries for your assigned class</p>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />

    <div v-if="notClassTeacher" class="card text-center py-16 text-surface-400">
      <p class="font-medium">Access Restricted</p>
      <p class="text-sm mt-1">Only designated class teachers can view this page.</p>
    </div>

    <LoadingSpinner v-else-if="loading" />

    <div v-else class="space-y-6">
      <!-- Stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div class="card text-center">
          <p class="text-2xl font-black text-brand-600">{{ queries.length }}</p>
          <p class="text-xs text-surface-500 mt-1">Total Queries</p>
        </div>
        <div class="card text-center">
          <p class="text-2xl font-black text-amber-500">{{ pendingCount }}</p>
          <p class="text-xs text-surface-500 mt-1">Pending</p>
        </div>
        <div class="card text-center col-span-2 sm:col-span-1">
          <p class="text-2xl font-black text-emerald-500">{{ resolvedCount }}</p>
          <p class="text-xs text-surface-500 mt-1">Resolved</p>
        </div>
      </div>

      <!-- Queries list -->
      <div>
        <h3 class="text-sm font-bold text-surface-700 mb-3">All Queries</h3>

        <div v-if="!queries.length" class="card text-center py-10 text-surface-400">
          <p class="text-sm">No queries from this class yet.</p>
        </div>

        <div class="space-y-3">
          <div v-for="q in queries" :key="q._id" class="card">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="text-sm font-semibold text-surface-800">{{ q.studentName || 'Student' }}</span>
                  <span v-if="q.subject" class="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">{{ q.subject }}</span>
                  <span class="text-xs text-surface-400">{{ formatDate(q.createdAt) }}</span>
                </div>
                <p class="text-sm text-surface-600 leading-relaxed">{{ q.message }}</p>
                <div v-if="q.response" class="mt-2 bg-brand-50 rounded-lg p-2">
                  <p class="text-xs font-semibold text-brand-600 mb-0.5">Response</p>
                  <p class="text-xs text-surface-600">{{ q.response }}</p>
                </div>
              </div>
              <span :class="q.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                class="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                {{ q.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { queryAPI } from '../../services/api'

const queries        = ref([])
const assignedClass  = ref('')
const loading        = ref(true)
const notClassTeacher = ref(false)
const alert          = ref({ msg: '', type: 'success' })

const overviewIcon = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`

const pendingCount  = computed(() => queries.value.filter(q => q.status === 'Pending').length)
const resolvedCount = computed(() => queries.value.filter(q => q.status === 'Resolved').length)

const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
})

const showAlert = (msg, type = 'success') => {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg = '', 3500)
}

onMounted(async () => {
  try {
    const { data } = await queryAPI.classOverview()
    queries.value       = data.queries
    assignedClass.value = data.assignedClass
  } catch (e) {
    if (e.response?.status === 403) {
      notClassTeacher.value = true
    } else {
      showAlert('Failed to load class overview', 'error')
    }
  } finally { loading.value = false }
})
</script>
