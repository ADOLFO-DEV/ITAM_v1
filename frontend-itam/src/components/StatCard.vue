<template>
  <div 
    class="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 flex items-center justify-between group hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
  >
    <!-- Background Glow Effect on Hover -->
    <div class="absolute right-0 top-0 -mt-4 -mr-4 w-28 h-28 rounded-full opacity-20 blur-3xl transition-all duration-500 group-hover:scale-150" :class="bgGlowClass"></div>
    
    <div class="relative z-10">
      <p class="text-sm font-medium text-slate-500 mb-1 tracking-wide uppercase text-xs">{{ title }}</p>
      <h3 class="text-3xl font-extrabold text-slate-800 tracking-tight">{{ value }}</h3>
    </div>
    
    <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3', colorClass]">
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
    default: 'blue' // options: blue, green, orange, red, purple
  }
});

const colorClass = computed(() => {
  const themes = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border border-blue-200/50',
    green: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 border border-emerald-200/50', 
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100 text-[#F96302] border border-orange-200/50',
    red: 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600 border border-rose-200/50',
    purple: 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 border border-indigo-200/50'
  };
  return themes[props.colorTheme] || themes.blue;
});

const bgGlowClass = computed(() => {
  const glows = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    orange: 'bg-[#F96302]',
    red: 'bg-rose-500',
    purple: 'bg-indigo-500'
  };
  return glows[props.colorTheme] || glows.blue;
});
</script>
