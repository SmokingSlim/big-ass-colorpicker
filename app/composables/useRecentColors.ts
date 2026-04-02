const MAX = 16
const STORAGE_KEY = 'bac-recent'

// Module-level singleton — shared across all callers
const recent = ref<string[]>(load())
let debounce: ReturnType<typeof setTimeout> | null = null

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function useRecentColors() {
  function push(hex: string) {
    if (debounce) clearTimeout(debounce)
    debounce = setTimeout(() => {
      recent.value = [hex, ...recent.value.filter(h => h !== hex)].slice(0, MAX)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.value))
    }, 350)
  }

  return { recent: readonly(recent), push }
}
