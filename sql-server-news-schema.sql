-- AJMN Website - SQL Server schema for News + Admin
-- Basis schema ini mengikuti field yang saat ini dipakai di news.html dan admin/admin.js

-- OPTIONAL:
-- CREATE DATABASE AJMNWebsite;
-- GO
-- USE AJMNWebsite;
-- GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.NewsArticles', 'U') IS NOT NULL DROP TABLE dbo.NewsArticles;
IF OBJECT_ID('dbo.AdminUsers', 'U') IS NOT NULL DROP TABLE dbo.AdminUsers;
GO

CREATE TABLE dbo.NewsArticles (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_NewsArticles_Id DEFAULT NEWID(),
    Title NVARCHAR(200) NOT NULL,
    Slug NVARCHAR(220) NOT NULL,
    Category NVARCHAR(50) NOT NULL,
    EventDate DATE NOT NULL,
    Location NVARCHAR(200) NULL,
    Snippet NVARCHAR(500) NOT NULL,
    Content1 NVARCHAR(MAX) NULL,
    Content2 NVARCHAR(MAX) NULL,
    Img1Url NVARCHAR(500) NOT NULL,
    Img2Url NVARCHAR(500) NULL,
    Img2Caption NVARCHAR(250) NULL,
    IsFeatured BIT NOT NULL CONSTRAINT DF_NewsArticles_IsFeatured DEFAULT 0,
    LinkedEventId NVARCHAR(100) NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_NewsArticles_Status DEFAULT 'published',
    CreatedBy UNIQUEIDENTIFIER NULL,
    UpdatedBy UNIQUEIDENTIFIER NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_NewsArticles_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_NewsArticles_UpdatedAt DEFAULT SYSUTCDATETIME(),
    RowVersion ROWVERSION NOT NULL,
    CONSTRAINT PK_NewsArticles PRIMARY KEY (Id),
    CONSTRAINT UQ_NewsArticles_Slug UNIQUE (Slug)
);
GO

CREATE INDEX IX_NewsArticles_EventDate ON dbo.NewsArticles (EventDate DESC);
CREATE INDEX IX_NewsArticles_Category ON dbo.NewsArticles (Category);
CREATE INDEX IX_NewsArticles_Status ON dbo.NewsArticles (Status);
GO

CREATE TABLE dbo.AdminUsers (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_AdminUsers_Id DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(30) NOT NULL CONSTRAINT DF_AdminUsers_Role DEFAULT 'admin',
    IsActive BIT NOT NULL CONSTRAINT DF_AdminUsers_IsActive DEFAULT 1,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_AdminUsers_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_AdminUsers_UpdatedAt DEFAULT SYSUTCDATETIME(),
    RowVersion ROWVERSION NOT NULL,
    CONSTRAINT PK_AdminUsers PRIMARY KEY (Id),
    CONSTRAINT UQ_AdminUsers_Email UNIQUE (Email)
);
GO

-- Optional seed example for one news row.
-- Adjust dates, category, and URLs to your real data.
/*
INSERT INTO dbo.NewsArticles (
    Title, Slug, Category, EventDate, Location, Snippet,
    Content1, Content2, Img1Url, Img2Url, Img2Caption,
    IsFeatured, LinkedEventId, Status
)
VALUES (
    N'Judul Berita Contoh',
    N'judul-berita-contoh',
    N'umum',
    '2026-08-20',
    N'Atma Kantin',
    N'Cuplikan singkat berita untuk tampilan kartu.',
    N'Paragraf isi berita pertama.',
    N'Paragraf isi berita kedua.',
    N'https://example.com/news-1.jpg',
    NULL,
    NULL,
    0,
    NULL,
    N'published'
);
*/

-- Field mapping dari data saat ini:
-- title -> Title
-- category -> Category
-- date -> EventDate
-- location -> Location
-- snippet -> Snippet
-- content1 -> Content1
-- content2 -> Content2
-- img1 -> Img1Url
-- img2 -> Img2Url
-- img2Caption -> Img2Caption
-- isFeatured -> IsFeatured
-- linkedEventId -> LinkedEventId
