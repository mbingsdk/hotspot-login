/* Login-only announcement. Edit assets/announcement.json to configure it. */
(function () {
  "use strict";

  const CONFIG_PATH = "assets/announcement.json";
  const modal = document.getElementById("login-announcement");
  if (!modal) return;

  const dialog = modal.querySelector(".announcement-modal");
  const closeButton = document.getElementById("announcement-close");
  const dismissButton = document.getElementById("announcement-dismiss");
  const action = document.getElementById("announcement-action");
  const badge = document.getElementById("announcement-badge");
  const heading = document.getElementById("announcement-title");
  const description = document.getElementById("announcement-message");
  const highlight = document.getElementById("announcement-highlight");
  let lastFocus = null;
  let opened = false;
  const countdown = document.getElementById("announcement-countdown");
  let autoCloseSeconds = 10;
  let closeTimer = null;
  let countdownTimer = null;

  function clearAutoClose() {
    if (closeTimer !== null) window.clearTimeout(closeTimer);
    if (countdownTimer !== null) window.clearInterval(countdownTimer);
    closeTimer = null;
    countdownTimer = null;
  }

  function startAutoClose() {
    clearAutoClose();
    if (autoCloseSeconds === 0) {
      if (countdown) countdown.classList.add("hidden");
      return;
    }
    const duration = autoCloseSeconds * 1000;
    const deadline = Date.now() + duration;
    if (countdown) {
      countdown.classList.remove("hidden");
      countdown.textContent = "Menutup otomatis dalam " + autoCloseSeconds + " detik";
      countdownTimer = window.setInterval(() => {
        if (!opened) return;
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        countdown.textContent = "Menutup otomatis dalam " + remaining + " detik";
      }, 250);
    }
    closeTimer = window.setTimeout(closeAnnouncement, duration);
  }

  function safeText(value, fallback, limit) {
    return typeof value === "string" && value.trim()
      ? value.trim().slice(0, limit)
      : fallback;
  }

  function closeAnnouncement() {
    if (!opened) return;
    opened = false;
    clearAutoClose();
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("announcement-open");
    if (lastFocus && document.contains(lastFocus) && typeof lastFocus.focus === "function") {
      lastFocus.focus({ preventScroll: true });
    }
  }

  function keyboardHandler(event) {
    if (!opened) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeAnnouncement();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll("button:not([disabled]), a[href]:not(.hidden)")];
    if (!controls.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openAnnouncement() {
    if (opened) return;
    lastFocus = document.activeElement;
    opened = true;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("announcement-open");
    closeButton.focus({ preventScroll: true });
    startAutoClose();
  }

  function configure(config) {
    if (!config || config.enabled !== true) return;
    const id = safeText(config.id, "", 100);
    if (!id) return;

    const storageKey = "hotspot-announcement:" + id;
    const once = config.showOncePerSession !== false;

    if (once) {
      try {
        if (sessionStorage.getItem(storageKey) === "seen") return;
      } catch (_) {
        /* Captive webviews may block storage; still allow the announcement. */
      }
    }

    badge.textContent = safeText(config.badge, "PENGUMUMAN", 45);
    heading.textContent = safeText(config.title, "Informasi Hotspot", 120);
    description.textContent = safeText(config.message, "", 500);
    const emphasized = safeText(config.highlight, "", 70);
    highlight.textContent = emphasized;
    highlight.classList.toggle("hidden", !emphasized);

    // Only local portal pages are permitted as an announcement destination.
    const url = safeText(config.actionUrl, "", 80);
    const allowed = /^(paket|about|contact)\.html$/.test(url);
    if (allowed) {
      action.href = url;
      action.querySelector("span").textContent = safeText(config.actionText, "Lihat selengkapnya", 55);
      action.classList.remove("hidden");
    } else {
      action.removeAttribute("href");
      action.classList.add("hidden");
    }

    const configuredClose = Number(config.autoCloseSeconds);
    autoCloseSeconds = Number.isFinite(configuredClose)
      ? Math.min(120, Math.max(0, Math.round(configuredClose)))
      : 10;

    const delay = Number(config.delayMs);
    const delayMs = Number.isFinite(delay) ? Math.min(3000, Math.max(0, delay)) : 900;

    window.setTimeout(() => {
      // Avoid interrupting a form submission or an open QR scanner.
      if (document.visibilityState === "hidden") return;
      if (!document.getElementById("qr-reader")?.classList.contains("hidden")) return;
      openAnnouncement();
      if (once) {
        try { sessionStorage.setItem(storageKey, "seen"); } catch (_) {}
      }
    }, delayMs);
  }

  closeButton.addEventListener("click", closeAnnouncement);
  dismissButton.addEventListener("click", closeAnnouncement);
  action.addEventListener("click", closeAnnouncement);
  modal.addEventListener("click", event => {
    if (event.target === modal) closeAnnouncement();
  });
  document.addEventListener("keydown", keyboardHandler);

  fetch(CONFIG_PATH, { cache: "no-store" })
    .then(response => {
      if (!response.ok) throw new Error("Announcement config unavailable");
      return response.json();
    })
    .then(configure)
    .catch(() => {
      // Promotion is optional; login must remain fully usable.
    });
})();
