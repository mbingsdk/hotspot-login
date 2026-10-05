const username = document.getElementById("login-username");
const password = document.getElementById("login-password");
const passwordField = document.getElementById("password-field");
const autoMode = document.getElementById("autoMode");

const platformGuides = {
  android: {
    label: "Android",
    steps: [
      "Buka Settings > Network & Internet > Internet / Wi-Fi.",
      "Pilih jaringan Wi-Fi hotspot ini, lalu buka bagian Privacy / MAC address type.",
      "Ubah dari Randomized MAC ke Device MAC / Phone MAC.",
      "Putuskan lalu sambungkan ulang ke Wi-Fi hotspot ini."
    ]
  },
  ios: {
    label: "iPhone / iPad",
    steps: [
      "Buka Settings > Wi-Fi.",
      "Ketuk tombol info pada jaringan hotspot ini.",
      "Buka Private Wi-Fi Address lalu pilih Off jika tersedia.",
      "Sambungkan ulang ke jaringan hotspot ini."
    ]
  },
  macos: {
    label: "macOS",
    steps: [
      "Buka System Settings > Wi-Fi.",
      "Klik Details pada jaringan hotspot ini.",
      "Pada Private Wi-Fi address, pilih Off jika tersedia.",
      "Sambungkan ulang ke jaringan hotspot ini."
    ]
  },
  windows: {
    label: "Windows",
    steps: [
      "Buka Settings > Network & internet > Wi-Fi.",
      "Pilih jaringan hotspot ini atau buka Manage known networks.",
      "Matikan Random hardware addresses untuk jaringan ini.",
      "Putuskan lalu sambungkan ulang ke Wi-Fi hotspot ini."
    ]
  },
  other: {
    label: "Perangkat ini",
    steps: [
      "Buka pengaturan Wi-Fi untuk jaringan hotspot ini.",
      "Cari opsi Privacy, Private address, Randomized MAC, atau Random hardware address.",
      "Gunakan Device MAC / Hardware MAC atau matikan alamat privat untuk SSID ini.",
      "Sambungkan ulang ke Wi-Fi hotspot."
    ]
  }
};

function detectPlatform() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(ua) || /Mac/i.test(platform)) return "macos";
  if (/Windows/i.test(ua) || /Win/i.test(platform)) return "windows";
  return "other";
}

function normalizeMac(mac) {
  return String(mac || "")
    .trim()
    .replace(/-/g, ":")
    .toUpperCase();
}

function isLocallyAdministeredMac(mac) {
  const normalized = normalizeMac(mac);
  const octets = normalized.split(":");

  if (octets.length !== 6) return false;
  if (!octets.every(part => /^[0-9A-F]{2}$/.test(part))) return false;

  const firstOctet = parseInt(octets[0], 16);
  return (firstOctet & 0x02) === 0x02;
}

function initPrivateMacWarning() {
  const warning = document.getElementById("private-mac-warning");
  const value = document.getElementById("private-mac-value");
  const guidePlatform = document.getElementById("guide-platform");
  const guideSteps = document.getElementById("guide-steps");
  const macInput = document.getElementById("mac-addr");

  if (!warning || !macInput) return;

  const mac = normalizeMac(macInput.value);
  if (value) value.textContent = mac || "-";

  const platform = detectPlatform();
  const guide = platformGuides[platform] || platformGuides.other;

  if (guidePlatform) guidePlatform.textContent = guide.label;
  if (guideSteps) {
    guideSteps.innerHTML = "";
    guide.steps.forEach(step => {
      const li = document.createElement("li");
      li.textContent = step;
      guideSteps.appendChild(li);
    });
  }

  if (isLocallyAdministeredMac(mac)) {
    warning.classList.add("is-visible");
  }
}

function toggleMacGuide() {
  const guide = document.getElementById("private-mac-guide");
  if (!guide) return;
  guide.classList.toggle("is-open");
}

function dismissMacWarning() {
  const warning = document.getElementById("private-mac-warning");
  if (!warning) return;
  warning.classList.remove("is-visible");
}

function setVoucherPassword() {
  if (!username || !password) return;
  password.value = username.value;
}

function toggleSingleField() {
  if (!username || !password || !autoMode) return;

  if (autoMode.checked) {
    username.focus();
    username.addEventListener("input", setVoucherPassword);
    username.placeholder = "Masukkan kode voucher";
    password.type = "hidden";
    password.value = username.value;
    if (passwordField) passwordField.classList.add("hidden");
  } else {
    username.removeEventListener("input", setVoucherPassword);
    username.placeholder = "Masukkan username atau kode";
    password.type = "password";
    password.value = "";
    if (passwordField) passwordField.classList.remove("hidden");
  }
}

function togleSwitch() {
  toggleSingleField();
}

function togglePassword() {
  if (!password) return;
  password.type = password.type === "password" ? "text" : "password";
}

function setQrMode(active) {
  const qrReader = document.getElementById("qr-reader");
  const autoModeLabel = document.getElementById("autoModeLabel");
  const btnLog = document.getElementById("btnLog");
  const btnQR = document.getElementById("btnQR");

  [username?.closest(".field"), passwordField, autoModeLabel, btnLog, btnQR]
    .filter(Boolean)
    .forEach(el => el.classList.toggle("hidden", active));

  if (qrReader) qrReader.classList.toggle("hidden", !active);
}

function applyQrCredential(qrCodeMessage) {
  if (!username || !password) return false;

  try {
    const url = new URL(qrCodeMessage);
    const uname = url.searchParams.get("username");
    const passd = url.searchParams.get("password");

    if (uname && passd) {
      username.value = uname;
      password.value = passd;
      return true;
    }
  } catch (_) {
    // Continue with compact voucher formats below.
  }

  const compact = String(qrCodeMessage || "").trim();
  const separatorIndex = compact.indexOf(":");

  if (separatorIndex > 0) {
    username.value = compact.slice(0, separatorIndex);
    password.value = compact.slice(separatorIndex + 1);
    return Boolean(username.value && password.value);
  }

  return false;
}

function startQRScanner() {
  const qrReader = document.getElementById("qr-reader");

  if (!qrReader) return;
  if (typeof Html5Qrcode === "undefined") {
    alert("Pemindai QR belum tersedia. Coba buka ulang halaman saat koneksi ke resource QR tersedia.");
    return;
  }

  setQrMode(true);

  const html5QrCode = new Html5Qrcode("qr-reader");
  html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    },
    qrCodeMessage => {
      const accepted = applyQrCredential(qrCodeMessage);

      html5QrCode.stop()
        .catch(() => {})
        .finally(() => {
          setQrMode(false);
          if (!accepted) {
            alert("QR tidak berisi kredensial hotspot yang valid.");
            return;
          }

          if (username) username.focus();
        });
    },
    () => {}
  ).catch(err => {
    alert("Tidak bisa mengakses kamera: " + err);
    setQrMode(false);
  });
}

if (username) {
  username.focus();
}

document.addEventListener("DOMContentLoaded", initPrivateMacWarning);
