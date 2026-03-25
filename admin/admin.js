// ============================================================
// ADMIN.JS - PT Atma Jaya Mitra Nusantara
// Firebase Authentication + Firestore Content Manager
// ============================================================

// ─── FIREBASE CONFIG ────────────────────────────────────────
// Ganti dengan config Firebase project Anda
// Dapatkan dari: Firebase Console → Project Settings → Your Apps
const firebaseConfig = {
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId:             "YOUR_APP_ID"
};

// ─── DEFAULT CONTENT (fallback jika Firestore kosong) ───────
const DEFAULTS = {
    heroTitle: "PT Atma Jaya Mitra Nusantara",
    heroDesc:  "is a professional company specializing in building management and event services. Supporting Universitas Katolik Indonesia Atma Jaya and the wider community, we provide reliable solutions in facility management, event organization, business support, education, community engagement, and AV training services, including seminars, certification programs, and brevet AB courses to enhance professional competencies.",
    heroImg:   "",
    s1Title:   "Education & Training",
    s1Desc:    "Professional training programs, seminars, certifications, and Brevet AB courses to enhance skills and professional competencies.",
    s1Img:     "../images/av.jpg",
    s2Title:   "Event & Venue Services",
    s2Desc:    "We provide professional venue management and event support services for academic, corporate, and institutional activities, ensuring a well-organized and seamless experience.",
    s2Img:     "../images/non-av.jpg"
};

const CACHE_KEY  = "ajmn_content_cache";
const CACHE_TTL  = 10 * 60 * 1000; // 10 menit (ms)
const COLLECTION = "siteContent";
const DOC_ID     = "homepage";

// ─── INIT FIREBASE ──────────────────────────────────────────
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ─── UTILITIES ──────────────────────────────────────────────
function showSpinner(msg = "Menyimpan...") {
    document.getElementById("global-spinner").querySelector(".spinner-text").textContent = msg;
    document.getElementById("global-spinner").classList.add("show");
}
function hideSpinner() {
    document.getElementById("global-spinner").classList.remove("show");
}

function showToast(message, type = "info") {
    const icons = { success: "✅", error: "❌", info: "ℹ️" };
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
    const remove = () => {
        toast.style.animation = "slideOut 0.3s ease forwards";
        setTimeout(() => toast.remove(), 300);
    };
    toast.addEventListener("click", remove);
    setTimeout(remove, 4000);
}

function setBtnLoading(btn, loading) {
    if (loading) btn.classList.add("loading");
    else         btn.classList.remove("loading");
    btn.disabled = loading;
}

// ─── CACHE ──────────────────────────────────────────────────
function saveCache(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    updateCacheStatus();
}

function loadCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
        return data;
    } catch { return null; }
}

function updateCacheStatus() {
    const el = document.getElementById("cache-status");
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
        const { ts } = JSON.parse(raw);
        const min = Math.floor((Date.now() - ts) / 60000);
        el.textContent = min === 0 ? "Baru" : `${min}m lalu`;
    } else {
        el.textContent = "Kosong";
    }
}

// ─── FIRESTORE ──────────────────────────────────────────────
async function loadContentFromFirestore() {
    try {
        const doc = await db.collection(COLLECTION).doc(DOC_ID).get();
        const data = doc.exists ? { ...DEFAULTS, ...doc.data() } : { ...DEFAULTS };
        saveCache(data);
        return data;
    } catch (e) {
        console.warn("Firestore error, using cache/defaults:", e.message);
        document.getElementById("firebase-status").textContent = "⚠️ Error";
        document.getElementById("firebase-status").style.color = "#ff9800";
        return loadCache() || { ...DEFAULTS };
    }
}

async function saveContentToFirestore(data) {
    await db.collection(COLLECTION).doc(DOC_ID).set(data, { merge: true });
    saveCache(null); // invalidate cache setelah save
    localStorage.removeItem(CACHE_KEY);
}

// ─── POPULATE FORM ──────────────────────────────────────────
function populateForms(data) {
    document.getElementById("hero-title").value = data.heroTitle || "";
    document.getElementById("hero-desc").value  = data.heroDesc  || "";
    document.getElementById("hero-img").value   = data.heroImg   || "";
    document.getElementById("s1-title").value   = data.s1Title   || "";
    document.getElementById("s1-desc").value    = data.s1Desc    || "";
    document.getElementById("s1-img").value     = data.s1Img     || "";
    document.getElementById("s2-title").value   = data.s2Title   || "";
    document.getElementById("s2-desc").value    = data.s2Desc    || "";
    document.getElementById("s2-img").value     = data.s2Img     || "";
    updateAllPreviews(data);
}

// ─── PREVIEW ────────────────────────────────────────────────
function updateHeroPreview() {
    const title = document.getElementById("hero-title").value;
    const desc  = document.getElementById("hero-desc").value;
    const img   = document.getElementById("hero-img").value;
    document.getElementById("prev-hero-title").textContent = title;
    document.getElementById("prev-hero-desc").textContent  = desc;
    const imgEl = document.getElementById("prev-hero-img");
    if (img) { imgEl.src = img; imgEl.style.display = "block"; }
    else      { imgEl.style.display = "none"; }
}

function updateS1Preview() {
    document.getElementById("prev-s1-title").textContent = document.getElementById("s1-title").value;
    document.getElementById("prev-s1-desc").textContent  = document.getElementById("s1-desc").value;
    const img = document.getElementById("s1-img").value;
    const imgEl = document.getElementById("prev-s1-img");
    if (img) { imgEl.src = img; imgEl.style.display = "block"; }
    else      { imgEl.style.display = "none"; }
}

function updateS2Preview() {
    document.getElementById("prev-s2-title").textContent = document.getElementById("s2-title").value;
    document.getElementById("prev-s2-desc").textContent  = document.getElementById("s2-desc").value;
    const img = document.getElementById("s2-img").value;
    const imgEl = document.getElementById("prev-s2-img");
    if (img) { imgEl.src = img; imgEl.style.display = "block"; }
    else      { imgEl.style.display = "none"; }
}

function updateAllPreviews(data) {
    updateHeroPreview();
    updateS1Preview();
    updateS2Preview();
}

function setupPreviewListeners() {
    ["hero-title","hero-desc","hero-img"].forEach(id =>
        document.getElementById(id).addEventListener("input", updateHeroPreview));
    ["s1-title","s1-desc","s1-img"].forEach(id =>
        document.getElementById(id).addEventListener("input", updateS1Preview));
    ["s2-title","s2-desc","s2-img"].forEach(id =>
        document.getElementById(id).addEventListener("input", updateS2Preview));

    document.getElementById("toggle-hero-preview").addEventListener("click", () => {
        const box = document.getElementById("hero-preview");
        box.classList.toggle("show");
        updateHeroPreview();
    });
    document.getElementById("toggle-s1-preview").addEventListener("click", () => {
        const box = document.getElementById("s1-preview");
        box.classList.toggle("show");
        updateS1Preview();
    });
    document.getElementById("toggle-s2-preview").addEventListener("click", () => {
        const box = document.getElementById("s2-preview");
        box.classList.toggle("show");
        updateS2Preview();
    });
}

// ─── SAVE HANDLERS ──────────────────────────────────────────
async function handleSaveHero() {
    const btn = document.getElementById("save-hero-btn");
    setBtnLoading(btn, true);
    try {
        const heroData = {
            heroTitle: document.getElementById("hero-title").value.trim(),
            heroDesc:  document.getElementById("hero-desc").value.trim(),
            heroImg:   document.getElementById("hero-img").value.trim()
        };
        if (!heroData.heroTitle) { showToast("Judul Hero tidak boleh kosong", "error"); return; }
        await saveContentToFirestore(heroData);
        showToast("Hero section berhasil disimpan! ✨", "success");
    } catch (e) {
        console.error(e);
        showToast("Gagal menyimpan: " + e.message, "error");
    } finally {
        setBtnLoading(btn, false);
    }
}

async function handleSaveServices() {
    const btn = document.getElementById("save-services-btn");
    setBtnLoading(btn, true);
    try {
        const servicesData = {
            s1Title: document.getElementById("s1-title").value.trim(),
            s1Desc:  document.getElementById("s1-desc").value.trim(),
            s1Img:   document.getElementById("s1-img").value.trim(),
            s2Title: document.getElementById("s2-title").value.trim(),
            s2Desc:  document.getElementById("s2-desc").value.trim(),
            s2Img:   document.getElementById("s2-img").value.trim()
        };
        if (!servicesData.s1Title || !servicesData.s2Title) {
            showToast("Judul layanan tidak boleh kosong", "error"); return;
        }
        await saveContentToFirestore(servicesData);
        showToast("Konten layanan berhasil disimpan! ✨", "success");
    } catch (e) {
        console.error(e);
        showToast("Gagal menyimpan: " + e.message, "error");
    } finally {
        setBtnLoading(btn, false);
    }
}

// ─── NAVIGATION ─────────────────────────────────────────────
const PANEL_TITLES = {
    overview:       "Dashboard",
    "edit-hero":    "Edit Hero Section",
    "edit-services":"Edit Layanan"
};

function switchPanel(panelId) {
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    document.getElementById(`panel-${panelId}`).classList.add("active");
    document.querySelector(`[data-panel="${panelId}"]`).classList.add("active");
    document.getElementById("page-title").textContent = PANEL_TITLES[panelId] || panelId;
    closeSidebar();
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebar-overlay").classList.remove("show");
}

function setupNavigation() {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => switchPanel(item.dataset.panel));
    });
    document.getElementById("menu-toggle").addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("open");
        document.getElementById("sidebar-overlay").classList.toggle("show");
    });
    document.getElementById("sidebar-overlay").addEventListener("click", closeSidebar);
}

// ─── AUTH ────────────────────────────────────────────────────
function setupAuth() {
    // Login Form
    document.getElementById("login-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn   = document.getElementById("login-btn");
        const email = document.getElementById("email-input").value.trim();
        const pass  = document.getElementById("password-input").value;
        setBtnLoading(btn, true);
        try {
            await auth.signInWithEmailAndPassword(email, pass);
            // onAuthStateChanged akan handle redirect ke dashboard
        } catch (err) {
            let msg = "Login gagal";
            if (err.code === "auth/user-not-found")    msg = "Email tidak ditemukan";
            else if (err.code === "auth/wrong-password") msg = "Password salah";
            else if (err.code === "auth/invalid-email")  msg = "Format email tidak valid";
            else if (err.code === "auth/too-many-requests") msg = "Terlalu banyak percobaan, coba lagi nanti";
            showToast(msg, "error");
            setBtnLoading(btn, false);
        }
    });

    // Logout
    document.getElementById("logout-btn").addEventListener("click", async () => {
        await auth.signOut();
        showToast("Berhasil logout", "info");
    });

    // Auth State Listener
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User login → tampilkan dashboard
            document.getElementById("login-page").style.display = "none";
            document.getElementById("dashboard").style.display  = "block";

            // Update user info
            const email = user.email;
            document.getElementById("user-email-display").textContent = email;
            document.getElementById("user-avatar").textContent = email.charAt(0).toUpperCase();

            // Load content
            showSpinner("Memuat data...");
            document.getElementById("firebase-status").textContent = "✅ Terhubung";
            document.getElementById("firebase-status").style.color = "#4caf50";

            const cached = loadCache();
            if (cached) {
                populateForms(cached);
                updateCacheStatus();
                showToast("Data dimuat dari cache", "info");
            }

            const fresh = await loadContentFromFirestore();
            populateForms(fresh);
            updateCacheStatus();
            hideSpinner();
            showToast("Data berhasil dimuat dari Firestore", "success");
        } else {
            // User logout → tampilkan login
            document.getElementById("login-page").style.display = "flex";
            document.getElementById("dashboard").style.display  = "none";
            setBtnLoading(document.getElementById("login-btn"), false);
        }
    });
}

// ─── RESET BUTTONS ──────────────────────────────────────────
function setupResets() {
    document.getElementById("reset-hero-btn").addEventListener("click", () => {
        document.getElementById("hero-title").value = DEFAULTS.heroTitle;
        document.getElementById("hero-desc").value  = DEFAULTS.heroDesc;
        document.getElementById("hero-img").value   = DEFAULTS.heroImg;
        updateHeroPreview();
        showToast("Form direset ke default", "info");
    });
    document.getElementById("reset-services-btn").addEventListener("click", () => {
        document.getElementById("s1-title").value = DEFAULTS.s1Title;
        document.getElementById("s1-desc").value  = DEFAULTS.s1Desc;
        document.getElementById("s1-img").value   = DEFAULTS.s1Img;
        document.getElementById("s2-title").value = DEFAULTS.s2Title;
        document.getElementById("s2-desc").value  = DEFAULTS.s2Desc;
        document.getElementById("s2-img").value   = DEFAULTS.s2Img;
        updateS1Preview(); updateS2Preview();
        showToast("Form direset ke default", "info");
    });
}

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    setupAuth();
    setupNavigation();
    setupPreviewListeners();
    setupResets();
    updateCacheStatus();

    document.getElementById("save-hero-btn").addEventListener("click", handleSaveHero);
    document.getElementById("save-services-btn").addEventListener("click", handleSaveServices);
});
