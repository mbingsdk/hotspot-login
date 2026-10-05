const username = document.getElementById("login-username");
const password = document.getElementById("login-password");
const passwordField = document.getElementById("password-field");
const usernameField = document.getElementById("username-field");
const autoMode = document.getElementById("autoMode");
const runtimeNotice = document.getElementById("runtime-notice");

const platformGuides = {
  android: {
    label: "Android",
    steps: [
      "Buka pengaturan Wi-Fi untuk jaringan ini.",
      "Cari Privacy / MAC address type.",
      "Pilih Device MAC / Phone MAC.",
      "Sambungkan ulang ke hotspot."
    ]
  },
  ios: {
    label: "iPhone / iPad",
    steps: [
      "Buka Settings > Wi-Fi.",
      "Ketuk info pada jaringan ini.",
      "Ubah Private Wi-Fi Address ke Off.",
      "Sambungkan ulang ke hotspot."
    ]
  },
  macos: {
    label: "macOS",
    steps: [
      "Buka System Settings > Wi-Fi.",
      "Buka Details jaringan ini.",
      "Ubah Private Wi-Fi address ke Off.",
      "Sambungkan ulang ke hotspot."
    ]
  },
  windows: {
    label: "Windows",
    steps: [
      "Buka Settings > Network & internet > Wi-Fi.",
      "Buka properti jaringan hotspot.",
      "Matikan Random hardware addresses.",
      "Sambungkan ulang ke hotspot."
    ]
  },
  other: {
    label: "Perangkat",
    steps: [
      "Buka pengaturan Wi-Fi jaringan ini.",
      "Cari Private address / Randomized MAC.",
      "Gunakan Device MAC / Hardware MAC.",
      "Sambungkan ulang ke hotspot."
    ]
  }
};

function showRuntimeNotice(message) {
  if (!runtimeNotice) return;
  runtimeNotice.textContent = message;
  runtimeNotice.classList.add("is-visible");
}

function hideRuntimeNotice() {
  if (!runtimeNotice) return;
  runtimeNotice.classList.remove("is-visible");
  runtimeNotice.textContent = "";
}

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
  return String(mac || "").trim().replace(/-/g, ":").toUpperCase();
}

function isLocallyAdministeredMac(mac) {
  const parts = normalizeMac(mac).split(":");
  if (parts.length !== 6 || !parts.every(p => /^[0-9A-F]{2}$/.test(p))) return false;
  return (parseInt(parts[0], 16) & 0x02) === 0x02;
}

function initPrivateMacWarning() {
  const warning = document.getElementById("private-mac-warning");
  const guidePlatform = document.getElementById("guide-platform");
  const guideSteps = document.getElementById("guide-steps");
  const macInput = document.getElementById("mac-addr");
  const macLabel = document.getElementById("mac-label");

  if (!macInput) return;

  const mac = normalizeMac(macInput.value);
  if (macLabel) macLabel.textContent = mac || "-";

  if (!warning || !isLocallyAdministeredMac(mac)) return;

  const guide = platformGuides[detectPlatform()] || platformGuides.other;
  if (guidePlatform) guidePlatform.textContent = guide.label;
  if (guideSteps) {
    guideSteps.innerHTML = "";
    guide.steps.forEach(step => {
      const li = document.createElement("li");
      li.textContent = step;
      guideSteps.appendChild(li);
    });
  }

  warning.classList.add("is-visible");
}

function toggleMacGuide() {
  const guide = document.getElementById("private-mac-guide");
  if (guide) guide.classList.toggle("is-open");
}

function setVoucherPassword() {
  if (username && password) password.value = username.value;
}

function toggleSingleField() {
  if (!username || !password || !autoMode) return;

  if (autoMode.checked) {
    username.addEventListener("input", setVoucherPassword);
    username.placeholder = "Masukkan kode voucher";
    password.value = username.value;
    password.type = "hidden";
    if (passwordField) passwordField.classList.add("hidden");
  } else {
    username.removeEventListener("input", setVoucherPassword);
    username.placeholder = "Masukkan username atau voucher";
    password.value = "";
    password.type = "password";
    if (passwordField) passwordField.classList.remove("hidden");
  }

  username.focus();
}

function togglePassword() {
  if (!password) return;
  password.type = password.type === "password" ? "text" : "password";
}

function setQrMode(active) {
  const qrReader = document.getElementById("qr-reader");
  const modeRow = document.getElementById("autoModeLabel");
  const loginButton = document.getElementById("btnLog");
  const qrButton = document.getElementById("btnQR");

  [usernameField, passwordField, modeRow, loginButton, qrButton]
    .filter(Boolean)
    .forEach(el => el.classList.toggle("hidden", active));

  if (qrReader) qrReader.classList.toggle("hidden", !active);
}

function applyQrCredential(raw) {
  if (!username || !password) return false;

  const text = String(raw || "").trim();
  if (!text) return false;

  try {
    const url = new URL(text);
    const uname = url.searchParams.get("username");
    const pass = url.searchParams.get("password");
    if (uname && pass) {
      username.value = uname;
      password.value = pass;
      return true;
    }
  } catch (_) {}

  const sep = text.indexOf(":");
  if (sep > 0) {
    const uname = text.slice(0, sep).trim();
    const pass = text.slice(sep + 1).trim();
    if (uname && pass) {
      username.value = uname;
      password.value = pass;
      return true;
    }
  }

  return false;
}

function handleQrLibraryError() {
  showRuntimeNotice("Scan QR tidak tersedia karena library kamera gagal dimuat. Login manual tetap bisa digunakan.");
  const qrButton = document.getElementById("btnQR");
  if (qrButton) qrButton.disabled = true;
}

function startQRScanner() {
  hideRuntimeNotice();

  const qrReader = document.getElementById("qr-reader");
  if (!qrReader) return;

  if (window.qrLibraryFailed || typeof Html5Qrcode === "undefined") {
    handleQrLibraryError();
    return;
  }

  setQrMode(true);

  let scanner;
  try {
    scanner = new Html5Qrcode("qr-reader");
  } catch (err) {
    setQrMode(false);
    showRuntimeNotice("Pemindai QR tidak dapat dijalankan pada browser ini.");
    return;
  }

  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 240, height: 240 } },
    decodedText => {
      const valid = applyQrCredential(decodedText);
      scanner.stop()
        .catch(() => {})
        .finally(() => {
          setQrMode(false);
          if (!valid) {
            showRuntimeNotice("QR tidak berisi username dan password hotspot yang valid.");
            return;
          }
          hideRuntimeNotice();
          if (username) username.focus();
        });
    },
    () => {}
  ).catch(err => {
    setQrMode(false);

    const name = String(err && (err.name || err.message || err));
    if (/NotAllowed|Permission/i.test(name)) {
      showRuntimeNotice("Izin kamera ditolak. Izinkan kamera atau login secara manual.");
    } else if (/NotFound|DevicesNotFound/i.test(name)) {
      showRuntimeNotice("Kamera tidak ditemukan pada perangkat ini.");
    } else {
      showRuntimeNotice("Kamera tidak bisa dibuka. Login manual tetap bisa digunakan.");
    }
  });
}

if (username) username.focus();
document.addEventListener("DOMContentLoaded", initPrivateMacWarning);
