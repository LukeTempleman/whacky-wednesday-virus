# The Whacky Wednesday Virus

A single-page, mobile-first, hacking-themed mini-game. Clear 5 linear puzzle
levels to purge the virus and reveal a final passcode. Static site — no build
step, no backend, no login.

## Levels

| # | Codename | Puzzle |
|--:|----------|--------|
| 1 | TENDANI  | Alias Interception — tap the 4 real aliases among drifting decoys |
| 2 | SECHABA  | Firewall Bypass — Simon-style sequence memory |
| 3 | KATLEGO  | Cipher Crack — Mastermind-style code breaker |
| 4 | LUKE     | Process Purge — reflex tap-the-malware |
| 5 | RESHIGAN | Core Override — two-phase final boss |

## Run locally

No build, no dependencies. Serve the folder with any static server:

```bash
# from the project root
python3 -m http.server 8080
# then open http://localhost:8080
```

(ES modules require an HTTP origin — opening `index.html` via `file://` will
not load the modules. Use a static server.)

Develop against a 390×844 portrait viewport (browser device toolbar) or a real
phone. The layout stays playable from 360px wide up to desktop.

## Deploy to Cloudflare Pages

The site is static — **no build command, output directory = project root.**

### Option A — Dashboard (Git)

1. Push this folder to a GitHub repo.
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Framework preset: **None**. Build command: *(leave empty)*. Build output
   directory: `/`.
4. Deploy. The public URL has no login on the site.

### Option B — Wrangler CLI

```bash
npm i -g wrangler
wrangler pages deploy . --project-name whacky-wednesday-virus
```

## Fonts

Fonts (`Press Start 2P`, `VT323`) load via a Google Fonts `<link>`. For a fully
offline build, download the woff2 files into `assets/fonts/` and `@font-face`
them in `styles/main.css` instead.

## Structure

```
whacky-wednesday-virus/
├── index.html
├── styles/main.css
├── src/
│   ├── main.js              # boot, state machine, screen routing
│   ├── state.js             # state + localStorage persistence
│   ├── audio.js             # WebAudio blips + mute
│   ├── ui/screens.js        # boot/home/levelComplete/victory + fail overlay
│   ├── ui/hud.js            # shared HUD widgets
│   └── levels/              # one module per level
├── data/aliases.js          # Level 1 alias data
├── _headers                 # Cloudflare cache/security headers
└── README.md
```

Progress persists in `localStorage` under `wwv:progress`. A "Reset progress"
control on the home screen clears it.
