<script setup lang="ts">
import { converter, formatHex } from 'culori'
import type { ColorSpaceDef } from '~/composables/useColorSpace'

const props = defineProps<{
  colorSpace: ColorSpaceDef
  stripValue: number
  cursorX: number
  cursorY: number
}>()

const emit = defineEmits<{
  change: [x: number, y: number]
}>()

const toRgb = converter('rgb')
const wrapper = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const magnifierCanvas = ref<HTMLCanvasElement | null>(null)
const isDragging = ref(false)
let pendingDraw = false

// ─── Main canvas ────────────────────────────────────────────────────────────

function scheduleDraw() {
  if (pendingDraw) return
  pendingDraw = true
  requestAnimationFrame(() => {
    pendingDraw = false
    draw()
    if (isDragging.value) drawMagnifier()
  })
}

function draw() {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return
  const { width, height } = el
  if (width === 0 || height === 0) return

  if (props.colorSpace.renderMode === 'gradient') {
    drawGradient(ctx, width, height)
  } else {
    drawPixel(ctx, width, height)
  }
}

function drawGradient(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const { mode, stripAxis, xAxis, yAxis } = props.colorSpace
  const rgb = toRgb({ mode, [stripAxis.key]: props.stripValue, [xAxis.key]: xAxis.max, [yAxis.key]: yAxis.max } as any)
  const hueHex = rgb ? (formatHex(rgb) ?? '#ff0000') : '#ff0000'

  const gradX = ctx.createLinearGradient(0, 0, w, 0)
  gradX.addColorStop(0, '#ffffff')
  gradX.addColorStop(1, hueHex)
  ctx.fillStyle = gradX
  ctx.fillRect(0, 0, w, h)

  const gradY = ctx.createLinearGradient(0, 0, 0, h)
  gradY.addColorStop(0, 'rgba(0,0,0,0)')
  gradY.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.fillStyle = gradY
  ctx.fillRect(0, 0, w, h)
}

function drawPixel(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const { mode, stripAxis, xAxis, yAxis } = props.colorSpace
  const strip = props.stripValue
  const STEP = 4
  const imageData = ctx.createImageData(w, h)

  for (let py = 0; py < h; py += STEP) {
    for (let px = 0; px < w; px += STEP) {
      const xVal = xAxis.min + (px / w) * (xAxis.max - xAxis.min)
      const yVal = yAxis.min + (1 - py / h) * (yAxis.max - yAxis.min)
      const rgb = toRgb({ mode, [stripAxis.key]: strip, [xAxis.key]: xVal, [yAxis.key]: yVal } as any)
      const r = rgb ? Math.round(Math.max(0, Math.min(1, rgb.r ?? 0)) * 255) : 80
      const g = rgb ? Math.round(Math.max(0, Math.min(1, rgb.g ?? 0)) * 255) : 80
      const b = rgb ? Math.round(Math.max(0, Math.min(1, rgb.b ?? 0)) * 255) : 80
      for (let dy = 0; dy < STEP && py + dy < h; dy++) {
        for (let dx = 0; dx < STEP && px + dx < w; dx++) {
          const i = ((py + dy) * w + (px + dx)) * 4
          imageData.data[i] = r; imageData.data[i + 1] = g
          imageData.data[i + 2] = b; imageData.data[i + 3] = 255
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

watch([() => props.stripValue, () => props.colorSpace.id], scheduleDraw)

// ─── Magnifier ──────────────────────────────────────────────────────────────

const MAG_SIZE = 150  // display diameter in CSS px
const SAMPLE = 21     // canvas pixels to sample (odd → exact center pixel)
const ZOOM = MAG_SIZE / SAMPLE

// Magnifier position: right of cursor, flip to left near right edge
const magnifierStyle = computed(() => {
  const wrap = wrapper.value
  if (!wrap) return {}
  const OFFSET = 28
  const cx = props.cursorX * wrap.offsetWidth
  const cy = props.cursorY * wrap.offsetHeight
  const w = wrap.offsetWidth
  const h = wrap.offsetHeight

  let left = cx + OFFSET
  if (left + MAG_SIZE > w - 8) left = cx - OFFSET - MAG_SIZE

  let top = cy - MAG_SIZE / 2
  top = Math.max(8, Math.min(h - MAG_SIZE - 8, top))

  return { left: `${Math.round(left)}px`, top: `${Math.round(top)}px` }
})

function drawMagnifier() {
  const src = canvas.value
  const mag = magnifierCanvas.value
  if (!src || !mag) return
  const srcCtx = src.getContext('2d')
  const magCtx = mag.getContext('2d')
  if (!srcCtx || !magCtx) return

  const cw = src.width
  const ch = src.height
  const cpx = props.cursorX * cw
  const cpy = props.cursorY * ch
  const half = Math.floor(SAMPLE / 2)
  const sx = Math.round(Math.max(0, Math.min(cw - SAMPLE, cpx - half)))
  const sy = Math.round(Math.max(0, Math.min(ch - SAMPLE, cpy - half)))

  // Grab pixels from main canvas and stamp into a tiny temp canvas
  const patch = srcCtx.getImageData(sx, sy, SAMPLE, SAMPLE)
  const tmp = document.createElement('canvas')
  tmp.width = SAMPLE; tmp.height = SAMPLE
  tmp.getContext('2d')!.putImageData(patch, 0, 0)

  // Scale up — pixelated so you see the actual samples
  magCtx.imageSmoothingEnabled = false
  magCtx.clearRect(0, 0, MAG_SIZE, MAG_SIZE)
  magCtx.drawImage(tmp, 0, 0, MAG_SIZE, MAG_SIZE)

  // Center-pixel highlight + crosshair
  const cx = MAG_SIZE / 2
  const cy = MAG_SIZE / 2
  const cell = ZOOM

  // Highlight box around the exact picked pixel
  magCtx.strokeStyle = 'rgba(255,255,255,0.9)'
  magCtx.lineWidth = 1.5
  magCtx.strokeRect(cx - cell / 2 + 0.5, cy - cell / 2 + 0.5, cell - 1, cell - 1)

  // Hairline crosshair, broken around center cell
  magCtx.strokeStyle = 'rgba(255,255,255,0.5)'
  magCtx.lineWidth = 1
  magCtx.beginPath()
  magCtx.moveTo(cx, 0);         magCtx.lineTo(cx, cy - cell / 2)
  magCtx.moveTo(cx, cy + cell / 2); magCtx.lineTo(cx, MAG_SIZE)
  magCtx.moveTo(0, cy);         magCtx.lineTo(cx - cell / 2, cy)
  magCtx.moveTo(cx + cell / 2, cy); magCtx.lineTo(MAG_SIZE, cy)
  magCtx.stroke()
}

// ─── Pointer interaction ─────────────────────────────────────────────────────

function clamp01(v: number) { return Math.max(0, Math.min(1, v)) }

function coordsFromEvent(e: PointerEvent): [number, number] {
  const el = canvas.value!
  const rect = el.getBoundingClientRect()
  return [
    clamp01((e.clientX - rect.left) / rect.width),
    clamp01((e.clientY - rect.top) / rect.height),
  ]
}

function onPointerDown(e: PointerEvent) {
  isDragging.value = true
  canvas.value!.setPointerCapture(e.pointerId)
  emit('change', ...coordsFromEvent(e))
  nextTick(drawMagnifier)
}

function onPointerMove(e: PointerEvent) {
  if (!canvas.value!.hasPointerCapture(e.pointerId)) return
  emit('change', ...coordsFromEvent(e))
  nextTick(drawMagnifier)
}

function onPointerUp() {
  isDragging.value = false
}

// ─── Resize ──────────────────────────────────────────────────────────────────

let ro: ResizeObserver | null = null
onMounted(() => {
  ro = new ResizeObserver(() => {
    const el = canvas.value
    const wrap = wrapper.value
    if (!el || !wrap) return
    el.width = wrap.offsetWidth
    el.height = wrap.offsetHeight
    draw()
  })
  ro.observe(wrapper.value!)
})
onUnmounted(() => ro?.disconnect())
</script>

<template>
  <div ref="wrapper" class="picker-wrap">
    <!-- Canvas lives in its own clip so the magnifier can overflow the wrapper -->
    <div class="canvas-clip">
      <canvas
        ref="canvas"
        class="picker-canvas"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @lostpointercapture="onPointerUp"
      />
    </div>

    <div
      class="crosshair"
      :style="{ left: `${cursorX * 100}%`, top: `${cursorY * 100}%` }"
    />

    <Transition name="loupe">
      <div v-if="isDragging" class="magnifier-wrap" :style="magnifierStyle">
        <canvas ref="magnifierCanvas" :width="MAG_SIZE" :height="MAG_SIZE" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.picker-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  user-select: none;
}

.canvas-clip {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
}

.picker-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.crosshair {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1.5px #000, inset 0 0 0 1.5px #000;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.magnifier-wrap {
  position: absolute;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  z-index: 20;
  backdrop-filter: none;
}

.magnifier-wrap canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

/* Snap in, fade out */
.loupe-enter-active { transition: opacity 0.08s, transform 0.08s; }
.loupe-leave-active { transition: opacity 0.15s, transform 0.15s; }
.loupe-enter-from  { opacity: 0; transform: scale(0.85); }
.loupe-leave-to    { opacity: 0; transform: scale(0.9); }
</style>
