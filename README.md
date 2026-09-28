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
