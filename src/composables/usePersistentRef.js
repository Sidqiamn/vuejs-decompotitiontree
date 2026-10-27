import { ref, watch } from 'vue'

/**
 * Ref yang diingat di localStorage (hanya untuk preferensi tampilan per pengguna).
 * Kalau localStorage tidak tersedia (mode privat, dsb.), tetap bekerja dengan nilai awal.
 */
export function usePersistentRef(key, defaultValue) {
  const read = () => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw == null ? defaultValue : JSON.parse(raw)
    } catch {
      return defaultValue
    }
  }

  const state = ref(read())

  watch(state, (value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Abaikan: preferensi tidak tersimpan, tapi aplikasi tetap jalan.
    }
  })

  return state
}
