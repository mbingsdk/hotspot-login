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


function setActivePublicRoute(route) {
  document.querySelectorAll("[data-public-route]").forEach(el => {
    el.classList.toggle("is-active", el.dataset.publicRoute === route);
  });
}

function navigatePublic(route, updateHash = true) {
  const loginView = document.getElementById("login-view");
  const publicView = document.getElementById("public-view");
  const title = document.getElementById("public-title");
  const sections = {
    paket: document.getElementById("public-paket"),
    tentang: document.getElementById("public-tentang"),
    kontak: document.getElementById("public-kontak")
  };

  Object.values(sections).forEach(section => section && section.classList.add("hidden"));

  if (route === "login" || !sections[route]) {
    if (loginView) loginView.classList.remove("hidden");
    if (publicView) publicView.classList.add("hidden");
    setActivePublicRoute("login");
    if (updateHash && location.hash) history.pushState(null, "", location.pathname + location.search);
    if (username) username.focus();
    return;
  }

  if (loginView) loginView.classList.add("hidden");
  if (publicView) publicView.classList.remove("hidden");
  sections[route].classList.remove("hidden");
  if (title) {
    title.textContent = route === "paket" ? "Paket Internet" : route === "tentang" ? "Tentang" : "Kontak";
  }
  setActivePublicRoute(route);

  if (route === "paket") loadPublicPackages();
  if (updateHash) history.pushState(null, "", "#" + route);
}

function openScannerFromNav() {
  navigatePublic("login");
  setTimeout(startQRScanner, 0);
}

async function loadPublicPackages() {
  const state = document.getElementById("public-package-state");
  const list = document.getElementById("public-package-list");
  if (!state || !list || list.dataset.loaded === "true") return;

  state.classList.remove("hidden", "is-error");
  state.textContent = "Memuat daftar paket...";

  try {
    const response = await fetch("assets/paket.json", { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const packages = await response.json();
    if (!Array.isArray(packages) || packages.length === 0) throw new Error("empty");

    list.innerHTML = "";
    packages.forEach(pkg => {
      const card = document.createElement("article");
      card.className = "package-card";

      const h3 = document.createElement("h3");
      h3.textContent = pkg.nama || "Paket";

      const info = document.createElement("p");
      info.textContent = [pkg.durasi, pkg.kecepatan].filter(Boolean).join(" · ");

      const price = document.createElement("p");
      price.className = "package-price";
      price.textContent = "Rp " + Number(pkg.harga || 0).toLocaleString("id-ID");

      const actions = document.createElement("div");
      actions.className = "package-actions";

      const buy = document.createElement("a");
      buy.className = "btn btn-secondary";
      buy.target = "_blank";
      buy.rel = "noopener";
      buy.textContent = "Beli via WhatsApp";
      const message = "Halo, saya mau pesan paket Internet:\n" +
        (pkg.nama || "Paket") + " - " + (pkg.durasi || "") +
        ", Harga: Rp " + Number(pkg.harga || 0).toLocaleString("id-ID");
      buy.href = "https://wa.me/628124140496?text=" + encodeURIComponent(message);

      const coin = document.createElement("a");
      coin.className = "btn btn-primary";
      coin.textContent = "Pakai " + Number(pkg.coin || 0) + " Coin";
      coin.href = "http://mbingsdk.net:5000/login?mac=" + encodeURIComponent(
        document.getElementById("mac-addr")?.value || ""
      );

      actions.append(buy, coin);
      card.append(h3, info, price, actions);
      list.appendChild(card);
    });

    list.dataset.loaded = "true";
    state.classList.add("hidden");
    list.classList.remove("hidden");
  } catch (_) {
    state.textContent = "Daftar paket gagal dimuat. Coba buka ulang halaman.";
    state.classList.add("is-error");
  }
}

function applyPublicRouteFromHash() {
  const route = location.hash.replace(/^#/, "");
  if (["paket", "tentang", "kontak"].includes(route)) {
    navigatePublic(route, false);
  } else {
    navigatePublic("login", false);
  }
}

window.addEventListener("hashchange", applyPublicRouteFromHash);
document.addEventListener("DOMContentLoaded", applyPublicRouteFromHash);
