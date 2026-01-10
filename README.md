# Aplikasi Absensi Guru

Aplikasi web untuk mengelola absensi guru dengan React, Express.js, dan PostgreSQL.

## 📋 Prerequisites

Pastikan sudah terinstall:
- Node.js (v16 atau lebih baru)
- PostgreSQL (v12 atau lebih baru)
- npm atau yarn

## 🚀 Instalasi

### 1. Setup Database

```bash
# Masuk ke PostgreSQL
psql -U postgres

# Jalankan script SQL dari file database/schema.sql
# Atau copy-paste isi file schema.sql ke psql
```

### 2. Setup Backend

```bash
# Masuk ke folder backend
cd backend

# Install dependencies
npm install

# Buat file .env dan isi dengan kredensial database kamu
# PORT=5000
# DATABASE_URL=postgresql://username:password@localhost:5432/absensi_guru

# Jalankan server
npm run dev
```

Server akan berjalan di `http://localhost:5000`

### 3. Setup Frontend

```bash
# Buka terminal baru, masuk ke folder frontend
cd frontend

# Install dependencies
npm install

# Jalankan aplikasi
npm start
```

Aplikasi akan terbuka di `http://localhost:3000`

## 📁 Struktur Project

```
absensi-guru/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing.jsx    # Halaman pilih bulan
│   │   │   ├── Landing.css
│   │   │   ├── Absensi.jsx    # Halaman absensi
│   │   │   └── Absensi.css
│   │   ├── App.jsx            # Router setup
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── database/
    └── schema.sql             # Database schema
```

## 🎯 Fitur

- ✅ Pilih bulan untuk mengisi absensi (Januari - Desember 2026)
- ✅ Set status hari: Aktif, Hujan, atau Libur
- ✅ Input absensi guru: Hadir (H), Izin (I), Sakit (S)
- ✅ Auto-save ke database PostgreSQL
- ✅ Modal konfirmasi jika ada perubahan belum disimpan
- ✅ Toast notification saat berhasil menyimpan
- ✅ Responsive design dengan Tailwind CSS

## 🔧 API Endpoints

### Guru
- `GET /api/guru` - Get semua data guru
- `POST /api/guru` - Tambah guru baru

### Status Hari
- `GET /api/status-hari/:tahun/:bulan` - Get status hari untuk bulan tertentu
- `POST /api/status-hari` - Set status hari (aktif/hujan/libur)

### Absensi
- `GET /api/absensi/:tahun/:bulan` - Get data absensi untuk bulan tertentu
- `POST /api/absensi` - Simpan/update satu absensi
- `POST /api/absensi/bulk` - Simpan multiple absensi sekaligus

## 📝 Cara Penggunaan

1. Buka aplikasi di browser
2. Pilih bulan yang ingin diisi absensinya
3. Di header tabel, set status setiap tanggal (Aktif/Hujan/Libur)
4. Jika status "Aktif", dropdown absensi akan muncul untuk setiap guru
5. Pilih H (Hadir), I (Izin), atau S (Sakit)
6. Klik tombol "Simpan Perubahan" untuk menyimpan ke database
7. Jika ada perubahan belum disimpan dan klik "Kembali", akan muncul modal konfirmasi

## 🎨 Teknologi

- **Frontend**: React, React Router, Axios, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS + Custom CSS

## 🐛 Troubleshooting

**Problem**: Database connection error
- **Solution**: Pastikan PostgreSQL sudah running dan kredensial di `.env` benar

**Problem**: CORS error
- **Solution**: Pastikan backend server sudah running di port 5000

**Problem**: Tailwind tidak styling
- **Solution**: Pastikan sudah jalankan `npm install` dan cek file `tailwind.config.js`

