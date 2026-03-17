<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" v-if="isOpen">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="$emit('close')"></div>

    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 class="text-lg font-semibold leading-6 text-gray-900 mb-4">
                Editar Activo: {{ formData.telefono }}
              </h3>
              
              <!-- Error Banner -->
              <div v-if="errorMsg" class="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div class="flex">
                  <div class="ml-3">
                    <p class="text-sm text-red-700">
                      {{ errorMsg }}
                    </p>
                  </div>
                </div>
              </div>

              <form @submit.prevent="submitForm" class="space-y-4">
                <!-- Modelo -->
                <div>
                  <label class="block text-sm font-medium leading-6 text-gray-900">Modelo</label>
                  <div class="mt-2">
                    <input type="text" v-model="formData.modelo" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 px-3" />
                  </div>
                </div>

                <!-- Gama -->
                <div>
                  <label class="block text-sm font-medium leading-6 text-gray-900">Gama</label>
                  <div class="mt-2">
                    <select v-model="formData.gama" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 px-3 bg-white">
                      <option value="">Seleccionar gama</option>
                      <option value="BAJA">BAJA</option>
                      <option value="MEDIA">MEDIA</option>
                      <option value="ALTA">ALTA</option>
                    </select>
                  </div>
                </div>

                <!-- Empleado (Num) -->
                <div>
                  <label class="block text-sm font-medium leading-6 text-gray-900">Empleado Asignado (ID)</label>
                  <div class="mt-2">
                    <input type="text" v-model="formData.employee_id" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 px-3" />
                  </div>
                </div>
                
                <!-- Estatus -->
                <div>
                  <label class="block text-sm font-medium leading-6 text-gray-900">Estatus</label>
                  <div class="mt-2">
                    <select v-model="formData.estatus" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 px-3 bg-white">
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                      <option value="DISPONIBLE">DISPONIBLE</option>
                    </select>
                  </div>
                </div>

              </form>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button type="button" :disabled="isSaving" @click="submitForm" class="inline-flex w-full justify-center rounded-md bg-homedepot-orange px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 sm:ml-3 sm:w-auto disabled:opacity-50">
            {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
          <button type="button" @click="$emit('close')" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import api from '../api/axios';

const props = defineProps({
  isOpen: Boolean,
  slotData: Object
});

const emit = defineEmits(['close', 'saved']);

const formData = ref({
  id: '',
  telefono: '',
  modelo: '',
  gama: '',
  employee_id: '',
  estatus: ''
});

const isSaving = ref(false);
const errorMsg = ref('');

watch(() => props.slotData, (newVal) => {
  if (newVal) {
    formData.value = {
      id: newVal.id,
      telefono: newVal.telefono || '',
      modelo: newVal.modelo || '',
      gama: newVal.gama || '',
      employee_id: newVal.employee_id || '',
      estatus: newVal.estatus || 'ACTIVO'
    };
    errorMsg.value = '';
  }
}, { immediate: true });

const submitForm = async () => {
  isSaving.value = true;
  errorMsg.value = '';

  try {
    const response = await api.patch(`/slots/${formData.value.id}`, {
      modelo: formData.value.modelo,
      gama: formData.value.gama,
      employee_id: formData.value.employee_id || null,
      estatus: formData.value.estatus
    });

    const data = response.data;
    
    // axios throws error if > 399
    
    emit('saved', data.data);
    emit('close');
  } catch (error) {
    if (error.response && error.response.data) {
        const d = error.response.data;
        if (d.errors && d.errors.length) {
          errorMsg.value = d.errors.map(e => `${e.path}: ${e.message}`).join(', ');
        } else {
          errorMsg.value = d.message || d.error || 'Error al actualizar';
        }
    } else {
       errorMsg.value = error.message;
    }
  } finally {
    isSaving.value = false;
  }
};
</script>
