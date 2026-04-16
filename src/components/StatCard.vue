<template>
  <div class="bg-white rounded-2xl border border-surface-100 p-5 shadow-card hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 group">
    <div class="flex items-start justify-between mb-4">
      <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110" :class="iconBg">
        <span class="w-5 h-5" :class="iconColor" v-html="icon"></span>
      </div>
      <slot name="badge" />
    </div>
    <p class="text-2xl font-black text-surface-900 leading-none">{{ value }}</p>
    <p class="text-xs font-semibold text-surface-400 uppercase tracking-wider mt-1.5">{{ label }}</p>
    <p v-if="sub" class="text-xs text-surface-400 mt-1 leading-relaxed">{{ sub }}</p>
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
