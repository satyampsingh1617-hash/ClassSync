<template>
  <div class="bg-white rounded-2xl border border-surface-200 p-5 shadow-card hover:shadow-card-md transition-all duration-200 hover:-translate-y-0.5">
    <div class="flex items-start justify-between mb-3">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :class="iconBg">
        <span class="w-5 h-5" :class="iconColor" v-html="icon"></span>
      </div>
      <slot name="badge" />
    </div>
    <p class="text-2xl font-black text-surface-900">{{ value }}</p>
    <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-0.5">{{ label }}</p>
    <p v-if="sub" class="text-xs text-surface-400 mt-1">{{ sub }}</p>
  </div>
</template>
<script setup>
defineProps({
  label:     { type: String, required: true },
  value:     { type: [String, Number], required: true },
  sub:       { type: String, default: '' },
  icon:      { type: String, required: true },
  iconBg:    { type: String, default: 'bg-brand-50' },
  iconColor: { type: String, default: 'text-brand-600' },
})
</script>
