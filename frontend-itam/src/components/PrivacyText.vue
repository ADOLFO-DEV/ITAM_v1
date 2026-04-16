<template>
  <span :class="{ 'blur-sm opacity-50 select-none pointer-events-none transition-all duration-300': isPrivacyActive }">
    <slot></slot>
  </span>
</template>

<script setup>
import { usePrivacyMode } from '../composables/usePrivacyMode';

const { isPrivacyActive } = usePrivacyMode();
</script>
