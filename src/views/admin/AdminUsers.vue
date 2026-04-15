<template>
  <AppLayout>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-lg font-semibold text-surface-900">All Users</h2>
        <p class="text-sm text-surface-500">{{ users.length }} total accounts</p>
      </div>
      <button @click="openCreate" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Create User
      </button>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />

    <!-- Role filter tabs -->
    <div class="flex gap-2 mb-5 flex-wrap">
      <button v-for="r in ['all','admin','teacher','student']" :key="r"
        @click="roleFilter=r"
        :class="['px-4 py-1.5 rounded-lg text-sm font-medium transition-all border',
          roleFilter===r ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50']">
        {{ r.charAt(0).toUpperCase()+r.slice(1) }}
        <span class="ml-1 text-xs opacity-70">({{ r==='all' ? users.length : users.filter(u=>u.role===r).length }})</span>
      </button>
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
              <th class="table-th">Role</th>
              <th class="table-th">Created</th>
              <th class="table-th">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100">
            <tr v-for="(u,i) in filteredUsers" :key="u._id" class="hover:bg-surface-50">
              <td class="table-td text-surface-400">{{ i+1 }}</td>
              <td class="table-td font-medium text-surface-900">{{ u.name }}</td>
              <td class="table-td font-mono text-xs text-surface-700">{{ u.username }}</td>
              <td class="table-td">
                <span :class="['px-2 py-0.5 text-xs rounded-full font-medium',
                  u.role==='admin'   ? 'bg-purple-100 text-purple-700' :
                  u.role==='teacher' ? 'bg-blue-100 text-blue-700' :
                                       'bg-emerald-100 text-emerald-700']">
                  {{ u.role }}
                </span>
              </td>
              <td class="table-td text-surface-500 text-xs">{{ new Date(u.createdAt).toLocaleDateString('en-IN') }}</td>
              <td class="table-td">
                <div class="flex gap-2">
                  <button @click="openReset(u)" class="text-orange-600 text-xs font-medium hover:underline">Reset Pwd</button>
                  <button v-if="u.username !== 'pkc001'" @click="confirmDelete(u)" class="text-danger text-xs font-medium hover:underline">Delete</button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredUsers.length">
              <td colspan="6" class="table-td text-center text-surface-400 py-10">No users found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create User Modal -->
    <ModalDialog :show="showCreate" title="Create User Account" @close="showCreate=false">
      <form @submit.prevent="createUser" class="space-y-4">
        <!-- Role selector -->
        <div>
          <label class="label">Role</label>
          <div class="grid grid-cols-3 gap-2">
            <button v-for="r in ['admin','teacher','student']" :key="r" type="button"
              @click="createForm.role=r"
              :class="['py-2 rounded-lg border-2 text-sm font-medium transition-all',
                createForm.role===r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-600 hover:border-surface-300']">
              {{ r==='admin'?'🔑':r==='teacher'?'👨‍🏫':'🎓' }} {{ r.charAt(0).toUpperCase()+r.slice(1) }}
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Full Name</label>
            <input v-model="createForm.name" type="text" class="input" required />
          </div>
          <div>
            <label class="label">Username</label>
            <input v-model="createForm.username" type="text" class="input" required />
          </div>
        </div>
        <div>
          <label class="label">Password</label>
          <input v-model="createForm.password" type="password" class="input" required />
        </div>
        <template v-if="createForm.role==='student'">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Roll Number</label>
              <input v-model="createForm.roll" type="text" class="input" required />
            </div>
            <div>
              <label class="label">Class</label>
              <select v-model="createForm.studentClass" class="input" required>
                <option value="">— Select Class —</option>
                <option v-for="cls in CLASS_LIST" :key="cls" :value="cls">{{ cls }}</option>
              </select>
            </div>
          </div>
        </template>
        <template v-if="createForm.role==='teacher'">
          <div>
            <label class="label">Department</label>
            <select v-model="createForm.department" class="input">
              <option value="">Select Department</option>
              <option value="CS">CS (Computer Science)</option>
              <option value="IT">IT (Information Technology)</option>
            </select>
          </div>
        </template>
        <div>
          <label class="label">Email <span class="text-surface-400 font-normal">(optional)</span></label>
          <input v-model="createForm.email" type="email" class="input" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showCreate=false" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="creating">
            {{ creating ? 'Creating...' : 'Create Account' }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- Reset Password Modal -->
    <ModalDialog :show="showReset" title="Reset Password" @close="showReset=false">
      <div class="space-y-4">
        <p class="text-sm text-surface-600">Reset password for <strong>{{ resetTarget?.name }}</strong> ({{ resetTarget?.username }}).</p>
        <div>
          <label class="label">New Password</label>
          <input v-model="resetPwd" type="text" class="input" placeholder="Enter new password" />
        </div>
        <div class="flex justify-end gap-3">
          <button @click="showReset=false" class="btn-secondary">Cancel</button>
          <button @click="doReset" :disabled="resetting" class="btn-primary">
            {{ resetting ? 'Resetting...' : 'Reset Password' }}
          </button>
        </div>
      </div>
    </ModalDialog>

    <!-- Delete Modal -->
    <ModalDialog :show="showDelete" title="Delete User" @close="showDelete=false">
      <p class="text-sm text-surface-600 mb-6">Delete <strong>{{ deleteTarget?.name }}</strong> ({{ deleteTarget?.username }})? This cannot be undone.</p>
      <div class="flex justify-end gap-3">
        <button @click="showDelete=false" class="btn-secondary">Cancel</button>
        <button @click="doDelete" class="btn-danger" :disabled="deleting">{{ deleting ? 'Deleting...' : 'Delete' }}</button>
      </div>
    </ModalDialog>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { adminAPI, authAPI } from '../../services/api'
import { CLASS_LIST } from '../../utils/constants'

const users       = ref([])
const loading     = ref(true)
const roleFilter  = ref('all')
const alert       = ref({ msg:'', type:'success' })

const showCreate  = ref(false)
const creating    = ref(false)
const createForm  = ref({ role:'student', name:'', username:'', password:'', roll:'', studentClass:'', department:'', email:'' })

const showReset   = ref(false)
const resetTarget = ref(null)
const resetPwd    = ref('')
const resetting   = ref(false)

const showDelete  = ref(false)
const deleteTarget= ref(null)
const deleting    = ref(false)

const filteredUsers = computed(() =>
  roleFilter.value === 'all' ? users.value : users.value.filter(u => u.role === roleFilter.value)
)

const showAlert = (msg, type='success') => {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg='', 3500)
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const { data } = await adminAPI.users()
    users.value = data.users
  } catch { showAlert('Failed to load users','error') }
  finally { loading.value=false }
}

const openCreate = () => {
  createForm.value = { role:'student', name:'', username:'', password:'', roll:'', studentClass:'', department:'', email:'' }
  showCreate.value = true
}

const createUser = async () => {
  creating.value = true
  try {
    await authAPI.createUser(createForm.value)
    showAlert('User created successfully')
    showCreate.value=false; fetchUsers()
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to create user','error')
  } finally { creating.value=false }
}

const openReset = (u) => { resetTarget.value=u; resetPwd.value=''; showReset.value=true }
const doReset = async () => {
  if (!resetPwd.value) return showAlert('Enter a new password','error')
  resetting.value = true
  try {
    await authAPI.resetPassword(resetTarget.value._id, resetPwd.value)
    showAlert(`Password reset for ${resetTarget.value.username}`)
    showReset.value=false
  } catch (e) {
    showAlert(e.response?.data?.message || 'Reset failed','error')
  } finally { resetting.value=false }
}

const confirmDelete = (u) => { deleteTarget.value=u; showDelete.value=true }
const doDelete = async () => {
  deleting.value = true
  try {
    await adminAPI.deleteUser(deleteTarget.value._id)
    showAlert('User deleted')
    showDelete.value=false; fetchUsers()
  } catch { showAlert('Delete failed','error') }
  finally { deleting.value=false }
}

onMounted(fetchUsers)
</script>
