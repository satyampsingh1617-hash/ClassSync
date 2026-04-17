<template>
  <AppLayout>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="text-lg font-bold text-surface-900">Students</h2>
        <p class="text-sm text-surface-500">{{ filteredStudents.length }} students
          <span v-if="selectedClass"> in <strong>{{ selectedClass }}</strong></span>
        </p>
      </div>
      <div class="flex gap-2 self-start sm:self-auto">
        <button @click="showResetModal = true" class="btn-danger">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Reset All
        </button>
        <button @click="openAdd" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Student
        </button>
      </div>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />

    <!-- Search + Filter -->
    <div class="card mb-5">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input v-model="search" type="text" class="input pl-9" placeholder="Search by name or roll number..." />
        </div>
        <select v-model="selectedClass" class="input sm:w-40">
          <option value="">All Classes</option>
          <option v-for="cls in CLASS_LIST" :key="cls" :value="cls">{{ cls }}</option>
        </select>
      </div>
      <!-- Class chips -->
      <div class="flex flex-wrap gap-1.5 mt-3">
        <button @click="selectedClass=''"
          :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-all',
            selectedClass==='' ? 'bg-surface-800 text-white border-surface-800' : 'bg-white text-surface-600 border-surface-300 hover:border-surface-500']">
          All
        </button>
        <button v-for="cls in CLASS_LIST" :key="cls"
          @click="selectedClass = selectedClass===cls ? '' : cls"
          :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-all',
            selectedClass===cls ? getClassChip(cls) : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400']">
          {{ cls }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="card p-0 overflow-hidden">
      <LoadingSpinner v-if="loading" />
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="table-th">#</th>
              <th class="table-th">Student</th>
              <th class="table-th">Roll No.</th>
              <th class="table-th">Class</th>
              <th class="table-th">Attendance</th>
              <th class="table-th">Status</th>
              <th class="table-th">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100">
            <tr v-for="(s, i) in paginatedStudents" :key="s._id" class="hover:bg-surface-50 transition-colors group">
              <td class="table-td text-surface-400">{{ (currentPage-1)*pageSize + i + 1 }}</td>
              <td class="table-td">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    :class="getClassAvatar(s.class)">
                    {{ s.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <button @click="openProfile(s._id)"
                      class="text-sm font-semibold text-surface-900 hover:text-brand-600 hover:underline text-left transition-colors">
                      {{ s.name }}
                    </button>
                    <p class="text-xs text-surface-400">{{ s.email || 'No email' }}</p>
                  </div>
                </div>
              </td>
              <td class="table-td">
                <span class="font-mono text-xs bg-surface-100 text-surface-700 px-2 py-0.5 rounded-lg">{{ s.roll }}</span>
              </td>
              <td class="table-td">
                <span :class="['class-chip text-xs font-bold', getClassChip(s.class)]">{{ s.class }}</span>
              </td>
              <td class="table-td">
                <div class="flex items-center gap-2 min-w-28">
                  <div class="progress-track flex-1">
                    <div :class="parseFloat(s.attendance?.percentage) >= 75 ? 'progress-good' : 'progress-low'"
                      :style="{ width: `${Math.min(100, s.attendance?.percentage || 0)}%` }"></div>
                  </div>
                  <span class="text-xs font-bold w-10 text-right"
                    :class="parseFloat(s.attendance?.percentage) >= 75 ? 'text-success-dark' : 'text-danger-dark'">
                    {{ s.attendance?.percentage || '0.0' }}%
                  </span>
                </div>
                <p class="text-xs text-surface-400 mt-0.5">{{ s.attendance?.present || 0 }}/{{ s.attendance?.total || 0 }}</p>
              </td>
              <td class="table-td">
                <span v-if="(s.attendance?.total||0)===0" class="chip-none">No data</span>
                <span v-else-if="parseFloat(s.attendance?.percentage)>=75" class="chip-good">Good</span>
                <span v-else class="chip-low">Low</span>
              </td>
              <td class="table-td">
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <!-- Lucide Pencil -->
                  <button @click="openEdit(s)"
                    class="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <!-- Lucide Trash -->
                  <button @click="confirmDelete(s)"
                    class="p-1.5 rounded-lg text-surface-400 hover:text-danger hover:bg-danger-light transition-all" title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredStudents.length">
              <td colspan="7" class="table-td text-center text-surface-400 py-12">
                <svg class="w-10 h-10 mx-auto mb-2 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                No students found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="px-5 py-3 border-t border-surface-100 flex items-center justify-between">
        <p class="text-xs text-surface-500">
          Showing {{ (currentPage-1)*pageSize+1 }}–{{ Math.min(currentPage*pageSize, filteredStudents.length) }}
          of {{ filteredStudents.length }}
        </p>
        <div class="flex gap-1">
          <button v-for="p in totalPages" :key="p" @click="currentPage=p"
            :class="['w-7 h-7 rounded-lg text-xs font-medium transition-all',
              p===currentPage ? 'bg-brand-500 text-white' : 'text-surface-500 hover:bg-surface-100']">
            {{ p }}
          </button>
        </div>
      </div>
    </div>

    <!-- Class summary cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
      <div v-for="cls in CLASS_LIST" :key="cls"
        @click="selectedClass = selectedClass===cls ? '' : cls"
        class="card cursor-pointer hover:shadow-card-md transition-all"
        :class="selectedClass===cls ? 'ring-2 ring-brand-500' : ''">
        <p class="section-title mb-1">{{ cls }}</p>
        <p class="text-2xl font-black text-surface-900">{{ classCounts[cls] || 0 }}</p>
        <p class="text-xs text-surface-400">students</p>
        <div class="progress-track mt-2">
          <div class="progress-brand" :style="{ width: `${classAttendanceAvg[cls] || 0}%` }"></div>
        </div>
        <p class="text-xs text-surface-400 mt-1">{{ classAttendanceAvg[cls] || '0.0' }}% avg</p>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <ModalDialog :show="showModal" :title="editId ? 'Edit Student' : 'Add Student'" @close="closeModal">
      <form @submit.prevent="save" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Full Name</label>
            <input v-model="form.name" type="text" class="input" required />
          </div>
          <div>
            <label class="label">Roll Number</label>
            <input v-model="form.roll" type="text" class="input" required :disabled="!!editId" />
          </div>
        </div>
        <div>
          <label class="label">Class</label>
          <select v-model="form.studentClass" class="input" required>
            <option value="">— Select Class —</option>
            <option v-for="cls in CLASS_LIST" :key="cls" :value="cls">{{ cls }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Email <span class="text-surface-400 font-normal normal-case">(optional)</span></label>
            <input v-model="form.email" type="email" class="input" />
          </div>
          <div>
            <label class="label">Phone <span class="text-surface-400 font-normal normal-case">(optional)</span></label>
            <input v-model="form.phone" type="text" class="input" />
          </div>
        </div>
        <template v-if="!editId">
          <div class="p-3 bg-brand-50 rounded-xl border border-brand-200 text-xs text-brand-700">
            💡 Username = Roll Number &nbsp;|&nbsp; Password = Roll Number (auto-set)
          </div>
          <div>
            <label class="label">Custom Password <span class="text-surface-400 font-normal normal-case">(optional)</span></label>
            <input v-model="form.password" type="password" class="input" placeholder="Leave blank = roll number" />
          </div>
        </template>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : (editId ? 'Update' : 'Add Student') }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- Delete Modal -->
    <ModalDialog :show="showDelete" title="Delete Student" @close="showDelete=false">
      <p class="text-sm text-surface-600 mb-6">
        Delete <strong>{{ deleteTarget?.name }}</strong>? Their login account and attendance records will also be removed.
      </p>
      <div class="flex justify-end gap-3">
        <button @click="showDelete=false" class="btn-secondary">Cancel</button>
        <button @click="doDelete" class="btn-danger" :disabled="saving">{{ saving ? 'Deleting...' : 'Delete' }}</button>
      </div>
    </ModalDialog>

    <!-- ── Reset All Students Modal ─────────────────────────── -->
    <ModalDialog :show="showResetModal" title="⚠️ Reset All Students" @close="closeResetModal">
      <div class="space-y-5">

        <!-- Warning banner -->
        <div class="bg-red-50 border border-red-200 rounded-xl p-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
              <p class="text-sm font-bold text-red-800">This action is permanent and cannot be undone.</p>
              <ul class="text-xs text-red-700 mt-2 space-y-1 list-disc list-inside">
                <li>All <strong>{{ students.length }} student accounts</strong> will be deleted</li>
                <li>All <strong>attendance records</strong> will be wiped</li>
                <li>All <strong>attendance logs &amp; violation records</strong> will be cleared</li>
                <li>Students will no longer be able to log in</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Step 1 — checkbox -->
        <div v-if="resetStep === 1" class="space-y-4">
          <label class="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" v-model="resetChecked" class="mt-0.5 w-4 h-4 rounded border-surface-300 text-red-600 focus:ring-red-500" />
            <span class="text-sm text-surface-700">
              I understand this will permanently delete all student data across all classes (FYCS, FYIT, SYCS, SYIT, TYCS, TYIT).
            </span>
          </label>
          <div class="flex justify-end gap-3 pt-2">
            <button @click="closeResetModal" class="btn-secondary">Cancel</button>
            <button @click="resetStep = 2" :disabled="!resetChecked" class="btn-danger">
              Continue →
            </button>
          </div>
        </div>

        <!-- Step 2 — type confirmation -->
        <div v-else-if="resetStep === 2" class="space-y-4">
          <div>
            <label class="label">Type <strong class="text-red-600 font-mono">DELETE ALL STUDENTS</strong> to confirm</label>
            <input
              v-model="resetConfirmText"
              type="text"
              class="input font-mono"
              placeholder="DELETE ALL STUDENTS"
              autocomplete="off"
              spellcheck="false"
            />
            <p v-if="resetConfirmText && resetConfirmText !== 'DELETE ALL STUDENTS'"
              class="text-xs text-red-500 mt-1">Text does not match exactly.</p>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button @click="resetStep = 1" class="btn-secondary">← Back</button>
            <button
              @click="doResetAll"
              :disabled="resetConfirmText !== 'DELETE ALL STUDENTS' || resetting"
              class="btn-danger"
            >
              <svg v-if="resetting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ resetting ? 'Deleting...' : '🗑 Delete Everything' }}
            </button>
          </div>
        </div>

        <!-- Step 3 — done -->
        <div v-else-if="resetStep === 3" class="text-center py-4">
          <div class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <svg class="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p class="font-bold text-surface-900">Reset Complete</p>
          <p class="text-sm text-surface-500 mt-1">{{ resetSummary }}</p>
          <button @click="closeResetModal" class="btn-primary mt-4">Done</button>
        </div>
      </div>
    </ModalDialog>

    <!-- Profile Modal -->
    <ProfileModal :show="showProfile" type="student" :itemId="profileId" @close="showProfile = false" />
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import ProfileModal from '../../components/ProfileModal.vue'
import { authAPI, studentAPI, adminAPI } from '../../services/api'
import { CLASS_LIST, getClassChip, getClassAvatar } from '../../utils/constants'

const students      = ref([])
const loading       = ref(true)
const saving        = ref(false)
const showModal     = ref(false)
const showDelete    = ref(false)
const showProfile   = ref(false)
const profileId     = ref(null)
const editId        = ref(null)
const deleteTarget  = ref(null)
const search        = ref('')
const selectedClass = ref('')
const currentPage   = ref(1)
const pageSize      = 15
const alert         = ref({ msg:'', type:'success' })

// ── Reset state ───────────────────────────────────────────────
const showResetModal    = ref(false)
const resetStep         = ref(1)       // 1=checkbox, 2=type confirm, 3=done
const resetChecked      = ref(false)
const resetConfirmText  = ref('')
const resetting         = ref(false)
const resetSummary      = ref('')

const closeResetModal = () => {
  showResetModal.value   = false
  resetStep.value        = 1
  resetChecked.value     = false
  resetConfirmText.value = ''
  resetSummary.value     = ''
}

const doResetAll = async () => {
  if (resetConfirmText.value !== 'DELETE ALL STUDENTS') return
  resetting.value = true
  try {
    const { data } = await adminAPI.resetStudents('DELETE ALL STUDENTS')
    resetSummary.value = `Deleted ${data.summary.studentsDeleted} students, ${data.summary.attendanceDeleted} attendance records, ${data.summary.logsDeleted} logs.`
    resetStep.value = 3
    students.value = []   // clear local list immediately
  } catch (e) {
    showAlert(e.response?.data?.message || 'Reset failed. Please try again.', 'error')
    closeResetModal()
  } finally {
    resetting.value = false
  }
}

const emptyForm = () => ({ name:'', roll:'', studentClass:'', email:'', phone:'', password:'' })
const form = ref(emptyForm())

const showAlert = (msg, type='success') => {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg='', 3500)
}

const filteredStudents = computed(() => {
  let list = students.value
  if (selectedClass.value) list = list.filter(s => s.class === selectedClass.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q))
  }
  return list
})

const totalPages = computed(() => Math.ceil(filteredStudents.value.length / pageSize))
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredStudents.value.slice(start, start + pageSize)
})
watch([search, selectedClass], () => { currentPage.value = 1 })

const classCounts = computed(() => {
  const map = {}
  CLASS_LIST.forEach(c => { map[c] = students.value.filter(s => s.class === c).length })
  return map
})
const classAttendanceAvg = computed(() => {
  const map = {}
  CLASS_LIST.forEach(cls => {
    const group = students.value.filter(s => s.class === cls && s.attendance?.total > 0)
    if (!group.length) { map[cls] = '0.0'; return }
    const avg = group.reduce((sum, s) => sum + parseFloat(s.attendance?.percentage || 0), 0) / group.length
    map[cls] = avg.toFixed(1)
  })
  return map
})

const fetchStudents = async () => {
  loading.value = true
  try {
    const { data } = await studentAPI.getAll()
    students.value = data.students
  } catch { showAlert('Failed to load students','error') }
  finally { loading.value = false }
}

const openAdd  = () => { editId.value=null; form.value=emptyForm(); showModal.value=true }
const openProfile = (id) => { profileId.value = id; showProfile.value = true }
const openEdit = (s) => {
  editId.value = s._id
  form.value = { name:s.name, roll:s.roll, studentClass:s.class, email:s.email||'', phone:s.phone||'', password:'' }
  showModal.value = true
}
const closeModal = () => { showModal.value=false; editId.value=null }

const save = async () => {
  saving.value = true
  try {
    if (editId.value) {
      await studentAPI.update(editId.value, {
        name:form.value.name, studentClass:form.value.studentClass,
        email:form.value.email, phone:form.value.phone,
      })
      showAlert('Student updated')
    } else {
      await authAPI.createUser({
        role:'student',
        username: form.value.roll.toLowerCase().trim(),
        password: form.value.password || form.value.roll.trim(),
        name:form.value.name, roll:form.value.roll,
        studentClass:form.value.studentClass,
        email:form.value.email, phone:form.value.phone,
      })
      showAlert('Student added. Login: username & password = roll number')
    }
    closeModal(); fetchStudents()
  } catch (e) {
    showAlert(e.response?.data?.message || 'Operation failed','error')
  } finally { saving.value=false }
}

const confirmDelete = (s) => { deleteTarget.value=s; showDelete.value=true }
const doDelete = async () => {
  saving.value = true
  try {
    await studentAPI.delete(deleteTarget.value._id)
    showAlert('Student deleted')
    showDelete.value=false; fetchStudents()
  } catch { showAlert('Delete failed','error') }
  finally { saving.value=false }
}

onMounted(fetchStudents)
</script>
