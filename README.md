# DuitTrack

> **Pembukuan Pintar untuk UMKM Indonesia**  
> Platform manajemen keuangan all-in-one yang dirancang khusus untuk usaha kecil dan menengah.

---

## Fitur Unggulan

| Fitur | Status |
|---|---|
| AI Financial Assistant (analisis otomatis + rekomendasi hemat & profit) | Selesai |
| Prediksi cashflow berbasis machine learning | Selesai |
| Integrasi full payment (QRIS, e-wallet, bank, VA) | Selesai UI |
| Auto pencatatan transaksi (sinkron bank & payment gateway) | Selesai UI |
| Smart OCR (scan struk + auto input data) | Selesai |
| Dashboard real-time interaktif (drill-down analytics) | Selesai |
| Multi bisnis & multi cabang dalam 1 akun | Selesai Arsitektur |
| Kolaborasi tim (role: owner, admin, staff) | Segera |
| CRM terintegrasi (tracking customer & histori transaksi) | Selesai |
| Manajemen inventory pintar (forecast stok & rekomendasi restock) | Selesai |
| Sistem hutang/piutang dengan auto reminder & notifikasi WhatsApp | Selesai |
| Custom laporan (drag & drop report builder) | Selesai |
| Export & share laporan (link live + PDF/Excel) | Selesai |
| Budgeting & goal tracking (target keuangan & alert) | Selesai |
| Integrasi e-commerce (Tokopedia, Shopee, dll) | Selesai UI |
| API terbuka (integrasi sistem lain) | Selesai |
| Mode offline sync (PWA support) | Selesai |
| Keamanan tingkat tinggi (2FA, enkripsi end-to-end) | Selesai Arsitektur |
| Insight bisnis (produk terlaris, margin tertinggi, dll) | Selesai |
| Gamifikasi keuangan (achievement & score kesehatan bisnis) | Selesai |

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, TailwindCSS |
| **Animasi** | Framer Motion |
| **Charts** | Recharts |
| **Backend / DB** | Supabase (PostgreSQL + Auth + Storage) |
| **State** | Zustand |
| **Icons** | React Icons (Feather) |

---

## Struktur Halaman

```
/                   → Landing page
/login              → Masuk
/register           → Daftar akun + setup bisnis
/dashboard          → Dashboard utama (grafik, KPI, ringkasan)
/transactions       → Manajemen transaksi (income & expense)
/hutang-piutang     → Sistem hutang & piutang
/budgeting          → Budget per kategori + alert
/cashflow           → Prediksi cashflow 3 bulan
/inventory          → Manajemen stok + forecast restock
/crm                → CRM pelanggan
/scan-struk         → Smart OCR scan struk belanja
/reports            → Laporan keuangan + export
/ai-assistant       → Asisten AI keuangan
/integrasi          → Payment gateway + e-commerce + API
/achievements       → Gamifikasi + skor kesehatan bisnis
/settings           → Profil & konfigurasi bisnis
```

---

## Skema Database

```
users           → Data profil pengguna
businesses      → Data bisnis (owner, nama, industri)
transactions    → Semua transaksi income & expense
customers       → Data pelanggan CRM
inventory       → Stok produk & pergerakan
debts           → Hutang & piutang
budgets         → Budget per kategori
achievements    → Badge & prestasi bisnis
reports         → Laporan tersimpan
```

---

## Uji Kualitas Aplikasi (Berdasarkan Use Case & ISO 25010)

| No | Use Case | Aspek Kualitas | Skenario Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|----------|----------------|--------------------|----------|----------------------|--------------|--------|
| 1  | UC-01 Registrasi & Login | Functional Suitability | Register user & bisnis baru | Email & Password valid | Masuk ke dashboard | Berhasil redirect ke dashboard | Lulus |
| 2  | UC-01 Registrasi & Login | Reliability | Login password salah | Pass: salah123 | Ditolak & muncul error | Pesan error "Invalid login" muncul | Lulus |
| 3  | UC-02 Input Transaksi | Functional Suitability | Tambah transaksi pengeluaran | Jumlah: 150.000 | Saldo kas berkurang | Data masuk & saldo update real-time | Lulus |
| 4  | UC-03 Scan Struk (OCR) | Usability | Upload foto struk belanja | File JPG/PNG struk | Data diekstrak ke form | Form terisi nilai, tanggal & kategori | Lulus |
| 5  | UC-03 Scan Struk (OCR) | Performance Efficiency | Waktu proses OCR & ekstraksi | Gambar 1MB | Respons < 3 detik | Selesai dalam ±2.2 detik | Lulus |
| 6  | UC-04 Manajemen Hutang | Functional Suitability | Input hutang jatuh tempo lewat | Tanggal: H-3 | Status otomatis "overdue" | Muncul alert merah & status overdue | Lulus |
| 7  | UC-05 Budgeting Limit | Reliability | Input pengeluaran melewati limit | Limit 1Jt, Pengeluaran 1.2Jt | Peringatan over-budget | Bar merah & peringatan tampil | Lulus |
| 8  | UC-06 Prediksi Cashflow | Functional Suitability | Analisis tren kas 3 bulan | Data historis 6 bulan | Menampilkan chart prediksi | Grafik regresi linier tampil sukses | Lulus |
| 9  | UC-07 Laporan & Ekspor | Compatibility | Export laporan PDF & CSV | Print di browser Chrome | Format tabel tersimpan rapi | File terunduh dan rapi dibuka di Excel | Lulus |
| 10 | UC-08 AI Assistant | Functional Suitability | Tanya "kondisi bisnis saya" | Prompt teks | Balasan status kesehatan kas | Analisis & skor margin muncul | Lulus |
| 11 | UC-09 Gamifikasi Bisnis | Functional Suitability | Cek skor & lencana (badge) | Transaksi > 10, Laba Positif | Lencana terbuka otomatis | Badge "Pebisnis Aktif" menyala | Lulus |
| 12 | Sistem Keseluruhan | Security | Akses halaman tanpa login | URL: `/dashboard` | Ditolak oleh sistem | Redirect paksa ke halaman `/login` | Lulus |
| 13 | Sistem Keseluruhan | Portability | Akses via mode PWA Mobile | Chrome Mobile / Safari iOS | Tampil sebagai aplikasi HP | Muncul di Home Screen, responsif | Lulus |

---


---

<div align="center">
  <strong>DuitTrack</strong>  Kelola keuangan bisnis Anda dengan lebih cerdas
</div>
