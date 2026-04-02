export interface Swatch {
  id: string
  hex: string
}

export interface Palette {
  id: string
  name: string
  swatches: Swatch[]
}

const STORAGE_KEY = 'bac-palettes'
const ACTIVE_KEY  = 'bac-active-palette'

export function usePalettes() {
  const palettes = ref<Palette[]>(loadPalettes())
  const activePaletteId = ref<string>(loadActiveId(palettes.value))

  watch(palettes, v => localStorage.setItem(STORAGE_KEY, JSON.stringify(v)), { deep: true })
  watch(activePaletteId, v => localStorage.setItem(ACTIVE_KEY, v))

  const activePalette = computed(
    () => palettes.value.find(p => p.id === activePaletteId.value) ?? palettes.value[0],
  )

  function addPalette() {
    const p: Palette = {
      id: crypto.randomUUID(),
      name: `Palette ${palettes.value.length + 1}`,
      swatches: [],
    }
    palettes.value.push(p)
    activePaletteId.value = p.id
  }

  function removePalette(id: string) {
    if (palettes.value.length === 1) return   // always keep one
    const idx = palettes.value.findIndex(p => p.id === id)
    if (idx === -1) return
    palettes.value.splice(idx, 1)
    if (activePaletteId.value === id)
      activePaletteId.value = palettes.value[Math.max(0, idx - 1)].id
  }

  function renamePalette(id: string, name: string) {
    const p = palettes.value.find(p => p.id === id)
    if (p) p.name = name.trim() || p.name
  }

  function addSwatch(hex: string) {
    activePalette.value?.swatches.push({ id: crypto.randomUUID(), hex })
  }

  function removeSwatch(swatchId: string) {
    const swatches = activePalette.value?.swatches
    if (!swatches) return
    const idx = swatches.findIndex(s => s.id === swatchId)
    if (idx !== -1) swatches.splice(idx, 1)
  }

  function reorderSwatches(newOrder: Swatch[]) {
    const p = activePalette.value
    if (p) p.swatches = newOrder
  }

  return {
    palettes,
    activePaletteId,
    activePalette,
    addPalette,
    removePalette,
    renamePalette,
    addSwatch,
    removeSwatch,
    reorderSwatches,
  }
}

function loadPalettes(): Palette[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {}
  return [{ id: crypto.randomUUID(), name: 'Palette 1', swatches: [] }]
}

function loadActiveId(palettes: Palette[]): string {
  try {
    const id = localStorage.getItem(ACTIVE_KEY)
    if (id && palettes.some(p => p.id === id)) return id
  } catch {}
  return palettes[0]?.id ?? ''
}
