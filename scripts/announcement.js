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

  function safeText(value, fallback, limit) {
    return typeof value === "string" && value.trim()
      ? value.trim().slice(0, limit)
      : fallback;
  }

  function closeAnnouncement() {
    if (!opened) return;
    opened = false;
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
