<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-lg font-bold text-surface-900">Saved Question Papers</h2>
      <p class="text-sm text-surface-500">All papers saved by teachers</p>
    </div>

    <!-- Search -->
    <div class="card mb-5">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input v-model="search" type="text" class="input pl-9" placeholder="Search by subject, class, teacher..." />
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="filteredPapers.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="p in filteredPapers" :key="p._id"
        class="card hover:shadow-card-md transition-all group">
        <div class="flex items-start justify-between mb-3">
          <div class="min-w-0 flex-1">
            <p class="font-bold text-surface-900 truncate">{{ p.subject || 'Untitled' }}</p>
            <p class="text-xs text-surface-500 mt-0.5">
              {{ p.class }} · Sem {{ p.semester }} · {{ p.totalMarks }} Marks
            </p>
            <p class="text-xs text-surface-400 mt-0.5">
              By: <strong>{{ p.teacherId?.name || 'Unknown' }}</strong>
            </p>
            <p class="text-xs text-surface-400">{{ formatDate(p.updatedAt) }}</p>
          </div>
          <!-- Actions -->
          <div class="flex items-center ml-2">
            <!-- View / Print -->
            <button @click="openPaper(p)" :disabled="loadingPaper"
              class="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0"
              title="View / Print">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
            <!-- Delete (admin only) -->
            <button @click="deletePaper(p._id)"
              class="p-1.5 rounded-lg text-surface-400 hover:text-danger hover:bg-danger-light transition-all opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0"
              title="Delete">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-1">
          <span v-if="p.subjectCode" class="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-200">{{ p.subjectCode }}</span>
          <span v-if="p.class" :class="['text-xs px-2 py-0.5 rounded-full border font-semibold', classChip(p.class)]">{{ p.class }}</span>
          <span class="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">{{ p.sections?.length || 0 }} sections</span>
          <span class="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">{{ p.duration }}</span>
        </div>
      </div>
    </div>

    <div v-else class="card text-center py-16 border-2 border-dashed border-surface-200">
      <svg class="w-12 h-12 mx-auto mb-3 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p class="text-sm text-surface-500">No saved papers yet.</p>
    </div>

    <div v-if="alertMsg" :class="['fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium shadow-card-lg border z-50',
      alertType==='success' ? 'bg-success-light text-success-dark border-success/20' : 'bg-danger-light text-danger-dark border-danger/20']">
      {{ alertMsg }}
    </div>

    <!-- Paper View Modal -->
    <div v-if="viewingPaper" class="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div>
            <h3 class="font-bold text-surface-900">{{ viewingPaper.subject || 'Untitled Paper' }}</h3>
            <p class="text-xs text-surface-500 mt-0.5">{{ viewingPaper.class }} · Sem {{ viewingPaper.semester }} · By {{ viewingPaper.teacherId?.name }}</p>
          </div>
          <div class="flex gap-2">
            <button @click="printAdminPaper" class="btn-primary text-sm py-2 px-4">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Print
            </button>
            <button @click="viewingPaper = null" class="p-2 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        <!-- A4 Preview -->
        <div class="p-4 bg-surface-50">
          <div id="admin-paper-preview"
            style="font-family: 'Times New Roman', Times, serif; padding: 20mm 18mm; min-height: 200mm; font-size: 11pt; color: #000; background: #fff; max-width: 210mm; margin: 0 auto; box-shadow: 0 2px 12px rgba(0,0,0,0.12);">
            <!-- College Header -->
            <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 4px;">
                <img src="https://sevasadan.s3.eu-north-1.amazonaws.com/sswebsite/institutelogo/1773488367_SSRKT.jpg"
                  alt="RKT College Logo" style="width: 64px; height: 64px; object-fit: contain; flex-shrink: 0;" />
                <div style="text-align: left;">
                  <div style="font-size: 15pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">
                    RKT College of Arts, Science &amp; Commerce
                  </div>
                  <div style="font-size: 10pt; font-weight: 600; margin-top: 3px;">Department of CS &amp; IT</div>
                  <div style="font-size: 9pt; color: #333; margin-top: 2px;">Affiliated to University of Mumbai</div>
                </div>
              </div>
            </div>
            <!-- Meta Table -->
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin: 8px 0;">
              <tr>
                <td style="padding: 2px 0; width: 50%;">
                  <strong>Subject:</strong> {{ viewingPaper.subject || '___' }}
                  <span v-if="viewingPaper.subjectCode"> ({{ viewingPaper.subjectCode }})</span>
                </td>
                <td style="padding: 2px 0; text-align: right;"><strong>Total Marks:</strong> {{ viewingPaper.totalMarks || '___' }}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;"><strong>Class:</strong> {{ viewingPaper.class || '___' }} &nbsp;|&nbsp; <strong>Sem:</strong> {{ viewingPaper.semester || '___' }}</td>
                <td style="padding: 2px 0; text-align: right;"><strong>Duration:</strong> {{ viewingPaper.duration || '___' }}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;"><strong>Date:</strong> {{ viewingPaper.date ? formatDate(viewingPaper.date) : '___' }}</td>
                <td></td>
              </tr>
            </table>
            <!-- Instructions -->
            <div style="border: 1px solid #000; padding: 5px 10px; margin: 8px 0; font-size: 9.5pt;">
              <strong>Instructions:</strong>
              <ol style="margin: 3px 0 0 16px; padding: 0;">
                <li>All questions are compulsory.</li>
                <li>Figures to the right indicate marks.</li>
                <li>Assume suitable data wherever necessary.</li>
                <li>Draw neat diagrams wherever required.</li>
              </ol>
            </div>
            <!-- Sections -->
            <div v-if="viewingPaper.sections && viewingPaper.sections.length">
              <div v-for="(section, si) in viewingPaper.sections" :key="si" style="margin-bottom: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #555; padding-bottom: 3px; margin-bottom: 6px;">
                  <span style="font-weight: bold; font-size: 11pt;">
                    Q.{{ si + 1 }}.
                    <span style="font-weight: normal; font-style: italic; font-size: 10pt;">{{ section.instruction }}</span>
                  </span>
                  <span style="font-weight: bold; font-size: 10pt; white-space: nowrap;">[{{ sectionTotal(section) }} Marks]</span>
                </div>
                <ol style="list-style-type: lower-alpha; padding-left: 22px; margin: 0;">
                  <li v-for="(q, qi) in section.questions.filter(q => q.trim())" :key="qi"
                    style="margin-bottom: 8px; line-height: 1.5; font-size: 10.5pt;">
                    <span style="display: flex; justify-content: space-between; gap: 8px;">
                      <span>{{ q }}</span>
                      <span style="font-weight: bold; white-space: nowrap; flex-shrink: 0;">[{{ section.marksEach || '—' }}]</span>
                    </span>
                  </li>
                </ol>
              </div>
            </div>
            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 8px; border-top: 1px solid #000; text-align: center;">
              <div style="font-size: 11pt; font-weight: bold; letter-spacing: 4px;">*****************ALL THE BEST*****************</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Hidden print iframe -->
    <iframe id="admin-print-frame" style="display:none; position:fixed; top:-9999px; left:-9999px; width:0; height:0;" title="admin-print"></iframe>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { paperAPI } from '../../services/api'
import { getClassChip } from '../../utils/constants'

const papers    = ref([])
const loading   = ref(true)
const search    = ref('')
const alertMsg  = ref('')
const alertType = ref('success')
const viewingPaper  = ref(null)
const loadingPaper  = ref(false)

const classChip = (cls) => getClassChip(cls)

const filteredPapers = computed(() => {
  if (!search.value.trim()) return papers.value
  const q = search.value.toLowerCase()
  return papers.value.filter(p =>
    p.subject?.toLowerCase().includes(q) ||
    p.class?.toLowerCase().includes(q) ||
    p.teacherId?.name?.toLowerCase().includes(q) ||
    p.subjectCode?.toLowerCase().includes(q)
  )
})

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const showAlert = (msg, type = 'success') => {
  alertMsg.value = msg; alertType.value = type
  setTimeout(() => alertMsg.value = '', 3000)
}

const fetchPapers = async () => {
  loading.value = true
  try {
    const { data } = await paperAPI.getAll()
    papers.value = data.papers
  } catch { papers.value = [] }
  finally { loading.value = false }
}

const deletePaper = async (id) => {
  if (!confirm('Delete this paper?')) return
  try {
    await paperAPI.delete(id)
    showAlert('Paper deleted')
    fetchPapers()
  } catch { showAlert('Delete failed', 'error') }
}

const sectionTotal = (section) => {
  const count = section.questions.filter(q => q.trim()).length
  return (section.marksEach || 0) * count
}

const openPaper = async (p) => {
  loadingPaper.value = true
  try {
    const { data } = await paperAPI.getOne(p._id)
    viewingPaper.value = data.paper
  } catch {
    showAlert('Failed to load paper', 'error')
  } finally {
    loadingPaper.value = false
  }
}

const printAdminPaper = () => {
  const content = document.getElementById('admin-paper-preview').innerHTML
  const frame = document.getElementById('admin-print-frame')
  if (!frame) return
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4;margin:14mm 18mm;}*{box-sizing:border-box;margin:0;padding:0;}html,body{font-family:'Times New Roman',Times,serif;font-size:11pt;color:#000;background:#fff;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact;}table{width:100%;border-collapse:collapse;}ol{padding-left:22px;}li{margin-bottom:7px;line-height:1.5;}strong{font-weight:bold;}img{max-width:100%;}</style></head><body>${content}</body></html>`
  const doc = frame.contentDocument || frame.contentWindow.document
  doc.open(); doc.write(html); doc.close()
  const img = doc.querySelector('img')
  const doPrint = () => { frame.contentWindow.focus(); frame.contentWindow.print() }
  if (img && !img.complete) { img.onload = doPrint; img.onerror = doPrint; setTimeout(doPrint, 1500) }
  else { setTimeout(doPrint, 300) }
}

onMounted(fetchPapers)
</script>
