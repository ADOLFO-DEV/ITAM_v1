<template>
  <div class="flex h-screen bg-slate-50">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-slate-100 flex flex-col transition-all duration-300">
      <div class="p-6">
        <h1 class="text-2xl font-bold tracking-tight">ITAM System</h1>
      </div>

      <nav class="flex-1 px-4 space-y-2 mt-4">
        <!-- Dashboard Link -->
        <router-link
          to="/"
          class="flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
          active-class="bg-slate-800 text-[#F96302]"
          exact-active-class="bg-slate-800 text-[#F96302]"
        >
          <LayoutDashboard class="w-5 h-5" />
          <span class="font-medium">Dashboard</span>
        </router-link>

        <!-- Service Slots Link -->
        <router-link
          to="/slots"
          class="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-slate-800"
          active-class="bg-slate-800 text-[#F96302]"
        >
          <Smartphone class="w-5 h-5" />
          <span class="font-medium">Activos</span>
        </router-link>

        <!-- Users Link (Admin only) -->
        <router-link
          v-if="userRole === 'SUPERADMIN' || userRole === 'ADMIN'"
          to="/users"
          class="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-slate-800"
          active-class="bg-slate-800 text-[#F96302]"
        >
          <Users class="w-5 h-5" />
          <span class="font-medium">Usuarios</span>
        </router-link>

        <!-- Audit Logs Link (Admin only) -->
        <router-link
          v-if="userRole === 'SUPERADMIN' || userRole === 'ADMIN'"
          to="/audit-logs"
          class="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-slate-800"
          active-class="bg-slate-800 text-[#F96302]"
        >
          <ClipboardList class="w-5 h-5" />
          <span class="font-medium">Auditoría</span>
        </router-link>

        <!-- Sync Headcount Link (Admin only) -->
        <router-link
          v-if="userRole === 'SUPERADMIN' || userRole === 'ADMIN'"
          to="/sync-headcount"
          class="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-slate-800"
          active-class="bg-slate-800 text-[#F96302]"
        >
          <Users class="w-5 h-5" />
          <span class="font-medium">Sync Headcount</span>
        </router-link>

        <!-- Sync Adendum Link (Admin only) -->
        <router-link
          v-if="userRole === 'SUPERADMIN' || userRole === 'ADMIN'"
          to="/sync-adendum"
          class="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-slate-800"
          active-class="bg-slate-800 text-[#F96302]"
        >
          <ClipboardList class="w-5 h-5" />
          <span class="font-medium">Reconciliar Adendum</span>
        </router-link>
      </nav>

        <div class="flex flex-col p-4 border-t border-slate-700 gap-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                <User class="w-4 h-4 text-slate-300" />
              </div>
              <div class="truncate pr-2">
                <p class="text-sm font-medium truncate">{{ userName }}</p>
                <p class="text-xs text-slate-400 truncate">{{ userEmail }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button @click="isChangePasswordOpen = true" title="Cambiar Contraseña" class="p-2 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors shrink-0">
                <Key class="w-4 h-4" />
              </button>
              <button @click="handleLogout" title="Cerrar Sesión" class="p-2 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-800 transition-colors shrink-0">
                <LogOut class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shadow-sm">
        <h2 class="text-lg font-semibold text-slate-800">
          {{ currentRouteName }}
        </h2>
        <div class="flex items-center gap-4">
          <!-- Privacy Toggle -->
          <button @click="togglePrivacy" 
            :class="[
              'p-2 rounded-full transition-colors flex items-center justify-center shrink-0 w-9 h-9',
              isPrivacyActive ? 'text-[#F96302] bg-orange-50 hover:bg-orange-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            ]"
            :title="isPrivacyActive ? 'Desactivar Modo Privacidad' : 'Activar Modo Privacidad'">
            <EyeOff v-if="isPrivacyActive" class="w-5 h-5" />
            <Eye v-else class="w-5 h-5" />
          </button>
          
          <button class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <Bell class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
        <router-view />
      </main>
    </div>

    <!-- Password Modal -->
    <ChangePasswordModal 
      :isOpen="isChangePasswordOpen" 
      @close="isChangePasswordOpen = false" 
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LayoutDashboard, Smartphone, User, Bell, Users, LogOut, ClipboardList, Key, Eye, EyeOff } from 'lucide-vue-next';
import ChangePasswordModal from '../components/ChangePasswordModal.vue';
import { usePrivacyMode } from '../composables/usePrivacyMode';

const { isPrivacyActive, togglePrivacy } = usePrivacyMode();

const route = useRoute();
const router = useRouter();

const currentRouteName = computed(() => {
  return route.meta.title || 'Panel de Control';
});

const userName = ref('Cargando...');
const userEmail = ref('');
const userRole = ref('');

const isChangePasswordOpen = ref(false);

onMounted(() => {
  const userData = localStorage.getItem('itam_user');
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      userName.value = parsed.nombre || 'Usuario';
      userEmail.value = parsed.email || '';
      userRole.value = parsed.rol || 'VIEWER';
    } catch (e) {
      console.error('Error parseando usuario:', e);
    }
  }
});

const handleLogout = () => {
  localStorage.removeItem('itam_token');
  localStorage.removeItem('itam_user');
  router.push('/login');
};
</script>
