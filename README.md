# SDK-Dev MikroTik HotSpot

Custom RouterOS HotSpot servlet pages with a responsive UI, public package/contact pages, session status, usage counters, Mikcoins integration, QR login, and private/random MAC warning.

## HotSpot servlet files

- `login.html` — login form
- `alogin.html` — post-login redirect
- `status.html` — authenticated session status and usage
- `logout.html` — final session summary
- `error.html` — fatal error page
- `flogin.html` — failed login state
- `fstatus.html` — status requested while logged out
- `flogout.html` — logout requested while logged out
- `rlogin.html` — unauthenticated root redirect
- `rstatus.html` — authenticated root redirect
- `redirect.html` — RouterOS redirect helper
- `radvert.html` — advertisement redirect helper
- `errors.txt` — translated HotSpot errors
- `api.json` — captive portal API response
- `scripts/md5.js` — CHAP hashing support

## Public pages

`paket.html`, `about.html`, and `contact.html` can be opened before authentication. If an external URL is used before login, add its host to the HotSpot walled garden when required.

## Install

Upload the contents of this repository as one HotSpot HTML directory on the router. Point the HotSpot profile to that directory using the RouterOS `html-directory` setting, or use `html-directory-override` when the custom set is stored in an override location.

Keep all relative paths intact, especially `assets/`, `scripts/`, and `styles/`.

## External services

The current integration references:
- Mikcoins/API: `192.168.10.4:5000` / `mbingsdk.net:5000`
- QR scanner library: `unpkg.com`
- WhatsApp / social links

For a captive portal that blocks external hosts before authentication, whitelist required hosts or host required JavaScript locally.
