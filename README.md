# SDK-Dev MikroTik HotSpot

**Portal HotSpot MikroTik dengan antarmuka responsif, login voucher, informasi sesi, paket internet, integrasi Mikcoins, chat, dan pengumuman.**

Dikembangkan oleh **SDK-Dev**. Repositori: https://github.com/mbingsdk/hotspot-login

> **Penting:** Project ini adalah **template halaman HotSpot RouterOS (HTML, CSS, dan JavaScript)**, bukan sistem autentikasi, server Mikcoins, ataupun panel administrasi MikroTik. Login dan data sesi berasal dari MikroTik. Saldo coin, penerbitan voucher dengan coin, dan live chat memerlukan layanan backend terpisah. Jangan menganggap semuanya langsung berfungsi hanya dengan mengunggah file ke router.

## Daftar isi

1. [Ringkasan dan fitur](#ringkasan-dan-fitur)
2. [Arsitektur dan alur kerja](#arsitektur-dan-alur-kerja)
3. [Prasyarat](#prasyarat)
4. [Instalasi ke MikroTik](#instalasi-ke-mikrotik)
5. [Struktur file](#struktur-file)
6. [Konfigurasi dan personalisasi](#konfigurasi-dan-personalisasi)
7. [Login, voucher, QR, dan private MAC](#login-voucher-qr-dan-private-mac)
8. [Status sesi, uptime, countdown, dan usage](#status-sesi-uptime-countdown-dan-usage)
9. [Integrasi Mikcoins dan hasil voucher](#integrasi-mikcoins-dan-hasil-voucher)
10. [Live chat](#live-chat)
11. [Popup pengumuman di halaman login](#popup-pengumuman-di-halaman-login)
12. [Walled garden, HTTPS, dan akses jaringan](#walled-garden-https-dan-akses-jaringan)
13. [Pengembangan dan pengujian](#pengembangan-dan-pengujian)
14. [Troubleshooting](#troubleshooting)
15. [Keamanan dan batasan](#keamanan-dan-batasan)
16. [Kontribusi dan lisensi](#kontribusi-dan-lisensi)

## Ringkasan dan fitur

**Fitur yang disediakan dari sisi portal:**

| Bagian | Fungsi |
| --- | --- |
| Login | Username/password, mode voucher satu kolom, dan CHAP bila diaktifkan di router |
| Scan QR | Mengisi username dan password dari QR berformat sesuai dukungan portal |
| Private MAC | Menampilkan peringatan jika MAC yang terlihat oleh MikroTik adalah locally administered address |
| Navigasi | Menu **Login** berubah menjadi **Status** saat RouterOS menyatakan sesi sudah login |
| Logout | Link Logout pada halaman yang relevan saat pengguna sudah login |
| Status | Username, IP, MAC, uptime, sisa waktu, download, upload, total traffic, dan kuota jika tersedia |
| Live status | Uptime dan countdown diperbarui per detik; data traffic diambil ulang setiap **10 detik** |
| Paket | Katalog dari file JSON, tombol WhatsApp, dan tombol pembelian dengan coin |
| Mikcoins | Menampilkan saldo coin berdasarkan MAC dan menangani pembelian melalui API eksternal |
| Hasil voucher | Menampilkan username/password voucher dari respons backend setelah pembelian coin berhasil |
| Chat | Komunikasi menggunakan layanan WebSocket eksternal |
| Pengumuman | Modal opsional khusus Login, bisa ON/OFF melalui JSON, dengan auto-close default 10 detik |
| Branding | Logo SDK-Dev, ikon SVG seragam, tampilan navy/teal dan layout responsif |
| Halaman pendukung | Paket, Tentang, Kontak, Logout, Error, serta halaman pengalihan bawaan HotSpot |

**Yang tidak disediakan repositori ini:** database pengguna, proses pembayaran, generator voucher server-side, pengaturan bandwidth/profile otomatis, backend Mikcoins, server WebSocket, dan konfigurasi HotSpot router secara otomatis. Operator harus menyediakan layanan-layanan tersebut jika fitur terkait ingin digunakan.

## Arsitektur dan alur kerja

~~~text
HP / laptop tersambung ke SSID HotSpot
                  |
                  v
         MikroTik RouterOS HotSpot
          |                  |
          |                  +-- Login, logout, validasi akun/voucher
          |                  +-- Variabel $(mac), $(username), $(uptime), traffic
          v
      Halaman SDK-Dev (HTML/CSS/JS)
          |         |          |
          |         |          +--> Mikcoins API (opsional)
          |         |                  - saldo coin
          |         |                  - pembuatan voucher
          |         +-------------> WebSocket chat (opsional)
          +-----------------------> Paket, Kontak, Pengumuman
~~~

**Alur singkat pengguna:**

1. Perangkat terhubung ke Wi-Fi dan diarahkan ke halaman login HotSpot MikroTik.
2. RouterOS mengganti variabel **$(...)** pada HTML dengan informasi koneksi yang diketahui router.
3. Pengguna memasukkan akun/voucher atau melakukan scan QR, lalu form dikirim ke endpoint login MikroTik.
4. Bila autentikasi berhasil, RouterOS mengarahkan pengguna ke halaman Status.
5. Status menampilkan data sesi dan menyinkronkan angka trafik dari MikroTik. Fitur Mikcoins/chat memakai layanan terpisah dan tidak menentukan keberhasilan login HotSpot.

Halaman **paket.html**, **about.html**, dan **contact.html** dapat dibuka sebelum login. Navigasinya memakai kondisi **$(if logged-in == 'yes')** untuk menentukan apakah menu pertama berupa Login atau Status.

## Prasyarat

### Wajib

- Perangkat **MikroTik RouterOS** dengan HotSpot yang **sudah dikonfigurasi dan berfungsi**.
- Akses admin melalui **WinBox, WebFig, atau terminal** untuk mengelola HotSpot profile dan file.
- Komputer untuk mengunduh repo dan mengunggah file menggunakan WinBox Files, FTP/SFTP (bila tersedia), atau metode transfer RouterOS lain yang sesuai.
- Browser modern yang mendukung JavaScript. Portal tidak menggunakan proses build Node.js atau npm.

**Catatan kompatibilitas:** repositori ini tidak mencantumkan matriks versi RouterOS atau daftar model perangkat yang sudah diuji. Cocokkan perintah dengan versi RouterOS milik Anda dan uji di router sendiri sebelum dipasang ke produksi.

### Opsional, sesuai fitur

| Fitur | Kebutuhan tambahan |
| --- | --- |
| Mikcoins dan voucher coin | Backend/API Mikcoins dan koneksi jaringan dari klien HotSpot |
| Live chat | Server WebSocket yang kompatibel dengan protokol pesan di bawah |
| Scan QR | Izin kamera, dukungan browser, serta akses ke library **html5-qrcode** dari unpkg.com |
| Akses layanan sebelum login | Aturan **walled garden** yang sesuai |
| Halaman melalui HTTPS | Sertifikat/TLS yang sesuai, backend API **HTTPS**, dan chat **WSS** |

## Instalasi ke MikroTik

### 1. Cadangkan konfigurasi dan halaman HotSpot

Sebelum mengubah portal yang sudah digunakan pelanggan, simpan salinan direktori HotSpot lama dan konfigurasi RouterOS. Cara yang paling aman adalah **menguji direktori baru tanpa langsung menimpa folder bawaan**.

Di terminal, identifikasi profile dan nama server:

~~~routeros
/ip hotspot print
/ip hotspot profile print
~~~

Pastikan Anda tahu **profile** yang dipakai HotSpot aktif, bukan hanya nama SSID atau nama server.

### 2. Unduh project

~~~bash
git clone https://github.com/mbingsdk/hotspot-login.git
cd hotspot-login
~~~

Alternatifnya, buka halaman GitHub project lalu unduh ZIP branch yang ingin digunakan dan ekstrak isinya.

**Perhatian:** jika ingin memakai perbaikan yang baru ada di Pull Request, pastikan menggunakan branch yang benar atau tunggu perubahan tersebut masuk ke **main**. Mengunduh main tidak otomatis menyertakan PR yang belum di-merge.

### 3. Unggah file ke router

1. Buka **Files** di WinBox.
2. Buat direktori baru, misalnya **hotspot-sdk**, pada penyimpanan yang sesuai (banyak router memakai lokasi **flash/**).
3. Unggah **isi repositori**, bukan folder repo di dalam folder lain, ke direktori tersebut.
4. Pastikan **login.html**, **status.html**, dan **paket.html** berada di akar direktori HotSpot yang dipilih. Jangan mengubah letak relatif **assets/**, **scripts/**, dan **styles/**.

Contoh susunan di router:

~~~text
flash/
└── hotspot-sdk/
    ├── login.html
    ├── status.html
    ├── paket.html
    ├── about.html
    ├── contact.html
    ├── api.json
    ├── errors.txt
    ├── ...
    ├── assets/
    │   ├── logo.svg
    │   ├── icons.svg
    │   ├── paket.json
    │   └── announcement.json
    ├── scripts/
    │   ├── login.js
    │   ├── status.js
    │   ├── common.js
    │   ├── voucher.js
    │   ├── public.js
    │   ├── announcement.js
    │   └── md5.js
    └── styles/
        └── hotspot.css
~~~

Lokasi **flash/** adalah **contoh**, bukan lokasi universal pada semua router. Periksa lokasi direktori yang benar di menu Files.

### 4. Arahkan HotSpot profile ke direktori baru

Contoh berikut menggunakan profile bernama **hsprof1** dan path **flash/hotspot-sdk**. Ganti keduanya sesuai milik Anda.

~~~routeros
/ip hotspot profile set [find name="hsprof1"] html-directory="flash/hotspot-sdk"
~~~

Lihat kembali pengaturannya:

~~~routeros
/ip hotspot profile print detail
~~~

Pada konfigurasi yang memang menggunakan penyimpanan eksternal, RouterOS juga mempunyai opsi **html-directory-override**. Jangan mengubah kedua opsi secara sembarang. Dokumentasi resmi MikroTik menjelaskan bahwa **html-directory** menunjuk folder halaman dan **html-directory-override** digunakan untuk lokasi alternatif sesuai jenis penyimpanannya.

### 5. Uji dari perangkat klien

1. Sambungkan HP/laptop ke SSID HotSpot.
2. Buka portal dari alur captive portal atau alamat login yang disediakan router.
3. Periksa logo, CSS, ikon, login, Paket, Tentang, dan Kontak.
4. Login dengan akun uji yang valid dan periksa Status.
5. Uji Logout dan pastikan menu berubah kembali sesuai status autentikasi.
6. Baru setelah itu aktifkan integrasi eksternal dan uji pembelian voucher.

**Jangan hanya membuka login.html dengan file:// atau localhost lalu menyimpulkan fungsi RouterOS rusak.** Sintaks **$(...)** hanya diproses ketika halaman dilayani oleh servlet HotSpot RouterOS.

## Struktur file

### Halaman utama dan servlet MikroTik

| File | Tujuan |
| --- | --- |
| **login.html** | Form autentikasi, petunjuk private MAC, scan QR, popup pengumuman |
| **status.html** | Informasi sesi, countdown, trafik, paket, dan hasil voucher |
| **logout.html** | Ringkasan setelah logout |
| **paket.html** | Daftar paket dari JSON dan tombol pembelian |
| **about.html** | Informasi SDK-Dev |
| **contact.html** | Kontak dukungan dan FAQ |
| **alogin.html** | Pengalihan setelah login berhasil |
| **flogin.html** | Halaman login gagal |
| **fstatus.html** | Pengalihan saat Status diminta tanpa sesi login |
| **flogout.html** | Pengalihan saat Logout diminta tanpa sesi login |
| **rlogin.html** | Pengalihan root untuk pengguna belum login |
| **rstatus.html** | Pengalihan root untuk pengguna login |
| **redirect.html** | Pembantu redirect RouterOS |
| **radvert.html** | Servlet pengalihan iklan RouterOS, **berbeda** dengan modal pengumuman Login |
| **error.html** | Halaman error |
| **errors.txt** | Pesan error HotSpot dalam bahasa Indonesia |
| **api.json** | Respons API captive portal untuk klien/perangkat yang memerlukannya |

Jangan menghapus file servlet bawaan hanya karena tidak kelihatan di menu navigasi. RouterOS dapat memanggilnya langsung pada kondisi tertentu.

### Asset dan script

| File | Isi atau tanggung jawab |
| --- | --- |
| **styles/hotspot.css** | Semua design tokens, layout desktop/mobile, komponen dan state visual |
| **assets/logo.svg** | Logo/identitas SDK-Dev |
| **assets/icons.svg** | Kumpulan ikon SVG yang dipakai melalui elemen use |
| **assets/paket.json** | Data katalog paket, profile, limit dan harga coin |
| **assets/announcement.json** | Konfigurasi popup Login |
| **scripts/login.js** | Voucher satu kolom, QR scanner, private MAC, bantuan OS |
| **scripts/md5.js** | Perhitungan MD5 untuk mekanisme HTTP-CHAP |
| **scripts/status.js** | Timer, sinkronisasi status 10 detik, render paket Status |
| **scripts/public.js** | Render paket pada halaman publik |
| **scripts/common.js** | API saldo coin, WebSocket chat, UI utilitas bersama |
| **scripts/voucher.js** | Kirim transaksi coin dan menampilkan hasil voucher |
| **scripts/announcement.js** | Memuat dan mengatur modal pengumuman Login |

## Konfigurasi dan personalisasi

Project **belum memakai satu file .env/config global**. Karena itu, saat memindahkan portal ke jaringan lain, operator harus memperbarui URL atau identitas di beberapa file berikut.

| Yang ingin diubah | Lokasi saat ini |
| --- | --- |
| Alamat REST API Mikcoins | **scripts/common.js** dan **scripts/status.js** (konstanta HOTSPOT_API / API_BASE; pembelian menggunakan HOTSPOT_API dari common.js) |
| Alamat WebSocket chat | **scripts/common.js** (HOTSPOT_CHAT_URL) |
| Link portal Mikcoins | Markup HTML di beberapa halaman dan fallback di **scripts/common.js** |
| Nomor WhatsApp pemesanan | **scripts/public.js**, **scripts/status.js** |
| Kontak WhatsApp/email/media sosial | **contact.html** |
| Paket, harga, profile, durasi, coin | **assets/paket.json** |
| Popup login | **assets/announcement.json** |
| Tema, spacing, tipografi | **styles/hotspot.css** |
| Logo dan ikon | **assets/logo.svg**, **assets/icons.svg** |

Untuk memastikan tidak ada URL lama tertinggal setelah mengganti operator, cari string **192.168.10.4**, **mbingsdk.net**, **wa.me**, dan akun kontak terkait di seluruh repositori. Jangan mengandalkan perubahan satu file saja.

### Contoh mengatur paket

Edit **assets/paket.json**. Contoh entri berdasarkan format data yang sekarang digunakan:

~~~json
{
  "nama": "Paket 2 Jam",
  "durasi": "2 Jam",
  "kecepatan": "-",
  "harga": 2000,
  "profile": "2-Jam",
  "limit-uptime": "2h",
  "comment": "Paket 2 jam",
  "coin": 6
}
~~~

Arti kolom:

| Kolom | Keterangan |
| --- | --- |
| **nama** | Nama yang ditampilkan |
| **durasi** | Teks durasi untuk pengguna |
| **kecepatan** | Deskripsi kecepatan, bila diisi |
| **harga** | Harga dalam rupiah (angka tanpa simbol Rp) |
| **profile** | Nama profile yang akan **diminta ke backend**, bukan profile yang otomatis dibuat portal |
| **limit-uptime** | Nilai batas waktu yang dikirim di objek paket ke backend |
| **comment** | Catatan untuk backend |
| **coin** | Biaya coin yang ditampilkan ke pengguna |

Setelah mengubah JSON, pastikan **profile benar-benar ada di MikroTik/backend** dan nilai harga/coin divalidasi di server. **Mengubah assets/paket.json tidak membuat profile atau voucher baru dengan sendirinya.**

**Catatan:** field **kecepatan** adalah label tampilan; pembatasan Mbps sesungguhnya dikelola konfigurasi backend/MikroTik. Mengubah label menjadi 15 Mbps **tidak otomatis menaikkan bandwidth pelanggan**.

## Login, voucher, QR, dan private MAC

### Login biasa dan voucher satu kolom

- Mode biasa: pengguna mengisi username dan password.
- **Voucher satu kolom:** jika diaktifkan, kolom password disembunyikan dan nilainya disamakan dengan kode di kolom username.
- Form login dikirim ke **$(link-login-only)**. Tujuan setelah berhasil adalah **$(link-status)**.
- Bila RouterOS mengaktifkan **HTTP-CHAP**, file **md5.js** dan challenge RouterOS dipakai sebelum kredensial dikirim. Jangan menghapus bagian **$(if chap-id)**, variabel **$(chap-challenge)**, atau form tersembunyinya.

Akun voucher harus sudah dikenali HotSpot (atau sistem autentikasi/RADIUS yang dipakai). Frontend ini tidak menyimpan akun.

### Scan QR

Pemindai QR menerima dua format kredensial:

~~~text
voucher123:password123
~~~

atau URL yang mempunyai parameter:

~~~text
https://contoh.invalid/login?username=voucher123&password=password123
~~~

Library **html5-qrcode** dimuat dari **unpkg.com** hanya saat tombol Scan QR ditekan. Jika gagal dimuat, izin kamera ditolak, atau QR tidak dikenali, pengguna tetap dapat login manual. Kamera dapat memerlukan **secure context/HTTPS** tergantung browser dan captive portal.

QR yang menyimpan username/password berisi informasi sensitif. Jangan membagikan QR voucher kepada orang lain.

### Deteksi Private / Random MAC

Portal **tidak menebak** private MAC hanya dari versi Android/iOS. RouterOS terlebih dahulu mengisi **$(mac)**, lalu **scripts/login.js** memeriksa dua bit pertama yang relevan pada oktet pertama MAC untuk mendeteksi **locally administered unicast MAC**.

Jika cirinya cocok, portal menampilkan **peringatan, bukan blokir login**, beserta petunjuk menurut sistem operasi. Petunjuk OS dipilih dari browser user agent dan mungkin tidak selalu tepat.

**Batasan penting:** locally administered MAC **bukan bukti pasti** MAC berubah setiap reconnect. Beberapa perangkat memakai private MAC yang tetap untuk SSID tertentu, dan VM/perangkat lain juga dapat memakai alamat lokal.

### Navigasi Login / Status / Logout

Halaman publik menggunakan kondisi RouterOS **$(if logged-in == 'yes')**. Saat sesi aktif, menu pertama menjadi **Status** dan tombol Logout muncul. Saat tidak aktif, pengguna melihat menu **Login**. Status dan Logout sendiri tetap ditangani RouterOS; tampilan menu tidak boleh dianggap sebagai mekanisme keamanan.

## Status sesi, uptime, countdown, dan usage

Halaman **status.html** menerima informasi dari variabel RouterOS, antara lain:

| Variabel | Penggunaan |
| --- | --- |
| **$(username)**, **$(ip)**, **$(mac)** | Identitas sesi yang diketahui router |
| **$(uptime)**, **$(uptime-secs)** | Lama sesi |
| **$(session-time-left)**, **$(session-time-left-secs)** | Sisa waktu bila ada batas sesi |
| **$(bytes-in)**, **$(bytes-out)** | Byte counter yang diolah untuk total traffic |
| **$(bytes-in-nice)**, **$(bytes-out-nice)** | Representasi traffic yang mudah dibaca |
| **$(remain-bytes-total)** | Sisa kuota jika disediakan |
| **$(logged-in)** | Indikator status autentikasi |

**Bagaimana refresh bekerja:**

- JavaScript menghitung tampilan uptime dan countdown **setiap 1 detik** dari snapshot RouterOS terakhir.
- Setiap **10 detik**, browser meminta ulang HTML Status dari URL HotSpot asal yang sama tanpa reload halaman penuh, lalu memperbarui counter traffic dan menyinkronkan timer.
- Saat tab tersembunyi, polling dilewati dan diusahakan sinkronisasi lagi saat tab aktif.
- Jika koneksi/poll gagal, nilai trafik terakhir **bukan data live**; halaman menampilkan pesan peringatan.
- Bila RouterOS mengarahkan ke Login atau mengembalikan status logged-out, UI menandai sesi offline dan menampilkan link Login kembali.

Untuk uptime seperti **6d2h30m33s**, script versi terbaru bisa membacanya sebagai durasi dan mengubahnya menjadi tampilan **6 hari 02:30:33**. Kalau angka detik tidak tersedia, script mencoba membaca format waktu RouterOS yang dikenali. Paket tanpa batas waktu menampilkan **Tidak dibatasi**.

**Total traffic** dihitung dari nilai **bytes-in + bytes-out** yang diberikan router. Angka download/upload mengikuti label pada kode portal, bukan grafik bandwidth historis. Halaman ini **tidak menyediakan grafik historis atau speed test live**.

### Bila data Status tidak berubah

1. Pastikan **scripts/status.js** yang di-upload merupakan versi terbaru.
2. Periksa apakah ada error JavaScript di browser Developer Tools.
3. Periksa variabel RouterOS di HTML yang diterima browser, bukan hanya template file di GitHub.
4. Pastikan request Status 10 detik sekali mendapat HTML yang benar, bukan redirect Login/halaman error.
5. Jika router tidak memberikan variabel tertentu, UI hanya bisa menampilkan data yang ada; frontend tidak dapat menciptakan counter trafik dari nol.

## Integrasi Mikcoins dan hasil voucher

Fitur ini **opsional** dan memerlukan backend yang dapat dijangkau perangkat HotSpot.

### Endpoint REST yang dipakai frontend

Base API pada kode saat ini menggunakan alamat **192.168.10.4:5000/api** dengan pemilihan skema HTTP/HTTPS sesuai protokol halaman.

| Operasi | Request | Digunakan untuk |
| --- | --- | --- |
| Saldo | **GET /api/user/by-mac?mac=...** | Mengambil data pengguna dan **coins** |
| Pembelian paket | **POST /api/user/use-coin** | Meminta backend memproses pembayaran coin dan membuat/mengembalikan voucher |

Contoh body yang dikirim frontend saat membeli paket:

~~~json
{
  "coin": 6,
  "paket": "Paket 2 Jam",
  "paketMap": {
    "nama": "Paket 2 Jam",
    "durasi": "2 Jam",
    "kecepatan": "-",
    "harga": 2000,
    "profile": "2-Jam",
    "limit-uptime": "2h",
    "comment": "Paket 2 jam",
    "coin": 6
  },
  "mac": "02:11:22:33:44:55"
}
~~~

Contoh **bentuk respons yang dikenali frontend**, bukan jaminan hasil backend:

~~~json
{
  "success": true,
  "user": {
    "username": "VOUCHER123",
    "password": "contoh-password",
    "profile": "2-Jam",
    "limitUptime": "2h",
    "comment": "Voucher berhasil dibuat"
  }
}
~~~

Renderer juga memeriksa bentuk **voucher** atau **data.user** sebagai sumber data. Teks error menggunakan **message** bila tersedia.

**Perilaku pembelian:**

1. Pengguna memilih tombol **Pakai N Coin** di halaman Paket atau Status.
2. Browser meminta konfirmasi.
3. Frontend memanggil **/user/use-coin** dengan MAC dan paket yang dipilih.
4. Jika respons menyatakan **success: true**, halaman menampilkan hasil voucher yang memang dikembalikan backend, termasuk tombol salin detail bila username/password tersedia.
5. Jika backend hanya menyatakan sukses tanpa kredensial, UI tidak membuat username/password palsu. Pengguna diminta memeriksa akun atau menghubungi admin.
6. Jika request terputus, **jangan langsung mengulang pembelian** sebelum memeriksa saldo/riwayat, karena transaksi mungkin telah diproses.

**Penting untuk pengembang backend:** jangan mempercayai harga coin, profile, atau MAC dari body browser sebagai otoritas. Validasi akun, saldo, paket yang diizinkan, kepemilikan/perizinan, dan pencegahan transaksi ganda **di server**. Repositori frontend ini tidak membuktikan bahwa backend pihak lain mengikuti kontrak tersebut.

### Indikator saldo di desktop dan HP

Header mengambil data saldo berdasarkan MAC. Jika API tidak tersedia, indikator akan kembali menjadi link ke portal Mikcoins. Angka tidak boleh dianggap real-time jika API gagal. CSS mobile dibuat agar teks saldo tetap terlihat dalam area header yang lebih sempit.

## Live chat

Chat di **scripts/common.js** memakai WebSocket. Konfigurasi default merujuk **192.168.10.4:8000** dan memilih **ws://** atau **wss://** sesuai protokol halaman.

Browser mengirim pesan awal:

~~~json
{"type":"init","mac":"02:11:22:33:44:55"}
~~~

Saat pengguna mengirim chat:

~~~json
{"type":"chat","name":"Pengguna","mac":"02:11:22:33:44:55","text":"Halo, saya butuh bantuan"}
~~~

Pesan masuk diproses sebagai JSON yang dapat memuat **name**, **text**, dan **client_name**. UI menampilkan status koneksi seperti Menghubungkan, Online, Offline, atau tidak tersedia.

Server WebSocket **tidak berada dalam repositori ini**. Jika protokol backend berbeda, sesuaikan kedua sisi. Pesan chat dirender sebagai teks, bukan HTML dari pengirim.

## Popup pengumuman di halaman login

Modal pengumuman hanya dipasang pada **login.html**. Ini **bukan** mekanisme iklan RouterOS **radvert.html**.

Pengaturan berada di **assets/announcement.json**:

~~~json
{
  "enabled": false,
  "id": "paket-2000-upgrade-15mbps",
  "badge": "INFO PAKET",
  "title": "Paket Rp2.000 makin cepat",
  "message": "Ada peningkatan kecepatan untuk Paket Rp2.000.",
  "highlight": "Sekarang 15 Mbps",
  "actionText": "Lihat paket",
  "actionUrl": "paket.html",
  "showOncePerSession": true,
  "delayMs": 900,
  "autoCloseSeconds": 10
}
~~~

- **enabled: false** menonaktifkan popup; **true** mengaktifkannya.
- **id** adalah identitas promosi. Ubah ID ketika menerbitkan pengumuman baru supaya dapat muncul lagi.
- **showOncePerSession: true** membatasi tampilan per ID di satu sesi tab/browser, **jika sessionStorage didukung captive webview**.
- **delayMs** adalah jeda sebelum modal muncul, dibatasi oleh script ke rentang 0–3000 ms.
- **autoCloseSeconds** menentukan waktu tutup otomatis setelah modal muncul, dibatasi 0–120 detik. Nilai **0** menonaktifkan auto-close.
- **actionUrl** saat ini hanya menerima **paket.html**, **about.html**, atau **contact.html**; URL di luar daftar tidak dibuat menjadi tombol aktif.
- Popup bisa ditutup lebih cepat lewat X, tombol Nanti saja, Escape, atau area luar modal.

Contoh promo **Rp2.000 menjadi 15 Mbps** saat ini hanyalah **contoh konten** dan **default-nya OFF**. Pastikan kecepatan jaringan nyata sudah diperbarui sebelum mengaktifkan informasi promosi.

## Walled garden, HTTPS, dan akses jaringan

Walled garden memungkinkan perangkat belum login membuka tujuan tertentu. Halaman lokal dalam direktori HotSpot dilayani oleh router, tetapi **layanan eksternal tidak otomatis diizinkan**.

| Tujuan | Kenapa mungkin perlu akses sebelum login |
| --- | --- |
| Backend Mikcoins **192.168.10.4:5000** | Cek saldo, pembelian voucher |
| Portal **mbingsdk.net:5000** | Login/registrasi Mikcoins |
| Server chat **192.168.10.4:8000** | Chat langsung dari halaman Login |
| **unpkg.com** | Library scan QR |
| WhatsApp/Instagram/TikTok | Link kontak eksternal, jika memang diizinkan untuk tamu |

**Jangan membuka akses semua domain atau seluruh IP publik tanpa kebutuhan.** Buat aturan spesifik untuk layanan/port yang digunakan, sesuaikan dengan kebijakan HotSpot, dan verifikasi lagi lewat perangkat **belum login**.

Contoh izin host HTTP/HTTPS di RouterOS (sesuaikan dengan router dan kebutuhan):

~~~routeros
/ip hotspot walled-garden add dst-host=unpkg.com action=allow
~~~

Untuk IP dan port layanan non-standar, pelajari menu **/ip hotspot walled-garden ip** dan atur tujuan yang benar. Akses juga bisa dibatasi oleh firewall RouterOS, routing, DNS, TLS, atau konfigurasi backend. Untuk memperkecil dependensi internet saat captive portal, pertimbangkan menyimpan library QR secara lokal dengan tetap memperhatikan lisensinya.

### HTTP/HTTPS dan CORS

- Kode frontend memilih skema **https://** untuk API dan **wss://** untuk chat ketika portal dibuka melalui HTTPS. **Ini tidak mengaktifkan sertifikat atau reverse proxy secara otomatis.**
- Backend pada alamat/port tersebut harus benar-benar mendukung TLS jika menggunakan skema aman. HTTPS ke IP privat juga membutuhkan konfigurasi sertifikat yang valid bagi browser.
- Request dari origin HotSpot ke Mikcoins bersifat lintas origin, sehingga backend harus mengatur **CORS** yang sesuai.
- Permintaan WebSocket harus diizinkan oleh server dan jaringan; akses walled garden HTTP saja belum tentu cukup.
- Kebijakan secure context browser dapat memengaruhi izin kamera dan clipboard, termasuk captive portal webview pada HP.

## Pengembangan dan pengujian

### Melihat UI secara lokal

Karena tidak memakai bundler, project bisa dilayani dengan web server statis sederhana:

~~~bash
python3 -m http.server 8080
~~~

Buka **http://localhost:8080/login.html** untuk memeriksa CSS dan elemen statis. **Ingat:** variabel RouterOS **$(...)** tidak akan diganti di localhost, jadi autentikasi, navigasi berdasarkan sesi, dan angka Status tidak bisa diuji sepenuhnya dengan cara ini.

### Checklist sebelum dipakai pelanggan

- [ ] HotSpot asli dapat login/logout menggunakan halaman default sebelum memasang tema baru.
- [ ] Semua file diunggah, termasuk subfolder dan **api.json**.
- [ ] Login username/password berhasil dengan metode autentikasi yang dikonfigurasi.
- [ ] Mode voucher satu kolom berhasil pada voucher yang memang memakai nilai username=password.
- [ ] Login gagal menampilkan pesan yang masuk akal.
- [ ] Private MAC warning muncul sebagai peringatan, bukan pemblokiran.
- [ ] Scan QR berhasil atau gagal secara aman saat kamera/library tidak tersedia.
- [ ] Setelah login menu menjadi **Status**, dan Logout ada pada halaman lain.
- [ ] Uptime bergerak, sisa waktu countdown jika ada limit.
- [ ] Total traffic tidak berhenti di **Menghitung...** dan nilai refresh tiap 10 detik.
- [ ] Daftar paket termuat dari **assets/paket.json**.
- [ ] Pembelian dengan coin diuji pada lingkungan **test**, hasil voucher cocok dengan backend.
- [ ] Saldo coin tetap terlihat di HP; chat gagal dengan pesan yang jelas ketika server mati.
- [ ] Popup bisa ON/OFF, bisa ditutup, dan auto-close sesuai pengaturan.
- [ ] Uji dalam kondisi pengguna belum login, sudah login, dan sesinya berakhir.
- [ ] Uji di Android, iPhone, dan desktop, termasuk ukuran layar sempit.
- [ ] Simpan backup sebelum mengganti halaman pada router produksi.

## Troubleshooting

| Gejala | Pemeriksaan dan tindakan |
| --- | --- |
| Halaman kosong, CSS/ikon tidak ada | Pastikan **styles/hotspot.css**, **assets/icons.svg**, **assets/logo.svg** di-upload pada path yang benar. Periksa 404 di Network tab. |
| Variabel **$(mac)** tampil mentah | File dibuka sebagai HTML biasa/localhost, atau tidak dilayani servlet HotSpot sesuai konteks. |
| Uptime muncul **6d2h30m33s** tanpa bergerak | Periksa **scripts/status.js**, cache browser, dan console JavaScript. Kode terbaru memahami format RouterOS tersebut. |
| Total traffic tetap **Menghitung...** | Periksa error JavaScript dan nilai **bytes-in/bytes-out** pada HTML Status hasil render router. Jika kosong, data tidak dapat dihitung. |
| Paket terus **Memuat daftar paket...** | Periksa keberadaan **assets/paket.json**, respons HTTP, JSON valid, dan script **scripts/status.js** atau **scripts/public.js**. |
| Paket gagal setelah beberapa detik | Gunakan tombol **Coba lagi** pada halaman Status, cek apakah file JSON dapat diakses klien. |
| Refresh 10 detik tidak bekerja | Periksa bahwa request Status bukan redirect Login, jaringan tidak putus, dan halaman terlihat/aktif. |
| Menu tetap Login meski sudah login | Pastikan halaman public dilayani RouterOS (bukan file statis biasa) sehingga kondisi **$(if logged-in == 'yes')** dievaluasi. |
| Logout tidak terlihat | Verifikasi kondisi logged-in dan file HTML terbaru, termasuk CSS pada tampilan HP. |
| Coin selalu 0/tidak muncul | Periksa MAC, endpoint GET Mikcoins, format respons **coins**, CORS, dan akses port 5000. |
| Pembelian coin berhasil tetapi voucher tidak muncul | Pastikan API mengirim **success: true** dan objek user/voucher berisi kredensial. Periksa panel hasil dan respons Network tab. |
| Pembelian timeout | **Jangan langsung membeli ulang**. Periksa riwayat atau saldo karena transaksi bisa saja tetap selesai di backend. |
| Chat Offline | Verifikasi alamat/port WebSocket, firewall, walled garden, dan protokol ws/wss. |
| Scan QR tidak bisa dibuka | Cek izin kamera, secure context dan akses ke **unpkg.com** sebelum login. Login manual tetap tersedia. |
| Popup iklan tidak muncul | Periksa **enabled**, ID yang sudah tercatat di sessionStorage, file JSON dan hanya uji dari halaman Login. |
| HTTPS error / Mixed Content / CORS | Aktifkan TLS yang benar di API/chat dan konfigurasikan CORS, bukan sekadar mengganti awalan URL. |
| Setelah update tampilan masih versi lama | Refresh browser, periksa cache captive portal, dan pastikan direktori yang diunggah sama dengan yang dipakai HotSpot profile. |

Saat melaporkan masalah, sertakan: versi RouterOS, cara deploy folder, URL halaman yang bermasalah, langkah reproduksi, pesan error Console/Network (sensor kredensial), dan informasi apakah klien sudah login atau belum.

## Keamanan dan batasan

1. **Backend harus memvalidasi transaksi.** Jangan mempercayai coin, MAC, profile, harga, atau informasi pengguna yang dikirim browser. Terapkan otorisasi, validasi harga dan anti-double-charge di server.
2. **Jangan publikasikan voucher.** Username, password, kode QR, dan tangkapan layar voucher bisa dipakai untuk mengakses jaringan. Hindari menyimpan detail tersebut ke log publik.
3. **MAC bukan identitas keamanan yang kuat.** MAC dapat berubah/spoof; pemeriksaan private MAC di frontend hanya petunjuk bagi pengguna.
4. **Walled garden seperlunya.** Pembukaan akses sebelum login harus dibatasi pada domain dan port yang benar-benar diperlukan.
5. **Status polling bukan streaming real-time.** Counter berasal dari respons RouterOS setiap 10 detik. Uptime di antaranya diperkirakan berjalan berdasarkan snapshot terakhir.
6. **Tidak ada jaminan semua captive webview sama.** Kamera, clipboard, sessionStorage, dan redirect bisa berbeda pada perangkat atau versi OS tertentu.
7. **Tidak semua fitur tersedia tanpa server lain.** Tampilan dasar HotSpot tetap dapat dipakai tanpa Mikcoins/chat, tetapi pengguna perlu layanan tersebut agar fitur coin dan chat berfungsi.
8. **Keberhasilan instalasi perlu pengujian router nyata.** README tidak menggantikan validasi konfigurasi HotSpot, firewall, DNS, TLS, backend, dan profile di lingkungan tujuan.

## Kontribusi dan lisensi

Kontribusi dokumentasi, bug report, dan pull request dapat diajukan melalui halaman repository GitHub. Untuk perbaikan, jelaskan kondisi masalah, langkah reproduksi dan versi RouterOS; hindari menyertakan password atau voucher aktif.

**Lisensi:** pada saat dokumentasi ini ditulis, repositori **belum memiliki file LICENSE**. Repositori publik **tidak otomatis** memberikan izin kepada pihak lain untuk menyalin, mendistribusikan, atau memodifikasi karya di luar hak yang disediakan ketentuan platform. Hubungi pemilik repository **mbingsdk / SDK-Dev** untuk memastikan izin penggunaan, terutama bila ingin memakai atau membagikannya secara publik/komersial. Jika pemilik ingin membuka penggunaan secara umum, tambahkan file LICENSE yang sesuai.

## Referensi

- [Dokumentasi MikroTik: HotSpot captive portal](https://help.mikrotik.com/docs/spaces/ROS/pages/56459266/HotSpot%20-%20Captive%20portal)
- [Dokumentasi MikroTik: HotSpot customisation](https://help.mikrotik.com/docs/spaces/ROS/pages/87162881/Hotspot%20customisation)
- [Repositori SDK-Dev MikroTik HotSpot](https://github.com/mbingsdk/hotspot-login)

---

**Ringkasnya:** unggah halaman dan asset ke direktori HotSpot, pilih direktori tersebut pada profile MikroTik, uji login/status/logout, baru konfigurasikan backend Mikcoins, chat, dan walled garden jika memang diperlukan. Portal ini mempermudah antarmuka pengguna, sedangkan autentikasi dan kebijakan jaringan tetap milik RouterOS.
