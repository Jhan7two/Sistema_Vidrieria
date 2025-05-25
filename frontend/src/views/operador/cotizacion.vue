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
              <option v-for="tipo in tiposVidrio" :key="tipo.id" :value="tipo.id">{{ tipo.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="acabado">
              Acabado
            </label>
            <select v-model="vidrio.acabado" @change="calcularPrecio" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="acabado">
              <option value="">Seleccione un acabado</option>
              <option value="normal">lijar</option>
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
          <div class="text-gray-700">Cálculo del precio:</div>
          <div class="font-semibold">Bs. {{ calculoConDecimal.toFixed(3) }}</div>
          <div class="text-gray-700">Precio base:</div>
          <div class="font-semibold">Bs. {{ precioBase }}</div>        
          <div class="text-gray-700">Costo por lijar:</div>
          <div class="font-semibold">Bs. {{ costoAcabado }}</div>
          <div class="text-gray-700 font-bold text-lg">TOTAL:</div>
          <div class="font-bold text-xl text-blue-700">Bs. {{ total }}</div>
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
import { useRouter } from 'vue-router';

export default {
  name: 'CotizacionVidrieria',
  components: {
    Diseño
  },
  setup() {
    const router = useRouter();
    
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
      { id: 'sencillo_2mm', nombre: 'Vidrio Sencillo 2mm', precio: 15 },
      { id: 'doble_3mm', nombre: 'Vidrio Doble 3mm', precio: 15 },
      { id: 'incoloro_4mm', nombre: 'Vidrio Incoloro 4mm', precio: 20 },
      { id: 'fume_4mm', nombre: 'Vidrio Fume 4mm', precio: 25 },
      { id: 'incoloro_5mm', nombre: 'Vidrio Incoloro 5mm', precio: 25 },
      { id: 'fume_5mm', nombre: 'Vidrio Fume 5mm', precio: 30 },
      { id: 'incoloro_6mm', nombre: 'Vidrio Incoloro 6mm', precio: 30 },
      { id: 'fume_6mm', nombre: 'Vidrio Fume 6mm', precio: 35 },
      { id: 'catedral', nombre: 'Vidrio Catedral', precio: 18 },
      { id: 'espejo_sencillo', nombre: 'Espejo Sencillo', precio: 16 },
      { id: 'espejo_doble', nombre: 'Espejo Doble', precio: 25 },
      { id: 'espejo_4mm', nombre: 'Espejo 4mm', precio: 30 }
    ]);
    
    // Precios y cálculos
    const precioBase = ref(0);
    const costoTratamientos = ref(0);
    const costoAcabado = ref(0);
    const total = ref(0);
    const calculoConDecimal = ref(0);
    
    // Cálculo del área según la fórmula del negocio
    const areaTotal = computed(() => {
      if (!vidrio.value.ancho || !vidrio.value.alto) return 0;
      // Fórmula: (ancho * alto) / 900
      return (vidrio.value.ancho * vidrio.value.alto) / 900;
    });
    
    // Actualiza el precio base según el tipo de vidrio seleccionado
    const actualizarPrecioBase = () => {
      const tipoSeleccionado = tiposVidrio.value.find(t => t.id === vidrio.value.tipo);
      if (tipoSeleccionado && areaTotal.value > 0) {
        // Guardamos el cálculo con decimales
        calculoConDecimal.value = areaTotal.value * tipoSeleccionado.precio * vidrio.value.cantidad;
        // Precio base multiplicando por 10
        precioBase.value = Math.floor(calculoConDecimal.value * 10);
      } else {
        calculoConDecimal.value = 0;
        precioBase.value = 0;
      }
    };
    
    // Calcula el precio total
    const calcularPrecio = () => {
      // Actualizar precio base
      actualizarPrecioBase();
      
      // Cálculo del costo por lijado
      if (vidrio.value.acabado === 'normal' && areaTotal.value > 0) {
        costoAcabado.value = 5 * vidrio.value.cantidad; // 5 Bs por unidad
      } else {
        costoAcabado.value = 0;
      }

      // Actualizar el total
      total.value = Number(precioBase.value) + costoAcabado.value;
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
        
        // Guardar el total en localStorage
        localStorage.setItem('cotizacionTotal', total.value);
        
        // Navegar a la página de cotizaciones
        router.push('/operador/cotizaciones');
        
      } catch (err) {
        error.value = 'Error al guardar la cotización: ' + err.message;
      } finally {
        cargando.value = false;
      }
    };
    
    // Observar cambios en dimensiones para actualizar cálculos
    watch([() => vidrio.value.ancho, () => vidrio.value.alto, () => vidrio.value.cantidad, () => vidrio.value.acabado], () => {
      calcularPrecio();
    });

    // Observar cambios en el tipo de vidrio
    watch(() => vidrio.value.tipo, () => {
      actualizarPrecioBase();
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
      costoAcabado,
      total,
      calculoConDecimal,
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
