<template>
  <AppLayout>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-lg font-semibold text-surface-900 flex items-center gap-2">
          <span v-html="bellIcon" class="w-5 h-5 text-brand-500"></span>
          Announcements
        </h2>
        <p class="text-sm text-surface-500">{{ announcements.length }} total announcements</p>
      </div>
      <button @click="openAdd" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        New Announcement
      </button>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />

    <LoadingSpinner v-if="loading" />

    <div v-else class="space-y-4">
      <div v-if="!announcements.length" class="card text-center py-16 text-surface-400">
        <span v-html="bellIcon" class="w-10 h-10 mx-auto mb-3 opacity-30 block"></span>
        <p class="font-medium">No announcements yet</p>
        <p class="text-sm mt-1">Create one to notify students and teachers.</p>
      </div>

      <div
        v-for="ann in announcements" :key="ann._id"
        class="card hover:shadow-card-md transition-shadow"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span :class="priorityClass(ann.priority)" class="text-xs font-bold px-2 py-0.5 rounded-full">
                {{ ann.priority }}
              </span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 font-medium">
                {{ ann.targetClass === 'All' ? '🌐 All Students' : `📚 ${ann.targetClass}` }}
              </span>
            </div>
            <h3 class="font-semibold text-surface-900 text-sm">{{ ann.title }}</h3>
            <p class="text-sm text-surface-600 mt-1 leading-relaxed">{{ ann.content }}</p>
            <p class="text-xs text-surface-400 mt-2">
              By {{ ann.createdByName }} · {{ formatDate(ann.createdAt) }}
            </p>
          </div>
          <button @click="confirmDelete(ann)" class="flex-shrink-0 p-1.5 rounded-lg text-surface-400 hover:text-danger hover:bg-danger-light transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <ModalDialog :show="showModal" title="New Announcement" @close="closeModal">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Title</label>
          <input v-model="form.title" type="text" class="input" placeholder="Announcement title" required />
        </div>
        <div>
          <label class="label">Content</label>
          <textarea v-model="form.content" class="input min-h-[100px] resize-none" placeholder="Write your announcement..." required></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Priority</label>
            <select v-model="form.priority" class="input">
              <option value="General">General</option>
              <option value="Urgent">Urgent</option>
              <option value="Event">Event</option>
            </select>
          </div>
          <div>
            <label class="label">Target Audience</label>
            <select v-model="form.targetClass" class="input">
              <option value="All">All Students</option>
              <option v-for="cls in classes" :key="cls" :value="cls">{{ cls }}</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Posting...' : 'Post Announcement' }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- Delete Confirm -->
    <ModalDialog :show="showDelete" title="Delete Announcement" @close="showDelete=false">
      <p class="text-sm text-surface-600 mb-6">Delete "<strong>{{ deleteTarget?.title }}</strong>"? This cannot be undone.</p>
      <div class="flex justify-end gap-3">
        <button @click="showDelete=false" class="btn-secondary">Cancel</button>
        <button @click="doDelete" class="btn-danger" :disabled="saving">{{ saving ? 'Deleting...' : 'Delete' }}</button>
      </div>
    </ModalDialog>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { announcementAPI, adminAPI } from '../../services/api'

const announcements = ref([])
const classes       = ref([])
const loading       = ref(true)
const saving        = ref(false)
const showModal     = ref(false)
const showDelete    = ref(false)
const deleteTarget  = ref(null)
const alert         = ref({ msg: '', type: 'success' })

const emptyForm = () => ({ title: '', content: '', priority: 'General', targetClass: 'All' })
const form = ref(emptyForm())

const bellIcon = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`

const showAlert = (msg, type = 'success') => {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg = '', 3500)
}

const priorityClass = (p) => ({
  Urgent:  'bg-red-100 text-red-700',
  Event:   'bg-blue-100 text-blue-700',
  General: 'bg-emerald-100 text-emerald-700',
}[p] || 'bg-surface-100 text-surface-600')

const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

const fetchAll = async () => {
  loading.value = true
  try {
    const annRes = await announcementAPI.getAll()
    announcements.value = annRes.data.announcements
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to load announcements', 'error')
  } finally {
    loading.value = false
  }
  // Load classes separately — failure here doesn't break the page
  try {
    const clsRes = await adminAPI.classes()
    classes.value = clsRes.data.classes || []
  } catch { classes.value = [] }
}

const openAdd   = () => { form.value = emptyForm(); showModal.value = true }
const closeModal = () => { showModal.value = false }

const save = async () => {
  saving.value = true
  try {
    await announcementAPI.create(form.value)
    showAlert('Announcement posted!')
    closeModal(); fetchAll()
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to post', 'error')
  } finally { saving.value = false }
}

const confirmDelete = (ann) => { deleteTarget.value = ann; showDelete.value = true }
const doDelete = async () => {
  saving.value = true
  try {
    await announcementAPI.delete(deleteTarget.value._id)
    showAlert('Deleted')
    showDelete.value = false; fetchAll()
  } catch { showAlert('Delete failed', 'error') }
  finally { saving.value = false }
}

onMounted(fetchAll)
</script>
