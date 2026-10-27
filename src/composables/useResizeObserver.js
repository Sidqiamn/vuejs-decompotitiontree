import { onBeforeUnmount, ref, watch } from 'vue'

export function useResizeObserver(target, callback) {
  let observer = null

  const stop = watch(
    target,
    (element) => {
      observer?.disconnect()
      observer = null
      if (!element) return
      callback(element)
      if (typeof ResizeObserver === 'undefined') return
      observer = new ResizeObserver(() => callback(element))
      observer.observe(element)
    },
    { immediate: true, flush: 'post' },
  )

  onBeforeUnmount(() => {
    stop()
    observer?.disconnect()
  })
}

/** Lebar elemen (px) yang selalu terkini. */
export function useElementWidth(target, fallbackWidth = 900) {
  const width = ref(fallbackWidth)
  useResizeObserver(target, (element) => {
    width.value = element.clientWidth || fallbackWidth
  })
  return width
}
