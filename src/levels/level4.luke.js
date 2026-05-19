// LEVEL 4 - LUKE - "Process Purge" : kill malware, never kill a system process.
import { strikeDots } from "../ui/hud.js";
import { sfx } from "../audio.js";

const COLS = 3, ROWS = 4, CELLS = COLS * ROWS;
const WIN_SCORE = 15;
const MAX_STRIKES = 3;
const MAX_LEAKS = 6;
const SYSTEM_NAMES = ["sysd", "kernel", "netd", "initd", "cron"];
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function createLevel(root, { onComplete, onFail, hud }) {
  let score = 0, strikes = 0, leaks = 0, elapsed = 0;
  let over = false;
  const timers = new Set();

  function track(id) { timers.add(id); return id; }
  function clearAll() { timers.forEach(clearTimeout); timers.forEach(clearInterval); timers.clear(); }

  function syncHud() {
    hud.setStats([
      { label: "Purged", value: score + "/" + WIN_SCORE },
      { label: "Strikes", value: strikeDots(strikes, MAX_STRIKES) },
      { label: "Leaks", value: leaks + "/" + MAX_LEAKS },
      { label: "Time", value: elapsed + "s" }
    ]);
  }

  // --- grid ---
  const grid = document.createElement("div");
  grid.className = "term-grid";
  const cells = [];
  for (let i = 0; i < CELLS; i++) {
    const el = document.createElement("div");
    el.className = "cell";
    el.addEventListener("pointerdown", e => { e.preventDefault(); onCellTap(i); });
    cells.push({ el, proc: null });
    grid.appendChild(el);
  }
  root.appendChild(grid);

  function fillCell(idx, type) {
    const cell = cells[idx];
    const el = cell.el;
    el.classList.add(type === "malware" ? "proc-malware" : "proc-system");
    const glyph = document.createElement("div");
    glyph.className = "glyph";
    const label = document.createElement("div");
    label.className = "pid";
    if (type === "malware") {
      glyph.textContent = "☠";
      label.textContent = (3000 + Math.floor(Math.random() * 6999)) + " wwv";
    } else {
      glyph.textContent = "▣";
      label.textContent = SYSTEM_NAMES[Math.floor(Math.random() * SYSTEM_NAMES.length)];
    }
    el.append(glyph, label);

    const life = 1000 + Math.random() * 800;
    const vanishId = track(setTimeout(() => expire(idx), life));
    cell.proc = { type, vanishId, tapped: false };
  }

  function emptyCell(idx) {
    const cell = cells[idx];
    cell.el.className = "cell";
    cell.el.textContent = "";
    cell.proc = null;
  }

  function expire(idx) {
    const cell = cells[idx];
    if (!cell.proc || over) return;
    if (cell.proc.type === "malware") {
      leaks++;
      syncHud();
      if (leaks >= MAX_LEAKS) { finish(false); return; }
    }
    emptyCell(idx);
  }

  function onCellTap(idx) {
    if (over) return;
    const cell = cells[idx];
    if (!cell.proc || cell.proc.tapped) return;
    cell.proc.tapped = true;
    clearTimeout(cell.proc.vanishId);

    if (cell.proc.type === "malware") {
      score++;
      sfx.correct();
      cell.el.classList.add("killed");
      track(setTimeout(() => emptyCell(idx), reduced ? 0 : 200));
      syncHud();
      if (score >= WIN_SCORE) { finish(true); return; }
    } else {
      strikes++;
      sfx.wrong();
      cell.el.classList.add("hit-wrong");
      track(setTimeout(() => emptyCell(idx), 160));
      syncHud();
      if (strikes >= MAX_STRIKES) { finish(false); return; }
    }
  }

  // --- spawn loop : interval ramps gently down over time ---
  function spawn() {
    if (over) return;
    const free = [];
    cells.forEach((c, i) => { if (!c.proc) free.push(i); });
    if (free.length) {
      const idx = free[Math.floor(Math.random() * free.length)];
      fillCell(idx, Math.random() < 0.64 ? "malware" : "system");
    }
    const interval = Math.max(430, 920 - elapsed * 22);
    track(setTimeout(spawn, interval));
  }

  // elapsed-time ticker
  track(setInterval(() => {
    if (over) return;
    elapsed++;
    syncHud();
  }, 1000));

  function finish(won) {
    if (over) return;
    over = true;
    clearAll();
    if (won) onComplete();
    else onFail();
  }

  hud.setObjective("Tap red malware. Never tap a green system process.");
  syncHud();
  track(setTimeout(spawn, 600));

  return {
    destroy() {
      over = true;
      clearAll();
    }
  };
}
