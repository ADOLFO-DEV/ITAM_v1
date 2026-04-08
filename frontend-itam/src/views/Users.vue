<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-800">Gestión de Usuarios</h2>
        <p class="text-slate-500 text-sm">Creación de perfiles de acceso al sistema</p>
      </div>
    </div>

    <div class="flex flex-col space-y-8">
      <!-- Create User Form -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Registrar Nuevo Usuario</h3>
      
      <div v-if="successMsg" class="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded text-green-700 text-sm">
        <p>{{ successMsg }}</p>
      </div>
      <div v-if="errorMsg" class="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 text-sm">
        <p>{{ errorMsg }}</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label for="nombre" class="block text-sm font-medium leading-6 text-gray-900">Nombre Completo</label>
          <div class="mt-2">
            <input type="text" id="nombre" v-model="form.nombre" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 px-3" />
          </div>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium leading-6 text-gray-900">Correo Electrónico</label>
          <div class="mt-2">
            <input type="email" id="email" v-model="form.email" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 px-3" />
          </div>
        </div>

        <div>
          <label for="rol" class="block text-sm font-medium leading-6 text-gray-900">Rol del Sistema</label>
          <div class="mt-2">
            <select id="rol" v-model="form.rol" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 px-3 bg-white">
              <option value="VIEWER">Visualizador (VIEWER)</option>
              <option value="ADMIN">Administrador (ADMIN)</option>
              <option value="SUPERADMIN">Super Administrador (SUPERADMIN)</option>
            </select>
          </div>
        </div>

        <div>
           <label for="password" class="block text-sm font-medium leading-6 text-gray-900">Contraseña Inicial</label>
          <div class="mt-2">
             <input type="password" id="password" v-model="form.password" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 px-3" />
          </div>
        </div>

        <div>
           <label for="confirmPassword" class="block text-sm font-medium leading-6 text-gray-900">Confirmar Contraseña Inicial</label>
          <div class="mt-2">
             <input type="password" id="confirmPassword" v-model="form.confirmPassword" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 px-3" />
          </div>
        </div>

        <div class="pt-4">
           <button type="submit" :disabled="isLoading" class="flex w-full justify-center rounded-md bg-homedepot-orange px-4 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-homedepot-orange disabled:opacity-50 transition-colors">
              {{ isLoading ? 'Creando...' : 'Crear Usuario' }}
           </button>
        </div>
      </form>
      </div>

      <!-- Users List Table -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Lista de Todos los Usuarios</h3>
        
        <div v-if="usersLoading" class="text-center py-4 text-gray-500 text-sm">
          Cargando usuarios...
        </div>
        
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in users" :key="user.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ user.nombre }}</div>
                      <div class="text-sm text-gray-500">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select 
                    v-model="user.rol" 
                    @change="updateUserRole(user)" 
                    :disabled="user.id === currentUserId"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 px-3 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="VIEWER">VIEWER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPERADMIN">SUPERADMIN</option>
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    @click="deleteUser(user)" 
                    :disabled="user.id === currentUserId"
                    class="text-red-600 hover:text-red-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Eliminar usuario"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="3" class="px-6 py-4 text-center text-sm text-gray-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import api from '../api/axios';

const form = reactive({
  nombre: '',
  email: '',
  password: '',
  confirmPassword: '',
  rol: 'VIEWER'
});

const isLoading = ref(false);
const successMsg = ref('');
const errorMsg = ref('');

const users = ref([]);
const usersLoading = ref(true);
const currentUserId = ref(null);

onMounted(() => {
  const userData = localStorage.getItem('itam_user');
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      currentUserId.value = parsed.id;
    } catch (e) {
      console.error(e);
    }
  }
  fetchUsers();
});

const fetchUsers = async () => {
  usersLoading.value = true;
  try {
    const response = await api.get('/users');
    if (response.data.success) {
      users.value = response.data.data;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    usersLoading.value = false;
  }
};

const updateUserRole = async (user) => {
  try {
    const res = await api.patch(`/users/${user.id}/role`, { rol: user.rol });
    if (res.data.success) {
      alert(`Rol de ${user.nombre} actualizado exitosamente.`);
    }
  } catch (error) {
    alert(error.response?.data?.error || 'Error al actualizar rol');
    fetchUsers(); // Revert back to original role
  }
};

const deleteUser = async (user) => {
  if (!confirm(`¿Estás seguro de eliminar permanentemente a ${user.nombre}?`)) {
    return;
  }

  try {
    const res = await api.delete(`/users/${user.id}`);
    if (res.data.success) {
      users.value = users.value.filter(u => u.id !== user.id);
    }
  } catch (error) {
    alert(error.response?.data?.error || 'Error al eliminar usuario');
  }
};

const handleRegister = async () => {
  isLoading.value = true;
  successMsg.value = '';
  errorMsg.value = '';

  if (form.password !== form.confirmPassword) {
    errorMsg.value = 'Las contraseñas no coinciden.';
    isLoading.value = false;
    return;
  }

  try {
    const response = await api.post('/auth/register', {
      nombre: form.nombre,
      email: form.email,
      password: form.password,
      rol: form.rol
    });

    if (response.data.success) {
      successMsg.value = `Usuario ${response.data.user.nombre} creado exitosamente.`;
      // Clear form
      form.nombre = '';
      form.email = '';
      form.password = '';
      form.confirmPassword = '';
      form.rol = 'VIEWER';
      fetchUsers(); // Actualizar tabla
    }
  } catch (error) {
     if (error.response && error.response.data && error.response.data.error) {
       errorMsg.value = error.response.data.error;
    } else {
       errorMsg.value = 'Error de conexión. Inténtalo de nuevo.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
