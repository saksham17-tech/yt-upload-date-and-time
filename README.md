<div align="center">

# ⏱️ YouTube Upload Date & Time

### See the *exact* moment any YouTube video was uploaded — in any timezone.

A tiny, lightning-fast Brave / Chrome extension that reads the real upload timestamp
straight from the page and lets you view it anywhere on Earth.

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![No Tracking](https://img.shields.io/badge/No-Tracking-ff0033?style=for-the-badge&logo=shield&logoColor=white)](#-privacy)

<br />

<img src="https://img.shields.io/badge/works_on-Brave_|_Chrome_|_Edge-ff6b00?style=flat-square" alt="Browsers" />
<img src="https://img.shields.io/badge/extension_size-~12_KB-9cf?style=flat-square" alt="Size" />
<img src="https://img.shields.io/badge/build_step-none-success?style=flat-square" alt="No build" />

</div>

---

## 🎬 Why

YouTube shows "**2 years ago**", "**3 weeks ago**", or at best "**Jan 15, 2024**" under a video.
It never shows the **exact time** — and it never lets you see that moment in another timezone.

This extension fixes that. One click, and you get:

> **Mon, Jan 15, 2024, 18:30:00 GMT**

Or the same instant as:

> **Tue, Jan 16, 2024, 00:00:00 IST**
> **Tue, Jan 16, 2024, 03:30:00 JST**
> **Mon, Jan 15, 2024, 10:30:00 PST**

Same moment. Your choice of zone. Always exact.

---

## ✨ Features

| | |
|---|---|
| 📅 **Exact upload timestamp** | Pulled from YouTube's own `ytInitialPlayerResponse.videoDetails.uploadDate` — the same field YouTube uses internally. |
| 🌍 **Any timezone** | ~45 IANA zones grouped by region, plus **Local (auto)** and **UTC**. Switch instantly, no reload. |
| 💾 **Remembers your choice** | Saved with `chrome.storage.local`, restored next time you open the popup. |
| 🎬 **Video context** | Title, channel, duration, and live-stream status shown alongside the date. |
| 📋 **One-click copy** | Copy the raw ISO 8601 timestamp to your clipboard. |
| 🔗 **Open in new tab** | Jump to the video without losing the popup. |
| ⚡ **Instant** | No network calls. No background workers. No build step. ~12 KB total. |
| 🔒 **Private** | Runs only on the page you're already on. Zero telemetry. |

---

## 📸 Preview

> _Add a screenshot here once you take one._

```
┌──────────────────────────────────────────┐
│  ●  Upload date                    ↻     │
├──────────────────────────────────────────┤
│  TIMEZONE  [ India (IST)            ▾ ]  │
├──────────────────────────────────────────┤
│  UPLOADED                                │
│  Tue, Jan 16, 2024, 00:00:00  [ IST ]    │
│                                          │
│  RAW TIMESTAMP                           │
│  2024-01-15T10:30:00-08:00               │
│                                          │
│  TITLE                                   │
│  How I Built This In One Weekend         │
│                                          │
│  CHANNEL                                 │
│  Some Creator                            │
│                                          │
│  DURATION                                │
│  14:32                                   │
│                                          │
│  [ Copy timestamp ]  [ Open video ]      │
└──────────────────────────────────────────┘
```

---

## 🚀 Install

### Option 1 — Manual (recommended for now)

1. **Clone the repo**
   ```bash
   git clone https://github.com/<your-username>/youtube-upload-time.git
   cd youtube-upload-time
   ```

2. **Open your browser's extension page**
   - Brave → `brave://extensions`
   - Chrome → `chrome://extensions`
   - Edge → `edge://extensions`

3. **Turn on Developer Mode** (top-right toggle)

4. **Click Load unpacked** and select the folder you cloned
   > ⚠️ Select the **folder** that contains `manifest.json` — not a subfolder, not a zip.

5. **Pin the extension** to your toolbar for easy access.

That's it. No build step, no dependencies, no `npm install`.

### Option 2 — From a release

1. Go to the [Releases](../../releases) page.
2. Download the latest `youtube-upload-time.zip`.
3. **Unzip it** first.
4. Follow steps 2–5 above, pointing Load unpacked at the unzipped folder.

---

## 🧭 Usage

1. Open any YouTube video (`youtube.com/watch?v=...`).
2. Click the extension icon in your toolbar.
3. The popup shows the exact upload moment in your selected timezone.
4. Change the **Timezone** dropdown — the time updates instantly, no reload.

### Example

| Your timezone | You'll see |
|---|---|
| 🌐 UTC | `Mon, Jan 15, 2024, 18:30:00 GMT` |
| 🇺🇸 Los Angeles | `Mon, Jan 15, 2024, 10:30:00 PST` |
| 🇬🇧 London | `Mon, Jan 15, 2024, 18:30:00 GMT` |
| 🇮🇳 India | `Tue, Jan 16, 2024, 00:00:00 IST` |
| 🇯🇵 Tokyo | `Tue, Jan 16, 2024, 03:30:00 JST` |

---

## 📂 Project structure

```
youtube-upload-time/
├── manifest.json    # Manifest V3 config
├── popup.html       # Popup markup
├── popup.css        # Popup styles (dark theme, matches YouTube)
├── popup.js         # Extractor + Intl.DateTimeFormat formatting
├── .gitignore
└── README.md
```

Four files. That's the whole extension.

---

## 🛠️ How it works

```text
┌────────────────┐   click icon    ┌──────────────────┐
│  YouTube tab   │ ───────────────▶│  Extension popup │
│  (watch page)  │                 │   popup.js       │
└────────┬───────┘                 └────────┬─────────┘
         │                                  │
         │   chrome.scripting.executeScript │
         │◀─────────────────────────────────┘
         │
         │   reads ytInitialPlayerResponse
         │   .videoDetails.uploadDate
         ▼
   "2024-01-15T10:30:00-08:00"
         │
         │   Intl.DateTimeFormat(zone)
         ▼
   "Tue, Jan 16, 2024, 00:00:00 IST"
```

1. **Popup opens** → asks Chrome for the active tab.
2. **Injected function** runs inside the YouTube page (not a content script — it's on-demand).
3. **Extraction** tries three sources in order:
   - `window.ytInitialPlayerResponse.videoDetails.uploadDate` ← primary, has full time
   - `<meta itemprop="uploadDate">` ← fallback
   - Visible `#info-strings` text ← last resort, date only
4. **Formatting** uses `Intl.DateTimeFormat` with your selected `timeZone`. Since the ISO string is absolute, the same instant renders differently per zone — no math, no libraries.
5. **Persistence** — your zone choice is stored via `chrome.storage.local`.

---

## 🔒 Privacy

- **No network requests.** The extension never talks to any server.
- **No analytics, no telemetry, no tracking.**
- **`activeTab` only.** It can only read the tab you explicitly click the icon on.
- **`scripting` only** to read the current page's own JS variables.
- **`storage` only** to remember your timezone choice.

Nothing leaves your browser. Ever.

---

## ⚠️ Caveats

- YouTube exposes a **date-only** `uploadDate` for some older videos — no time component exists. The popup shows a small warning when that happens.
- `uploadDate` = when the video was **first published**, not when it was recorded or last edited.
- Only works on `youtube.com/watch?v=...` pages. Other YouTube pages will show a "doesn't look like a video page" message.
- The zone list is curated, not exhaustive. If you need a specific IANA zone that's missing, open an issue or edit the `<optgroup>` block in `popup.html` — the JS handles any valid zone name.

---

## 🧑‍💻 Development

Edit any file → go to `brave://extensions` → click the **↻** reload icon on the extension card. Changes apply instantly.

**No build tools. No bundler. No TypeScript. No framework.**

To package for distribution:

```bash
zip -r youtube-upload-time.zip youtube-upload-time/ \
  -x "*.git*" -x "*.DS_Store"
```

---

## 🗺️ Roadmap

- [ ] Searchable timezone picker (type any IANA zone)
- [ ] 12-hour / 24-hour toggle
- [ ] Relative time ("2 years, 3 months ago") alongside the absolute date
- [ ] Custom icons
- [ ] Keyboard shortcut to open the popup
- [ ] Firefox port

PRs welcome on any of these.

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feature/my-thing`)
3. Commit your changes (`git commit -m 'Add my thing'`)
4. Push (`git push origin feature/my-thing`)
5. Open a Pull Request

For major changes, please open an issue first.

---

## 📄 License

MIT © you — see [LICENSE](LICENSE) for details.

Do whatever you want. No warranty.

---

<div align="center">

**If this saved you a click, drop a ⭐ on the repo.**

Made with ☕ and too much curiosity about when things were uploaded.

</div>
