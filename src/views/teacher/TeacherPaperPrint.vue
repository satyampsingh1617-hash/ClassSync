<template>
  <AppLayout>
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="text-lg font-bold text-surface-900">Paper Architect</h2>
        <p class="text-sm text-surface-500">RKT College — Dynamic question paper generator</p>
      </div>
      <div class="flex gap-2">
        <button @click="generateSections" :disabled="!canGenerate"
          class="btn-secondary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Auto-Generate
        </button>
        <button @click="savePaper" :disabled="saving" class="btn-secondary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          {{ saving ? 'Saving...' : (paper._id ? 'Update' : 'Save Paper') }}
        </button>
        <button @click="printPaper" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
          </svg>
          Print Paper
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <!-- ── LEFT: Input Form ─────────────────────────────── -->
      <div class="space-y-4">

        <!-- Fixed college info notice -->
        <div class="flex items-start gap-3 p-4 rounded-xl bg-brand-50 border border-brand-200">
          <svg class="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p class="text-xs font-bold text-brand-800">Fixed Header (Read-only)</p>
            <p class="text-xs text-brand-700 mt-0.5">
              RKT College of Arts, Science &amp; Commerce · Dept. of CS &amp; IT ·
              "All questions are compulsory" · "Figures to the right indicate marks"
            </p>
          </div>
        </div>

        <!-- Exam details -->
        <div class="card space-y-4">
          <p class="section-title">Exam Details</p>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Subject Name <span class="text-danger">*</span></label>
              <input v-model="paper.subject" type="text" class="input"
                placeholder="e.g. Data Structures" />
            </div>
            <div>
              <label class="label">Subject Code</label>
              <input v-model="paper.subjectCode" type="text" class="input"
                placeholder="e.g. CS301" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Class</label>
              <select v-model="paper.class" class="input">
                <option value="">— Select —</option>
                <option v-for="cls in CLASS_LIST" :key="cls" :value="cls">{{ cls }}</option>
              </select>
            </div>
            <div>
              <label class="label">Semester</label>
              <input v-model="paper.semester" type="text" class="input"
                placeholder="e.g. IV" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Exam Date</label>
              <input v-model="paper.date" type="date" class="input" />
            </div>
            <div>
              <label class="label">Duration</label>
              <select v-model="paper.duration" class="input">
                <option>1 Hour</option>
                <option>1.5 Hours</option>
                <option>2 Hours</option>
                <option>2.5 Hours</option>
                <option>3 Hours</option>
              </select>
            </div>
          </div>

          <div>
              <label class="label">Total Marks <span class="text-danger">*</span></label>
              <input v-model.number="paper.totalMarks" type="number" min="10" max="200"
                class="input" placeholder="e.g. 30" @change="onMarksChange" />
            </div>
        </div>

        <!-- Syllabus input -->
        <div class="card space-y-3">
          <div class="flex items-center justify-between">
            <p class="section-title">Syllabus / Topics</p>
            <span class="text-xs text-surface-400">Paste topics — one per line</span>
          </div>
          <textarea
            v-model="syllabusText"
            class="input resize-none font-mono text-xs"
            rows="6"
            placeholder="Paste syllabus topics here, one per line:&#10;Unit 1: Introduction to Arrays&#10;Unit 2: Linked Lists - Singly, Doubly&#10;Unit 3: Stack and Queue&#10;Unit 4: Trees - Binary, BST&#10;Unit 5: Sorting Algorithms&#10;Unit 6: Graph Theory"
          ></textarea>
          <p class="text-xs text-surface-400">
            {{ syllabusTopics.length }} topic(s) detected.
            Click <strong>Auto-Generate</strong> to build sections from these topics.
          </p>
        </div>

        <!-- Sections builder -->
        <div class="card space-y-4">
          <div class="flex items-center justify-between">
            <p class="section-title">Questions / Sections</p>
            <button @click="addSection" class="btn-secondary text-xs py-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Section
            </button>
          </div>

          <!-- Marks distribution hint -->
          <div v-if="paper.totalMarks && paper.sections.length" class="flex items-center gap-2 text-xs">
            <span class="text-surface-500">Allocated:</span>
            <span :class="allocatedMarks === paper.totalMarks ? 'text-success-dark font-bold' : 'text-warning-dark font-bold'">
              {{ allocatedMarks }} / {{ paper.totalMarks }} marks
            </span>
            <span v-if="allocatedMarks !== paper.totalMarks" class="text-warning-dark">
              ({{ allocatedMarks < paper.totalMarks ? '+' : '' }}{{ paper.totalMarks - allocatedMarks }} remaining)
            </span>
            <span v-else class="text-success-dark">✓ Balanced</span>
          </div>

          <div v-for="(section, si) in paper.sections" :key="si"
            class="p-4 rounded-xl border border-surface-200 bg-surface-50 space-y-3">
            <!-- Section header -->
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {{ si + 1 }}
              </span>
              <input v-model="section.instruction" type="text" class="input flex-1 text-sm font-semibold"
                :placeholder="`e.g. Attempt any 2 out of 4`" />
              <input v-model.number="section.marksEach" type="number" min="1"
                class="input w-20 text-sm text-center" placeholder="Marks" title="Marks per question" />
              <span class="text-xs text-surface-500 whitespace-nowrap">
                × {{ (() => { const m = section.instruction?.match(/attempt\s+any\s+(\d+)/i); const q = section.questions.filter(q=>q.trim()).length; return m ? Math.min(parseInt(m[1]),q) : q })() }} = {{ sectionTotal(section) }}
              </span>
              <button @click="paper.sections.splice(si,1)"
                class="p-1 rounded-lg text-surface-400 hover:text-danger hover:bg-danger-light transition-all flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Questions -->
            <div v-for="(q, qi) in section.questions" :key="qi" class="flex gap-2 items-start">
              <span class="text-xs text-surface-400 mt-2.5 w-5 flex-shrink-0 font-mono">{{ qi+1 }}.</span>
              <input v-model="section.questions[qi]" type="text" class="input flex-1 text-sm"
                :placeholder="`Question ${qi+1}`" />
              <button @click="section.questions.splice(qi,1)"
                class="p-1.5 rounded-lg text-surface-300 hover:text-danger hover:bg-danger-light transition-all flex-shrink-0 mt-0.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <button @click="section.questions.push('')"
              class="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Question
            </button>
          </div>

          <div v-if="!paper.sections.length"
            class="text-center py-8 text-surface-400 text-sm border-2 border-dashed border-surface-200 rounded-xl">
            Enter syllabus topics above and click <strong>Auto-Generate</strong>,
            or click <strong>Add Section</strong> manually.
          </div>
        </div>
      </div>

      <!-- ── RIGHT: Live A4 Preview ──────────────────────── -->
      <div class="xl:sticky xl:top-20 xl:self-start">
        <div class="flex items-center justify-between mb-3">
          <p class="section-title">Live Preview</p>
          <span class="text-xs text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">A4 · Print-ready</span>
        </div>

        <div class="bg-white border border-surface-300 rounded-2xl shadow-card-lg overflow-hidden"
          style="max-height: 82vh; overflow-y: auto;">
          <!-- A4 paper -->
          <div id="paper-preview"
            style="font-family: 'Times New Roman', Times, serif; padding: 20mm 18mm; min-height: 200mm; font-size: 11pt; color: #000; background: #fff;">

            <!-- ── FIXED HEADER — DO NOT CHANGE ── -->
            <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 4px;">
                <img
                  src="https://sevasadan.s3.eu-north-1.amazonaws.com/sswebsite/institutelogo/1773488367_SSRKT.jpg"
                  alt="RKT College Logo"
                  style="width: 64px; height: 64px; object-fit: contain; flex-shrink: 0;"
                />
                <div style="text-align: left;">
                  <div style="font-size: 15pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">
                    RKT College of Arts, Science &amp; Commerce
                  </div>
                  <div style="font-size: 10pt; font-weight: 600; margin-top: 3px;">
                    Department of CS &amp; IT
                  </div>
                  <div style="font-size: 9pt; color: #333; margin-top: 2px;">
                    Affiliated to University of Mumbai
                  </div>
                </div>
              </div>
            </div>

            
            <!-- Subject + meta info table -->
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin: 8px 0;">
              <tr>
                <td style="padding: 2px 0; width: 50%;">
                  <strong>Subject:</strong> {{ paper.subject || '_______________' }}
                  <span v-if="paper.subjectCode"> ({{ paper.subjectCode }})</span>
                </td>
                <td style="padding: 2px 0; text-align: right;">
                  <strong>Total Marks:</strong> {{ paper.totalMarks || '___' }}
                </td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">
                  <strong>Class:</strong> {{ paper.class || '___' }} &nbsp;|&nbsp;
                  <strong>Sem:</strong> {{ paper.semester || '___' }}
                </td>
                <td style="padding: 2px 0; text-align: right;">
                  <strong>Duration:</strong> {{ paper.duration || '___' }}
                </td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">
                  <strong>Date:</strong> {{ paper.date ? formatDate(paper.date) : '_______________' }}
                </td>
                <td></td>
              </tr>
            </table>

            <!-- ── FIXED INSTRUCTIONS — DO NOT CHANGE ── -->
            <div style="border: 1px solid #000; padding: 5px 10px; margin: 8px 0; font-size: 9.5pt;">
              <strong>Instructions:</strong>
              <ol style="margin: 3px 0 0 16px; padding: 0;">
                <li>All questions are compulsory.</li>
                <li>Figures to the right indicate marks.</li>
                <li>Assume suitable data wherever necessary.</li>
                <li>Draw neat diagrams wherever required.</li>
              </ol>
            </div>

            <!-- ── DYNAMIC SECTIONS ── -->
            <div v-if="paper.sections.length">
              <div v-for="(section, si) in paper.sections" :key="si" style="margin-bottom: 14px;">
                <!-- Question number + instruction -->
                <div style="display: flex; justify-content: space-between; align-items: baseline;
                  border-bottom: 1px solid #555; padding-bottom: 3px; margin-bottom: 6px;">
                  <span style="font-weight: bold; font-size: 11pt;">
                    Q.{{ si + 1 }}.
                    <span style="font-weight: normal; font-style: italic; font-size: 10pt;">
                      {{ section.instruction || `Attempt any questions` }}
                    </span>
                  </span>
                  <span style="font-weight: bold; font-size: 10pt; white-space: nowrap;">
                    [{{ sectionTotal(section) }} Marks]
                  </span>
                </div>

                <!-- Sub-questions -->
                <ol style="list-style-type: lower-alpha; padding-left: 22px; margin: 0;">
                  <li v-for="(q, qi) in section.questions.filter(q => q.trim())" :key="qi"
                    style="margin-bottom: 8px; line-height: 1.5; font-size: 10.5pt;">
                    <span style="display: flex; justify-content: space-between; gap: 8px;">
                      <span>{{ q }}</span>
                      <span style="font-weight: bold; white-space: nowrap; flex-shrink: 0;">
                        [{{ section.marksEach || '—' }}]
                      </span>
                    </span>
                  </li>
                </ol>

                <div v-if="!section.questions.filter(q=>q.trim()).length"
                  style="color: #aaa; font-style: italic; font-size: 9pt; padding-left: 22px;">
                  (Add questions above...)
                </div>
              </div>
            </div>

            <div v-else style="text-align: center; color: #aaa; font-style: italic; padding: 30px 0; font-size: 10pt;">
              Enter syllabus and click Auto-Generate to populate questions here.
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 8px; border-top: 1px solid #000; text-align: center;">
              <div style="font-size: 11pt; font-weight: bold; letter-spacing: 4px; color: #000;">
                *****************ALL THE BEST*****************
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden print iframe — no new tab needed -->
    <iframe id="print-frame" style="display:none; position:fixed; top:-9999px; left:-9999px; width:0; height:0;" title="print"></iframe>

    <!-- Alert -->
    <div v-if="alertMsg" :class="['fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium shadow-card-lg border z-50 max-w-sm',
      alertType==='success' ? 'bg-success-light text-success-dark border-success/20' : 'bg-danger-light text-danger-dark border-danger/20']">
      {{ alertMsg }}
    </div>

    <!-- Saved Papers -->
    <div v-if="savedPapers.length" class="mt-8">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-bold text-surface-900">Saved Papers</h3>
        <button @click="fetchSavedPapers" class="btn-ghost text-xs">Refresh</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="p in savedPapers" :key="p._id"
          class="card hover:shadow-card-md transition-all group">
          <div class="flex items-start justify-between mb-2">
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-surface-900 truncate">{{ p.subject || 'Untitled' }}</p>
              <p class="text-xs text-surface-500 mt-0.5">
                {{ p.class }} · Sem {{ p.semester }} · {{ p.totalMarks }} Marks
              </p>
              <p class="text-xs text-surface-400 mt-0.5">{{ formatDate(p.updatedAt) }}</p>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              <!-- Load -->
              <button @click="loadPaper(p)"
                class="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all" title="Load">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
              </button>
              <!-- Delete -->
              <button @click="deletePaper(p._id)"
                class="p-1.5 rounded-lg text-surface-400 hover:text-danger hover:bg-danger-light transition-all" title="Delete">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="flex flex-wrap gap-1 mt-2">
            <span v-if="p.subjectCode" class="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-200">{{ p.subjectCode }}</span>
            <span class="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">{{ p.sections?.length || 0 }} sections</span>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { CLASS_LIST } from '../../utils/constants'
import { paperAPI } from '../../services/api'

// ── Paper state ───────────────────────────────────────────────
const paper = ref({
  _id:          null,
  subject:      '',
  subjectCode:  '',
  class:        '',
  semester:     '',
  date:         new Date().toISOString().split('T')[0],
  duration:     '2 Hours',
  totalMarks:   30,
  sections:     [],
})

const syllabusText  = ref('')
const savedPapers   = ref([])
const saving        = ref(false)
const alertMsg      = ref('')
const alertType     = ref('success')

const showAlert = (msg, type = 'success') => {
  alertMsg.value  = msg
  alertType.value = type
  setTimeout(() => alertMsg.value = '', 3500)
}

// ── Computed ──────────────────────────────────────────────────
const syllabusTopics = computed(() =>
  syllabusText.value.split('\n').map(t => t.trim()).filter(t => t.length > 0)
)
const canGenerate = computed(() => paper.value.totalMarks > 0 && syllabusTopics.value.length > 0)
const allocatedMarks = computed(() =>
  paper.value.sections.reduce((sum, s) => sum + sectionTotal(s), 0)
)
const sectionTotal = (section) => {
  const questionCount = section.questions.filter(q => q.trim()).length
  // Parse instruction like "Attempt any 2 out of 4" to get the attempt count
  const match = section.instruction?.match(/attempt\s+any\s+(\d+)/i)
  const attemptCount = match ? parseInt(match[1]) : questionCount
  return (section.marksEach || 0) * Math.min(attemptCount, questionCount)
}

// ── Save paper ────────────────────────────────────────────────
const savePaper = async () => {
  saving.value = true
  try {
    const payload = {
      subject:      paper.value.subject,
      subjectCode:  paper.value.subjectCode,
      class:        paper.value.class,
      semester:     paper.value.semester,
      date:         paper.value.date,
      duration:     paper.value.duration,
      totalMarks:   paper.value.totalMarks,
      sections:     paper.value.sections,
      syllabusText: syllabusText.value,
    }
    // Only include _id if updating an existing paper
    if (paper.value._id) payload._id = paper.value._id

    const { data } = await paperAPI.save(payload)
    paper.value._id = data.paper._id
    showAlert('Paper saved successfully ✓')
    fetchSavedPapers()
  } catch (e) {
    showAlert(e.response?.data?.message || 'Save failed', 'error')
  } finally { saving.value = false }
}

// ── Load paper ────────────────────────────────────────────────
const loadPaper = (p) => {
  paper.value = {
    _id:         p._id,
    subject:     p.subject,
    subjectCode: p.subjectCode,
    class:       p.class,
    semester:    p.semester,
    date:        p.date,
    duration:    p.duration,
    totalMarks:  p.totalMarks,
    sections:    p.sections || [],
  }
  syllabusText.value = p.syllabusText || ''
  showAlert(`Loaded: ${p.subject || 'Paper'}`)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Delete paper ──────────────────────────────────────────────
const deletePaper = async (id) => {
  if (!confirm('Delete this saved paper?')) return
  try {
    await paperAPI.delete(id)
    if (paper.value._id === id) {
      paper.value._id = null
    }
    showAlert('Paper deleted')
    fetchSavedPapers()
  } catch { showAlert('Delete failed', 'error') }
}

// ── Fetch saved papers ────────────────────────────────────────
const fetchSavedPapers = async () => {
  try {
    const { data } = await paperAPI.getAll()
    savedPapers.value = data.papers
  } catch { savedPapers.value = [] }
}

// ── Auto-generate sections ────────────────────────────────────
const generateSections = () => {
  const total  = paper.value.totalMarks
  const topics = syllabusTopics.value
  if (!total || !topics.length) return

  let sectionCount, marksPerSection
  if      (total <= 20)  { sectionCount = 2; marksPerSection = Math.floor(total / 2) }
  else if (total <= 40)  { sectionCount = 3; marksPerSection = Math.floor(total / 3) }
  else if (total <= 60)  { sectionCount = 4; marksPerSection = Math.floor(total / 4) }
  else if (total <= 80)  { sectionCount = 5; marksPerSection = Math.floor(total / 5) }
  else if (total <= 100) { sectionCount = 6; marksPerSection = Math.floor(total / 6) }
  else                   { sectionCount = 7; marksPerSection = Math.floor(total / 7) }

  let questionsToAttempt, questionsToShow, marksEach
  if (marksPerSection <= 5) {
    questionsToAttempt = 1; questionsToShow = 2; marksEach = marksPerSection
  } else if (marksPerSection <= 10) {
    questionsToAttempt = 2; questionsToShow = 4; marksEach = Math.floor(marksPerSection / 2)
  } else {
    questionsToAttempt = 2; questionsToShow = 4; marksEach = Math.floor(marksPerSection / 2)
  }

  const topicsPerSection = Math.ceil(topics.length / sectionCount)

  // Track all generated questions globally to prevent duplicates
  const usedQuestions = new Set()

  const newSections = []
  for (let i = 0; i < sectionCount; i++) {
    const sectionTopics = topics.slice(i * topicsPerSection, (i + 1) * topicsPerSection)
    if (!sectionTopics.length) continue

    const questions = generateUniqueQuestions(sectionTopics, questionsToShow, usedQuestions)

    newSections.push({
      instruction: questionsToAttempt === questionsToShow
        ? 'Answer the following'
        : `Attempt any ${questionsToAttempt} out of ${questionsToShow}`,
      marksEach,
      questions,
    })
  }
  paper.value.sections = newSections
  showAlert('Questions generated and shuffled ✓')
}

// ── Generate unique questions for a set of topics ─────────────
const generateUniqueQuestions = (topics, count, usedSet) => {
  const questions = []
  // Shuffle templates so each section gets different question styles
  const shuffledTemplates = shuffleArray([...questionTemplates])
  let attempts = 0

  while (questions.length < count && attempts < count * 10) {
    attempts++
    const topic    = topics[Math.floor(Math.random() * topics.length)]
    const template = shuffledTemplates[attempts % shuffledTemplates.length]
    const q        = template(topic)

    if (!usedSet.has(q)) {
      usedSet.add(q)
      questions.push(q)
    }
  }

  // Shuffle the final questions so order is random
  return shuffleArray(questions)
}

// ── Fisher-Yates shuffle ──────────────────────────────────────
const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Rich, realistic question templates ───────────────────────
const questionTemplates = [
  (t) => `Explain the concept of ${t} with a suitable example.`,
  (t) => `What is ${t}? Describe its types and real-world applications.`,
  (t) => `Write a short note on ${t}.`,
  (t) => `Compare and contrast ${t} with any other related concept. Give examples.`,
  (t) => `Describe the working of ${t} with a neat labeled diagram.`,
  (t) => `List and explain the advantages and disadvantages of ${t}.`,
  (t) => `Define ${t}. Explain its implementation with a suitable algorithm.`,
  (t) => `With the help of a diagram, explain the internal structure of ${t}.`,
  (t) => `State and explain the key properties of ${t}.`,
  (t) => `Differentiate between ${t} and any two related concepts. Use a table.`,
  (t) => `Explain the step-by-step process involved in ${t} with an example.`,
  (t) => `What are the limitations of ${t}? How can they be overcome?`,
  (t) => `Describe the role of ${t} in modern computing with practical examples.`,
  (t) => `Explain how ${t} is implemented in practice. Give a code snippet or pseudocode.`,
  (t) => `What do you understand by ${t}? Explain with the help of a flowchart.`,
  (t) => `Discuss the time and space complexity of ${t}.`,
  (t) => `Trace the execution of ${t} on the following input: [provide sample input].`,
  (t) => `Explain the significance of ${t} in the context of software development.`,
  (t) => `Describe any two real-life scenarios where ${t} is used effectively.`,
  (t) => `What are the different types of ${t}? Explain each with an example.`,
  (t) => `Illustrate the concept of ${t} using a suitable case study.`,
  (t) => `How does ${t} improve efficiency? Justify with examples.`,
  (t) => `Write an algorithm for ${t} and analyze its complexity.`,
  (t) => `Explain the relationship between ${t} and any other concept you have studied.`,
  (t) => `What are the common errors encountered while working with ${t}? How are they resolved?`,
]

const addSection = () => {
  paper.value.sections.push({ instruction: 'Attempt any 2 out of 4', marksEach: 5, questions: ['', '', '', ''] })
}

const onMarksChange = () => {}

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

// ── Print — iframe, no new tab, no browser chrome ────────────
const printPaper = () => {
  const content = document.getElementById('paper-preview').innerHTML
  const frame   = document.getElementById('print-frame')
  if (!frame) { showAlert('Print frame not found', 'error'); return }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 14mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt; color: #000; background: #fff; line-height: 1.45;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  table { width: 100%; border-collapse: collapse; }
  ol { padding-left: 22px; }
  li { margin-bottom: 7px; line-height: 1.5; }
  strong { font-weight: bold; }
  img { max-width: 100%; }
</style>
</head>
<body>${content}</body>
</html>`

  // Write into hidden iframe
  const doc = frame.contentDocument || frame.contentWindow.document
  doc.open()
  doc.write(html)
  doc.close()

  // Wait for logo image to load, then print
  const img = doc.querySelector('img')
  const doPrint = () => {
    frame.contentWindow.focus()
    frame.contentWindow.print()
  }

  if (img && !img.complete) {
    img.onload  = doPrint
    img.onerror = doPrint
    setTimeout(doPrint, 1500) // fallback
  } else {
    setTimeout(doPrint, 300)
  }
}

onMounted(fetchSavedPapers)
</script>
