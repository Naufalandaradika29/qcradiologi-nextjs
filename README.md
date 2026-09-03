# QC Radiologi

QC Radiologi adalah aplikasi internal untuk pengelolaan Quality Control alat radiologi berbasis Next.js, TypeScript, dan Firebase. Aplikasi ini dibangun sebagai pengganti interface PHP/MySQL lama dengan migrasi data yang terkontrol.

## Stack

- Next.js 16
- TypeScript
- React 19
- Firebase Authentication
- Cloud Firestore
- Vercel deployment

## Setup

1. Install dependencies:

```bash
npm install
```

2. Salin file environment example:

```bash
cp .env.example .env.local
```

3. Isi variabel Firebase berikut di `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

4. Jalankan aplikasi:

```bash
npm run dev
```

5. Buka http://localhost:3000

## Struktur Project

```text
app/
  dashboard/
  qc/
  rekap/
  admin/
  page.tsx
components/
  layout/
  ui/
hooks/
lib/
services/
types/
firestore.rules
.env.example
```

## Fitur

- Login Firebase dengan email/password
- Otentikasi guard berbasis auth state
- Role admin dan pegawai
- Dashboard ringkasan QC
- Pemeriksaan QC
- Data alat
- Kegiatan QC
- Data pegawai
- Rekap harian, mingguan, bulanan, tahunan
- Export CSV untuk rekap
- Firestore sebagai sumber data aplikasi
- Migrasi data SQL lama dengan ID legacy yang stabil

## Catatan Penting

- File `migration/qcradiologi.sql` hanya dibaca sebagai sumber migrasi dan tidak boleh diedit.
- Migrasi tidak menyentuh project PHP lama maupun database MySQL lama.
- Folder project PHP lama hanya dipakai sebagai referensi dan tidak diubah.
- Hash password lama tidak digunakan sebagai kredensial Firebase Authentication.

## State Aplikasi

Aplikasi ini siap digunakan setelah Firebase dan rule autentikasi dikonfigurasi di console Firebase.

## Migrasi SQL ke Firestore

Script `scripts/migrate-sql-to-firestore.mjs` membaca `migration/qcradiologi.sql` dan menulis koleksi `alat`, `kegiatan_qc`, `pemeriksaan_qc`, `qc_detail_legacy`, `suhu_ruangan`, dan `users_legacy`. Dokumen hasil migrasi memakai ID `legacy-*` dan `merge`, sehingga script dapat dijalankan ulang tanpa menggandakan data.

Siapkan service account Firebase Admin secara lokal, kemudian jalankan dari root project:

```powershell
$env:FIREBASE_PROJECT_ID="project-id-firebase"
$env:FIREBASE_CLIENT_EMAIL="firebase-adminsdk@project-id-firebase.iam.gserviceaccount.com"
$env:FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
npm.cmd run migrate:sql
```

Path SQL juga dapat diberikan secara eksplisit:

```powershell
npm.cmd run migrate:sql -- migration/qcradiologi.sql
```

Untuk memeriksa jumlah data tanpa koneksi atau penulisan ke Firebase:

```powershell
npm.cmd run migrate:sql -- --dry-run
```

Jangan commit service account JSON atau private key. Karena SQL lama hanya memiliki username dan password hash bcrypt, script menyimpan akun lama di `users_legacy` untuk referensi dan sengaja tidak membuat akun Firebase Auth. Pembuatan akun Auth harus dilakukan melalui proses admin terpisah setelah email pengguna ditentukan.
