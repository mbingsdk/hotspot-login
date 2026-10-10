/* Shared coin purchase and voucher result for Status and Paket pages. */
function voucherValue(value) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function voucherNode(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function voucherShowPanel() {
  const panel = document.getElementById("voucher-result");
  if (!panel) return null;
  panel.classList.remove("hidden");
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  panel.focus({ preventScroll: true });
  return panel;
}

function voucherClearPanel(panel, title, summary) {
  panel.replaceChildren();
  const top = voucherNode("div", "voucher-head");
  const heading = voucherNode("h2", "section-title", title);
  const close = voucherNode("button", "voucher-close", "Tutup");
  close.type = "button";
  close.addEventListener("click", () => {
    panel.replaceChildren();
    panel.classList.add("hidden");
  });
  top.append(heading, close);
  panel.append(top, voucherNode("p", "voucher-intro", summary));
}

function voucherRenderFailure(message, uncertain = false) {
  const panel = voucherShowPanel();
  if (!panel) return;
  voucherClearPanel(
    panel,
    uncertain ? "Status pembelian belum pasti" : "Pembelian tidak berhasil",
    message
  );
}

async function voucherCopy(text, button) {
  let copied = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      copied = true;
    } else {
      const input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(input);
      input.select();
      copied = document.execCommand("copy");
      input.remove();
    }
  } catch (_) {
    copied = false;
  }
  button.textContent = copied ? "Tersalin" : "Gagal menyalin, salin manual";
}

function voucherRenderSuccess(result, pkg) {
  const panel = voucherShowPanel();
  if (!panel) return;
  const raw = result && (result.user || result.voucher || (result.data && result.data.user));
  const user = raw && typeof raw === "object" ? raw : {};
  const username = voucherValue(user.username);
  const password = voucherValue(user.password);
  const rows = [
    ["Username", username],
    ["Password", password],
    ["Profil", voucherValue(user.profile)],
    ["Durasi", voucherValue(user.limitUptime || user["limit-uptime"])],
    ["Catatan", voucherValue(user.comment)]
  ].filter((row) => row[1]);

  const hasCredentials = Boolean(username && password);
  voucherClearPanel(
    panel,
    hasCredentials ? "Voucher berhasil dibuat" : "Pembelian berhasil",
    hasCredentials
      ? "Simpan username dan password voucher ini sebelum meninggalkan halaman."
      : "API menyatakan pembelian berhasil, tetapi tidak mengirim detail username dan password voucher. Periksa akun Mikcoins atau hubungi admin sebelum mencoba membeli ulang."
  );
  panel.append(voucherNode("p", "voucher-package-name", voucherValue(pkg.nama) || "Paket Internet"));

  if (!rows.length) return;
  const grid = voucherNode("dl", "voucher-grid");
  for (const [label, value] of rows) {
    const item = voucherNode("div", "voucher-field");
    item.append(voucherNode("dt", "", label), voucherNode("dd", "", value));
    grid.appendChild(item);
  }
  panel.appendChild(grid);
  if (!hasCredentials) return;

  const copyData = rows.map(([label, value]) => label + ": " + value).join("\n");
  const copy = voucherNode("button", "btn btn-primary", "Salin detail voucher");
  copy.type = "button";
  copy.addEventListener("click", () => voucherCopy(copyData, copy));
  const actions = voucherNode("div", "voucher-actions");
  actions.appendChild(copy);
  panel.appendChild(actions);
}

async function buyVoucherWithCoins(pkg, button) {
  const mac = document.getElementById("mac-addr")?.value || window.HOTSPOT_STATUS?.mac || "";
  const amount = Number(pkg?.coin);
  if (!mac || !Number.isFinite(amount) || amount <= 0) {
    voucherRenderFailure("MAC perangkat atau harga coin tidak tersedia. Pembelian dibatalkan.");
    return;
  }
  if (!window.confirm("Gunakan " + amount + " coin untuk " + (pkg.nama || "paket ini") + "?")) return;

  const oldContent = button.innerHTML;
  button.disabled = true;
  button.textContent = "Memproses pembelian…";
  try {
    const response = await fetch(HOTSPOT_API + "/user/use-coin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coin: amount, paket: pkg.nama, paketMap: pkg, mac })
    });
    let result = {};
    try { result = await response.json(); } catch (_) {}
    if (!response.ok || result.success !== true) {
      voucherRenderFailure(voucherValue(result.message) || "Pembelian ditolak. Periksa saldo dan coba kembali.");
      return;
    }
    voucherRenderSuccess(result, pkg);
    if (typeof initCoinIndicator === "function") await initCoinIndicator();
  } catch (_) {
    voucherRenderFailure(
      "Koneksi ke server terputus. Pembelian mungkin sudah diproses. Periksa saldo atau riwayat Mikcoins sebelum mengulangi transaksi.",
      true
    );
  } finally {
    button.disabled = false;
    button.innerHTML = oldContent;
  }
}
