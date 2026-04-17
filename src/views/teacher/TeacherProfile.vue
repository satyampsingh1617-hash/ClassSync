<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto">

      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-xl font-black text-surface-900">My Profile</h2>
        <p class="text-sm text-surface-400 mt-0.5">View and update your personal details</p>
      </div>

      <LoadingSpinner v-if="loading" />

      <template v-else>
        <!-- Profile card -->
        <div class="card mb-5">
          <!-- Avatar + name row -->
          <div class="flex items-center gap-5 mb-6 pb-6 border-b border-surface-100">
            <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white flex-shrink-0 bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand">
              {{ profile.name?.charAt(0)?.toUpperCase() || 'T' }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-xl font-black text-surface-900 truncate">{{ profile.name }}</h3>
              <p class="text-sm text-surface-500 mt-0.5">{{ profile.department || 'Department not set' }}</p>
              <div class="flex items-center gap-2 mt-2 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                  👨‍🏫 Teacher
                </span>
                <span v-if="profile.isClassTeacher"
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                  🏫 Class Teacher · {{ profile.assignedClass }}
                </span>
              </div>
            </div>
          </div>

          <!-- Info grid (read-only view) -->
          <div v-if="!editing" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p class="label">Full Name</p>
                <p class="text-sm font-semibold text-surface-800">{{ profile.name || '—' }}</p>
              </div>
              <div>
                <p class="label">Department</p>
                <p class="text-sm font-semibold text-surface-800">{{ profile.department || '—' }}</p>
              </div>
              <div>
                <p class="label">Email</p>
                <p class="text-sm font-semibold text-surface-800">{{ profile.email || '—' }}</p>
              </div>
              <div>
                <p class="label">Phone</p>
                <p class="text-sm font-semibold text-surface-800">{{ profile.phone || '—' }}</p>
              </div>
              <div>
                <p class="label">Username</p>
                <p class="text-sm font-mono text-surface-600 bg-surface-50 px-2 py-1 rounded-lg inline-block">{{ username }}</p>
              </div>
              <div>
                <p class="label">Member Since</p>
                <p class="text-sm font-semibold text-surface-800">{{ formatDate(profile.createdAt) }}</p>
              </div>
            </div>

            <div class="pt-4 flex gap-3">
              <button @click="startEdit" class="btn-primary">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit Profile
              </button>
              <router-link to="/change-password" class="btn-secondary">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
                Change Password
              </router-link>
            </div>
          </div>

          <!-- Edit form -->
          <form v-else @submit.prevent="saveProfile" class="space-y-4">
            <AlertMessage :message="alert.msg" :type="alert.type" class="mb-2" />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="label">Full Name <span class="text-danger">*</span></label>
                <input v-model="form.name" type="text" class="input" placeholder="Your full name" required />
              </div>
              <div>
                <label class="label">Department</label>
                <input v-model="form.department" type="text" class="input" placeholder="e.g. Computer Science" />
              </div>
              <div>
                <label class="label">Email</label>
                <input v-model="form.email" type="email" class="input" placeholder="your@email.com" />
              </div>
              <div>
                <label class="label">Phone</label>
                <input v-model="form.phone" type="tel" class="input" placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="submit" :disabled="saving" class="btn-primary">
                <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
              <button type="button" @click="cancelEdit" class="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>

        <!-- Subjects assigned -->
        <div class="card">
          <h3 class="font-bold text-surface-900 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            Assigned Subjects
            <span class="text-xs font-normal text-surface-400">({{ subjects.length }})</span>
          </h3>
          <div v-if="subjects.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="s in subjects" :key="s._id"
              class="flex items-center gap-3 p-3 rounded-xl border border-surface-100 bg-surface-50">
              <div class="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-surface-900 truncate">{{ s.name }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="font-mono text-xs text-surface-500">{{ s.code }}</span>
                  <span class="text-surface-300">·</span>
                  <span class="text-xs text-surface-500">{{ s.class }}</span>
                </div>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-surface-400 text-center py-6">No subjects assigned yet.</p>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import { teacherAPI } from '../../services/api'
import { useAuth } from '../../stores/auth'

const { user } = useAuth()

const loading  = ref(true)
const editing  = ref(false)
const saving   = ref(false)
const profile  = ref({})
const subjects = ref([])
const alert    = ref({ msg: '', type: 'success' })
const username = ref(user.value?.username || '')

const form = ref({ name: '', email: '', phone: '', department: '' })

const showAlert = (msg, type = 'success') => {
  alert.value = { msg, type }
  setTimeout(() => { alert.value.msg = '' }, 4000)
}

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  : '—'

const startEdit = () => {
  form.value = {
    name:       profile.value.name       || '',
    email:      profile.value.email      || '',
    phone:      profile.value.phone      || '',
    department: profile.value.department || '',
  }
  editing.value = true
}

const cancelEdit = () => {
  editing.value = false
  alert.value = { msg: '', type: 'success' }
}

const saveProfile = async () => {
  saving.value = true
  try {
    const { data } = await teacherAPI.updateMyProfile(form.value)
    profile.value = data.teacher
    editing.value = false
    showAlert('Profile updated successfully ✓')
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to update profile', 'error')
  } finally { saving.value = false }
}

onMounted(async () => {
  try {
    const [profileRes, subjectsRes] = await Promise.all([
      teacherAPI.myProfile(),
      teacherAPI.mySubjects(),
    ])
    profile.value  = profileRes.data.teacher
    subjects.value = subjectsRes.data.subjects
  } catch (e) {
    showAlert('Failed to load profile', 'error')
  } finally { loading.value = false }
})
</script>
