var user = null;
var macPub = null;
var api = "http://192.168.10.4:5000/api";

function loadPaket() {
    fetch('/assets/paket.json')
      .then(res => res.json())
      .then(paketList => {
        const container = document.getElementById('paket-list');
        container.innerHTML = '';
  
        paketList.forEach((paket, i) => {
          const pesan = `Halo, saya mau pesan paket Internet:\n${paket.nama} - ${paket.durasi}, ${paket.kecepatan}, Harga: Rp ${paket.harga.toLocaleString('id-ID')}`;
          const waLink = `https://wa.me/628124140496?text=${encodeURIComponent(pesan)}`;
  
          const div = document.createElement('div');
          div.className = 'bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-cyan-500/30 transition-all duration-500 text-center';
  
          div.innerHTML = `
            <h3 class="text-xl font-bold text-cyan-400 mb-2">${paket.nama}</h3>
            <p class="text-gray-300 mb-4">💡 ${paket.durasi} | 🚀 ${paket.kecepatan}</p>
            <p class="text-2xl font-bold text-white mb-4">Rp ${paket.harga.toLocaleString('id-ID')}</p>
            <div class="flex justify-center gap-2">
              <a href="${waLink}" target="_blank" class="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-full transition">Beli Sekarang</a>
              <button 
                class="pakai-coin-btn bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-full transition"
                data-coin="${paket.coin}"
                data-nama="${paket.nama}"
                data-paket='${JSON.stringify(paket).replace(/'/g, "&apos;")}'
              >
                Pakai ${paket.coin} Coin
              </button>
            </div>
          `;
  
          container.appendChild(div);
        });
  
        // Pasang event listener setelah elemen dimasukkan
        document.querySelectorAll('.pakai-coin-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const coin = parseInt(btn.dataset.coin);
            const nama = btn.dataset.nama;
            const paketObj = JSON.parse(btn.dataset.paket.replace(/&apos;/g, "'")); // restore kutipan
  
            pakaiCoin(coin, nama, paketObj);
          });
        });
      });
  }  

function showConfirm(message, callback, mode = 'useCoin') {
    const modal = document.getElementById('confirm-modal');
    const msg = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');
  
    msg.innerHTML = message;
    modal.classList.remove('hidden');
  
    if (mode === 'loginOrRegister') {
        yesBtn.innerText = 'Register';
        noBtn.innerText = 'Login';
    } else {
        yesBtn.innerText = 'Ya';
        noBtn.innerText = 'Tidak';
    }
  
    const cleanup = () => {
      modal.classList.add('hidden');
      yesBtn.onclick = null;
      noBtn.onclick = null;
    };
  
    yesBtn.onclick = () => {
      cleanup();
      callback(true);
    };
  
    noBtn.onclick = () => {
      cleanup();
      callback(false);
    };
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.innerText = message;
  
    // Warna berdasarkan tipe
    const bg = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      info: 'bg-cyan-600'
    }[type];
  
    toast.className = `fixed bottom-6 right-6 text-sm px-4 py-3 rounded-lg shadow-lg border border-gray-600 text-white ${bg} z-50 transition-opacity duration-300`;
  
    toast.classList.remove('hidden');
    toast.style.opacity = '1';
  
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
  }

  function pakaiCoin(coinAmount, paketNama, paketMap) {
    showConfirm(`Yakin mau pakai ${coinAmount} coin untuk paket "${paketNama}"?`, (confirmed) => {
      if (!confirmed) return;
  
      fetch(`${api}/user/use-coin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin: coinAmount,
          paket: paketNama,
          paketMap,
          mac: macPub
        })
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          showToast('✅ Paket berhasil diaktifkan dengan coin!', 'success');
          getCoin(macPub);
          renderVoucher(result.user); // ← render ke HTML
        } else {
          showToast(result.message || '❌ Gagal menggunakan coin', 'error');
          showConfirm("Anda belum punya akun Mikcoins. Ingin daftar sekarang atau Login menggunakan Akun anda? Daftar sekarang dan dapatkan <span class='text-yellow-400 font-bold'>BONUS 35 COIN!</span>", (yes) => {
            if (yes) {
              window.location.href = "http://mbingsdk.net:5000/register?mac=" + macPub + "&bonus=35";
            } else {
              window.location.href = "http://mbingsdk.net:5000/login?mac=" + macPub;
            }
          }, 'loginOrRegister');
        }
      })
      .catch(() => {
        showToast('🚨 Terjadi kesalahan saat memproses.', 'error');
      });
    });
}

function generateQRCode(text) {
    new QRious({
      element: document.getElementById('qr-code'),
      value: text,
      size: 120,
      level: 'H'
    });
}   

function renderVoucher(user) {
  const container = document.getElementById('voucher-result');
  container.classList.remove('hidden');

  const uptime = user.limitUptime || "-";
  const comment = user.comment || "-";
  const qrValue = `${user.username}:${user.password}`;
  const waMessage = `Halo Admin, saya telah membeli paket:\n\n👤 Username: ${user.username}\n🔑 Password: ${user.password}\n📦 Profil: ${user.profile}\n⏳ Durasi: ${uptime}\n📝 Catatan: ${comment}`;

  container.innerHTML = `
    <div class="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-3xl mx-auto mt-8 border border-cyan-500 animate-fade text-sm text-gray-300 print:border-0 print:shadow-none">
      <h2 class="text-xl font-bold text-cyan-400 mb-4 text-center">🎫 Voucher Internet</h2>

      <div class="flex flex-col sm:flex-row gap-6">
        <div class="flex-1 space-y-2">
          <p><span class="text-gray-400">👤 Username:</span> <span class="font-semibold text-white">${user.username}</span></p>
          <p><span class="text-gray-400">🔑 Password:</span> <span class="font-semibold text-white">${user.password}</span></p>
          <p><span class="text-gray-400">📦 Profil:</span> ${user.profile}</p>
          <p><span class="text-gray-400">⏳ Durasi:</span> ${uptime}</p>
          <p><span class="text-gray-400">📝 Catatan:</span> ${comment}</p>
        </div>
      </div>

      <div class="mt-6 flex flex-col sm:flex-row gap-3 print:hidden">
        <form name="sendin" action="/login" method="post" class="flex-1" target="_blank">
          <input type="hidden" name="username" value="${user.username}" />
          <input type="hidden" name="password" value="${user.password}" />
          <input type="hidden" name="dst" value="status.html" />
          <input type="hidden" name="popup" value="true" />
          <button type="submit" class="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 rounded-lg transition">
            🔓 Login Sekarang
          </button>
        </form>
        <button onclick="window.print()" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition">
          🖨️ Cetak
        </button>
        <a href="https://wa.me/628124140496?text=${encodeURIComponent(waMessage)}" target="_blank"
          class="flex-1 bg-lime-500 hover:bg-lime-600 text-white font-bold py-2 rounded-lg transition text-center">
          📲 Kirim WA
        </a>
      </div>
    </div>
  `;

  // Scroll to voucher
  container.scrollIntoView({ behavior: "smooth", block: "start" });

  // Optionally: generate QR here
  // generateQRCode(qrValue);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
}

async function loadPage(url) {
    const main = document.getElementById('main-content');
    const res = await fetch(`pages/${url}`);
    const html = await res.text();
    main.innerHTML = html;
    if (url === 'paket.html') {
        loadPaket();
    }
}

async function getCoin(mac) {
    try {
      macPub = mac;
      const el = document.getElementById("coin-display");
      const res = await fetch(api + "/user/by-mac?mac=" + encodeURIComponent(mac));
      if (!res.ok) {
        console.error("HTTP " + res.status);
        el.onclick = () => {
            showConfirm("Anda belum punya akun Mikcoins. Ingin daftar sekarang atau Login menggunakan Akun anda? Daftar sekarang dan dapatkan <span class='text-yellow-400 font-bold'>BONUS 35 COIN!</span>", (yes) => {
                if (yes) {
                  window.location.href = "http://mbingsdk.net:5000/register?mac=" + macPub;
                } else {
                  window.location.href = "http://mbingsdk.net:5000/login?mac=" + macPub;
                }
            }, 'loginOrRegister');
        }
        return;
      }
      const data = await res.json();
      user = data;
      el.innerHTML = `💰 Coin: ${data.coins}`;
      el.onclick = () => {
        showToast(`Halo ${data.username}, Anda memiliki ${data.coins} coin!`, 'info');
      }
    //   el.innerHTML = `💰 Coin: 250`;
    //   el.classList.remove("hidden");
    } catch (err) {
      console.warn("Gagal ambil coin:", err);
    }
}