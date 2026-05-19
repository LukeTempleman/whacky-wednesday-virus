// LEVEL 3 - KATLEGO - "Cipher Crack" : Mastermind-style 4-symbol code breaker.
import { sfx } from "../audio.js";

const GLYPHS = ["0", "1", "2", "3", "4", "5"];
const CODE_LEN = 4;
const MAX_ATTEMPTS = 8;

export default function createLevel(root, { onComplete, onFail, hud }) {
  let over = false;
  let attempts = 0;
  const secret = Array.from({ length: CODE_LEN }, () => Math.floor(Math.random() * 6));
  let guess = [];

  function syncHud() {
    hud.setStats([
      { label: "Attempts left", value: (MAX_ATTEMPTS - attempts) + "/" + MAX_ATTEMPTS }
    ]);
  }

  // --- layout ---
  const log = document.createElement("div");
  log.className = "cipher-log";
  const logHint = document.createElement("div");
  logHint.className = "muted center";
  logHint.style.fontSize = "16px";
  logHint.textContent = "// 4-symbol cipher :: pegs leak how close you are //";
  log.appendChild(logHint);

  const slotsRow = document.createElement("div");
  slotsRow.className = "cipher-slots";
  const slots = [];
  for (let i = 0; i < CODE_LEN; i++) {
    const s = document.createElement("div");
    s.className = "slot";
    slots.push(s);
    slotsRow.appendChild(s);
  }

  const palette = document.createElement("div");
  palette.className = "glyph-palette";
  GLYPHS.forEach((g, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "glyph-btn";
    b.textContent = g;
    b.addEventListener("pointerdown", e => { e.preventDefault(); addGlyph(i); });
    palette.appendChild(b);
  });

  const ctrlRow = document.createElement("div");
  ctrlRow.className = "btn-row";
  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "btn-ghost";
  clearBtn.textContent = "CLEAR";
  clearBtn.addEventListener("click", () => { if (!over) { guess = []; renderSlots(); } });
  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.className = "btn-primary";
  submitBtn.textContent = "SUBMIT";
  submitBtn.addEventListener("click", submitGuess);
  ctrlRow.append(clearBtn, submitBtn);

  root.append(log, slotsRow, palette, ctrlRow);

  function renderSlots() {
    slots.forEach((s, i) => {
      const filled = i < guess.length;
      s.textContent = filled ? GLYPHS[guess[i]] : "";
      s.classList.toggle("filled", filled);
    });
    submitBtn.disabled = guess.length !== CODE_LEN;
  }

  function addGlyph(i) {
    if (over || guess.length >= CODE_LEN) return;
    guess.push(i);
    sfx.click();
    renderSlots();
  }

  // Mastermind scoring: greens = right glyph+position, ambers = right glyph wrong
  // position with no double-counting.
  function score(g) {
    let green = 0;
    const sLeft = [], gLeft = [];
    for (let i = 0; i < CODE_LEN; i++) {
      if (g[i] === secret[i]) green++;
      else { sLeft.push(secret[i]); gLeft.push(g[i]); }
    }
    let amber = 0;
    for (let v = 0; v < 6; v++) {
      const sc = sLeft.filter(x => x === v).length;
      const gc = gLeft.filter(x => x === v).length;
      amber += Math.min(sc, gc);
    }
    return { green, amber };
  }

  function addLogRow(g, res) {
    const row = document.createElement("div");
    row.className = "cipher-row";
    const gEl = document.createElement("span");
    gEl.className = "guess";
    g.forEach(v => {
      const c = document.createElement("span");
      c.textContent = GLYPHS[v];
      gEl.appendChild(c);
    });
    const pegs = document.createElement("span");
    pegs.className = "pegs";
    for (let i = 0; i < CODE_LEN; i++) {
      const p = document.createElement("span");
      p.className = "peg";
      if (i < res.green) p.classList.add("green");
      else if (i < res.green + res.amber) p.classList.add("amber");
      pegs.appendChild(p);
    }
    row.append(gEl, pegs);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function submitGuess() {
    if (over || guess.length !== CODE_LEN) return;
    const res = score(guess);
    attempts++;
    addLogRow(guess.slice(), res);
    syncHud();

    if (res.green === CODE_LEN) {
      sfx.correct();
      finish(true);
    } else if (attempts >= MAX_ATTEMPTS) {
      sfx.wrong();
      finish(false);
    } else {
      sfx.wrong();
      guess = [];
      renderSlots();
    }
  }

  function finish(won) {
    if (over) return;
    over = true;
    submitBtn.disabled = true;
    if (won) onComplete();
    else onFail();
  }

  hud.setObjective("Tap glyphs to build a 4-symbol guess, then submit.");
  renderSlots();
  syncHud();

  return { destroy() { over = true; } };
}
