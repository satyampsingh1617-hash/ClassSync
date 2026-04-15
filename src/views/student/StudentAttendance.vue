<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-surface-900">My Attendance History</h2>
      <p class="text-sm text-surface-500">Detailed attendance records by subject</p>
    </div>

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- Subject filter tabs -->
      <div class="flex gap-2 flex-wrap mb-5">
        <button
          @click="activeSubject = null"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            !activeSubject ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
          ]"
        >All Subjects</button>
        <button
          v-for="sub in bySubject"
          :key="sub.subject?._id"
          @click="activeSubject = sub.subject?._id"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeSubject === sub.subject?._id ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
          ]"
        >{{ sub.subject?.code }}</button>
      </div>

      <!-- Subject summary cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <div
          v-for="sub in filteredSubjects"
          :key="sub.subject?._id"
          class="card cursor-pointer hover:shadow-md transition-shadow"
          @click="activeSubject = sub.subject?._id"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <h4 class="font-semibold text-surface-900">{{ sub.subject?.name }}</h4>
              <span class="font-mono text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-lg border border-orange-200 mt-1 inline-block">{{ sub.subject?.code }}</span>
            </div>
            <span :class="[
              'text-lg font-bold',
              parseFloat(sub.percentage) >= 75 ? 'text-emerald-600' : 'text-red-500'
            ]">{{ sub.percentage }}%</span>
          </div>

          <!-- Progress bar -->
          <div class="w-full bg-surface-100 rounded-full h-2 mb-2">
            <div
              class="h-2 rounded-full transition-all duration-700"
              :class="parseFloat(sub.percentage) >= 75 ? 'bg-emerald-500' : 'bg-red-400'"
              :style="{ width: `${Math.min(100, sub.percentage)}%` }"
            ></div>
          </div>

          <div class="flex justify-between text-xs text-surface-500">
            <span>Present: <strong class="text-emerald-600">{{ sub.present }}</strong></span>
            <span>Absent: <strong class="text-red-500">{{ sub.absent }}</strong></span>
            <span>Total: <strong class="text-surface-700">{{ sub.total }}</strong></span>
          </div>

          <div v-if="parseFloat(sub.percentage) < 75" class="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-lg">
            ⚠ Below 75% — Need {{ Math.max(0, Math.ceil((0.75 * sub.total - sub.present) / 0.25)) }} more lectures to reach 75%
          </div>
          <div v-else class="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
            ✓ Good standing
          </div>
        </div>
      </div>

      <!-- Detailed records table -->
      <div class="card p-0 overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-100">
          <h3 class="font-semibold text-surface-900">Attendance Records</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th class="table-th">#</th>
                <th class="table-th">Subject</th>
                <th class="table-th">Date</th>
                <th class="table-th">Status</th>
                <th class="table-th">Method</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100">
              <tr v-for="(rec, i) in filteredRecords" :key="rec._id" class="hover:bg-surface-50">
                <td class="table-td text-surface-400">{{ i + 1 }}</td>
                <td class="table-td">
                  <div>
                    <p class="font-medium text-surface-900">{{ rec.subjectId?.name }}</p>
                    <p class="text-xs text-surface-400">{{ rec.subjectId?.code }}</p>
                  </div>
                </td>
                <td class="table-td text-surface-500">{{ rec.date }}</td>
                <td class="table-td">
                  <span :class="rec.status === 'Present' ? 'badge-present' : 'badge-absent'">{{ rec.status }}</span>
                </td>
                <td class="table-td">
                  <span class="text-xs px-2 py-0.5 rounded-full" :class="rec.method === 'otp' ? 'bg-blue-50 text-blue-700' : 'bg-surface-100 text-surface-600'">
                    {{ rec.method }}
                  </span>
                </td>
              </tr>
              <tr v-if="!filteredRecords.length">
                <td colspan="5" class="table-td text-center text-surface-400 py-10">No records found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { studentAPI } from '../../services/api'

const loading       = ref(true)
const bySubject     = ref([])
const activeSubject = ref(null)

const filteredSubjects = computed(() => {
  if (!activeSubject.value) return bySubject.value
  return bySubject.value.filter(s => s.subject?._id === activeSubject.value)
})

const filteredRecords = computed(() => {
  // Flatten all records from all subjects
  const allRecords = bySubject.value.flatMap(s => s.records || [])
  const sorted = [...allRecords].sort((a, b) => b.date.localeCompare(a.date))
  if (!activeSubject.value) return sorted
  // Match by populated _id string OR raw ObjectId string
  return sorted.filter(r => {
    const subId = r.subjectId?._id?.toString() || r.subjectId?.toString()
    return subId === activeSubject.value
  })
})

onMounted(async () => {
  try {
    const { data } = await studentAPI.myAttendance()
    bySubject.value = data.bySubject
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
