<template>
  <AppLayout>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Subjects</h2>
        <p class="text-sm text-gray-500">{{ subjects.length }} subjects</p>
      </div>
      <button @click="openAdd" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Subject
      </button>
    </div>

    <AlertMessage :message="alert.msg" :type="alert.type" class="mb-4" />

    <div class="card p-0 overflow-hidden">
      <LoadingSpinner v-if="loading" />
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="table-th">#</th>
              <th class="table-th">Subject Name</th>
              <th class="table-th">Code</th>
              <th class="table-th">Class</th>
              <th class="table-th">Teacher</th>
              <th class="table-th">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(s, i) in subjects" :key="s._id" class="hover:bg-gray-50">
              <td class="table-td text-gray-400">{{ i + 1 }}</td>
              <td class="table-td font-medium text-gray-900">{{ s.name }}</td>
              <td class="table-td"><span class="font-mono text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">{{ s.code }}</span></td>
              <td class="table-td"><span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{{ s.class }}</span></td>
              <td class="table-td text-gray-500">{{ s.teacherId?.name || 'Unassigned' }}</td>
              <td class="table-td">
                <div class="flex items-center gap-2">
                  <button @click="openEdit(s)" class="text-brand-600 hover:text-brand-800 text-xs font-medium">Edit</button>
                  <button @click="confirmDelete(s)" class="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </div>
              </td>
            </tr>
            <tr v-if="!subjects.length">
              <td colspan="6" class="table-td text-center text-gray-400 py-10">No subjects found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <ModalDialog :show="showModal" :title="editId ? 'Edit Subject' : 'Add Subject'" @close="closeModal">
      <form @submit.prevent="saveSubject" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Subject Name</label>
            <input v-model="form.name" type="text" class="input" required />
          </div>
          <div>
            <label class="label">Subject Code</label>
            <input v-model="form.code" type="text" class="input" placeholder="e.g. CS101" required />
          </div>
        </div>
        <div>
          <label class="label">Class</label>
          <select v-model="form.class" class="input" required>
            <option value="">— Select Class —</option>
            <option v-for="cls in CLASS_LIST" :key="cls" :value="cls">{{ cls }}</option>
          </select>
        </div>
        <div>
          <label class="label">Assign Teacher</label>
          <select v-model="form.teacherId" class="input">
            <option value="">— Unassigned —</option>
            <option v-for="t in teachers" :key="t._id" :value="t._id">{{ t.name }} ({{ t.department || 'N/A' }})</option>
          </select>
        </div>
        <div>
          <label class="label">Description</label>
          <textarea v-model="form.description" class="input" rows="2" placeholder="Optional description"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="closeModal" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : (editId ? 'Update' : 'Add Subject') }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- Delete confirm -->
    <ModalDialog :show="showDelete" title="Delete Subject" @close="showDelete = false">
      <p class="text-sm text-gray-600 mb-6">Delete subject <strong>{{ deleteTarget?.name }}</strong>?</p>
      <div class="flex justify-end gap-3">
        <button @click="showDelete = false" class="btn-secondary">Cancel</button>
        <button @click="deleteSubject" class="btn-danger" :disabled="saving">{{ saving ? 'Deleting...' : 'Delete' }}</button>
      </div>
    </ModalDialog>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import AlertMessage from '../../components/AlertMessage.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { subjectAPI, teacherAPI } from '../../services/api'
import { CLASS_LIST } from '../../utils/constants'

const subjects     = ref([])
const teachers     = ref([])
const loading      = ref(true)
const saving       = ref(false)
const showModal    = ref(false)
const showDelete   = ref(false)
const editId       = ref(null)
const deleteTarget = ref(null)
const alert        = ref({ msg: '', type: 'success' })

const emptyForm = () => ({ name: '', code: '', class: '', teacherId: '', description: '' })
const form = ref(emptyForm())

const showAlert = (msg, type = 'success') => {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg = '', 3000)
}

const fetchAll = async () => {
  loading.value = true
  try {
    const [subRes, tchRes] = await Promise.all([subjectAPI.getAll(), teacherAPI.getAll()])
    subjects.value = subRes.data.subjects
    teachers.value = tchRes.data.teachers
  } catch (e) {
    showAlert('Failed to load data', 'error')
  } finally {
    loading.value = false
  }
}

const openAdd  = () => { editId.value = null; form.value = emptyForm(); showModal.value = true }
const openEdit = (s) => {
  editId.value = s._id
  form.value = { name: s.name, code: s.code, class: s.class, teacherId: s.teacherId?._id || '', description: s.description || '' }
  showModal.value = true
}
const closeModal = () => { showModal.value = false; editId.value = null }

const saveSubject = async () => {
  saving.value = true
  try {
    if (editId.value) {
      await subjectAPI.update(editId.value, form.value)
      showAlert('Subject updated')
    } else {
      await subjectAPI.create(form.value)
      showAlert('Subject added')
    }
    closeModal(); fetchAll()
  } catch (e) {
    showAlert(e.response?.data?.message || 'Operation failed', 'error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (s) => { deleteTarget.value = s; showDelete.value = true }
const deleteSubject = async () => {
  saving.value = true
  try {
    await subjectAPI.delete(deleteTarget.value._id)
    showAlert('Subject deleted')
    showDelete.value = false; fetchAll()
  } catch (e) {
    showAlert('Delete failed', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(fetchAll)
</script>
