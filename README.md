# DuitTrack

> **Pembukuan Pintar untuk UMKM Indonesia**  
> Platform manajemen keuangan all-in-one yang dirancang khusus untuk usaha kecil dan menengah.



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

## Konfigurasi Reset Password

Atur `NEXT_PUBLIC_SITE_URL` ke URL publik aplikasi (contoh: `https://duittrack.example.com`). Tambahkan URL `https://duittrack.example.com/reset-password` ke daftar Redirect URLs di Supabase Dashboard → Authentication → URL Configuration, dan pastikan Site URL Supabase menggunakan domain produksi. Jika memakai template email kustom, tautan reset harus menggunakan `{{ .ConfirmationURL }}`.

## Instalasi di Android dan iPhone

DuitTrack dapat dipasang dari browser sebagai Progressive Web App (PWA) setelah tersedia di domain HTTPS:

- **Android:** buka situs DuitTrack di Chrome, buka menu, lalu pilih **Install app** atau **Add to Home screen**.
- **iPhone/iPad:** buka situs DuitTrack di Safari, tekan **Share**, lalu pilih **Add to Home Screen**.

PWA menyimpan aset statis yang diperlukan, tetapi tidak menyimpan halaman akun atau data keuangan untuk penggunaan offline. Saat tidak ada koneksi, aplikasi menampilkan halaman offline dan meminta pengguna tersambung kembali.

## Environment production

Atur environment variables berikut langsung di dashboard hosting. Jangan commit nilainya, terutama secret server:

- Wajib: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (boleh menggunakan Supabase publishable key), `SUPABASE_SERVICE_ROLE_KEY` (Supabase secret key server-only), dan `JWT_SECRET` (minimal 32 byte).
- Untuk alur reset password: `NEXT_PUBLIC_SITE_URL` harus berisi URL production HTTPS dan URL `/reset-password` harus diizinkan di Supabase Auth.
- Fitur AI memerlukan `OPENROUTER_API_KEY` (asisten) dan/atau `GEMINI_API_KEY` (OCR).
- `ENCRYPTION_KEY` hanya diperlukan jika utilitas enkripsi dipakai; nilainya harus tepat 32 byte UTF-8.

## Jenis pencatatan

Pendaftaran menyediakan pilihan workspace Bisnis atau Pribadi. Workspace Pribadi berfokus pada transaksi, hutang/piutang, budgeting, cashflow, laporan, scan struk, dan asisten AI; menu inventori dan pelanggan hanya tersedia untuk workspace Bisnis.

Sebelum mengaktifkan versi aplikasi yang menyediakan pilihan tersebut, jalankan `db/migrations/20261021_add_workspace_type.sql` di Supabase SQL Editor. Migrasi ini menambahkan tipe workspace dan mempertahankan data workspace lama sebagai Bisnis.

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




---

<div align="center">
  <strong>DuitTrack</strong>  Kelola keuangan bisnis Anda dengan lebih cerdas
</div>
