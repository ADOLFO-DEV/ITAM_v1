<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      
      <!-- Background overlay -->
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        aria-hidden="true"
        @click="$emit('close')"
      ></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
        <div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              Cambiar Contraseña
            </h3>
            <div class="mt-2 text-sm text-gray-500 text-left">
              Ingresa tu contraseña actual y la nueva contraseña que deseas establecer.
            </div>
          </div>
        </div>

        <form @submit.prevent="handleChangePassword" class="mt-5 sm:mt-6 space-y-4">
          <div v-if="successMsg" class="bg-green-50 border-l-4 border-green-500 p-3 rounded text-green-700 text-sm">
            <p>{{ successMsg }}</p>
          </div>
          <div v-if="errorMsg" class="bg-red-50 border-l-4 border-red-500 p-3 rounded text-red-700 text-sm">
            <p>{{ errorMsg }}</p>
          </div>

          <div>
            <label for="currentPassword" class="block text-sm font-medium text-gray-700">Contraseña Actual</label>
            <div class="mt-1">
              <input type="password" id="currentPassword" v-model="form.currentPassword" required class="shadow-sm focus:ring-homedepot-orange focus:border-homedepot-orange block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
            </div>
          </div>

          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
            <div class="mt-1">
              <input type="password" id="newPassword" v-model="form.newPassword" required class="shadow-sm focus:ring-homedepot-orange focus:border-homedepot-orange block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
            </div>
          </div>

          <div>
            <label for="confirmNewPassword" class="block text-sm font-medium text-gray-700">Confirmar Nueva Contraseña</label>
            <div class="mt-1">
              <input type="password" id="confirmNewPassword" v-model="form.confirmNewPassword" required class="shadow-sm focus:ring-homedepot-orange focus:border-homedepot-orange block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
            </div>
          </div>

          <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button 
              type="submit" 
              :disabled="isLoading" 
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-homedepot-orange text-base font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-homedepot-orange sm:col-start-2 sm:text-sm disabled:opacity-50"
            >
              {{ isLoading ? 'Guardando...' : 'Guardar' }}
            </button>
            <button 
              type="button" 
              @click="$emit('close')" 
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-homedepot-orange sm:mt-0 sm:col-start-1 sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import api from '../api/axios';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: ''
});

const isLoading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

// Reset form when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.currentPassword = '';
    form.newPassword = '';
    form.confirmNewPassword = '';
    errorMsg.value = '';
    successMsg.value = '';
  }
});

const handleChangePassword = async () => {
  errorMsg.value = '';
  successMsg.value = '';

  if (form.newPassword !== form.confirmNewPassword) {
    errorMsg.value = 'Las nuevas contraseñas no coinciden.';
    return;
  }

  isLoading.value = true;
  try {
    const res = await api.post('/auth/change-password', {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword
    });

    if (res.data.success) {
      successMsg.value = 'Contraseña actualizada exitosamente.';
      setTimeout(() => {
        emit('close');
      }, 1500);
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      errorMsg.value = error.response.data.error;
    } else {
      errorMsg.value = 'Error al actualizar la contraseña.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
