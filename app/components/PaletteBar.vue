<script setup lang="ts">
import Sortable from 'sortablejs'
import { usePalettes } from '~/composables/usePalettes'

const props = defineProps<{ currentHex: string }>()
const emit = defineEmits<{ pick: [hex: string] }>()

const {
  palettes, activePaletteId, activePalette,
  addPalette, removePalette, renamePalette,
  addSwatch, removeSwatch, reorderSwatches,
} = usePalettes()

// ─── Tab rename ──────────────────────────────────────────────────────────────
const editingId = ref<string | null>(null)
const editingName = ref('')
const renameInput = ref<HTMLInputElement | null>(null)

function startRename(id: string, name: string) {
  editingId.value = id
  editingName.value = name
  nextTick(() => renameInput.value?.select())
}

function commitRename() {
  if (editingId.value) renamePalette(editingId.value, editingName.value)
  editingId.value = null
}

// ─── Sortable ─────────────────────────────────────────────────────────────────
const swatchRow = ref<HTMLElement | null>(null)
let sortable: Sortable | null = null

watch(
  () => activePalette.value?.id,
  async () => {
    await nextTick()
    sortable?.destroy()
    if (!swatchRow.value) return
    sortable = Sortable.create(swatchRow.value, {
      animation: 150,
      ghostClass: 'swatch-ghost',
      filter: '.no-drag',
      onEnd(evt) {
        const swatches = [...(activePalette.value?.swatches ?? [])]
        const [moved] = swatches.splice(evt.oldIndex!, 1)
        if (moved) swatches.splice(evt.newIndex!, 0, moved)
        reorderSwatches(swatches)
      },
    })
  },
  { immediate: true },
)

onUnmounted(() => sortable?.destroy())

// ─── Harmony panel ───────────────────────────────────────────────────────────
const showHarmony = ref(false)
const harmonyRef = ref<HTMLElement | null>(null)

function closeHarmony(e: MouseEvent) {
  if (!harmonyRef.value?.contains(e.target as Node)) showHarmony.value = false
}
watch(showHarmony, v => {
  v ? document.addEventListener('mousedown', closeHarmony)
    : document.removeEventListener('mousedown', closeHarmony)
})

// ─── Export ───────────────────────────────────────────────────────────────────
const showExport = ref(false)
const exportRef = ref<HTMLElement | null>(null)

function closeExport(e: MouseEvent) {
  if (!exportRef.value?.contains(e.target as Node)) showExport.value = false
}
watch(showExport, v => {
  v ? document.addEventListener('mousedown', closeExport)
    : document.removeEventListener('mousedown', closeExport)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', closeHarmony)
  document.removeEventListener('mousedown', closeExport)
})

function exportAs(format: 'css' | 'hex' | 'json') {
  const swatches = activePalette.value?.swatches ?? []
  const text =
    format === 'css'  ? swatches.map((s, i) => `--color-${i + 1}: ${s.hex};`).join('\n') :
    format === 'hex'  ? swatches.map(s => s.hex).join('\n') :
    JSON.stringify(swatches.map(s => s.hex), null, 2)
  navigator.clipboard.writeText(text)
  showExport.value = false
}
</script>

<template>
  <div class="palette-bar">

    <!-- Row 1: tabs + actions -->
    <div class="tabs-row">
      <div class="tabs">
        <button
          v-for="p in palettes"
          :key="p.id"
          :class="['tab', { active: p.id === activePaletteId }]"
          @click="activePaletteId = p.id"
          @dblclick="startRename(p.id, p.name)"
        >
          <template v-if="editingId === p.id">
            <input
              ref="renameInput"
              v-model="editingName"
              class="tab-input"
              @blur="commitRename"
              @keydown.enter="commitRename"
              @keydown.escape="editingId = null"
              @click.stop
            />
          </template>
          <template v-else>
            <span>{{ p.name }}</span>
            <span
              v-if="palettes.length > 1"
              class="tab-close no-drag"
              @click.stop="removePalette(p.id)"
            >×</span>
          </template>
        </button>
        <button class="tab tab-new" title="New palette" @click="addPalette">+</button>
      </div>

      <div class="actions">
        <button class="btn-add" @click="addSwatch(currentHex)">
          <span class="btn-swatch" :style="{ background: currentHex }" />
          + Add
        </button>

        <!-- Harmonies -->
        <div ref="harmonyRef" class="popover-wrap">
          <button class="btn-secondary" @click="showHarmony = !showHarmony">Harmonies</button>
          <Transition name="pop">
            <div v-if="showHarmony" class="popover popover-up popover-right">
              <HarmonyPanel
                :current-hex="currentHex"
                @add="hex => { addSwatch(hex); }"
              />
            </div>
          </Transition>
        </div>

        <!-- Export -->
        <div ref="exportRef" class="popover-wrap">
          <button
            class="btn-secondary"
            :disabled="!activePalette?.swatches.length"
            @click="showExport = !showExport"
          >Export ↗</button>
          <Transition name="pop">
            <div v-if="showExport" class="popover popover-up popover-right export-menu">
              <button @click="exportAs('css')">CSS variables</button>
              <button @click="exportAs('hex')">Hex list</button>
              <button @click="exportAs('json')">JSON array</button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Row 2: swatches -->
    <div class="swatches-outer">
      <div ref="swatchRow" class="swatches-row">
        <div
          v-for="swatch in activePalette?.swatches"
          :key="swatch.id"
          class="swatch-wrap"
        >
          <div
            class="swatch"
            :style="{ background: swatch.hex }"
            :title="swatch.hex"
            @click="emit('pick', swatch.hex)"
          />
          <button class="swatch-remove no-drag" @click="removeSwatch(swatch.id)">×</button>
        </div>
      </div>
      <div v-if="!activePalette?.swatches.length" class="empty-state">
        Hit <strong>+ Add</strong> to save a color — drag to reorder
      </div>
    </div>

  </div>
</template>

<style scoped>
.palette-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: #141414;
  border-radius: 8px;
  border: 1px solid #1e1e1e;
  flex-shrink: 0;
}

/* ── Tabs ──────────────────────────────────────────────── */
.tabs-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tabs {
  display: flex;
  gap: 3px;
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1;
}
.tabs::-webkit-scrollbar { display: none; }

.tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 1px solid #222;
  border-radius: 5px;
  background: transparent;
  color: #555;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}
.tab.active { background: #2a2a2a; color: #ddd; border-color: #333; }
.tab:hover:not(.active) { color: #888; }
.tab-new { padding: 4px 9px; font-size: 14px; color: #444; }
.tab-new:hover { color: #888; }

.tab-close {
  font-size: 13px; color: #444; line-height: 1;
  padding: 0 1px; border-radius: 3px; cursor: pointer;
  transition: color 0.1s;
}
.tab-close:hover { color: #bbb; }

.tab-input {
  width: 90px; background: transparent; border: none;
  border-bottom: 1px solid #555; color: #ddd; font-size: 12px; outline: none; padding: 0;
}

/* ── Actions ──────────────────────────────────────────── */
.actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  background: #1e1e1e;
  border: 1px solid #2e2e2e;
  border-radius: 5px;
  color: #ccc;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.btn-add:hover { background: #2a2a2a; border-color: #3a3a3a; }

.btn-swatch {
  display: inline-block; width: 14px; height: 14px;
  border-radius: 3px; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;
}

.btn-secondary {
  padding: 5px 10px;
  background: transparent;
  border: 1px solid #2a2a2a;
  border-radius: 5px;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s;
  white-space: nowrap;
}
.btn-secondary:hover:not(:disabled) { color: #aaa; border-color: #3a3a3a; }
.btn-secondary:disabled { opacity: 0.3; cursor: default; }

/* ── Popovers ─────────────────────────────────────────── */
.popover-wrap { position: relative; }

.popover {
  position: absolute;
  z-index: 50;
}
.popover-right { right: 0; }
.popover-up { bottom: calc(100% + 8px); }

.export-menu {
  background: #1c1c1c;
  border: 1px solid #2e2e2e;
  border-radius: 6px;
  padding: 4px;
  min-width: 140px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.export-menu button {
  display: block; width: 100%; padding: 7px 10px;
  text-align: left; background: transparent; border: none;
  color: #bbb; font-size: 12px; border-radius: 4px; cursor: pointer;
}
.export-menu button:hover { background: #2a2a2a; color: #fff; }

.pop-enter-active { transition: opacity 0.1s, transform 0.1s; }
.pop-leave-active { transition: opacity 0.12s, transform 0.12s; }
.pop-enter-from  { opacity: 0; transform: translateY(4px); }
.pop-leave-to    { opacity: 0; transform: translateY(4px); }

/* ── Swatches ─────────────────────────────────────────── */
.swatches-outer { position: relative; min-height: 52px; }

.swatches-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: thin;
  scrollbar-color: #2a2a2a transparent;
  min-height: 50px;
  align-items: center;
}

.swatch-wrap { position: relative; flex-shrink: 0; width: 44px; height: 44px; }

.swatch {
  width: 100%; height: 100%;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}
.swatch:hover { transform: scale(1.08); box-shadow: 0 4px 12px rgba(0,0,0,0.5); }

.swatch-remove {
  position: absolute; top: -5px; right: -5px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #222; border: 1px solid #3a3a3a;
  color: #888; font-size: 11px; line-height: 1;
  cursor: pointer; display: none; align-items: center;
  justify-content: center; padding: 0;
  transition: background 0.1s, color 0.1s;
}
.swatch-wrap:hover .swatch-remove { display: flex; }
.swatch-remove:hover { background: #3a3a3a; color: #fff; }

:global(.swatch-ghost) { opacity: 0.3; }

.empty-state {
  position: absolute; inset: 0;
  display: flex; align-items: center;
  color: #2e2e2e; font-size: 13px;
  pointer-events: none;
}
.empty-state strong { color: #3a3a3a; margin: 0 3px; }
</style>
