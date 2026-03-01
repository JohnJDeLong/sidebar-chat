# Pixel — Sidebar AI for Chrome (Gemini Nano)

Pixel is a Chrome extension that opens a side panel chat. When you ask a question, Pixel can use the **current active tab’s page text** (title + URL + truncated body text) as context.

This project is built with:
- **Chrome Side Panel**
- **Chrome built-in AI (Prompt API / Gemini Nano)** (on-device, no API keys)

---

## Features

- Side panel chat UI
- Automatically captures the active tab’s page text (when allowed)
- Includes that page context in the prompt so you can ask things like:
  - “What is this page about?”
  - “Explain what they mean by this”
  - “Summarize this page in 5 bullets”

---

## Requirements

- Google Chrome (desktop)
- Built-in AI availability depends on your Chrome version and rollout.
  - If the Prompt API returns `downloadable` or `downloading`, Chrome still needs to download the on-device model.
  - Some pages cannot be read by extensions (e.g. `chrome://` pages and the Chrome Web Store).

---

## Install (Developer Mode)

1. Open Chrome and go to: `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this project folder
5. (Optional) Pin the extension icon from the puzzle piece menu

Click the Pixel icon to open the side panel.

---

## How it Works (High Level)

- `service_worker.js` watches the active tab:
  - On tab switch / page load it captures:
    - `document.title`
    - `location.href`
    - `document.body.innerText` (truncated)
  - Stores this as the “latest context”
- `sidepanel.js`:
  - asks the service worker for the latest context
  - builds a prompt that includes the page context
  - calls the Prompt API (`LanguageModel`) to get a response from Gemini Nano

---

## Troubleshooting

### “Gemini Nano not available (availability = downloadable/downloading)”
Chrome needs to download the on-device model.
- Keep Chrome open
- Try again after a bit
- Make sure you have enough free disk space

### “No readable page text”
Some pages are restricted or blocked:
- `chrome://...` pages
- Chrome Web Store pages
- Some sites with special rendering

Try testing on a normal page (Wikipedia/news article).

---

## Project Structure

- `manifest.json` — extension configuration + permissions
- `service_worker.js` — captures tab context + opens side panel
- `sidepanel.html` — side panel UI
- `sidepanel.css` — styling
- `sidepanel.js` — chat logic + Prompt API calls
- `icons/` — extension icons

---

## License

MIT (or choose your preferred license)