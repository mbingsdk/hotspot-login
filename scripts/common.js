const HOTSPOT_API=(location.protocol==="https:"?"https://":"http://")+"192.168.10.4:5000/api";
const HOTSPOT_CHAT_URL=(location.protocol==="https:"?"wss://":"ws://")+"192.168.10.4:8000";
let hotspotChatSocket=null;

function svgIcon(id,cls="icon"){return '<svg class="'+cls+'" aria-hidden="true"><use href="assets/icons.svg#'+id+'"></use></svg>'}

async function initCoinIndicator(){
  const el=document.getElementById("coin-indicator");
  const mac=document.getElementById("mac-addr")?.value||window.HOTSPOT_STATUS?.mac||"";
  if(!el)return;
  el.classList.add("is-loading");
  el.innerHTML=svgIcon("i-coin","icon")+'<span>Coin</span>';
  if(!mac){el.classList.remove("is-loading");el.classList.add("is-error");return}
  try{
    const r=await fetch(HOTSPOT_API+"/user/by-mac?mac="+encodeURIComponent(mac),{cache:"no-store"});
    if(!r.ok)throw new Error("not-found");
    const data=await r.json();
    el.classList.remove("is-loading","is-error");
    el.innerHTML=svgIcon("i-coin","icon")+'<span>'+Number(data.coins||0)+' Coin</span>';
    el.href="http://mbingsdk.net:5000/login?mac="+encodeURIComponent(mac);
  }catch(_){
    el.classList.remove("is-loading");
    el.classList.add("is-error");
    el.innerHTML=svgIcon("i-coin","icon")+'<span>Mikcoins</span>';
    el.href="http://mbingsdk.net:5000/login?mac="+encodeURIComponent(mac);
  }
}

function setChatStatus(text,type=""){
  const el=document.getElementById("chat-status");
  if(!el)return;
  el.textContent=text;
  el.className="chat-status"+(type?" "+type:"");
}

function appendChatMessage(name,text){
  const box=document.getElementById("chat-messages");
  if(!box)return;
  box.querySelector(".chat-empty")?.remove();
  const row=document.createElement("div");
  row.className="chat-message";
  const who=document.createElement("strong");
  who.textContent=(name||"Anonim")+": ";
  const body=document.createElement("span");
  body.textContent=String(text||"");
  row.append(who,body);
  box.appendChild(row);
  box.scrollTop=box.scrollHeight;
}

function connectChat(){
  const mac=document.getElementById("mac-addr")?.value||window.HOTSPOT_STATUS?.mac||"unknown";
  if(hotspotChatSocket && (hotspotChatSocket.readyState===WebSocket.OPEN || hotspotChatSocket.readyState===WebSocket.CONNECTING))return;
  try{
    setChatStatus("Menghubungkan…");
    hotspotChatSocket=new WebSocket(HOTSPOT_CHAT_URL);
    hotspotChatSocket.onopen=()=>{
      setChatStatus("Online","online");
      hotspotChatSocket.send(JSON.stringify({type:"init",mac}));
    };
    hotspotChatSocket.onmessage=(event)=>{
      try{
        const data=JSON.parse(event.data);
        if(data.client_name){
          const name=document.getElementById("chat-name");
          if(name && !name.value)name.value=data.client_name;
        }
        if(data.text)appendChatMessage(data.name,data.text);
      }catch(_){}
    };
    hotspotChatSocket.onerror=()=>setChatStatus("Chat tidak tersedia","error");
    hotspotChatSocket.onclose=()=>setChatStatus("Offline","error");
  }catch(_){
    setChatStatus("Chat tidak tersedia","error");
  }
}

function toggleChat(){
  const panel=document.getElementById("chat-panel");
  if(!panel)return;
  const opening=panel.classList.contains("hidden");
  panel.classList.toggle("hidden");
  if(opening)connectChat();
}

function sendChatMessage(){
  const name=document.getElementById("chat-name");
  const input=document.getElementById("chat-message");
  const mac=document.getElementById("mac-addr")?.value||window.HOTSPOT_STATUS?.mac||"unknown";
  const text=String(input?.value||"").trim();
  if(!text)return;
  if(!hotspotChatSocket || hotspotChatSocket.readyState!==WebSocket.OPEN){
    setChatStatus("Chat belum terhubung","error");
    connectChat();
    return;
  }
  hotspotChatSocket.send(JSON.stringify({type:"chat",name:String(name?.value||"Anonim").trim()||"Anonim",mac,text}));
  input.value="";
}

function initChat(){
  document.getElementById("chat-send")?.addEventListener("click",sendChatMessage);
  document.getElementById("chat-message")?.addEventListener("keydown",e=>{
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChatMessage()}
  });
}

document.addEventListener("DOMContentLoaded",()=>{initCoinIndicator();initChat()});