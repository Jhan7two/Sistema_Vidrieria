<template>
  <div class="caja-diaria p-6">    
    <!-- Mensaje de error -->
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <span class="block sm:inline">{{ error }}</span>
      <button @click="error = null" class="float-right font-bold">×</button>
    </div>
    
    <!-- Mensaje de éxito -->
    <div v-if="mensaje" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      <span class="block sm:inline">{{ mensaje }}</span>
      <button @click="mensaje = null" class="float-right font-bold">×</button>
    </div>
    
    <div class="saldo-actual bg-white p-4 rounded shadow mb-4">
      <strong>Saldo actual:</strong> {{ formatCurrency(saldo) }}
    </div>
    
    <!-- Indicador de carga -->
    <div v-if="cargando" class="text-center py-3 mb-4">
      <span class="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded">
        Cargando datos...
      </span>
    </div>
    
    <!-- Pestañas -->
    <div class="mb-4 flex gap-2">
      <button :class="vista === 'movimientos' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'" class="px-4 py-2 rounded-l" @click="vista = 'movimientos'">Movimientos</button>
      <button :class="vista === 'cobros' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'" class="px-4 py-2 rounded-r" @click="vista = 'cobros'">Cobros de Trabajos</button>
    </div>
    <div v-if="vista === 'movimientos'" class="acciones">
      <div class="form-ingreso rounded-xl shadow-md bg-white/60 backdrop-blur-md">
        <div class="rounded-t-xl px-6 py-3 mb-4 flex items-center gap-2"
             style="background: linear-gradient(90deg, #22c55e 80%, #15803d 100%);">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 16v-4" /></svg>
          <h3 class="text-lg font-semibold text-white">Registrar Ingreso</h3>
        </div>
        <div class="px-6 pb-6">
          <form @submit.prevent="registrarMovimiento('entrada')" class="">
            <div class="mb-2">
              <input v-model="nuevoIngreso.concepto" placeholder="Concepto" required class="border rounded px-3 py-2 w-full mb-2" />
              <input v-model.number="nuevoIngreso.monto" type="number" min="0" step="0.01" placeholder="Monto" required class="border rounded px-3 py-2 w-full mb-2" />
              <input v-model="nuevoIngreso.descripcion" placeholder="Descripción" class="border rounded px-3 py-2 w-full mb-2" />
              <select v-model="nuevoIngreso.forma_pago" class="border rounded px-3 py-2 w-full mb-2">
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">Registrar Ingreso</button>
          </form>
        </div>
      </div>
      <div class="form-egreso rounded-xl shadow-md bg-white/60 backdrop-blur-md">
        <div class="rounded-t-xl px-6 py-3 mb-4 flex items-center gap-2"
             style="background: linear-gradient(90deg, #ef4444 80%, #b91c1c 100%);">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 13H5v-2h14v2z" /></svg>
          <h3 class="text-lg font-semibold text-white">Registrar Egreso</h3>
        </div>
        <div class="px-6 pb-6">
          <form @submit.prevent="registrarMovimiento('salida')" class="">
            <div class="mb-2">
              <input v-model="nuevoEgreso.concepto" placeholder="Concepto" required class="border rounded px-3 py-2 w-full mb-2" />
              <input v-model.number="nuevoEgreso.monto" type="number" min="0" step="0.01" placeholder="Monto" required class="border rounded px-3 py-2 w-full mb-2" />
              <input v-model="nuevoEgreso.descripcion" placeholder="Descripción" class="border rounded px-3 py-2 w-full mb-2" />
            </div>
            <button type="submit" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full">Registrar Egreso</button>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Sección de Cobros de Trabajos -->
    <div v-if="vista === 'cobros'" class="cobros-trabajos mb-6">
      <div class="flex justify-between items-center mb-4">
        <div class="rounded-t-xl px-6 py-3 flex items-center gap-2 w-full"
             style="background: linear-gradient(90deg, #2563eb 80%, #1e40af 100%);">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 16v-4" /></svg>
          <h3 class="text-lg font-semibold text-white flex-1">Registrar Cobro de Trabajo</h3>
          <button @click="buscarTrabajos" class="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 ml-4">Buscar Trabajos</button>
        </div>
      </div>
      <div v-if="mostrarBusquedaTrabajos" class="bg-white/60 backdrop-blur-md p-6 rounded-b-xl shadow mb-4">
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Buscar por cliente o ID</label>
          <div class="flex gap-2">
            <input v-model="busquedaTrabajo" placeholder="Nombre de cliente o ID" class="border rounded px-3 py-2 flex-grow" />
            <button @click="filtrarTrabajos" class="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">Buscar</button>
          </div>
        </div>
        <div v-if="trabajosFiltrados.length > 0" class="overflow-x-auto">
          <table class="min-w-full bg-white">
            <thead>
              <tr class="bg-gray-100">
                <th class="px-4 py-2">ID</th>
                <th class="px-4 py-2">Cliente</th>
                <th class="px-4 py-2">Descripción</th>
                <th class="px-4 py-2">Costo Total</th>
                <th class="px-4 py-2">Pagado</th>
                <th class="px-4 py-2">Pendiente</th>
                <th class="px-4 py-2">Estado Pago</th>
                <th class="px-4 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="trabajo in trabajosFiltrados" :key="trabajo.id" class="border-b">
                <td class="px-4 py-2">{{ trabajo.id }}</td>
                <td class="px-4 py-2">{{ trabajo.cliente }}</td>
                <td class="px-4 py-2">{{ trabajo.descripcion }}</td>
                <td class="px-4 py-2">{{ formatCurrency(trabajo.costo_total) }}</td>
                <td class="px-4 py-2">{{ formatCurrency(trabajo.monto_pagado) }}</td>
                <td class="px-4 py-2">{{ formatCurrency(trabajo.saldo_pendiente) }}</td>
                <td class="px-4 py-2">
                  <span :class="estadoPagoClase(trabajo.estado_pago)">{{ trabajo.estado_pago }}</span>
                </td>
                <td class="px-4 py-2">
                  <button @click="seleccionarTrabajo(trabajo)" class="bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700">Seleccionar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="busquedaRealizada" class="text-center py-4 text-gray-500">
          No se encontraron trabajos con esa búsqueda.
        </div>
      </div>
      <div v-if="trabajoSeleccionado" class="bg-white/60 backdrop-blur-md p-6 rounded-xl shadow mb-4">
        <h4 class="font-semibold mb-2">Registrar cobro para trabajo #{{ trabajoSeleccionado.id }}</h4>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p><strong>Cliente:</strong> {{ trabajoSeleccionado.cliente }}</p>
            <p><strong>Descripción:</strong> {{ trabajoSeleccionado.descripcion }}</p>
          </div>
          <div>
            <p><strong>Costo Total:</strong> {{ formatCurrency(trabajoSeleccionado.costo_total) }}</p>
            <p><strong>Pagado:</strong> {{ formatCurrency(trabajoSeleccionado.monto_pagado) }}</p>
            <p><strong>Pendiente:</strong> {{ formatCurrency(trabajoSeleccionado.saldo_pendiente) }}</p>
          </div>
        </div>
        <form @submit.prevent="registrarCobroTrabajo" class="border-t pt-4">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Monto a cobrar</label>
            <input v-model.number="nuevoCobro.monto" type="number" min="0" :max="trabajoSeleccionado.saldo_pendiente" step="0.01" required class="border rounded px-3 py-2 w-full" />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Tipo de pago</label>
            <select v-model="nuevoCobro.metodo_pago" class="border rounded px-3 py-2 w-full">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Observaciones</label>
            <textarea v-model="nuevoCobro.observaciones" class="border rounded px-3 py-2 w-full" rows="2"></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" @click="cancelarSeleccionTrabajo" class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
            <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Registrar Cobro</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Historial de Movimientos -->
    <div class="historial bg-white rounded shadow p-4 mb-4">
      <h3 class="text-lg font-semibold mb-2">{{ vista === 'movimientos' ? 'Movimientos del Día' : 'Cobros Registrados' }}</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gray-100">
              <th class="px-4 py-2 text-left">Hora</th>
              <th class="px-4 py-2 text-left">Tipo</th>
              <th class="px-4 py-2 text-left">{{ vista === 'movimientos' ? 'Concepto' : 'Trabajo ID' }}</th>
              <th class="px-4 py-2 text-left">{{ vista === 'movimientos' ? 'Monto' : 'Cliente' }}</th>
              <th class="px-4 py-2 text-left">Monto</th>
              <th class="px-4 py-2 text-left">{{ vista === 'movimientos' ? 'Descripción' : 'Tipo de Pago' }}</th>
              <th v-if="vista === 'cobros'" class="px-4 py-2 text-left">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mov in vista === 'movimientos' ? movimientosPaginados : cobrosPaginados" :key="mov.id" class="border-b">
              <td class="px-4 py-2">{{ formatDate(mov.fecha_hora || mov.fecha) }}</td>
              <td :class="[mov.tipo_movimiento === 'entrada' || mov.tipo_referencia === 'cobro' ? 'entrada' : 'salida', 'px-4 py-2']">
                {{ mov.tipo_movimiento || mov.tipo_referencia }}
              </td>
              <td class="px-4 py-2">{{ vista === 'movimientos' ? mov.concepto : mov.trabajo_id }}</td>
              <td class="px-4 py-2">{{ vista === 'movimientos' ? formatCurrency(mov.monto) : getNombreCliente(mov) }}</td>
              <td class="px-4 py-2">{{ formatCurrency(mov.monto) }}</td>
              <td class="px-4 py-2">{{ vista === 'movimientos' ? mov.descripcion : (mov.metodo_pago || mov.tipo_pago) }}</td>
              <td v-if="vista === 'cobros'" class="px-4 py-2">{{ mov.observaciones || mov.observacion }}</td>
            </tr>
            <tr v-if="(vista === 'movimientos' && movimientosPaginados.length === 0) || (vista === 'cobros' && cobrosPaginados.length === 0)">
              <td :colspan="vista === 'cobros' ? 7 : 6" class="text-center py-4 text-gray-500">No hay registros para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="(vista === 'movimientos' && totalPaginasMovimientos > 1) || (vista === 'cobros' && totalPaginasCobros > 1)" class="mt-4 flex justify-between items-center">
        <div class="text-sm text-gray-700">
          Mostrando {{ (paginaActual - 1) * itemsPorPagina + 1 }} a {{ Math.min(paginaActual * itemsPorPagina, vista === 'movimientos' ? movimientos.length : cobros.length) }} de {{ vista === 'movimientos' ? movimientos.length : cobros.length }} registros
        </div>
        <div class="flex gap-2">
          <button 
            @click="paginaActual--" 
            :disabled="paginaActual === 1"
            class="px-3 py-1 rounded border"
            :class="paginaActual === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            Anterior
          </button>
          <button 
            v-for="pagina in paginasAMostrar" 
            :key="pagina"
            @click="paginaActual = pagina"
            class="px-3 py-1 rounded border"
            :class="pagina === paginaActual ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            {{ pagina }}
          </button>
          <button 
            @click="paginaActual++" 
            :disabled="paginaActual === (vista === 'movimientos' ? totalPaginasMovimientos : totalPaginasCobros)"
            class="px-3 py-1 rounded border"
            :class="paginaActual === (vista === 'movimientos' ? totalPaginasMovimientos : totalPaginasCobros) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
    <div class="cierre-dia">
      <button @click="mostrarDialogoCierre" :disabled="cerrado" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Cerrar Día</button>
      <span v-if="cerrado" class="cerrado-msg ml-2 text-gray-600">Día cerrado</span>
    </div>

    <!-- Modal de cierre de caja -->
    <div v-if="mostrarModalCierre" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">Cerrar Caja Diaria</h3>
        
        <div class="mb-4">
          <div class="bg-blue-50 p-3 rounded mb-4">
            <p class="text-sm text-blue-800">Al cerrar la caja se generará un resumen de los movimientos del día. Esta acción no se puede deshacer.</p>
          </div>
          
          <div class="grid grid-cols-2 gap-2 mb-4">
            <div>
              <p class="text-sm font-medium">Total Entradas:</p>
              <p class="font-bold">{{ formatCurrency(calcularTotalEntradas()) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium">Total Salidas:</p>
              <p class="font-bold">{{ formatCurrency(calcularTotalSalidas()) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium">Saldo del Día:</p>
              <p class="font-bold">{{ formatCurrency(calcularTotalEntradas() - calcularTotalSalidas()) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium">Saldo Actual:</p>
              <p class="font-bold">{{ formatCurrency(saldo) }}</p>
            </div>
          </div>
          
          <label class="block text-sm font-medium mb-1">Observaciones (opcional)</label>
          <textarea v-model="observacionesCierre" rows="3" class="border rounded px-3 py-2 w-full"></textarea>
        </div>
        
        <div class="flex justify-end gap-2">
          <button @click="cancelarCierre" class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
          <button @click="confirmarCierreDia" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Confirmar Cierre</button>
        </div>
      </div>
    </div>

    <!-- Modal de resumen de cierre -->
    <div v-if="mostrarResumenCierre" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">Resumen de Cierre de Caja</h3>
        
        <div class="mb-4">
          <p><strong>Fecha:</strong> {{ formatFechaCompleta(resumenCierre.fecha) }}</p>
          <p><strong>Total Entradas:</strong> {{ formatCurrency(resumenCierre.total_entradas) }}</p>
          <p><strong>Total Salidas:</strong> {{ formatCurrency(resumenCierre.total_salidas) }}</p>
          <p><strong>Saldo Final del Día:</strong> {{ formatCurrency(resumenCierre.saldo_final) }}</p>
          <p><strong>Saldo Actual en Caja:</strong> {{ formatCurrency(resumenCierre.saldo_actual) }}</p>
        </div>
        
        <div class="flex justify-end">
          <button @click="cerrarResumen" class="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">Aceptar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getMovimientosDiarios, getSaldoActual, registrarMovimiento, cerrarCaja, getCobrosDiarios, registrarCobroTrabajo, verificarCierreDiario } from '../../services/cajaService';
import { buscarTrabajosPorCobrar } from '../../services/cajaService';
import { createCobro } from '../../services/cobroService';
import { crearGasto } from '../../services/gastosService';
import { formatTimeHHMM, formatDateDDMMHHMM } from '../../utils/dateUtils';

export default {
  name: 'CajaDiaria',
  data() {
    return {
      vista: 'movimientos',
      saldo: 0,
      movimientos: [],
      cobros: [],
      nuevoIngreso: {
        concepto: '',
        monto: null,
        descripcion: '',
        forma_pago: 'efectivo'
      },
      nuevoEgreso: {
        concepto: '',
        monto: null,
        descripcion: '',
        forma_pago: 'efectivo'
      },
      cerrado: false,
      // Datos para la sección de cobros de trabajos
      mostrarBusquedaTrabajos: false,
      busquedaTrabajo: '',
      busquedaRealizada: false,
      trabajosFiltrados: [],
      trabajoSeleccionado: null,
      nuevoCobro: {
        monto: null,
        metodo_pago: 'efectivo',
        observaciones: ''
      },
      cargando: false,
      error: null,
      mensaje: null,
      // Datos para el cierre de caja
      mostrarModalCierre: false,
      observacionesCierre: '',
      mostrarResumenCierre: false,
      resumenCierre: {},
      paginaActual: 1,
      itemsPorPagina: 10,
    }
  },
  computed: {
    totalPaginasMovimientos() {
      return Math.ceil(this.movimientos.length / this.itemsPorPagina);
    },
    totalPaginasCobros() {
      return Math.ceil(this.cobros.length / this.itemsPorPagina);
    },
    movimientosPaginados() {
      const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
      const fin = inicio + this.itemsPorPagina;
      return this.movimientos.slice(inicio, fin);
    },
    cobrosPaginados() {
      const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
      const fin = inicio + this.itemsPorPagina;
      return this.cobros.slice(inicio, fin);
    },
    paginasAMostrar() {
      const total = this.vista === 'movimientos' ? this.totalPaginasMovimientos : this.totalPaginasCobros;
      const actual = this.paginaActual;
      const paginas = [];
      
      // Siempre mostrar primera página
      paginas.push(1);
      
      // Calcular páginas alrededor de la actual
      for (let i = Math.max(2, actual - 1); i <= Math.min(total - 1, actual + 1); i++) {
        paginas.push(i);
      }
      
      // Siempre mostrar última página si hay más de una
      if (total > 1) {
        paginas.push(total);
      }
      
      // Eliminar duplicados y ordenar
      return [...new Set(paginas)].sort((a, b) => a - b);
    }
  },
  watch: {
    vista() {
      // Resetear a la primera página cuando cambia la vista
      this.paginaActual = 1;
    },
    movimientos() {
      // Resetear a la primera página cuando cambian los movimientos
      if (this.vista === 'movimientos') {
        this.paginaActual = 1;
      }
    },
    cobros() {
      // Resetear a la primera página cuando cambian los cobros
      if (this.vista === 'cobros') {
        this.paginaActual = 1;
      }
    }
  },
  mounted() {
    // Cargar datos iniciales
    this.cargarDatos();
  },
  methods: {
    async cargarDatos() {
      try {
        this.cargando = true;
        this.error = null;
        this.mensaje = null;
        
        // Verificar si ya existe un cierre para el día actual
        const verificacion = await verificarCierreDiario();
        
        // Si hay un cierre existente, verificar si es de hoy
        if (verificacion.existeCierre) {
          const fechaCierre = new Date(verificacion.cierre.fecha);
          const hoy = new Date();
          
          // Si el cierre es de hoy, mantener el estado cerrado
          if (fechaCierre.toDateString() === hoy.toDateString()) {
            this.cerrado = true;
            this.saldo = 0;
            this.movimientos = [];
            this.cobros = [];
            this.mensaje = `La caja ya fue cerrada hoy. ID de cierre: ${verificacion.cierre.id}`;
            return;
          } else {
            // Si el cierre es de otro día, reiniciar el estado
            this.cerrado = false;
            this.movimientos = [];
            this.cobros = [];
          }
        } else {
          // Si no hay cierre, reiniciar el estado
          this.cerrado = false;
        }
        
        // Cargar saldo actual
        const dataSaldo = await getSaldoActual();
        this.saldo = parseFloat(dataSaldo.saldo) || 0;
        
        // Cargar movimientos diarios
        const dataMovimientos = await getMovimientosDiarios();
        if (dataMovimientos && Array.isArray(dataMovimientos.movimientos)) {
          // Ordenar movimientos por fecha (más recientes primero)
          this.movimientos = dataMovimientos.movimientos.sort((a, b) => {
            const fechaA = new Date(a.fecha_hora || a.fecha);
            const fechaB = new Date(b.fecha_hora || b.fecha);
            return fechaB - fechaA;
          });
        } else {
          this.movimientos = [];
        }
        
        // Cargar cobros diarios
        const dataCobros = await getCobrosDiarios();
        this.cobros = dataCobros.cobros || [];
        
      } catch (error) {
        console.error("Error al cargar datos:", error);
        this.error = "Error al cargar datos. Intente nuevamente.";
      } finally {
        this.cargando = false;
      }
    },
    async registrarMovimiento(tipo) {
      try {
        this.cargando = true;
        const movimiento = tipo === 'entrada' ? this.nuevoIngreso : this.nuevoEgreso;
        
        if (tipo === 'entrada') {
          // Preparar datos para ingreso
          const datos = {
            tipo_movimiento: tipo,
            concepto: movimiento.concepto,
            monto: movimiento.monto,
            descripcion: movimiento.descripcion,
            forma_pago: movimiento.forma_pago
          };
          
          // Llamar al servicio de caja para ingresos
          const response = await registrarMovimiento(datos);
          
          if (response && response.movimiento) {
            this.movimientos.unshift(response.movimiento);
            this.saldo = parseFloat(response.movimiento.saldo_resultante) || 0;
            this.mostrarMensajeExito("Ingreso registrado exitosamente");
          }
        } else {
          // Preparar datos para gasto
          const datosGasto = {
            fecha: new Date().toISOString().split('T')[0],
            monto: movimiento.monto,
            descripcion: movimiento.descripcion,
            categoria: movimiento.concepto,
            forma_pago: movimiento.forma_pago
          };
          
          // Llamar al servicio de gastos para egresos
          const response = await crearGasto(datosGasto);
          
          if (response && response.data && response.data.movimiento) {
            // Actualizar la vista con el movimiento de caja
            this.movimientos.unshift(response.data.movimiento);
            this.saldo = parseFloat(response.data.movimiento.saldo_resultante) || 0;
            this.mostrarMensajeExito("Gasto registrado exitosamente");
          }
        }
        
        // Limpiar formulario
        if (tipo === 'entrada') {
          this.nuevoIngreso = { concepto: '', monto: null, descripcion: '', forma_pago: 'efectivo' };
        } else {
          this.nuevoEgreso = { concepto: '', monto: null, descripcion: '', forma_pago: 'efectivo' };
        }
        
      } catch (error) {
        console.error("Error al registrar movimiento:", error);
        this.error = error.response?.data?.message || "Error al registrar movimiento.";
      } finally {
        this.cargando = false;
      }
    },
    async cerrarDia() {
      this.mostrarDialogoCierre();
    },
    formatCurrency(value) {
      if (typeof value !== 'number') {
        value = parseFloat(value);
        if (isNaN(value)) return '-';
      }
      return '$' + value.toFixed(2);
    },
    formatDate(date) {
      if (!date) return '-';
      try {
        // Si la fecha es un string en formato "DD/MM/YYYY, HH:mm:ss"
        if (typeof date === 'string' && date.includes('/')) {
          const [datePart, timePart] = date.split(', ');
          const [day, month, year] = datePart.split('/');
          const [hours, minutes] = timePart.split(':');
          const dateObj = new Date(year, month - 1, day, hours, minutes);
          return formatTimeHHMM(dateObj);
        }
        
        // Para otros formatos, usar la utilidad directamente
        return formatTimeHHMM(date);
      } catch (error) {
        console.error('Error al formatear fecha:', error, 'Fecha recibida:', date);
        return '-';
      }
    },
    // Métodos para la sección de cobros de trabajos
    buscarTrabajos() {
      this.mostrarBusquedaTrabajos = !this.mostrarBusquedaTrabajos;
      if (!this.mostrarBusquedaTrabajos) {
        this.busquedaTrabajo = '';
        this.trabajosFiltrados = [];
        this.busquedaRealizada = false;
      }
    },
    async filtrarTrabajos() {
      try {
        this.cargando = true;
        this.busquedaRealizada = true;
        this.error = null; // Limpiar error anterior
        
        // Validación del término de búsqueda
        const terminoLimpio = this.busquedaTrabajo.trim();
        
        const response = await buscarTrabajosPorCobrar(terminoLimpio);
        
        // Si hay un error en la respuesta del servicio
        if (response.error) {
          this.error = response.mensaje || "Error al buscar trabajos";
          this.trabajosFiltrados = [];
          return;
        }
        
        let trabajos = response.trabajos || [];
        
        // Si el término parece ser un nombre de cliente, filtrar por cliente en el frontend
        if (terminoLimpio && isNaN(terminoLimpio)) {
          // Obtener todos los trabajos y filtrar por cliente
          const allResponse = await buscarTrabajosPorCobrar("");
          let todosTrabajos = allResponse.trabajos || [];
          
          // Filtrar por descripción o ID de cliente
          const terminoLower = terminoLimpio.toLowerCase();
          const trabajosCliente = todosTrabajos.filter(trabajo => {
            const descripcion = trabajo.descripcion?.toLowerCase() || '';
            const cliente = trabajo.cliente?.toLowerCase() || '';
            return descripcion.includes(terminoLower) || cliente.includes(terminoLower);
          });
          
          // Combinar resultados sin duplicados
          if (trabajosCliente.length > 0) {
            const idsExistentes = new Set(trabajos.map(t => t.id));
            for (const t of trabajosCliente) {
              if (!idsExistentes.has(t.id)) {
                trabajos.push(t);
              }
            }
          }
        }
        
        this.trabajosFiltrados = trabajos;
        
        // Mostrar mensaje si no hay resultados
        if (this.trabajosFiltrados.length === 0) {
          this.error = terminoLimpio 
            ? `No se encontraron trabajos con "${terminoLimpio}"`
            : "No hay trabajos pendientes de cobro";
        }
      } catch (error) {
        console.error("Error inesperado al filtrar trabajos:", error);
        this.error = "Error al buscar trabajos. Intente nuevamente.";
        this.trabajosFiltrados = [];
      } finally {
        this.cargando = false;
      }
    },
    seleccionarTrabajo(trabajo) {
      this.trabajoSeleccionado = trabajo;
      this.nuevoCobro = {
        monto: trabajo.saldo_pendiente,
        metodo_pago: 'efectivo',
        observaciones: ''
      };
    },
    cancelarSeleccionTrabajo() {
      this.trabajoSeleccionado = null;
      this.nuevoCobro = {
        monto: null,
        metodo_pago: 'efectivo',
        observaciones: ''
      };
    },
    async registrarCobroTrabajo() {
      try {
        this.cargando = true;
        this.error = null;
        this.mensaje = null;
        
        // Validaciones básicas
        if (!this.trabajoSeleccionado) {
          this.error = 'No hay trabajo seleccionado';
          return;
        }
        
        if (!this.nuevoCobro.monto) {
          this.error = 'El monto es obligatorio';
          return;
        }
        
        const monto = parseFloat(this.nuevoCobro.monto);
        
        if (isNaN(monto) || monto <= 0) {
          this.error = 'El monto debe ser un número positivo';
          return;
        }
        
        // Validar que el monto no exceda el saldo pendiente
        const saldoPendiente = parseFloat(this.trabajoSeleccionado.saldo_pendiente);
        if (monto > saldoPendiente) {
          this.error = `El monto (${monto}) no puede exceder el saldo pendiente (${saldoPendiente})`;
          return;
        }
        
        // Preparar datos para enviar al backend
        const datos = {
          trabajo_id: this.trabajoSeleccionado.id,
          monto: monto,
          tipo_pago: this.nuevoCobro.metodo_pago || 'efectivo',
          observacion: this.nuevoCobro.observaciones
        };
        
        // Llamar al servicio
        const response = await createCobro(datos);
        
        if (response) {
          // Actualizar datos inmediatamente
          await this.cargarDatos();
          
          // Cerrar el formulario
          this.cancelarSeleccionTrabajo();
          
          // Mostrar mensaje de éxito
          this.mostrarMensajeExito("Cobro registrado exitosamente");
        }
      } catch (error) {
        console.error("Error al registrar cobro:", error);
        this.error = error.message || "Error al registrar cobro. Intente nuevamente.";
      } finally {
        this.cargando = false;
      }
    },
    mostrarMensajeExito(texto) {
      this.mensaje = texto;
      this.error = null;
      
      // Ocultar el mensaje después de 3 segundos
      setTimeout(() => {
        if (this.mensaje === texto) {
          this.mensaje = null;
        }
      }, 3000);
    },
    estadoPagoClase(estadoPago) {
      switch (estadoPago) {
        case 'Pendiente': return 'bg-red-100 text-red-800 px-2 py-1 rounded';
        case 'Parcial': return 'bg-orange-100 text-orange-800 px-2 py-1 rounded';
        case 'Pagado': return 'bg-green-100 text-green-800 px-2 py-1 rounded';
        default: return '';
      }
    },
    getNombreCliente(movimiento) {
      if (!movimiento) return '-';
      
      // Si el cobro incluye información del cliente directamente
      if (movimiento.cliente) {
        const cliente = movimiento.cliente;
        return `${cliente.nombre} ${cliente.apellido || ''}`.trim();
      }
      
      // Si solo tenemos el cliente_id, intentar encontrarlo por el trabajo
      if (movimiento.trabajo && movimiento.trabajo.cliente) {
        const cliente = movimiento.trabajo.cliente;
        return `${cliente.nombre} ${cliente.apellido || ''}`.trim();
      }
      
      // Si tenemos solo el cliente_id pero no se cargó la relación
      if (movimiento.cliente_id) {
        return `Cliente #${movimiento.cliente_id}`;
      }
      
      // Si tenemos solo el trabajo_id, mostrar esa referencia
      if (movimiento.trabajo_id) {
        return `Trabajo #${movimiento.trabajo_id}`;
      }
      
      // Si no tenemos información del cliente
      return 'No definido';
    },
    mostrarDialogoCierre() {
      this.mostrarModalCierre = true;
      this.observacionesCierre = '';
    },
    
    cancelarCierre() {
      this.mostrarModalCierre = false;
      this.observacionesCierre = '';
    },
    
    async confirmarCierreDia() {
      try {
        // Verificar nuevamente si ya existe un cierre para el día actual
        const verificacion = await verificarCierreDiario();
        if (verificacion.existeCierre) {
          this.mostrarModalCierre = false;
          this.cerrado = true;
          this.error = "Ya existe un cierre de caja para el día de hoy";
          return;
        }
        
        this.cargando = true;
        this.mostrarModalCierre = false;
        
        // Preparar datos para enviar al backend
        const datos = {
          observaciones: this.observacionesCierre.trim() || 'Cierre de caja diario'
        };
        
        // Llamar al servicio
        const response = await cerrarCaja(datos);
        
        // Mostrar resumen del cierre
        this.resumenCierre = response;
        this.mostrarResumenCierre = true;
        
        // Actualizar estado
        this.cerrado = true;
        this.mensaje = "Caja cerrada correctamente";
        
        // Limpiar datos
        this.saldo = 0;
        this.movimientos = [];
        this.cobros = [];
        
      } catch (error) {
        console.error("Error al cerrar día:", error);
        
        // Manejar el caso específico de que ya exista un cierre
        if (error.response && error.response.status === 400) {
          this.error = error.response.data.message || "Error al cerrar día";
          this.cerrado = true; // Marcar como cerrado aunque haya fallado por esta razón
        } else {
          this.error = error.response?.data?.message || "Error al cerrar día. Intente nuevamente.";
        }
      } finally {
        this.cargando = false;
      }
    },
    
    cerrarResumen() {
      this.mostrarResumenCierre = false;
    },
    
    formatFechaCompleta(fecha) {
      if (!fecha) return '-';
      try {
        return formatDateDDMMHHMM(fecha);
      } catch (error) {
        console.error('Error al formatear fecha completa:', error);
        return '-';
      }
    },
    calcularTotalEntradas() {
      return this.movimientos
        .filter(mov => mov.tipo_movimiento === 'entrada')
        .reduce((total, mov) => {
          const monto = typeof mov.monto === 'string' ? parseFloat(mov.monto) : mov.monto;
          return total + (isNaN(monto) ? 0 : monto);
        }, 0);
    },
    calcularTotalSalidas() {
      return this.movimientos
        .filter(mov => mov.tipo_movimiento === 'salida')
        .reduce((total, mov) => {
          const monto = typeof mov.monto === 'string' ? parseFloat(mov.monto) : mov.monto;
          return total + (isNaN(monto) ? 0 : monto);
        }, 0);
    },
    async verificarCierreDiario() {
      try {
        const response = await verificarCierreDiario();
        const fechaCierre = response.cierre ? new Date(response.cierre.fecha) : null;
        const hoy = new Date();
        
        // Solo considerar cerrado si el cierre es de hoy
        this.cerrado = response.existeCierre && fechaCierre && 
                      fechaCierre.toDateString() === hoy.toDateString();
        
        if (this.cerrado) {
          this.mensaje = `La caja ya fue cerrada hoy. ID de cierre: ${response.cierre.id}`;
        }
      } catch (error) {
        console.error("Error al verificar cierre diario:", error);
      }
    }
  }
}
</script>

<style scoped>
.caja-diaria {
  max-width: 1200px;
  margin: 0 auto;
  min-height: 80vh;
}

.saldo-actual {
  font-size: 1.2rem;
}

.acciones {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-ingreso h3, .form-egreso h3 {
  margin-top: 0;
}

.entrada {
  color: green;
}

.salida {
  color: red;
}

.cierre-dia {
  text-align: right;
  margin-top: 1rem;
}

.cerrado-msg {
  color: #888;
  margin-left: 1rem;
}

/* Estilos para la sección de cobros */
.cobros-trabajos {
  margin-bottom: 1.5rem;
}
</style>