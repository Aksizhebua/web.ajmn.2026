# 🔧 Panduan Setup Firebase + Admin Panel
## PT Atma Jaya Mitra Nusantara

---

## 📋 LANGKAH 1 — Buat Project Firebase

1. Buka [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Klik **"Add project"** → beri nama (contoh: `ajmn-website`)
3. Disable Google Analytics (opsional) → klik **Create Project**

---

## 📋 LANGKAH 2 — Aktifkan Firebase Authentication

1. Di Firebase Console, klik menu **Authentication** (sidebar kiri)
2. Klik **"Get started"**
3. Tab **Sign-in method** → klik **Email/Password** → Enable → Save
4. Tab **Users** → klik **"Add user"**
   - Masukkan email admin (contoh: `admin@ajmn.com`)
   - Masukkan password yang kuat
   - Klik **Add user**

---

## 📋 LANGKAH 3 — Aktifkan Firestore Database

1. Di Firebase Console, klik menu **Firestore Database** (sidebar kiri)
2. Klik **"Create database"**
3. Pilih mode: **Production mode** → Next
4. Pilih region: **asia-southeast1 (Singapore)** → Enable

### Setup Firestore Rules (Keamanan)
Di tab **Rules**, ganti isinya dengan:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Semua orang bisa baca (untuk website publik)
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
Klik **Publish**

---

## 📋 LANGKAH 4 — Ambil Firebase Config

1. Di Firebase Console → klik ikon ⚙️ **Project Settings**
2. Scroll ke bawah → bagian **"Your apps"**
3. Klik ikon **</>** (Web)
4. Register app dengan nama apa saja (contoh: `ajmn-web`)
5. Salin konfigurasi yang muncul (terlihat seperti ini):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ajmn-website.firebaseapp.com",
  projectId: "ajmn-website",
  storageBucket: "ajmn-website.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 📋 LANGKAH 5 — Pasang Config ke Website

Ganti `"YOUR_API_KEY"`, `"YOUR_PROJECT_ID"`, dll. di **DUA file** berikut:

### File 1: `admin/admin.js` (baris 10-17)
```javascript
const firebaseConfig = {
    apiKey:            "AIzaSy...",           // ← ganti
    authDomain:        "project.firebaseapp.com", // ← ganti
    projectId:         "project-id",          // ← ganti
    storageBucket:     "project.appspot.com", // ← ganti
    messagingSenderId: "123456789",           // ← ganti
    appId:             "1:123:web:abc"        // ← ganti
};
```

### File 2: `index.html` (di dalam script Firebase loader, sekitar baris 182)
Cari blok `const firebaseConfig = {` di dalam script dan ganti dengan nilai yang sama.

---

## 📋 LANGKAH 6 — Deploy ke GitHub Pages

1. Push semua file ke repository GitHub:
```bash
git add .
git commit -m "Add Firebase admin panel"
git push origin main
```

2. Di GitHub repository → **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **(root)**
5. Klik **Save**

Website akan tersedia di: `https://username.github.io/repository-name/`
Admin panel di: `https://username.github.io/repository-name/admin/`

---

## 📋 LANGKAH 7 — Tambahkan Domain GitHub Pages ke Firebase Auth

Agar login bisa bekerja di GitHub Pages:
1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Klik **"Add domain"**
3. Masukkan domain GitHub Pages Anda: `username.github.io`
4. Klik **Add**

---

## 🧪 CARA TEST LOGIN DAN EDIT KONTEN

1. Buka `https://username.github.io/repo/admin/`
2. Login dengan email & password admin yang dibuat di Langkah 2
3. Setelah login, pilih menu **"Edit Hero"** di sidebar
4. Ubah Judul, Deskripsi, atau URL Gambar
5. Klik **Preview** untuk lihat tampilan sebelum disimpan
6. Klik **"Simpan Hero"** → akan muncul notifikasi ✅ sukses
7. Buka website utama → konten akan diperbarui otomatis

---

## 📂 STRUKTUR FILE

```
/
├── index.html              ← Website utama (konten dinamis)
├── style.css
├── about.html
├── ... (halaman lain)
├── images/
├── config/
│   └── firebase.js         ← Config reference (dokumentasi)
└── admin/
    ├── index.html          ← Dashboard admin panel
    └── admin.js            ← Logic Firebase Auth + Firestore
```

---

## 🔥 STRUKTUR DATA FIRESTORE

Collection: `siteContent`  
Document: `homepage`  
Fields:
| Field | Tipe | Keterangan |
|-------|------|------------|
| `heroTitle` | string | Judul hero section |
| `heroDesc` | string | Deskripsi hero section |
| `heroImg` | string | URL gambar background hero |
| `s1Title` | string | Judul layanan 1 |
| `s1Desc` | string | Deskripsi layanan 1 |
| `s1Img` | string | URL gambar layanan 1 |
| `s2Title` | string | Judul layanan 2 |
| `s2Desc` | string | Deskripsi layanan 2 |
| `s2Img` | string | URL gambar layanan 2 |

---

## ⚡ FITUR SISTEM

- ✅ **Login Firebase Auth** — Hanya admin yang bisa edit
- ✅ **Edit Hero** — Judul, deskripsi, gambar background
- ✅ **Edit Services** — 2 kartu layanan dengan preview
- ✅ **Live Preview** — Lihat tampilan sebelum disimpan
- ✅ **Toast Notification** — Notifikasi sukses/gagal
- ✅ **Loading Spinner** — Indikator saat memuat/menyimpan
- ✅ **localStorage Cache** — Cache 10 menit untuk performa
- ✅ **Fallback Default** — Konten default jika Firestore kosong
- ✅ **Responsive** — Mobile-friendly admin panel
- ✅ **Sidebar Navigation** — Dashboard, Edit Hero, Edit Services
