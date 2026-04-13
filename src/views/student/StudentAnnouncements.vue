<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-surface-900 flex items-center gap-2">
        <span v-html="bellIcon" class="w-5 h-5 text-brand-500"></span>
        Announcements
      </h2>
      <p class="text-sm text-surface-500">Updates from your teachers and admin</p>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />
    <LoadingSpinner v-if="loading" />

    <div v-else class="space-y-4">
      <div v-if="!announcements.length" class="card text-center py-16 text-surface-400">
        <span v-html="bellIcon" class="w-10 h-10 mx-auto mb-3 opacity-30 block"></span>
        <p class="font-medium">No announcements yet</p>
        <p class="text-sm mt-1">Check back later for updates from your teachers.</p>
      </div>

      <div
        v-for="ann in announcements" :key="ann._id"
        class="card hover:shadow-card-md transition-shadow"
        :class="ann.priority === 'Urgent' ? 'border-l-4 border-l-red-400' : ann.priority === 'Event' ? 'border-l-4 border-l-blue-400' : ''"
      >
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span :class="priorityClass(ann.priority)" class="text-xs font-bold px-2 py-0.5 rounded-full">
            {{ ann.priority }}
          </span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 font-medium">
            {{ ann.targetClass === 'All' ? '🌐 All Students' : `📚 ${ann.targetClass}` }}
          </span>
        </div>
        <h3 class="font-semibold text-surface-900 text-sm">{{ ann.title }}</h3>
        <p class="text-sm text-surface-600 mt-1 leading-relaxed">{{ ann.content }}</p>
        <p class="text-xs text-surface-400 mt-3 flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          {{ ann.createdByName }}
          <span class="mx-1">·</span>
          {{ formatDate(ann.createdAt) }}
        </p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import { announcementAPI } from '../../services/api'

const announcements = ref([])
const loading       = ref(true)
const alert         = ref({ msg: '', type: 'error' })

const bellIcon = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`

const priorityClass = (p) => ({
  Urgent:  'bg-red-100 text-red-700',
  Event:   'bg-blue-100 text-blue-700',
  General: 'bg-emerald-100 text-emerald-700',
}[p] || 'bg-surface-100 text-surface-600')

const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

onMounted(async () => {
  try {
    const { data } = await announcementAPI.getAll()
    announcements.value = data.announcements
  } catch (e) {
    alert.value = { msg: e.response?.data?.message || 'Failed to load announcements', type: 'error' }
  } finally {
    loading.value = false
  }
})
</script>
