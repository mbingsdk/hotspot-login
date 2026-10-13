const API_BASE=(location.protocol==="https:"?"https://":"http://")+"192.168.10.4:5000/api";
const statusData=window.HOTSPOT_STATUS||{};
function formatBytes(bytes){
 const value=Number(bytes)||0;if(value<=0)return"0 B";
 const units=["B","KB","MB","GB","TB"];
 const index=Math.min(Math.floor(Math.log(value)/Math.log(1024)),units.length-1);
 return(value/Math.pow(1024,index)).toFixed(index===0?0:1)+" "+units[index];
}
function buttonIcon(id,label){
 return "<svg class=\"icon\" aria-hidden=\"true\"><use href=\"assets/icons.svg#__ID__\"></use></svg><span>__LABEL__</span>"
  .replace("__ID__",id).replace("__LABEL__",label);
}
function packageIcon(pkg){
 const text=((pkg&&pkg.nama)||"")+" "+((pkg&&pkg.durasi)||"");
 if(/hari|harian/i.test(text))return"i-clock";
 if(/minggu/i.test(text))return"i-calendar";
 if(/bulan/i.test(text))return"i-crown";
 return"i-package";
}
function showToast(message,type="info"){
 const toast=document.getElementById("toast");if(!toast)return;
 toast.textContent=message;toast.className="toast "+type;toast.classList.remove("hidden");
 clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.add("hidden"),3200);
}
/* RouterOS status values refresh every ten seconds without reloading the page.
   Counters come exclusively from the router; timers animate between snapshots. */
const REFRESH_MS=10000;
const statusSnapshot=document.getElementById("hotspot-status-snapshot");
let sessionState=null;
let refreshing=false;
let lastSyncTime=0;
let sessionExpired=false;

function parseRouterDuration(text){
 const raw=String(text||"").trim().toLowerCase().replace(/\s+/g,"");
 if(!raw||raw.includes("$("))return null;
 if(/^\d+$/.test(raw))return Number(raw);
 let total=0,matched=false;
 const units={w:604800,d:86400,h:3600,m:60,s:1};
 const rest=raw.replace(/(\d+)([wdhms])/g,(_,count,unit)=>{
   matched=true;total+=Number(count)*units[unit];return "";
 });
 if(rest){
   const clock=/^(\d+):(\d{2})(?::(\d{2}))?$/.exec(rest);
   if(!clock)return null;
   const hours=Number(clock[1]),minutes=Number(clock[2]),seconds=clock[3]===undefined?0:Number(clock[3]);
   if(minutes>=60||seconds>=60)return null;
   total+=hours*3600+minutes*60+seconds;
   matched=true;
 }
 return matched&&Number.isFinite(total)?total:null;
}
function snapshotFrom(root){
 const el=root.querySelector("#hotspot-status-snapshot");
 if(!el)return null;
 const get=key=>el.querySelector('[data-status-key="'+key+'"]')?.textContent.trim()||"";
 const int=key=>{
   const raw=get(key);
   return /^\d+$/.test(raw)?Number(raw):null;
 };
 const uptime=int("uptimeSeconds")??parseRouterDuration(get("uptimeText"));
 const left=int("timeLeftSeconds")??parseRouterDuration(get("timeLeftText"));
 const limit=get("hasTimeLimit")==="yes";
 return {
   loggedIn:get("loggedIn"),
   uptime,limit,left,
   upText:get("uptimeText"),leftText:get("timeLeftText"),
   inBytes:int("bytesIn"),outBytes:int("bytesOut"),
   inNice:get("bytesInNice"),outNice:get("bytesOutNice"),
   remaining:int("remainBytesTotal")
 };
}

function duration(seconds){
 seconds=Math.max(0,Math.floor(seconds));
 const days=Math.floor(seconds/86400);
 const hours=Math.floor(seconds%86400/3600);
 const mins=Math.floor(seconds%3600/60);
 const secs=seconds%60;
 const hh=String(hours).padStart(2,"0");
 const mm=String(mins).padStart(2,"0");
 const ss=String(secs).padStart(2,"0");
 return (days?days+" hari ":"")+hh+":"+mm+":"+ss;
}
function setText(id,value){
 const el=document.getElementById(id);if(el)el.textContent=value;
}
function refreshNote(value,kind=""){
 const el=document.getElementById("status-refresh-info");
 if(!el)return;
 el.textContent=value;
 el.className="status-refresh-info"+(kind?" "+kind:"");
}
function renderTraffic(data){
 if(data.inBytes===null||data.outBytes===null){
   if(document.getElementById("traffic-total")?.textContent==="Menghitung..."){
     setText("traffic-total","Tidak tersedia");
   }
   return;
 }
 setText("traffic-total",formatBytes(data.inBytes+data.outBytes));
 const download=data.outNice||formatBytes(data.outBytes);
 const upload=data.inNice||formatBytes(data.inBytes);
 setText("detail-download",download);setText("usage-download",download);
 setText("detail-upload",upload);setText("usage-upload",upload);
 const progress=document.getElementById("quota-progress");
 const label=document.getElementById("quota-label");
 const note=document.getElementById("quota-note");
 if(!progress||!label||!note)return;
 if(data.remaining===null){
   progress.style.width="0%";
   label.textContent="Tidak tersedia";
   note.textContent="Informasi sisa kuota belum tersedia.";
   return;
 }
 const used=data.inBytes+data.outBytes;
 const total=used+data.remaining;
 const percent=total>0?Math.max(0,Math.min(100,used/total*100)):0;
 progress.style.width=percent.toFixed(1)+"%";
 label.textContent=percent.toFixed(0)+"% terpakai";
 note.textContent=formatBytes(used)+" digunakan · "+formatBytes(data.remaining)+" tersisa";
}
function renderTimer(){
 if(!sessionState)return;
 const elapsed=Math.max(0,Math.floor((Date.now()-lastSyncTime)/1000));
 setText("session-uptime",sessionState.uptime===null
   ?sessionState.upText||"Tidak tersedia"
   :duration(sessionState.uptime+elapsed));
 if(!sessionState.limit){
   setText("session-time-left","Tidak dibatasi");
 }else if(sessionState.left!==null){
   const remaining=Math.max(0,sessionState.left-elapsed);
   setText("session-time-left",duration(remaining));
   if(remaining===0)refreshNote("Waktu sesi mencapai 0. Memeriksa status koneksi…","warning");
 }else{
   setText("session-time-left",sessionState.leftText||"Tidak tersedia");
 }
}
function applySnapshot(snapshot){
 if(!snapshot)return;
 sessionExpired=false;
 sessionState=snapshot;
 lastSyncTime=Date.now();
 renderTimer();
 renderTraffic(snapshot);
}
function expiredSession(){
 refreshNote("Sesi HotSpot telah berakhir. Silakan login kembali.","error");
 const badge=document.getElementById("session-status-badge");
 if(badge){badge.textContent="OFFLINE";badge.classList.add("is-offline");}
 document.getElementById("session-relogin")?.classList.remove("hidden");
 sessionState=null;
 sessionExpired=true;
}
async function refreshStatus(){
 if(refreshing||document.visibilityState==="hidden"||sessionExpired)return;
 refreshing=true;
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),7000);
 try{
   const url=new URL(window.location.href);
   url.searchParams.set("_refresh",String(Date.now()));
   const response=await fetch(url.toString(),{
     credentials:"same-origin",cache:"no-store",
     redirect:"follow",signal:controller.signal,
     headers:{"Accept":"text/html"}
   });
   if(!response.ok)throw Error("HTTP "+response.status);
   if(new URL(response.url).origin!==location.origin)throw Error("Redirected away from hotspot");
   const html=await response.text();
   const doc=new DOMParser().parseFromString(html,"text/html");
   const fresh=snapshotFrom(doc);
   if(!fresh){
     const path=new URL(response.url).pathname;
     if(["login.html","logout.html","flogin.html"].some(page=>path.endsWith("/"+page))){
       expiredSession();
     }else{
       throw Error("RouterOS status unavailable");
     }
     return;
   }
   if(fresh.loggedIn==="no"){expiredSession();return;}
   applySnapshot(fresh);
   refreshNote("Data diperbarui otomatis setiap 10 detik · Terakhir "+new Date().toLocaleTimeString("id-ID"));
 }catch(_){
   refreshNote("Gagal memperbarui data. Angka trafik terakhir mungkin sudah berubah.","warning");
 }finally{
   clearTimeout(timeout);
   refreshing=false;
 }
}
function initUsage(){
 const initial=snapshotFrom(document);
 if(initial){
   applySnapshot(initial);
   refreshNote(initial.uptime===null
     ?"Timer tidak tersedia, tetapi trafik tetap diperbarui setiap 10 detik."
     :"Data akan diperbarui otomatis setiap 10 detik",initial.uptime===null?"warning":"");
 }else{
   const canReadCounters=Number.isFinite(statusData.bytesIn)&&Number.isFinite(statusData.bytesOut);
   renderTraffic({
     inBytes:canReadCounters?statusData.bytesIn:null,
     outBytes:canReadCounters?statusData.bytesOut:null,
     inNice:"",outNice:"",
     remaining:Number.isFinite(statusData.remainBytesTotal)?statusData.remainBytesTotal:null
   });
   setText("session-uptime",document.getElementById("session-uptime")?.textContent||"Tidak tersedia");
   refreshNote("Data awal belum lengkap. Mencoba menyinkronkan lagi setiap 10 detik.","warning");
 }
 // Package rendering and traffic polling must not depend on the uptime field.
 setInterval(renderTimer,1000);
 setInterval(refreshStatus,REFRESH_MS);
 document.addEventListener("visibilitychange",()=>{
   if(!document.hidden)refreshStatus();
 });
}

async function loadPackages(){
 const state=document.getElementById("package-state");
 const list=document.getElementById("package-list");
 if(!state||!list)return;
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),8000);
 try{
  state.textContent="Memuat daftar paket...";
  state.classList.remove("error");
  const response=await fetch("assets/paket.json",{
   cache:"no-store",credentials:"same-origin",signal:controller.signal
  });
  if(!response.ok)throw Error("HTTP "+response.status);
  const packages=await response.json();
  if(!Array.isArray(packages)||packages.length===0)throw Error("Daftar paket kosong");
  list.replaceChildren();
  packages.forEach((pkg,index)=>{
   const card=document.createElement("article");card.className="package-card";
   if(/Harian|Mingguan/i.test(pkg.nama||"")||index===1)card.classList.add("featured");
   const iconBox=document.createElement("div");iconBox.className="package-icon";
   iconBox.innerHTML='<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#'+packageIcon(pkg)+'"></use></svg>';
   const name=document.createElement("h3");name.textContent=pkg.nama||"Paket";
   const info=document.createElement("p");info.textContent=[pkg.durasi,pkg.kecepatan].filter(Boolean).join(" · ");
   const price=document.createElement("p");price.className="package-price";
   price.textContent="Rp "+Number(pkg.harga||0).toLocaleString("id-ID");
   const actions=document.createElement("div");actions.className="package-actions";
   const wa=document.createElement("a");wa.className="btn btn-secondary";
   wa.target="_blank";wa.rel="noopener";wa.innerHTML=buttonIcon("i-whatsapp","Beli via WhatsApp");
   const message="Halo, saya mau pesan paket Internet:\\n"+(pkg.nama||"Paket")+" - "+(pkg.durasi||"")+
     ", Harga: Rp "+Number(pkg.harga||0).toLocaleString("id-ID");
   wa.href="https://wa.me/628124140496?text="+encodeURIComponent(message);
   const coin=document.createElement("button");coin.type="button";coin.className="btn btn-primary";
   coin.innerHTML=buttonIcon("i-coin","Pakai "+Number(pkg.coin||0)+" Coin");
   coin.addEventListener("click",()=>buyVoucherWithCoins(pkg,coin));
   actions.append(wa,coin);card.append(iconBox,name,info,price,actions);list.appendChild(card);
  });
  state.classList.add("hidden");
  list.classList.remove("hidden");
 }catch(error){
  list.classList.add("hidden");
  state.classList.remove("hidden");
  state.classList.add("error");
  state.replaceChildren();
  const message=document.createElement("span");
  message.textContent="Daftar paket gagal dimuat. Pastikan assets/paket.json sudah di-upload ke HotSpot.";
  const retry=document.createElement("button");
  retry.className="btn btn-secondary";retry.type="button";
  retry.style.marginLeft="10px";retry.textContent="Coba lagi";
  retry.addEventListener("click",loadPackages);
  state.append(message,retry);
 }finally{
  clearTimeout(timeout);
 }
}
document.addEventListener("DOMContentLoaded",()=>{initUsage();loadPackages()});
