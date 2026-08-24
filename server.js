const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'AdminVenue2026!',
    server: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsdb',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'ajmn-admin-secret-change-this';
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname || '').toLowerCase();
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const upload = multer({ storage });
const bookingUpload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 150);
}

function toDateOnly(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
}

function normalizeText(value) {
    return value === undefined || value === null ? null : String(value);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const derivedKey = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, key] = storedHash.split(':');
    const derivedKey = crypto.scryptSync(String(password), salt, 64).toString('hex');
    const left = Buffer.from(key, 'hex');
    const right = Buffer.from(derivedKey, 'hex');
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function base64UrlEncode(input) {
    return Buffer.from(JSON.stringify(input)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(input) {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

function createToken(payload) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const body = {
        ...payload,
        iat: now,
        exp: now + (60 * 60 * 8)
    };

    const unsigned = `${base64UrlEncode(header)}.${base64UrlEncode(body)}`;
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(unsigned).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${unsigned}.${signature}`;
}

function verifyToken(token) {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;
    const unsigned = `${headerPart}.${payloadPart}`;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(unsigned).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    if (expectedSignature !== signaturePart) return null;

    const payload = base64UrlDecode(payloadPart);
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
}

function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    req.admin = payload;
    next();
}

function requireRole(allowedRoles) {
    return (req, res, next) => {
        const role = String(req.admin?.role || '').toLowerCase();
        if (!allowedRoles.map(r => String(r).toLowerCase()).includes(role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
}

async function fetchOne(query, inputs = {}) {
    await poolConnect;
    const request = pool.request();
    for (const [key, value] of Object.entries(inputs)) {
        request.input(key, value.type, value.value);
    }
    const result = await request.query(query);
    return result.recordset[0] || null;
}

async function runQuery(query, inputs = {}) {
    await poolConnect;
    const request = pool.request();
    for (const [key, value] of Object.entries(inputs)) {
        request.input(key, value.type, value.value);
    }
    return request.query(query);
}

function mapNewsRow(row) {
    return {
        Id: row.Id,
        id: row.Id,
        Title: row.Title,
        title: row.Title,
        Category: row.Category,
        category: row.Category,
        Date: row.Date,
        EventDate: row.Date,
        date: row.Date,
        Location: row.Location,
        location: row.Location,
        Snippet: row.Snippet,
        snippet: row.Snippet,
        Content1: row.Content1,
        content1: row.Content1,
        Content2: row.Content2,
        content2: row.Content2,
        Img1: row.Img1,
        Img1Url: row.Img1,
        img1: row.Img1,
        Img2: row.Img2,
        Img2Url: row.Img2,
        img2: row.Img2,
        Img2Caption: row.Img2Caption,
        img2Caption: row.Img2Caption,
        IsFeatured: !!row.IsFeatured,
        isFeatured: !!row.IsFeatured,
        LinkedEventId: row.LinkedEventId,
        linkedEventId: row.LinkedEventId,
        CreatedAt: row.CreatedAt,
        UpdatedAt: row.UpdatedAt
    };
}

function mapEventRow(row) {
    return {
        id: row.Id,
        Id: row.Id,
        title: row.Title,
        Title: row.Title,
        dateISO: row.DateISO,
        DateISO: row.DateISO,
        dateStr: row.DateStr,
        DateStr: row.DateStr,
        category: row.Category,
        Category: row.Category,
        location: row.Location,
        Location: row.Location,
        link: row.Link,
        Link: row.Link,
        desc: row['Desc'],
        Desc: row['Desc'],
        img: row.Img,
        Img: row.Img,
        CreatedAt: row.CreatedAt,
        UpdatedAt: row.UpdatedAt
    };
}

function mapPublicEventRow(row) {
    return {
        Id: row.Id,
        Title: row.Title,
        DisplayDate: row.DateStr,
        Category: row.Category,
        Location: row.Location,
        RegistrationLink: row.Link,
        Description: row['Desc'],
        ImgPath: row.Img,
        dateISO: row.DateISO,
        dateStr: row.DateStr,
        category: row.Category,
        location: row.Location,
        link: row.Link,
        desc: row['Desc'],
        img: row.Img
    };
}

function mapCardRow(row) {
    return {
        id: row.Id,
        Id: row.Id,
        name: row.Name,
        Name: row.Name,
        title: row.Title,
        Title: row.Title,
        phone: row.Phone,
        Phone: row.Phone,
        whatsapp: row.WhatsApp,
        WhatsApp: row.WhatsApp,
        email: row.Email,
        Email: row.Email,
        linkedin: row.LinkedIn,
        LinkedIn: row.LinkedIn,
        photo: row.Photo,
        Photo: row.Photo,
        photo2: row.Photo2,
        Photo2: row.Photo2,
        CreatedAt: row.CreatedAt,
        UpdatedAt: row.UpdatedAt
    };
}

function mapGalleryRow(row) {
    return {
        id: row.Id,
        Id: row.Id,
        img: row.Img,
        Img: row.Img,
        category: row.Category,
        Category: row.Category,
        alt: row.Alt,
        Alt: row.Alt,
        sortOrder: row.SortOrder,
        SortOrder: row.SortOrder,
        CreatedAt: row.CreatedAt,
        UpdatedAt: row.UpdatedAt
    };
}

async function ensureSchema() {
    await poolConnect;

    await runQuery(`
        IF OBJECT_ID('dbo.AdminUsers', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.AdminUsers (
                Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_AdminUsers_Id DEFAULT NEWID(),
                Name NVARCHAR(100) NOT NULL,
                Email NVARCHAR(255) NOT NULL,
                PasswordHash NVARCHAR(255) NOT NULL,
                Role NVARCHAR(30) NOT NULL CONSTRAINT DF_AdminUsers_Role DEFAULT 'admin',
                IsActive BIT NOT NULL CONSTRAINT DF_AdminUsers_IsActive DEFAULT 1,
                CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_AdminUsers_CreatedAt DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_AdminUsers_UpdatedAt DEFAULT SYSUTCDATETIME(),
                CONSTRAINT PK_AdminUsers PRIMARY KEY (Id),
                CONSTRAINT UQ_AdminUsers_Email UNIQUE (Email)
            );
        END
    `);

    await runQuery(`
        IF OBJECT_ID('dbo.News', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.News (
                Id NVARCHAR(150) NOT NULL CONSTRAINT PK_News PRIMARY KEY,
                Title NVARCHAR(200) NOT NULL,
                Category NVARCHAR(50) NOT NULL,
                [Date] DATE NOT NULL,
                Location NVARCHAR(200) NULL,
                Snippet NVARCHAR(500) NOT NULL,
                Content1 NVARCHAR(MAX) NULL,
                Content2 NVARCHAR(MAX) NULL,
                Img1 NVARCHAR(500) NOT NULL,
                Img2 NVARCHAR(500) NULL,
                Img2Caption NVARCHAR(250) NULL,
                IsFeatured BIT NOT NULL CONSTRAINT DF_News_IsFeatured DEFAULT 0,
                LinkedEventId NVARCHAR(150) NULL,
                CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_News_CreatedAt DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_News_UpdatedAt DEFAULT SYSUTCDATETIME()
            );
        END
    `);

    await runQuery(`
        IF OBJECT_ID('dbo.Events', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Events (
                Id NVARCHAR(150) NOT NULL CONSTRAINT PK_Events PRIMARY KEY,
                Title NVARCHAR(200) NOT NULL,
                DateISO DATE NOT NULL,
                DateStr NVARCHAR(120) NOT NULL,
                Category NVARCHAR(50) NOT NULL,
                Location NVARCHAR(200) NOT NULL,
                Link NVARCHAR(500) NULL,
                [Desc] NVARCHAR(MAX) NOT NULL,
                Img NVARCHAR(500) NOT NULL,
                CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Events_CreatedAt DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Events_UpdatedAt DEFAULT SYSUTCDATETIME()
            );
        END
    `);

    await runQuery(`
        IF OBJECT_ID('dbo.BusinessCards', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.BusinessCards (
                Id NVARCHAR(150) NOT NULL CONSTRAINT PK_BusinessCards PRIMARY KEY,
                Name NVARCHAR(100) NOT NULL,
                Title NVARCHAR(100) NOT NULL,
                Phone NVARCHAR(50) NULL,
                WhatsApp NVARCHAR(50) NULL,
                Email NVARCHAR(255) NULL,
                LinkedIn NVARCHAR(500) NULL,
                Photo NVARCHAR(500) NOT NULL,
                Photo2 NVARCHAR(500) NULL,
                CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_BusinessCards_CreatedAt DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_BusinessCards_UpdatedAt DEFAULT SYSUTCDATETIME()
            );
        END
    `);

    await runQuery(`
        IF OBJECT_ID('dbo.GalleryItems', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.GalleryItems (
                Id NVARCHAR(150) NOT NULL CONSTRAINT PK_GalleryItems PRIMARY KEY,
                Img NVARCHAR(500) NOT NULL,
                Category NVARCHAR(50) NOT NULL,
                Alt NVARCHAR(250) NULL,
                SortOrder INT NOT NULL CONSTRAINT DF_GalleryItems_SortOrder DEFAULT 0,
                CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_GalleryItems_CreatedAt DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_GalleryItems_UpdatedAt DEFAULT SYSUTCDATETIME()
            );
        END
    `);
}

async function ensureDefaultNewsAdmin() {
    const defaultEmail = 'adminnews@ajmn.com';
    const defaultPassword = 'adminajmn123';
    const existing = await findAdminByEmail(defaultEmail);

    if (!existing) {
        const passwordHash = hashPassword(defaultPassword);
        await runQuery(
            `INSERT INTO dbo.AdminUsers (Name, Email, PasswordHash, Role)
             VALUES (@name, @email, @passwordHash, @role)`,
            {
                name: { type: sql.NVarChar, value: 'Admin News' },
                email: { type: sql.NVarChar, value: defaultEmail },
                passwordHash: { type: sql.NVarChar, value: passwordHash },
                role: { type: sql.NVarChar, value: 'news_editor' }
            }
        );
        console.log(`✅ Default news admin dibuat: ${defaultEmail} / ${defaultPassword}`);
    }
}

async function findAdminByEmail(email) {
    return fetchOne(
        'SELECT TOP 1 * FROM dbo.AdminUsers WHERE Email = @email',
        { email: { type: sql.NVarChar, value: email } }
    );
}

async function findAdminById(id) {
    return fetchOne(
        'SELECT TOP 1 * FROM dbo.AdminUsers WHERE Id = @id',
        { id: { type: sql.UniqueIdentifier, value: id } }
    );
}

function responseAdmin(admin) {
    return {
        id: admin.Id,
        name: admin.Name,
        email: admin.Email,
        role: admin.Role,
        isActive: !!admin.IsActive,
        createdAt: admin.CreatedAt,
        updatedAt: admin.UpdatedAt
    };
}

function sanitizeRole(value) {
    const role = String(value || '').trim().toLowerCase();
    if (role === 'news' || role === 'news_editor' || role === 'news-admin') return 'news_editor';
    if (role === 'admin' || role === 'full_admin') return 'admin';
    return 'admin';
}

function uploadResponse(file) {
    return {
        url: `/uploads/${file.filename}`,
        path: `/uploads/${file.filename}`,
        filename: file.filename
    };
}

app.get('/', (_, res) => {
    res.send('Backend API AJMN berjalan.');
});

app.get('/api/health', (_, res) => {
    res.json({ ok: true });
});

app.post('/api/admin/register', async (req, res) => {
    try {
        const name = normalizeText(req.body.name || 'Admin');
        const email = normalizeText(req.body.email || '').trim().toLowerCase();
        const password = normalizeText(req.body.password || '');

        if (!email || !password) {
            return res.status(400).json({ message: 'Email dan password wajib diisi.' });
        }

        const existing = await findAdminByEmail(email);
        if (existing) {
            return res.status(409).json({ message: 'Email admin sudah terdaftar.' });
        }

        const passwordHash = hashPassword(password);
        const role = sanitizeRole(req.body.role);
        const insertResult = await runQuery(
            `INSERT INTO dbo.AdminUsers (Name, Email, PasswordHash, Role) OUTPUT INSERTED.* VALUES (@name, @email, @passwordHash, @role)`,
            {
                name: { type: sql.NVarChar, value: name || 'Admin' },
                email: { type: sql.NVarChar, value: email },
                passwordHash: { type: sql.NVarChar, value: passwordHash },
                role: { type: sql.NVarChar, value: role }
            }
        );

        const admin = insertResult.recordset[0];
        const token = createToken({ sub: String(admin.Id), email: admin.Email, role: admin.Role });
        res.status(201).json({ token, user: responseAdmin(admin) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/admin/register-news', async (req, res) => {
    try {
        const name = normalizeText(req.body.name || 'News Admin');
        const email = normalizeText(req.body.email || '').trim().toLowerCase();
        const password = normalizeText(req.body.password || '');

        if (!email || !password) {
            return res.status(400).json({ message: 'Email dan password wajib diisi.' });
        }

        const existing = await findAdminByEmail(email);
        if (existing) {
            return res.status(409).json({ message: 'Email admin sudah terdaftar.' });
        }

        const passwordHash = hashPassword(password);
        const insertResult = await runQuery(
            `INSERT INTO dbo.AdminUsers (Name, Email, PasswordHash, Role) OUTPUT INSERTED.* VALUES (@name, @email, @passwordHash, @role)`,
            {
                name: { type: sql.NVarChar, value: name || 'News Admin' },
                email: { type: sql.NVarChar, value: email },
                passwordHash: { type: sql.NVarChar, value: passwordHash },
                role: { type: sql.NVarChar, value: 'news_editor' }
            }
        );

        const admin = insertResult.recordset[0];
        const token = createToken({ sub: String(admin.Id), email: admin.Email, role: admin.Role });
        res.status(201).json({ token, user: responseAdmin(admin) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/admin/login', async (req, res) => {
    try {
        const email = normalizeText(req.body.email || '').trim().toLowerCase();
        const password = normalizeText(req.body.password || '');

        if (!email || !password) {
            return res.status(400).json({ message: 'Email dan password wajib diisi.' });
        }

        const admin = await findAdminByEmail(email);
        if (!admin || !admin.IsActive) {
            return res.status(401).json({ message: 'Email atau password salah.' });
        }

        if (!verifyPassword(password, admin.PasswordHash)) {
            return res.status(401).json({ message: 'Email atau password salah.' });
        }

        const token = createToken({ sub: String(admin.Id), email: admin.Email, role: admin.Role });
        res.json({ token, user: responseAdmin(admin) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/admin/me', requireAdmin, async (req, res) => {
    try {
        const admin = await findAdminById(req.admin.sub);
        if (!admin) {
            return res.status(404).json({ message: 'Admin tidak ditemukan.' });
        }

        res.json(responseAdmin(admin));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/admin/logout', requireAdmin, (_, res) => {
    res.json({ message: 'Logout berhasil.' });
});

app.post('/api/uploads/image', requireAdmin, requireRole(['admin', 'news_editor']), upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'File gambar wajib diunggah.' });
    }

    res.status(201).json(uploadResponse(req.file));
});

app.post('/api/booking/proposal', bookingUpload.single('proposal'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'File proposal wajib diunggah.' });
    }

    res.status(201).json(uploadResponse(req.file));
});

app.get('/api/news', async (_, res) => {
    try {
        const result = await runQuery('SELECT * FROM dbo.News ORDER BY [Date] DESC, CreatedAt DESC');
        res.json(result.recordset.map(mapNewsRow));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/news', requireAdmin, requireRole(['admin', 'news_editor']), upload.fields([{ name: 'img1', maxCount: 1 }, { name: 'img2', maxCount: 1 }]), async (req, res) => {
    try {
        const body = req.body || {};
        const title = normalizeText(body.title);
        if (!title) {
            return res.status(400).json({ message: 'Judul berita wajib diisi.' });
        }

        const incomingId = slugify(body.id || body.slug || title || Date.now().toString()) || String(Date.now());
        const img1 = req.files?.img1?.[0] ? `/uploads/${req.files.img1[0].filename}` : normalizeText(body.img1);
        const img2 = req.files?.img2?.[0] ? `/uploads/${req.files.img2[0].filename}` : normalizeText(body.img2);
        const eventDate = toDateOnly(body.date || body.EventDate || body.eventDate) || toDateOnly(new Date());

        const existing = await fetchOne(
            'SELECT TOP 1 Id FROM dbo.News WHERE Id = @id',
            { id: { type: sql.NVarChar, value: incomingId } }
        );

        const finalId = existing ? `${incomingId}-${Date.now()}` : incomingId;

        const insertResult = await runQuery(
            `INSERT INTO dbo.News (Id, Title, Category, [Date], Location, Snippet, Content1, Content2, Img1, Img2, Img2Caption, IsFeatured, LinkedEventId)
             OUTPUT INSERTED.*
             VALUES (@id, @title, @category, @date, @location, @snippet, @content1, @content2, @img1, @img2, @img2Caption, @isFeatured, @linkedEventId)`,
            {
                id: { type: sql.NVarChar, value: finalId },
                title: { type: sql.NVarChar, value: title },
                category: { type: sql.NVarChar, value: normalizeText(body.category) || 'umum' },
                date: { type: sql.Date, value: eventDate },
                location: { type: sql.NVarChar, value: normalizeText(body.location) },
                snippet: { type: sql.NVarChar, value: normalizeText(body.snippet) || '' },
                content1: { type: sql.NVarChar(sql.MAX), value: normalizeText(body.content1) },
                content2: { type: sql.NVarChar(sql.MAX), value: normalizeText(body.content2) },
                img1: { type: sql.NVarChar, value: img1 || '' },
                img2: { type: sql.NVarChar, value: img2 },
                img2Caption: { type: sql.NVarChar, value: normalizeText(body.img2Caption) },
                isFeatured: { type: sql.Bit, value: body.isFeatured === true || body.isFeatured === 'true' || body.IsFeatured === 1 || body.IsFeatured === '1' },
                linkedEventId: { type: sql.NVarChar, value: normalizeText(body.linkedEventId) }
            }
        );

        res.status(201).json(mapNewsRow(insertResult.recordset[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/news/:id', requireAdmin, requireRole(['admin', 'news_editor']), upload.fields([{ name: 'img1', maxCount: 1 }, { name: 'img2', maxCount: 1 }]), async (req, res) => {
    try {
        const id = normalizeText(req.params.id);
        const body = req.body || {};
        const img1 = req.files?.img1?.[0] ? `/uploads/${req.files.img1[0].filename}` : normalizeText(body.img1);
        const img2 = req.files?.img2?.[0] ? `/uploads/${req.files.img2[0].filename}` : normalizeText(body.img2);

        const result = await runQuery(
            `UPDATE dbo.News
             SET Title = @title,
                 Category = @category,
                 [Date] = @date,
                 Location = @location,
                 Snippet = @snippet,
                 Content1 = @content1,
                 Content2 = @content2,
                 Img1 = @img1,
                 Img2 = @img2,
                 Img2Caption = @img2Caption,
                 IsFeatured = @isFeatured,
                 LinkedEventId = @linkedEventId,
                 UpdatedAt = SYSUTCDATETIME()
             OUTPUT INSERTED.*
             WHERE Id = @id`,
            {
                id: { type: sql.NVarChar, value: id },
                title: { type: sql.NVarChar, value: normalizeText(body.title) || '' },
                category: { type: sql.NVarChar, value: normalizeText(body.category) || 'umum' },
                date: { type: sql.Date, value: toDateOnly(body.date || body.EventDate || body.eventDate) || toDateOnly(new Date()) },
                location: { type: sql.NVarChar, value: normalizeText(body.location) },
                snippet: { type: sql.NVarChar, value: normalizeText(body.snippet) || '' },
                content1: { type: sql.NVarChar(sql.MAX), value: normalizeText(body.content1) },
                content2: { type: sql.NVarChar(sql.MAX), value: normalizeText(body.content2) },
                img1: { type: sql.NVarChar, value: img1 || '' },
                img2: { type: sql.NVarChar, value: img2 },
                img2Caption: { type: sql.NVarChar, value: normalizeText(body.img2Caption) },
                isFeatured: { type: sql.Bit, value: body.isFeatured === true || body.isFeatured === 'true' || body.IsFeatured === 1 || body.IsFeatured === '1' },
                linkedEventId: { type: sql.NVarChar, value: normalizeText(body.linkedEventId) }
            }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Berita tidak ditemukan.' });
        }

        res.json(mapNewsRow(result.recordset[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/news/:id', requireAdmin, requireRole(['admin', 'news_editor']), async (req, res) => {
    try {
        const result = await runQuery(
            'DELETE FROM dbo.News OUTPUT DELETED.Id WHERE Id = @id',
            { id: { type: sql.NVarChar, value: normalizeText(req.params.id) } }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Berita tidak ditemukan.' });
        }

        res.json({ message: 'Berita berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/events', async (_, res) => {
    try {
        const result = await runQuery('SELECT * FROM dbo.Events ORDER BY DateISO DESC, CreatedAt DESC');
        res.json(result.recordset.map(mapEventRow));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/events/upcoming', async (_, res) => {
    try {
        const result = await runQuery(
            `SELECT *
             FROM dbo.Events
             WHERE DateISO >= CONVERT(date, GETUTCDATE())
             ORDER BY DateISO ASC, CreatedAt DESC`
        );
        res.json(result.recordset.map(mapPublicEventRow));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/events/past', async (_, res) => {
    try {
        const result = await runQuery(
            `SELECT *
             FROM dbo.Events
             WHERE DateISO < CONVERT(date, GETUTCDATE())
             ORDER BY DateISO DESC, CreatedAt DESC`
        );
        res.json(result.recordset.map(mapPublicEventRow));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/events', requireAdmin, requireRole(['admin']), upload.single('image'), async (req, res) => {
    try {
        const body = req.body || {};
        const title = normalizeText(body.title);
        if (!title) {
            return res.status(400).json({ message: 'Judul event wajib diisi.' });
        }

        const id = slugify(body.id || title || Date.now().toString()) || String(Date.now());
        const img = req.file ? `/uploads/${req.file.filename}` : normalizeText(body.img);

        const result = await runQuery(
            `INSERT INTO dbo.Events (Id, Title, DateISO, DateStr, Category, Location, Link, [Desc], Img)
             OUTPUT INSERTED.*
             VALUES (@id, @title, @dateISO, @dateStr, @category, @location, @link, @desc, @img)`,
            {
                id: { type: sql.NVarChar, value: id },
                title: { type: sql.NVarChar, value: title },
                dateISO: { type: sql.Date, value: toDateOnly(body.dateISO || body.DateISO || body.date) || toDateOnly(new Date()) },
                dateStr: { type: sql.NVarChar, value: normalizeText(body.dateStr || body.DateStr) || '' },
                category: { type: sql.NVarChar, value: normalizeText(body.category) || 'seminar' },
                location: { type: sql.NVarChar, value: normalizeText(body.location) || '' },
                link: { type: sql.NVarChar, value: normalizeText(body.link) },
                desc: { type: sql.NVarChar(sql.MAX), value: normalizeText(body.desc || body.Desc) || '' },
                img: { type: sql.NVarChar, value: img || '' }
            }
        );

        res.status(201).json(mapEventRow(result.recordset[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/events/:id', requireAdmin, requireRole(['admin']), upload.single('image'), async (req, res) => {
    try {
        const body = req.body || {};
        const img = req.file ? `/uploads/${req.file.filename}` : normalizeText(body.img);

        const result = await runQuery(
            `UPDATE dbo.Events
             SET Title = @title,
                 DateISO = @dateISO,
                 DateStr = @dateStr,
                 Category = @category,
                 Location = @location,
                 Link = @link,
                 [Desc] = @desc,
                 Img = @img,
                 UpdatedAt = SYSUTCDATETIME()
             OUTPUT INSERTED.*
             WHERE Id = @id`,
            {
                id: { type: sql.NVarChar, value: normalizeText(req.params.id) },
                title: { type: sql.NVarChar, value: normalizeText(body.title) || '' },
                dateISO: { type: sql.Date, value: toDateOnly(body.dateISO || body.DateISO || body.date) || toDateOnly(new Date()) },
                dateStr: { type: sql.NVarChar, value: normalizeText(body.dateStr || body.DateStr) || '' },
                category: { type: sql.NVarChar, value: normalizeText(body.category) || 'seminar' },
                location: { type: sql.NVarChar, value: normalizeText(body.location) || '' },
                link: { type: sql.NVarChar, value: normalizeText(body.link) },
                desc: { type: sql.NVarChar(sql.MAX), value: normalizeText(body.desc || body.Desc) || '' },
                img: { type: sql.NVarChar, value: img || '' }
            }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Event tidak ditemukan.' });
        }

        res.json(mapEventRow(result.recordset[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/events/:id', requireAdmin, requireRole(['admin']), async (req, res) => {
    try {
        const result = await runQuery(
            'DELETE FROM dbo.Events OUTPUT DELETED.Id WHERE Id = @id',
            { id: { type: sql.NVarChar, value: normalizeText(req.params.id) } }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Event tidak ditemukan.' });
        }

        res.json({ message: 'Event berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/business-cards', async (_, res) => {
    try {
        const result = await runQuery('SELECT * FROM dbo.BusinessCards ORDER BY Name ASC, CreatedAt DESC');
        res.json(result.recordset.map(mapCardRow));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/business-cards', requireAdmin, requireRole(['admin']), upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'photo2', maxCount: 1 }]), async (req, res) => {
    try {
        const body = req.body || {};
        const name = normalizeText(body.name);
        if (!name) {
            return res.status(400).json({ message: 'Nama kartu wajib diisi.' });
        }

        const id = slugify(body.id || name || Date.now().toString()) || String(Date.now());
        const photo = req.files?.photo?.[0] ? `/uploads/${req.files.photo[0].filename}` : normalizeText(body.photo);
        const photo2 = req.files?.photo2?.[0] ? `/uploads/${req.files.photo2[0].filename}` : normalizeText(body.photo2);

        if (!photo) {
            return res.status(400).json({ message: 'Foto profil wajib diunggah.' });
        }

        const result = await runQuery(
            `INSERT INTO dbo.BusinessCards (Id, Name, Title, Phone, WhatsApp, Email, LinkedIn, Photo, Photo2)
             OUTPUT INSERTED.*
             VALUES (@id, @name, @title, @phone, @whatsapp, @email, @linkedin, @photo, @photo2)`,
            {
                id: { type: sql.NVarChar, value: id },
                name: { type: sql.NVarChar, value: name },
                title: { type: sql.NVarChar, value: normalizeText(body.title) || '' },
                phone: { type: sql.NVarChar, value: normalizeText(body.phone) },
                whatsapp: { type: sql.NVarChar, value: normalizeText(body.whatsapp) },
                email: { type: sql.NVarChar, value: normalizeText(body.email) },
                linkedin: { type: sql.NVarChar, value: normalizeText(body.linkedin) },
                photo: { type: sql.NVarChar, value: photo },
                photo2: { type: sql.NVarChar, value: photo2 }
            }
        );

        res.status(201).json(mapCardRow(result.recordset[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/business-cards/:id', requireAdmin, requireRole(['admin']), upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'photo2', maxCount: 1 }]), async (req, res) => {
    try {
        const body = req.body || {};
        const photo = req.files?.photo?.[0] ? `/uploads/${req.files.photo[0].filename}` : normalizeText(body.photo);
        const photo2 = req.files?.photo2?.[0] ? `/uploads/${req.files.photo2[0].filename}` : normalizeText(body.photo2);

        const result = await runQuery(
            `UPDATE dbo.BusinessCards
             SET Name = @name,
                 Title = @title,
                 Phone = @phone,
                 WhatsApp = @whatsapp,
                 Email = @email,
                 LinkedIn = @linkedin,
                 Photo = @photo,
                 Photo2 = @photo2,
                 UpdatedAt = SYSUTCDATETIME()
             OUTPUT INSERTED.*
             WHERE Id = @id`,
            {
                id: { type: sql.NVarChar, value: normalizeText(req.params.id) },
                name: { type: sql.NVarChar, value: normalizeText(body.name) || '' },
                title: { type: sql.NVarChar, value: normalizeText(body.title) || '' },
                phone: { type: sql.NVarChar, value: normalizeText(body.phone) },
                whatsapp: { type: sql.NVarChar, value: normalizeText(body.whatsapp) },
                email: { type: sql.NVarChar, value: normalizeText(body.email) },
                linkedin: { type: sql.NVarChar, value: normalizeText(body.linkedin) },
                photo: { type: sql.NVarChar, value: photo || '' },
                photo2: { type: sql.NVarChar, value: photo2 }
            }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Kartu nama tidak ditemukan.' });
        }

        res.json(mapCardRow(result.recordset[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/business-cards/:id', requireAdmin, requireRole(['admin']), async (req, res) => {
    try {
        const result = await runQuery(
            'DELETE FROM dbo.BusinessCards OUTPUT DELETED.Id WHERE Id = @id',
            { id: { type: sql.NVarChar, value: normalizeText(req.params.id) } }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Kartu nama tidak ditemukan.' });
        }

        res.json({ message: 'Kartu nama berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/gallery', async (_, res) => {
    try {
        const result = await runQuery('SELECT * FROM dbo.GalleryItems ORDER BY SortOrder ASC, CreatedAt DESC');
        res.json(result.recordset.map(mapGalleryRow));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/gallery', requireAdmin, requireRole(['admin']), async (req, res) => {
    try {
        const items = Array.isArray(req.body?.items) ? req.body.items : [];
        await poolConnect;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const clearRequest = new sql.Request(transaction);
            await clearRequest.query('DELETE FROM dbo.GalleryItems');

            for (let index = 0; index < items.length; index += 1) {
                const item = items[index] || {};
                const insertRequest = new sql.Request(transaction);
                insertRequest.input('id', sql.NVarChar, normalizeText(item.id) || `gal_${Date.now()}_${index}`);
                insertRequest.input('img', sql.NVarChar, normalizeText(item.img) || '');
                insertRequest.input('category', sql.NVarChar, normalizeText(item.category) || 'corporate');
                insertRequest.input('alt', sql.NVarChar, normalizeText(item.alt));
                insertRequest.input('sortOrder', sql.Int, index);
                await insertRequest.query(`
                    INSERT INTO dbo.GalleryItems (Id, Img, Category, Alt, SortOrder)
                    VALUES (@id, @img, @category, @alt, @sortOrder)
                `);
            }

            await transaction.commit();
            res.json({ message: 'Galeri berhasil disimpan.', items });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/gallery/:id', requireAdmin, requireRole(['admin']), async (req, res) => {
    try {
        const result = await runQuery(
            'DELETE FROM dbo.GalleryItems OUTPUT DELETED.Id WHERE Id = @id',
            { id: { type: sql.NVarChar, value: normalizeText(req.params.id) } }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Item galeri tidak ditemukan.' });
        }

        res.json({ message: 'Item galeri berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

async function start() {
    try {
        await ensureSchema();
        await ensureDefaultNewsAdmin();
        app.listen(port, () => {
            console.log(`Backend API berjalan di http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Gagal menjalankan server:', error);
        process.exit(1);
    }
}

start();