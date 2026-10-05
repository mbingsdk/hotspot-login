let socket;
const macAddress = document.getElementById("mac-addr").value || "unknown";

function toggleChat() {
  const chatContainer = document.getElementById("chat-container");
  chatContainer.classList.toggle("hidden");

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    socket = new WebSocket("ws://192.168.10.4:8000"); // Ganti sesuai IP server kamu

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "init", mac: macAddress }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const chatBox = document.getElementById("chat-box");
      const message = document.createElement("div");
      const allowedColors = ['red', 'green', 'blue', 'yellow', 'cyan', 'lime', 'gray', 'orange', 'pink', 'purple', 'white'];
      let formatted = data.text
        // Bold
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/_(.*?)_/g, "<em>$1</em>")
        // Link
        .replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, `<a href="$2" target="_blank" class="text-cyan-400 underline">$1</a>`)
        // Warna (misalnya {color:red}text{/color})
        .replace(/\{color:([a-zA-Z]+)\}(.*?)\{\/color\}/g, (_, color, text) => {
          if (allowedColors.includes(color.toLowerCase())) {
            return `<span class="text-${color}-400">${text}</span>`;
          }
          return text; // fallback: no color
        })
        // Line breaks
        .replace(/\n/g, "<br>");

        /*
        User mengetik:
          **Tebal**
          _Miring_
          [Cek Website](https://example.com)
          {color:red}Ini Merah{/color}
          {color:cyan}Ini Hijau Terang{/color}
        */

      message.innerHTML = `
        <span class="text-cyan-300 font-semibold">${data.name}</span>: 
        ${formatted}
      `;

//      message.innerHTML = `
//        <span class="text-cyan-300 font-semibold">${data.name}</span> 
//        <span class="text-gray-400 text-xs">(${data.mac})</span>: 
//        ${formatted}
//      `;
    
      if (data.client_name) {
        document.getElementById("chat-name").value = data.client_name;
      }
    
      chatBox.appendChild(message);
      chatBox.scrollTop = chatBox.scrollHeight;
    };
  }
}

function sendMessage() {
  const name = document.getElementById("chat-name").value || "Anonim";
  const text = document.getElementById("chat-message").value;
  if (!text.trim()) return;

  const message = {
    type: "chat",
    name: name,
    mac: macAddress,
    text: text
  };

  socket.send(JSON.stringify(message));
  document.getElementById("chat-message").value = '';
}
