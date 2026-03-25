// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
// LANGKAH SETUP:
// 1. Buka https://console.firebase.google.com/
// 2. Buat project baru atau pilih yang sudah ada
// 3. Klik ikon roda gigi → Project Settings
// 4. Scroll ke bagian "Your apps" → klik "</>" (Web)
// 5. Register app → salin config di bawah ini
// 6. Ganti nilai placeholder dengan config Firebase Anda
// ============================================================

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

export { firebaseConfig };
