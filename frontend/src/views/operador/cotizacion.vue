<template>
    <div class="mb-4 flex gap-2">
        <button :class="vista === 'diseño' ? 'bg-slate-500 text-white' : 'bg-gray-200 text-gray-700'" class="px-4 py-2 rounded-l" @click="vista = 'diseño'">diseño</button>
        <button :class="vista === 'calcular' ? 'bg-slate-500 text-white' : 'bg-gray-200 text-gray-700'" class="px-4 py-2 rounded-l" @click="vista = 'calcular'">calcular</button>
    </div>

    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <span class="block sm:inline">{{ error }}</span>
      <button @click="error = null" class="float-right font-bold">×</button>
    </div>

    <div v-if="cargando" class="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded mb-4">
      <span class="block sm:inline">Cargando datos...</span>
    </div>

    <!-- Formulario de cálculo para vidriería -->
    <div v-if="vista === 'calcular'" class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 class="text-xl font-bold mb-4">Cálculo de Cotización para Vidriería</h2>
      <!-- Detalles del vidrio -->
      <div class="mb-6 p-4 border border-gray-200 rounded">
        <h3 class="text-lg font-semibold mb-3">Detalles del Vidrio</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="tipoVidrio">
              Tipo de Vidrio
            </label>
            <select v-model="vidrio.tipo" @change="actualizarPrecioBase" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="tipoVidrio">
              <option value="">Seleccione un tipo</option>
              <option v-for="tipo in tiposVidrio" :key="tipo.id" :value="tipo.id">{{ tipo.nombre }} - {{ tipo.espesor }}mm</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="acabado">
              Acabado
            </label>
            <select v-model="vidrio.acabado" @change="calcularPrecio" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="acabado">
              <option value="">Seleccione un acabado</option>
              <option value="pulido">Pulido</option>
              <option value="biselado">Biselado</option>
              <option value="esmerilado">Esmerilado</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="ancho">
              Ancho (cm)
            </label>
            <input v-model.number="vidrio.ancho" @input="calcularPrecio" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="ancho" type="number" min="1" placeholder="Ancho en centímetros">
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="alto">
              Alto (cm)
            </label>
            <input v-model.number="vidrio.alto" @input="calcularPrecio" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="alto" type="number" min="1" placeholder="Alto en centímetros">
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="cantidad">
              Cantidad
            </label>
            <input v-model.number="vidrio.cantidad" @input="calcularPrecio" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="cantidad" type="number" min="1" placeholder="Número de unidades">
          </div>
        </div>
      </div>

      <!-- Resumen y precio -->
      <div class="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 class="text-lg font-semibold mb-3">Resumen de la Cotización</h3>
        <div class="grid grid-cols-2 gap-2 mb-4">
          <div class="text-gray-700">Área total:</div>
          <div class="font-semibold">{{ areaTotal }} m²</div>
          
          <div class="text-gray-700">Precio base:</div>
          <div class="font-semibold">${{ precioBase.toFixed(2) }}</div>        
          <div class="text-gray-700">Costo por tratamientos:</div>
          <div class="font-semibold">${{ costoTratamientos.toFixed(2) }}</div>
          <div class="text-gray-700 font-bold">TOTAL:</div>
          <div class="font-bold text-xl text-blue-700">${{ total.toFixed(2) }}</div>
        </div>
        
        <div class="flex justify-between mt-6">
          <button @click="limpiarFormulario" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Limpiar
          </button>
          <button @click="guardarCotizacion" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Guardar Cotización
          </button>
        </div>
      </div>
    </div>

    <!-- Sección de diseño -->
    <div v-if="vista === 'diseño'">
      <Diseño />
    </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import Diseño from '@/components/diseño.vue';

export default {
  name: 'CotizacionVidrieria',
  components: {
    Diseño
  },
  setup() {
    // Estado general
    const vista = ref('calcular'); // 'diseño' o 'calcular'
    const cargando = ref(false);
    const error = ref(null);
    
    // Datos del vidrio
    const vidrio = ref({
      tipo: '',
      acabado: '',
      ancho: null,
      alto: null,
      cantidad: 1,
      instalacion: false,
      tratamientos: []
    });
    
    // Catálogo de tipos de vidrio
    const tiposVidrio = ref([
      { id: 'simple_2mm', nombre: 'Vidrio Simple', espesor: 2, precioM2: 25 },
      { id: 'simple_4mm', nombre: 'Vidrio Simple', espesor: 4, precioM2: 35 },
      { id: 'simple_6mm', nombre: 'Vidrio Simple', espesor: 6, precioM2: 45 },
      { id: 'templado_4mm', nombre: 'Vidrio Templado', espesor: 4, precioM2: 60 },
      { id: 'templado_6mm', nombre: 'Vidrio Templado', espesor: 6, precioM2: 75 },
      { id: 'templado_8mm', nombre: 'Vidrio Templado', espesor: 8, precioM2: 90 },
      { id: 'laminado_3mm', nombre: 'Vidrio Laminado', espesor: 3, precioM2: 55 },
      { id: 'laminado_5mm', nombre: 'Vidrio Laminado', espesor: 5, precioM2: 70 },
      { id: 'laminado_8mm', nombre: 'Vidrio Laminado', espesor: 8, precioM2: 95 },
    ]);
    
    // Precios y cálculos
    const precioBase = ref(0);
    const costoTratamientos = ref(0);
    const porcentajeIVA = ref(16); // Porcentaje de IVA
    
    // Cálculo del área
    const areaTotal = computed(() => {
      if (!vidrio.value.ancho || !vidrio.value.alto) return 0;
      // Convertir de cm² a m²
      return ((vidrio.value.ancho * vidrio.value.alto) / 10000).toFixed(2);
    });
    
    // Subtotal (antes de impuestos)
    const subtotal = computed(() => {
      return precioBase.value + costoTratamientos.value;
    });
    
    // Cálculo del IVA
    const iva = computed(() => {
      return subtotal.value * (porcentajeIVA.value / 100);
    });
    
    // Total (con impuestos)
    const total = computed(() => {
      return subtotal.value + iva.value;
    });
    
    // Actualiza el precio base según el tipo de vidrio seleccionado
    const actualizarPrecioBase = () => {
      const tipoSeleccionado = tiposVidrio.value.find(t => t.id === vidrio.value.tipo);
      if (tipoSeleccionado && areaTotal.value > 0) {
        precioBase.value = tipoSeleccionado.precioM2 * areaTotal.value * vidrio.value.cantidad;
      } else {
        precioBase.value = 0;
      }
      calcularPrecio();
    };
    
    // Calcula el precio total
    const calcularPrecio = () => {
      // Actualizar precio base si cambian dimensiones o cantidad
      actualizarPrecioBase();
      
        // Cálculo del costo por acabado
      if (vidrio.value.acabado && areaTotal.value > 0) {
        switch (vidrio.value.acabado) {
          case 'pulido':
            costoAcabado.value = areaTotal.value * 15 * vidrio.value.cantidad;
            break;
          case 'biselado':
            costoAcabado.value = areaTotal.value * 25 * vidrio.value.cantidad;
            break;
          case 'esmerilado':
            costoAcabado.value = areaTotal.value * 20 * vidrio.value.cantidad;
            break;
          default:
            costoAcabado.value = 0;
        }
      } else {
        costoAcabado.value = 0;
      }
      
      // Cálculo del costo por tratamientos
      costoTratamientos.value = 0;
      if (vidrio.value.tratamientos.length > 0 && areaTotal.value > 0) {
        vidrio.value.tratamientos.forEach(tratamiento => {
          switch (tratamiento) {
            case 'templado':
              costoTratamientos.value += areaTotal.value * 30 * vidrio.value.cantidad;
              break;
            case 'laminado':
              costoTratamientos.value += areaTotal.value * 35 * vidrio.value.cantidad;
              break;
            case 'bajo_emisivo':
              costoTratamientos.value += areaTotal.value * 40 * vidrio.value.cantidad;
              break;
          }
        });
      }
    };
    
    // Limpiar formulario
    const limpiarFormulario = () => {
      vidrio.value = {
        tipo: '',
        acabado: '',
        ancho: null,
        alto: null,
        cantidad: 1,
        instalacion: false,
        tratamientos: []
      };
      
      precioBase.value = 0;
      costoTratamientos.value = 0;
    };
    
    // Guardar cotización
    const guardarCotizacion = async () => {
      try {
        // Validaciones básicas
        if (!vidrio.value.tipo || !vidrio.value.ancho || !vidrio.value.alto) {
          error.value = 'Por favor complete los datos del vidrio';
          return;
        }
        
        cargando.value = true;
        
        // Aquí iría la lógica para guardar en la base de datos
        // Por ahora solo simulamos una espera
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mostrar mensaje de éxito (en un caso real, esto vendría del backend)
        alert('Cotización guardada con éxito');
        
        // Limpiar formulario después de guardar
        limpiarFormulario();
      } catch (err) {
        error.value = 'Error al guardar la cotización: ' + err.message;
      } finally {
        cargando.value = false;
      }
    };
    
    // Observar cambios en dimensiones para actualizar cálculos
    watch([() => vidrio.value.ancho, () => vidrio.value.alto, () => vidrio.value.cantidad], () => {
      calcularPrecio();
    });
    
    // Inicialización
    onMounted(() => {
      // Aquí se podrían cargar datos iniciales si fuera necesario
    });
    
    return {
      vista,
      cargando,
      error,
      vidrio,
      tiposVidrio,
      areaTotal,
      precioBase,
      costoTratamientos,
      subtotal,
      porcentajeIVA,
      total,
      actualizarPrecioBase,
      calcularPrecio,
      limpiarFormulario,
      guardarCotizacion
    };
  }
};
</script>

<style scoped>
/* Estilos adicionales específicos para este componente */
.form-checkbox {
  border-radius: 0.25rem;
  border-color: #cbd5e0;
}

.form-checkbox:checked {
  background-color: #4299e1;
  border-color: #4299e1;
}
</style>
