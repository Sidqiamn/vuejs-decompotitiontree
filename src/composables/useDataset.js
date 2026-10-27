import { onMounted, ref, shallowRef } from 'vue'
import { loadDataset } from '@/lib/dataLoader'

/**
 * Muat dataset sekali saat komponen dipasang.
 * rows disimpan di shallowRef: ribuan objek baris tidak perlu dibuat reaktif satu per satu.
 */
export function useDataset(loader = loadDataset) {
  const status = ref('loading')
  const rows = shallowRef([])
  const meta = shallowRef(null)
  const error = ref(null)
  let requestId = 0

  async function load() {
    const currentRequest = ++requestId
    status.value = 'loading'
    error.value = null

    try {
      const result = await loader()
      if (currentRequest !== requestId) return
      rows.value = result?.rows || []
      meta.value = result?.meta || null
      status.value = 'ready'
    } catch (loadError) {
      if (currentRequest !== requestId) return
      error.value = loadError?.message || String(loadError)
      status.value = 'error'
    }
  }

  onMounted(load)

  return { status, rows, meta, error, reload: load }
}
