<template>
  <Transition name="fade">
    <div v-if="message" :class="['flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border', styles]">
      <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path v-if="type==='success'" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        <path v-else fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
      <span>{{ message }}</span>
    </div>
  </Transition>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ message: { type: String, default: '' }, type: { type: String, default: 'info' } })
const styles = computed(() => ({
  success: 'bg-success-light text-success-dark border-success/20',
  error:   'bg-danger-light text-danger-dark border-danger/20',
  warning: 'bg-warning-light text-warning-dark border-warning/20',
  info:    'bg-info-light text-info-dark border-info/20',
}[props.type] || 'bg-info-light text-info-dark border-info/20'))
</script>
