import { ref, watchEffect } from 'vue';

const isPrivacyActive = ref(false);

// Initialize from localStorage if available
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('itam_privacy_mode');
  if (stored !== null) {
    isPrivacyActive.value = stored === 'true';
  }
}

// Persist adjustments
watchEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('itam_privacy_mode', String(isPrivacyActive.value));
  }
});

export function usePrivacyMode() {
  const togglePrivacy = () => {
    isPrivacyActive.value = !isPrivacyActive.value;
  };

  return {
    isPrivacyActive,
    togglePrivacy
  };
}
