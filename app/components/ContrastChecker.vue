<script setup lang="ts">
import { wcagLuminance } from 'culori'

const props = defineProps<{ currentHex: string }>()

const fg = ref('#ffffff')
const bg = ref('#000000')

function ratio(a: string, b: string): number {
  const l1 = wcagLuminance(a) ?? 0
  const l2 = wcagLuminance(b) ?? 0
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

const contrast = computed(() => ratio(fg.value, bg.value))

function badge(threshold: number) {
  return contrast.value >= threshold
}

const grades = computed(() => [
  { label: 'AA',        pass: badge(4.5), note: 'Normal text' },
  { label: 'AA Large',  pass: badge(3),   note: 'Large text'  },
  { label: 'AAA',       pass: badge(7),   note: 'Normal text' },
  { label: 'AAA Large', pass: badge(4.5), note: 'Large text'  },
])
</script>

<template>
  <div class="contrast">
    <div class="panel-header">Contrast Checker</div>

    <div class="pickers">
      <div class="color-slot">
        <div class="slot-swatch" :style="{ background: fg }" />
        <input v-model="fg" type="text" maxlength="7" spellcheck="false" class="hex-input" />
        <button class="use-btn" @click="fg = currentHex">Use current</button>
      </div>
      <span class="vs">vs</span>
      <div class="color-slot">
        <div class="slot-swatch" :style="{ background: bg }" />
        <input v-model="bg" type="text" maxlength="7" spellcheck="false" class="hex-input" />
        <button class="use-btn" @click="bg = currentHex">Use current</button>
      </div>
    </div>

    <!-- Preview -->
    <div class="preview" :style="{ background: bg, color: fg }">
      <span class="preview-normal">Aa</span>
      <span class="preview-large">Aa</span>
    </div>

    <!-- Ratio -->
    <div class="ratio-row">
      <span class="ratio-num">{{ contrast.toFixed(2) }}</span>
      <span class="ratio-unit">: 1</span>
    </div>

    <!-- Grades -->
    <div class="grades">
      <div v-for="g in grades" :key="g.label" :class="['grade', g.pass ? 'pass' : 'fail']">
        <span class="grade-icon">{{ g.pass ? '✓' : '✗' }}</span>
        <span class="grade-label">{{ g.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contrast {
  background: #1a1a1a;
  border: 1px solid #2e2e2e;
  border-radius: 8px;
  padding: 12px 14px;
  width: 300px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
}

.panel-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #555;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.pickers {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.color-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.slot-swatch {
  width: 100%;
  height: 32px;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.07);
}

.hex-input {
  width: 100%;
  padding: 4px 7px;
  background: #111;
  border: 1px solid #2a2a2a;
  border-radius: 4px;
  color: #ddd;
  font-size: 12px;
  font-family: 'SF Mono', monospace;
  letter-spacing: 0.5px;
}
.hex-input:focus { outline: none; border-color: #3a3a3a; }

.use-btn {
  font-size: 10px;
  color: #555;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 0;
  transition: color 0.1s;
}
.use-btn:hover { color: #aaa; }

.vs {
  font-size: 11px;
  color: #333;
  flex-shrink: 0;
  align-self: center;
  margin-top: 4px;
}

.preview {
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
  border: 1px solid rgba(255,255,255,0.05);
}
.preview-normal { font-size: 14px; }
.preview-large  { font-size: 22px; font-weight: 700; }

.ratio-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 10px;
}
.ratio-num {
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: #e0e0e0;
}
.ratio-unit { font-size: 16px; color: #555; }

.grades {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}

.grade {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 5px;
  font-size: 12px;
}
.grade.pass { background: rgba(34,197,94,0.1);  color: #4ade80; }
.grade.fail { background: rgba(239,68,68,0.08); color: #666; }

.grade-icon { font-size: 11px; }
.grade-label { font-weight: 600; }
</style>
