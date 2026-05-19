// Screen renderers: boot, home, levelComplete, victory, plus the shared fail overlay.
import { state, canEnter } from "../state.js";
import { sfx } from "../audio.js";

// The final passcode - single source of truth, rendered verbatim.
export const PASSCODE = "The force is with us at GoNXT";

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

/* ---------------- BOOT ---------------- */
export function renderBoot(root, { onDone }) {
  const screen = el("div", "screen boot-screen");
  root.appendChild(screen);

  const lines = [
    "> wwv-defense-grid v2.3 :: cold boot",
    "> power-on self test ............ [OK]",
    "> mounting /dev/core ............ [OK]",
    "> loading kernel modules ........ [OK]",
    "> establishing dark uplink ...... [OK]",
    "> decrypting subsystem registry . [OK]",
    "> scanning memory sectors ....... [OK]",
    "> threat scan :: SIGNATURE = WHACKY_WEDNESDAY",
    "> infection level .............. CRITICAL",
    "> 5 subsystems compromised",
    "> arming breach toolkit ......... [OK]",
    "> operative clearance .......... GRANTED",
    "> launching breach console ..."
  ];

  const STEP = 430;
  const timers = [];
  lines.forEach((text, i) => {
    timers.push(setTimeout(() => {
      const prev = screen.querySelector(".boot-line.cursor");
      if (prev) prev.classList.remove("cursor");
      const line = el("div", "boot-line cursor", text);
      screen.appendChild(line);
    }, i * STEP));
  });
  timers.push(setTimeout(onDone, lines.length * STEP + 500));

  return { destroy() { timers.forEach(clearTimeout); } };
}

/* ---------------- HOME ---------------- */
export function renderHome(root, { levels, onPlay, onSelectLevel, onReset, onToggleMute }) {
  const screen = el("div", "screen");
  root.appendChild(screen);

  // title
  const title = el("div", "title-block");
  ["THE WHACKY", "WEDNESDAY", "VIRUS"].forEach(w => {
    title.appendChild(el("div", "t-line", w));
  });
  title.appendChild(el("div", "t-sub", "// BREACH PROTOCOL //"));
  screen.appendChild(title);

  screen.appendChild(el("p", "narrative",
    "A rogue virus has infected the GoNXT systems. Breach all 5 fortified subsystems and override the core to flush it out."));

  // level map
  const map = el("div", "level-map");
  levels.forEach(def => {
    const n = def.n;
    const cleared = state.clearedLevels.includes(n);
    const unlocked = canEnter(n);
    const stateClass = cleared ? "is-cleared" : unlocked ? "is-unlocked" : "is-locked";
    const dotClass = cleared ? "cleared" : unlocked ? "unlocked" : "locked";
    const label = cleared ? "CLEARED" : unlocked ? "READY" : "LOCKED";
    const labelCls = cleared ? "green" : unlocked ? "amber" : "red";

    const btn = el("button", "panel level-panel " + stateClass);
    btn.type = "button";
    btn.disabled = !unlocked;

    const num = el("span", "lp-num", "0" + n);
    const body = el("span", "lp-body");
    body.appendChild(el("span", "lp-name", def.codename));
    body.appendChild(el("span", "lp-theme", def.theme));
    const st = el("span", "lp-state");
    st.appendChild(el("span", "status-dot " + dotClass));
    st.appendChild(el("span", labelCls, label));

    btn.append(num, body, st);
    if (unlocked) btn.addEventListener("pointerdown", () => onSelectLevel(n));
    map.appendChild(btn);
  });
  screen.appendChild(map);

  screen.appendChild(el("div", "spacer"));

  // actions
  const hasProgress = state.clearedLevels.length > 0;
  const actions = el("div", "actions");

  const playBtn = el("button", "btn-primary", hasProgress ? "CONTINUE" : "START");
  playBtn.type = "button";
  playBtn.addEventListener("click", onPlay);

  const secondary = el("div", "btn-row");
  const muteBtn = el("button", "btn-ghost", state.muted ? "SOUND: OFF" : "SOUND: ON");
  muteBtn.type = "button";
  muteBtn.addEventListener("click", () => {
    onToggleMute();
    muteBtn.textContent = state.muted ? "SOUND: OFF" : "SOUND: ON";
  });
  const resetBtn = el("button", "btn-ghost", "RESET PROGRESS");
  resetBtn.type = "button";
  resetBtn.addEventListener("click", onReset);
  secondary.append(muteBtn, resetBtn);

  actions.append(playBtn, secondary);
  screen.appendChild(actions);
}

/* ---------------- LEVEL COMPLETE ---------------- */
export function renderLevelComplete(root, { codename, isLast, onContinue }) {
  const screen = el("div", "screen");
  root.appendChild(screen);
  screen.appendChild(el("div", "spacer"));

  const panel = el("div", "panel");
  panel.style.borderLeftColor = "var(--neon-green)";
  panel.style.textAlign = "center";
  panel.appendChild(el("div", "panel-tag", "// SUBSYSTEM BREACHED //"));
  const h = el("h2", "ui green", codename);
  h.style.marginTop = "12px";
  panel.appendChild(h);
  panel.appendChild(el("p", "narrative", isLast
    ? "Final subsystem down. Core exposed."
    : "Subsystem breached. Next subsystem unlocked."));
  screen.appendChild(panel);

  screen.appendChild(el("div", "spacer"));

  const actions = el("div", "actions");
  const cont = el("button", "btn-primary", "CONTINUE");
  cont.type = "button";
  cont.addEventListener("click", onContinue);
  actions.appendChild(cont);
  screen.appendChild(actions);
}

/* ---------------- VICTORY ---------------- */
export function renderVictory(root, { onPlayAgain }) {
  const screen = el("div", "screen");
  root.appendChild(screen);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const stage = el("div", "panel");
  stage.style.textAlign = "center";
  screen.appendChild(stage);

  let timer = null;

  function showCard() {
    sfx.win();
    stage.textContent = "";
    stage.style.borderLeftColor = "var(--neon-green)";

    stage.appendChild(el("div", "victory-stamp", "SYSTEM CLEAN"));
    const h = el("h2", "ui lime", "MISSION COMPLETE");
    h.style.margin = "14px 0";
    stage.appendChild(h);
    stage.appendChild(el("p", "narrative",
      "You flushed The Whacky Wednesday Virus from the GoNXT systems."));

    const code = el("div", "passcode-box", PASSCODE);
    code.style.margin = "16px 0";
    stage.appendChild(code);

    stage.appendChild(el("p", "muted center", "PASSCODE"));

    const toast = el("div", "toast", "");
    const copyBtn = el("button", "btn-primary", "COPY PASSCODE");
    copyBtn.type = "button";
    copyBtn.style.marginTop = "8px";
    copyBtn.addEventListener("click", () => {
      copyText(PASSCODE, () => {
        toast.textContent = "COPIED!";
        sfx.click();
      });
    });
    stage.appendChild(copyBtn);
    stage.appendChild(toast);

    stage.appendChild(el("p", "narrative",
      "Send this passcode to the organiser to confirm you cleared all 5 levels."));

    const again = el("button", "btn-ghost", "PLAY AGAIN");
    again.type = "button";
    again.style.marginTop = "10px";
    again.addEventListener("click", onPlayAgain);
    stage.appendChild(again);
  }

  if (reduced) {
    showCard();
  } else {
    stage.appendChild(el("div", "purge-fx", "PURGING CORE PROCESS ..."));
    timer = setTimeout(showCard, 1900);
  }

  return { destroy() { if (timer) clearTimeout(timer); } };
}

function copyText(text, onOk) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onOk, () => fallbackCopy(text, onOk));
  } else {
    fallbackCopy(text, onOk);
  }
}

function fallbackCopy(text, onOk) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  try { document.execCommand("copy"); onOk(); } catch (e) {}
  document.body.removeChild(ta);
}

/* ---------------- SHARED FAIL OVERLAY ---------------- */
// Mounted over a level stage. Player retries the same level or aborts to map.
export function failOverlay(stage, { codename, reason, onRetry, onAbort }) {
  const ov = el("div", "overlay-panel");
  ov.appendChild(el("div", "panel-tag", "// BREACH FAILED //"));
  ov.appendChild(el("h2", "big-status red", codename + " HELD"));
  if (reason) ov.appendChild(el("p", "narrative", reason));

  const retry = el("button", "btn-primary", "TRY AGAIN");
  retry.type = "button";
  retry.addEventListener("click", onRetry);

  const abort = el("button", "btn-ghost", "ABORT TO MAP");
  abort.type = "button";
  abort.addEventListener("click", onAbort);

  ov.append(retry, abort);
  stage.appendChild(ov);
  return ov;
}
