<template>
  <div class="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
    <div class="bg-gray-50 p-2 border-b flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center space-x-1">
        <span class="text-sm text-gray-600 mr-2">Herramientas:</span>
        <button
          v-for="item in toolbarItems"
          :key="item.id"
          @click="setTool(item.id)"
          :class="[
            'p-1.5 rounded transition-colors',
            props.activeTool === item.id ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'
          ]"
          :title="item.label"
        >
          <Edit3 v-if="item.icon === 'pencil'" :size="16" />
          <Eraser v-else-if="item.icon === 'eraser'" :size="16" />
          <Square v-else-if="item.icon === 'square'" :size="16" />
          <Circle v-else-if="item.icon === 'circle'" :size="16" />
          <Minus v-else-if="item.icon === 'line'" :size="16" />
          <Type v-else-if="item.icon === 'Type' || item.icon === 'text'" :size="16" />
        </button>
      </div>
      
      <div class="flex items-center space-x-2">
        <div class="flex items-center space-x-1">
          <button
            @click="undo"
            :disabled="!canUndo"
            :class="[
              'p-1.5 rounded transition-colors',
              canUndo ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
            ]"
            title="Deshacer"
          >
            <Undo2 :size="16" />
          </button>
          <button
            @click="redo"
            :disabled="!canRedo"
            :class="[
              'p-1.5 rounded transition-colors',
              canRedo ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
            ]"
            title="Rehacer"
          >
            <Redo2 :size="16" />
          </button>
        </div>
        
        <div class="flex items-center space-x-2">
          <input 
            type="color" 
            v-model="strokeColor" 
            class="w-6 h-6 rounded cursor-pointer border border-gray-300"
            title="Color"
          />
          <select 
            v-model="strokeWidth" 
            class="text-xs border border-gray-300 rounded p-1"
            title="Grosor"
          >
            <option value="1">Fino</option>
            <option value="2">Medio</option>
            <option value="4">Grueso</option>
            <option value="6">Extra</option>
          </select>
        </div>
        
        <button
          @click="clearCanvas"
          class="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
          title="Limpiar lienzo"
        >
          Limpiar
        </button>
      </div>
    </div>
    
    <div class="relative">
      <div v-if="!isEditMode" class="absolute inset-0 bg-gray-100 bg-opacity-50 z-10 flex items-center justify-center">
        <div class="bg-white p-3 rounded-lg shadow-md">
          <span class="text-sm text-gray-600">Modo visualización</span>
        </div>
      </div>
      <canvas
        ref="canvasRef"
        class="w-full h-[400px] cursor-crosshair"
        @click="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @dblclick="deactivateTool"
      />
      <input
        v-if="floatingInput.visible"
        id="canvas-floating-input"
        v-model="floatingInput.value"
        :style="{
          position: 'absolute',
          left: floatingInput.x + 'px',
          top: floatingInput.y + 'px',
          zIndex: 20,
          fontSize: '20px',
          padding: '2px 6px',
          border: '1px solid #888',
          borderRadius: '4px',
          outline: 'none',
          background: 'white',
          color: strokeColor
        }"
        @keydown.enter.prevent="confirmFloatingInput"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { Edit3, Eraser, Square, Circle, Minus, Undo2, Redo2, Type } from 'lucide-vue-next';

const props = defineProps({
  initialData: {
    type: Object,
    required: true
  },
  isEditMode: {
    type: Boolean,
    default: true
  },
  activeTool: {
    type: String,
    default: 'pencil'
  }
});
const emit = defineEmits(['change', 'save', 'update:activeTool']);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const lastPoint = ref<{ x: number, y: number } | null>(null);
const toolbarItems = ref([
  { id: 'pencil', icon: 'pencil', active: true, label: 'Lápiz' },
  { id: 'line', icon: 'line', active: false, label: 'Línea' },
  { id: 'rectangle', icon: 'square', active: false, label: 'Rectángulo' },
  { id: 'circle', icon: 'circle', active: false, label: 'Círculo' },
  { id: 'eraser', icon: 'eraser', active: false, label: 'Borrador' },
  { id: 'text', icon: 'Type', active: false, label: 'Texto' }
]);
const strokeColor = ref('#000000');
const strokeWidth = ref(2);
const paths = ref<{ tool: string, color: string, width: number, points: {x: number, y: number}[] }[]>([]);
const canvasHistory = ref<{ paths: any[], shapes: any[], texts: any[] }[]>([]);
const historyIndex = ref(-1);
const texts = ref<{ x: number, y: number, value: string }[]>([]);
const floatingInput = ref<{ x: number, y: number, value: string, visible: boolean }>({ x: 0, y: 0, value: '', visible: false });
const shapes = ref<{ type: string, x: number, y: number, x2: number, y2: number, color: string, width: number }[]>(props.initialData?.metadata?.shapes || []);
const drawingShape = ref<{ type: string, x: number, y: number, x2: number, y2: number, color: string, width: number } | null>(null);
const currentPath = ref<{ tool: string, color: string, width: number, points: {x: number, y: number}[] } | null>(null);

const initializeCanvas = async () => {
  await nextTick();
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Configurar canvas con dimensiones reales para mejor calidad
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  // Limpiar canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  texts.value = (props.initialData?.metadata?.texts) || [];
  
  // Cargar datos iniciales si existen
  if (props.initialData && props.initialData.drawing) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drawTexts(ctx);
      saveToHistory();
    };
    img.src = props.initialData.drawing;
    img.crossOrigin = "anonymous";
  } else {
    drawTexts(ctx);
    saveToHistory();
  }
};

function saveToHistory() {
  if (historyIndex.value < canvasHistory.value.length - 1) {
    canvasHistory.value = canvasHistory.value.slice(0, historyIndex.value + 1);
  }
  canvasHistory.value.push({
    paths: JSON.parse(JSON.stringify(paths.value)),
    shapes: JSON.parse(JSON.stringify(shapes.value)),
    texts: JSON.parse(JSON.stringify(texts.value))
  });
  historyIndex.value = canvasHistory.value.length - 1;
}

function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    loadFromHistory();
  }
}

function redo() {
  if (historyIndex.value < canvasHistory.value.length - 1) {
    historyIndex.value++;
    loadFromHistory();
  }
}

function loadFromHistory() {
  const entry = canvasHistory.value[historyIndex.value];
  if (!entry) return;
  paths.value = JSON.parse(JSON.stringify(entry.paths));
  shapes.value = JSON.parse(JSON.stringify(entry.shapes));
  texts.value = JSON.parse(JSON.stringify(entry.texts));
  redrawCanvas();
  notifyChange();
}

const startDrawing = (e: MouseEvent | TouchEvent) => {
  if (!props.isEditMode) return;
  const rect = canvasRef.value!.getBoundingClientRect();
  let clientX = 0, clientY = 0;
  if (e instanceof MouseEvent) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }
  if (props.activeTool === 'text') {
    floatingInput.value = {
      x: clientX - rect.left,
      y: clientY - rect.top,
      value: '',
      visible: true
    };
    nextTick(() => {
      const input = document.getElementById('canvas-floating-input') as HTMLInputElement;
      if (input) input.focus();
    });
    return;
  }
  if (["rectangle", "circle", "line"].includes(props.activeTool)) {
    isDrawing.value = true;
    drawingShape.value = {
      type: props.activeTool,
      x: clientX - rect.left,
      y: clientY - rect.top,
      x2: clientX - rect.left,
      y2: clientY - rect.top,
      color: strokeColor.value,
      width: strokeWidth.value
    };
    return;
  }
  if (props.activeTool === 'pencil' || props.activeTool === 'eraser') {
    isDrawing.value = true;
    currentPath.value = {
      tool: props.activeTool,
      color: strokeColor.value,
      width: strokeWidth.value,
      points: [{ x: clientX - rect.left, y: clientY - rect.top }]
    };
    paths.value.push(currentPath.value);
    redrawCanvas();
    return;
  }
};

const draw = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing.value || !props.isEditMode || !canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  let clientX = 0, clientY = 0;
  if (e instanceof MouseEvent) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }
  const currentPoint = {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
  if (["rectangle", "circle", "line"].includes(props.activeTool) && drawingShape.value) {
    drawingShape.value.x2 = currentPoint.x;
    drawingShape.value.y2 = currentPoint.y;
    redrawCanvas(true); // true = preview
    return;
  }
  if ((props.activeTool === 'pencil' || props.activeTool === 'eraser') && isDrawing.value && currentPath.value) {
    currentPath.value.points.push(currentPoint);
    redrawCanvas();
    return;
  }
};

const stopDrawing = () => {
  if (!props.isEditMode) return;
  if (["rectangle", "circle", "line"].includes(props.activeTool) && drawingShape.value) {
    shapes.value.push({ ...drawingShape.value });
    drawingShape.value = null;
    isDrawing.value = false;
    saveToHistory();
    notifyChange();
    redrawCanvas();
    emit('update:activeTool', null);
    return;
  }
  if (isDrawing.value && (props.activeTool === 'pencil' || props.activeTool === 'eraser')) {
    isDrawing.value = false;
    currentPath.value = null;
    saveToHistory();
    notifyChange();
  }
};

const clearCanvas = () => {
  texts.value = [];
  shapes.value = [];
  paths.value = [];
  saveToHistory();
  notifyChange();
  redrawCanvas();
};

const notifyChange = () => {
  if (!canvasRef.value) return;
  emit('change', {
    drawing: canvasRef.value.toDataURL(),
    timestamp: new Date().toISOString(),
    metadata: {
      width: canvasRef.value.width,
      height: canvasRef.value.height,
      texts: texts.value,
      shapes: shapes.value
    }
  });
};

const setTool = (toolId: string) => {
  emit('update:activeTool', toolId);
  toolbarItems.value = toolbarItems.value.map(item => ({
    ...item,
    active: item.id === toolId
  }));
};

function drawShapes(ctx: CanvasRenderingContext2D, preview = false) {
  const allShapes = preview && drawingShape.value ? [...shapes.value, drawingShape.value] : shapes.value;
  allShapes.forEach(shape => {
    ctx.save();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.width;
    if (shape.type === 'rectangle') {
      ctx.strokeRect(shape.x, shape.y, shape.x2 - shape.x, shape.y2 - shape.y);
    } else if (shape.type === 'circle') {
      const centerX = (shape.x + shape.x2) / 2;
      const centerY = (shape.y + shape.y2) / 2;
      const radiusX = Math.abs((shape.x2 - shape.x) / 2);
      const radiusY = Math.abs((shape.y2 - shape.y) / 2);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (shape.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(shape.x, shape.y);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawPaths(ctx: CanvasRenderingContext2D) {
  for (const path of paths.value) {
    if (path.points.length < 2) continue;
    ctx.save();
    ctx.strokeStyle = path.tool === 'eraser' ? '#ffffff' : path.color;
    ctx.lineWidth = path.tool === 'eraser' ? path.width * 4 : path.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function redrawCanvas(preview = false) {
  if (!canvasRef.value) return;
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawPaths(ctx);
  drawShapes(ctx, preview);
  drawTexts(ctx);
}

function drawTexts(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.font = '20px Arial';
  ctx.fillStyle = strokeColor.value;
  texts.value.forEach(t => {
    ctx.fillText(t.value, t.x, t.y);
  });
  ctx.restore();
}

function confirmFloatingInput() {
  setTimeout(() => {
    if (floatingInput.value.visible && floatingInput.value.value.trim() !== '') {
      texts.value.push({ x: floatingInput.value.x, y: floatingInput.value.y, value: floatingInput.value.value });
      floatingInput.value.visible = false;
      floatingInput.value.value = '';
      saveToHistory();
      notifyChange();
    } else {
      floatingInput.value.visible = false;
      floatingInput.value.value = '';
    }
  }, 100);
}

function deactivateTool() {
  emit('update:activeTool', null);
}

onMounted(() => {
  initializeCanvas();
  window.addEventListener('resize', initializeCanvas);

  // Listeners pasivos para touch
  if (canvasRef.value) {
    canvasRef.value.addEventListener('touchstart', startDrawing as EventListener, { passive: true });
    canvasRef.value.addEventListener('touchmove', draw as EventListener, { passive: true });
    canvasRef.value.addEventListener('touchend', stopDrawing as EventListener, { passive: true });
  }
  // Guardar el estado inicial en el historial
  setTimeout(() => { saveToHistory(); }, 200);
});

watch(() => props.initialData, () => {
  initializeCanvas();
}, { deep: true });

watch(() => props.isEditMode, (newValue) => {
  if (newValue) {
    // Al entrar en modo edición, reiniciar el historial
    canvasHistory.value = [];
    historyIndex.value = -1;
    saveToHistory();
  }
});

watch(texts, () => {
  redrawCanvas();
}, { deep: true });

watch(shapes, () => {
  redrawCanvas();
}, { deep: true });

const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < canvasHistory.value.length - 1);
</script> 