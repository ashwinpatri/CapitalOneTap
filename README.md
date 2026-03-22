<div align="center">

<img src="icons/icon128.png" alt="OneTap" width="80"/>

<br/>

# [OneTap](https://onetap-ten.vercel.app)

**Frictionless Capital One checkout, everywhere.**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-CC0000?style=flat-square&labelColor=1C2B33)](https://developer.chrome.com/docs/extensions/mv3/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-CC0000?style=flat-square&labelColor=1C2B33)](https://github.com/ashwinpatri/CapitalOneTap)
[![License](https://img.shields.io/badge/License-MIT-CC0000?style=flat-square&labelColor=1C2B33)](LICENSE)

</div>

---

## Overview

OneTap is a Chrome extension that brings Capital One to every checkout. It automatically detects purchase pages, surfaces your best available offer, and lets you complete a transaction without leaving the page. Sign in once with Google — it handles the rest.

---

## Features

- Detects checkout pages and applies your best Capital One offer automatically
- One-tap payment via securely injected card details
- Split transactions across multiple Capital One cards
- Non-intrusive overlay that only appears when relevant
- Google OAuth sign-in — no passwords stored

---

## Installation

OneTap is not yet listed on the Chrome Web Store. Load it manually in a few steps.

**1. Download**

Clone the repository or download the ZIP directly:

```
https://github.com/ashwinpatri/CapitalOneTap/archive/refs/heads/main.zip
```

Unzip to a permanent location — Chrome requires the folder to remain in place.

**2. Open Extensions**

Navigate to `chrome://extensions` in your browser.

**3. Enable Developer Mode**

Toggle **Developer mode** on in the top-right corner.

**4. Load Unpacked**

Click **Load unpacked** and select the `CapitalOneTap` folder (the one containing `manifest.json`).

**5. Sign In**

Pin the OneTap icon to your toolbar, click it, and sign in with Google.

---

## Project Structure

```
CapitalOneTap/
├── assets/
│   └── fonts/              # Optimist typeface
├── background/
│   └── service-worker.js
├── content/
│   ├── detector.js         # Checkout page detection
│   └── injector.js         # Overlay injection
├── icons/
├── one-tap/                # Payment logic
├── popup/
│   └── popup.html
├── server/                 # Backend API
├── shared/
│   ├── constants.js
│   └── utils.js
├── styles/
│   └── brand.css
├── auth-callback.html
└── manifest.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension | Chrome Manifest V3, Vanilla JS |
| Auth | Google OAuth 2.0 |
| API | Node.js on Render |
| Web App | Vercel |

---

## Contributors

- [Ashwin Patri](https://github.com/ashwinpatri)
- [thung19](https://github.com/thung19)
- [db30x](https://github.com/db30x)
- [sjmcf](https://github.com/sjmcf)

---

## Disclaimer

This is an independent, unofficial project, built for the VandyHacks x Capital One Hackathon. It is not affiliated with, endorsed by, or sponsored by Capital One Financial Corporation. Capital One® and related marks are trademarks of Capital One.
