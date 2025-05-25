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
            props.activeTool === item.id ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'text-gray-500 hover:bg-gray-100'
          ]"
          :title="item.label"
        >
          <Edit3 v-if="item.icon === 'pencil'" :size="16" />
          <Eraser v-else-if="item.icon === 'eraser'" :size="16" />
          <Square v-else-if="item.icon === 'square'" :size="16" />
          <Circle v-else-if="item.icon === 'circle'" :size="16" />
          <Minus v-else-if="item.icon === 'line'" :size="16" />
          <Type v-else-if="item.icon === 'Type' || item.icon === 'text'" :size="16" />
          <Move v-else-if="item.icon === 'move'" :size="16" />
          <MousePointer v-else-if="item.icon === 'select'" :size="16" />
          <Trash2 v-else-if="item.icon === 'delete'" :size="16" />
        </button>
      </div>
      
      <div class="flex items-center space-x-2">
        
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
          @click="deleteSelected"
          :disabled="!hasSelection"
          :class="[
            'text-xs px-2 py-1 rounded transition-colors',
            hasSelection ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
          title="Eliminar seleccionado"
        >
          Eliminar
        </button>
        
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
      
      <!-- Canvas principal -->
      <canvas
        ref="canvasRef"
        :key="canvasKey"
        class="w-full h-[400px] cursor-crosshair touch-none"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @dblclick="deactivateTool"
        @touchstart.passive="startDrawing"
        @touchmove.passive="draw"
        @touchend.passive="stopDrawing"
      />
      
      <!-- Text input overlay -->
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
        @keydown.escape.prevent="cancelFloatingInput"
        placeholder="Escribir medida..."
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed, onUnmounted } from 'vue'
import { Edit3, Eraser, Square, Circle, Minus, Type, Move, MousePointer, Trash2 } from 'lucide-vue-next'

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
})

const emit = defineEmits(['change', 'save', 'update:activeTool'])

// Refs principales
const canvasRef = ref(null)
const canvasKey = ref(0)

// Estado de dibujo
const isDrawing = ref(false)
const isDraggingText = ref(false)
const selectedTextId = ref(null)
const dragOffset = ref({ x: 0, y: 0 })

// NUEVO: Estado de selección
const selectedElements = ref({
  shapes: new Set(),
  texts: new Set(),
  paths: new Set()
})

// Propiedades de dibujo
const strokeColor = ref('#000000')
const strokeWidth = ref(2)

// Datos del canvas
const canvasData = ref({
  paths: [],
  shapes: [],
  texts: []
})

// Estado temporal durante el dibujo
const currentPath = ref(null)
const drawingShape = ref(null)

// Historial para undo/redo
const canvasHistory = ref([])
const historyIndex = ref(-1)
const maxHistorySize = 30

// Input de texto flotante
const floatingInput = ref({ 
  x: 0, 
  y: 0, 
  value: '', 
  visible: false 
})

// ACTUALIZADO: Toolbar items con nuevas herramientas
const toolbarItems = ref([
  { id: 'select', icon: 'select', label: 'Seleccionar' },
  { id: 'pencil', icon: 'pencil', label: 'Lápiz' },
  { id: 'line', icon: 'line', label: 'Línea' },
  { id: 'rectangle', icon: 'square', label: 'Rectángulo' },
  { id: 'circle', icon: 'circle', label: 'Círculo' },
  { id: 'text', icon: 'Type', label: 'Texto' },
  { id: 'move', icon: 'move', label: 'Mover Texto' },
  { id: 'eraser', icon: 'eraser', label: 'Borrador' }
])

// Computed properties
const hasSelection = computed(() => {
  return selectedElements.value.shapes.size > 0 || 
         selectedElements.value.texts.size > 0 || 
         selectedElements.value.paths.size > 0
})

const canUndo = computed(() => {
  return historyIndex.value > 0
})

const canRedo = computed(() => {
  return historyIndex.value < canvasHistory.value.length - 1
})

// FUNCIONES DE HISTORIAL (sin cambios)
const saveToHistory = () => {
  const currentState = JSON.parse(JSON.stringify(canvasData.value))
  
  if (historyIndex.value < canvasHistory.value.length - 1) {
    canvasHistory.value = canvasHistory.value.slice(0, historyIndex.value + 1)
  }
  
  canvasHistory.value.push(currentState)
  
  if (canvasHistory.value.length > maxHistorySize) {
    canvasHistory.value.shift()
  } else {
    historyIndex.value++
  }
}

const undo = () => {
  if (!canUndo.value) return
  
  historyIndex.value--
  loadFromHistory()
}

const redo = () => {
  if (!canRedo.value) return
  
  historyIndex.value++
  loadFromHistory()
}

const loadFromHistory = () => {
  const state = canvasHistory.value[historyIndex.value]
  if (!state) return
  
  canvasData.value = JSON.parse(JSON.stringify(state))
  clearSelection()
  redrawMainCanvas()
  debouncedNotifyChange()
}

// NUEVAS FUNCIONES DE SELECCIÓN
const clearSelection = () => {
  selectedElements.value.shapes.clear()
  selectedElements.value.texts.clear()
  selectedElements.value.paths.clear()
  selectedTextId.value = null
}

const isElementSelected = (type, id) => {
  return selectedElements.value[type].has(id)
}

const toggleElementSelection = (type, id) => {
  if (selectedElements.value[type].has(id)) {
    selectedElements.value[type].delete(id)
  } else {
    selectedElements.value[type].add(id)
  }
}

const findElementAtPosition = (pos) => {
  // Buscar texto
  const text = findTextAtPosition(pos)
  if (text) return { type: 'texts', element: text }
  
  // Buscar forma
  const shape = findShapeAtPosition(pos)
  if (shape) return { type: 'shapes', element: shape }
  
  // Buscar trazo (más complejo, simplificado aquí)
  const path = findPathAtPosition(pos)
  if (path) return { type: 'paths', element: path }
  
  return null
}

const findShapeAtPosition = (pos) => {
  for (let i = canvasData.value.shapes.length - 1; i >= 0; i--) {
    const shape = canvasData.value.shapes[i]
    
    if (shape.type === 'rectangle') {
      const minX = Math.min(shape.x, shape.x2)
      const maxX = Math.max(shape.x, shape.x2)
      const minY = Math.min(shape.y, shape.y2)
      const maxY = Math.max(shape.y, shape.y2)
      
      if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
        return { ...shape, index: i, id: i.toString() }
      }
    } else if (shape.type === 'circle') {
      const centerX = (shape.x + shape.x2) / 2
      const centerY = (shape.y + shape.y2) / 2
      const radiusX = Math.abs((shape.x2 - shape.x) / 2)
      const radiusY = Math.abs((shape.y2 - shape.y) / 2)
      
      const dx = (pos.x - centerX) / radiusX
      const dy = (pos.y - centerY) / radiusY
      
      if (dx * dx + dy * dy <= 1) {
        return { ...shape, index: i, id: i.toString() }
      }
    } else if (shape.type === 'line') {
      // Verificar proximidad a la línea (simplificado)
      const distance = distanceToLine(pos, { x: shape.x, y: shape.y }, { x: shape.x2, y: shape.y2 })
      if (distance <= shape.width + 5) {
        return { ...shape, index: i, id: i.toString() }
      }
    }
  }
  return null
}

const findPathAtPosition = (pos) => {
  // Implementación simplificada - verificar si el punto está cerca de algún trazo
  for (let i = canvasData.value.paths.length - 1; i >= 0; i--) {
    const path = canvasData.value.paths[i]
    for (let j = 0; j < path.points.length; j++) {
      const point = path.points[j]
      const distance = Math.sqrt((pos.x - point.x) ** 2 + (pos.y - point.y) ** 2)
      if (distance <= path.width + 5) {
        return { ...path, index: i, id: i.toString() }
      }
    }
  }
  return null
}

const distanceToLine = (point, lineStart, lineEnd) => {
  const A = point.x - lineStart.x
  const B = point.y - lineStart.y
  const C = lineEnd.x - lineStart.x
  const D = lineEnd.y - lineStart.y

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1
  if (lenSq !== 0) param = dot / lenSq

  let xx, yy

  if (param < 0) {
    xx = lineStart.x
    yy = lineStart.y
  } else if (param > 1) {
    xx = lineEnd.x
    yy = lineEnd.y
  } else {
    xx = lineStart.x + param * C
    yy = lineStart.y + param * D
  }

  const dx = point.x - xx
  const dy = point.y - yy
  return Math.sqrt(dx * dx + dy * dy)
}

// NUEVA FUNCIÓN: Eliminar elementos seleccionados
const deleteSelected = () => {
  if (!hasSelection.value) return
  
  // Eliminar formas seleccionadas
  canvasData.value.shapes = canvasData.value.shapes.filter((_, index) => 
    !selectedElements.value.shapes.has(index.toString())
  )
  
  // Eliminar textos seleccionados
  canvasData.value.texts = canvasData.value.texts.filter(text => 
    !selectedElements.value.texts.has(text.id)
  )
  
  // Eliminar trazos seleccionados
  canvasData.value.paths = canvasData.value.paths.filter((_, index) => 
    !selectedElements.value.paths.has(index.toString())
  )
  
  clearSelection()
  redrawMainCanvas()
  saveToHistory()
  debouncedNotifyChange()
}

// INICIALIZACIÓN DEL CANVAS (sin cambios significativos)
const initializeCanvas = async () => {
  await nextTick()
  if (!canvasRef.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const rect = canvas.getBoundingClientRect()
  
  canvas.width = rect.width
  canvas.height = rect.height
  
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.imageSmoothingEnabled = true
  
  resetCanvasState()
  
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (props.initialData && props.initialData.drawing) {
    loadInitialData()
  } else {
    redrawMainCanvas()
    saveToHistory()
  }
}

const resetCanvasState = () => {
  canvasData.value = {
    paths: [],
    shapes: [],
    texts: []
  }
  
  currentPath.value = null
  drawingShape.value = null
  selectedTextId.value = null
  isDraggingText.value = false
  isDrawing.value = false
  clearSelection()
  
  canvasHistory.value = []
  historyIndex.value = -1
}

const loadInitialData = () => {
  if (!props.initialData) return
  
  if (props.initialData.metadata) {
    canvasData.value = {
      paths: props.initialData.metadata.paths || [],
      shapes: props.initialData.metadata.shapes || [],
      texts: props.initialData.metadata.texts || []
    }
  }
  
  if (props.initialData.drawing) {
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      if (props.initialData.drawing && !props.initialData.metadata) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      
      redrawMainCanvas()
      saveToHistory()
    }
    img.crossOrigin = "anonymous"
    img.src = props.initialData.drawing
  } else {
    redrawMainCanvas()
    saveToHistory()
  }
}

// FUNCIONES DE DIBUJO ACTUALIZADAS
const redrawMainCanvas = () => {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  drawPaths(ctx)
  drawShapes(ctx)
  drawTexts(ctx)
  
  if (currentPath.value && currentPath.value.points.length > 0) {
    drawCurrentPath(ctx)
  }
}

const drawPaths = (ctx) => {
  canvasData.value.paths.forEach((path, index) => {
    if (path.points.length < 2) return
    
    ctx.save()
    
    if (path.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.lineWidth = path.width * 3
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = path.color
      ctx.lineWidth = path.width
    }
    
    // NUEVO: Resaltar si está seleccionado
    if (isElementSelected('paths', index.toString())) {
      ctx.shadowColor = '#0066cc'
      ctx.shadowBlur = 10
    }
    
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    ctx.beginPath()
    ctx.moveTo(path.points[0].x, path.points[0].y)
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y)
    }
    ctx.stroke()
    ctx.restore()
  })
}

const drawCurrentPath = (ctx) => {
  if (!currentPath.value || currentPath.value.points.length === 0) return
  
  ctx.save()
  
  if (currentPath.value.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
    ctx.lineWidth = currentPath.value.width * 3
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = currentPath.value.color
    ctx.lineWidth = currentPath.value.width
  }
  
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  if (currentPath.value.points.length === 1) {
    const point = currentPath.value.points[0]
    ctx.beginPath()
    ctx.arc(point.x, point.y, currentPath.value.width / 2, 0, 2 * Math.PI)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.moveTo(currentPath.value.points[0].x, currentPath.value.points[0].y)
    for (let i = 1; i < currentPath.value.points.length; i++) {
      ctx.lineTo(currentPath.value.points[i].x, currentPath.value.points[i].y)
    }
    ctx.stroke()
  }
  
  ctx.restore()
}

const drawShapes = (ctx) => {
  canvasData.value.shapes.forEach((shape, index) => {
    ctx.save()
    ctx.strokeStyle = shape.color
    ctx.lineWidth = shape.width
    
    // NUEVO: Resaltar si está seleccionado
    if (isElementSelected('shapes', index.toString())) {
      ctx.shadowColor = '#0066cc'
      ctx.shadowBlur = 10
      ctx.strokeStyle = '#0066cc'
      ctx.lineWidth = shape.width + 2
    }
    
    if (shape.type === 'rectangle') {
      ctx.strokeRect(shape.x, shape.y, shape.x2 - shape.x, shape.y2 - shape.y)
    } else if (shape.type === 'circle') {
      const centerX = (shape.x + shape.x2) / 2
      const centerY = (shape.y + shape.y2) / 2
      const radiusX = Math.abs((shape.x2 - shape.x) / 2)
      const radiusY = Math.abs((shape.y2 - shape.y) / 2)
      
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
      ctx.stroke()
    } else if (shape.type === 'line') {
      ctx.beginPath()
      ctx.moveTo(shape.x, shape.y)
      ctx.lineTo(shape.x2, shape.y2)
      ctx.stroke()
    }
    ctx.restore()
  })
}

const drawTexts = (ctx) => {
  ctx.save()
  
  canvasData.value.texts.forEach(text => {
    ctx.font = `${text.fontSize || 20}px Arial`
    ctx.fillStyle = text.color
    
    // NUEVO: Resaltar si está seleccionado
    if (isElementSelected('texts', text.id)) {
      ctx.shadowColor = '#0066cc'
      ctx.shadowBlur = 5
    }
    
    ctx.fillText(text.value, text.x, text.y)
    
    if (text.isSelected || isElementSelected('texts', text.id)) {
      const metrics = ctx.measureText(text.value)
      const textHeight = text.fontSize || 20
      
      ctx.strokeStyle = '#0066cc'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.strokeRect(text.x - 2, text.y - textHeight, metrics.width + 4, textHeight + 4)
      ctx.setLineDash([])
    }
  })
  
  ctx.restore()
}

// EVENTOS DE DIBUJO ACTUALIZADOS
const getEventPosition = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  let clientX = 0, clientY = 0
  
  if (e instanceof MouseEvent) {
    clientX = e.clientX
    clientY = e.clientY
  } else if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  }
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

const startDrawing = (e) => {
  if (!props.isEditMode) return
  
  const pos = getEventPosition(e)

  // NUEVO: Modo selección
  if (props.activeTool === 'select') {
    const element = findElementAtPosition(pos)
    if (element) {
      if (e.ctrlKey || e.metaKey) {
        // Selección múltiple
        toggleElementSelection(element.type, element.element.id || element.element.index?.toString())
      } else {
        // Selección simple
        clearSelection()
        toggleElementSelection(element.type, element.element.id || element.element.index?.toString())
      }
      redrawMainCanvas()
    } else if (!e.ctrlKey && !e.metaKey) {
      clearSelection()
      redrawMainCanvas()
    }
    return
  }

  if (props.activeTool === 'text') {
    floatingInput.value = {
      x: pos.x,
      y: pos.y,
      value: '',
      visible: true
    }
    nextTick(() => {
      const input = document.getElementById('canvas-floating-input')
      if (input) input.focus()
    })
    return
  }

  if (props.activeTool === 'move') {
    const textAtPos = findTextAtPosition(pos)
    if (textAtPos) {
      selectText(textAtPos.id)
      isDraggingText.value = true
      dragOffset.value = {
        x: pos.x - textAtPos.x,
        y: pos.y - textAtPos.y
      }
    } else {
      selectText(null)
    }
    redrawMainCanvas()
    return
  }

  if (["rectangle", "circle", "line"].includes(props.activeTool)) {
    isDrawing.value = true
    drawingShape.value = {
      type: props.activeTool,
      x: pos.x,
      y: pos.y,
      x2: pos.x,
      y2: pos.y,
      color: strokeColor.value,
      width: parseInt(strokeWidth.value)
    }
    return
  }

  if (props.activeTool === 'pencil' || props.activeTool === 'eraser') {
    isDrawing.value = true
    
    currentPath.value = {
      tool: props.activeTool,
      color: strokeColor.value,
      width: parseInt(strokeWidth.value),
      points: [pos]
    }
    
    redrawMainCanvas()
    return
  }
}

const draw = (e) => {
  if (!props.isEditMode) return
  
  const pos = getEventPosition(e)

  if (isDraggingText.value && selectedTextId.value) {
    const textIndex = canvasData.value.texts.findIndex(t => t.id === selectedTextId.value)
    if (textIndex !== -1) {
      canvasData.value.texts[textIndex].x = pos.x - dragOffset.value.x
      canvasData.value.texts[textIndex].y = pos.y - dragOffset.value.y
      redrawMainCanvas()
    }
    return
  }

  if (!isDrawing.value) return

  if (["rectangle", "circle", "line"].includes(props.activeTool) && drawingShape.value) {
    drawingShape.value.x2 = pos.x
    drawingShape.value.y2 = pos.y
    
    redrawMainCanvas()
    drawTemporaryShape()
    return
  }

  if ((props.activeTool === 'pencil' || props.activeTool === 'eraser') && currentPath.value) {
    currentPath.value.points.push(pos)
    redrawMainCanvas()
    return
  }
}

const stopDrawing = () => {
  if (!props.isEditMode) return

  if (isDraggingText.value) {
    isDraggingText.value = false
    saveToHistory()
    debouncedNotifyChange()
    return
  }

  if (["rectangle", "circle", "line"].includes(props.activeTool) && drawingShape.value) {
    canvasData.value.shapes.push({ ...drawingShape.value })
    drawingShape.value = null
    isDrawing.value = false
    
    redrawMainCanvas()
    saveToHistory()
    debouncedNotifyChange()
    emit('update:activeTool', 'pencil')
    return
  }

  if (isDrawing.value && (props.activeTool === 'pencil' || props.activeTool === 'eraser') && currentPath.value) {
    canvasData.value.paths.push({ ...currentPath.value })
    
    currentPath.value = null
    isDrawing.value = false
    
    redrawMainCanvas()
    saveToHistory()
    debouncedNotifyChange()
  }
}

const drawTemporaryShape = () => {
  if (!canvasRef.value || !drawingShape.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.save()
  ctx.strokeStyle = drawingShape.value.color
  ctx.lineWidth = drawingShape.value.width
  ctx.setLineDash([5, 5])
  
  const shape = drawingShape.value
  
  if (shape.type === 'rectangle') {
    ctx.strokeRect(shape.x, shape.y, shape.x2 - shape.x, shape.y2 - shape.y)
  } else if (shape.type === 'circle') {
    const centerX = (shape.x + shape.x2) / 2
    const centerY = (shape.y + shape.y2) / 2
    const radiusX = Math.abs((shape.x2 - shape.x) / 2)
    const radiusY = Math.abs((shape.y2 - shape.y) / 2)
    
    ctx.beginPath()
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
    ctx.stroke()
  } else if (shape.type === 'line') {
    ctx.beginPath()
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.x2, shape.y2)
    ctx.stroke()
  }
  
  ctx.restore()
}

// FUNCIONES DE TEXTO (sin cambios significativos)
const findTextAtPosition = (pos) => {
  if (!canvasRef.value) return null
  
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return null

  for (let i = canvasData.value.texts.length - 1; i >= 0; i--) {
    const text = canvasData.value.texts[i]
    ctx.font = `${text.fontSize || 20}px Arial`
    const metrics = ctx.measureText(text.value)
    const textHeight = text.fontSize || 20

    if (pos.x >= text.x && 
        pos.x <= text.x + metrics.width && 
        pos.y >= text.y - textHeight && 
        pos.y <= text.y) {
      return text
    }
  }
  return null
}

const selectText = (textId) => {
  canvasData.value.texts = canvasData.value.texts.map(text => ({
    ...text,
    isSelected: text.id === textId
  }))
  selectedTextId.value = textId
}

const confirmFloatingInput = () => {
  if (floatingInput.value.visible && floatingInput.value.value.trim() !== '') {
    const newText = {
      id: Date.now().toString(),
      x: floatingInput.value.x,
      y: floatingInput.value.y + 20,
      value: floatingInput.value.value,
      color: strokeColor.value,
      fontSize: 20
    }
    canvasData.value.texts.push(newText)
    redrawMainCanvas()
    saveToHistory()
    debouncedNotifyChange()
  }
  floatingInput.value.visible = false
  floatingInput.value.value = ''
}

const cancelFloatingInput = () => {
  floatingInput.value.visible = false
  floatingInput.value.value = ''
}

// OTRAS FUNCIONES
const clearCanvas = () => {
  canvasData.value = {
    paths: [],
    shapes: [],
    texts: []
  }
  selectText(null)
  clearSelection()
  redrawMainCanvas()
  saveToHistory()
  debouncedNotifyChange()
}

let notifyTimeout = null
const debouncedNotifyChange = () => {
  if (notifyTimeout) {
    clearTimeout(notifyTimeout)
  }
  
  notifyTimeout = setTimeout(() => {
    if (!canvasRef.value) return
    emit('change', {
      drawing: canvasRef.value.toDataURL(),
      timestamp: new Date().toISOString(),
      metadata: {
        width: canvasRef.value.width,
        height: canvasRef.value.height,
        paths: canvasData.value.paths,
        shapes: canvasData.value.shapes,
        texts: canvasData.value.texts
      }
    })
  }, 100)
}

const setTool = (toolId) => {
  emit('update:activeTool', toolId)
  selectText(null)
  clearSelection()
  redrawMainCanvas()
}

const deactivateTool = () => {
  emit('update:activeTool', 'pencil')
  selectText(null)
  clearSelection()
}

// LIFECYCLE
onMounted(() => {
  initializeCanvas()
  window.addEventListener('resize', initializeCanvas)
})

onUnmounted(() => {
  if (notifyTimeout) {
    clearTimeout(notifyTimeout)
  }
  window.removeEventListener('resize', initializeCanvas)
})

// WATCHERS
watch(() => props.initialData, () => {
  canvasKey.value++
  nextTick(() => {
    initializeCanvas()
  })
}, { deep: true })

watch(() => props.isEditMode, (newValue) => {
  if (newValue) {
    if (canvasHistory.value.length === 0) {
      saveToHistory()
    }
  }
})
</script>

<style scoped>
.touch-none {
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
