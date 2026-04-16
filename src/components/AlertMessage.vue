<template>
  <Transition name="fade">
    <div v-if="message" :class="['flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium border', styles.wrap]">
      <div :class="['w-5 h-5 mt-0.5 flex-shrink-0 rounded-full flex items-center justify-center', styles.icon]">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path v-if="type === 'success'" fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          <path v-else-if="type === 'warning'" fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          <path v-else fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
      </div>
      <span :class="styles.text">{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  message: { type: String, default: '' },
  type:    { type: String, default: 'info' },
})
const styles = computed(() => ({
  success: { wrap: 'bg-emerald-50 border-emerald-200/60',  icon: 'bg-emerald-500 text-white', text: 'text-emerald-800' },
  error:   { wrap: 'bg-red-50 border-red-200/60',          icon: 'bg-red-500 text-white',     text: 'text-red-800'     },
  warning: { wrap: 'bg-amber-50 border-amber-200/60',      icon: 'bg-amber-500 text-white',   text: 'text-amber-800'   },
  info:    { wrap: 'bg-blue-50 border-blue-200/60',        icon: 'bg-blue-500 text-white',    text: 'text-blue-800'    },
}[props.type] || { wrap: 'bg-blue-50 border-blue-200/60', icon: 'bg-blue-500 text-white', text: 'text-blue-800' }))
</script>
