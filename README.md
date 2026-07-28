# Devora

A collection of fast, free, in-browser developer tools. No sign-up, no uploads to a server — everything runs locally in your browser.

**Live demo:** https://marvelcollin.github.io/Devora/

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-222?logo=githubpages&logoColor=white)

## Tools

| Tool | What it does |
| --- | --- |
| Image Compressor | Shrink images (batch supported) right in the browser |
| QR Generator | Turn any text or URL into a downloadable QR code |
| JSON Formatter | Pretty-print, minify, and validate JSON |
| Base64 Encoder | Encode and decode Base64 strings |
| URL Encoder | Encode and decode URL components |
| Hash Generator | Generate hashes from any input text |
| Color Converter | Convert between HEX, RGB, HSL, and more |
| Timestamp Converter | Convert between Unix timestamps and human dates |
| Vault / ENV Converter | Convert between Vault and `.env` formats |
| Keyboard Test | Check that every key on your keyboard registers |
| Mouse Test | Test mouse buttons, clicks, and scroll |
| WiFi Speed Test | Measure your current connection speed |

## Tech Stack

- **React 19** + **TypeScript** — UI and type safety
- **Vite 7** — dev server and build
- **Tailwind CSS 4** — styling
- **jspdf**, **jszip**, **qrcode** — export and generation helpers

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
