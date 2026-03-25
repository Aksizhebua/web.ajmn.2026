// ============================================================
// ADMIN.JS - PT Atma Jaya Mitra Nusantara
// Firebase Authentication + Firestore Content Manager
// ============================================================

// ─── FIREBASE CONFIG ────────────────────────────────────────
// Ganti dengan config Firebase project Anda
// Dapatkan dari: Firebase Console → Project Settings → Your Apps
const firebaseConfig = {
    apiKey:            "AIzaSyAJOW065La24rSO0VJ8k2-g2KpgBxO2TlA",
    authDomain:        "ajmn-website.firebaseapp.com",
    projectId:         "ajmn-website",
    storageBucket:     "ajmn-website.firebasestorage.app",
    messagingSenderId: "223460999999",
    appId:             "1:223460999999:web:a0758ffee209e3b49c898a",
    measurementId:     "G-4N8TJSHKRW"
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
    setTimeout(remove, 7000);
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

async function saveContentToFirestore(data, docId = DOC_ID) {
    await db.collection(COLLECTION).doc(docId).set(data, { merge: true });
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

// ─── GALLERY CRUD ─────────────────────────────────────────────
let galleryItems = [];

async function loadGallery() {
    try {
        const doc = await db.collection(COLLECTION).doc("gallery").get();
        galleryItems = (doc.exists && doc.data().items) ? doc.data().items : [];
        renderGalleryList(galleryItems);
    } catch(e) { console.warn("Gallery load error:", e.message); }
}

const CATEGORY_LABELS = {
    corporate: "Corporate Event",
    konser:    "Concert & Entertainment",
    wedding:   "Wedding & Private",
    venue:     "Venue & Facilities"
};

function renderGalleryList(items) {
    const listEl = document.getElementById("gallery-item-list");
    if (!items.length) {
        listEl.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i>Belum ada foto. Klik "+ Tambah Foto" untuk menambahkan.</div>';
        return;
    }
    listEl.innerHTML = items.map(item => `
        <div class="event-list-item" data-id="${item.id}">
            <img class="eli-img" src="${item.img || ''}" alt="${item.alt || ''}" onerror="this.style.display='none'">
            <div class="eli-body">
                <div class="eli-title">${item.alt || item.img || '(tanpa keterangan)'}</div>
                <div class="eli-meta">${CATEGORY_LABELS[item.category] || item.category || ''}</div>
            </div>
            <div class="eli-actions">
                <button class="btn-icon btn-icon-edit" onclick="editGalleryItem('${item.id}')"><i class="fas fa-pencil-alt"></i></button>
                <button class="btn-icon btn-icon-del"  onclick="deleteGalleryItem('${item.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

window.editGalleryItem = function(id) {
    const item = galleryItems.find(i => i.id === id);
    if (!item) return;
    document.getElementById("gallery-form-box").classList.add("show");
    document.getElementById("gallery-form-title").innerHTML = `<i class="fas fa-edit"></i> Edit Foto`;
    document.getElementById("gallery-edit-id").value  = id;
    document.getElementById("gi-img").value           = item.img      || "";
    document.getElementById("gi-alt").value           = item.alt      || "";
    document.getElementById("gi-category").value      = item.category || "corporate";
    updateGiPreview();
    document.getElementById("gallery-form-box").scrollIntoView({ behavior: "smooth", block: "start" });
};

window.deleteGalleryItem = async function(id) {
    if (!confirm("Hapus foto ini?")) return;
    galleryItems = galleryItems.filter(i => i.id !== id);
    await saveContentToFirestore({ items: galleryItems }, "gallery");
    renderGalleryList(galleryItems);
    showToast("Foto dihapus", "info");
};

function updateGiPreview() {
    const url = document.getElementById("gi-img").value.trim();
    const wrap = document.getElementById("gi-preview-wrap");
    const img  = document.getElementById("gi-preview-img");
    if (url) { img.src = url; wrap.style.display = "block"; }
    else      { wrap.style.display = "none"; }
}

async function handleSaveGalleryItem() {
    const btn = document.getElementById("save-gallery-item-btn");
    setBtnLoading(btn, true);
    try {
        const img      = document.getElementById("gi-img").value.trim();
        const alt      = document.getElementById("gi-alt").value.trim();
        const category = document.getElementById("gi-category").value;
        if (!img) { showToast("URL gambar tidak boleh kosong", "error"); return; }
        const editId = document.getElementById("gallery-edit-id").value;
        if (editId) {
            const idx = galleryItems.findIndex(i => i.id === editId);
            if (idx >= 0) galleryItems[idx] = { id: editId, img, alt, category };
        } else {
            galleryItems.push({ id: genId(), img, alt, category });
        }
        await saveContentToFirestore({ items: galleryItems }, "gallery");
        renderGalleryList(galleryItems);
        document.getElementById("gallery-form-box").classList.remove("show");
        document.getElementById("gallery-edit-id").value = "";
        document.getElementById("gi-img").value = "";
        document.getElementById("gi-alt").value = "";
        document.getElementById("gi-preview-wrap").style.display = "none";
        showToast("Foto berhasil disimpan! ✨", "success");
    } catch(e) { showToast("Gagal: " + e.message, "error"); }
    finally { setBtnLoading(btn, false); }
}

// ─── PANEL TITLES ────────────────────────────────────────────
let upcomingEvents = [];
let pastEvents     = [];

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

async function loadEvents() {
    try {
        const [uDoc, pDoc] = await Promise.all([
            db.collection(COLLECTION).doc("upcomingEvents").get(),
            db.collection(COLLECTION).doc("pastEvents").get()
        ]);
        upcomingEvents = (uDoc.exists && uDoc.data().events) ? uDoc.data().events : [];
        pastEvents     = (pDoc.exists && pDoc.data().events) ? pDoc.data().events : [];
        renderEventList("upcoming", upcomingEvents);
        renderEventList("past", pastEvents);
    } catch(e) { console.warn("Events load error:", e.message); }
}

function renderEventList(type, events) {
    const listEl = document.getElementById(`${type}-event-list`);
    if (!events.length) {
        listEl.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i>Belum ada event. Klik "+ Tambah Event" untuk menambahkan.</div>';
        return;
    }
    listEl.innerHTML = events.map(ev => `
        <div class="event-list-item" data-id="${ev.id}">
            <img class="eli-img" src="${ev.img || ''}" alt="" onerror="this.style.display='none'">
            <div class="eli-body">
                <div class="eli-title">${ev.title}</div>
                <div class="eli-meta">${ev.date || ''} · ${ev.category || ''} · <span class="badge badge-warning">${ev.badge || ''}</span></div>
            </div>
            <div class="eli-actions">
                <button class="btn-icon btn-icon-edit" onclick="editEvent('${type}','${ev.id}')"><i class="fas fa-pencil-alt"></i></button>
                <button class="btn-icon btn-icon-del"  onclick="deleteEvent('${type}','${ev.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function showEventForm(type, clear = true) {
    const box = document.getElementById(`${type}-form-box`);
    box.classList.add("show");
    if (clear) {
        const prefix = type === "upcoming" ? "ue" : "pe";
        ["title","date","desc","location","img","linkText","link"].forEach(f => {
            const el = document.getElementById(`${prefix}-${f}`);
            if (el) el.value = "";
        });
        document.getElementById(`${type}-edit-id`).value = "";
        document.getElementById(`${type}-form-title`).innerHTML = `<i class="fas fa-plus-circle"></i> Tambah Event Baru`;
    }
    box.scrollIntoView({ behavior: "smooth", block: "start" });
}

window.editEvent = function(type, id) {
    const events = type === "upcoming" ? upcomingEvents : pastEvents;
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const prefix = type === "upcoming" ? "ue" : "pe";
    showEventForm(type, false);
    document.getElementById(`${type}-edit-id`).value = id;
    document.getElementById(`${type}-form-title`).innerHTML = `<i class="fas fa-edit"></i> Edit Event`;
    document.getElementById(`${prefix}-title`).value    = ev.title    || "";
    document.getElementById(`${prefix}-date`).value     = ev.date     || "";
    document.getElementById(`${prefix}-desc`).value     = ev.desc     || "";
    document.getElementById(`${prefix}-category`).value = ev.category || "seminar";
    document.getElementById(`${prefix}-badge`).value    = ev.badge    || "";
    document.getElementById(`${prefix}-badgeType`).value= ev.badgeType|| "";
    document.getElementById(`${prefix}-location`).value = ev.location || "";
    document.getElementById(`${prefix}-img`).value      = ev.img      || "";
    document.getElementById(`${prefix}-linkText`).value = ev.linkText || "";
    document.getElementById(`${prefix}-link`).value     = ev.link     || "";
};

window.deleteEvent = async function(type, id) {
    if (!confirm("Hapus event ini?")) return;
    if (type === "upcoming") {
        upcomingEvents = upcomingEvents.filter(e => e.id !== id);
        await saveContentToFirestore({ events: upcomingEvents }, "upcomingEvents");
        renderEventList("upcoming", upcomingEvents);
    } else {
        pastEvents = pastEvents.filter(e => e.id !== id);
        await saveContentToFirestore({ events: pastEvents }, "pastEvents");
        renderEventList("past", pastEvents);
    }
    showToast("Event dihapus", "info");
};

function getEventFormData(type) {
    const prefix = type === "upcoming" ? "ue" : "pe";
    return {
        title:     document.getElementById(`${prefix}-title`).value.trim(),
        date:      document.getElementById(`${prefix}-date`).value.trim(),
        desc:      document.getElementById(`${prefix}-desc`).value.trim(),
        category:  document.getElementById(`${prefix}-category`).value,
        badge:     document.getElementById(`${prefix}-badge`).value,
        badgeType: document.getElementById(`${prefix}-badgeType`).value,
        location:  document.getElementById(`${prefix}-location`).value.trim(),
        img:       document.getElementById(`${prefix}-img`).value.trim(),
        linkText:  document.getElementById(`${prefix}-linkText`).value.trim(),
        link:      document.getElementById(`${prefix}-link`).value.trim()
    };
}

async function handleSaveEvent(type) {
    const btn = document.getElementById(`save-${type}-event-btn`);
    setBtnLoading(btn, true);
    try {
        const data = getEventFormData(type);
        if (!data.title) { showToast("Judul event tidak boleh kosong", "error"); return; }
        const editId = document.getElementById(`${type}-edit-id`).value;
        if (type === "upcoming") {
            if (editId) {
                const idx = upcomingEvents.findIndex(e => e.id === editId);
                if (idx >= 0) upcomingEvents[idx] = { id: editId, ...data };
            } else {
                upcomingEvents.push({ id: genId(), ...data });
            }
            await saveContentToFirestore({ events: upcomingEvents }, "upcomingEvents");
            renderEventList("upcoming", upcomingEvents);
        } else {
            if (editId) {
                const idx = pastEvents.findIndex(e => e.id === editId);
                if (idx >= 0) pastEvents[idx] = { id: editId, ...data };
            } else {
                pastEvents.push({ id: genId(), ...data });
            }
            await saveContentToFirestore({ events: pastEvents }, "pastEvents");
            renderEventList("past", pastEvents);
        }
        document.getElementById(`${type}-form-box`).classList.remove("show");
        document.getElementById(`${type}-edit-id`).value = "";
        showToast("Event berhasil disimpan! ✨", "success");
    } catch(e) { showToast("Gagal: " + e.message, "error"); }
    finally { setBtnLoading(btn, false); }
}

// ─── PANEL TITLES ────────────────────────────────────────────
const PANEL_TITLES = {
    overview:       "Dashboard",
    "edit-hero":    "Edit Hero Section",
    "edit-services":"Edit Layanan",
    "gallery":      "Gallery",
    "upcoming":     "Upcoming Events",
    "past":         "Past Events"
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
            console.error("Login error:", err.code, err.message);
            let msg = "Login gagal: " + (err.code || err.message);
            if (err.code === "auth/user-not-found")         msg = "Email tidak ditemukan. Pastikan sudah tambah user di Firebase Console → Authentication → Users";
            else if (err.code === "auth/wrong-password")    msg = "Password salah";
            else if (err.code === "auth/invalid-credential") msg = "Email atau password salah";
            else if (err.code === "auth/invalid-email")     msg = "Format email tidak valid";
            else if (err.code === "auth/too-many-requests") msg = "Terlalu banyak percobaan, coba lagi nanti";
            else if (err.code === "auth/operation-not-allowed") msg = "Login email/password belum diaktifkan di Firebase Console";
            else if (err.code === "auth/network-request-failed") msg = "Gagal koneksi ke server, periksa internet";
            else if (err.code === "auth/unauthorized-domain") msg = "Domain belum diizinkan. Tambahkan domain di Firebase Console → Authentication → Settings → Authorized domains";
            else if (err.code === "auth/configuration-not-found") msg = "Konfigurasi Firebase salah atau Authentication belum diaktifkan";
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
            await loadEvents();
            await loadGallery();
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
    // Gallery CRUD
    document.getElementById("add-gallery-btn").addEventListener("click", () => {
        document.getElementById("gallery-form-box").classList.add("show");
        document.getElementById("gallery-form-title").innerHTML = `<i class="fas fa-plus-circle"></i> Tambah Foto Baru`;
        document.getElementById("gallery-edit-id").value = "";
        document.getElementById("gi-img").value = "";
        document.getElementById("gi-alt").value = "";
        document.getElementById("gi-preview-wrap").style.display = "none";
        document.getElementById("gallery-form-box").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.getElementById("cancel-gallery-btn").addEventListener("click", () => document.getElementById("gallery-form-box").classList.remove("show"));
    document.getElementById("save-gallery-item-btn").addEventListener("click", handleSaveGalleryItem);
    document.getElementById("gi-img").addEventListener("input", updateGiPreview);
    // Events CRUD
    document.getElementById("add-upcoming-btn").addEventListener("click", () => showEventForm("upcoming"));
    document.getElementById("cancel-upcoming-btn").addEventListener("click", () => document.getElementById("upcoming-form-box").classList.remove("show"));
    document.getElementById("save-upcoming-event-btn").addEventListener("click", () => handleSaveEvent("upcoming"));
    document.getElementById("add-past-btn").addEventListener("click", () => showEventForm("past"));
    document.getElementById("cancel-past-btn").addEventListener("click", () => document.getElementById("past-form-box").classList.remove("show"));
    document.getElementById("save-past-event-btn").addEventListener("click", () => handleSaveEvent("past"));
});
