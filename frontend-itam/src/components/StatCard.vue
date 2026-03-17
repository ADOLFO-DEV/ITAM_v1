<template>
  <div class="bg-white border border-slate-200 shadow-sm rounded-lg p-6 flex items-center justify-between">
    <div>
      <p class="text-sm font-medium text-slate-500 mb-1">{{ title }}</p>
      <h3 class="text-3xl font-bold text-slate-800">{{ value }}</h3>
    </div>
    <div :class="['w-12 h-12 rounded-full flex items-center justify-center', colorClass]">
      <!-- Define a slot for the icon from lucide-vue-next -->
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  colorTheme: {
    type: String,
    default: 'blue' // options: blue, green, orange, red, etc.
  }
});

const colorClass = computed(() => {
  const themes = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-800', // Using green badge standard
    orange: 'bg-orange-100 text-[#F96302]', // Using THD Orange
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };
  return themes[props.colorTheme] || themes.blue;
});
</script>
