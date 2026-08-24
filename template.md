<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notifikasi Booking AJMN</title>
</head>
<body style="margin:0; padding:0; background-color:#f6f2ea; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#333333;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f2ea; padding:40px 16px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(62,32,9,0.12); border:1px solid #eadfca;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color:#ffffff; padding:28px 24px; text-align:center; border-bottom:1px solid #eadfca;">
                            <div style="display:inline-block; padding:7px 14px; border:1px solid #eadfca; border-radius:999px; color:#3e2009; font-size:12px; letter-spacing:1.4px; font-weight:700; margin-bottom:14px; background-color:#fbf8f1;">
                                PT ATMA JAYA MITRA NUSANTARA
                            </div>
                            <h2 style="margin:0; font-size:26px; line-height:1.2; color:#111111; font-weight:800;">Notifikasi Booking Baru</h2>
                            <p style="margin:10px 0 0 0; font-size:14px; color:#111111;">Permintaan reservasi telah masuk melalui website</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:30px 26px 20px 26px;">
                            <p style="margin:0 0 18px 0; font-size:15px; line-height:1.7; color:#444444;">
                                Halo Tim <strong>{{venture_type}}</strong>,<br><br>
                                Ada permintaan booking baru dari website AJMN. Berikut detailnya:
                            </p>

                            <!-- Data Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate; border-spacing:0; width:100%; background-color:#fbf8f1; border:1px solid #eadfca; border-radius:12px; overflow:hidden;">
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:13px; font-weight:700; color:#7a5c1c; width:34%;">Nama Lengkap</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:14px; color:#333333;">{{name}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:13px; font-weight:700; color:#7a5c1c;">Email</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:14px; color:#333333;">
                                        <a href="mailto:{{email}}" style="color:#b89442; text-decoration:none; font-weight:600;">{{email}}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:13px; font-weight:700; color:#7a5c1c;">No. WhatsApp</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:14px; color:#333333;">{{phone}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:13px; font-weight:700; color:#7a5c1c;">Kategori Layanan</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:14px; color:#3e2009; font-weight:700;">{{venture_type}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:13px; font-weight:700; color:#7a5c1c;">Dari Unit</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:14px; color:#333333;">{{av_unit}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:13px; font-weight:700; color:#7a5c1c;">Fakultas</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:14px; color:#333333;">{{av_faculty}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:13px; font-weight:700; color:#7a5c1c;">Kategori Acara</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:14px; color:#333333; font-weight:600;">{{non_av_category}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:13px; font-weight:700; color:#7a5c1c;">Proposal File</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:14px; color:#333333;">{{proposal_file_name}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:13px; font-weight:700; color:#7a5c1c;">Link Proposal</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:14px; color:#333333;">
                                        <a href="{{proposal_file_url}}" style="color:#b89442; text-decoration:none; font-weight:600;">{{proposal_file_url}}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:13px; font-weight:700; color:#7a5c1c;">Program / Venue</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:14px; color:#333333; font-weight:600;">{{service}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:13px; font-weight:700; color:#7a5c1c;">Tanggal Booking</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #eadfca; font-size:14px; color:#333333;">{{date}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; vertical-align:top; font-size:13px; font-weight:700; color:#7a5c1c;">Pesan Tambahan</td>
                                    <td style="padding:14px 16px; font-size:14px; line-height:1.6; color:#555555;">{{message}}</td>
                                </tr>
                            </table>

                            <!-- Note -->
                            <div style="margin-top:22px; padding:16px 18px; border-left:4px solid #b89442; background-color:#fdfaf4; border-radius:10px;">
                                <p style="margin:0; font-size:14px; line-height:1.7; color:#555555;">
                                    Tim terkait akan menghubungi klien setelah permintaan ini diterima dan diproses.
                                </p>
                            </div>

                            <!-- Button -->
                            <div style="text-align:center; margin-top:28px;">
                                <a href="mailto:{{email}}" style="display:inline-block; background-color:#b89442; color:#ffffff; text-decoration:none; font-size:14px; font-weight:800; letter-spacing:0.5px; padding:13px 24px; border-radius:10px;">
                                    Balas Klien
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f3efe6; padding:18px 22px; text-align:center; border-top:1px solid #eadfca;">
                            <p style="margin:0; font-size:12px; line-height:1.6; color:#777777;">
                                Email ini dikirim otomatis dari sistem reservasi website <strong>PT Atma Jaya Mitra Nusantara</strong>.
                            </p>
                            <p style="margin:8px 0 0 0; font-size:12px; color:#999999;">
                                &copy; 2026 PT Atma Jaya Mitra Nusantara
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>