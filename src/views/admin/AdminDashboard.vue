<template>
  <AppLayout>
    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- Stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Total Students"
          :value="stats.totalStudents"
          sub="Enrolled students"
          :icon="icons.students"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Total Teachers"
          :value="stats.totalTeachers"
          sub="Faculty members"
          :icon="icons.teachers"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          label="Total Subjects"
          :value="stats.totalSubjects"
          sub="Active subjects"
          :icon="icons.subjects"
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatCard
          label="Overall Attendance"
          :value="`${stats.overallPercentage}%`"
          :sub="`${stats.presentCount} / ${stats.totalAttendance} present`"
          :icon="icons.attendance"
          :iconBg="parseFloat(stats.overallPercentage) >= 75 ? 'bg-green-50' : 'bg-red-50'"
          :iconColor="parseFloat(stats.overallPercentage) >= 75 ? 'text-green-600' : 'text-red-600'"
        />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Attendance chart -->
        <div class="card">
          <h3 class="text-base font-semibold text-surface-900 mb-4">Attendance — Last 7 Days</h3>
          <Bar v-if="chartData" :data="chartData" :options="chartOptions" class="max-h-64" />
          <p v-else class="text-sm text-surface-400 text-center py-8">No data available</p>
        </div>

        <!-- Recent attendance -->
        <div class="card">
          <h3 class="text-base font-semibold text-surface-900 mb-4">Recent Attendance</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-surface-100">
                  <th class="table-th">Student</th>
                  <th class="table-th">Subject</th>
                  <th class="table-th">Date</th>
                  <th class="table-th">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-50">
                <tr v-for="rec in recentAttendance" :key="rec._id" class="hover:bg-surface-50">
                  <td class="table-td font-medium text-surface-900">{{ rec.studentId?.name }}</td>
                  <td class="table-td text-surface-500">{{ rec.subjectId?.code }}</td>
                  <td class="table-td text-surface-500">{{ rec.date }}</td>
                  <td class="table-td">
                    <span :class="rec.status === 'Present' ? 'badge-present' : 'badge-absent'">
                      {{ rec.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!recentAttendance.length">
                  <td colspan="4" class="table-td text-center text-surface-400 py-6">No records yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import AppLayout from '../../components/AppLayout.vue'
import StatCard from '../../components/StatCard.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { adminAPI } from '../../services/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const loading         = ref(true)
const stats           = ref({ totalStudents: 0, totalTeachers: 0, totalSubjects: 0, totalAttendance: 0, presentCount: 0, overallPercentage: '0.0' })
const recentAttendance = ref([])
const dailyStats      = ref([])

const icons = {
  students:  `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`,
  teachers:  `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
  subjects:  `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  attendance:`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
}

// Build chart data from dailyStats
const chartData = computed(() => {
  if (!dailyStats.value.length) return null
  const dateMap = {}
  dailyStats.value.forEach(({ _id, count }) => {
    if (!dateMap[_id.date]) dateMap[_id.date] = { Present: 0, Absent: 0 }
    dateMap[_id.date][_id.status] = count
  })
  const labels = Object.keys(dateMap).sort()
  return {
    labels,
    datasets: [
      { label: 'Present', data: labels.map(d => dateMap[d].Present || 0), backgroundColor: '#22c55e', borderRadius: 6 },
      { label: 'Absent',  data: labels.map(d => dateMap[d].Absent  || 0), backgroundColor: '#ef4444', borderRadius: 6 },
    ],
  }
})

const chartOptions = {
  responsive: true,
  plugins: { legend: { position: 'top' } },
  scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f3f4f6' } } },
}

onMounted(async () => {
  try {
    const { data } = await adminAPI.dashboard()
    if (data.success) {
      stats.value           = data.stats
      recentAttendance.value = data.recentAttendance
      dailyStats.value      = data.dailyStats
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
