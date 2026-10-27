import { toValue, unref, watchEffect } from 'vue'

/**
 * Panggil onOutside saat pengguna mengklik di luar elemen target atau menekan Escape.
 * @param {import('vue').Ref<HTMLElement|null>} target
 * @param {(event: Event) => void} onOutside
 * @param {{ active?: import('vue').MaybeRefOrGetter<boolean>, ignore?: string }} options
 *   active: listener hanya terpasang saat bernilai true
 *   ignore: selector elemen yang klik-nya diabaikan (mis. tombol pembuka)
 */
export function useClickOutside(target, onOutside, { active = true, ignore = null } = {}) {
  const handlePointerDown = (event) => {
    const element = unref(target)
    if (element && element.contains(event.target)) return
    if (ignore && event.target?.closest?.(ignore)) return
    onOutside(event)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') onOutside(event)
  }

  watchEffect((onCleanup) => {
    if (!toValue(active)) return
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    onCleanup(() => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    })
  })
}
