const username=document.getElementById("login-username");
const password=document.getElementById("login-password");
const passwordField=document.getElementById("password-field");
const usernameField=document.getElementById("username-field");
const autoMode=document.getElementById("autoMode");
const notice=document.getElementById("runtime-notice");
const guides={
 android:["Android","Buka pengaturan Wi-Fi jaringan ini.","Cari Privacy / MAC address type.","Pilih Device MAC / Phone MAC.","Sambungkan ulang ke hotspot."],
 ios:["iPhone / iPad","Buka Settings > Wi-Fi.","Ketuk info jaringan ini.","Ubah Private Wi-Fi Address ke Off.","Sambungkan ulang ke hotspot."],
 macos:["macOS","Buka System Settings > Wi-Fi.","Buka Details jaringan ini.","Ubah Private Wi-Fi address ke Off.","Sambungkan ulang ke hotspot."],
 windows:["Windows","Buka Settings > Network & internet > Wi-Fi.","Buka properti jaringan ini.","Matikan Random hardware addresses.","Sambungkan ulang ke hotspot."],
 other:["Perangkat","Buka pengaturan Wi-Fi jaringan ini.","Cari Private address / Randomized MAC.","Gunakan Device MAC / Hardware MAC.","Sambungkan ulang ke hotspot."]
};
function showNotice(m){if(!notice)return;notice.textContent=m;notice.classList.add("show")}
function clearNotice(){if(!notice)return;notice.textContent="";notice.classList.remove("show")}
function platform(){const u=navigator.userAgent||"",p=navigator.platform||"";if(/Android/i.test(u))return"android";if(/iPhone|iPad|iPod/i.test(u))return"ios";if(/Mac/i.test(u+p))return"macos";if(/Win/i.test(u+p))return"windows";return"other"}
function normalizeMac(m){return String(m||"").trim().replace(/-/g,":").toUpperCase()}
function localMac(m){
 const x=normalizeMac(m).split(":");
 if(x.length!==6||!x.every(v=>/^[0-9A-F]{2}$/.test(v)))return false;
 const first=parseInt(x[0],16);
 return (first&3)===2;
}
function initMac(){const input=document.getElementById("mac-addr"),box=document.getElementById("private-mac-warning"),label=document.getElementById("mac-label");if(!input)return;const mac=normalizeMac(input.value);if(label)label.textContent=mac||"-";if(!box||!localMac(mac))return;const g=guides[platform()]||guides.other;document.getElementById("guide-platform").textContent=g[0];const ol=document.getElementById("guide-steps");ol.innerHTML="";g.slice(1).forEach(s=>{const li=document.createElement("li");li.textContent=s;ol.appendChild(li)});box.classList.add("show")}
function toggleMacGuide(){document.getElementById("private-mac-guide")?.classList.toggle("show")}
function setVoucherPassword(){if(username&&password)password.value=username.value}
function toggleSingleField(){if(!username||!password||!autoMode)return;if(autoMode.checked){username.addEventListener("input",setVoucherPassword);password.value=username.value;password.type="hidden";passwordField?.classList.add("hidden");username.placeholder="Masukkan kode voucher"}else{username.removeEventListener("input",setVoucherPassword);password.value="";password.type="password";passwordField?.classList.remove("hidden");username.placeholder="Masukkan username atau voucher"}username.focus()}
function togglePassword(){if(password)password.type=password.type==="password"?"text":"password"}
function qrMode(on){const qr=document.getElementById("qr-reader"),mode=document.getElementById("autoModeLabel"),log=document.getElementById("btnLog"),btn=document.getElementById("btnQR");[usernameField,passwordField,mode,log,btn].filter(Boolean).forEach(e=>e.classList.toggle("hidden",on));qr?.classList.toggle("hidden",!on)}
function fillQr(raw){const text=String(raw||"").trim();if(!text)return false;try{const u=new URL(text),a=u.searchParams.get("username"),b=u.searchParams.get("password");if(a&&b){username.value=a;password.value=b;return true}}catch(_){}
const i=text.indexOf(":");if(i>0){const a=text.slice(0,i).trim(),b=text.slice(i+1).trim();if(a&&b){username.value=a;password.value=b;return true}}return false}
const QR_LIBRARY_URL="https://unpkg.com/html5-qrcode";
let qrLibraryPromise=null;

function handleQrLibraryError(){
 const btn=document.getElementById("btnQR");
 if(btn)btn.disabled=false;
 showNotice("Scan QR tidak bisa dimuat. Login manual tetap dapat digunakan.");
}

function ensureQrLibrary(){
 if(typeof Html5Qrcode!=="undefined")return Promise.resolve();
 if(qrLibraryPromise)return qrLibraryPromise;

 showNotice("Memuat pemindai QR…");
 const btn=document.getElementById("btnQR");
 if(btn)btn.disabled=true;

 qrLibraryPromise=new Promise((resolve,reject)=>{
   const script=document.createElement("script");
   const timer=setTimeout(()=>{
     script.remove();
     reject(new Error("timeout"));
   },8000);

   script.src=QR_LIBRARY_URL;
   script.async=true;
   script.onload=()=>{
     clearTimeout(timer);
     if(typeof Html5Qrcode==="undefined"){
       reject(new Error("library-invalid"));
       return;
     }
     resolve();
   };
   script.onerror=()=>{
     clearTimeout(timer);
     reject(new Error("load-failed"));
   };
   document.head.appendChild(script);
 }).finally(()=>{
   if(btn)btn.disabled=false;
 });

 return qrLibraryPromise;
}

async function startQRScanner(){
 clearNotice();
 try{
   await ensureQrLibrary();
 }catch(_){
   qrLibraryPromise=null;
   handleQrLibraryError();
   return;
 }

 qrMode(true);
 let scanner;
 try{
   scanner=new Html5Qrcode("qr-reader");
 }catch(_){
   qrMode(false);
   showNotice("Pemindai QR tidak dapat dijalankan.");
   return;
 }

 scanner.start(
   {facingMode:"environment"},
   {fps:10,qrbox:{width:230,height:230}},
   text=>{
     const ok=fillQr(text);
     scanner.stop().catch(()=>{}).finally(()=>{
       qrMode(false);
       if(!ok)showNotice("QR tidak berisi kredensial hotspot yang valid.");
       else username?.focus();
     });
   },
   ()=>{}
 ).catch(e=>{
   qrMode(false);
   const n=String(e?.name||e?.message||e);
   showNotice(
     /NotAllowed|Permission/i.test(n)
       ?"Izin kamera ditolak. Izinkan kamera atau login manual."
       :/NotFound/i.test(n)
         ?"Kamera tidak ditemukan."
         :"Kamera tidak bisa dibuka. Login manual tetap tersedia."
   );
 });
}
document.addEventListener("DOMContentLoaded",()=>{initMac();username?.focus()});