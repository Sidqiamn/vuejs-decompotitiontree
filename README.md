# Pohon Dekomposisi (Vue 3)

Alat analisis untuk melihat dari mana total penjualan, atau selisih antara dua periode, berasal. Mulai dari
total, lalu urai per wilayah, cabang, kanal, lini produk, dan dimensi lain.

Proyek ini menggunakan Vue 3 + Vite + Tailwind CSS v4.

## Menjalankan

Butuh Node.js 22.12 atau lebih baru.

```bash
npm install
npm run dev       # buka http://localhost:5173
```

Perintah lain:

| Perintah          | Fungsi                           |
| ----------------- | -------------------------------- |
| `npm test`        | Menjalankan unit test (Vitest)   |
| `npm run lint`    | Memeriksa kode (Oxlint)          |
| `npm run build`   | Build produksi ke folder `dist/` |
| `npm run preview` | Melihat hasil build secara lokal |

## Fitur

- **Periode P1 vs P2** dengan sakelar "Bandingkan periode". P2 bisa otomatis mengikuti P1 ("Tahun lalu" atau
  "Periode sebelumnya") atau diisi manual.
- **Preset periode**: bulan, kuartal, YTD, 30/90 hari bergulir, dan lainnya.
- **Saringan** per wilayah, cabang, kanal, lini produk, dan metode bayar, dilengkapi pencarian.
- **Pohon**: klik kotak untuk mengikuti satu jalur, tombol **+** untuk mengurai, atau **Cari otomatis** untuk
  langsung menemukan kenaikan atau penurunan terbesar.
- **Grafik**: tren garis, kumulatif, batang, kontribusi per dimensi, dan jembatan selisih (waterfall).
- **Panel Data**: info sumber data dan tabel rincian yang bisa diunduh sebagai CSV (siap dibuka di Excel).
- **Sembunyikan bilah** untuk memberi ruang lebih ke pohon. Pilihan ini diingat browser.
- Filter lewat URL, mis. `http://localhost:5173/?Channel=Shopee,Tokopedia`.

## Mengganti data

1. Taruh file CSV di folder `public/`.
2. Sesuaikan `src/config/dataset.js`: nama file, pemisah kolom, daftar dimensi, metrik, dan label.

Penjelasan lebih lengkap tentang struktur kode dan aturannya ada di [`AGENTS.md`](./AGENTS.md). 
