const auth    = firebase.auth();
const db      = firebase.firestore();

// Mencegah efek berkedip (flash) ke halaman login saat di-refresh
document.addEventListener("DOMContentLoaded", () => {
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.classList.add('hidden');
});

let allEvents = [];
let allNews = [];
let allCards = [];
let allGalleryItems = [];

// --- TAB NAVIGATION ---
const tabEventsBtn = document.getElementById('tab-events');
const tabNewsBtn = document.getElementById('tab-news');
const tabCardsBtn = document.getElementById('tab-cards');
const tabGalleryBtn = document.getElementById('tab-gallery');
const sectionEvents = document.getElementById('section-events');
const sectionNews = document.getElementById('section-news');
const sectionCards = document.getElementById('section-cards');
const sectionGallery = document.getElementById('section-gallery');

function switchTab(tabId) {
    // Fallback: Jika tabId tidak valid, kembalikan ke tab events secara otomatis
    if (tabId !== 'events' && tabId !== 'news' && tabId !== 'cards' && tabId !== 'gallery') tabId = 'events';
    
    const activeClass = "w-full flex items-center gap-3 bg-gradient-to-r from-gold to-goldHover text-white shadow-md shadow-gold/20 font-bold px-5 py-3.5 rounded-xl mb-2 transition-all";
    const inactiveClass = "w-full flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 font-medium px-5 py-3.5 rounded-xl mb-2 transition-all";
    
    tabEventsBtn.className = inactiveClass;
    tabNewsBtn.className = inactiveClass;
    tabCardsBtn.className = inactiveClass;
    if (tabGalleryBtn) tabGalleryBtn.className = inactiveClass;
    
    sectionEvents.classList.add('hidden'); sectionEvents.classList.remove('block');
    sectionNews.classList.add('hidden'); sectionNews.classList.remove('block');
    sectionCards.classList.add('hidden'); sectionCards.classList.remove('block');
    if (sectionGallery) { sectionGallery.classList.add('hidden'); sectionGallery.classList.remove('block'); }
    
    if (tabId === 'events') {
        tabEventsBtn.className = activeClass;
        sectionEvents.classList.remove('hidden'); sectionEvents.classList.add('block');
        fetchEvents();
    } else if (tabId === 'news') {
        tabNewsBtn.className = activeClass;
        sectionNews.classList.remove('hidden'); sectionNews.classList.add('block');
        fetchNews();
    } else if (tabId === 'cards') {
        tabCardsBtn.className = activeClass;
        sectionCards.classList.remove('hidden'); sectionCards.classList.add('block');
        fetchCards();
    } else if (tabId === 'gallery') {
        if (tabGalleryBtn) tabGalleryBtn.className = activeClass;
        if (sectionGallery) { sectionGallery.classList.remove('hidden'); sectionGallery.classList.add('block'); }
        fetchGallery();
    }
}

tabEventsBtn.addEventListener('click', () => switchTab('events'));
tabNewsBtn.addEventListener('click', () => switchTab('news'));
tabCardsBtn.addEventListener('click', () => switchTab('cards'));
if (tabGalleryBtn) tabGalleryBtn.addEventListener('click', () => switchTab('gallery'));

// --- AUTHENTICATION ---
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');
        
        switchTab('events');
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('dashboard-screen').classList.add('hidden');
    }
});

let isRegisterMode = false;
document.getElementById('toggle-auth').addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    const authTitle = document.getElementById('auth-title');
    const toggleAuthBtn = document.getElementById('toggle-auth');
    const submitBtnText = document.querySelector('#login-btn .btn-text');
    
    if (isRegisterMode) {
        authTitle.textContent = 'Daftar Admin Baru';
        submitBtnText.textContent = 'DAFTAR';
        toggleAuthBtn.textContent = 'Sudah Punya Akun? Masuk';
    } else {
        authTitle.textContent = 'Login Admin';
        submitBtnText.textContent = 'MASUK';
        toggleAuthBtn.textContent = 'Daftar Admin Baru';
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.classList.add('btn-loading');
    try {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        if (isRegisterMode) {
            await auth.createUserWithEmailAndPassword(email, pass);
            Swal.fire('Berhasil', 'Akun admin berhasil dibuat dan Anda telah login secara otomatis!', 'success');
        } else {
            await auth.signInWithEmailAndPassword(email, pass);
        }
    } catch (error) {
        console.error("Auth Error Detail:", error);
        Swal.fire(isRegisterMode ? 'Gagal Mendaftar' : 'Login Gagal', `${error.message} (Code: ${error.code})`, 'error');
    } finally {
        btn.classList.remove('btn-loading');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

// --- HELPER: UPLOAD TO IMGBB ---
async function uploadToImgBB(file) {
    // Batas ukuran file (dalam KB)
    const MAX_SIZE_KB = 100;
    const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;
    if (file.size > MAX_SIZE_BYTES) {
        // Jika file lebih besar dari batas, lempar error yang akan ditangkap oleh Swal
        throw new Error(`Ukuran file gambar terlalu besar. Maksimal ${MAX_SIZE_KB} KB.`);
    }

    const formData = new FormData();
    formData.append('image', file);
    const IMGBB_API_KEY = 'e3112a88722d9ee022c18c7c7f824183'; 
    const targetUrl = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
    
    try {
        const response = await fetch(targetUrl, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) {
            let finalUrl = data.data.url;
            if (finalUrl.includes('i.ibb.co') && !finalUrl.includes('i.ibb.co.com')) finalUrl = finalUrl.replace('i.ibb.co', 'i.ibb.co.com');
            return finalUrl;
        }
        throw new Error(data.error ? data.error.message : "Gagal menerima respons dari server ImgBB.");
    } catch (error) {
        if (error.message.startsWith('Ukuran file')) {
            throw error; // Lemparkan kembali error spesifik tentang ukuran
        }
        throw new Error("Gagal mengunggah gambar. Pastikan koneksi internet Anda stabil.");
    }
}

// --- FETCH DATA ---
async function fetchEvents() {
    try {
        const snapshot = await db.collection("events").orderBy("dateISO", "desc").get({ source: 'server' });
        allEvents = [];
        const tbody = document.getElementById('events-table-body');
        tbody.innerHTML = '';
        const today = new Date().toISOString().split('T')[0];

        snapshot.forEach(doc => {
            const ev = { id: doc.id, ...doc.data() };
            let imgSrc = ev.img || '../images/av.jpg';
            if (imgSrc.includes('i.ibb.co') && !imgSrc.includes('i.ibb.co.com')) {
                imgSrc = imgSrc.replace('i.ibb.co', 'i.ibb.co.com');
            }
            allEvents.push(ev);
            
            // Logika Status Berdasarkan Tanggal
            const isPast = ev.dateISO < today;
            const statusHtml = isPast 
                ? `<span class="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-md text-xs font-bold tracking-wide border border-gray-200">SELESAI</span>`
                : `<span class="bg-green-50 text-green-600 px-3 py-1.5 rounded-md text-xs font-bold tracking-wide border border-green-200">AKAN DATANG</span>`;

            tbody.innerHTML += `
                <tr class="hover:bg-gray-50/80 transition-colors group">
                    <td class="px-6 py-4 border-b border-gray-100">
                        <img src="${imgSrc}" class="h-16 w-24 object-cover rounded-lg shadow-sm border border-gray-100">
                    </td>
                    <td class="px-6 py-4 border-b border-gray-100">
                        <div class="font-bold text-gray-800">${ev.title}</div>
                        <div class="text-xs text-gray-500 mt-1 capitalize flex items-center gap-1.5"><i class="fas fa-tag text-gray-400"></i> ${ev.category} <span class="text-gray-300">•</span> <i class="fas fa-map-marker-alt text-gray-400"></i> ${ev.location}</div>
                    </td>
                    <td class="px-6 py-4 border-b border-gray-100 font-medium text-sm text-gray-600">${ev.dateISO} <br><span class="text-xs text-gray-400 font-normal">${ev.dateStr}</span></td>
                    <td class="px-6 py-4 border-b border-gray-100">${statusHtml}</td>
                    <td class="px-6 py-4 border-b border-gray-100 text-right">
                        <button onclick="editEvent('${ev.id}')" class="text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 p-2.5 rounded-lg mr-2 transition-all shadow-sm"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteEvent('${ev.id}')" class="text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 p-2.5 rounded-lg transition-all shadow-sm"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        Swal.fire('Error', 'Gagal memuat data: ' + e.message, 'error');
    }
}

// --- MODAL HANDLING ---
function openEventModal() {
    document.getElementById('event-form').reset();
    document.getElementById('ev-id').value = '';
    document.getElementById('ev-img-url').value = '';
    document.getElementById('img-preview-container').classList.add('hidden');
    document.getElementById('modal-title').textContent = 'Tambah Event Baru';
    document.getElementById('event-modal').classList.remove('hidden');
    document.getElementById('event-modal').classList.add('flex');
}

function closeEventModal() {
    document.getElementById('event-modal').classList.add('hidden');
    document.getElementById('event-modal').classList.remove('flex');
}

// --- NEWS TAB LOGIC ---
async function fetchNews() {
    try {
        const snapshot = await db.collection("news").orderBy("date", "desc").get({ source: 'server' });
        allNews = [];
        const tbody = document.getElementById('news-table-body');
        tbody.innerHTML = '';

        snapshot.forEach(doc => {
            const nw = { id: doc.id, ...doc.data() };
            let imgSrc = nw.img1 || '../images/av.jpg';
            if (imgSrc.includes('i.ibb.co') && !imgSrc.includes('i.ibb.co.com')) imgSrc = imgSrc.replace('i.ibb.co', 'i.ibb.co.com');
            allNews.push(nw);
            
            const featBadge = nw.isFeatured ? `<span class="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-md text-xs font-bold tracking-wide border border-amber-200"><i class="fas fa-star mr-1"></i> Featured</span>` : '';

            tbody.innerHTML += `
                <tr class="hover:bg-gray-50/80 transition-colors group">
                    <td class="px-6 py-4 border-b border-gray-100">
                        <img src="${imgSrc}" class="h-16 w-24 object-cover rounded-lg shadow-sm border border-gray-100">
                    </td>
                    <td class="px-6 py-4 border-b border-gray-100">
                        <div class="font-bold text-gray-800">${nw.title}</div>
                        <div class="text-xs text-gray-500 mt-1 capitalize flex items-center gap-1.5"><i class="fas fa-tag text-gray-400"></i> ${nw.category}</div>
                    </td>
                    <td class="px-6 py-4 border-b border-gray-100 font-medium text-sm text-gray-600">${nw.date}</td>
                    <td class="px-6 py-4 border-b border-gray-100">${featBadge}</td>
                    <td class="px-6 py-4 border-b border-gray-100 text-right">
                        <button onclick="editNews('${nw.id}')" class="text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 p-2.5 rounded-lg mr-2 transition-all shadow-sm"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteNews('${nw.id}')" class="text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 p-2.5 rounded-lg transition-all shadow-sm"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (e) { console.error(e); }
}

document.getElementById('ev-img-file').addEventListener('change', function() {
    if (this.files[0]) {
        document.getElementById('ev-img-preview').src = URL.createObjectURL(this.files[0]);
        document.getElementById('img-preview-container').classList.remove('hidden');
    }
});

window.editEvent = (id) => {
    const ev = allEvents.find(e => e.id === id);
    if (!ev) return;
    
    document.getElementById('modal-title').textContent = 'Edit Event';
    document.getElementById('ev-id').value = ev.id;
    document.getElementById('ev-title').value = ev.title;
    document.getElementById('ev-dateISO').value = ev.dateISO;
    document.getElementById('ev-dateStr').value = ev.dateStr;
    document.getElementById('ev-category').value = ev.category;
    document.getElementById('ev-location').value = ev.location;
    document.getElementById('ev-link').value = ev.link || '';
    document.getElementById('ev-desc').value = ev.desc;
    
    let safePreviewUrl = ev.img || '';
    if (safePreviewUrl.includes('i.ibb.co') && !safePreviewUrl.includes('i.ibb.co.com')) {
        safePreviewUrl = safePreviewUrl.replace('i.ibb.co', 'i.ibb.co.com');
    }
    
    document.getElementById('ev-img-url').value = safePreviewUrl;
    
    if (safePreviewUrl) {
        document.getElementById('ev-img-preview').src = safePreviewUrl;
        document.getElementById('img-preview-container').classList.remove('hidden');
    }
    
    document.getElementById('event-modal').classList.remove('hidden');
    document.getElementById('event-modal').classList.add('flex');
};

// --- SAVE EVENT ---
document.getElementById('event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-event-btn');
    btn.classList.add('btn-loading');
    
    try {
        let imgUrl = document.getElementById('ev-img-url').value;
        
        if (imgUrl.includes('i.ibb.co') && !imgUrl.includes('i.ibb.co.com')) {
            imgUrl = imgUrl.replace('i.ibb.co', 'i.ibb.co.com');
        }

        const file = document.getElementById('ev-img-file').files[0];
        if (file) {
            imgUrl = await uploadToImgBB(file);
        }
        
        const eventData = {
            title: document.getElementById('ev-title').value,
            dateISO: document.getElementById('ev-dateISO').value,
            dateStr: document.getElementById('ev-dateStr').value,
            category: document.getElementById('ev-category').value,
            location: document.getElementById('ev-location').value,
            link: document.getElementById('ev-link').value,
            desc: document.getElementById('ev-desc').value,
            img: imgUrl
        };
        
        const id = document.getElementById('ev-id').value;
        if (id) {
            await db.collection("events").doc(id).update(eventData);
            Swal.fire('Berhasil', 'Event berhasil diperbarui', 'success');
        } else {
            if(!imgUrl) throw new Error("Gambar wajib diunggah untuk event baru!");
            await db.collection("events").add(eventData);
            Swal.fire('Berhasil', 'Event baru berhasil ditambahkan', 'success');
        }
        
        closeEventModal();
        fetchEvents();
    } catch (err) {
        Swal.fire('Gagal', err.message, 'error');
    } finally {
        btn.classList.remove('btn-loading');
    }
});

// --- DELETE EVENT ---
window.deleteEvent = async (id) => {
    const result = await Swal.fire({
        title: 'Hapus event ini?', text: "Tindakan ini tidak dapat dibatalkan!", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus!'
    });
    if (result.isConfirmed) {
        await db.collection("events").doc(id).delete();
        Swal.fire('Terhapus!', 'Event berhasil dihapus.', 'success');
        fetchEvents();
    }
}

async function fetchCards() {
    try {
        const snapshot = await db.collection("business_cards").orderBy("name").get({ source: 'server' });
        allCards = [];
        const tbody = document.getElementById('cards-table-body');
        tbody.innerHTML = '';

        snapshot.forEach(doc => {
            const card = { id: doc.id, ...doc.data() };
            allCards.push(card);
            let photoSrc = card.photo || '../images/favicon.png';
            const cardUrl = `${window.location.origin}/card.html?id=${card.id}`;

            tbody.innerHTML += `
                <tr class="hover:bg-gray-50/80 transition-colors group">
                    <td class="px-6 py-4 border-b border-gray-100">
                        <div class="flex items-center gap-4">
                            <img src="${photoSrc}" class="h-14 w-14 object-cover rounded-full shadow-sm border border-gray-100">
                            <div>
                                <div class="font-bold text-gray-800">${card.name}</div>
                                <div class="text-xs text-gray-500 mt-1">${card.title}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 border-b border-gray-100">
                        <div class="flex items-center gap-2">
                            <a href="${cardUrl}" target="_blank" class="text-blue-600 hover:underline text-sm truncate max-w-[200px]" title="${cardUrl}">${cardUrl}</a>
                            <button onclick="copyCardLink('${cardUrl}')" class="text-gray-400 hover:text-gray-800 p-1.5 bg-gray-50 hover:bg-gray-200 rounded-md transition-colors" title="Salin Tautan">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </td>
                    <td class="px-6 py-4 border-b border-gray-100">
                        <div class="flex flex-col items-start gap-2">
                            <div onclick="showLargeQR('${card.id}', '${card.name.replace(/'/g, "\\'")}')" id="qr-container-${card.id}" class="p-1.5 bg-white rounded-md shadow-sm border border-gray-100 cursor-pointer hover:border-gold hover:shadow-md transition-all" title="Klik untuk memperbesar"></div>
                            <button onclick="downloadQR('${card.id}', '${card.name.replace(/'/g, "\\'")}')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5"><i class="fas fa-download"></i> Unduh</button>
                        </div>
                    </td>
                    <td class="px-6 py-4 border-b border-gray-100">
                        <div class="flex justify-end gap-2">
                            <button onclick="editCard('${card.id}')" class="text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 p-2.5 rounded-lg transition-all shadow-sm" title="Edit"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteCard('${card.id}')" class="text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 p-2.5 rounded-lg transition-all shadow-sm" title="Hapus"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });

        // Generate QR codes after table is rendered
        allCards.forEach(card => {
            new QRCode(document.getElementById(`qr-container-${card.id}`), { text: `${window.location.origin}/card.html?id=${card.id}`, width: 80, height: 80 });
        });
    } catch (e) { console.error("Fetch cards error:", e); }
}

// --- HELPER: POPULATE EVENT DROPDOWN UNTUK NEWS ---
async function populateEventDropdown() {
    const select = document.getElementById('nw-event-link');
    select.innerHTML = '<option value="">-- Berita Umum (Tidak ditautkan ke Event) --</option>';
    
    // Tarik data event jika belum ada di memory
    if (allEvents.length === 0) {
        const snapshot = await db.collection("events").orderBy("dateISO", "desc").get();
        allEvents = [];
        snapshot.forEach(doc => allEvents.push({ id: doc.id, ...doc.data() }));
    }

    allEvents.forEach(ev => {
        select.innerHTML += `<option value="${ev.id}">${ev.title} (${ev.dateISO})</option>`;
    });
}

// --- NEWS MODAL & SAVE ---
async function openNewsModal() {
    await populateEventDropdown();
    document.getElementById('news-form').reset();
    document.getElementById('nw-id').value = '';
    document.getElementById('nw-img1-url').value = '';
    document.getElementById('nw-img2-url').value = '';
    document.getElementById('nw-img1-preview').classList.add('hidden');
    document.getElementById('nw-img2-preview').classList.add('hidden');
    document.getElementById('news-modal-title').textContent = 'Tambah Berita Baru';
    document.getElementById('news-modal').classList.remove('hidden');
    document.getElementById('news-modal').classList.add('flex');
}

function closeNewsModal() {
    document.getElementById('news-modal').classList.add('hidden');
    document.getElementById('news-modal').classList.remove('flex');
}

document.getElementById('nw-img1-file').addEventListener('change', function(){ if(this.files[0]) { document.getElementById('nw-img1-preview').src = URL.createObjectURL(this.files[0]); document.getElementById('nw-img1-preview').classList.remove('hidden'); } });
document.getElementById('nw-img2-file').addEventListener('change', function(){ if(this.files[0]) { document.getElementById('nw-img2-preview').src = URL.createObjectURL(this.files[0]); document.getElementById('nw-img2-preview').classList.remove('hidden'); } });

// EVENT LISTENER: Auto-fill Form jika Event dipilih
document.getElementById('nw-event-link').addEventListener('change', (e) => {
    const evId = e.target.value;
    if (!evId) return;
    const ev = allEvents.find(x => x.id === evId);
    if (ev) {
        if (!document.getElementById('nw-title').value) document.getElementById('nw-title').value = ev.title;
        if (!document.getElementById('nw-date').value) document.getElementById('nw-date').value = ev.dateISO;
        if (!document.getElementById('nw-location').value) document.getElementById('nw-location').value = ev.location || '';
    }
});

window.editNews = async (id) => {
    const nw = allNews.find(n => n.id === id);
    if(!nw) return;
    await populateEventDropdown();
    document.getElementById('news-modal-title').textContent = 'Edit Berita';
    document.getElementById('nw-id').value = nw.id;
    document.getElementById('nw-title').value = nw.title;
    document.getElementById('nw-category').value = nw.category;
    document.getElementById('nw-featured').checked = nw.isFeatured || false;
    document.getElementById('nw-date').value = nw.date;
    document.getElementById('nw-location').value = nw.location || '';
    document.getElementById('nw-snippet').value = nw.snippet;
    document.getElementById('nw-content1').value = nw.content1 || '';
    document.getElementById('nw-content2').value = nw.content2 || '';
    document.getElementById('nw-img2-caption').value = nw.img2Caption || '';
    document.getElementById('nw-event-link').value = nw.linkedEventId || '';
    
    document.getElementById('nw-img1-url').value = nw.img1 || '';
    if(nw.img1) { document.getElementById('nw-img1-preview').src = nw.img1; document.getElementById('nw-img1-preview').classList.remove('hidden'); }
    
    document.getElementById('nw-img2-url').value = nw.img2 || '';
    if(nw.img2) { document.getElementById('nw-img2-preview').src = nw.img2; document.getElementById('nw-img2-preview').classList.remove('hidden'); }

    document.getElementById('news-modal').classList.remove('hidden');
    document.getElementById('news-modal').classList.add('flex');
}

document.getElementById('news-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-news-btn');
    btn.classList.add('btn-loading');
    
    try {
        let img1Url = document.getElementById('nw-img1-url').value;
        let img2Url = document.getElementById('nw-img2-url').value;
        
        const file1 = document.getElementById('nw-img1-file').files[0];
        if(file1) img1Url = await uploadToImgBB(file1);
        
        const file2 = document.getElementById('nw-img2-file').files[0];
        if(file2) img2Url = await uploadToImgBB(file2);

        const newsData = {
            title: document.getElementById('nw-title').value,
            category: document.getElementById('nw-category').value,
            isFeatured: document.getElementById('nw-featured').checked,
            date: document.getElementById('nw-date').value,
            location: document.getElementById('nw-location').value,
            snippet: document.getElementById('nw-snippet').value,
            content1: document.getElementById('nw-content1').value,
            content2: document.getElementById('nw-content2').value,
            img2Caption: document.getElementById('nw-img2-caption').value,
            img1: img1Url,
            img2: img2Url,
            linkedEventId: document.getElementById('nw-event-link').value
        };

        const id = document.getElementById('nw-id').value;
        if (id) {
            await db.collection("news").doc(id).update(newsData);
            Swal.fire('Berhasil', 'Berita berhasil diperbarui', 'success');
        } else {
            if(!img1Url) throw new Error("Gambar Utama wajib diunggah!");
            
            // Membuat ID custom (slug) dari judul (contoh: Berita Terbaru -> berita-terbaru)
            let customId = newsData.title.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
            if (!customId) customId = Date.now().toString(); 
            
            // Cek apakah custom ID ini sudah dipakai
            const checkDoc = await db.collection("news").doc(customId).get();
            if (checkDoc.exists) {
                customId = customId + '-' + Math.floor(Math.random() * 1000);
            }
            
            await db.collection("news").doc(customId).set(newsData);
            Swal.fire('Berhasil', 'Berita baru berhasil ditambahkan', 'success');
        }
        closeNewsModal();
        fetchNews();
    } catch(err) {
        Swal.fire('Gagal', err.message, 'error');
    } finally {
        btn.classList.remove('btn-loading');
    }
});

window.deleteNews = async (id) => {
    const result = await Swal.fire({ title: 'Hapus berita ini?', text: "Tindakan ini tidak dapat dibatalkan!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus!' });
    if (result.isConfirmed) {
        await db.collection("news").doc(id).delete();
        Swal.fire('Terhapus!', 'Berita berhasil dihapus.', 'success');
        fetchNews();
    }
}

// --- BUSINESS CARD MODAL & SAVE ---
function openCardModal() {
    document.getElementById('card-form').reset();
    document.getElementById('c-id').value = '';
    document.getElementById('c-photo-url').value = '';
    document.getElementById('c-photo2-url').value = '';
    document.getElementById('c-photo-preview').classList.add('hidden');
    document.getElementById('c-photo2-preview').classList.add('hidden');
    document.getElementById('card-modal-title').textContent = 'Tambah Kartu Nama';
    document.getElementById('card-modal').classList.remove('hidden');
    document.getElementById('card-modal').classList.add('flex');
}

function closeCardModal() {
    document.getElementById('card-modal').classList.add('hidden');
    document.getElementById('card-modal').classList.remove('flex');
}

document.getElementById('c-photo-file').addEventListener('change', function(){ if(this.files[0]) { document.getElementById('c-photo-preview').src = URL.createObjectURL(this.files[0]); document.getElementById('c-photo-preview').classList.remove('hidden'); } });
document.getElementById('c-photo2-file').addEventListener('change', function(){ if(this.files[0]) { document.getElementById('c-photo2-preview').src = URL.createObjectURL(this.files[0]); document.getElementById('c-photo2-preview').classList.remove('hidden'); } });

window.editCard = (id) => {
    const card = allCards.find(c => c.id === id);
    if(!card) return;
    document.getElementById('card-modal-title').textContent = 'Edit Kartu Nama';
    document.getElementById('c-id').value = card.id;
    document.getElementById('c-name').value = card.name;
    document.getElementById('c-title').value = card.title;
    document.getElementById('c-phone').value = card.phone || '';
    document.getElementById('c-whatsapp').value = card.whatsapp || '';
    document.getElementById('c-email').value = card.email || '';
    document.getElementById('c-linkedin').value = card.linkedin || '';
    document.getElementById('c-photo-url').value = card.photo || '';
    document.getElementById('c-photo2-url').value = card.photo2 || '';
    if(card.photo) { document.getElementById('c-photo-preview').src = card.photo; document.getElementById('c-photo-preview').classList.remove('hidden'); }
    if(card.photo2) { document.getElementById('c-photo2-preview').src = card.photo2; document.getElementById('c-photo2-preview').classList.remove('hidden'); }
    document.getElementById('card-modal').classList.remove('hidden');
    document.getElementById('card-modal').classList.add('flex');
}

document.getElementById('card-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-card-btn');
    btn.classList.add('btn-loading');
    
    try {
        let photoUrl = document.getElementById('c-photo-url').value;
        let photo2Url = document.getElementById('c-photo2-url').value;
        const file = document.getElementById('c-photo-file').files[0];
        const file2 = document.getElementById('c-photo2-file').files[0];
        if(file) photoUrl = await uploadToImgBB(file);
        if(file2) photo2Url = await uploadToImgBB(file2);

        const cardData = {
            name: document.getElementById('c-name').value,
            title: document.getElementById('c-title').value,
            phone: document.getElementById('c-phone').value,
            whatsapp: document.getElementById('c-whatsapp').value,
            email: document.getElementById('c-email').value,
            linkedin: document.getElementById('c-linkedin').value,
            photo: photoUrl,
            photo2: photo2Url
        };

        const id = document.getElementById('c-id').value;
        if (id) {
            await db.collection("business_cards").doc(id).update(cardData);
            Swal.fire('Berhasil', 'Kartu nama berhasil diperbarui', 'success');
        } else {
            if(!photoUrl) throw new Error("Foto profil wajib diunggah!");
            
            // Membuat ID custom dari nama (contoh: Raphael Kodrata -> raphael-kodrata)
            let customId = cardData.name.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
            if (!customId) customId = Date.now().toString(); // Fallback jika nama kosong/aneh
            
            // Cek apakah custom ID ini sudah dipakai (misal ada 2 nama yang persis sama)
            const checkDoc = await db.collection("business_cards").doc(customId).get();
            if (checkDoc.exists) {
                customId = customId + '-' + Math.floor(Math.random() * 1000);
            }
            
            await db.collection("business_cards").doc(customId).set(cardData);
            Swal.fire('Berhasil', 'Kartu nama baru berhasil ditambahkan', 'success');
        }
        closeCardModal();
        fetchCards();
    } catch(err) { Swal.fire('Gagal', err.message, 'error'); } 
    finally { btn.classList.remove('btn-loading'); }
});

window.deleteCard = async (id) => {
    const result = await Swal.fire({ title: 'Hapus kartu nama ini?', text: "Tindakan ini tidak dapat dibatalkan!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus!' });
    if (result.isConfirmed) {
        await db.collection("business_cards").doc(id).delete();
        Swal.fire('Terhapus!', 'Kartu nama berhasil dihapus.', 'success');
        fetchCards();
    }
}

// --- HELPER: COPY LINK & DOWNLOAD QR ---
window.copyCardLink = (url) => {
    navigator.clipboard.writeText(url).then(() => {
        Swal.fire({toast:true, position:'top-end', showConfirmButton:false, timer:2000, icon:'success', title:'Tautan berhasil disalin!'});
    });
};

window.downloadQR = (id, name) => {
    const container = document.getElementById(`qr-container-${id}`);
    const img = container.querySelector('img');
    const canvas = container.querySelector('canvas');
    
    let url = (img && img.src && img.src.includes('base64')) ? img.src : (canvas ? canvas.toDataURL("image/png") : '');

    if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `QR_Card_${name.replace(/\s/g, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        Swal.fire('Gagal', 'Kode QR belum selesai dimuat, silakan coba beberapa saat lagi.', 'error');
    }
};

// --- GALLERY MANAGEMENT ---
async function fetchGallery() {
    try {
        const doc = await db.collection("siteContent").doc("gallery").get({ source: 'server' });
        allGalleryItems = (doc.exists && doc.data().items) ? doc.data().items : [];

        allGalleryItems = allGalleryItems.map((item, index) => {
            if (!item.id) item.id = 'gal_' + Date.now() + '_' + index;
            return item;
        });

        const tbody = document.getElementById('gallery-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const catMap = {
            'corporate': 'Corporate Event',
            'konser': 'Concert & Entertainment',
            'wedding': 'Wedding & Private',
            'venue': 'Venue & Facilities'
        };

        allGalleryItems.forEach(gal => {
            let imgSrc = gal.img || '../images/av.jpg';
            if (imgSrc.includes('i.ibb.co') && !imgSrc.includes('i.ibb.co.com')) imgSrc = imgSrc.replace('i.ibb.co', 'i.ibb.co.com');
            const categoryLabel = catMap[gal.category] || gal.category;

            tbody.innerHTML += `
                <tr class="hover:bg-gray-50/80 transition-colors group">
                    <td class="px-6 py-4 border-b border-gray-100">
                        <img src="${imgSrc}" class="h-16 w-24 object-cover rounded-lg shadow-sm border border-gray-100">
                    </td>
                    <td class="px-6 py-4 border-b border-gray-100">
                        <div class="font-bold text-gray-800">${categoryLabel}</div>
                        <div class="text-xs text-gray-500 mt-1">Alt: ${gal.alt || '-'}</div>
                    </td>
                    <td class="px-6 py-4 border-b border-gray-100 text-right">
                        <button onclick="editGallery('${gal.id}')" class="text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 p-2.5 rounded-lg mr-2 transition-all shadow-sm" title="Edit"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteGallery('${gal.id}')" class="text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 p-2.5 rounded-lg transition-all shadow-sm" title="Hapus"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (e) { console.error("Fetch gallery error:", e); }
}

window.openGalleryModal = () => {
    const form = document.getElementById('gallery-form');
    if(form) form.reset();
    document.getElementById('gal-id').value = '';
    document.getElementById('gal-img-url').value = '';
    const preview = document.getElementById('gal-img-preview');
    if(preview) preview.classList.add('hidden');
    document.getElementById('gallery-modal-title').textContent = 'Tambah Gambar Galeri';
    const modal = document.getElementById('gallery-modal');
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
}

window.closeGalleryModal = () => {
    const modal = document.getElementById('gallery-modal');
    if(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

const galImgFile = document.getElementById('gal-img-file');
if(galImgFile) {
    galImgFile.addEventListener('change', function(){ 
        if(this.files[0]) { 
            const preview = document.getElementById('gal-img-preview');
            preview.src = URL.createObjectURL(this.files[0]); 
            preview.classList.remove('hidden'); 
        } 
    });
}

window.editGallery = (id) => {
    const gal = allGalleryItems.find(g => g.id === id);
    if(!gal) return;
    document.getElementById('gallery-modal-title').textContent = 'Edit Gambar Galeri';
    document.getElementById('gal-id').value = gal.id;
    document.getElementById('gal-category').value = gal.category;
    document.getElementById('gal-alt').value = gal.alt || '';
    document.getElementById('gal-img-url').value = gal.img || '';
    
    const preview = document.getElementById('gal-img-preview');
    if(gal.img) { preview.src = gal.img; preview.classList.remove('hidden'); }
    
    const modal = document.getElementById('gallery-modal');
    modal.classList.remove('hidden'); modal.classList.add('flex');
}

const galForm = document.getElementById('gallery-form');
if(galForm) {
    galForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-gallery-btn');
        btn.classList.add('btn-loading');
        
        try {
            let imgUrl = document.getElementById('gal-img-url').value;
            const file = document.getElementById('gal-img-file').files[0];
            if(file) imgUrl = await uploadToImgBB(file);
            if(!imgUrl) throw new Error("Gambar wajib diunggah!");

            const id = document.getElementById('gal-id').value;
            const galData = {
                img: imgUrl,
                category: document.getElementById('gal-category').value,
                alt: document.getElementById('gal-alt').value,
                id: id || 'gal_' + Date.now()
            };

            if (id) {
                const idx = allGalleryItems.findIndex(g => g.id === id);
                if(idx > -1) allGalleryItems[idx] = galData;
            } else {
                allGalleryItems.unshift(galData); // Tambahkan foto terbaru di urutan paling depan
            }

            await db.collection("siteContent").doc("gallery").set({ items: allGalleryItems });
            Swal.fire('Berhasil', 'Gambar galeri berhasil disimpan', 'success');
            closeGalleryModal();
            fetchGallery();
        } catch(err) { Swal.fire('Gagal', err.message, 'error'); } 
        finally { btn.classList.remove('btn-loading'); }
    });
}

window.deleteGallery = async (id) => {
    const result = await Swal.fire({ title: 'Hapus gambar ini?', text: "Tindakan ini tidak dapat dibatalkan!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus!' });
    if (result.isConfirmed) {
        allGalleryItems = allGalleryItems.filter(g => g.id !== id);
        await db.collection("siteContent").doc("gallery").set({ items: allGalleryItems });
        Swal.fire('Terhapus!', 'Gambar berhasil dihapus dari galeri.', 'success');
        fetchGallery();
    }
}

window.showLargeQR = (id, name) => {
    const container = document.getElementById(`qr-container-${id}`);
    const img = container.querySelector('img');
    const canvas = container.querySelector('canvas');
    
    let url = (img && img.src && img.src.includes('base64')) ? img.src : (canvas ? canvas.toDataURL("image/png") : '');

    if (url) {
        Swal.fire({
            title: 'Kode QR',
            text: name,
            imageUrl: url,
            imageWidth: 250,
            imageHeight: 250,
            imageAlt: `Kode QR ${name}`,
            confirmButtonColor: '#d4a742',
            confirmButtonText: 'Tutup'
        });
    }
};
