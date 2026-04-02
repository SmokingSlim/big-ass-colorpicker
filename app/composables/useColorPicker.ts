import { converter, formatHex, parse } from 'culori'
import { COLOR_SPACES, type ColorSpaceId } from './useColorSpace'

const toRgb = converter('rgb')

export function useColorPicker() {
  const activeSpaceId = ref<ColorSpaceId>('hsv')
  const colorSpace = computed(() => COLOR_SPACES[activeSpaceId.value])

  // Canonical state: a single hex string. Everything derives from it.
  const currentHex = ref('#ff0000')

  // Channels in the current color space, derived from hex
  const channels = computed<Record<string, number>>(() => {
    const parsed = parse(currentHex.value)
    if (!parsed) return { ...colorSpace.value.defaults }
    const convert = converter(colorSpace.value.mode)
    const result = convert(parsed)
    if (!result) return { ...colorSpace.value.defaults }
    const { mode: _m, ...rest } = result as any
    return rest as Record<string, number>
  })

  const cssColor = computed(() => currentHex.value)

  function channelsToHex(ch: Record<string, number>): string {
    const rgb = toRgb({ mode: colorSpace.value.mode, ...ch } as any)
    if (!rgb) return currentHex.value
    return formatHex(rgb) ?? currentHex.value
  }

  function setChannel(key: string, value: number) {
    currentHex.value = channelsToHex({ ...channels.value, [key]: value })
  }

  function setFromHex(hex: string) {
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) currentHex.value = hex
  }

  function setSpace(id: ColorSpaceId) {
    // hex stays unchanged — channels recompute via the new space's converter
    activeSpaceId.value = id
  }

  // Writable computed for the strip axis (hue by default)
  const stripValue = computed({
    get: () => channels.value[colorSpace.value.stripAxis.key]
      ?? colorSpace.value.defaults[colorSpace.value.stripAxis.key]
      ?? 0,
    set: (v: number) => setChannel(colorSpace.value.stripAxis.key, v),
  })

  // Normalized 0-1 canvas cursor position
  const canvasX = computed(() => {
    const { key, min, max } = colorSpace.value.xAxis
    return ((channels.value[key] ?? min) - min) / (max - min)
  })

  const canvasY = computed(() => {
    const { key, min, max } = colorSpace.value.yAxis
    // Inverted: high value = top of canvas
    return 1 - ((channels.value[key] ?? max) - min) / (max - min)
  })

  function setFromCanvas(nx: number, ny: number) {
    const { xAxis, yAxis } = colorSpace.value
    currentHex.value = channelsToHex({
      ...channels.value,
      [xAxis.key]: xAxis.min + nx * (xAxis.max - xAxis.min),
      [yAxis.key]: yAxis.min + (1 - ny) * (yAxis.max - yAxis.min),
    })
  }

  return {
    channels,
    currentHex,
    cssColor,
    colorSpace,
    activeSpaceId,
    setSpace,
    setChannel,
    setFromHex,
    stripValue,
    canvasX,
    canvasY,
    setFromCanvas,
  }
}
