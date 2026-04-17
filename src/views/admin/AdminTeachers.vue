<template>
  <AppLayout>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-lg font-semibold text-surface-900">Teachers</h2>
        <p class="text-sm text-surface-500">{{ teachers.length }} faculty members</p>
      </div>
      <button @click="openAdd" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Teacher
      </button>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />

    <!-- Admin-Teacher link banner -->
    <div v-if="!myTeacherLinked" class="mb-4 card border-brand-200 bg-brand-50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div class="flex-1">
        <p class="text-sm font-bold text-brand-800">🎓 Teach as Admin</p>
        <p class="text-xs text-brand-700 mt-0.5">Select your teacher profile below to enable attendance marking and OTP generation for your own subjects.</p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <select v-model="linkTeacherId" class="input w-48 text-sm">
          <option value="">— Select your profile —</option>
          <option v-for="t in teachers" :key="t._id" :value="t._id">{{ t.name }}</option>
        </select>
        <button @click="linkMyProfile" :disabled="!linkTeacherId || linking" class="btn-primary text-xs py-2 px-4">
          {{ linking ? 'Linking...' : 'Link' }}
        </button>
      </div>
    </div>
    <div v-else class="mb-4 flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
      <svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-xs font-semibold text-emerald-700">
        Teacher profile linked ✓ — Go to <strong>Subjects</strong> to assign subjects to yourself, then use <strong>Mark Attendance</strong> from the sidebar.
      </p>
    </div>

    <div class="card p-0 overflow-hidden">
      <LoadingSpinner v-if="loading" />
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="table-th">#</th>
              <th class="table-th">Name</th>
              <th class="table-th">Username</th>
              <th class="table-th">Department</th>
              <th class="table-th">Email</th>
              <th class="table-th">Class Teacher</th>
              <th class="table-th">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100">
            <tr v-for="(t,i) in teachers" :key="t._id" class="hover:bg-surface-50">
              <td class="table-td text-surface-400">{{ i+1 }}</td>
              <td class="table-td">
                <button @click="openProfile(t._id)"
                  class="font-semibold text-surface-900 hover:text-brand-600 hover:underline text-left transition-colors">
                  {{ t.name }}
                </button>
              </td>
              <td class="table-td"><span class="font-mono text-xs bg-surface-100 text-surface-700 px-2 py-0.5 rounded-lg">{{ t.username || '—' }}</span></td>
              <td class="table-td"><span class="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">{{ t.department || '—' }}</span></td>
              <td class="table-td text-surface-500 text-xs">{{ t.email || '—' }}</td>
              <td class="table-td">
                <span v-if="t.isClassTeacher" class="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded-full font-semibold border border-brand-200">
                  {{ t.assignedClass }}
                </span>
                <span v-else class="text-surface-400 text-xs">—</span>
              </td>
              <td class="table-td">
                <div class="flex gap-2">
                  <button @click="openEdit(t)" class="text-brand-600 text-xs font-medium hover:underline">Edit</button>
                  <button @click="confirmDelete(t)" class="text-danger text-xs font-medium hover:underline">Delete</button>
                </div>
              </td>
            </tr>
            <tr v-if="!teachers.length">
              <td colspan="7" class="table-td text-center text-surface-400 py-10">No teachers found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <ModalDialog :show="showModal" :title="editId ? 'Edit Teacher' : 'Add Teacher'" @close="closeModal">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Full Name</label>
          <input v-model="form.name" type="text" class="input" required />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Department</label>
            <select v-model="form.department" class="input">
              <option value="">Select Department</option>
              <option value="CS">CS (Computer Science)</option>
              <option value="IT">IT (Information Technology)</option>
            </select>
          </div>
          <div>
            <label class="label">Phone</label>
            <input v-model="form.phone" type="text" class="input" />
          </div>
        </div>
        <div>
          <label class="label">Email</label>
          <input v-model="form.email" type="email" class="input" />
        </div>
        <!-- Class Teacher Designation -->
        <div class="border border-brand-100 bg-brand-50 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-surface-800">Class Teacher</p>
              <p class="text-xs text-surface-500">Designate this teacher as a class teacher</p>
            </div>
            <button
              type="button"
              @click="form.isClassTeacher = !form.isClassTeacher"
              :class="form.isClassTeacher ? 'bg-brand-500' : 'bg-surface-300'"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
            >
              <span
                :class="form.isClassTeacher ? 'translate-x-6' : 'translate-x-1'"
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
              ></span>
            </button>
          </div>
          <div v-if="form.isClassTeacher">
            <label class="label">Assigned Class <span class="text-danger">*</span></label>
            <select v-model="form.assignedClass" class="input" :required="form.isClassTeacher">
              <option value="">Select a class...</option>
              <option v-for="cls in classes" :key="cls" :value="cls">{{ cls }}</option>
            </select>
          </div>
        </div>
        <template v-if="!editId">
          <div class="border-t border-surface-100 pt-4">
            <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Login Credentials</p>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Username</label>
                <input v-model="form.username" type="text" class="input" required />
              </div>
              <div>
                <label class="label">Password</label>
                <input v-model="form.password" type="password" class="input" required />
              </div>
            </div>
          </div>
        </template>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : (editId ? 'Update' : 'Add Teacher') }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- Delete Modal -->
    <ModalDialog :show="showDelete" title="Delete Teacher" @close="showDelete=false">
      <p class="text-sm text-surface-600 mb-6">Delete <strong>{{ deleteTarget?.name }}</strong>? Their login account will also be removed.</p>
      <div class="flex justify-end gap-3">
        <button @click="showDelete=false" class="btn-secondary">Cancel</button>
        <button @click="doDelete" class="btn-danger" :disabled="saving">{{ saving ? 'Deleting...' : 'Delete' }}</button>
      </div>
    </ModalDialog>

    <!-- Profile Modal -->
    <ProfileModal :show="showProfile" type="teacher" :itemId="profileId" @close="showProfile = false" />
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import ProfileModal from '../../components/ProfileModal.vue'
import { authAPI, teacherAPI, adminAPI } from '../../services/api'
import { useAuth } from '../../stores/auth'

const { user, setAuth } = useAuth()

const teachers      = ref([])
const classes       = ref([])
const loading       = ref(true)
const saving        = ref(false)
const linking       = ref(false)
const linkTeacherId = ref('')
const myTeacherLinked = ref(!!user.value?.teacherRef)
const showModal    = ref(false)
const showDelete   = ref(false)
const showProfile  = ref(false)
const profileId    = ref(null)
const editId       = ref(null)
const deleteTarget = ref(null)
const alert        = ref({ msg:'', type:'success' })

const emptyForm = () => ({
  name:'', department:'', email:'', phone:'', username:'', password:'',
  isClassTeacher: false, assignedClass: ''
})
const form = ref(emptyForm())

const showAlert = (msg, type='success') => {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg='', 3500)
}

const linkMyProfile = async () => {
  if (!linkTeacherId.value) return
  linking.value = true
  try {
    const { data } = await adminAPI.linkTeacher(linkTeacherId.value)
    // Update stored user so teacherRef is reflected immediately
    const stored = JSON.parse(localStorage.getItem('user') || '{}')
    stored.teacherRef = data.user.teacherRef
    localStorage.setItem('user', JSON.stringify(stored))
    myTeacherLinked.value = true
    showAlert('Teacher profile linked! Go to Subjects to assign subjects to yourself.', 'success')
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to link profile', 'error')
  } finally { linking.value = false }
}

// Fetch teachers by getting all users with role=teacher
const fetchTeachers = async () => {
  loading.value = true
  try {
    const [usersRes, teachersRes, classesRes] = await Promise.all([
      adminAPI.users(),
      teacherAPI.getAll(),
      adminAPI.classes(),
    ])
    const teacherUsers = usersRes.data.users.filter(u => u.role === 'teacher')
    classes.value = classesRes.data.classes || []
    teachers.value = teacherUsers.map(u => {
      const profile = teachersRes.data.teachers.find(
        t => t._id === u.teacherRef?.toString() || t.userId?.toString() === u._id?.toString()
      )
      return {
        _id:            profile?._id || u._id,
        userId:         u._id,
        name:           u.name,
        username:       u.username,
        department:     profile?.department || '',
        email:          profile?.email || '',
        phone:          profile?.phone || '',
        isClassTeacher: profile?.isClassTeacher || false,
        assignedClass:  profile?.assignedClass || '',
      }
    })
  } catch { showAlert('Failed to load teachers','error') }
  finally { loading.value = false }
}

const openAdd  = () => { editId.value=null; form.value=emptyForm(); showModal.value=true }
const openProfile = (id) => { profileId.value = id; showProfile.value = true }
const openEdit = (t) => {
  editId.value = t._id
  form.value = {
    name: t.name, department: t.department||'', email: t.email||'',
    phone: t.phone||'', username:'', password:'',
    isClassTeacher: t.isClassTeacher||false, assignedClass: t.assignedClass||''
  }
  showModal.value = true
}
const closeModal = () => { showModal.value=false; editId.value=null }

const save = async () => {
  if (form.value.isClassTeacher && !form.value.assignedClass) {
    showAlert('Please select an assigned class for the class teacher.', 'error')
    return
  }
  saving.value = true
  try {
    if (editId.value) {
      await teacherAPI.update(editId.value, {
        name:           form.value.name,
        department:     form.value.department,
        email:          form.value.email,
        phone:          form.value.phone,
        isClassTeacher: form.value.isClassTeacher,
        assignedClass:  form.value.isClassTeacher ? form.value.assignedClass : '',
      })
      showAlert('Teacher updated')
    } else {
      await authAPI.createUser({
        role:           'teacher',
        username:       form.value.username,
        password:       form.value.password,
        name:           form.value.name,
        department:     form.value.department,
        email:          form.value.email,
        phone:          form.value.phone,
        isClassTeacher: form.value.isClassTeacher,
        assignedClass:  form.value.isClassTeacher ? form.value.assignedClass : '',
      })
      showAlert('Teacher account created')
    }
    closeModal(); fetchTeachers()
  } catch (e) {
    showAlert(e.response?.data?.message || 'Operation failed','error')
  } finally { saving.value=false }
}

const confirmDelete = (t) => { deleteTarget.value=t; showDelete.value=true }
const doDelete = async () => {
  saving.value = true
  try {
    await teacherAPI.delete(deleteTarget.value._id)
    showAlert('Teacher deleted')
    showDelete.value=false; fetchTeachers()
  } catch { showAlert('Delete failed','error') }
  finally { saving.value=false }
}

onMounted(fetchTeachers)
</script>
