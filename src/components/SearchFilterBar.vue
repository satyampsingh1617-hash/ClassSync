<template>
  <div class="card mb-5">
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Search -->
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          :value="search"
          @input="$emit('update:search', $event.target.value)"
          type="text"
          class="input pl-9"
          :placeholder="searchPlaceholder"
        />
      </div>

      <!-- Class filter -->
      <select v-if="showClass"
        :value="selectedClass"
        @change="$emit('update:selectedClass', $event.target.value)"
        class="input sm:w-40">
        <option value="">All Classes</option>
        <option v-for="cls in classes" :key="cls" :value="cls">{{ cls }}</option>
      </select>

      <!-- Subject filter -->
      <select v-if="showSubject && subjects.length"
        :value="selectedSubject"
        @change="$emit('update:selectedSubject', $event.target.value)"
        class="input sm:w-52">
        <option value="">All Subjects</option>
        <option v-for="s in subjects" :key="s._id" :value="s._id">
          {{ s.name }} ({{ s.code }})
        </option>
      </select>
    </div>

    <!-- Class chips -->
    <div v-if="showClass && classes.length" class="flex flex-wrap gap-1.5 mt-3">
      <button
        @click="$emit('update:selectedClass', '')"
        :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-all',
          selectedClass === '' ? 'bg-surface-800 text-white border-surface-800' : 'bg-white text-surface-600 border-surface-300 hover:border-surface-500']"
      >All</button>
      <button
        v-for="cls in classes" :key="cls"
        @click="$emit('update:selectedClass', selectedClass === cls ? '' : cls)"
        :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-all',
          selectedClass === cls ? getClassChip(cls) : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400']"
      >{{ cls }}</button>
    </div>
  </div>
</template>

<script setup>
import { getClassChip } from '../utils/constants'

defineProps({
  search:          { type: String, default: '' },
  selectedClass:   { type: String, default: '' },
  selectedSubject: { type: String, default: '' },
  classes:         { type: Array,  default: () => [] },
  subjects:        { type: Array,  default: () => [] },
  showClass:       { type: Boolean, default: true },
  showSubject:     { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: 'Search...' },
})
defineEmits(['update:search', 'update:selectedClass', 'update:selectedSubject'])
</script>
