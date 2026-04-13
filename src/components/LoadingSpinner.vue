<template>
  <div class="flex items-center justify-center py-16">
    <div class="flex flex-col items-center gap-3">
      <div class="w-10 h-10 rounded-full border-3 border-surface-200 border-t-brand-500 animate-spin"
        style="border-width: 3px;"></div>
      <p class="text-sm text-surface-400 font-medium">{{ text }}</p>
    </div>
  </div>
</template>
<script setup>
defineProps({ text: { type: String, default: 'Loading...' } })
</script>
