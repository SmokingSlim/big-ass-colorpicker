<script setup lang="ts">
import { converter, formatHex, parse } from 'culori'

const props = defineProps<{ currentHex: string }>()
const emit = defineEmits<{ add: [hex: string] }>()

const toHsl = converter('hsl')
const toRgb = converter('rgb')

function rotate(h: number, s: number, l: number, deg: number): string {
  const rgb = toRgb({ mode: 'hsl', h: ((h + deg) % 360 + 360) % 360, s, l })
  return rgb ? (formatHex(rgb) ?? props.currentHex) : props.currentHex
}

const harmonies = computed(() => {
  const parsed = parse(props.currentHex)
  if (!parsed) return []
  const hsl = toHsl(parsed)
  if (!hsl) return []
  const { h = 0, s = 0, l = 0 } = hsl

  return [
    {
      name: 'Complementary',
      colors: [rotate(h, s, l, 180)],
    },
    {
      name: 'Analogous',
      colors: [rotate(h, s, l, -30), rotate(h, s, l, 30)],
    },
    {
      name: 'Triadic',
      colors: [rotate(h, s, l, 120), rotate(h, s, l, 240)],
    },
    {
      name: 'Split-comp',
      colors: [rotate(h, s, l, 150), rotate(h, s, l, 210)],
    },
    {
      name: 'Tetradic',
      colors: [rotate(h, s, l, 90), rotate(h, s, l, 180), rotate(h, s, l, 270)],
    },
  ]
})
</script>

<template>
  <div class="harmony-panel">
    <div class="panel-header">Harmonies</div>
    <div class="rows">
      <div v-for="group in harmonies" :key="group.name" class="row">
        <span class="row-label">{{ group.name }}</span>
        <div class="swatches">
          <!-- Source color for reference -->
          <div class="swatch source" :style="{ background: currentHex }" title="Current" />
          <div class="divider" />
          <!-- Generated harmonies -->
          <button
            v-for="hex in group.colors"
            :key="hex"
            class="swatch"
            :style="{ background: hex }"
            :title="hex"
            @click="emit('add', hex)"
          />
        </div>
        <button class="add-all" @click="group.colors.forEach(h => emit('add', h))">
          + all
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.harmony-panel {
  background: #1a1a1a;
  border: 1px solid #2e2e2e;
  border-radius: 8px;
  padding: 10px 12px;
  min-width: 280px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
}

.panel-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #555;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-label {
  font-size: 11px;
  color: #555;
  width: 80px;
  flex-shrink: 0;
}

.swatches {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.swatch {
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.07);
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s;
  flex-shrink: 0;
}
.swatch:hover { transform: scale(1.15); }
.swatch.source { cursor: default; opacity: 0.5; }
.swatch.source:hover { transform: none; }

.divider {
  width: 1px;
  height: 20px;
  background: #2a2a2a;
  margin: 0 2px;
}

.add-all {
  font-size: 10px;
  color: #444;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  white-space: nowrap;
  transition: color 0.1s;
}
.add-all:hover { color: #888; }
</style>
