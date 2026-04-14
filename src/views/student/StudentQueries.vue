<template>
  <AppLayout>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-lg font-semibold text-surface-900 flex items-center gap-2">
          <span v-html="msgIcon" class="w-5 h-5 text-brand-500"></span>
          My Queries
        </h2>
        <p class="text-sm text-surface-500">Ask your class teacher a question</p>
      </div>
      <button @click="showModal = true" class="btn-primary" :disabled="!!noTeacherError">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        New Query
      </button>
    </div>

    <!-- No class teacher warning -->
    <div v-if="noTeacherError" class="card border-l-4 border-l-amber-400 mb-4">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div>
          <p class="text-sm font-semibold text-surface-800">No Class Teacher Assigned</p>
          <p class="text-sm text-surface-600 mt-0.5">{{ noTeacherError }}</p>
        </div>
      </div>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />

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
      </button>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else class="space-y-4">
      <div v-if="!filteredQueries.length" class="card text-center py-16 text-surface-400">
        <span v-html="msgIcon" class="w-10 h-10 mx-auto mb-3 opacity-30 block"></span>
        <p class="font-medium">No queries yet</p>
        <p class="text-sm mt-1">Post a query to your class teacher.</p>
      </div>

      <div v-for="q in filteredQueries" :key="q._id" class="card space-y-3">
        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span v-if="q.subject" class="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 font-medium">{{ q.subject }}</span>
              <span class="text-xs text-surface-400">{{ formatDate(q.createdAt) }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Unseen reply indicator -->
            <span
              v-if="q.status === 'Resolved' && !q.studentSeenResponse"
              class="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0"
              style="background: #ef4444; box-shadow: 0 0 6px #ef4444;"
              title="New reply"
            ></span>
            <span :class="q.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
              class="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
              {{ q.status }}
            </span>
          </div>
        </div>

        <!-- My message -->
        <div class="bg-surface-50 rounded-xl p-3">
          <p class="text-xs font-semibold text-surface-500 mb-1">Your Query</p>
          <p class="text-sm text-surface-700 leading-relaxed">{{ q.message }}</p>
        </div>

        <!-- Teacher response — mark seen on view -->
        <div v-if="q.response" class="bg-brand-50 border border-brand-100 rounded-xl p-3">
          <p class="text-xs font-semibold text-brand-600 mb-1">Teacher's Response</p>
          <p class="text-sm text-surface-700 leading-relaxed">{{ q.response }}</p>
        </div>

        <!-- Reopen button -->
        <div v-if="q.status === 'Resolved'" class="flex justify-end">
          <button @click="reopen(q._id)" class="btn-ghost text-xs text-brand-600">
            Reopen Query
          </button>
        </div>
      </div>
    </div>

    <!-- New Query Modal -->
    <ModalDialog :show="showModal" title="Ask Your Class Teacher" @close="showModal=false">
      <form @submit.prevent="submitQuery" class="space-y-4">
        <div>
          <label class="label">Subject / Topic (optional)</label>
          <input v-model="form.subject" type="text" class="input" placeholder="e.g. Data Structures, Exam schedule..." />
        </div>
        <div>
          <label class="label">Your Query <span class="text-danger">*</span></label>
          <textarea
            v-model="form.message"
            class="input min-h-[120px] resize-none"
            placeholder="Describe your doubt or question clearly..."
            required
          ></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showModal=false" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Sending...' : 'Send Query' }}
          </button>
        </div>
      </form>
    </ModalDialog>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { queryAPI } from '../../services/api'

const queries        = ref([])
const loading        = ref(true)
const saving         = ref(false)
const showModal      = ref(false)
const activeTab      = ref('All')
const noTeacherError = ref('')
const alert          = ref({ msg: '', type: 'success' })

const form = ref({ subject: '', message: '' })
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

// Load queries — independent, shows error if fails
const fetchQueries = async () => {
  loading.value = true
  try {
    const { data } = await queryAPI.getAll()
    queries.value = data.queries
    // Auto-mark all resolved+unseen replies as seen (optimistic)
    data.queries.forEach(q => {
      if (q.status === 'Resolved' && !q.studentSeenResponse) {
        q.studentSeenResponse = true
        queryAPI.markSeen(q._id).catch(() => {})
      }
    })
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to load queries', 'error')
  } finally {
    loading.value = false
  }
}

// Check class teacher — independent, silent fail, just shows warning banner
const checkTeacher = async () => {
  try {
    const { data } = await queryAPI.checkTeacher()
    if (!data.hasTeacher) {
      noTeacherError.value = data.message
    }
  } catch {
    // Silent — don't block the page if this check fails
  }
}

const submitQuery = async () => {
  saving.value = true
  noTeacherError.value = ''
  try {
    await queryAPI.create({ message: form.value.message, subject: form.value.subject })
    showAlert('Query sent to your class teacher!')
    form.value = { subject: '', message: '' }
    showModal.value = false
    fetchQueries()
  } catch (e) {
    const msg = e.response?.data?.message || 'Failed to send query'
    if (e.response?.status === 404) {
      noTeacherError.value = msg
      showModal.value = false
    } else {
      showAlert(msg, 'error')
    }
  } finally {
    saving.value = false
  }
}

const reopen = async (id) => {
  try {
    await queryAPI.reopen(id)
    showAlert('Query reopened')
    fetchQueries()
  } catch {
    showAlert('Failed to reopen', 'error')
  }
}

onMounted(async () => {
  // Run independently — checkTeacher failure must NOT block fetchQueries
  fetchQueries()
  checkTeacher()
})
</script>
