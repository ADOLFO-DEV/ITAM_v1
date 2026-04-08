<template>
  <div class="space-y-6">
    <div class="sm:flex sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Historial de Auditoría</h2>
        <p class="mt-2 text-sm text-slate-600">Últimos movimientos y cambios en los activos del sistema.</p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button @click="loadData" class="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors">
          Actualizar
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div class="overflow-x-auto">
        <div v-if="loading" class="py-12 text-center text-slate-500">
          Cargando registros...
        </div>
        <table v-else class="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Fecha</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Acción</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Activo Afectado</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Detalle</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Usuario</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-slate-50">
              <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-slate-500 sm:pl-0">
                {{ formatDate(log.fecha) }}
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm">
                <span :class="[
                  log.accion === 'REASSIGN' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-orange-50 text-orange-700 ring-orange-600/20',
                  'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'
                ]">
                  {{ log.accion === 'REASSIGN' ? 'REASIGNACIÓN' : 'ACTUALIZACIÓN' }}
                </span>
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                <div class="font-medium text-slate-900">{{ log.slot?.telefono || 'Sin Teléfono' }}</div>
                <div class="text-xs text-slate-500 mt-0.5">IMEI: {{ log.slot?.imei || '--' }}</div>
              </td>
              <td class="px-3 py-4 text-sm text-slate-500 min-w-[300px]">
                <div>
                  <span class="font-medium text-slate-700">{{ formatField(log.campo_afectado) }}</span>
                </div>
                <div class="flex items-center space-x-2 mt-1 text-xs">
                  <span class="line-through text-red-500 truncate max-w-[120px]" :title="log.valor_anterior">{{ log.valor_anterior || 'Ninguno' }}</span>
                  <span class="text-slate-400">→</span>
                  <span class="font-medium text-green-600 truncate max-w-[120px]" :title="log.valor_nuevo">{{ log.valor_nuevo || 'Ninguno' }}</span>
                </div>
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                {{ log.usuario_responsable }}
              </td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="5" class="py-8 text-center text-slate-500">No se encontraron registros de auditoría.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/axios';

const logs = ref([]);
const loading = ref(true);

const loadData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/logs?limit=50');
    logs.value = res.data.data;
  } catch (error) {
    console.error('Error fetching logs:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

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
