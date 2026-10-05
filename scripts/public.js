const API_BASE="http://192.168.10.4:5000/api";
function rupiah(n){return"Rp "+Number(n||0).toLocaleString("id-ID")}
async function loadPackages(){
 const state=document.getElementById("package-state"),list=document.getElementById("package-list");
 if(!state||!list)return;
 try{
  const r=await fetch("assets/paket.json",{cache:"no-store"}); if(!r.ok)throw new Error("HTTP "+r.status);
  const rows=await r.json(); if(!Array.isArray(rows)||!rows.length)throw new Error("empty");
  list.innerHTML="";
  rows.forEach(p=>{
   const card=document.createElement("article");card.className="package-card";
   const h=document.createElement("h3");h.textContent=p.nama||"Paket";
   const info=document.createElement("p");info.textContent=[p.durasi,p.kecepatan].filter(Boolean).join(" · ");
   const price=document.createElement("p");price.className="package-price";price.textContent=rupiah(p.harga);
   const actions=document.createElement("div");actions.className="package-actions";
   const wa=document.createElement("a");wa.className="btn btn-secondary";wa.target="_blank";wa.rel="noopener";wa.textContent="Beli via WhatsApp";
   wa.href="https://wa.me/628124140496?text="+encodeURIComponent("Halo, saya mau pesan paket Internet:\n"+(p.nama||"Paket")+" - "+(p.durasi||"")+", Harga: "+rupiah(p.harga));
   const coin=document.createElement("a");coin.className="btn btn-primary";coin.textContent="Pakai "+Number(p.coin||0)+" Coin";
   const mac=document.getElementById("mac-addr")?.value||"";coin.href="http://mbingsdk.net:5000/login?mac="+encodeURIComponent(mac);
   actions.append(wa,coin);card.append(h,info,price,actions);list.appendChild(card);
  });
  state.classList.add("hidden");list.classList.remove("hidden");
 }catch(e){state.textContent="Daftar paket gagal dimuat. Muat ulang halaman atau hubungi admin.";state.classList.add("error");}
}
document.addEventListener("DOMContentLoaded",loadPackages);