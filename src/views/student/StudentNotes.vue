<template>
  <AppLayout>
    <div class="mb-5">
      <h2 class="text-lg font-bold text-surface-900">Study Notes</h2>
      <p class="text-sm text-surface-500">
        Materials shared by your teachers
        <span v-if="studentClass" class="ml-1 font-semibold text-brand-600">({{ studentClass }})</span>
      </p>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else>
      <!-- Subject tabs -->
      <div v-if="subjects.length" class="mb-5 overflow-x-auto pb-1">
        <div class="flex gap-2 min-w-max">
          <button
            @click="activeSubject = ''"
            :class="activeSubject === ''
              ? 'bg-brand-500 text-white shadow-brand'
              : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'"
            class="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
          >
            All Subjects
            <span class="ml-1 text-xs opacity-75">({{ notes.length }})</span>
          </button>
          <button
            v-for="subj in subjects" :key="subj"
            @click="activeSubject = subj"
            :class="activeSubject === subj
              ? 'bg-brand-500 text-white shadow-brand'
              : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'"
            class="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
          >
            {{ subj }}
            <span class="ml-1 text-xs opacity-75">({{ notesBySubject(subj).length }})</span>
          </button>
        </div>
      </div>

      <!-- Notes grid -->
      <div v-if="filteredNotes.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="note in filteredNotes" :key="note._id"
          class="bg-white rounded-2xl border border-surface-200 p-5 shadow-card hover:shadow-card-md transition-all"
        >
          <div class="mb-3 space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="classChip(note.class)" class="text-xs font-bold px-2 py-0.5 rounded-full">
                {{ note.class }}
              </span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                {{ note.subject }}
              </span>
            </div>
            <h3 class="font-semibold text-surface-900 text-sm leading-snug">{{ note.title }}</h3>
          </div>
          <p v-if="note.description" class="text-xs text-surface-500 mb-3 line-clamp-2">{{ note.description }}</p>
          <a
            :href="note.url" target="_blank" rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            Open Material
          </a>
          <p class="text-xs text-surface-400 mt-2 text-center">{{ formatDate(note.createdAt) }}</p>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="card text-center py-16 border-2 border-dashed border-surface-200">
        <svg class="w-12 h-12 mx-auto mb-3 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p class="text-sm font-medium text-surface-500">
          {{ activeSubject ? `No notes for ${activeSubject} yet.` : 'No notes available for your class yet.' }}
        </p>
        <button v-if="activeSubject" @click="activeSubject = ''" class="mt-2 text-xs text-brand-600 hover:underline font-medium">
          View all subjects
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { notesAPI } from '../../services/api'

const notes        = ref([])
const studentClass = ref('')
const loading      = ref(true)
const activeSubject = ref('')

// Derive unique subject names from loaded notes
const subjects = computed(() =>
  [...new Set(notes.value.map(n => n.subject).filter(Boolean))].sort()
)

const notesBySubject = (subj) => notes.value.filter(n => n.subject === subj)

const filteredNotes = computed(() =>
  activeSubject.value ? notesBySubject(activeSubject.value) : notes.value
)

const classChipColors = {
  FYCS: 'bg-blue-100 text-blue-700',
  FYIT: 'bg-indigo-100 text-indigo-700',
  SYCS: 'bg-violet-100 text-violet-700',
  SYIT: 'bg-purple-100 text-purple-700',
  TYCS: 'bg-emerald-100 text-emerald-700',
  TYIT: 'bg-teal-100 text-teal-700',
}
const classChip  = (cls) => classChipColors[cls] || 'bg-surface-100 text-surface-700'
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

onMounted(async () => {
  try {
    const { data } = await notesAPI.getAll()
    notes.value        = data.notes
    studentClass.value = data.studentClass || ''
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
