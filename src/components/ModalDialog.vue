<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" @click="$emit('close')"></div>
        <div class="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-card-lg border border-surface-200">
          <div class="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h3 class="text-base font-bold text-surface-900">{{ title }}</h3>
            <button @click="$emit('close')" class="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="px-6 py-5"><slot /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup>
defineProps({ show: Boolean, title: String })
defineEmits(['close'])
</script>
