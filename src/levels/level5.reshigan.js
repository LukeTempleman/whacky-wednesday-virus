// LEVEL 5 - RESHIGAN - "Core Override" : two-phase final boss. NO TYPING anywhere.
import { sfx } from "../audio.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FIGHT_TIME = 99;   // seconds for the whole boss fight; timeout -> restart

// Phase A target commands (3-4 tokens each). 5 of them -> 100% to 0% integrity.
const COMMANDS = [
  ["kill", "-9", "wwv"],
  ["purge", "virus", "payload"],
  ["rm", "-rf", "wwv", "core"],
  ["flush", "dns", "cache"],
  ["override", "core", "lockdown"]
];
const DECOY_TOKENS = ["sudo", "ping", "0xFF", "nop", "echo", "grep", "halt", "tmp"];
const SOFT_TIMER = 12000;   // per-command soft timeout
const LOCKOUT = 2000;       // wrong-token lockout

// 8x8 pixel boss sprite
const SPRITE = [
  "..cmmc..",
  ".mmmmmm.",
  "mmrmmrmm",
  "mmrmmrmm",
  "mmmmmmmm",
  "mm.mm.mm",
  "m.mmmm.m",
  ".m.mm.m."
];
const SPRITE_COLORS = {
  m: "var(--neon-magenta)", c: "var(--neon-cyan)", r: "var(--neon-red)", ".": "transparent"
};

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export default function createLevel(root, { onComplete, onFail, hud }) {
  let over = false;
  let integrity = 100;
  let commandsDone = 0;
  let combo = 0;
  let phase = "A";
  let timeLeft = FIGHT_TIME;
  let fightTimerId = null;
  const timers = new Set();

  function track(id) { timers.add(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers.clear(); }

  // --- boss frame ---
  const bossWrap = document.createElement("div");
  bossWrap.className = "boss-wrap";

  const sprite = document.createElement("div");
  sprite.className = "boss-sprite";
  SPRITE.forEach(rowStr => {
    for (const ch of rowStr) {
      const cell = document.createElement("span");
      cell.style.background = SPRITE_COLORS[ch] || "transparent";
      sprite.appendChild(cell);
    }
  });

  const barWrap = document.createElement("div");
  barWrap.className = "integrity-wrap";
  const barFill = document.createElement("div");
  barFill.className = "integrity-fill";
  const barLabel = document.createElement("div");
  barLabel.className = "integrity-label";
  barWrap.append(barFill, barLabel);

  bossWrap.append(sprite, barWrap);
  root.appendChild(bossWrap);

  // dynamic phase area
  const area = document.createElement("div");
  area.className = "level-stage";
  area.style.padding = "0";
  root.appendChild(area);

  function renderBar() {
    barFill.style.width = integrity + "%";
    barLabel.textContent = "CORE INTEGRITY " + integrity + "%";
  }

  function syncHud() {
    const stats = [
      { label: "Core", value: integrity + "%" },
      { label: "Phase", value: phase },
      { label: "Time", value: timeLeft + "s", cls: timeLeft <= 15 ? "hud-timer low" : "hud-timer" }
    ];
    if (phase === "A") stats.splice(2, 0, { label: "Combo", value: "x" + combo });
    hud.setStats(stats);
  }

  function bossHurt() {
    if (reduced) return;
    sprite.classList.add("hurt");
    track(setTimeout(() => sprite.classList.remove("hurt"), 420));
  }

  /* =========================================================
     PHASE A - Command Injection (tap-to-assemble)
     ========================================================= */
  let cmd = [];          // current correct token list
  let assembled = 0;     // how many tokens placed correctly
  let locked = false;
  let softId = null;

  const targetEl = document.createElement("div");
  targetEl.className = "target-cmd";
  const assemblyRow = document.createElement("div");
  assemblyRow.className = "assembly-row";
  const tray = document.createElement("div");
  tray.className = "token-tray";

  function buildPhaseA() {
    area.textContent = "";
    const lbl = document.createElement("div");
    lbl.className = "panel-tag";
    lbl.textContent = "// ASSEMBLE THE INJECTION COMMAND //";
    area.append(lbl, targetEl, assemblyRow, tray);
    loadCommand();
  }

  function loadCommand() {
    if (over) return;
    locked = false;
    assembled = 0;
    cmd = COMMANDS[commandsDone].slice();
    targetEl.textContent = cmd.join(" ");
    assemblyRow.classList.remove("locked");
    assemblyRow.textContent = "";

    // tray = correct tokens + 3 decoys, shuffled
    const decoys = shuffle(DECOY_TOKENS.filter(d => !cmd.includes(d))).slice(0, 3);
    const trayTokens = shuffle([...cmd, ...decoys]);
    tray.textContent = "";
    trayTokens.forEach(tok => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "token";
      b.textContent = tok;
      b.dataset.tok = tok;
      b.addEventListener("pointerdown", e => { e.preventDefault(); onToken(b, tok); });
      tray.appendChild(b);
    });

    hud.setObjective("Tap tokens in order to assemble: " + cmd.join(" "));
    if (softId) clearTimeout(softId);
    softId = track(setTimeout(onSoftTimeout, SOFT_TIMER));
  }

  function onSoftTimeout() {
    if (over || phase !== "A") return;
    combo = 0;
    syncHud();
    hud.setObjective("Command timed out. Fresh command incoming...");
    loadCommand();
  }

  function onToken(btn, tok) {
    if (over || locked || phase !== "A") return;
    if (btn.classList.contains("used")) return;

    if (tok === cmd[assembled]) {
      btn.classList.add("used");
      const slot = document.createElement("span");
      slot.className = "assembly-slot";
      slot.textContent = tok;
      assemblyRow.appendChild(slot);
      assembled++;
      sfx.click();
      if (assembled >= cmd.length) commandSuccess();
    } else {
      wrongToken(btn);
    }
  }

  function commandSuccess() {
    if (softId) clearTimeout(softId);
    commandsDone++;
    combo++;
    integrity = Math.max(0, 100 - commandsDone * 20);
    renderBar();
    syncHud();
    bossHurt();
    sfx.correct();
    locked = true;
    if (commandsDone >= 5) {
      hud.setObjective("Core integrity zero. Engaging kill-switch...");
      track(setTimeout(startPhaseB, 900));
    } else {
      hud.setObjective("Command injected. Boss counterattacks...");
      track(setTimeout(loadCommand, 850));
    }
  }

  function wrongToken(btn) {
    if (softId) clearTimeout(softId);
    locked = true;
    sfx.wrong();
    btn.classList.add("shake");
    assemblyRow.classList.add("locked");
    if (!reduced) {
      root.classList.add("shake");
      track(setTimeout(() => root.classList.remove("shake"), 300));
    }
    hud.setObjective("Injection rejected. Counter-glitch lockout...");
    track(setTimeout(() => {
      if (over) return;
      // clear assembly, restore tokens, re-arm
      assembled = 0;
      assemblyRow.textContent = "";
      assemblyRow.classList.remove("locked");
      tray.querySelectorAll(".token").forEach(t => t.classList.remove("used", "shake"));
      locked = false;
      hud.setObjective("Tap tokens in order to assemble: " + cmd.join(" "));
      softId = track(setTimeout(onSoftTimeout, SOFT_TIMER));
    }, LOCKOUT));
  }

  /* =========================================================
     PHASE B - Kill-Switch Assembly (tap 1..6 in order)
     ========================================================= */
  let nextExpected = 1;
  const fragField = document.createElement("div");
  fragField.className = "frag-field";

  function startPhaseB() {
    if (over) return;
    phase = "B";
    integrity = 0;
    renderBar();
    syncHud();
    area.textContent = "";
    const lbl = document.createElement("div");
    lbl.className = "panel-tag";
    lbl.textContent = "// KILL-SWITCH :: TAP FRAGMENTS 1 -> 6 //";
    area.append(lbl, fragField);
    hud.setObjective("Tap the key fragments in ascending order 1 to 6.");
    nextExpected = 1;
    layoutFragments();
  }

  function layoutFragments() {
    fragField.textContent = "";
    shuffle([1, 2, 3, 4, 5, 6]).forEach(val => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "frag";
      b.textContent = String(val);
      b.dataset.val = String(val);
      b.addEventListener("pointerdown", e => { e.preventDefault(); onFrag(b, val); });
      fragField.appendChild(b);
    });
  }

  function onFrag(btn, val) {
    if (over || phase !== "B") return;
    if (btn.classList.contains("done")) return;

    if (val === nextExpected) {
      btn.classList.add("done");
      sfx.correct();
      nextExpected++;
      if (nextExpected > 6) {
        hud.setObjective("KILL-SWITCH ENGAGED · VIRUS PURGED");
        track(setTimeout(finishWin, 700));
      }
    } else {
      // wrong order - reset progress and reshuffle positions
      sfx.wrong();
      nextExpected = 1;
      fragField.querySelectorAll(".frag").forEach(f => {
        f.classList.remove("done");
        f.classList.add("bad");
      });
      track(setTimeout(() => {
        if (over) return;
        layoutFragments();
      }, 360));
    }
  }

  function finishWin() {
    if (over) return;
    over = true;
    if (fightTimerId) clearInterval(fightTimerId);
    clearTimers();
    onComplete();
  }

  function finishLose() {
    if (over) return;
    over = true;
    locked = true;
    if (fightTimerId) clearInterval(fightTimerId);
    clearTimers();
    onFail();
  }

  // --- boot phase A ---
  renderBar();
  syncHud();
  fightTimerId = setInterval(() => {
    if (over) return;
    timeLeft--;
    syncHud();
    if (timeLeft <= 0) finishLose();
  }, 1000);
  buildPhaseA();

  return {
    destroy() {
      over = true;
      locked = true;
      if (fightTimerId) clearInterval(fightTimerId);
      clearTimers();
      root.classList.remove("shake");
    }
  };
}
