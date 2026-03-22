<div align="center">

<br/>

<!-- BANNER: Replace with assets/banner.png -->
<img src="assets/banner.png" alt="CapitalOneTap Banner" width="100%" style="border-radius:12px;" onerror="this.style.display='none'"/>

<br/><br/>

<img src="icons/icon128.png" alt="OneTap Icon" width="96"/>

<br/><br/>

<h1>
  <img src="https://img.shields.io/badge/Capital%20One-OneTap-CC0000?style=for-the-badge&labelColor=1C2B33&color=CC0000&logoColor=white" alt="CapitalOneTap"/>
</h1>

<p><strong>Frictionless Capital One checkout — everywhere.</strong><br/>
Auto-applies your best offers, splits transactions, and lets you pay in one tap on any site.</p>

<br/>

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-CC0000?style=flat-square&logo=googlechrome&logoColor=white&labelColor=1C2B33)](https://github.com/ashwinpatri/CapitalOneTap)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-CC0000?style=flat-square&labelColor=1C2B33)](https://developer.chrome.com/docs/extensions/mv3/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-CC0000?style=flat-square&logo=javascript&logoColor=white&labelColor=1C2B33)](https://github.com/ashwinpatri/CapitalOneTap)
[![License](https://img.shields.io/badge/License-MIT-CC0000?style=flat-square&labelColor=1C2B33)](LICENSE)

<br/>

</div>

---

## 📸 Screenshots

<div align="center">

### Extension Popup

<!-- Replace with your screenshot: assets/screenshots/popup.png -->
<img src="assets/screenshots/popup.png" alt="Extension Popup" width="320" onerror="this.style.border='2px dashed #CC0000';this.style.borderRadius='8px';this.alt='[ Screenshot: popup.png — add to assets/screenshots/ ]'"/>

<br/><br/>

### Checkout Overlay

<!-- Replace with your screenshot: assets/screenshots/overlay.png -->
<img src="assets/screenshots/overlay.png" alt="Checkout Overlay on a shopping site" width="700" onerror="this.style.border='2px dashed #CC0000';this.style.borderRadius='8px';this.alt='[ Screenshot: overlay.png — add to assets/screenshots/ ]'"/>

<br/><br/>

### Web Dashboard

<!-- Replace with your screenshot: assets/screenshots/dashboard.png -->
<img src="assets/screenshots/dashboard.png" alt="OneTap Web Dashboard" width="700" onerror="this.style.border='2px dashed #CC0000';this.style.borderRadius='8px';this.alt='[ Screenshot: dashboard.png — add to assets/screenshots/ ]'"/>

</div>

> **How to add screenshots:** Take screenshots of your popup, overlay, and dashboard, then save them to `assets/screenshots/` using the filenames above. They'll automatically appear here.

---

## ✨ Features

- **🎯 Auto-Apply Offers** — Detects checkout pages and automatically surfaces your best available Capital One offer.
- **💳 One-Tap Pay** — Tokenized card details injected securely so you can complete purchases without ever opening your wallet.
- **✂️ Split Transactions** — Split any purchase across multiple Capital One cards in seconds.
- **🔔 Smart Overlay** — A lightweight, non-intrusive overlay appears only when it can save you money.
- **🔒 Google OAuth** — Sign in securely with your Google account — no passwords stored.
- **⚡ Works Everywhere** — Injected on all URLs via Manifest V3 content scripts.

---

## 🚀 Installation

> The extension is not yet on the Chrome Web Store. Follow these steps to load it directly.

### Step 1 — Download the Extension

**Option A — Clone the repo:**
```bash
git clone https://github.com/ashwinpatri/CapitalOneTap.git
```

**Option B — Download ZIP:**

<div align="center">

[![Download ZIP](https://img.shields.io/badge/⬇️%20Download%20ZIP-CC0000?style=for-the-badge&labelColor=1C2B33)](https://github.com/ashwinpatri/CapitalOneTap/archive/refs/heads/main.zip)

</div>

Then unzip the file somewhere permanent on your computer (not your Downloads folder — Chrome needs the folder to stay put).

---

### Step 2 — Open Chrome Extensions

Navigate to:
```
chrome://extensions
```

Or go to **Chrome menu (⋮) → Extensions → Manage Extensions**.

---

### Step 3 — Enable Developer Mode

Toggle **Developer mode** on in the top-right corner of the Extensions page.

<!-- Replace with your screenshot: assets/screenshots/developer-mode.png -->
> 📷 *Screenshot placeholder — add `assets/screenshots/developer-mode.png`*

---

### Step 4 — Load Unpacked

Click **"Load unpacked"** and select the `CapitalOneTap` folder you downloaded (the one containing `manifest.json`).

<!-- Replace with your screenshot: assets/screenshots/load-unpacked.png -->
> 📷 *Screenshot placeholder — add `assets/screenshots/load-unpacked.png`*

---

### Step 5 — Pin & Sign In

Pin the **OneTap** extension from your Chrome toolbar, click it, and sign in with Google.

<!-- Replace with your screenshot: assets/screenshots/sign-in.png -->
> 📷 *Screenshot placeholder — add `assets/screenshots/sign-in.png`*

You're done. Start shopping. 💳

---

## 🗂️ Project Structure

```
CapitalOneTap/
├── assets/
│   ├── fonts/          # Capital One Optimist typeface files
│   └── screenshots/    # README screenshots (add yours here)
├── background/
│   └── service-worker.js
├── content/
│   ├── detector.js     # Detects checkout pages
│   └── injector.js     # Injects the payment overlay
├── icons/              # Extension icons (16/32/48/128px)
├── one-tap/            # One-tap payment logic
├── popup/
│   └── popup.html      # Extension popup UI
├── server/             # Backend API integration
├── shared/
│   ├── constants.js
│   └── utils.js
├── styles/
│   └── brand.css       # Capital One brand styles
├── auth-callback.html
└── manifest.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Extension | Chrome Manifest V3, Vanilla JS |
| UI | HTML5, CSS3, Capital One Optimist font |
| Auth | Google OAuth 2.0 |
| Backend API | Node.js (hosted on [Render](https://onetap-api.onrender.com)) |
| Web App | [Vercel](https://onetap-ten.vercel.app) |

---

## 👥 Contributors

<div align="center">

| [![ashwinpatri](https://avatars.githubusercontent.com/u/206020846?s=60&v=4)](https://github.com/ashwinpatri) | [![thung19](https://avatars.githubusercontent.com/u/221648236?s=60&v=4)](https://github.com/thung19) | [![db30x](https://avatars.githubusercontent.com/u/70980800?s=60&v=4)](https://github.com/db30x) | [![sjmcf](https://avatars.githubusercontent.com/u/203656461?s=60&v=4)](https://github.com/sjmcf) |
|:---:|:---:|:---:|:---:|
| [ashwinpatri](https://github.com/ashwinpatri) | [thung19](https://github.com/thung19) | [db30x](https://github.com/db30x) | [sjmcf](https://github.com/sjmcf) |

</div>

---

## ⚠️ Disclaimer

This project is an independent, unofficial tool and is **not affiliated with, endorsed by, or sponsored by Capital One Financial Corporation**. Capital One® and related marks are trademarks of Capital One.

---

<div align="center">

<br/>

Made with ❤️ and a Capital One card

<br/>

[![Star on GitHub](https://img.shields.io/github/stars/ashwinpatri/CapitalOneTap?style=social)](https://github.com/ashwinpatri/CapitalOneTap)

</div>
