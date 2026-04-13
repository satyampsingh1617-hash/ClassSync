<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-surface-900 flex items-center gap-2">
        <span v-html="msgIcon" class="w-5 h-5 text-brand-500"></span>
        Student Queries
      </h2>
      <p class="text-sm text-surface-500">Queries from students in your class</p>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-2 mb-5">
      <button
        v-for="tab in ['All','Pending','Resolved']" :key="tab"
        @click="activeTab = tab"
        :class="activeTab === tab
          ? 'bg-brand-500 text-white shadow-brand'
          : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'"
        class="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all"
      >
        {{ tab }}
        <span v-if="tab !== 'All'" class="ml-1 text-xs opacity-75">
          ({{ queries.filter(q => q.status === tab).length }})
        </span>
      </button>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />
    <LoadingSpinner v-if="loading" />

    <div v-else class="space-y-4">
      <div v-if="!filteredQueries.length" class="card text-center py-16 text-surface-400">
        <span v-html="msgIcon" class="w-10 h-10 mx-auto mb-3 opacity-30 block"></span>
        <p class="font-medium">No {{ activeTab === 'All' ? '' : activeTab.toLowerCase() }} queries</p>
      </div>

      <div
        v-for="q in filteredQueries" :key="q._id"
        class="card space-y-3"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-semibold text-surface-800">{{ q.studentName || 'Student' }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-surface-500">{{ q.studentClass }}</span>
              <span v-if="q.subject" class="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">{{ q.subject }}</span>
            </div>
            <p class="text-xs text-surface-400 mt-0.5">{{ formatDate(q.createdAt) }}</p>
          </div>
          <span :class="q.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
            class="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
            {{ q.status }}
          </span>
        </div>

        <!-- Message -->
        <div class="bg-surface-50 rounded-xl p-3">
          <p class="text-sm text-surface-700 leading-relaxed">{{ q.message }}</p>
        </div>

        <!-- Response -->
        <div v-if="q.response" class="bg-brand-50 border border-brand-100 rounded-xl p-3">
          <p class="text-xs font-semibold text-brand-600 mb-1">Your Response</p>
          <p class="text-sm text-surface-700 leading-relaxed">{{ q.response }}</p>
        </div>

        <!-- Respond form -->
        <div v-if="q.status === 'Pending'" class="space-y-2">
          <textarea
            v-model="responseText[q._id]"
            class="input min-h-[80px] resize-none text-sm"
            placeholder="Type your response..."
          ></textarea>
          <div class="flex justify-end">
            <button
              @click="respond(q._id)"
              :disabled="!responseText[q._id]?.trim() || responding[q._id]"
              class="btn-primary text-xs"
            >
              {{ responding[q._id] ? 'Sending...' : 'Send Response & Resolve' }}
            </button>
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

const queries      = ref([])
const loading      = ref(true)
const activeTab    = ref('All')
const responseText = ref({})
const responding   = ref({})
const alert        = ref({ msg: '', type: 'success' })

const msgIcon = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>`

const showAlert = (msg, type = 'success') => {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg = '', 3500)
}

const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

const filteredQueries = computed(() => {
  if (activeTab.value === 'All') return queries.value
  return queries.value.filter(q => q.status === activeTab.value)
})

const fetchQueries = async () => {
  loading.value = true
  try {
    const { data } = await queryAPI.getAll()
    queries.value = data.queries
  } catch { showAlert('Failed to load queries', 'error') }
  finally { loading.value = false }
}

const respond = async (id) => {
  const text = responseText.value[id]?.trim()
  if (!text) return
  responding.value[id] = true
  try {
    await queryAPI.respond(id, { response: text })
    showAlert('Response sent!')
    responseText.value[id] = ''
    fetchQueries()
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to respond', 'error')
  } finally { responding.value[id] = false }
}

onMounted(fetchQueries)
</script>
