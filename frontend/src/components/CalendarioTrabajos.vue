<template>
    <div class="p-6 bg-gray-50 min-h-screen">
     
      
      <!-- Filtros simplificados para el calendario -->
      <div class="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select class="w-full border rounded-md px-3 py-2">
              <option value="">Todos los clientes</option>
              <option value="1">Juan Pérez</option>
              <option value="2">María López</option>
              <option value="3">Carlos Rodríguez</option>
              <option value="4">Ana Martínez</option>
              <option value="5">Roberto Gómez</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Trabajo</label>
            <select class="w-full border rounded-md px-3 py-2">
              <option value="">Todos los tipos</option>
              <option value="instalacion">Instalación</option>
              <option value="corte">Corte</option>
              <option value="pulido">Pulido</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select class="w-full border rounded-md px-3 py-2">
              <option value="">Todos los estados</option>
              <option value="programado">Programado</option>
              <option value="en_progreso">En Progreso</option>
              <option value="en_espera">En Espera</option>
              <option value="completado">Completado</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Cabecera del Calendario -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div class="flex justify-between items-center p-4 border-b">
          <button 
            @click="changeMonth(-1)"
            class="p-1 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          <h2 class="text-xl font-medium text-gray-800">
            {{ formatMonthYear(currentMonth) }}
          </h2>
          
          <button 
            @click="changeMonth(1)"
            class="p-1 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        
        <!-- Días de la semana -->
        <div class="grid grid-cols-7 bg-gray-100">
          <div v-for="(day, index) in diasSemana" :key="index" class="py-2 text-center text-sm font-medium text-gray-600">
            {{ day }}
          </div>
        </div>
        
        <!-- Días del mes -->
        <div class="grid grid-cols-7">
          <template v-for="(celda, idx) in celdasCalendario" :key="idx">
            <!-- Celda vacía (antes del primer día o después del último día del mes) -->
            <div v-if="!celda.dia" class="border border-gray-200 p-2 h-32 bg-gray-50"></div>
            
            <!-- Celda con día -->
            <div v-else class="border border-gray-200 p-2 h-32 relative">
              <div class="font-medium text-gray-700 mb-1">{{ celda.dia }}</div>
              <div v-if="celda.trabajos.length > 0" class="space-y-1">
                <div 
                  v-for="trabajo in celda.trabajos.slice(0, 3)" 
                  :key="trabajo.id"
                  :class="['text-xs p-1 rounded truncate cursor-pointer', getEstadoClass(trabajo.estado)]"
                  @click="abrirModalTrabajo(trabajo)"
                >
                  {{ trabajo.hora }} - {{ trabajo.cliente }} ({{ trabajo.tipo }})
                </div>
                <div 
                  v-if="celda.trabajos.length > 3" 
                  class="text-xs text-gray-500 font-medium cursor-pointer"
                  @click="abrirModalListaTrabajos(celda.trabajos)"
                >
                  + {{ celda.trabajos.length - 3 }} más
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
  
      <!-- Resumen Financiero -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div class="p-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-800">Resumen Financiero del Mes</h3>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm text-blue-600 font-medium">Total Trabajos</div>
            <div class="text-2xl font-semibold mt-1">{{ resumen.totalTrabajos }}</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-sm text-green-600 font-medium">Ingresos Totales</div>
            <div class="text-2xl font-semibold mt-1">{{ formatCurrency(resumen.ingresosTotales) }}</div>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg">
            <div class="text-sm text-yellow-600 font-medium">Adelantos Recibidos</div>
            <div class="text-2xl font-semibold mt-1">{{ formatCurrency(resumen.adelantos) }}</div>
          </div>
          <div class="bg-red-50 p-4 rounded-lg">
            <div class="text-sm text-red-600 font-medium">Saldos Pendientes</div>
            <div class="text-2xl font-semibold mt-1">{{ formatCurrency(resumen.saldosPendientes) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Modal de Detalles del Trabajo -->
      <div v-if="modalTrabajo.visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div class="bg-white rounded-lg p-6 w-full max-w-lg">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-medium text-gray-900">Detalles del Trabajo</h3>
            <button 
              @click="cerrarModalTrabajo" 
              class="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="modalTrabajo.trabajo">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p class="text-sm text-gray-500">ID Trabajo</p>
                <p class="font-medium">{{ modalTrabajo.trabajo.id }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Estado</p>
                <span :class="['px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full', getEstadoClass(modalTrabajo.trabajo.estado)]">
                  {{ modalTrabajo.trabajo.estado }}
                </span>
              </div>
              <div>
                <p class="text-sm text-gray-500">Cliente</p>
                <p class="font-medium">{{ modalTrabajo.trabajo.cliente }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Tipo</p>
                <p class="font-medium">{{ modalTrabajo.trabajo.tipo }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Fecha Programada</p>
                <p class="font-medium">{{ formatDate(modalTrabajo.trabajo.fechaProgramada) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Hora</p>
                <p class="font-medium">{{ modalTrabajo.trabajo.hora }} ({{ modalTrabajo.trabajo.duracion }} horas)</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Dirección</p>
                <p class="font-medium">{{ modalTrabajo.trabajo.direccion }}</p>
              </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 class="font-medium text-gray-800 mb-2">Información Financiera</h4>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Monto Total</p>
                  <p class="font-medium text-gray-800">{{ formatCurrency(modalTrabajo.trabajo.montoTotal) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Adelanto</p>
                  <p class="font-medium text-green-600">{{ formatCurrency(modalTrabajo.trabajo.adelanto) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Saldo Pendiente</p>
                  <p class="font-medium text-red-600">{{ formatCurrency(modalTrabajo.trabajo.saldoPendiente) }}</p>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-4">
              <button class="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                Editar
              </button>
              <button class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                Cambiar Estado
              </button>
              <button v-if="modalTrabajo.trabajo.estado === 'Completado' || modalTrabajo.trabajo.estado === 'Entregado'" class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                Comprobante
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Modal lista de trabajos (más de 3 en un día) -->
      <div v-if="modalListaTrabajos.visible" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 w-96 relative">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-lg font-bold">Trabajos del día</h2>
            <button 
              @click="cerrarModalListaTrabajos" 
              class="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div v-for="trabajo in modalListaTrabajos.trabajos" :key="trabajo.id" class="mb-2 p-2 border-b cursor-pointer hover:bg-gray-100" @click="abrirModalTrabajo(trabajo)">
            <div class="flex justify-between items-center">
              <span>{{ trabajo.cliente }} - {{ formatCurrency(trabajo.montoTotal) }}</span>
              <span :class="getEstadoClass(trabajo.estado)">{{ trabajo.estado }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  
  // Propiedades
  const props = defineProps({
    trabajos: {
      type: Array,
      default: () => []
    },
    mesInicial: {
      type: Number,
      default: () => new Date().getMonth()
    },
    anioInicial: {
      type: Number,
      default: () => new Date().getFullYear()
    }
  });
  
  // Emits
  const emit = defineEmits(['update:mes', 'update:anio']);
  
  // Estados
  const currentMonth = ref(new Date(props.anioInicial, props.mesInicial));
  const modalTrabajo = ref({ visible: false, trabajo: null });
  const modalListaTrabajos = ref({ visible: false, trabajos: [] });
  const celdasCalendario = ref([]);
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  // Datos de ejemplo (si no se proporcionan trabajos como prop)
  const trabajosEjemplo = [
    {
      id: 'TRAB-001',
      fechaProgramada: '2025-05-05',
      cliente: 'Juan Pérez',
      tipo: 'Instalación',
      direccion: 'Av. Principal #123, Ciudad',
      estado: 'Programado',
      montoTotal: 8500,
      adelanto: 3000,
      saldoPendiente: 5500,
      hora: '09:00',
      duracion: 3 // horas
    },
    {
      id: 'TRAB-002',
      fechaProgramada: '2025-05-03',
      cliente: 'María López',
      tipo: 'Corte',
      direccion: 'Calle Secundaria #456, Ciudad',
      estado: 'En Progreso',
      montoTotal: 3200,
      adelanto: 1500,
      saldoPendiente: 1700,
      hora: '13:00',
      duracion: 2
    },
    {
      id: 'TRAB-003',
      fechaProgramada: '2025-04-30',
      cliente: 'Carlos Rodríguez',
      tipo: 'Pulido',
      direccion: 'Plaza Central #789, Ciudad',
      estado: 'Completado',
      montoTotal: 4800,
      adelanto: 4800,
      saldoPendiente: 0,
      hora: '10:30',
      duracion: 4
    },
    {
      id: 'TRAB-004',
      fechaProgramada: '2025-05-02',
      cliente: 'Ana Martínez',
      tipo: 'Instalación',
      direccion: 'Av. Norte #321, Ciudad',
      estado: 'En Espera',
      montoTotal: 12000,
      adelanto: 6000,
      saldoPendiente: 6000,
      hora: '08:00',
      duracion: 5
    },
    {
      id: 'TRAB-005',
      fechaProgramada: '2025-04-29',
      cliente: 'Roberto Gómez',
      tipo: 'Corte',
      direccion: 'Calle Sur #654, Ciudad',
      estado: 'Entregado',
      montoTotal: 2500,
      adelanto: 2500,
      saldoPendiente: 0,
      hora: '15:00',
      duracion: 1
    },
    {
      id: 'TRAB-006',
      fechaProgramada: '2025-05-15',
      cliente: 'Sofía Ramírez',
      tipo: 'Instalación',
      direccion: 'Blvrd Central #100, Ciudad',
      estado: 'Programado',
      montoTotal: 9700,
      adelanto: 4850,
      saldoPendiente: 4850,
      hora: '09:30',
      duracion: 4
    },
    {
      id: 'TRAB-007',
      fechaProgramada: '2025-05-15',
      cliente: 'Eduardo Sánchez',
      tipo: 'Corte',
      direccion: 'Av. Libertad #220, Ciudad',
      estado: 'Programado',
      montoTotal: 4300,
      adelanto: 1500,
      saldoPendiente: 2800,
      hora: '14:00',
      duracion: 2
    },
    {
      id: 'TRAB-008',
      fechaProgramada: '2025-05-20',
      cliente: 'Valentina Ortiz',
      tipo: 'Pulido',
      direccion: 'Calle Nueva #78, Ciudad',
      estado: 'Programado',
      montoTotal: 3600,
      adelanto: 1800,
      saldoPendiente: 1800,
      hora: '11:00',
      duracion: 3
    }
  ];
  
  // Computed properties
  const trabajosMes = computed(() => {
    const trabajosActuales = props.trabajos.length > 0 ? props.trabajos : trabajosEjemplo;
    const year = currentMonth.value.getFullYear();
    const month = currentMonth.value.getMonth();
    
    return trabajosActuales.filter(t => {
      const fecha = new Date(t.fechaProgramada);
      return fecha.getMonth() === month && fecha.getFullYear() === year;
    });
  });
  
  const resumen = computed(() => {
    let totalTrabajos = 0, ingresosTotales = 0, adelantos = 0, saldosPendientes = 0;
    
    trabajosMes.value.forEach(t => {
      totalTrabajos++;
      ingresosTotales += t.montoTotal;
      adelantos += t.adelanto;
      saldosPendientes += t.saldoPendiente;
    });
    
    return { totalTrabajos, ingresosTotales, adelantos, saldosPendientes };
  });
  
  // Métodos
  function generarCalendario() {
    const year = currentMonth.value.getFullYear();
    const month = currentMonth.value.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const primerDiaSemana = primerDia.getDay();
    const totalDias = ultimoDia.getDate();
    
    const celdas = [];
    
    // Añadir espacios en blanco para los días antes del primer día del mes
    for (let i = 0; i < primerDiaSemana; i++) {
      celdas.push({ dia: '', trabajos: [] });
    }
    
    // Añadir los días del mes
    for (let dia = 1; dia <= totalDias; dia++) {
      const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const trabajosDia = trabajosMes.value.filter(t => t.fechaProgramada === fechaStr);
      
      celdas.push({ dia, trabajos: trabajosDia });
    }
    
    // Completar la última semana con celdas vacías si es necesario
    const celdasRestantes = (7 - (celdas.length % 7)) % 7;
    for (let i = 0; i < celdasRestantes; i++) {
      celdas.push({ dia: '', trabajos: [] });
    }
    
    celdasCalendario.value = celdas;
  }
  
  function changeMonth(offset) {
    const newMonth = new Date(currentMonth.value);
    newMonth.setMonth(newMonth.getMonth() + offset);
    currentMonth.value = newMonth;
    
    // Emitir eventos para actualizar mes y año en el componente padre si es necesario
    emit('update:mes', newMonth.getMonth());
    emit('update:anio', newMonth.getFullYear());
    
    generarCalendario();
  }
  
  function formatMonthYear(date) {
    return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(date);
  }
  
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }
  
  function getEstadoClass(estado) {
    switch (estado) {
      case 'Programado': return 'bg-yellow-100 text-yellow-800';
      case 'En Progreso': return 'bg-blue-100 text-blue-800';
      case 'En Espera': return 'bg-orange-100 text-orange-800';
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'Entregado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  function abrirModalTrabajo(trabajo) {
    modalTrabajo.value = { visible: true, trabajo };
    // Si estaba abierto el modal de lista, lo cerramos
    if (modalListaTrabajos.value.visible) {
      cerrarModalListaTrabajos();
    }
  }
  
  function cerrarModalTrabajo() {
    modalTrabajo.value = { visible: false, trabajo: null };
  }
  
  function abrirModalListaTrabajos(trabajos) {
    modalListaTrabajos.value = { visible: true, trabajos };
  }
  
  function cerrarModalListaTrabajos() {
    modalListaTrabajos.value = { visible: false, trabajos: [] };
  }
  
  // Inicializar el calendario al montar el componente
  onMounted(() => {
    generarCalendario();
  });
  </script>
  
  <style scoped>
  .calendario-trabajos {
    min-height: 70vh;
  }
  </style>