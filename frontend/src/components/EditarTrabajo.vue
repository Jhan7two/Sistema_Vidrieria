<template>
  <div class="modal-backdrop" @click="cerrar">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="text-xl font-bold">Editar Trabajo #{{ formulario.id }}</h2>
        <button class="modal-close" @click="cerrar">&times;</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="guardar">
          <!-- Información general -->
          <div class="seccion">
            <h3 class="text-lg font-semibold mb-2">Información general</h3>
            
            <!-- Cliente - Solo mostramos, no editamos la relación -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">Cliente</label>
              <input type="text" :value="clienteTexto" disabled class="w-full px-3 py-2 border rounded bg-gray-100" />
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">Tipo de trabajo *</label>
              <select v-model="formulario.tipo" required class="w-full px-3 py-2 border rounded">
                <option value="Instalación">Instalación</option>
                <option value="Corte">Corte</option>
                <option value="Pulido">Pulido</option>
                <option value="Servicio">Servicio</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">Descripción *</label>
              <textarea 
                v-model="formulario.descripcion" 
                rows="3" 
                required 
                class="w-full px-3 py-2 border rounded"
                placeholder="Describa el trabajo a realizar"
              ></textarea>
            </div>
          </div>
          
          <!-- Fechas y dirección -->
          <div class="seccion">
            <h3 class="text-lg font-semibold mb-2">Fechas y ubicación</h3>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium mb-1">Fecha programada *</label>
                <input 
                  type="date" 
                  v-model="formulario.fecha_programada" 
                  required 
                  class="w-full px-3 py-2 border rounded"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Estado</label>
                <select v-model="formulario.estado" class="w-full px-3 py-2 border rounded">
                  <option value="inicio">Inicio</option>
                  <option value="proceso">Proceso</option>
                  <option value="terminado">Terminado</option>
                </select>
              </div>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">Dirección del trabajo</label>
              <input 
                type="text" 
                v-model="formulario.direccion_trabajo" 
                class="w-full px-3 py-2 border rounded"
                placeholder="Dirección donde se realizará el trabajo"
              />
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium mb-1">Fecha de inicio</label>
                <input 
                  type="date" 
                  v-model="formulario.fecha_inicio" 
                  class="w-full px-3 py-2 border rounded"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Fecha de finalización</label>
                <input 
                  type="date" 
                  v-model="formulario.fecha_finalizacion" 
                  class="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
          </div>
          
          <!-- Información financiera -->
          <div class="seccion">
            <h3 class="text-lg font-semibold mb-2">Información financiera</h3>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium mb-1">Costo total *</label>
                <input 
                  type="number" 
                  v-model.number="formulario.costo_total" 
                  required 
                  min="0" 
                  step="0.01" 
                  class="w-full px-3 py-2 border rounded"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Monto pagado</label>
                <input 
                  type="number" 
                  v-model.number="formulario.monto_pagado" 
                  min="0" 
                  step="0.01" 
                  class="w-full px-3 py-2 border rounded"
                  :disabled="true"
                />
                <small class="text-gray-500">Para registrar pagos, use la opción de cobros</small>
              </div>
            </div>
          </div>
          
          <!-- Observaciones -->
          <div class="seccion">
            <h3 class="text-lg font-semibold mb-2">Observaciones</h3>
            
            <div class="mb-4">
              <textarea 
                v-model="formulario.observaciones" 
                rows="3" 
                class="w-full px-3 py-2 border rounded"
                placeholder="Observaciones adicionales sobre el trabajo"
              ></textarea>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 mr-2" @click="cerrar">Cancelar</button>
            <button type="submit" class="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  trabajo: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['cerrar', 'guardar']);

// Crear una copia del trabajo para no modificar el original directamente
const formulario = ref({
  id: props.trabajo.id,
  cliente_id: props.trabajo.cliente_id,
  descripcion: props.trabajo.descripcion,
  tipo: props.trabajo.tipo,
  fecha_programada: formatDateForInput(props.trabajo.fecha_programada),
  fecha_inicio: formatDateForInput(props.trabajo.fecha_inicio),
  fecha_finalizacion: formatDateForInput(props.trabajo.fecha_finalizacion),
  estado: props.trabajo.estado,
  direccion_trabajo: props.trabajo.direccion_trabajo,
  costo_total: parseFloat(props.trabajo.costo_total),
  monto_pagado: parseFloat(props.trabajo.monto_pagado),
  observaciones: props.trabajo.observaciones
});

// Formatear la representación del cliente
const clienteTexto = computed(() => {
  if (props.trabajo.cliente) {
    return props.trabajo.cliente;
  } else if (props.trabajo.clienteInfo) {
    return props.trabajo.clienteInfo.nombre;
  } else if (props.trabajo.cliente_id) {
    return `Cliente #${props.trabajo.cliente_id}`;
  } else {
    return 'Sin cliente';
  }
});

function formatDateForInput(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
}

function cerrar() {
  emit('cerrar');
}

function guardar() {
  // Validar los datos
  if (!formulario.value.descripcion || !formulario.value.tipo || !formulario.value.fecha_programada || !formulario.value.costo_total) {
    alert('Por favor complete todos los campos obligatorios');
    return;
  }
  
  // Emitir evento con los datos actualizados
  emit('guardar', formulario.value);
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #4b5563;
}

.seccion {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.seccion:last-child {
  border-bottom: none;
  margin-bottom: 0;
}
</style> 