<script setup lang="ts">
import type { AxisDef } from '~/composables/useColorSpace'

const props = defineProps<{
  axis: AxisDef
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const strip = ref<HTMLDivElement | null>(null)

// For hue axes, use the rainbow gradient; otherwise a plain min→max ramp
const gradientStyle = computed(() => {
  if (props.axis.circular && props.axis.max === 360) {
    return {
      background:
        'linear-gradient(to right,' +
        'hsl(0,100%,50%),hsl(30,100%,50%),hsl(60,100%,50%),' +
        'hsl(90,100%,50%),hsl(120,100%,50%),hsl(150,100%,50%),' +
        'hsl(180,100%,50%),hsl(210,100%,50%),hsl(240,100%,50%),' +
        'hsl(270,100%,50%),hsl(300,100%,50%),hsl(330,100%,50%),' +
        'hsl(360,100%,50%))',
    }
  }
  return { background: 'linear-gradient(to right, #000, #fff)' }
})

const thumbPct = computed(() => {
  const { min, max } = props.axis
  return ((props.modelValue - min) / (max - min)) * 100
})

function valueFromEvent(e: PointerEvent): number {
  const el = strip.value!
  const rect = el.getBoundingClientRect()
  const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  return props.axis.min + t * (props.axis.max - props.axis.min)
}

function onPointerDown(e: PointerEvent) {
  strip.value!.setPointerCapture(e.pointerId)
  emit('update:modelValue', valueFromEvent(e))
}

function onPointerMove(e: PointerEvent) {
  if (!strip.value!.hasPointerCapture(e.pointerId)) return
  emit('update:modelValue', valueFromEvent(e))
}
</script>

<template>
  <div class="strip-row">
    <span class="strip-label">{{ axis.label }}</span>
    <div
      ref="strip"
      class="strip"
      :style="gradientStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
    >
      <div class="thumb" :style="{ left: `${thumbPct}%` }" />
    </div>
  </div>
</template>

<style scoped>
.strip-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.strip-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #666;
  width: 48px;
  flex-shrink: 0;
}

.strip {
  flex: 1;
  height: 20px;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  user-select: none;
}

.thumb {
  position: absolute;
  top: 50%;
  width: 22px;
  height: 22px;
  background: #fff;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1.5px #000, 0 2px 6px rgba(0,0,0,0.5);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>
