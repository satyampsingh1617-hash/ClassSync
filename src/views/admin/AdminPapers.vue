<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-lg font-bold text-surface-900">Saved Question Papers</h2>
      <p class="text-sm text-surface-500">All papers saved by teachers</p>
    </div>

    <!-- Search -->
    <div class="card mb-5">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input v-model="search" type="text" class="input pl-9" placeholder="Search by subject, class, teacher..." />
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="filteredPapers.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="p in filteredPapers" :key="p._id"
        class="card hover:shadow-card-md transition-all group">
        <div class="flex items-start justify-between mb-3">
          <div class="min-w-0 flex-1">
            <p class="font-bold text-surface-900 truncate">{{ p.subject || 'Untitled' }}</p>
            <p class="text-xs text-surface-500 mt-0.5">
              {{ p.class }} · Sem {{ p.semester }} · {{ p.totalMarks }} Marks
            </p>
            <p class="text-xs text-surface-400 mt-0.5">
              By: <strong>{{ p.teacherId?.name || 'Unknown' }}</strong>
            </p>
            <p class="text-xs text-surface-400">{{ formatDate(p.updatedAt) }}</p>
          </div>
          <!-- Delete (admin only) -->
          <button @click="deletePaper(p._id)"
            class="p-1.5 rounded-lg text-surface-400 hover:text-danger hover:bg-danger-light transition-all opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0"
            title="Delete">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <div class="flex flex-wrap gap-1">
          <span v-if="p.subjectCode" class="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-200">{{ p.subjectCode }}</span>
          <span v-if="p.class" :class="['text-xs px-2 py-0.5 rounded-full border font-semibold', classChip(p.class)]">{{ p.class }}</span>
          <span class="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">{{ p.sections?.length || 0 }} sections</span>
          <span class="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">{{ p.duration }}</span>
        </div>
      </div>
    </div>

    <div v-else class="card text-center py-16 border-2 border-dashed border-surface-200">
      <svg class="w-12 h-12 mx-auto mb-3 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p class="text-sm text-surface-500">No saved papers yet.</p>
    </div>

    <div v-if="alertMsg" :class="['fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium shadow-card-lg border z-50',
      alertType==='success' ? 'bg-success-light text-success-dark border-success/20' : 'bg-danger-light text-danger-dark border-danger/20']">
      {{ alertMsg }}
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { paperAPI } from '../../services/api'
import { getClassChip } from '../../utils/constants'

const papers    = ref([])
const loading   = ref(true)
const search    = ref('')
const alertMsg  = ref('')
const alertType = ref('success')

const classChip = (cls) => getClassChip(cls)

const filteredPapers = computed(() => {
  if (!search.value.trim()) return papers.value
  const q = search.value.toLowerCase()
  return papers.value.filter(p =>
    p.subject?.toLowerCase().includes(q) ||
    p.class?.toLowerCase().includes(q) ||
    p.teacherId?.name?.toLowerCase().includes(q) ||
    p.subjectCode?.toLowerCase().includes(q)
  )
})

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const showAlert = (msg, type = 'success') => {
  alertMsg.value = msg; alertType.value = type
  setTimeout(() => alertMsg.value = '', 3000)
}

const fetchPapers = async () => {
  loading.value = true
  try {
    const { data } = await paperAPI.getAll()
    papers.value = data.papers
  } catch { papers.value = [] }
  finally { loading.value = false }
}

const deletePaper = async (id) => {
  if (!confirm('Delete this paper?')) return
  try {
    await paperAPI.delete(id)
    showAlert('Paper deleted')
    fetchPapers()
  } catch { showAlert('Delete failed', 'error') }
}

onMounted(fetchPapers)
</script>
