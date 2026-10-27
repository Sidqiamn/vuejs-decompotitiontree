# AGENTS.md

Pohon dekomposisi penjualan berbasis Vue 3, Vite 8, dan Tailwind CSS v4. Data dibaca dari CSV di `public/`
dan diolah di browser. Pohon mengurai total, atau selisih periode P1 − P2, per dimensi (wilayah, cabang,
kanal, dst.).

## Perintah

- Install: `npm install` (Node 22.12+)
- Dev server: `npm run dev` → http://localhost:5173
- Tes: `npm test` (Vitest, `src/**/*.test.js`)
- Lint: `npm run lint` (Oxlint)
- Build: `npm run build`

Sebelum menyatakan tugas selesai, `npm test`, `npm run lint`, dan `npm run build` wajib lulus tanpa error.

## Stack

- Vue 3.5 dengan Composition API dan `<script setup>`. Bahasanya **JavaScript**, bukan TypeScript.
- Tailwind CSS v4 lewat `@tailwindcss/vite`. Konfigurasinya ditulis di CSS (`src/assets/main.css`), jadi
  tidak ada `tailwind.config.js`.
- PapaParse untuk membaca CSV. Grafik ditulis manual dengan SVG, tanpa library chart.
- Alias impor `@/` menunjuk ke `src/`.

## Struktur

```
src/
├─ config/dataset.js          # SATU-SATUNYA tempat nama kolom, dimensi, metrik, label, sumber data
├─ lib/                       # logika murni tanpa Vue: dates, presets, aggregate, format, timeseries, scale, csv, dataLoader
├─ composables/
│  ├─ useDecompositionTree.js # semua state + perhitungan pohon (sumber kebenaran)
│  ├─ treeContext.js          # provideTree() / useTree()
│  └─ useDataset.js, useClickOutside.js, useResizeObserver.js, usePersistentRef.js
├─ components/
│  ├─ DecompositionTree.vue   # komponen utama yang menyusun semua bagian
│  ├─ period/  filters/  chart/  tree/  ui/
│  └─ AppHeader, KpiSummary, TrailBar, DataDrawer, LoadingCanvas, MessagePanel
└─ App.vue                    # memuat data, saringan dari URL, layar loading/error
```

Alur data: CSV → `loadFromCsv()` (`src/lib/dataLoader.js`) → baris digabung per tanggal + dimensi
(`aggregateRawRows`; tanggal ISO di kolom `__d`, jumlah transaksi di `__n`) → `useDecompositionTree(rows)` →
komponen.

## Aturan kode

- Perhitungan baru masuk ke `src/lib/` sebagai fungsi murni, dengan tes `*.test.js` di sebelahnya. Komponen
  cukup menampilkan hasilnya.
- State pohon hanya diubah lewat aksi di `useDecompositionTree` (`splitNode`, `setP1`, `setSlicer`, …).
  `levels`, `slicerSelections`, `p1`, dan `expandedLevels` disimpan di `shallowRef`, jadi selalu ganti dengan
  objek baru dan jangan di-mutate.
- Baris data disimpan di `shallowRef`. Jangan bungkus dengan `ref()` atau `reactive()`, karena ribuan objek
  yang dibuat reaktif membuat aplikasi lambat.
- Komponen container (PeriodBar, SlicerBar, KpiSummary, TrailBar, ChartPanel, TreeCanvas, LevelColumn,
  DataDrawer) membaca state lewat `useTree()`. Komponen lain menerima props dan memancarkan event.
- Format angka dan tanggal selalu lewat `src/lib/format.js` (locale id-ID). Jangan panggil `toLocaleString`
  atau `Intl` langsung di komponen.
- Semua teks UI berbahasa Indonesia. Nama variabel dan fungsi berbahasa Inggris, komentar berbahasa
  Indonesia.
- Gaya kode: indentasi 2 spasi, tanpa titik koma, kutip tunggal, baris maksimal ±120 karakter.
- Aksesibilitas: aksi harus memakai `<button>` asli, tombol ikon wajib punya `aria-label`, dan menu atau panel
  harus bisa ditutup dengan Escape.

## Styling

- Pakai utilitas Tailwind dengan token tema: `brand-*` (marun), `ink-*` (abu), `p2-*` (biru), `pos-*`,
  `neg-*`, `note-*`, `paper`, `wash`, `canvas`. Palet bawaan Tailwind dimatikan, jadi kelas seperti
  `text-gray-500` tidak akan bekerja.
- Di dalam SVG, pakai variabel CSS langsung, mis. `fill="var(--brand-700)"`. Jangan menulis kode hex di
  komponen.
- Semantik warna harus konsisten: P1 = `brand`, P2 = `p2` (biru, garis putus-putus), naik = `pos`, turun =
  `neg`. Arah naik/turun juga ditandai dengan bentuk (▲/▼), tidak hanya warna.
- Kelas bersama (`dt-btn-quiet`, `dt-select`, `dt-menu`, `dt-menu-item`, `dt-chip`, `dt-date`,
  `dt-header-btn`) dan animasi (`dt-rise`, `dt-draw`, `dt-reveal`) ada di `src/assets/main.css`.
- Varian `desk:` berarti layar ≥1024px lebar dan ≥640px tinggi; di sini tinggi tata letak tetap dan kanvas
  pohon menggulung sendiri. Di bawah ukuran itu, halaman menggulung seperti biasa.

## Mengganti dataset

Cukup ubah `src/config/dataset.js`: `CSV_FILE`, `CSV_DELIMITER`, `DIMENSIONS`, `SLICERS`, `NUMERIC_FIELDS`,
`MEASURES`, `DIMENSION_LABELS`, dan `DATE_FIELD`. Nama kolom harus sama persis dengan header CSV.
Untuk Supabase, isi `loadFromSupabase()` di `src/lib/dataLoader.js` dan kembalikan bentuk `{ rows, meta }` yang
sama dengan `loadFromCsv()`.

## Angka acuan (cek cepat)

Dengan `public/dummy_dataset.csv` dan tanpa saringan, tampilan awal harus menunjukkan P1 1 Feb – 31 Jul 2026 vs
P2 4 Agu 2025 – 31 Jan 2026, dengan selisih **+Rp 3.083.033.369 (▲54,6%)**, P1 Rp 8,7 M, P2 Rp 5,7 M, dan
**5.086 baris**. Tes di `src/lib/dataLoader.test.js` mengunci angka ini. Kalau tes itu gagal, berarti logika
agregasi atau periode ikut berubah.

## Larangan

- Jangan ubah atau hapus `public/dummy_dataset.csv`. Pergantian data perlu dengan kolom yang sama dan kapital sensitif
- Jangan menambah dependency baru karena program sudah jalan.
- Jangan menambah library chart atau UI. Ikuti pola SVG dan komponen yang sudah ada.
- Jangan commit `.env`, kunci API, atau kredensial Supabase karena saat ini memakai lokal data.

