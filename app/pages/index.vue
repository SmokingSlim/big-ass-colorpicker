<script setup lang="ts">
import { COLOR_SPACES, type ColorSpaceId } from '~/composables/useColorSpace'
import { useColorPicker } from '~/composables/useColorPicker'
import { useRecentColors } from '~/composables/useRecentColors'

const {
  channels, cssColor, colorSpace, activeSpaceId,
  setSpace, setChannel, setFromHex, stripValue,
  canvasX, canvasY, setFromCanvas,
} = useColorPicker()

const { recent, push: pushRecent } = useRecentColors()

// Auto-push to recent with debounce built into composable
watch(cssColor, pushRecent)

const spaces = Object.values(COLOR_SPACES)

// ─── Contrast checker ────────────────────────────────────────────────────────
const showContrast = ref(false)
const contrastRef = ref<HTMLElement | null>(null)

function closeContrast(e: MouseEvent) {
  if (!contrastRef.value?.contains(e.target as Node)) showContrast.value = false
}
watch(showContrast, v => {
  v ? document.addEventListener('mousedown', closeContrast)
    : document.removeEventListener('mousedown', closeContrast)
})
onUnmounted(() => document.removeEventListener('mousedown', closeContrast))
</script>

<template>
  <div class="app">
    <header class="toolbar">
      <div class="space-tabs">
        <button
          v-for="s in spaces"
          :key="s.id"
          :class="['tab', { active: activeSpaceId === s.id }]"
          @click="setSpace(s.id as ColorSpaceId)"
        >
          {{ s.label }}
        </button>
      </div>

      <div class="toolbar-actions">
        <!-- Contrast checker -->
        <div ref="contrastRef" class="popover-wrap">
          <button
            :class="['tool-btn', { active: showContrast }]"
            title="Contrast checker"
            @click="showContrast = !showContrast"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" stroke="none"/>
            </svg>
            Contrast
          </button>
          <Transition name="pop">
            <div v-if="showContrast" class="popover popover-down popover-right">
              <ContrastChecker :current-hex="cssColor" />
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <main class="canvas-area">
      <PickerCanvas
        :color-space="colorSpace"
        :strip-value="stripValue"
        :cursor-x="canvasX"
        :cursor-y="canvasY"
        @change="(x, y) => setFromCanvas(x, y)"
      />
    </main>

    <footer class="controls">
      <HueStrip v-model="stripValue" :axis="colorSpace.stripAxis" />
      <ColorInputs
        :color-space="colorSpace"
        :channels="channels"
        :hex="cssColor"
        @channel-change="setChannel"
        @hex-change="setFromHex"
      />
      <RecentColors :colors="recent" @pick="setFromHex" />
    </footer>

    <PaletteBar :current-hex="cssColor" @pick="setFromHex" />
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  background: #0d0d0d;
  color: #e0e0e0;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}
</style>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 12px 16px 16px;
  gap: 10px;
}

/* ── Toolbar ──────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.space-tabs {
  display: flex;
  gap: 4px;
  background: #1a1a1a;
  padding: 3px;
  border-radius: 7px;
  border: 1px solid #222;
}

.tab {
  padding: 5px 14px;
  border: none;
  background: transparent;
  color: #555;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: background 0.15s, color 0.15s;
}
.tab.active { background: #2e2e2e; color: #e0e0e0; }
.tab:hover:not(.active) { color: #888; }

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: transparent;
  border: 1px solid #222;
  border-radius: 6px;
  color: #555;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s, background 0.12s;
}
.tool-btn:hover { color: #aaa; border-color: #333; }
.tool-btn.active { background: #1a1a1a; color: #ddd; border-color: #333; }

/* ── Popovers ─────────────────────────────────────────── */
.popover-wrap { position: relative; }

.popover { position: absolute; z-index: 50; }
.popover-right { right: 0; }
.popover-down { top: calc(100% + 8px); }

.pop-enter-active { transition: opacity 0.1s, transform 0.1s; }
.pop-leave-active { transition: opacity 0.12s, transform 0.12s; }
.pop-enter-from  { opacity: 0; transform: translateY(-4px); }
.pop-leave-to    { opacity: 0; transform: translateY(-4px); }

/* ── Main areas ───────────────────────────────────────── */
.canvas-area { flex: 1; min-height: 0; }

.controls {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: #141414;
  border-radius: 8px;
  border: 1px solid #1e1e1e;
}
</style>
