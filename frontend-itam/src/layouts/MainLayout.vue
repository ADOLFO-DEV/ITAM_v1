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
      </nav>

      <div class="p-4 border-t border-slate-700">
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
          <button @click="handleLogout" title="Cerrar Sesión" class="p-2 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-800 transition-colors shrink-0">
            <LogOut class="w-4 h-4" />
          </button>
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
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LayoutDashboard, Smartphone, User, Bell, Users, LogOut, ClipboardList } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const currentRouteName = computed(() => {
  return route.meta.title || 'Panel de Control';
});

const userName = ref('Cargando...');
const userEmail = ref('');
const userRole = ref('');

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
