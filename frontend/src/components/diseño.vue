<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
    <!-- Notificaciones -->
    <div
      v-if="notification"
      :class="[
        'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 transition-all duration-300 transform',
        notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      ]"
    >
      <CheckCircle v-if="notification.type === 'success'" :size="20" />
      <AlertCircle v-else :size="20" />
      <span>{{ notification.message }}</span>
    </div>

    <div class="max-w-7xl mx-auto">
      <header class="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 class="text-3xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
          Sistema de Diseño - Vidriería
        </h1>
        <div class="mt-4 md:mt-0 flex items-center space-x-2">
          <span class="text-sm text-gray-500">{{ new Date().toLocaleDateString() }}</span>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Panel de diseños guardados -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-800">Diseños</h2>
              <button
                @click="createNewDesign"
                class="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors duration-200 shadow-sm"
                title="Crear nuevo diseño"
              >
                <Plus :size="16" />
              </button>
            </div>

            <div class="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto pr-1 custom-scrollbar">
              <p v-if="designs.length === 0" class="text-gray-500 text-sm py-4 text-center border border-dashed border-gray-200 rounded-lg">
                No hay diseños guardados
              </p>
              <div
                v-else
                v-for="design in designs"
                :key="design.id"
                :class="[
                  'p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200',
                  currentDesign && currentDesign.id === design.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div @click="loadDesign(design)" class="flex-1">
                    <h3 class="font-medium text-gray-800 truncate">{{ design.name }}</h3>
                    <p class="text-xs text-gray-500">
                      {{ formatDate(design.updatedAt) }}
                    </p>
                  </div>
                  <div class="flex space-x-1">
                    <button
                      @click.stop="duplicateDesign(design)"
                      class="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors"
                      title="Duplicar"
                    >
                      <Copy :size="14" />
                    </button>
                    <button
                      @click.stop="deleteDesign(design.id)"
                      class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
                <div v-if="design.drawing" class="mt-2 border rounded-md overflow-hidden h-16 bg-gray-50">
                  <img :src="design.drawing" alt="Vista previa" class="w-full h-full object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Área principal de diseño -->
        <div class="lg:col-span-3">
          <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <!-- Controles superiores -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
              <div class="flex items-center space-x-4">
                <input
                  v-model="designName"
                  type="text"
                  placeholder="Nombre del diseño"
                  class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  :disabled="!currentDesign"
                />
                <span v-if="hasUnsavedChanges" class="text-orange-500 text-sm flex items-center">
                  <AlertCircle :size="16" class="mr-1" />
                  Cambios sin guardar
                </span>
              </div>

              <div class="flex items-center space-x-2">
                <button
                  @click="isEditMode = !isEditMode"
                  :class="[
                    'px-4 py-2 rounded-lg transition-colors flex items-center',
                    isEditMode ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  ]"
                  :disabled="!currentDesign"
                >
                  <Edit3 :size="16" class="mr-2" />
                  {{ isEditMode ? 'Ver' : 'Editar' }}
                </button>
                
                <button
                  @click="saveDesign"
                  class="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center shadow-sm"
                  :disabled="!currentDesign || !hasUnsavedChanges"
                >
                  <Save :size="16" class="mr-2" />
                  Guardar
                </button>

                <button
                  @click="exportToPNG"
                  class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center shadow-sm"
                  :disabled="!currentDesign"
                >
                  <Download :size="16" class="mr-2" />
                  Exportar
                </button>
              </div>
            </div>

            <!-- Área de diseño -->
            <ExcalidrawWrapper
              v-if="currentDesign"
              :initial-data="currentDesign"
              :is-edit-mode="isEditMode"
              :active-tool="activeTool"
              @change="handleDesignChange"
              @save="saveDesign"
              @update:activeTool="activeTool = $event"
            />
            <div v-else class="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <div class="text-center max-w-md px-4">
                <div class="bg-white p-4 rounded-full inline-block mb-4 shadow-sm">
                  <Edit3 :size="48" class="text-gray-400" />
                </div>
                <h3 class="text-lg font-medium text-gray-600 mb-2">
                  No hay diseño seleccionado
                </h3>
                <p class="text-gray-500 mb-6">
                  Crea un nuevo diseño o selecciona uno existente para comenzar a trabajar en tu proyecto de vidriería
                </p>
                <button
                  @click="createNewDesign"
                  class="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center mx-auto"
                >
                  <Plus :size="16" class="mr-2" />
                  Nuevo Diseño
                </button>
              </div>
            </div>

            <!-- Información del diseño -->
            <div v-if="currentDesign" class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                <div class="flex flex-col">
                  <span class="font-medium mb-1">Creado:</span>
                  <span>{{ formatDateTime(currentDesign.createdAt) }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="font-medium mb-1">Modificado:</span>
                  <span>{{ formatDateTime(currentDesign.updatedAt) }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="font-medium mb-1">Estado:</span>
                  <span :class="hasUnsavedChanges ? 'text-orange-500 font-medium' : 'text-emerald-500 font-medium'">
                    {{ hasUnsavedChanges ? 'Modificado' : 'Guardado' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed, defineComponent } from 'vue';
import { 
  Save, 
  Download, 
  Copy, 
  Trash2, 
  Plus, 
  Edit3, 
  AlertCircle, 
  CheckCircle,
  Ruler,
  Type,
  Square,
  LayoutTemplate
} from 'lucide-vue-next';
import ExcalidrawWrapper from './ExcalidrawWrapper.vue';

interface Design {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  drawing: string | null;
  metadata?: {
    width?: number;
    height?: number;
    elements?: any[];
  };
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

// Estado reactivo
const designs = ref<Design[]>([]);
const currentDesign = ref<Design | null>(null);
const isEditMode = ref(false);
const notification = ref<Notification | null>(null);
const designName = ref('');
const hasUnsavedChanges = ref(false);
const activeTool = ref('pencil');

// Cargar diseños desde localStorage al montar el componente
onMounted(() => {
  const savedDesigns = localStorage.getItem('vidrieria-designs');
  if (savedDesigns) {
    try {
      designs.value = JSON.parse(savedDesigns);
    } catch (error) {
      console.error('Error al cargar diseños:', error);
    }
  }
});

// Guardar diseños en localStorage cuando cambian
watch(designs, (newDesigns) => {
  if (newDesigns.length > 0) {
    localStorage.setItem('vidrieria-designs', JSON.stringify(newDesigns));
  }
}, { deep: true });

// Funciones de utilidad
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Funciones principales
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
};

const createNewDesign = () => {
  if (hasUnsavedChanges.value) {
    const confirmCreate = window.confirm('Tienes cambios sin guardar. ¿Deseas continuar?');
    if (!confirmCreate) return;
  }

  const newDesign: Design = {
    id: Date.now().toString(),
    name: `Diseño ${designs.value.length + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    drawing: null,
    metadata: {
      width: 0,
      height: 0,
      elements: []
    }
  };

  currentDesign.value = newDesign;
  designName.value = newDesign.name;
  isEditMode.value = true;
  hasUnsavedChanges.value = false;
  showNotification('Nuevo diseño creado');
};

const saveDesign = () => {
  if (!currentDesign.value) return;

  const updatedDesign: Design = {
    ...currentDesign.value,
    name: designName.value || currentDesign.value.name,
    updatedAt: new Date().toISOString()
  };

  const existingIndex = designs.value.findIndex(d => d.id === currentDesign.value!.id);
  
  if (existingIndex >= 0) {
    designs.value[existingIndex] = updatedDesign;
    showNotification('Diseño actualizado correctamente');
  } else {
    designs.value.push(updatedDesign);
    showNotification('Diseño guardado correctamente');
  }

  currentDesign.value = updatedDesign;
  hasUnsavedChanges.value = false;
};

const loadDesign = (design: Design) => {
  if (hasUnsavedChanges.value) {
    const confirmLoad = window.confirm('Tienes cambios sin guardar. ¿Deseas continuar?');
    if (!confirmLoad) return;
  }

  currentDesign.value = design;
  designName.value = design.name;
  isEditMode.value = false;
  hasUnsavedChanges.value = false;
  showNotification(`Diseño "${design.name}" cargado`);
};

const duplicateDesign = (design: Design) => {
  const duplicatedDesign: Design = {
    ...design,
    id: Date.now().toString(),
    name: `${design.name} (Copia)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  designs.value.push(duplicatedDesign);
  showNotification(`Diseño duplicado: "${duplicatedDesign.name}"`);
};

const deleteDesign = (designId: string) => {
  const confirmDelete = window.confirm('¿Estás seguro de eliminar este diseño?');
  if (!confirmDelete) return;

  designs.value = designs.value.filter(d => d.id !== designId);
  
  if (currentDesign.value && currentDesign.value.id === designId) {
    currentDesign.value = null;
    designName.value = '';
    isEditMode.value = false;
    hasUnsavedChanges.value = false;
  }

  showNotification('Diseño eliminado', 'error');
};

const exportToPNG = async () => {
  if (!currentDesign.value || !currentDesign.value.drawing) {
    showNotification('No hay diseño para exportar', 'error');
    return;
  }

  try {
    // Crear un elemento de descarga
    const link = document.createElement('a');
    link.download = `${currentDesign.value.name}.png`;
    link.href = currentDesign.value.drawing;
    link.click();
    
    showNotification('Diseño exportado como PNG');
  } catch (error) {
    showNotification('Error al exportar el diseño', 'error');
  }
};

const handleDesignChange = (data: { drawing: string, timestamp: string, metadata?: any }) => {
  if (currentDesign.value) {
    currentDesign.value = {
      ...currentDesign.value,
      drawing: data.drawing,
      updatedAt: data.timestamp,
      metadata: data.metadata || currentDesign.value.metadata
    };
    hasUnsavedChanges.value = true;
  }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>