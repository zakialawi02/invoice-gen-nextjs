# Invoice Generator - Fitur Create Invoice

## 📋 Ringkasan Fitur

Sistem invoice generator yang lengkap dengan fitur:

- ✅ Create invoice dengan auto-generate ID
- ✅ Form lengkap untuk semua data invoice
- ✅ Preview invoice real-time
- ✅ Download invoice sebagai PDF
- ✅ Simpan sebagai draft atau langsung kirim
- ✅ List semua invoice dengan status
- ✅ Edit dan delete invoice

## 🗄️ Database Schema (Scalable)

Database telah dimodifikasi untuk lebih scalable dengan menambahkan:

### Invoice Model

- **Status Management**: DRAFT, SENT, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
- **From Information**: Informasi lengkap pengirim (nama, alamat lengkap, kontak)
- **Bill To Information**: Informasi lengkap penerima (nama, perusahaan, alamat lengkap, kontak)
- **Invoice Details**: Tanggal, due date, payment terms, PO number
- **Financial**:
  - Multi-currency support (USD, EUR, GBP, IDR)
  - Discount (percentage atau fixed amount)
  - Tax dengan tax rate
  - Shipping cost
  - Automatic calculation (subtotal, total, balance due)
- **Additional**: Notes dan Terms & Conditions
- **Indexes**: Untuk performa query yang lebih baik

### InvoiceItem Model

- Item name, description, quantity, rate, amount
- Relasi dengan Invoice (cascade delete)

## 🚀 Flow Penggunaan

### 1. Halaman Invoice List (`/dashboard/invoice`)

- Klik tombol "Create Invoice"
- Sistem akan:
  1. Membuat invoice draft baru di database
  2. Generate invoice number otomatis (format: INV-YYYY-NNNN)
  3. Redirect ke halaman create dengan ID invoice

### 2. Halaman Create Invoice (`/dashboard/invoice/create?id=xxx`)

- **Form Sections**:
  - From (Your Information): Data pengirim
  - Bill To (Client Information): Data klien
  - Invoice Details: Nomor, tanggal, payment terms
  - Items: Daftar item/jasa dengan quantity dan rate
  - Additional Charges: Discount, tax, shipping
  - Additional Information: Notes dan terms

- **Preview Toggle**:
  - Switch "Show Preview" untuk melihat preview invoice
  - Preview ditampilkan side-by-side dengan form (responsive)
  - Preview menampilkan invoice dalam format profesional

- **Actions**:
  - **Save as Draft**: Simpan tanpa mengubah status
  - **Save and Send**: Simpan dan ubah status menjadi SENT
  - **Download PDF**: Download preview sebagai PDF
  - Dropdown menu untuk opsi tambahan

### 3. Auto-save & Real-time Calculation

- Form data disimpan ke state
- Preview update real-time saat form berubah
- Perhitungan otomatis:
  - Item amount = quantity × rate
  - Subtotal = sum of all items
  - Discount (percentage atau fixed)
  - Tax = (subtotal - discount) × tax rate
  - Total = subtotal - discount + tax + shipping

## 📁 Struktur File

```
src/
├── app/
│   ├── api/
│   │   └── invoices/
│   │       ├── route.ts              # GET all, POST create
│   │       └── [id]/
│   │           └── route.ts          # GET, PUT, DELETE by ID
│   └── (admin)/
│       └── dashboard/
│           └── invoice/
│               ├── page.tsx           # Invoice list
│               └── create/
│                   └── page.tsx       # Create/Edit invoice
├── components/
│   └── invoice/
│       ├── invoice-form.tsx           # Form component
│       └── invoice-preview.tsx        # Preview component
└── prisma/
    └── schema.prisma                  # Database schema
```

## 🔧 API Endpoints

### GET `/api/invoices`

Mendapatkan semua invoice untuk user yang sedang login

### POST `/api/invoices`

Membuat invoice draft baru dengan auto-generate invoice number

### GET `/api/invoices/[id]`

Mendapatkan detail invoice berdasarkan ID

### PUT `/api/invoices/[id]`

Update invoice (termasuk items)

### DELETE `/api/invoices/[id]`

Hapus invoice

## 💾 Database Migration

Migration telah dibuat dengan nama: `add_invoice_scalable_fields`

Untuk apply migration:

```bash
npx prisma migrate dev
```

Untuk reset database (development):

```bash
npx prisma migrate reset
```

## 📦 Dependencies

Package yang digunakan:

- `html2pdf.js`: Untuk generate PDF dari HTML
- `@prisma/client`: Database ORM
- `next-auth`: Authentication
- `sonner`: Toast notifications
- `lucide-react`: Icons

## 🎨 Features Highlights

1. **Responsive Design**: Form dan preview responsive untuk mobile dan desktop
2. **Professional Invoice Template**: Preview invoice dengan design profesional
3. **Multi-currency**: Support USD, EUR, GBP, IDR
4. **Flexible Discount**: Percentage atau fixed amount
5. **Auto-calculation**: Semua perhitungan otomatis
6. **Status Management**: Track invoice dari draft sampai paid
7. **PDF Export**: Download invoice sebagai PDF dengan 1 klik

## 🔐 Security

- Authentication required untuk semua endpoints
- User hanya bisa akses invoice miliknya sendiri
- Cascade delete untuk data integrity

## 📝 Notes

- Invoice number format: `INV-YYYY-NNNN` (contoh: INV-2025-0001)
- Default currency: USD
- Default status: DRAFT
- Semua field optional kecuali invoice number dan items
- Preview menggunakan ID `invoice-preview` untuk PDF generation
