// Pure config — no Vue reactivity. Add new spaces here.

export type ColorSpaceId = 'hsv' | 'hsl' | 'oklch'

export interface AxisDef {
  key: string
  label: string
  min: number
  max: number
  circular?: boolean
}

export interface ColorSpaceDef {
  id: ColorSpaceId
  label: string
  mode: string        // culori mode string
  xAxis: AxisDef      // canvas horizontal
  yAxis: AxisDef      // canvas vertical (max = top)
  stripAxis: AxisDef  // separate slider
  defaults: Record<string, number>
  renderMode: 'gradient' | 'pixel'
}

export const COLOR_SPACES: Record<ColorSpaceId, ColorSpaceDef> = {
  hsv: {
    id: 'hsv',
    label: 'HSV',
    mode: 'hsv',
    xAxis:     { key: 's', label: 'Saturation', min: 0, max: 1 },
    yAxis:     { key: 'v', label: 'Value',      min: 0, max: 1 },
    stripAxis: { key: 'h', label: 'Hue',        min: 0, max: 360, circular: true },
    defaults: { h: 0, s: 1, v: 1 },
    renderMode: 'gradient',
  },
  hsl: {
    id: 'hsl',
    label: 'HSL',
    mode: 'hsl',
    xAxis:     { key: 's', label: 'Saturation', min: 0, max: 1 },
    yAxis:     { key: 'l', label: 'Lightness',  min: 0, max: 1 },
    stripAxis: { key: 'h', label: 'Hue',        min: 0, max: 360, circular: true },
    defaults: { h: 0, s: 1, l: 0.5 },
    renderMode: 'pixel',
  },
  oklch: {
    id: 'oklch',
    label: 'OKLCH',
    mode: 'oklch',
    xAxis:     { key: 'c', label: 'Chroma',    min: 0, max: 0.4 },
    yAxis:     { key: 'l', label: 'Lightness', min: 0, max: 1 },
    stripAxis: { key: 'h', label: 'Hue',       min: 0, max: 360, circular: true },
    defaults: { h: 0, c: 0.2, l: 0.7 },
    renderMode: 'pixel',
  },
}
