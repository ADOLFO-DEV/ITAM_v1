<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 class="text-lg font-semibold text-slate-800">Sincronización de Headcount</h3>
          <p class="text-sm text-slate-500 mt-1">Sube el archivo Excel (LISTADO.xlsx) con el listado actual de asociados de The Home Depot para sincronizar la base de datos.</p>
        </div>
      </div>

      <div class="p-6">
        <!-- Upload Area -->
        <div 
          class="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200"
          :class="[
            isDragging ? 'border-[#F96302] bg-orange-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100',
            loading ? 'opacity-50 pointer-events-none' : ''
          ]"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
            <UploadCloud v-if="!file" class="w-8 h-8 text-slate-400" />
            <FileSpreadsheet v-else class="w-8 h-8 text-[#F96302]" />
          </div>
          
          <h4 class="text-lg font-medium text-slate-700 mb-2">
            <span v-if="!file">Arrastra y suelta tu archivo Excel aquí</span>
            <span v-else>{{ file.name }}</span>
          </h4>
          
          <p class="text-sm text-slate-500 text-center max-w-md mb-6">
            <span v-if="!file">o selecciona un archivo desde tu computadora. Solo se admiten archivos .xlsx o .xls.</span>
            <span v-else>{{ formatBytes(file.size) }} - Listo para sincronizar</span>
          </p>

          <input 
            type="file" 
            ref="fileInput" 
            class="hidden" 
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            @change="handleFileSelect"
          >
          
          <div class="flex gap-3">
            <button 
              v-if="!file"
              type="button" 
              @click="$refs.fileInput.click()" 
              class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F96302]/50"
            >
              Seleccionar Archivo
            </button>
            <template v-else>
              <button 
                type="button" 
                @click="clearFile" 
                class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                :disabled="loading"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                @click="syncHeadcount" 
                class="px-5 py-2.5 bg-[#F96302] text-white font-medium rounded-lg shadow-sm hover:bg-[#e05802] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F96302]/50 flex items-center gap-2"
                :disabled="loading"
              >
                <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
                <span>{{ loading ? 'Sincronizando...' : 'Iniciar Sincronización' }}</span>
              </button>
            </template>
          </div>
        </div>

        <!-- Alert messages -->
        <div v-if="error" class="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h5 class="text-sm font-medium text-red-800">Error en la sincronización</h5>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Area -->
    <div v-if="results" class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
      <!-- Totals Card -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center text-center">
        <h4 class="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Total Procesados</h4>
        <p class="text-4xl font-bold text-slate-800">{{ results.total_procesados.total_en_archivo }}</p>
        <p class="text-xs text-slate-400 mt-2">Registros leídos del archivo Excel</p>
      </div>

      <!-- Nuevos Card -->
      <div class="bg-white rounded-xl shadow-sm border border-emerald-200 p-6 flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <UserPlus class="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h4 class="text-emerald-800 text-sm font-semibold uppercase tracking-wider mb-1">Nuevos Ingresos</h4>
          <p class="text-3xl font-bold text-emerald-600 mb-2">{{ results.total_procesados.nuevos }}</p>
          <div class="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar" v-if="results.nuevos_asociados?.length > 0">
            <div v-for="user in results.nuevos_asociados" :key="user.numero_empleado" class="text-sm text-emerald-700 border-b border-emerald-100 pb-1 pt-1 last:border-0">
              <span class="font-medium inline-block w-14">{{ user.numero_empleado }}</span>
              <span class="truncate">{{ user.nombre_completo }}</span>
            </div>
          </div>
          <p v-else class="text-sm text-emerald-600/70 italic">No hubo ingresos nuevos.</p>
        </div>
      </div>

      <!-- Bajas Card -->
      <div class="bg-white rounded-xl shadow-sm border border-red-200 p-6 flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <UserMinus class="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h4 class="text-red-800 text-sm font-semibold uppercase tracking-wider mb-1">Bajas Detectadas</h4>
          <p class="text-3xl font-bold text-red-600 mb-2">{{ results.total_procesados.bajas }}</p>
          <div class="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar" v-if="results.asociados_baja?.length > 0">
            <div v-for="user in results.asociados_baja" :key="user.numero_empleado" class="text-sm text-red-700 border-b border-red-100 pb-1 pt-1 last:border-0">
              <span class="font-medium inline-block w-14 line-through opacity-70">{{ user.numero_empleado }}</span>
              <span class="truncate">{{ user.nombre_completo }}</span>
            </div>
          </div>
          <p v-else class="text-sm text-red-600/70 italic">No hubo bajas en este reporte.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle, UserPlus, UserMinus } from 'lucide-vue-next';

const fileInput = ref(null);
const file = ref(null);
const isDragging = ref(false);
const loading = ref(false);
const error = ref(null);
const results = ref(null);

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const validateFile = (selectedFile) => {
  const allowedExtensions = ['xls', 'xlsx'];
  const fileExt = selectedFile.name.split('.').pop().toLowerCase();
  
  if (!allowedExtensions.includes(fileExt)) {
    error.value = 'Formato no soportado. Por favor sube un archivo Excel (.xls o .xlsx)';
    return false;
  }
  return true;
};

const handleDrop = (e) => {
  isDragging.value = false;
  error.value = null;
  results.value = null;
  
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const droppedFile = e.dataTransfer.files[0];
    if (validateFile(droppedFile)) {
      file.value = droppedFile;
    }
  }
};

const handleFileSelect = (e) => {
  error.value = null;
  results.value = null;
  
  if (e.target.files && e.target.files.length > 0) {
    const selectedFile = e.target.files[0];
    if (validateFile(selectedFile)) {
      file.value = selectedFile;
    }
  }
};

const clearFile = () => {
  file.value = null;
  error.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const syncHeadcount = async () => {
  if (!file.value) return;
  
  loading.value = true;
  error.value = null;
  results.value = null;
  
  const token = localStorage.getItem('itam_token');
  const formData = new FormData();
  formData.append('file', file.value);
  
  try {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${baseUrl}/employees/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Do not set Content-Type here, let the browser set it to multipart/form-data with the boundary.
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ocurrió un error al sincronizar el archivo.');
    }
    
    results.value = data;
    
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom minimal scrollbar for cards */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1); 
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.2); 
}
</style>
