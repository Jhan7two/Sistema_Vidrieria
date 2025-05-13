<template>
  <div class="caja-diaria p-6">
    <h2 class="text-2xl font-bold mb-4">Caja Diaria</h2>
    <div class="saldo-actual bg-white p-4 rounded shadow mb-4">
      <strong>Saldo actual:</strong> {{ formatCurrency(saldo) }}
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
            <label class="block text-sm font-medium mb-1">Método de pago</label>
            <select v-model="nuevoCobro.metodo_pago" class="border rounded px-3 py-2 w-full">
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Otro">Otro</option>
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
              <td class="px-4 py-2">{{ mov.hora }}</td>
              <td :class="[mov.tipo === 'entrada' || mov.tipo === 'cobro' ? 'entrada' : 'salida', 'px-4 py-2']">{{ mov.tipo === 'cobro' ? 'Cobro' : mov.tipo }}</td>
              <td class="px-4 py-2">{{ vista === 'movimientos' ? mov.concepto : mov.trabajo_id }}</td>
              <td class="px-4 py-2">{{ formatCurrency(mov.monto) }}</td>
              <td class="px-4 py-2">{{ vista === 'movimientos' ? mov.descripcion : mov.metodo_pago }}</td>
              <td v-if="vista === 'cobros'" class="px-4 py-2">{{ mov.observaciones }}</td>
            </tr>
            <tr v-if="(vista === 'movimientos' && movimientos.length === 0) || (vista === 'cobros' && cobros.length === 0)">
              <td :colspan="vista === 'cobros' ? 6 : 5" class="text-center py-4 text-gray-500">No hay registros para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="cierre-dia">
      <button @click="cerrarDia" :disabled="cerrado">Cerrar Día</button>
      <span v-if="cerrado" class="cerrado-msg">Día cerrado</span>
    </div>
  </div>
</template>

<script>
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
        descripcion: ''
      },
      nuevoEgreso: {
        concepto: '',
        monto: null,
        descripcion: ''
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
        metodo_pago: 'Efectivo',
        observaciones: ''
      },
      // Datos de ejemplo para trabajos
      trabajos: [
        { id: 1, cliente: 'Vidrios S.A.', descripcion: 'Instalación de ventanas', costo_total: 1200, monto_pagado: 400, saldo_pendiente: 800, estado_pago: 'Parcial' },
        { id: 2, cliente: 'Cristales SRL', descripcion: 'Corte de vidrios', costo_total: 900, monto_pagado: 300, saldo_pendiente: 600, estado_pago: 'Parcial' },
        { id: 3, cliente: 'Pulidos y Más', descripcion: 'Pulido de superficies', costo_total: 1500, monto_pagado: 1500, saldo_pendiente: 0, estado_pago: 'Pagado' },
        { id: 4, cliente: 'Alfa Glass', descripcion: 'Instalación de espejos', costo_total: 800, monto_pagado: 200, saldo_pendiente: 600, estado_pago: 'Parcial' }
      ]
    }
  },
  mounted() {
    // Cargar datos iniciales
    this.cargarDatos();
  },
  methods: {
    cargarDatos() {
      // Aquí se cargarían los datos desde la API
      // Por ahora usamos datos de ejemplo
    },
    registrarMovimiento(tipo) {
      let movimiento = {};
      if (tipo === 'entrada') {
        movimiento = {
          id: Date.now(),
          hora: new Date().toLocaleTimeString(),
          tipo: 'entrada',
          concepto: this.nuevoIngreso.concepto,
          monto: this.nuevoIngreso.monto,
          descripcion: this.nuevoIngreso.descripcion
        };
        this.saldo += this.nuevoIngreso.monto;
        this.nuevoIngreso = { concepto: '', monto: null, descripcion: '' };
      } else {
        movimiento = {
          id: Date.now(),
          hora: new Date().toLocaleTimeString(),
          tipo: 'salida',
          concepto: this.nuevoEgreso.concepto,
          monto: this.nuevoEgreso.monto,
          descripcion: this.nuevoEgreso.descripcion
        };
        this.saldo -= this.nuevoEgreso.monto;
        this.nuevoEgreso = { concepto: '', monto: null, descripcion: '' };
      }
      this.movimientos.push(movimiento);
      
      // En una implementación real, aquí se enviaría el movimiento a la API
    },
    cerrarDia() {
      this.cerrado = true;
      // En una implementación real, aquí se enviaría la solicitud de cierre a la API
    },
    formatCurrency(value) {
      if (typeof value !== 'number') {
        return value || '-';
      }
      return '$' + value.toFixed(2);
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
    filtrarTrabajos() {
      const busqueda = this.busquedaTrabajo.toLowerCase();
      this.trabajosFiltrados = this.trabajos.filter(t => {
        return t.cliente.toLowerCase().includes(busqueda) || 
               t.id.toString().includes(busqueda);
      });
      this.busquedaRealizada = true;
      
      // En una implementación real, aquí se haría una solicitud a la API
    },
    seleccionarTrabajo(trabajo) {
      this.trabajoSeleccionado = trabajo;
      this.nuevoCobro = {
        monto: trabajo.saldo_pendiente,
        metodo_pago: 'Efectivo',
        observaciones: ''
      };
    },
    cancelarSeleccionTrabajo() {
      this.trabajoSeleccionado = null;
      this.nuevoCobro = {
        monto: null,
        metodo_pago: 'Efectivo',
        observaciones: ''
      };
    },
    registrarCobroTrabajo() {
      // Validar que el monto no exceda el saldo pendiente
      if (this.nuevoCobro.monto > this.trabajoSeleccionado.saldo_pendiente) {
        alert('El monto no puede exceder el saldo pendiente');
        return;
      }
      
      // Crear el registro de cobro
      const cobro = {
        id: Date.now(),
        hora: new Date().toLocaleTimeString(),
        tipo: 'cobro',
        trabajo_id: this.trabajoSeleccionado.id,
        monto: this.nuevoCobro.monto,
        metodo_pago: this.nuevoCobro.metodo_pago,
        observaciones: this.nuevoCobro.observaciones
      };
      
      // Actualizar el saldo de caja
      this.saldo += this.nuevoCobro.monto;
      
      // Actualizar el trabajo
      const trabajo = this.trabajos.find(t => t.id === this.trabajoSeleccionado.id);
      if (trabajo) {
        trabajo.monto_pagado += this.nuevoCobro.monto;
        trabajo.saldo_pendiente -= this.nuevoCobro.monto;
        
        // Actualizar el estado de pago
        if (trabajo.saldo_pendiente <= 0) {
          trabajo.estado_pago = 'Pagado';
        } else if (trabajo.monto_pagado > 0) {
          trabajo.estado_pago = 'Parcial';
        }
      }
      
      // Agregar el cobro a la lista
      this.cobros.push(cobro);
      
      // Limpiar el formulario
      this.trabajoSeleccionado = null;
      this.nuevoCobro = {
        monto: null,
        metodo_pago: 'Efectivo',
        observaciones: ''
      };
      
      // En una implementación real, aquí se enviaría el cobro a la API
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