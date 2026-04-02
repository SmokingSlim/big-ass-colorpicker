<script setup lang="ts">
import { converter, parse } from 'culori'
import type { ColorSpaceDef, AxisDef } from '~/composables/useColorSpace'

const props = defineProps<{
  colorSpace: ColorSpaceDef
  channels: Record<string, number>
  hex: string
}>()

const emit = defineEmits<{
  channelChange: [key: string, value: number]
  hexChange: [hex: string]
}>()

// ─── Axes ────────────────────────────────────────────────────────────────────
const axes = computed(() => [
  props.colorSpace.stripAxis,
  props.colorSpace.xAxis,
  props.colorSpace.yAxis,
])

function display(min: number, max: number, val: number): string {
  return max <= 1 ? Math.round((val ?? 0) * 100).toString() : Math.round(val ?? 0).toString()
}

function parseVal(min: number, max: number, raw: string): number {
  const n = parseFloat(raw)
  if (isNaN(n)) return min
  const v = max <= 1 ? n / 100 : n
  return Math.max(min, Math.min(max, v))
}

function unit(max: number) { return max <= 1 ? '%' : '°' }

// ─── Keyboard nudges ─────────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent, axis: AxisDef) {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
  e.preventDefault()
  const dir = e.key === 'ArrowUp' ? 1 : -1
  const step = e.shiftKey ? 10 : 1
  const isPercent = axis.max <= 1
  const current = props.channels[axis.key] ?? axis.min
  const currentDisplay = isPercent ? current * 100 : current
  const displayMax = isPercent ? 100 : axis.max
  const displayMin = isPercent ? 0 : axis.min
  const next = Math.max(displayMin, Math.min(displayMax, currentDisplay + dir * step))
  emit('channelChange', axis.key, isPercent ? next / 100 : next)
}

// ─── Hex input ───────────────────────────────────────────────────────────────
const hexInput = ref(props.hex)
watch(() => props.hex, v => { hexInput.value = v })

function onHexCommit() {
  if (/^#[0-9a-fA-F]{6}$/.test(hexInput.value)) emit('hexChange', hexInput.value)
  else hexInput.value = props.hex
}

// ─── Copy format ─────────────────────────────────────────────────────────────
type Format = 'HEX' | 'RGB' | 'HSL' | 'OKLCH'
const formats: Format[] = ['HEX', 'RGB', 'HSL', 'OKLCH']
const copied = ref<Format | null>(null)

function formatColor(fmt: Format): string {
  const parsed = parse(props.hex)
  if (!parsed) return props.hex
  switch (fmt) {
    case 'HEX': return props.hex
    case 'RGB': {
      const c = converter('rgb')(parsed)
      if (!c) return props.hex
      const r = Math.round((c.r ?? 0) * 255)
      const g = Math.round((c.g ?? 0) * 255)
      const b = Math.round((c.b ?? 0) * 255)
      return `rgb(${r} ${g} ${b})`
    }
    case 'HSL': {
      const c = converter('hsl')(parsed)
      if (!c) return props.hex
      return `hsl(${Math.round(c.h ?? 0)} ${Math.round((c.s ?? 0) * 100)}% ${Math.round((c.l ?? 0) * 100)}%)`
    }
    case 'OKLCH': {
      const c = converter('oklch')(parsed)
      if (!c) return props.hex
      return `oklch(${((c.l ?? 0) * 100).toFixed(1)}% ${(c.c ?? 0).toFixed(3)} ${Math.round(c.h ?? 0)})`
    }
  }
}

function copyAs(fmt: Format) {
  navigator.clipboard.writeText(formatColor(fmt))
  copied.value = fmt
  setTimeout(() => { copied.value = null }, 1400)
}

// ─── EyeDropper ──────────────────────────────────────────────────────────────
const hasEyeDropper = import.meta.client && 'EyeDropper' in window

async function pickFromScreen() {
  try {
    const dropper = new (window as any).EyeDropper()
    const { sRGBHex } = await dropper.open()
    emit('hexChange', sRGBHex)
  } catch {} // user cancelled
}
</script>

<template>
  <div class="color-inputs">
    <!-- Channel inputs row -->
    <div class="row-channels">
      <div v-for="axis in axes" :key="axis.key" class="field">
        <label>{{ axis.label.slice(0, 1) }}</label>
        <input
          type="number"
          :min="axis.max <= 1 ? 0 : axis.min"
          :max="axis.max <= 1 ? 100 : axis.max"
          :value="display(axis.min, axis.max, channels[axis.key] ?? axis.min)"
          @change="e => emit('channelChange', axis.key, parseVal(axis.min, axis.max, (e.target as HTMLInputElement).value))"
          @keydown="e => onKeydown(e, axis)"
        />
        <span class="unit">{{ unit(axis.max) }}</span>
      </div>

      <div class="sep" />

      <div class="field hex-field">
        <label>HEX</label>
        <input
          v-model="hexInput"
          type="text"
          maxlength="7"
          spellcheck="false"
          @change="onHexCommit"
        />
      </div>

      <button v-if="hasEyeDropper" class="eyedrop-btn" title="Pick from screen" @click="pickFromScreen">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 22l1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8Z"/>
        </svg>
      </button>

      <div class="swatch" :style="{ background: hex }" />
    </div>

    <!-- Copy format row -->
    <div class="row-copy">
      <span class="copy-label">Copy as</span>
      <button
        v-for="fmt in formats"
        :key="fmt"
        :class="['fmt-btn', { active: copied === fmt }]"
        @click="copyAs(fmt)"
      >
        {{ copied === fmt ? '✓' : fmt }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.color-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Channel row ──────────────────────────────────────── */
.row-channels {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.field { display: flex; align-items: center; gap: 5px; }

label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #555;
  width: 18px;
  flex-shrink: 0;
}
.hex-field label { width: auto; }

input[type='number'] {
  width: 54px;
  padding: 5px 8px;
  border: 1px solid #2a2a2a;
  border-radius: 4px;
  background: #111;
  color: #e0e0e0;
  font-size: 13px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  text-align: right;
  -moz-appearance: textfield;
}
input[type='number']::-webkit-inner-spin-button { display: none; }
input[type='number']:focus { outline: none; border-color: #3a3a3a; }

input[type='text'] {
  width: 88px;
  padding: 5px 8px;
  border: 1px solid #2a2a2a;
  border-radius: 4px;
  background: #111;
  color: #e0e0e0;
  font-size: 13px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 1px;
}
input[type='text']:focus { outline: none; border-color: #3a3a3a; }

.unit { font-size: 11px; color: #3a3a3a; width: 12px; }

.sep {
  width: 1px;
  height: 24px;
  background: #222;
  margin: 0 2px;
}

.eyedrop-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: transparent;
  border: 1px solid #2a2a2a;
  border-radius: 5px;
  color: #555;
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s;
}
.eyedrop-btn:hover { color: #aaa; border-color: #3a3a3a; }

.swatch {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.07);
  margin-left: auto;
  flex-shrink: 0;
}

/* ── Copy row ─────────────────────────────────────────── */
.row-copy {
  display: flex;
  align-items: center;
  gap: 6px;
}

.copy-label {
  font-size: 11px;
  color: #3a3a3a;
  margin-right: 2px;
}

.fmt-btn {
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #222;
  border-radius: 4px;
  background: transparent;
  color: #555;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
  min-width: 52px;
}
.fmt-btn:hover { color: #aaa; border-color: #333; }
.fmt-btn.active { background: #1e3a2a; border-color: #2a5a3a; color: #4ade80; }
</style>
