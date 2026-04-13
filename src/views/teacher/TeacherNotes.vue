<template>
  <AppLayout>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="text-lg font-bold text-surface-900">Notes Hub</h2>
        <p class="text-sm text-surface-500">Share study materials with your students</p>
      </div>
      <button @click="openAdd" class="btn-primary self-start sm:self-auto">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Note
      </button>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />

    <!-- Filter bar -->
    <div class="card mb-5">
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Subject filter dropdown — only assigned subjects -->
        <div class="flex-1">
          <label class="label">Filter by Subject</label>
          <select v-model="filterSubjectId" class="input">
            <option value="">All Subjects</option>
            <option v-for="s in assignedSubjects" :key="s._id" :value="s._id">
              {{ s.name }} ({{ s.code }}) — {{ s.class }}
            </option>
          </select>
        </div>
        <!-- Class filter chips -->
        <div class="flex-1">
          <label class="label">Filter by Class</label>
          <div class="flex flex-wrap gap-1.5 mt-1">
            <button @click="filterClass=''"
              :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                filterClass==='' ? 'bg-surface-800 text-white border-surface-800' : 'bg-white text-surface-600 border-surface-300 hover:border-surface-500']">
              All
            </button>
            <button v-for="cls in assignedClasses" :key="cls"
              @click="filterClass = filterClass===cls ? '' : cls"
              :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                filterClass===cls ? classChipActive(cls) : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400']">
              {{ cls }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <!-- Notes grid -->
    <div v-else-if="filteredNotes.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="note in filteredNotes" :key="note._id"
        class="bg-white rounded-2xl border border-surface-200 p-5 shadow-card hover:shadow-card-md transition-all group">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0 space-y-1">
            <!-- Class chip -->
            <span :class="['class-chip text-xs font-bold', classChipActive(note.class)]">
              {{ note.class }}
            </span>
            <!-- Subject chip -->
            <span class="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              {{ note.subject }}
            </span>
            <h3 class="font-semibold text-surface-900 truncate pt-1">{{ note.title }}</h3>
          </div>
          <button @click="deleteNote(note._id)"
            class="opacity-0 group-hover:opacity-100 transition-opacity text-danger hover:text-danger-dark ml-2 flex-shrink-0 p-1 rounded-lg hover:bg-danger-light">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <p v-if="note.description" class="text-xs text-surface-500 mb-3 line-clamp-2">{{ note.description }}</p>

        <a :href="note.url" target="_blank" rel="noopener noreferrer"
          class="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 text-sm font-semibold transition-colors border border-brand-200">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          <span class="truncate">Open Material</span>
        </a>
        <p class="text-xs text-surface-400 mt-2">{{ formatDate(note.createdAt) }}</p>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="card text-center py-16 border-2 border-dashed border-surface-200">
      <svg class="w-12 h-12 mx-auto mb-3 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p class="text-sm font-medium text-surface-500">
        {{ filterSubjectId || filterClass ? 'No notes for this filter.' : 'No notes yet. Add your first note!' }}
      </p>
      <button v-if="filterSubjectId || filterClass" @click="filterSubjectId=''; filterClass=''"
        class="mt-3 text-xs text-brand-600 hover:underline font-medium">Clear filters</button>
    </div>

    <!-- ── Add Note Modal ─────────────────────────────────── -->
    <ModalDialog :show="showAdd" title="Add Note / Study Material" @close="closeAdd">
      <form @submit.prevent="addNote" class="space-y-4">
        <div>
          <label class="label">Title <span class="text-danger">*</span></label>
          <input v-model="form.title" type="text" class="input"
            placeholder="e.g. Unit 3 — Data Structures Notes" required />
        </div>

        <!-- Subject dropdown — ONLY assigned subjects -->
        <div>
          <label class="label">Subject <span class="text-danger">*</span></label>
          <select v-model="form.subjectId" class="input" required @change="onSubjectChange">
            <option value="">— Select Subject —</option>
            <option v-for="s in assignedSubjects" :key="s._id" :value="s._id">
              {{ s.name }} ({{ s.code }}) — {{ s.class }}
            </option>
          </select>
          <!-- Auto-filled class preview -->
          <p v-if="selectedSubjectClass" class="text-xs text-surface-500 mt-1">
            📚 Class: <strong class="text-surface-700">{{ selectedSubjectClass }}</strong>
            (auto-assigned from subject)
          </p>
          <p v-if="!assignedSubjects.length" class="text-xs text-warning-dark mt-1">
            ⚠ No subjects assigned to you yet. Ask admin to assign subjects.
          </p>
        </div>

        <div>
          <label class="label">Google Drive / URL Link <span class="text-danger">*</span></label>
          <input v-model="form.url" type="url" class="input"
            placeholder="https://drive.google.com/..." required />
        </div>

        <div>
          <label class="label">Description <span class="text-surface-400 font-normal normal-case">(optional)</span></label>
          <textarea v-model="form.description" class="input resize-none" rows="2"
            placeholder="Brief description of the material..."></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="closeAdd" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="saving || !form.subjectId">
            <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ saving ? 'Adding...' : 'Add Note' }}
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
import { notesAPI, teacherAPI } from '../../services/api'
import { CLASS_LIST, getClassChip } from '../../utils/constants'

const notes            = ref([])
const assignedSubjects = ref([])   // full subject objects assigned to this teacher
const loading          = ref(true)
const saving           = ref(false)
const showAdd          = ref(false)
const filterSubjectId  = ref('')
const filterClass      = ref('')
const alert            = ref({ msg:'', type:'success' })

const emptyForm = () => ({ title:'', subjectId:'', url:'', description:'' })
const form = ref(emptyForm())

// Derived: unique classes from assigned subjects
const assignedClasses = computed(() =>
  [...new Set(assignedSubjects.value.map(s => s.class))].sort()
)

// Class of the currently selected subject in the form
const selectedSubjectClass = computed(() => {
  if (!form.value.subjectId) return ''
  return assignedSubjects.value.find(s => s._id === form.value.subjectId)?.class || ''
})

// Class chip colors — use shared utility
const classChipActive = (cls) => getClassChip(cls)

// Filter notes by selected subject and/or class
const filteredNotes = computed(() => {
  let list = notes.value
  if (filterSubjectId.value) list = list.filter(n => n.subjectId?._id === filterSubjectId.value || n.subjectId === filterSubjectId.value)
  if (filterClass.value)     list = list.filter(n => n.class === filterClass.value)
  return list
})

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })

const showAlert = (msg, type='success') => {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg='', 3500)
}

// When subject changes in form, sync class filter chip for visual feedback
const onSubjectChange = () => { /* class auto-derived on backend */ }

const fetchNotes = async () => {
  loading.value = true
  try {
    const { data } = await notesAPI.getAll()
    notes.value = data.notes
  } catch { showAlert('Failed to load notes','error') }
  finally { loading.value = false }
}

const fetchSubjects = async () => {
  try {
    const { data } = await teacherAPI.mySubjects()
    assignedSubjects.value = data.subjects
  } catch { assignedSubjects.value = [] }
}

const openAdd = () => {
  form.value = emptyForm()
  showAdd.value = true
}
const closeAdd = () => { showAdd.value = false }

const addNote = async () => {
  saving.value = true
  try {
    await notesAPI.create(form.value)
    showAlert('Note added successfully')
    closeAdd()
    fetchNotes()
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to add note','error')
  } finally { saving.value = false }
}

const deleteNote = async (id) => {
  if (!confirm('Delete this note?')) return
  try {
    await notesAPI.delete(id)
    showAlert('Note deleted')
    fetchNotes()
  } catch { showAlert('Delete failed','error') }
}

onMounted(async () => {
  await Promise.all([fetchSubjects(), fetchNotes()])
})
</script>
