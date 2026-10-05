const API_BASE = "http://192.168.10.4:5000/api";
const statusData = window.HOTSPOT_STATUS || {};

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return (value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1) + " " + units[index];
}

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = "toast " + type;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), 3200);
}

function initUsage() {
  const bytesIn = Number(statusData.bytesIn) || 0;
  const bytesOut = Number(statusData.bytesOut) || 0;
  const used = bytesIn + bytesOut;

  const totalEl = document.getElementById("traffic-total");
  if (totalEl) totalEl.textContent = formatBytes(used);

  const remain = Number(statusData.remainBytesTotal) || 0;
  const progress = document.getElementById("quota-progress");
  const label = document.getElementById("quota-label");
  const note = document.getElementById("quota-note");

  if (!progress || !label || !note || remain <= 0) return;

  const limit = used + remain;
  const percent = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;

  progress.style.width = percent.toFixed(1) + "%";
  label.textContent = percent.toFixed(0) + "% terpakai";
  note.textContent = formatBytes(used) + " digunakan · " + formatBytes(remain) + " tersisa";
}

async function loadPackages() {
  const state = document.getElementById("package-state");
  const list = document.getElementById("package-list");
  if (!state || !list) return;

  try {
    const response = await fetch("assets/paket.json", { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);

    const packages = await response.json();
    if (!Array.isArray(packages) || packages.length === 0) {
      state.textContent = "Daftar paket belum tersedia.";
      return;
    }

    list.innerHTML = "";
    packages.forEach(pkg => {
      const card = document.createElement("article");
      card.className = "package-card";

      const name = document.createElement("h3");
      name.textContent = pkg.nama || "Paket";

      const info = document.createElement("p");
      info.textContent = [pkg.durasi, pkg.kecepatan].filter(Boolean).join(" · ");

      const price = document.createElement("p");
      price.className = "package-price";
      price.textContent = "Rp " + Number(pkg.harga || 0).toLocaleString("id-ID");

      const actions = document.createElement("div");
      actions.className = "package-actions";

      const wa = document.createElement("a");
      wa.className = "btn btn-secondary";
      wa.target = "_blank";
      wa.rel = "noopener";
      wa.textContent = "Beli via WhatsApp";
      const message = "Halo, saya mau pesan paket Internet:\n" +
        (pkg.nama || "Paket") + " - " + (pkg.durasi || "") +
        ", Harga: Rp " + Number(pkg.harga || 0).toLocaleString("id-ID");
      wa.href = "https://wa.me/628124140496?text=" + encodeURIComponent(message);

      const coin = document.createElement("button");
      coin.type = "button";
      coin.className = "btn btn-primary";
      coin.textContent = "Pakai " + Number(pkg.coin || 0) + " Coin";
      coin.addEventListener("click", () => useCoin(pkg, coin));

      actions.append(wa, coin);
      card.append(name, info, price, actions);
      list.appendChild(card);
    });

    state.classList.add("hidden");
    list.classList.remove("hidden");
  } catch (err) {
    state.textContent = "Daftar paket gagal dimuat. Coba muat ulang halaman.";
    state.classList.add("is-error");
  }
}

async function useCoin(pkg, button) {
  const mac = statusData.mac || "";
  if (!mac) {
    showToast("MAC perangkat tidak tersedia.", "error");
    return;
  }

  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Memproses...";

  try {
    const response = await fetch(API_BASE + "/user/use-coin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coin: Number(pkg.coin || 0),
        paket: pkg.nama,
        paketMap: pkg,
        mac
      })
    });

    let result = {};
    try {
      result = await response.json();
    } catch (_) {}

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Paket tidak dapat diaktifkan.");
    }

    showToast("Paket berhasil diaktifkan.", "success");
    await loadCoin();
  } catch (err) {
    showToast(err.message || "Gagal memproses pembelian paket.", "error");
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

async function loadCoin() {
  const el = document.getElementById("coin-display");
  if (!el) return;

  const mac = statusData.mac || "";
  if (!mac) {
    el.textContent = "Coin -";
    el.disabled = true;
    return;
  }

  try {
    const response = await fetch(API_BASE + "/user/by-mac?mac=" + encodeURIComponent(mac));
    if (!response.ok) {
      el.textContent = "Mikcoins";
      el.onclick = () => {
        window.location.href = "http://mbingsdk.net:5000/login?mac=" + encodeURIComponent(mac);
      };
      return;
    }

    const data = await response.json();
    el.textContent = "Coin " + Number(data.coins || 0);
    el.onclick = () => showToast(
      (data.username ? data.username + ": " : "") + Number(data.coins || 0) + " coin tersedia.",
      "info"
    );
  } catch (_) {
    el.textContent = "Mikcoins";
    el.onclick = () => {
      window.location.href = "http://mbingsdk.net:5000/login?mac=" + encodeURIComponent(mac);
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initUsage();
  loadPackages();
  loadCoin();
});
