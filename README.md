# Devora

A collection of fast, free, in-browser developer tools. No sign-up, no uploads to a server — everything runs locally in your browser.

**Live demo:** https://marvelcollin.github.io/Devora/

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-222?logo=githubpages&logoColor=white)

## Tools

38 tools in 8 groups. Press `Ctrl K` (or `⌘ K`) on any page to jump to a tool.

**Format and convert**

| Tool | What it does |
| --- | --- |
| JSON Formatter | Pretty-print, minify, and validate JSON |
| SQL Formatter | Format SQL for 20 dialects, including PostgreSQL, MySQL and SQL Server |
| Markdown Preview | Write Markdown and see it rendered live, then copy the HTML |
| CSV / JSON Converter | Turn CSV rows into JSON and JSON arrays back into CSV |
| Vault / ENV Converter | Convert between Vault JSON and `.env` lines |
| Case Converter | camelCase, snake_case, kebab-case, Title Case and more |

**Encode and decode**

| Tool | What it does |
| --- | --- |
| Base64 Encoder | Encode and decode Base64 text |
| URL Encoder | Encode and decode URL parts and read query strings |
| JWT Decoder | Read a token's header, payload, claims and expiry |
| Hash Generator | SHA-1, SHA-256, SHA-384 and SHA-512 hashes |
| Number Base Converter | Decimal, hex, binary, octal and any base up to 36 |

**Text and generators**

| Tool | What it does |
| --- | --- |
| Word Counter | Words, characters, sentences and reading time |
| Text Diff | Compare two texts by line, word or character |
| Regex Tester | Live matches, groups and replace, safe from runaway patterns |
| UUID Generator | Random v4 and time ordered v7 UUIDs, plus a UUID inspector |
| Password Generator | Strong passwords and passphrases with a strength meter |

**Time and color**

| Tool | What it does |
| --- | --- |
| Timestamp Converter | Unix timestamps to dates and back |
| Timezone Converter | One moment across many time zones, daylight saving included |
| Cron Explainer | Cron in plain words, plus the next run times |
| Color Converter | HEX, RGB and HSL with contrast checks |
| Gradients and Shadows | Build CSS gradients and box shadows, copy CSS or Tailwind |

**Images**

| Tool | What it does |
| --- | --- |
| Image Compressor | Shrink and resize images (batch supported) |
| Image Color Picker | Pick exact colors and extract a palette |
| Image to Base64 | Images to data URLs and Base64 back to images |
| Favicon Generator | favicon.ico and app icons from an image or letters |
| QR Code Generator | Single QR codes or printable batches as PDF |

**Input devices**

| Tool | What it does |
| --- | --- |
| Keyboard Test | Check that every key registers |
| Mouse Test | Test buttons, clicks, scrolling and movement |
| Gamepad Tester | Buttons, sticks, triggers and vibration |
| Touchscreen Test | Find dead zones and check multi-touch |

**Screen and sound**

| Tool | What it does |
| --- | --- |
| Screen Test | Refresh rate, resolution and a dead pixel test |
| Camera Test | Live preview, real frame rate, lighting check and supported resolutions |
| Mic Test | Input level, background noise, live spectrum and a test recording |
| Speaker Test | Left and right channels, tone generator and a frequency sweep |

**Network and system**

| Tool | What it does |
| --- | --- |
| WiFi Speed Test | Ping, jitter, download and upload speed |
| My IP and Connection | Public IP, location and connection details |
| Location Check | GPS and location permission, coordinates and accuracy |
| Battery Status | Charge level, charging state and time left (Chrome and Edge) |

## Tech Stack

- **React 19** + **TypeScript**: UI and type safety
- **Vite 8**: dev server and build
- **Tailwind CSS 4**: styling
- **jspdf**, **jszip**, **qrcode**: export and generation helpers
- **sql-formatter**, **marked**, **dompurify**, **diff**, **cronstrue**: helpers for individual tools, each loaded only when its tool opens
- **IBM Plex Sans** and **JetBrains Mono**: self-hosted fonts

## Getting Started

```bash
git clone https://github.com/MarvelCollin/devora.git
cd devora
npm install
npm run dev      # start the dev server
```

## Scripts

```bash
npm run dev      # start Vite dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run ESLint
```

## Deployment

The site is deployed to **GitHub Pages** at https://marvelcollin.github.io/Devora/ via the workflow in `.github/workflows`. Pushing to `main` rebuilds and redeploys automatically.

## License

Free to use. Contributions and suggestions are welcome — open an issue or a pull request.
