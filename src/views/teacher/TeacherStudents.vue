<template>
  <AppLayout>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="text-lg font-bold text-gray-900">My Students</h2>
        <p class="text-sm text-gray-500">
          {{ filteredStudents.length }} students
          <span v-if="selectedClass"> in <strong>{{ selectedClass }}</strong></span>
          <span v-if="assignedClasses.length" class="ml-2 text-xs text-brand-600">
            (Your classes: {{ assignedClasses.join(', ') }})
          </span>
        </p>
      </div>
      <div class="flex gap-2 self-start sm:self-auto">
        <button @click="showUpload=true; uploadStep=1; defaultClass=''; selectedFile=null; uploadResult=null"
          class="btn-success text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          Upload Excel
        </button>
        <button @click="openManual" class="btn-primary text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Manually
        </button>
      </div>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />

    <!-- No classes assigned warning -->
    <div v-if="!loadingClasses && assignedClasses.length === 0"
      class="card bg-yellow-50 border-yellow-200 text-yellow-800 mb-4">
      <p class="text-sm font-medium">⚠ No classes assigned to you yet. Ask admin to assign subjects to your account.</p>
    </div>

    <!-- Search + Class filter -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input v-model="search" type="text" class="input pl-9" placeholder="Search by name or roll number..." />
        </div>
        <select v-model="selectedClass" class="input sm:w-44" :disabled="assignedClasses.length === 0">
          <option value="">All My Classes</option>
          <option v-for="cls in assignedClasses" :key="cls" :value="cls">{{ cls }}</option>
        </select>
      </div>

      <!-- Class chips — only assigned classes -->
      <div class="flex flex-wrap gap-2 mt-3">
        <button
          @click="selectedClass = ''"
          :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-all',
            selectedClass === '' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500']"
        >All</button>
        <button
          v-for="cls in assignedClasses" :key="cls"
          @click="selectedClass = cls"
          :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-all',
            selectedClass === cls ? classChipActive(cls) : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500']"
        >{{ cls }}</button>
      </div>
    </div>

    <!-- Dark table -->
    <div class="rounded-xl overflow-hidden shadow-lg border border-gray-800">
      <LoadingSpinner v-if="loading" />
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-900">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Student</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Roll / Login</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Class</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Attendance</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-gray-800 divide-y divide-gray-700">
            <tr v-for="(s, i) in paginatedStudents" :key="s._id"
              class="hover:bg-gray-750 transition-colors group">
              <td class="px-4 py-3 text-sm text-gray-500">{{ (currentPage-1)*pageSize + i + 1 }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    :class="classAvatarColor(s.class)">
                    {{ s.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white">{{ s.name }}</p>
                    <p class="text-xs text-gray-400">{{ s.email || 'No email' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="font-mono text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded">{{ s.roll }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="['px-2 py-0.5 text-xs font-semibold rounded-full', classChipActive(s.class)]">
                  {{ s.class }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2 min-w-24">
                  <div class="flex-1 bg-gray-700 rounded-full h-1.5">
                    <div
                      class="h-1.5 rounded-full transition-all"
                      :class="parseFloat(s.attendance?.percentage) >= 75 ? 'bg-green-400' : 'bg-red-400'"
                      :style="{ width: `${Math.min(100, s.attendance?.percentage || 0)}%` }"
                    ></div>
                  </div>
                  <span class="text-xs font-bold w-10 text-right"
                    :class="parseFloat(s.attendance?.percentage) >= 75 ? 'text-green-400' : 'text-red-400'">
                    {{ s.attendance?.percentage || '0.0' }}%
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-0.5">{{ s.attendance?.present || 0 }}/{{ s.attendance?.total || 0 }}</p>
              </td>
              <td class="px-4 py-3">
                <span v-if="(s.attendance?.total || 0) === 0"
                  class="px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-400">No data</span>
                <span v-else-if="parseFloat(s.attendance?.percentage) >= 75"
                  class="px-2 py-0.5 text-xs rounded-full bg-green-900/50 text-green-400 border border-green-700">✓ Good</span>
                <span v-else
                  class="px-2 py-0.5 text-xs rounded-full bg-red-900/50 text-red-400 border border-red-700">⚠ Low</span>
              </td>
              <td class="px-4 py-3">
                <button @click="openResetPwd(s)"
                  class="text-orange-400 hover:text-orange-300 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Reset Pwd
                </button>
              </td>
            </tr>
            <tr v-if="!filteredStudents.length">
              <td colspan="7" class="px-4 py-12 text-center text-gray-500">
                <svg class="w-10 h-10 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {{ assignedClasses.length === 0 ? 'No classes assigned to you' : 'No students found' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-700">
        <p class="text-xs text-gray-400">
          Showing {{ (currentPage-1)*pageSize + 1 }}–{{ Math.min(currentPage*pageSize, filteredStudents.length) }}
          of {{ filteredStudents.length }}
        </p>
        <div class="flex gap-1">
          <button v-for="p in totalPages" :key="p" @click="currentPage = p"
            :class="['w-7 h-7 rounded text-xs font-medium transition-colors',
              p === currentPage ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-700']">
            {{ p }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Excel Upload Modal ─────────────────────────────── -->
    <ModalDialog :show="showUpload" title="Upload Students via Excel" @close="closeUpload">
      <div class="space-y-5">
        <!-- Step indicators -->
        <div class="flex items-center gap-2">
          <div :class="['flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
            uploadStep >= 1 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500']">1</div>
          <div :class="['flex-1 h-0.5', uploadStep >= 2 ? 'bg-brand-600' : 'bg-gray-200']"></div>
          <div :class="['flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
            uploadStep >= 2 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500']">2</div>
          <span class="text-xs text-gray-400 ml-1">{{ uploadStep === 1 ? 'Select Class' : 'Upload File' }}</span>
        </div>

        <!-- Step 1: Select Class -->
        <div v-if="uploadStep === 1" class="space-y-4">
          <div class="p-4 bg-brand-50 rounded-xl border border-brand-100">
            <p class="text-sm font-semibold text-brand-800 mb-1">Step 1 — Select Class</p>
            <p class="text-xs text-brand-600">You can only upload students to your assigned classes.</p>
          </div>
          <div>
            <label class="label">Class <span class="text-red-500">*</span></label>
            <select v-model="defaultClass" class="input">
              <option value="">— Select your class —</option>
              <option v-for="cls in assignedClasses" :key="cls" :value="cls">{{ cls }}</option>
            </select>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button @click="closeUpload" class="btn-secondary">Cancel</button>
            <button @click="uploadStep = 2" :disabled="!defaultClass" class="btn-primary">
              Next — Select File →
            </button>
          </div>
        </div>

        <!-- Step 2: Upload File -->
        <div v-if="uploadStep === 2" class="space-y-4">
          <div class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <svg class="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm text-green-800">Class: <strong>{{ defaultClass }}</strong></span>
            <button @click="uploadStep=1; selectedFile=null; uploadResult=null"
              class="ml-auto text-xs text-green-600 hover:underline">Change</button>
          </div>

          <div class="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800 space-y-1">
            <p class="font-semibold">Required Excel columns:</p>
            <p>• <strong>Roll Number</strong> — becomes username &amp; password</p>
            <p>• <strong>Name</strong> — student's full name</p>
          </div>

          <button @click="downloadTemplate" class="btn-secondary w-full justify-center text-xs">
            ⬇ Download Sample Template
          </button>

          <div
            class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
            :class="selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-brand-400'"
            @click="fileInput.click()"
            @dragover.prevent
            @drop.prevent="e => { selectedFile = e.dataTransfer.files[0]; uploadResult=null }"
          >
            <svg class="w-10 h-10 mx-auto mb-2" :class="selectedFile ? 'text-green-400' : 'text-gray-300'"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p class="text-sm font-medium" :class="selectedFile ? 'text-green-700' : 'text-gray-500'">
              {{ selectedFile ? selectedFile.name : 'Click or drag & drop Excel file' }}
            </p>
            <p class="text-xs text-gray-400 mt-1">.xlsx or .xls — max 5 MB</p>
            <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden"
              @change="e => { selectedFile=e.target.files[0]; uploadResult=null }" />
          </div>

          <!-- Result -->
          <div v-if="uploadResult" class="space-y-2">
            <div :class="['p-3 rounded-lg text-sm font-medium border',
              uploadResult.created > 0 ? 'bg-green-50 text-green-800 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200']">
              ✅ Created: <strong>{{ uploadResult.created }}</strong> &nbsp;|&nbsp;
              ⚠ Skipped: <strong>{{ uploadResult.skipped }}</strong> &nbsp;|&nbsp;
              Total: {{ uploadResult.total }}
            </div>
            <div v-if="uploadResult.errors?.length" class="max-h-36 overflow-y-auto space-y-1">
              <p class="text-xs font-semibold text-gray-500">Skipped rows:</p>
              <div v-for="e in uploadResult.errors" :key="e.row"
                class="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                Row {{ e.row }}: {{ e.name||'—' }} ({{ e.roll||'—' }}) — {{ e.reason }}
              </div>
            </div>
          </div>

          <div class="flex justify-between gap-3 pt-2">
            <button @click="uploadStep=1; selectedFile=null; uploadResult=null" class="btn-secondary">← Back</button>
            <div class="flex gap-2">
              <button @click="closeUpload" class="btn-secondary">Close</button>
              <button @click="submitUpload" :disabled="!selectedFile||uploading" class="btn-primary">
                <svg v-if="uploading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ uploading ? 'Uploading...' : 'Upload & Create' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalDialog>

    <!-- Manual Add Modal -->
    <ModalDialog :show="showManual" title="Add Student Manually" @close="showManual=false">
      <form @submit.prevent="saveManual" class="space-y-4">
        <div class="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
          💡 Username = Roll Number &nbsp;|&nbsp; Password = Roll Number (auto-set)
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Full Name</label>
            <input v-model="manualForm.name" type="text" class="input" required />
          </div>
          <div>
            <label class="label">Roll Number</label>
            <input v-model="manualForm.roll" type="text" class="input" required />
          </div>
        </div>
        <div>
          <label class="label">Class</label>
          <select v-model="manualForm.studentClass" class="input" required>
            <option value="">— Select your class —</option>
            <option v-for="cls in assignedClasses" :key="cls" :value="cls">{{ cls }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Email <span class="text-gray-400 font-normal">(optional)</span></label>
            <input v-model="manualForm.email" type="email" class="input" />
          </div>
          <div>
            <label class="label">Phone <span class="text-gray-400 font-normal">(optional)</span></label>
            <input v-model="manualForm.phone" type="text" class="input" />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showManual=false" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="savingManual">
            {{ savingManual ? 'Adding...' : 'Add Student' }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- Reset Password Modal -->
    <ModalDialog :show="showReset" title="Reset Student Password" @close="showReset=false">
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Reset password for <strong>{{ resetTarget?.name }}</strong>.
          Student must change it on next login.
        </p>
        <div>
          <label class="label">New Password</label>
          <input v-model="newPwd" type="text" class="input" :placeholder="`Default: ${resetTarget?.roll}`" />
        </div>
        <div class="flex justify-end gap-3">
          <button @click="showReset=false" class="btn-secondary">Cancel</button>
          <button @click="doResetPwd" :disabled="resetting" class="btn-primary">
            {{ resetting ? 'Resetting...' : 'Reset Password' }}
          </button>
        </div>
      </div>
    </ModalDialog>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { studentAPI, authAPI, adminAPI } from '../../services/api'

const students       = ref([])
const assignedClasses = ref([])
const loading        = ref(true)
const loadingClasses = ref(true)
const search         = ref('')
const selectedClass  = ref('')
const alert          = ref({ msg:'', type:'success' })
const currentPage    = ref(1)
const pageSize       = 15

// Upload
const showUpload   = ref(false)
const uploadStep   = ref(1)
const selectedFile = ref(null)
const defaultClass = ref('')
const uploading    = ref(false)
const uploadResult = ref(null)
const fileInput    = ref(null)

// Manual
const showManual   = ref(false)
const savingManual = ref(false)
const manualForm   = ref({ name:'', roll:'', studentClass:'', email:'', phone:'' })

// Reset pwd
const showReset   = ref(false)
const resetTarget = ref(null)
const newPwd      = ref('')
const resetting   = ref(false)

const showAlert = (msg, type='success') => {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg='', 4000)
}

// Filter — only show students from assigned classes
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

// Class chip colors
const classColors = {
  FYCS: 'bg-blue-600 text-white', FYIT: 'bg-indigo-600 text-white',
  SYCS: 'bg-purple-600 text-white', SYIT: 'bg-violet-600 text-white',
  TYCS: 'bg-emerald-600 text-white', TYIT: 'bg-teal-600 text-white',
}
const classChipActive  = (cls) => classColors[cls] || 'bg-gray-600 text-white'
const classAvatarColors = {
  FYCS: 'bg-blue-900 text-blue-300', FYIT: 'bg-indigo-900 text-indigo-300',
  SYCS: 'bg-purple-900 text-purple-300', SYIT: 'bg-violet-900 text-violet-300',
  TYCS: 'bg-emerald-900 text-emerald-300', TYIT: 'bg-teal-900 text-teal-300',
}
const classAvatarColor = (cls) => classAvatarColors[cls] || 'bg-gray-700 text-gray-300'

const fetchStudents = async () => {
  loading.value = true
  try {
    // Backend will automatically restrict to teacher's classes
    const { data } = await studentAPI.getAll()
    students.value = data.students
  } catch (e) {
    showAlert('Failed to load students', 'error')
  } finally { loading.value = false }
}

const fetchAssignedClasses = async () => {
  loadingClasses.value = true
  try {
    const { data } = await adminAPI.classes()
    assignedClasses.value = data.classes
  } catch (e) {
    assignedClasses.value = []
  } finally { loadingClasses.value = false }
}

// Upload
const closeUpload = () => {
  showUpload.value=false; uploadStep.value=1
  selectedFile.value=null; uploadResult.value=null; defaultClass.value=''
  fetchStudents()
}

const submitUpload = async () => {
  if (!selectedFile.value) return
  uploading.value=true; uploadResult.value=null
  try {
    const fd = new FormData()
    fd.append('file', selectedFile.value)
    fd.append('defaultClass', defaultClass.value)
    const { data } = await studentAPI.bulkUpload(fd)
    uploadResult.value = { ...data.summary, errors: data.errors || [] }
    showAlert(data.message, data.success ? 'success' : 'warning')
  } catch (e) {
    showAlert(e.response?.data?.message || 'Upload failed', 'error')
  } finally { uploading.value=false }
}

const downloadTemplate = () => {
  const csv = `Roll Number,Name\nCS2024001,Rahul Sharma\nCS2024002,Priya Patel`
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type:'text/csv' })),
    download: 'student_template.csv'
  })
  a.click(); URL.revokeObjectURL(a.href)
}

// Manual add
const openManual = () => {
  manualForm.value = { name:'', roll:'', studentClass: assignedClasses.value[0] || '', email:'', phone:'' }
  showManual.value = true
}

const saveManual = async () => {
  savingManual.value = true
  try {
    const { data } = await studentAPI.teacherCreate(manualForm.value)
    showAlert(data.message || 'Student added')
    showManual.value=false; fetchStudents()
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to add student', 'error')
  } finally { savingManual.value=false }
}

// Reset password
const openResetPwd = (s) => { resetTarget.value=s; newPwd.value=s.roll; showReset.value=true }
const doResetPwd = async () => {
  resetting.value = true
  try {
    const { data: sd } = await studentAPI.getById(resetTarget.value._id)
    const userId = sd.student?.userId
    if (!userId) throw new Error('User account not linked')
    await authAPI.resetPassword(userId, newPwd.value || resetTarget.value.roll)
    showAlert(`Password reset for ${resetTarget.value.name}`)
    showReset.value=false
  } catch (e) {
    showAlert(e.response?.data?.message || e.message || 'Reset failed', 'error')
  } finally { resetting.value=false }
}

onMounted(async () => {
  await fetchAssignedClasses()
  await fetchStudents()
})
</script>
