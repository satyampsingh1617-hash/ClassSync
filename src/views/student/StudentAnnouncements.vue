<template>
  <AppLayout>
    <!-- Page header -->
    <div class="mb-6">
      <h2 class="text-xl font-bold flex items-center gap-2 text-surface-900">
        <svg class="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        Announcements
        <span v-if="unreadCount > 0"
          class="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse bg-red-500 text-white">
          {{ unreadCount }} new
        </span>
      </h2>
      <p class="text-sm mt-1 text-surface-500">Updates from your teachers and admin</p>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else class="space-y-3">
      <!-- Empty state -->
      <div v-if="!announcements.length"
        class="card text-center py-16 border-2 border-dashed border-surface-200">
        <svg class="w-10 h-10 mx-auto mb-3 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        <p class="font-medium text-surface-500">No announcements yet</p>
        <p class="text-sm mt-1 text-surface-400">Check back later for updates from your teachers.</p>
      </div>

      <!-- Announcement cards -->
      <div
        v-for="ann in announcements" :key="ann._id"
        class="relative rounded-2xl cursor-pointer transition-all duration-200 border"
        :class="[
          ann.isRead ? 'bg-white border-surface-200 opacity-80' : 'bg-white border-brand-200 shadow-card',
          ann.priority === 'Urgent' && !ann.isRead ? 'border-l-4 border-l-red-400' : '',
          ann.priority === 'Event'  && !ann.isRead ? 'border-l-4 border-l-blue-400' : '',
          ann.priority === 'General' && !ann.isRead ? 'border-l-4 border-l-brand-400' : '',
        ]"
        @click="openAnnouncement(ann)"
      >
        <!-- Unread dot -->
        <span
          v-if="!ann.isRead"
          class="absolute top-3 right-3 w-2.5 h-2.5 rounded-full animate-pulse bg-red-500"
          title="New"
        ></span>

        <!-- Card body -->
        <div class="p-5">
          <!-- Priority + class badges -->
          <div class="flex flex-wrap items-center gap-2 mb-3 pr-6">
            <span :class="priorityClass(ann.priority)" class="text-xs font-bold px-2.5 py-0.5 rounded-full">
              {{ ann.priority }}
            </span>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-medium bg-surface-100 text-surface-600">
              {{ ann.targetClass === 'All' ? '🌐 All Students' : `📚 ${ann.targetClass}` }}
            </span>
            <span v-if="ann.isRead" class="text-xs ml-auto text-emerald-600 font-semibold" title="Seen">✓✓ Seen</span>
          </div>

          <!-- Title -->
          <h3 class="font-bold text-base mb-1 text-surface-900"
            :class="ann.isRead ? 'text-surface-500' : 'text-surface-900'">
            {{ ann.title }}
          </h3>

          <!-- Preview / full content -->
          <p v-if="expandedId !== ann._id"
            class="text-sm leading-relaxed line-clamp-2 text-surface-600">
            {{ ann.content }}
          </p>
          <p v-else class="text-sm leading-relaxed text-surface-700">
            {{ ann.content }}
          </p>

          <!-- Footer -->
          <div class="flex items-center justify-between mt-3">
            <p class="text-xs text-surface-400 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              {{ ann.createdByName }}
              <span class="mx-1">·</span>
              {{ formatDate(ann.createdAt) }}
            </p>
            <span class="text-xs text-surface-400">
              {{ expandedId === ann._id ? '▲ less' : '▼ more' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { announcementAPI } from '../../services/api'

const announcements = ref([])
const loading       = ref(true)
const expandedId    = ref(null)   // tracks which card is expanded

const unreadCount = computed(() =>
  announcements.value.filter(a => !a.isRead).length
)

const priorityClass = (p) => ({
  Urgent:  'bg-red-100 text-red-700',
  Event:   'bg-blue-100 text-blue-700',
  General: 'bg-emerald-100 text-emerald-700',
}[p] || 'bg-surface-100 text-surface-600')

const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

// Auto-read on open — fires when student clicks/expands a card
const openAnnouncement = (ann) => {
  // Toggle expand/collapse
  expandedId.value = expandedId.value === ann._id ? null : ann._id

  // Auto-mark as read on first open (optimistic UI)
  if (!ann.isRead) {
    ann.isRead = true  // instant badge removal
    announcementAPI.markRead(ann._id).catch(() => {
      // silently revert on failure — badge returns on next page load
      ann.isRead = false
    })
  }
}

onMounted(async () => {
  try {
    const { data } = await announcementAPI.getAll()
    announcements.value = data.announcements
  } catch {
    // silently fail — empty state shown
  } finally {
    loading.value = false
  }
})
</script>
