<template>
  <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div class="sm:flex sm:items-center sm:justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Inventario Maestro</h2>
        <p class="mt-2 text-sm text-gray-700">Manejo de equipos telefónicos, SIMs y accesorios asignados.</p>
      </div>
      
      <!-- Search and Filters Section -->
      <div class="mt-4 sm:mt-0 flex flex-col space-y-3 sm:space-y-0 sm:flex-none">
        
        <!-- Search -->
        <div class="flex items-center space-x-3 w-full sm:w-auto self-end">
           <button @click="openCreateModal" class="rounded-md bg-[#F96302] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 whitespace-nowrap flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
             Nuevo Activo
           </button>
           <div class="relative rounded-md shadow-sm w-full sm:w-64">
             <input type="text" v-model="filters.search" @keyup.enter="applyFilters" class="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#F96302] sm:text-sm sm:leading-6" placeholder="Buscar IMEI, Teléfono..." />
           </div>
           <button @click="applyFilters" class="rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 whitespace-nowrap">
             Buscar
           </button>
        </div>
      </div>
    </div>

    <!-- Advanced Filters Panel -->
    <div class="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 bg-gray-50 p-4 rounded-md border border-gray-100">
      
      <!-- Gama Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Gama</label>
        <select v-model="filters.gama" @change="applyFilters" class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 bg-white">
          <option value="">Todas</option>
          <option value="BAJA">BAJA</option>
          <option value="MEDIA">MEDIA</option>
          <option value="ALTA">ALTA</option>
        </select>
      </div>

      <!-- Estatus Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Estatus</label>
        <select v-model="filters.estatus" @change="applyFilters" class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 bg-white">
          <option value="">Todos</option>
          <option value="ACTIVO">ACTIVO</option>
          <option value="INACTIVO">INACTIVO</option>
          <option value="DISPONIBLE">DISPONIBLE</option>
        </select>
      </div>

      <!-- Modelo Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Modelo</label>
        <input type="text" v-model="filters.modelo" @keyup.enter="applyFilters" class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 bg-white" placeholder="Ej: iPhone 13" />
      </div>

      <!-- Empleado Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Empleado</label>
        <input type="text" v-model="filters.empleado" @keyup.enter="applyFilters" class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 bg-white" placeholder="Nombre o Num" />
      </div>

      <!-- Tienda Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Tienda (C.C.)</label>
        <input type="text" v-model="filters.tienda" @keyup.enter="applyFilters" class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 bg-white" placeholder="Ej: 8848" />
      </div>

      <!-- Distrito Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Distrito</label>
        <input type="text" v-model="filters.distrito" @keyup.enter="applyFilters" class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 bg-white" placeholder="Ej: NORTE" />
      </div>

      <!-- Puesto Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Puesto</label>
        <input type="text" v-model="filters.puesto" @keyup.enter="applyFilters" class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-homedepot-orange sm:text-sm sm:leading-6 bg-white" placeholder="Ej: GERENTE" />
      </div>

    </div>

    <!-- Table -->
    <div class="mt-4 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            
            <div v-if="loading" class="p-8 text-center text-gray-500">
              Cargando registros...
            </div>
            
            <table v-else class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Teléfono/SIM</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">IMEI</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Equipo</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Empleado</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tienda / Distrito</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estatus</th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span class="sr-only">Editar</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50 cursor-pointer transition-colors" @click="openEditModal(item)">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    <div class="font-bold">{{ item.telefono || 'Sin Número' }}</div>
                    <div class="text-gray-500 text-xs mt-1">{{ item.sim || 'Sin SIM' }}</div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ item.imei || '--' }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div class="font-medium text-gray-900">{{ item.modelo || 'Sin Modelo' }}</div>
                    <div class="text-xs text-gray-500 mt-1">{{ item.gama ? `GAMA ${item.gama}` : '' }}</div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div v-if="item.empleado">
                      <div class="font-medium text-gray-900">{{ item.empleado.nombre_completo }}</div>
                      <div class="text-xs text-gray-500 mt-1">Num: {{ item.empleado.numero_empleado }}</div>
                      <div class="text-[10px] text-gray-400 uppercase mt-0.5 font-bold tracking-wide" v-if="item.empleado.puesto">{{ item.empleado.puesto }}</div>
                    </div>
                    <div v-else class="text-gray-400 italic">No asignado</div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div v-if="item.empleado">
                      <div class="font-medium text-gray-900">{{ item.empleado.tienda || '--' }}</div>
                      <div class="text-xs text-gray-500 mt-1">{{ item.empleado.distrito || '--' }}</div>
                    </div>
                    <div v-else class="text-gray-400 italic">--</div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span :class="getStatusBadgeClass(item.estatus)">
                      {{ item.estatus }}
                    </span>
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button @click.stop="openEditModal(item)" class="text-homedepot-orange hover:text-orange-900 font-semibold">Editar</button>
                  </td>
                </tr>
                <tr v-if="items.length === 0">
                  <td colspan="6" class="py-8 text-center text-gray-500">No se encontraron resultados para los filtros actuales.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-b-lg">
      <div class="flex flex-1 justify-between sm:hidden">
        <button @click="changePage(pagination.page - 1)" :disabled="pagination.page === 1" class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Previous</button>
        <button @click="changePage(pagination.page + 1)" :disabled="pagination.page === pagination.totalPages" class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Next</button>
      </div>
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Mostrando
            <span class="font-medium">{{ ((pagination.page - 1) * pagination.limit) + 1 }}</span>
            al
            <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
            de
            <span class="font-medium">{{ pagination.total }}</span>
            resultados
          </p>
        </div>
        <div>
          <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button @click="changePage(pagination.page - 1)" :disabled="pagination.page === 1" class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
              <span>Anterior</span>
            </button>
            <span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0">
              Página {{ pagination.page }} de {{ pagination.totalPages }}
            </span>
            <button @click="changePage(pagination.page + 1)" :disabled="pagination.page === pagination.totalPages" class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
              <span>Siguiente</span>
            </button>
          </nav>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <EditSlotModal 
      :isOpen="isModalOpen" 
      :slotData="selectedSlot" 
      @close="isModalOpen = false" 
      @saved="handleSlotSaved" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import EditSlotModal from './EditSlotModal.vue';
import api from '../api/axios';

const items = ref([]);
const loading = ref(true);

const isModalOpen = ref(false);
const selectedSlot = ref(null);

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
});

const filters = reactive({
  search: '',
  gama: '',
  estatus: '',
  modelo: '',
  empleado: '',
  tienda: '',
  distrito: '',
  puesto: ''
});

const loadData = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit
    });
    
    if (filters.search) params.append('search', filters.search);
    if (filters.gama) params.append('gama', filters.gama);
    if (filters.estatus) params.append('estatus', filters.estatus);
    if (filters.modelo) params.append('modelo', filters.modelo);
    if (filters.empleado) params.append('empleado', filters.empleado);
    if (filters.tienda) params.append('tienda', filters.tienda);
    if (filters.distrito) params.append('distrito', filters.distrito);
    if (filters.puesto) params.append('puesto', filters.puesto);

    const res = await api.get(`/slots?${params.toString()}`);
    const data = res.data;
    
    items.value = data.data;
    pagination.total = data.meta.total;
    pagination.totalPages = data.meta.totalPages;
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const applyFilters = () => {
  pagination.page = 1;
  loadData();
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > pagination.totalPages) return;
  pagination.page = newPage;
  loadData();
};

const getStatusBadgeClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVO':
      return 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20';
    case 'DISPONIBLE':
      return 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20';
    case 'INACTIVO':
      return 'inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10';
    default:
      return 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10';
  }
};

const openEditModal = (slot) => {
  selectedSlot.value = slot;
  isModalOpen.value = true;
};

const openCreateModal = () => {
  selectedSlot.value = null; // null triggers "Alta" mode
  isModalOpen.value = true;
};

const handleSlotSaved = () => {
  // Reload current page to see changes
  loadData();
};
</script>
