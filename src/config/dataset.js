/**
 * Konfigurasi dataset.
 *
 * satu-satunya berkas yang perlu diubah saat mengganti sumber data atau nama kolom.
 * Semua nama kolom di bawah harus sama persis dengan header CSV (huruf besar/kecil identik).
 */

export const AUTO = 'auto'

/** Kolom sintetis: jumlah transaksi (dihitung 1 per baris mentah saat agregasi). */
export const COUNT_FIELD = '__n'

/** Nama laporan di header, mis. "Penjualan / 1 Feb 2026 – 31 Jul 2026". */
export const REPORT_NAME = 'Penjualan'

/** 'csv' membaca berkas di public/, 'supabase' memanggil loadFromSupabase() di src/lib/dataLoader.js. */
export const DATA_SOURCE = 'csv'
export const CSV_FILE = 'dummy_dataset.csv'
export const CSV_DELIMITER = ';'

/** Jumlah baris awal yang dipakai untuk mendeteksi kolom & format tanggal. */
export const DETECTION_SAMPLE_SIZE = 300

/** Kolom kategori yang bisa dipakai untuk mengurai pohon. Urutan = urutan di menu. */
export const DIMENSIONS = [
  'branch_area',
  'Lini_Produk',
  'Channel',
  'Year',
  'Quarter_Name',
  'Payment_Method',
  'Branch',
  'Category',
]

/**
 * Dimensi turunan tanggal. Saat membandingkan periode, "Cari otomatis" melewatinya:
 * P1 dan P2 memang jatuh di tahun/kuartal berbeda, jadi hasilnya selalu ekstrem tapi tidak bermakna.
 * (Tetap bisa dipilih manual dari menu.)
 */
export const PERIOD_DIMENSIONS = ['Year', 'Quarter_Name']

/** Kolom yang muncul sebagai saringan di bilah "Saring". */
export const SLICERS = ['branch_area', 'Branch', 'Channel', 'Lini_Produk', 'Payment_Method']

/** Dimensi yang ditawarkan di kartu "Mulai mengurai" saat pohon masih kosong. */
export const SUGGESTED_DIMENSIONS = ['Branch', 'Lini_Produk', 'Channel', 'branch_area']

/** Kolom angka yang dijumlahkan saat agregasi. */
export const NUMERIC_FIELDS = ['Revenue', COUNT_FIELD]

/** Metrik yang bisa dipilih di header. format: 'currency' (Rp) atau 'int'. */
export const MEASURES = [
  { key: 'Revenue', label: 'Pendapatan', field: 'Revenue', format: 'currency' },
  { key: COUNT_FIELD, label: 'Jumlah transaksi', field: COUNT_FIELD, format: 'int' },
]

/** Nama kolom tanggal. AUTO = cari dari DATE_FIELD_CANDIDATES, lalu tebak dari isi kolom. */
export const DATE_FIELD = AUTO
export const DATE_FIELD_CANDIDATES = [
  'Date',
  'date',
  'DATE',
  'sale_date',
  'Sale_Date',
  'Tanggal',
  'tanggal',
  'Tanggal_Transaksi',
  'Order_Date',
  'order_date',
  'TransactionDate',
  'Transaction_Date',
]

/** Urutan tanggal untuk format non-ISO (mis. 07/01/2026): 'dmy', 'mdy', atau AUTO. */
export const DATE_FORMAT = AUTO

/** Label tampilan untuk tiap kolom dimensi. */
export const DIMENSION_LABELS = {
  branch_area: 'Wilayah',
  Branch: 'Cabang',
  Channel: 'Kanal',
  Lini_Produk: 'Lini produk',
  Category: 'Kategori produk',
  Payment_Method: 'Metode bayar',
  Year: 'Tahun',
  Quarter_Name: 'Kuartal',
}

/** Jumlah kartu per kolom sebelum muncul tombol "Tampilkan N lainnya". */
export const NODE_LIMIT = 10

/** Rentang awal P1 = bulan terakhir di data + N bulan sebelumnya (5 → 6 bulan penuh). */
export const INITIAL_RANGE_MONTHS = 5

export const getDimensionLabel = (dimension) =>
  DIMENSION_LABELS[dimension] || String(dimension).replace(/_/g, ' ')
