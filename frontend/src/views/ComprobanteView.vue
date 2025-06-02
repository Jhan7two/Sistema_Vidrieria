<template>
  <div class="comprobante-page">
    <div class="comprobante-container">
      <div id="comprobante" class="comprobante">
        <div class="header">
          <h1>Comprobante de Trabajo</h1>
          <div class="fecha">Fecha: {{ formatDate(new Date()) }}</div>
        </div>

        <div class="info-cliente">
          <h2>Información del Cliente</h2>
          <p><strong>Cliente:</strong> {{ trabajo?.cliente || 'Sin cliente' }}</p>
          <p v-if="trabajo?.clienteInfo"><strong>Teléfono:</strong> {{ trabajo.clienteInfo.telefono }}</p>
          <p><strong>Dirección:</strong> {{ trabajo?.direccion_trabajo }}</p>
        </div>

        <div class="info-trabajo">
          <h2>Detalles del Trabajo</h2>
          <p><strong>Tipo:</strong> {{ trabajo?.tipo }}</p>
          <p><strong>Descripción:</strong> {{ trabajo?.descripcion }}</p>
          <p><strong>Estado:</strong> {{ trabajo?.estado }}</p>
          <p><strong>Fecha Programada:</strong> {{ formatDate(trabajo?.fecha_programada) }}</p>
          <p v-if="trabajo?.fecha_finalizacion"><strong>Fecha Finalización:</strong> {{ formatDate(trabajo.fecha_finalizacion) }}</p>
        </div>

        <div class="info-financiera">
          <h2>Información Financiera</h2>
          <table class="tabla-financiera">
            <tr>
              <td>Costo Total:</td>
              <td>{{ formatCurrency(trabajo?.costo_total) }}</td>
            </tr>
            <tr>
              <td>Monto Pagado:</td>
              <td>{{ formatCurrency(trabajo?.monto_pagado) }}</td>
            </tr>
            <tr>
              <td>Saldo Pendiente:</td>
              <td>{{ formatCurrency(trabajo?.saldo_pendiente) }}</td>
            </tr>
            <tr>
              <td>Estado de Pago:</td>
              <td>{{ trabajo?.estado_pago }}</td>
            </tr>
          </table>
        </div>

        <div class="observaciones" v-if="trabajo?.observaciones">
          <h2>Observaciones</h2>
          <p>{{ trabajo.observaciones }}</p>
        </div>

        <div class="footer">
          <p>comprobante de trabajo Vidrieria Montero.</p>
        </div>
      </div>

      <div class="botones">
        <button @click="imprimir" class="btn-imprimir">Imprimir</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import html2pdf from 'html2pdf.js';
import '../assets/comprobante.css';

const route = useRoute();
const trabajo = ref(null);

function formatDate(date) {
  if (!date) return 'No disponible';
  return new Date(date).toLocaleDateString('es-ES', {
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
  return '$' + value.toFixed(2);
}

async function generarPDF() {
  const element = document.getElementById('comprobante');
  const opt = {
    margin: 0,
    filename: `comprobante_trabajo_${trabajo.value?.id}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Error al generar el PDF:', error);
  }
}

function imprimir() {
  window.print();
}

onMounted(() => {
  const trabajoData = route.query.trabajo;
  if (trabajoData) {
    trabajo.value = JSON.parse(decodeURIComponent(trabajoData));
    setTimeout(() => {
      generarPDF();
    }, 1000);
  }
});
</script> 