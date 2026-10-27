
export function getExtent(...seriesList) {
  let min = 0
  let max = 0
  for (const series of seriesList) {
    if (!series) continue
    for (const value of series) {
      if (value < min) min = value
      if (value > max) max = value
    }
  }
  return { min, max }
}


export function getNiceScale(minValue, maxValue, tickCount = 4) {
  let min = Math.min(0, minValue)
  let max = Math.max(0, maxValue)
  if (min === max) max = min + 1

  const rawStep = (max - min) / tickCount
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep) || 1)))
  const normalized = rawStep / magnitude
  const niceFactor =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10
  const step = niceFactor * magnitude

  min = Math.floor(min / step) * step
  max = Math.ceil(max / step) * step

  const ticks = []
  for (let value = min; value <= max + step / 2; value += step) ticks.push(value)
  return { min, max, ticks }
}
