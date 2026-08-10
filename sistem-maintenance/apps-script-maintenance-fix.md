# Apps Script Maintenance Fix

Gunakan script ini untuk menggantikan `doPost()` dan `doGet()` yang lama.

- Simpan laporan ke Google Sheet.
- Simpan foto bulanan ke Google Drive.
- Dashboard membaca data dari `doGet()`.
- Foto dikembalikan sebagai `fotoUrls` dan `fotoCount`.

```javascript
var SPREADSHEET_ID = "PASTE_SPREADSHEET_ID_ANDA_DI_SINI";

function getSpreadsheet_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "PASTE_SPREADSHEET_ID_ANDA_DI_SINI") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error("Spreadsheet tidak ditemukan. Isi SPREADSHEET_ID atau bind script ke spreadsheet.");
  }

  return active;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = getSpreadsheet_();
    var timestamp = new Date();

    if (data.tipeForm === "bulanan") {
      var sheet = ss.getSheetByName("Rekap_Bulanan");
      if (!sheet) {
        throw new Error('Sheet "Rekap_Bulanan" tidak ditemukan.');
      }

      var urls = [];

      if (data.fotoData && data.fotoData.length > 0) {
        var folderName = "Foto_Maintenance_Kantin";
        var folders = DriveApp.getFoldersByName(folderName);
        var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

        for (var i = 0; i < data.fotoData.length; i++) {
          var foto = data.fotoData[i];
          var decodedData = Utilities.base64Decode(foto.fotoBase64);
          var namaFileUnik = timestamp.getTime() + "_" + i + "_" + foto.namaFoto;
          var blob = Utilities.newBlob(decodedData, foto.mimeType, namaFileUnik);
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          urls.push(file.getUrl());
        }
      }

      var fotoUrlsString = urls.join("\n");
      var items = normalizeItemList(data.itemDibersihkan);
      var foggingValue = data.fogging || "Belum";

      sheet.appendRow([
        timestamp,
        data.lokasi || "",
        data.bulanTahun || "",
        items.join(", "),
        foggingValue,
        fotoUrlsString,
        data.namaPetugas || "",
        data.catatan || ""
      ]);

    } else if (data.tipeForm === "ondemand") {
      var sheet = ss.getSheetByName("Request_PestControl");
      if (!sheet) {
        throw new Error('Sheet "Request_PestControl" tidak ditemukan.');
      }

      sheet.appendRow([
        timestamp,
        data.lokasi || "",
        data.areaSpesifik || "",
        data.deskripsi || "",
        "Menunggu"
      ]);
    } else {
      throw new Error("tipeForm tidak valid.");
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "sukses",
        pesan: "Data tersimpan"
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        pesan: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = getSpreadsheet_();
    var action = e && e.parameter && e.parameter.action ? e.parameter.action : "reports";

    if (action === "reports") {
      var bulananSheet = ss.getSheetByName("Rekap_Bulanan");
      var ondemandSheet = ss.getSheetByName("Request_PestControl");

      var bulanan = getSheetData(bulananSheet, "bulanan");
      var ondemand = getSheetData(ondemandSheet, "ondemand");

      return ContentService
        .createTextOutput(JSON.stringify({
          status: "sukses",
          bulanan: bulanan,
          ondemand: ondemand
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        pesan: "Action tidak dikenali"
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        pesan: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData(sheet, tipeForm) {
  if (!sheet) return [];

  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var result = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];

    if (tipeForm === "bulanan") {
      var fotoUrls = parseFotoUrls(row[5]);

      result.push({
        timestamp: row[0],
        lokasi: row[1],
        bulanTahun: row[2],
        itemDibersihkan: row[3],
        fogging: row[4],
        fotoUrls: fotoUrls,
        fotoCount: fotoUrls.length,
        namaPetugas: row[6],
        catatan: row[7],
        tipeForm: "bulanan"
      });
    } else {
      result.push({
        timestamp: row[0],
        lokasi: row[1],
        areaSpesifik: row[2],
        deskripsi: row[3],
        status: row[4],
        tipeForm: "ondemand"
      });
    }
  }

  return result.reverse();
}

function parseFotoUrls(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return String(value)
    .split("\n")
    .map(function(item) {
      return item.trim();
    })
    .filter(Boolean);
}

function normalizeItemList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return String(value)
    .split(",")
    .map(function(item) {
      return item.trim();
    })
    .filter(Boolean);
}
```

## Catatan Sheet

- Sheet bulanan: `Rekap_Bulanan`
- Sheet on-demand: `Request_PestControl`
- Urutan kolom bulanan yang dipakai script:
  - Timestamp
  - Lokasi
  - BulanTahun
  - ItemDibersihkan
  - Fogging
  - FotoUrls
  - NamaPetugas
  - Catatan
- Urutan kolom on-demand yang dipakai script:
  - Timestamp
  - Lokasi
  - AreaSpesifik
  - Deskripsi
  - Status

## Catatan Dashboard

- Dashboard memakai `doGet()?action=reports`.
- `fotoUrls` dipakai untuk hitung jumlah foto.
- `bulanTahun` dipakai untuk filter bulan.
- `lokasi` dipakai untuk filter AJ SQUARE / ATMACANTEEN.
