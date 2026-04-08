<template>
  <div class="mt-4">
    <div v-if="loading" class="text-center py-4 text-gray-500">
      Cargando historial...
    </div>
    <div v-else-if="logs.length === 0" class="text-center py-4 text-gray-500 italic">
      No hay registros de auditoría para este activo.
    </div>
    <div v-else class="flow-root">
      <ul role="list" class="-mb-8">
        <li v-for="(log, logIdx) in logs" :key="log.id">
          <div class="relative pb-8">
            <span v-if="logIdx !== logs.length - 1" class="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
            <div class="relative flex space-x-3">
              <div>
                <span :class="[getIconBackground(log.accion), 'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white']">
                  <!-- Icon for REASSIGN -->
                  <svg v-if="log.accion === 'REASSIGN'" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <!-- Icon for UPDATE -->
                  <svg v-else class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                </span>
              </div>
              <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                <div>
                  <p class="text-sm text-gray-500">
                    Cambió <span class="font-medium text-gray-900 border-b border-gray-200">{{ formatField(log.campo_afectado) }}</span>
                    <br/>
                    <span class="text-xs">
                      <del class="text-red-400">{{ log.valor_anterior }}</del>
                      <span class="mx-1 text-gray-400">→</span>
                      <strong class="text-green-600">{{ log.valor_nuevo }}</strong>
                    </span>
                  </p>
                </div>
                <div class="whitespace-nowrap text-right text-xs text-gray-500 flex flex-col items-end">
                  <span>{{ formatDate(log.fecha) }}</span>
                  <span class="font-medium text-gray-900 mt-1">por {{ log.usuario_responsable }}</span>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import api from '../api/axios';

const props = defineProps({
  slotId: {
    type: String,
    required: true
  }
});

const logs = ref([]);
const loading = ref(true);

const fetchLogs = async () => {
  if (!props.slotId) return;
  loading.value = true;
  try {
    const res = await api.get(`/slots/${props.slotId}/logs`);
    logs.value = res.data.data;
  } catch (error) {
    console.error('Error fetching logs:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchLogs();
});

watch(() => props.slotId, () => {
  fetchLogs();
});

const getIconBackground = (accion) => {
  switch (accion) {
    case 'REASSIGN':
      return 'bg-blue-500';
    case 'UPDATE':
      return 'bg-homedepot-orange';
    default:
      return 'bg-gray-400';
  }
};

const formatField = (field) => {
  const map = {
    'employee_id': 'Empleado Asignado',
    'empleado_id': 'Empleado Asignado',
    'estatus': 'Estatus',
    'modelo': 'Modelo',
    'gama': 'Gama',
    'costo_compra': 'Costo',
    'telefono': 'Teléfono',
    'imei': 'IMEI'
  };
  return map[field] || field;
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('es-MX', options);
};
</script>
