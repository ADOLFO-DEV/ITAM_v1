<template>
  <div class="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-semibold text-gray-900">Estado de Sincronización Mensual</h1>
        <p class="mt-2 text-sm text-gray-700">Reconciliación de bases de datos operativas contra el proveedor (Adendum).</p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none" v-if="hasDiscrepancies">
        <button @click="confirmChanges" :disabled="confirming"
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-[#F96302] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:w-auto disabled:opacity-50">
          <svg v-if="confirming" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Confirmar Cambios
        </button>
      </div>
    </div>

    <!-- Upload Section -->
    <div class="mt-8 bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-base font-semibold leading-6 text-gray-900">Cargar Archivo ADENDUM.xlsx</h3>
        <div class="mt-2 max-w-xl text-sm text-gray-500">
          <p>Sube el archivo Excel provisto por la compañía telefónica para iniciar la comparación.</p>
        </div>
        <form @submit.prevent="uploadFile" class="mt-5 sm:flex sm:items-center">
          <div class="w-full sm:max-w-xs">
            <label for="file-upload" class="sr-only">Archivo</label>
            <input type="file" id="file-upload" ref="fileInput" accept=".xlsx, .xls" @change="handleFileChange"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 border border-gray-300 rounded-md p-1" />
          </div>
          <button type="submit" :disabled="uploading || !hasFile"
            class="mt-3 inline-flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:ml-3 sm:mt-0 sm:w-auto disabled:opacity-50">
            <svg v-if="uploading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesar Adendum
          </button>
        </form>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="syncResult" class="mt-8 space-y-8">
      
      <!-- Tabla A: Alertas de Baja (Rojo) -->
      <div v-if="syncResult.missing?.length" class="bg-red-50 p-6 rounded-lg border border-red-200">
        <h3 class="text-lg font-medium text-red-800 mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          Tabla A: Alertas de Baja ({{ syncResult.missing.length }} líneas)
        </h3>
        <p class="text-sm text-red-600 mb-4">Líneas que están en nuestro sistema pero ya no aparecen en el contrato. Se marcarán como "NO_ENCONTRADO_EN_MES_ACTUAL". Posibles bajas no reportadas.</p>
        <div class="bg-white rounded border border-red-100 overflow-hidden">
          <table class="min-w-full divide-y divide-red-200">
            <thead class="bg-red-50">
              <tr><th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Teléfono Desaparecido</th></tr>
            </thead>
            <tbody class="divide-y divide-red-100 bg-white">
              <tr v-for="telefono in syncResult.missing" :key="telefono">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{{ telefono }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabla B: Nuevas Altas (Verde) -->
      <div v-if="syncResult.added?.length" class="bg-green-50 p-6 rounded-lg border border-green-200">
        <h3 class="text-lg font-medium text-green-800 mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Tabla B: Nuevas Altas ({{ syncResult.added.length }} líneas)
        </h3>
        <p class="text-sm text-green-600 mb-4">Líneas cobradas por el proveedor que no teníamos en el sistema. Entrarán como "NUEVO_CONTRATO" a ser asignados en ServiceSlot.</p>
        <div class="bg-white rounded border border-green-100 overflow-hidden">
          <table class="min-w-full divide-y divide-green-200">
            <thead class="bg-green-50">
              <tr><th class="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Teléfono Nuevo</th></tr>
            </thead>
            <tbody class="divide-y divide-green-100 bg-white">
              <tr v-for="telefono in syncResult.added" :key="telefono">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{{ telefono }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabla C: Cambios de Renta (Naranja) -->
      <div v-if="syncResult.updated?.length" class="bg-orange-50 p-6 rounded-lg border border-orange-200">
        <h3 class="text-lg font-medium text-orange-800 mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Tabla C: Cambios de Renta ({{ syncResult.updated.length }} líneas)
        </h3>
        <p class="text-sm text-orange-600 mb-4">Líneas estables con variación en la cuota mensual de renta en este nuevo mes.</p>
        <div class="bg-white rounded border border-orange-100 overflow-hidden">
          <table class="min-w-full divide-y divide-orange-200">
            <thead class="bg-orange-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">Teléfono</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">Renta Anterior</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">Nueva Renta</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-orange-100 bg-white">
              <tr v-for="upd in syncResult.updated" :key="upd.telefono">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{{ upd.telefono }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${{ upd.renta_anterior || 0 }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">${{ upd.nueva_renta }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Éxito General (Sin problemas) -->
      <div v-if="!hasDiscrepancies && syncResult" class="rounded-md bg-blue-50 p-4 border border-blue-200">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3 flex-1 md:flex md:justify-between">
            <p class="text-sm text-blue-700">El contrato ha sido procesado. No hay discrepancias en Altas o Bajas, se procesaron correctamente sin alertas.</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import api from '../api/axios';

const fileInput = ref(null);
const hasFile = ref(false);
const uploading = ref(false);
const confirming = ref(false);
const syncResult = ref(null);

const handleFileChange = (e) => {
  hasFile.value = !!e.target.files?.length;
};

const hasDiscrepancies = computed(() => {
  return syncResult.value?.missing?.length > 0 || syncResult.value?.added?.length > 0;
});

const uploadFile = async () => {
  if (!fileInput.value?.files?.length) return;
  
  uploading.value = true;
  syncResult.value = null;
  const file = fileInput.value.files[0];
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/adendum/sync', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    // { added, missing, updated, errores }
    syncResult.value = response.data.data;
    alert(response.data.message);
  } catch (error) {
    console.error(error);
    alert('Error al sincronizar: ' + (error.response?.data?.message || error.message));
  } finally {
    uploading.value = false;
  }
};

const confirmChanges = async () => {
  if(!confirm("¿Deseas reconciliar y regularizar todas estas discrepancias en la Base de Datos?")) return;
  
  confirming.value = true;
  try {
    const response = await api.post('/adendum/confirm');
    alert(response.data.message);
    syncResult.value = null; // Clean state on success
    if (fileInput.value) fileInput.value.value = ''; // Reset input
  } catch(error) {
    alert('Error al confirmar: ' + (error.response?.data?.message || error.message));
  } finally {
    confirming.value = false;
  }
}
</script>
