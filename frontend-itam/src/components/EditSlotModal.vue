<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" v-if="isOpen">
    <!-- Backdrop con Glassmorphism -->
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity duration-300" @click="$emit('close')"></div>

    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 class="text-xl font-bold leading-6 text-slate-800 mb-6 flex items-center">
                <span class="w-2 h-6 rounded-full bg-[#F96302] mr-3"></span>
                {{ isEditing ? (isReadOnly ? 'Detalles del Activo:' : 'Editando Activo:') : 'Nuevo Activo' }} <span v-if="isEditing" class="font-mono text-[#F96302] ml-2">{{ slotData.telefono || 'Sin Teléfono' }}</span>
              </h3>

              <!-- Tabs modernizadas (Sólo si es Edición) -->
              <div v-if="isEditing" class="border-b border-slate-200 mb-6">
                <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                  <button @click="activeTab = 'editar'" :class="[activeTab === 'editar' ? 'border-[#F96302] text-[#F96302]' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700', 'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold transition-colors duration-200']">
                    {{ isReadOnly ? 'Ver Información' : 'Editar Información' }}
                  </button>
                  <button @click="activeTab = 'historial'" :class="[activeTab === 'historial' ? 'border-[#F96302] text-[#F96302]' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700', 'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold transition-colors duration-200']">
                    Historial de Cambios
                  </button>
                </nav>
              </div>
              
              <!-- Tab Content: Editar / Crear -->
              <div v-show="activeTab === 'editar'" class="animate-in fade-in slide-in-from-right-4 duration-300">
                <!-- Error Banner -->
                <div v-if="errorMsg" class="mb-6 bg-rose-50/80 border-l-4 border-rose-400 p-4 rounded-r-lg shadow-sm">
                  <div class="flex">
                    <div class="ml-3 text-sm text-rose-700 font-medium">
                      {{ errorMsg }}
                    </div>
                  </div>
                </div>

                <form @submit.prevent="submitForm" class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <!-- Teléfono -->
                  <div class="sm:col-span-1">
                    <label class="block text-sm font-semibold leading-6 text-slate-700">Teléfono (10 dígitos)</label>
                    <div class="mt-2 text-slate-400 relative">
                      <input type="text" maxlength="10" placeholder="Ej. 5512345678" v-model="formData.telefono" :disabled="isReadOnly" class="block w-full font-mono rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#F96302] sm:text-sm sm:leading-6 px-4 transition-all hover:bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" />
                    </div>
                  </div>

                  <!-- IMEI -->
                  <div class="sm:col-span-1">
                    <label class="block text-sm font-semibold leading-6 text-slate-700">IMEI (15 dígitos)</label>
                    <div class="mt-2">
                      <input type="text" maxlength="15" v-model="formData.imei" placeholder="Ej. 35XXXXXXXXXXXXXXXXX" :disabled="isReadOnly" class="block w-full font-mono rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#F96302] sm:text-sm sm:leading-6 px-4 transition-all hover:bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" />
                    </div>
                  </div>

                  <!-- Modelo -->
                  <div class="sm:col-span-1">
                    <label class="block text-sm font-semibold leading-6 text-slate-700">Modelo</label>
                    <div class="mt-2">
                      <input type="text" v-model="formData.modelo" :disabled="isReadOnly" class="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#F96302] sm:text-sm sm:leading-6 px-4 transition-all hover:bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" />
                    </div>
                  </div>

                  <!-- SIM -->
                  <div class="sm:col-span-1">
                    <label class="block text-sm font-semibold leading-6 text-slate-700">SIM (ICCID)</label>
                    <div class="mt-2">
                      <input type="text" v-model="formData.sim" placeholder="Ej. 89XXXXXXXXXXXXXXXXX" :disabled="isReadOnly" class="block w-full font-mono rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#F96302] sm:text-sm sm:leading-6 px-4 transition-all hover:bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" />
                    </div>
                  </div>

                  <!-- Gama -->
                  <div class="sm:col-span-1">
                    <label class="block text-sm font-semibold leading-6 text-slate-700">Gama</label>
                    <div class="mt-2">
                      <select v-model="formData.gama" :disabled="isReadOnly" class="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#F96302] sm:text-sm sm:leading-6 px-4 bg-white transition-all hover:bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed">
                        <option value="">Seleccionar gama</option>
                        <option value="BAJA">BAJA</option>
                        <option value="MEDIA">MEDIA</option>
                        <option value="ALTA">ALTA</option>
                        <option value="IPHONE">IPHONE</option>
                        <option value="GENER">GENER</option>
                        <option value="MOTO">MOTO</option>
                      </select>
                    </div>
                  </div>

                  <!-- Empleado Dinámico -->
                  <div class="sm:col-span-1">
                    <label class="block text-sm font-semibold leading-6 text-slate-700">Número de Empleado Asignado</label>
                    <div class="mt-2">
                       <input type="text" v-model="formData.employee_id" placeholder="Ej. 123456" :disabled="isReadOnly" class="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#F96302] sm:text-sm sm:leading-6 px-4 transition-all hover:bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" />
                    </div>
                  </div>

                  <!-- Centro de Costos -->
                  <div class="sm:col-span-1" v-if="formData.employee_id">
                    <label class="block text-sm font-semibold leading-6 text-slate-700">Centro de Costos (Tienda)</label>
                    <div class="mt-2 text-slate-400 relative">
                      <input type="text" v-model="formData.centro_costos" placeholder="Ej. 8701" :disabled="isReadOnly" class="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#F96302] sm:text-sm sm:leading-6 px-4 pr-10 transition-all hover:bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" />
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1">* Se modificará para el empleado asignado.</p>
                  </div>
                  
                  <!-- Correo -->
                  <div class="sm:col-span-1" v-if="formData.employee_id">
                    <label class="block text-sm font-semibold leading-6 text-slate-700">Correo (Empleado)</label>
                    <div class="mt-2 text-slate-400 relative">
                      <input type="email" v-model="formData.correo" placeholder="ejemplo@homedepot.com.mx" :disabled="isReadOnly" class="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#F96302] sm:text-sm sm:leading-6 px-4 pr-10 transition-all hover:bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" />
                    </div>
                  </div>

                  <!-- Fecha de Inicio -->
                  <div class="sm:col-span-1">
                    <label class="block text-sm font-semibold leading-6 text-slate-700">Fecha de Inicio</label>
                    <div class="mt-2">
                       <input type="date" v-model="formData.fecha_inicio" :disabled="isReadOnly" class="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#F96302] sm:text-sm sm:leading-6 px-4 transition-all hover:bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" />
                    </div>
                  </div>

                  <!-- Fecha de Renovación -->
                  <div class="sm:col-span-1">
                    <label class="block text-sm font-semibold leading-6 text-slate-700">Próxima Renovación</label>
                    <div class="mt-2">
                       <input type="date" v-model="formData.fecha_renovacion" :disabled="isReadOnly" class="block w-full rounded-xl border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#F96302] sm:text-sm sm:leading-6 px-4 transition-all hover:bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" />
                    </div>
                  </div>
                  
                  <!-- Estatus -->
                  <div class="sm:col-span-2 border-t border-slate-100 pt-5 mt-2">
                    <label class="block text-sm font-semibold leading-6 text-slate-700 mb-3">Estatus del Activo</label>
                    <div class="flex items-center space-x-6">
                      <label class="inline-flex items-center" :class="{ 'cursor-pointer': !isReadOnly, 'opacity-70 cursor-not-allowed': isReadOnly }">
                        <input type="radio" v-model="formData.estatus" value="ACTIVO" :disabled="isReadOnly" class="form-radio h-5 w-5 text-emerald-500 border-slate-300 focus:ring-emerald-500 disabled:bg-slate-100" />
                        <span class="ml-2 text-sm font-medium text-slate-700">ACTIVO</span>
                      </label>
                      <label class="inline-flex items-center" :class="{ 'cursor-pointer': !isReadOnly, 'opacity-70 cursor-not-allowed': isReadOnly }">
                        <input type="radio" v-model="formData.estatus" value="DISPONIBLE" :disabled="isReadOnly" class="form-radio h-5 w-5 text-blue-500 border-slate-300 focus:ring-blue-500 disabled:bg-slate-100" />
                        <span class="ml-2 text-sm font-medium text-slate-700">DISPONIBLE</span>
                      </label>
                      <label class="inline-flex items-center" :class="{ 'cursor-pointer': !isReadOnly, 'opacity-70 cursor-not-allowed': isReadOnly }">
                        <input type="radio" v-model="formData.estatus" value="INACTIVO" :disabled="isReadOnly" class="form-radio h-5 w-5 text-rose-500 border-slate-300 focus:ring-rose-500 disabled:bg-slate-100" />
                        <span class="ml-2 text-sm font-medium text-slate-700">INACTIVO</span>
                      </label>
                      <label class="inline-flex items-center" :class="{ 'cursor-pointer': !isReadOnly, 'opacity-70 cursor-not-allowed': isReadOnly }">
                        <input type="radio" v-model="formData.estatus" value="BAJA" :disabled="isReadOnly" class="form-radio h-5 w-5 text-rose-700 border-slate-300 focus:ring-rose-700 disabled:bg-slate-100" />
                        <span class="ml-2 text-sm font-medium text-slate-700">BAJA</span>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Tab Content: Historial -->
              <div v-if="isEditing && activeTab === 'historial'" class="max-h-96 overflow-y-auto pr-2 animate-in fade-in slide-in-from-left-4 duration-300">
                <AuditTimeline v-if="formData.id" :slotId="formData.id" />
              </div>

            </div>
          </div>
        </div>
        <div class="bg-slate-50/80 backdrop-blur-sm px-6 py-4 sm:flex sm:flex-row-reverse border-t border-slate-100">
          <button v-if="!isReadOnly" v-show="activeTab === 'editar'" type="button" :disabled="isSaving" @click="submitForm" class="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-[#F96302] to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/30 hover:shadow-orange-500/50 hover:from-orange-600 hover:to-orange-500 transition-all sm:ml-3 sm:w-auto disabled:opacity-50 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
            <svg v-if="isSaving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ isSaving ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Crear Activo') }}
          </button>
          <button type="button" @click="$emit('close')" class="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all sm:mt-0 sm:w-auto sm:ml-3 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2">
            {{ isReadOnly ? 'Cerrar' : 'Cancelar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import api from '../api/axios';
import AuditTimeline from './AuditTimeline.vue';

const props = defineProps({
  isOpen: Boolean,
  slotData: Object // Si es nulo o vacío, es "Alta". Si tiene datos, es "Edición".
});

const emit = defineEmits(['close', 'saved']);

const activeTab = ref('editar');
const isSaving = ref(false);
const errorMsg = ref('');
const isReadOnly = ref(false);

const formData = reactive({
  id: '',
  telefono: '',
  modelo: '',
  imei: '',
  sim: '',
  centro_costos: '',
  correo: '',
  gama: '',
  employee_id: '',
  estatus: 'ACTIVO',
  fecha_inicio: '',
  fecha_renovacion: ''
});

const originalData = ref({});

const isEditing = computed(() => !!props.slotData && !!props.slotData.id);

onMounted(() => {
  const userData = localStorage.getItem('itam_user');
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      isReadOnly.value = parsed.rol === 'VIEWER';
    } catch (e) {
      console.error(e);
    }
  }
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.slotData && props.slotData.id) {
      // Edición Unitaria
      const formatDateForInput = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
      };

      const initial = {
        id: props.slotData.id,
        telefono: props.slotData.telefono || '',
        modelo: props.slotData.modelo || '',
        imei: props.slotData.imei || '',
        sim: props.slotData.sim || '',
        centro_costos: props.slotData.empleado?.centro_costos || '',
        correo: props.slotData.empleado?.email || '',
        gama: props.slotData.gama || '',
        employee_id: props.slotData.employee_id || '',
        estatus: props.slotData.estatus || 'ACTIVO',
        fecha_inicio: formatDateForInput(props.slotData.fecha_inicio),
        fecha_renovacion: formatDateForInput(props.slotData.fecha_renovacion)
      };
      
      Object.assign(formData, initial);
      originalData.value = { ...initial };
      activeTab.value = 'editar';
    } else {
      // Alta de Activo
      Object.assign(formData, {
        id: '',
        telefono: '',
        modelo: '',
        imei: '',
        sim: '',
        centro_costos: '',
        correo: '',
        gama: '',
        employee_id: '',
        estatus: 'DISPONIBLE',
        fecha_inicio: '',
        fecha_renovacion: ''
      });
      originalData.value = {};
      activeTab.value = 'editar';
    }
    errorMsg.value = '';
  }
});

const submitForm = async () => {
  isSaving.value = true;
  errorMsg.value = '';

  try {
    if (isEditing.value) {
      // PATCH: Enviar únicamente los campos modificados
      const payload = {};
      for (const key in formData) {
        if (key !== 'id' && formData[key] !== originalData.value[key]) {
             if (key === 'employee_id' && formData[key] === '') {
                 payload[key] = null;
             } else {
                 payload[key] = formData[key];
             }
        }
      }
      
      if (Object.keys(payload).length === 0) {
        emit('close');
        return;
      }
      
      const response = await api.patch(`/slots/${formData.id}`, payload);
      emit('saved', response.data.data);
    } else {
      // POST: Alta de Activo
      const payload = { ...formData };
      delete payload.id;
      if (!payload.employee_id) payload.employee_id = null;
      
      if (!payload.telefono || payload.telefono.length !== 10) {
        throw new Error("El teléfono es obligatorio y debe tener exactamente 10 dígitos.");
      }
      if (!payload.imei) {
        throw new Error("El IMEI es obligatorio.");
      }
      
      const response = await api.post('/slots', payload);
      emit('saved', response.data);
    }
    
    emit('close');
  } catch (error) {
    if (error.response && error.response.data) {
        const d = error.response.data;
        if (d.details && d.details.length) {
          errorMsg.value = d.details.map(e => `${e.path}: ${e.message}`).join(', ');
        } else {
          errorMsg.value = d.message || d.error || 'Error al procesar la solicitud';
        }
    } else {
       errorMsg.value = error.message;
    }
  } finally {
    isSaving.value = false;
  }
};
</script>
