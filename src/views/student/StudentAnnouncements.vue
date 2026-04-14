<template>
  <AppLayout>
    <!-- Page header -->
    <div class="mb-6">
      <h2 class="text-xl font-bold flex items-center gap-2" style="color: #a78bfa;">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #7148fc;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        Announcements
        <span v-if="unreadCount > 0"
          class="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
          style="background: #ef4444; color: #fff;">
          {{ unreadCount }} new
        </span>
      </h2>
      <p class="text-sm mt-1" style="color: #6b7280;">Updates from your teachers and admin</p>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else class="space-y-3">
      <!-- Empty state -->
      <div v-if="!announcements.length"
        class="rounded-2xl text-center py-16"
        style="background: #1b163d; border: 1px solid #2d2660;">
        <svg class="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #7148fc;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        <p class="font-medium" style="color: #a78bfa;">No announcements yet</p>
        <p class="text-sm mt-1" style="color: #6b7280;">Check back later for updates from your teachers.</p>
      </div>

      <!-- Announcement cards — click to expand (auto-read on open) -->
      <div
        v-for="ann in announcements" :key="ann._id"
        class="relative rounded-2xl cursor-pointer transition-all duration-200"
        :style="cardStyle(ann)"
        @click="openAnnouncement(ann)"
      >
        <!-- Unread neon-red pulsing dot (top-right, like WhatsApp) -->
        <span
          v-if="!ann.isRead"
          class="absolute top-3 right-3 w-3 h-3 rounded-full animate-pulse"
          style="background: #ef4444; box-shadow: 0 0 10px #ef4444, 0 0 20px rgba(239,68,68,0.4);"
          title="New"
        ></span>

        <!-- Card body -->
        <div class="p-5">
          <!-- Priority + class badges -->
          <div class="flex flex-wrap items-center gap-2 mb-3 pr-6">
            <span :style="priorityStyle(ann.priority)" class="text-xs font-bold px-2.5 py-0.5 rounded-full">
              {{ ann.priority }}
            </span>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-medium"
              style="background: #2d2660; color: #a78bfa;">
              {{ ann.targetClass === 'All' ? '🌐 All Students' : `📚 ${ann.targetClass}` }}
            </span>
            <!-- Read tick (WhatsApp-style) -->
            <span v-if="ann.isRead" class="text-xs ml-auto" style="color: #4ade80;" title="Seen">✓✓</span>
          </div>

          <!-- Title -->
          <h3 class="font-bold text-base mb-1 transition-colors duration-200"
            :style="{ color: ann.isRead ? '#7c6fa0' : '#e9d5ff' }">
            {{ ann.title }}
          </h3>

          <!-- Preview line (collapsed) — only show when not expanded -->
          <p v-if="expandedId !== ann._id"
            class="text-sm leading-relaxed line-clamp-2 transition-colors duration-200"
            :style="{ color: ann.isRead ? '#4a4060' : '#c4b5fd' }">
            {{ ann.content }}
          </p>

          <!-- Full content (expanded) -->
          <p v-else
            class="text-sm leading-relaxed transition-colors duration-200"
            :style="{ color: ann.isRead ? '#8b7db0' : '#c4b5fd' }">
            {{ ann.content }}
          </p>

          <!-- Footer -->
          <div class="flex items-center justify-between mt-3">
            <p class="text-xs flex items-center gap-1" style="color: #6b7280;">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              {{ ann.createdByName }}
              <span class="mx-1">·</span>
              {{ formatDate(ann.createdAt) }}
            </p>
            <!-- Expand/collapse hint -->
            <span class="text-xs" style="color: #4a4060;">
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

// WhatsApp-style card styling — unread = vivid, read = dimmed
const cardStyle = (ann) => {
  const isUnread = !ann.isRead
  const isExpanded = expandedId.value === ann._id

  let borderColor = '#2d2660'
  let borderLeft  = '4px solid #7148fc'
  if (ann.priority === 'Urgent') { borderColor = isUnread ? '#ef4444' : '#5a2020'; borderLeft = `4px solid ${isUnread ? '#ef4444' : '#5a2020'}` }
  if (ann.priority === 'Event')  { borderColor = isUnread ? '#3b82f6' : '#1e3a5f'; borderLeft = `4px solid ${isUnread ? '#3b82f6' : '#1e3a5f'}` }

  return {
    background: isUnread ? '#1b163d' : '#13102b',
    border: `1px solid ${borderColor}`,
    borderLeft,
    opacity: ann.isRead ? '0.75' : '1',
    boxShadow: isExpanded && isUnread ? '0 0 16px rgba(113,72,252,0.25)' : 'none',
    transform: isExpanded ? 'scale(1.005)' : 'scale(1)',
  }
}

const priorityStyle = (p) => {
  if (p === 'Urgent') return { background: 'rgba(239,68,68,0.15)', color: '#f87171' }
  if (p === 'Event')  return { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }
  return { background: 'rgba(113,72,252,0.15)', color: '#a78bfa' }
}

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
