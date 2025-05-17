<template>
  <div class="caja-diaria p-6">
    <h2 class="text-2xl font-bold mb-4">Caja Diaria</h2>
    
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
      <div class="form-ingreso">
        <h3 class="text-lg font-semibold mb-2">Registrar Ingreso</h3>
        <form @submit.prevent="registrarMovimiento('entrada')" class="bg-white p-4 rounded shadow">
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
      <div class="form-egreso">
        <h3 class="text-lg font-semibold mb-2">Registrar Egreso</h3>
        <form @submit.prevent="registrarMovimiento('salida')" class="bg-white p-4 rounded shadow">
          <div class="mb-2">
            <input v-model="nuevoEgreso.concepto" placeholder="Concepto" required class="border rounded px-3 py-2 w-full mb-2" />
            <input v-model.number="nuevoEgreso.monto" type="number" min="0" step="0.01" placeholder="Monto" required class="border rounded px-3 py-2 w-full mb-2" />
            <input v-model="nuevoEgreso.descripcion" placeholder="Descripción" class="border rounded px-3 py-2 w-full mb-2" />
          </div>
          <button type="submit" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full">Registrar Egreso</button>
        </form>
      </div>
    </div>
    
    <!-- Sección de Cobros de Trabajos -->
    <div v-if="vista === 'cobros'" class="cobros-trabajos mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Registrar Cobro de Trabajo</h3>
        <button @click="buscarTrabajos" class="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">Buscar Trabajos</button>
      </div>
      
      <div v-if="mostrarBusquedaTrabajos" class="bg-white p-4 rounded shadow mb-4">
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
      
      <div v-if="trabajoSeleccionado" class="bg-white p-4 rounded shadow mb-4">
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
              <th class="px-4 py-2 text-left">Monto</th>
              <th class="px-4 py-2 text-left">{{ vista === 'movimientos' ? 'Descripción' : 'Método de Pago' }}</th>
              <th v-if="vista === 'cobros'" class="px-4 py-2 text-left">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mov in vista === 'movimientos' ? movimientos : cobros" :key="mov.id" class="border-b">
              <td class="px-4 py-2">{{ formatDate(mov.fecha_hora || mov.fecha) }}</td>
              <td :class="[mov.tipo_movimiento === 'entrada' || mov.tipo_referencia === 'cobro' ? 'entrada' : 'salida', 'px-4 py-2']">
                {{ mov.tipo_movimiento || mov.tipo_referencia }}
              </td>
              <td class="px-4 py-2">{{ vista === 'movimientos' ? mov.concepto : mov.trabajo_id }}</td>
              <td class="px-4 py-2">{{ formatCurrency(mov.monto) }}</td>
              <td class="px-4 py-2">{{ vista === 'movimientos' ? mov.descripcion : (mov.metodo_pago || mov.tipo_pago) }}</td>
              <td v-if="vista === 'cobros'" class="px-4 py-2">{{ mov.observaciones || mov.observacion }}</td>
            </tr>
            <tr v-if="(vista === 'movimientos' && movimientos.length === 0) || (vista === 'cobros' && cobros.length === 0)">
              <td :colspan="vista === 'cobros' ? 6 : 5" class="text-center py-4 text-gray-500">No hay registros para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="cierre-dia">
      <button @click="cerrarDia" :disabled="cerrado" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Cerrar Día</button>
      <span v-if="cerrado" class="cerrado-msg">Día cerrado</span>
    </div>
  </div>
</template>

<script>
import { getMovimientosDiarios, getSaldoActual, registrarMovimiento, cerrarCaja, getCobrosDiarios, registrarCobroTrabajo } from '../../services/cajaService';
import { buscarTrabajosPorCobrar } from '../../services/cajaService';
import { createCobro } from '../../services/cobroService';
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
      mensaje: null
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
        // Cargar saldo actual
        const dataSaldo = await getSaldoActual();
        this.saldo = dataSaldo.saldo;
        
        // Cargar movimientos diarios
        const dataMovimientos = await getMovimientosDiarios();
        this.movimientos = dataMovimientos.movimientos || [];
        
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
        
        // Preparar datos para enviar al backend
        const datos = {
          tipo_movimiento: tipo,
          concepto: movimiento.concepto,
          monto: movimiento.monto,
          descripcion: movimiento.descripcion,
          forma_pago: movimiento.forma_pago
        };
        
        // Llamar al servicio
        const response = await registrarMovimiento(datos);
        
        // Actualizar la vista
        if (response && response.movimiento) {
          this.movimientos.unshift(response.movimiento);
          this.saldo = response.saldo;
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
      try {
        this.cargando = true;
        await cerrarCaja();
        this.cerrado = true;
      } catch (error) {
        console.error("Error al cerrar día:", error);
        this.error = "Error al cerrar día. Intente nuevamente.";
      } finally {
        this.cargando = false;
      }
    },
    formatCurrency(value) {
      if (typeof value !== 'number') {
        return value || '-';
      }
      return '$' + value.toFixed(2);
    },
    formatDate(date) {
      if (!date) return '-';
      const d = new Date(date);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          observacion: this.nuevoCobro.observaciones // Usar "observacion" para que coincida con el backend
        };
        
        console.log("Enviando datos para registrar cobro:", datos);
        
        // Llamar al servicio
        const response = await createCobro(datos);
        
        console.log("Cobro registrado exitosamente:", response);
        
        // Actualizar la vista
        if (response) {
          // Recargar datos
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