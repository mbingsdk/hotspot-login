document.login.username.focus();
const autoMode = document.getElementById("autoMode");

const username = document.login.username;
const password = document.login.password;

function setpass(){
  const user = username.value
  password.value = user;
}

function togleSwitch(){
  const autoMode = document.getElementById("autoMode");
  if (autoMode.checked) {
    username.focus();
    username.onchange = setpass;
    username.placeholder = "Masukkan kode";
    password.type = "hidden";
    password.value = username.value;
  } else {
    username.focus();
    username.onchange = "";
    password.type = "password";
    password.value = "";
  }
}

function startQRScanner() {
  const qrReader = document.getElementById("qr-reader");
  const autoMode = document.getElementById("autoMode");
  const autoModeLabel = document.getElementById("autoModeLabel");
  const btnLog = document.getElementById("btnLog");
  const btnQR = document.getElementById("btnQR");

  qrReader.classList.remove("hidden");
  username.classList.add("hidden");
  password.classList.add("hidden");
  autoMode.classList.add("hidden");
  autoModeLabel.classList.add("hidden");
  btnLog.classList.add("hidden");
  btnQR.classList.add("hidden");

  const html5QrCode = new Html5Qrcode("qr-reader");
  html5QrCode.start(
    { facingMode: "environment" }, // kamera belakang
    {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    },
    qrCodeMessage => {
      console.log("QR Detected:", qrCodeMessage);
      html5QrCode.stop(); // Stop scanner
      qrArea.classList.add("hidden");

      try {
        const url = new URL(qrCodeMessage);
        const uname = url.searchParams.get("username");
        const passd = url.searchParams.get("password");

        if (uname && passd) {
          username.value = uname;
          username.value = passd;
        } else {
          alert("QR tidak valid.");
          qrReader.classList.add("hidden");
          username.classList.remove("hidden");
          password.classList.remove("hidden");
          autoMode.classList.remove("hidden");
          autoModeLabel.classList.remove("hidden");
          btnLog.classList.remove("hidden");
          btnQR.classList.remove("hidden");
        }
      } catch (err) {
        alert("QR bukan URL login yang valid.");
        qrReader.classList.add("hidden");
        username.classList.remove("hidden");
        password.classList.remove("hidden");
        autoMode.classList.remove("hidden");
        autoModeLabel.classList.remove("hidden");
        btnLog.classList.remove("hidden");
        btnQR.classList.remove("hidden");
      }
    },
    errorMessage => {
      // console.log("QR scan error", errorMessage);
    }
  ).catch(err => {
    alert("Tidak bisa mengakses kamera: " + err);
    qrReader.classList.add("hidden");
    username.classList.remove("hidden");
    password.classList.remove("hidden");
    autoMode.classList.remove("hidden");
    autoModeLabel.classList.remove("hidden");
    btnLog.classList.remove("hidden");
    btnQR.classList.remove("hidden");
  });
}