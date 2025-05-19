<template>
  <div class="modal-backdrop" @click="cerrar">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="text-xl font-bold">Detalles del Trabajo #{{ trabajo.id }}</h2>
        <button class="modal-close" @click="cerrar">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- Información general -->
        <div class="seccion">
          <h3 class="text-lg font-semibold mb-2">Información general</h3>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p><span class="font-medium">Cliente:</span> {{ trabajo.cliente || 'Sin cliente' }}</p>
              <p v-if="trabajo.clienteInfo"><span class="font-medium">Teléfono:</span> {{ trabajo.clienteInfo.telefono || 'No disponible' }}</p>
              <p><span class="font-medium">Tipo:</span> {{ trabajo.tipo || 'No especificado' }}</p>
              <p><span class="font-medium">Descripción:</span> {{ trabajo.descripcion || 'Sin descripción' }}</p>
            </div>
            <div>
              <p><span class="font-medium">Dirección:</span> {{ trabajo.direccion_trabajo || 'No disponible' }}</p>
              <p><span class="font-medium">Fecha programada:</span> {{ formatDate(trabajo.fecha_programada) }}</p>
              <p><span class="font-medium">Estado:</span> <span :class="estadoClase(trabajo.estado)">{{ trabajo.estado }}</span></p>
              <p v-if="trabajo.fecha_finalizacion"><span class="font-medium">Fecha finalización:</span> {{ formatDate(trabajo.fecha_finalizacion) }}</p>
            </div>
          </div>
        </div>
        
        <!-- Información financiera -->
        <div class="seccion">
          <h3 class="text-lg font-semibold mb-2">Información financiera</h3>
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="financiero costo">
              <div class="valor">{{ formatCurrency(trabajo.costo_total) }}</div>
              <div class="etiqueta">Costo total</div>
            </div>
            <div class="financiero pagado">
              <div class="valor">{{ formatCurrency(trabajo.monto_pagado) }}</div>
              <div class="etiqueta">Pagado</div>
            </div>
            <div class="financiero pendiente">
              <div class="valor">{{ formatCurrency(trabajo.saldo_pendiente) }}</div>
              <div class="etiqueta">Pendiente</div>
            </div>
          </div>
          <p><span class="font-medium">Estado de pago:</span> <span :class="estadoPagoClase(trabajo.estado_pago)">{{ trabajo.estado_pago }}</span></p>
        </div>
        
        <!-- Observaciones -->
        <div class="seccion" v-if="trabajo.observaciones">
          <h3 class="text-lg font-semibold mb-2">Observaciones</h3>
          <div class="observaciones p-3 bg-gray-50 rounded">
            {{ trabajo.observaciones }}
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 mr-2" @click="cerrar">Cerrar</button>
        <button class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 mr-2" @click="editar">Editar</button>
        <button class="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700" @click="generarComprobante">Generar comprobante</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  trabajo: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['cerrar', 'editar', 'generar-comprobante']);

function cerrar() {
  emit('cerrar');
}

function editar() {
  emit('editar', props.trabajo);
}

function generarComprobante() {
  emit('generar-comprobante', props.trabajo);
}

function formatDate(dateString) {
  if (!dateString) return 'No disponible';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') {
    value = parseFloat(value);
    if (isNaN(value)) return '-';
  }
  if (typeof value !== 'number') return '-';
  return '$' + value.toFixed(2);
}

function estadoClase(estado) {
  if (!estado) return '';
  switch (estado) {
    case 'inicio': return 'bg-blue-100 text-blue-800 px-2 py-1 rounded';
    case 'proceso': return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded';
    case 'terminado': return 'bg-green-100 text-green-800 px-2 py-1 rounded';
    default: return '';
  }
}

function estadoPagoClase(estadoPago) {
  if (!estadoPago) return '';
  switch (estadoPago) {
    case 'Pendiente': return 'bg-red-100 text-red-800 px-2 py-1 rounded';
    case 'Parcial': return 'bg-orange-100 text-orange-800 px-2 py-1 rounded';
    case 'Pagado': return 'bg-green-100 text-green-800 px-2 py-1 rounded';
    default: return '';
  }
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

.financiero {
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.financiero .valor {
  font-size: 1.5rem;
  font-weight: bold;
}

.financiero .etiqueta {
  font-size: 0.875rem;
  color: #4b5563;
}

.financiero.costo {
  background-color: #e0f2fe;
  color: #0369a1;
}

.financiero.pagado {
  background-color: #dcfce7;
  color: #15803d;
}

.financiero.pendiente {
  background-color: #fee2e2;
  color: #b91c1c;
}

.observaciones {
  white-space: pre-line;
}
</style> 