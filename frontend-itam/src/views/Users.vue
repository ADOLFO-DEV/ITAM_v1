<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-800">Gestión de Usuarios</h2>
        <p class="text-slate-500 text-sm">Creación de perfiles de acceso al sistema</p>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full max-w-2xl">
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

        <div class="pt-4">
           <button type="submit" :disabled="isLoading" class="flex w-full sm:w-auto justify-center rounded-md bg-homedepot-orange px-4 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-homedepot-orange disabled:opacity-50 transition-colors">
              {{ isLoading ? 'Creando...' : 'Crear Usuario' }}
           </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import api from '../api/axios';

const form = reactive({
  nombre: '',
  email: '',
  password: '',
  rol: 'VIEWER'
});

const isLoading = ref(false);
const successMsg = ref('');
const errorMsg = ref('');

const handleRegister = async () => {
  isLoading.value = true;
  successMsg.value = '';
  errorMsg.value = '';

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
      form.rol = 'VIEWER';
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
