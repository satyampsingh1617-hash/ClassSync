<template>
  <div class="min-h-screen bg-surface-50 flex">

    <!-- ── Desktop Sidebar ────────────────────────────────── -->
    <aside
      :class="[
        'hidden lg:flex fixed inset-y-0 left-0 z-50 flex-col bg-white border-r border-surface-200 shadow-card transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-60'
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-4 py-4 border-b border-surface-100">
        <div class="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand">
          CA
        </div>
        <div v-if="!sidebarCollapsed" class="flex-1 min-w-0">
          <p class="font-black text-surface-900 text-sm leading-tight">ClassSync</p>
          <p class="text-xs text-surface-400 leading-tight">Management System</p>
        </div>
        <button @click="sidebarCollapsed = !sidebarCollapsed"
          class="ml-auto p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-all">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
              :d="sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'" />
          </svg>
        </button>
      </div>

      <!-- User pill -->
      <div v-if="!sidebarCollapsed" class="mx-3 mt-3 mb-1 p-3 rounded-xl bg-surface-50 border border-surface-100">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-gradient-to-br from-brand-500 to-brand-700">
            {{ userInitial }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-surface-800 truncate leading-tight">{{ user?.name }}</p>
            <span class="text-xs font-semibold px-1.5 py-0.5 rounded-md" :class="roleChipClass">{{ user?.role }}</span>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        <div v-if="!sidebarCollapsed" class="px-2 pt-2 pb-1">
          <p class="section-title">Navigation</p>
        </div>
        <router-link
          v-for="link in navLinks" :key="link.to" :to="link.to"
          @click="mobileMenuOpen = false"
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group"
          :class="isActive(link.to)
            ? 'bg-brand-50 text-brand-700 shadow-sm'
            : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'"
        >
          <span class="relative flex-shrink-0 w-4 h-4 transition-colors"
            :class="isActive(link.to) ? 'text-brand-600' : 'text-surface-400 group-hover:text-surface-600'"
            v-html="link.icon">
          </span>
          <span v-if="!sidebarCollapsed" class="truncate">{{ link.label }}</span>

          <!-- Student: unread announcements badge -->
          <span
            v-if="!sidebarCollapsed && isStudent && link.to === '/student/announcements' && unreadCount > 0"
            class="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse"
            style="background: #ef4444; color: #fff; min-width: 18px; text-align: center;"
          >{{ unreadCount }}</span>

          <!-- Student: unseen teacher replies badge -->
          <span
            v-else-if="!sidebarCollapsed && isStudent && link.to === '/student/queries' && unseenReplyCount > 0"
            class="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse"
            style="background: #ef4444; color: #fff; min-width: 18px; text-align: center;"
          >{{ unseenReplyCount }}</span>

          <!-- Teacher: pending queries badge -->
          <span
            v-else-if="!sidebarCollapsed && isTeacher && link.to === '/teacher/queries' && pendingQueryCount > 0"
            class="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse"
            style="background: #ef4444; color: #fff; min-width: 18px; text-align: center;"
          >{{ pendingQueryCount }}</span>

          <!-- Admin/Teacher: violation badge -->
          <span
            v-else-if="!sidebarCollapsed && (isAdmin || isTeacher) && (link.to === '/admin/violations' || link.to === '/teacher/violations') && violationCount > 0"
            class="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse"
            style="background: #ef4444; color: #fff; min-width: 18px; text-align: center;"
          >{{ violationCount }}</span>

          <span v-else-if="!sidebarCollapsed && isActive(link.to)"
            class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0"></span>
        </router-link>
      </nav>

      <!-- Bottom -->
      <div class="p-2 border-t border-surface-100 space-y-0.5">
        <router-link to="/change-password"
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-surface-500 hover:text-surface-800 hover:bg-surface-100 transition-all">
          <svg class="flex-shrink-0 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
          <span v-if="!sidebarCollapsed">Change Password</span>
        </router-link>
        <button @click="handleLogout"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-surface-500 hover:text-danger hover:bg-danger-light transition-all">
          <svg class="flex-shrink-0 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          <span v-if="!sidebarCollapsed">Logout</span>
        </button>
      </div>
    </aside>

    <!-- ── Mobile Overlay ─────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="mobileMenuOpen" class="lg:hidden fixed inset-0 z-40 bg-surface-900/40 backdrop-blur-sm"
        @click="mobileMenuOpen = false"></div>
    </Transition>

    <!-- ── Mobile Drawer ──────────────────────────────────── -->
    <Transition name="slide">
      <aside v-if="mobileMenuOpen"
        class="lg:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-white border-r border-surface-200 shadow-card-lg">
        <div class="flex items-center justify-between px-4 py-4 border-b border-surface-100">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white bg-gradient-to-br from-brand-500 to-brand-700">CA</div>
            <p class="font-black text-surface-900 text-sm">ClassSync</p>
          </div>
          <button @click="mobileMenuOpen = false" class="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="mx-3 mt-3 mb-1 p-3 rounded-xl bg-surface-50 border border-surface-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-brand-500 to-brand-700">{{ userInitial }}</div>
            <div>
              <p class="text-sm font-semibold text-surface-800">{{ user?.name }}</p>
              <span class="text-xs font-semibold px-1.5 py-0.5 rounded-md" :class="roleChipClass">{{ user?.role }}</span>
            </div>
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
          <router-link
            v-for="link in navLinks" :key="link.to" :to="link.to"
            @click="mobileMenuOpen = false"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            :class="isActive(link.to) ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'"
          >
            <span class="w-4 h-4" :class="isActive(link.to) ? 'text-brand-600' : 'text-surface-400'" v-html="link.icon"></span>
            {{ link.label }}
            <!-- Student: unread announcements -->
            <span v-if="isStudent && link.to === '/student/announcements' && unreadCount > 0"
              class="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse"
              style="background: #ef4444; color: #fff; min-width: 18px; text-align: center;"
            >{{ unreadCount }}</span>
            <!-- Student: unseen teacher replies -->
            <span v-else-if="isStudent && link.to === '/student/queries' && unseenReplyCount > 0"
              class="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse"
              style="background: #ef4444; color: #fff; min-width: 18px; text-align: center;"
            >{{ unseenReplyCount }}</span>
            <!-- Teacher: pending queries -->
            <span v-else-if="isTeacher && link.to === '/teacher/queries' && pendingQueryCount > 0"
              class="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse"
              style="background: #ef4444; color: #fff; min-width: 18px; text-align: center;"
            >{{ pendingQueryCount }}</span>
          </router-link>
        </nav>

        <div class="p-3 border-t border-surface-100 space-y-1">
          <router-link to="/change-password" @click="mobileMenuOpen=false"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-500 hover:text-surface-800 hover:bg-surface-100 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
            Change Password
          </router-link>
          <button @click="handleLogout"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-500 hover:text-danger hover:bg-danger-light transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </Transition>

    <!-- ── Main Content ────────────────────────────────────── -->
    <div class="flex flex-col min-h-screen w-full transition-all duration-300"
      :class="sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'">

      <!-- Topbar -->
      <header class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-surface-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-3">
          <button @click="mobileMenuOpen = true"
            class="lg:hidden p-2 rounded-xl text-surface-500 hover:text-surface-800 hover:bg-surface-100 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div>
            <h1 class="text-sm font-bold text-surface-900">{{ pageTitle }}</h1>
            <p class="text-xs text-surface-400 hidden sm:block">{{ currentDate }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-brand-500 to-brand-700 flex-shrink-0">
            {{ userInitial }}
          </div>
          <span class="text-sm font-medium text-surface-600 hidden md:block truncate max-w-32">{{ user?.name }}</span>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6 animate-fade-up">
        <slot />
      </main>
    </div>

    <!-- ── Mobile Bottom Nav ───────────────────────────────── -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-surface-200 shadow-card-lg"
      style="padding-bottom: env(safe-area-inset-bottom, 0px);">
      <div class="flex items-center justify-around px-1 py-1">
        <router-link
          v-for="link in bottomNavLinks" :key="link.to" :to="link.to"
          class="relative flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all min-w-0 flex-1"
          :class="isActive(link.to) ? 'text-brand-600' : 'text-surface-400'"
        >
          <span class="w-5 h-5" v-html="link.icon"></span>
          <!-- Student: unread announcements dot -->
          <span
            v-if="isStudent && link.to === '/student/announcements' && unreadCount > 0"
            class="absolute top-1 right-3 w-2.5 h-2.5 rounded-full animate-pulse"
            style="background: #ef4444; box-shadow: 0 0 6px #ef4444;"
          ></span>
          <!-- Student: unseen replies dot -->
          <span
            v-if="isStudent && link.to === '/student/queries' && unseenReplyCount > 0"
            class="absolute top-1 right-3 w-2.5 h-2.5 rounded-full animate-pulse"
            style="background: #ef4444; box-shadow: 0 0 6px #ef4444;"
          ></span>
          <!-- Teacher: pending queries dot -->
          <span
            v-if="isTeacher && link.to === '/teacher/queries' && pendingQueryCount > 0"
            class="absolute top-1 right-3 w-2.5 h-2.5 rounded-full animate-pulse"
            style="background: #ef4444; box-shadow: 0 0 6px #ef4444;"
          ></span>
          <span class="text-xs font-medium truncate w-full text-center">{{ link.label }}</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import { teacherAPI, announcementAPI, queryAPI, otpAPI } from '../services/api'

const { user, logout, isAdmin, isTeacher, isStudent } = useAuth()
const route  = useRoute()
const router = useRouter()

const sidebarCollapsed  = ref(false)
const mobileMenuOpen    = ref(false)
const teacherProfile    = ref(null)
const unreadCount       = ref(0)   // student: unread announcements
const pendingQueryCount = ref(0)   // teacher: pending (unresponded) queries
const unseenReplyCount  = ref(0)   // student: resolved queries not yet seen
const violationCount    = ref(0)   // teacher/admin: new geofence violations

onMounted(async () => {
  if (isTeacher.value) {
    try {
      const { data } = await teacherAPI.myProfile()
      teacherProfile.value = data.teacher
    } catch { /* ignore */ }
    try {
      const { data } = await queryAPI.getAll()
      pendingQueryCount.value = (data.queries || []).filter(q => q.status === 'Pending').length
    } catch { /* ignore */ }
    // Violation badge — today's violations
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await otpAPI.getViolations({ date: today })
      violationCount.value = data.count || 0
    } catch { /* ignore */ }
  }
  if (isAdmin.value) {
    // Admin violation badge — today's violations
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await otpAPI.getViolations({ date: today })
      violationCount.value = data.count || 0
    } catch { /* ignore */ }
  }
  if (isStudent.value) {
    try {
      const { data } = await announcementAPI.getAll()
      unreadCount.value = (data.announcements || []).filter(a => !a.isRead).length
    } catch { /* ignore */ }
    try {
      const { data } = await queryAPI.getAll()
      unseenReplyCount.value = (data.queries || []).filter(
        q => q.status === 'Resolved' && !q.studentSeenResponse
      ).length
    } catch { /* ignore */ }
  }
})

const userInitial = computed(() => user.value?.name?.charAt(0).toUpperCase() || 'U')
const currentDate = computed(() =>
  new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
)

const roleChipClass = computed(() => ({
  admin:   'bg-amber-100 text-amber-700',
  teacher: 'bg-blue-100 text-blue-700',
  student: 'bg-emerald-100 text-emerald-700',
}[user.value?.role] || 'bg-surface-100 text-surface-600'))

const isActive = (path) => route.path === path
const handleLogout = () => { logout(); router.push('/login') }

const pageTitles = {
  '/admin':                   'Admin Dashboard',
  '/admin/users':             'All Users',
  '/admin/students':          'Manage Students',
  '/admin/teachers':          'Manage Teachers',
  '/admin/subjects':          'Manage Subjects',
  '/admin/attendance':        'Attendance Records',
  '/admin/papers':            'Question Papers',
  '/admin/announcements':     'Announcements',
  '/admin/violations':        'Violation Dashboard',
  '/teacher':                 'Teacher Dashboard',
  '/teacher/students':        'Manage Students',
  '/teacher/attendance':      'Mark Attendance',
  '/teacher/notes':           'Notes Hub',
  '/teacher/paper-print':     'Paper Architect',
  '/teacher/announcements':   'Announcements',
  '/teacher/queries':         'Student Queries',
  '/teacher/class-overview':  'Class Overview',
  '/teacher/violations':      'Violation Dashboard',
  '/teacher/defaulters':      'Defaulter List',
  '/student':                 'Student Dashboard',
  '/student/attendance':      'My Attendance',
  '/student/notes':           'Study Notes',
  '/student/announcements':   'Announcements',
  '/student/queries':         'My Queries',
  '/student/profile':         'My Profile',
}
const pageTitle = computed(() => pageTitles[route.path] || 'Dashboard')

const icons = {
  dashboard:  `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
  students:   `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`,
  teachers:   `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
  subjects:   `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  attendance: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
  chart:      `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
  users:      `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  notes:      `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  print:      `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>`,
  bell:       `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
  message:    `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>`,
  overview:   `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  profile:    `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
  violation:  `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
  defaulter:  `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
}

const allAdminLinks = [
  { to: '/admin',                 label: 'Dashboard',      icon: icons.dashboard  },
  { to: '/admin/users',           label: 'Users',          icon: icons.users      },
  { to: '/admin/students',        label: 'Students',       icon: icons.students   },
  { to: '/admin/teachers',        label: 'Teachers',       icon: icons.teachers   },
  { to: '/admin/subjects',        label: 'Subjects',       icon: icons.subjects   },
  { to: '/admin/attendance',      label: 'Attendance',     icon: icons.attendance },
  { to: '/admin/papers',          label: 'Papers',         icon: icons.print      },
  { to: '/admin/announcements',   label: 'Announcements',  icon: icons.bell       },
  { to: '/admin/violations',      label: 'Violations',     icon: icons.violation  },
]
const allTeacherLinks = computed(() => {
  const base = [
    { to: '/teacher',                  label: 'Dashboard',    icon: icons.dashboard  },
    { to: '/teacher/students',         label: 'Students',     icon: icons.students   },
    { to: '/teacher/attendance',       label: 'Attendance',   icon: icons.attendance },
    { to: '/teacher/notes',            label: 'Notes Hub',    icon: icons.notes      },
    { to: '/teacher/paper-print',      label: 'Paper Print',  icon: icons.print      },
    { to: '/teacher/announcements',    label: 'Announcements',icon: icons.bell       },
    { to: '/teacher/queries',          label: 'Queries',      icon: icons.message    },
  ]
  if (teacherProfile.value?.isClassTeacher) {
    base.push({ to: '/teacher/class-overview', label: 'Class Overview', icon: icons.overview })
  }
  base.push({ to: '/teacher/defaulters', label: 'Defaulters',  icon: icons.defaulter })
  base.push({ to: '/teacher/violations', label: 'Violations',  icon: icons.violation })
  return base
})
const allStudentLinks = [
  { to: '/student',                  label: 'Dashboard',    icon: icons.dashboard  },
  { to: '/student/attendance',       label: 'Attendance',   icon: icons.chart      },
  { to: '/student/notes',            label: 'Notes',        icon: icons.notes      },
  { to: '/student/announcements',    label: 'Announcements',icon: icons.bell       },
  { to: '/student/queries',          label: 'Queries',      icon: icons.message    },
  { to: '/student/profile',          label: 'My Profile',   icon: icons.profile    },
]

const navLinks = computed(() => {
  if (isAdmin.value)   return allAdminLinks
  if (isTeacher.value) return allTeacherLinks.value
  if (isStudent.value) return allStudentLinks
  return []
})
const bottomNavLinks = computed(() => {
  if (isAdmin.value)   return allAdminLinks.slice(0, 4)
  if (isTeacher.value) return [
    { to: '/teacher',                  label: 'Home',         icon: icons.dashboard  },
    { to: '/teacher/attendance',       label: 'Attendance',   icon: icons.attendance },
    { to: '/teacher/announcements',    label: 'Announce',     icon: icons.bell       },
    { to: '/teacher/queries',          label: 'Queries',      icon: icons.message    },
  ]
  if (isStudent.value) return [
    { to: '/student',                  label: 'Home',         icon: icons.dashboard  },
    { to: '/student/attendance',       label: 'Attendance',   icon: icons.chart      },
    { to: '/student/announcements',    label: 'Announce',     icon: icons.bell       },
    { to: '/student/queries',          label: 'Queries',      icon: icons.message    },
  ]
  return []
})
</script>
