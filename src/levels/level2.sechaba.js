// LEVEL 2 - SECHABA - "Firewall Bypass" : mirror the auth sequence (Simon-style).
import { strikeDots } from "../ui/hud.js";
import { sfx } from "../audio.js";

const COLORS = ["#c6ff00", "#22d3ee", "#c026ff", "#ffb020", "#39ff7a", "#ff3b54"];
const TONES  = [392, 523, 659, 784, 880, 330];
const MAX_STRIKES = 3;
const WIN_LENGTH = 6;          // completing a round of length 6 wins
const START_LENGTH = 3;

export default function createLevel(root, { onComplete, onFail, hud }) {
  let round = 1;                       // length = round + 2  (3..6)
  let strikes = 0;
  let inputIndex = 0;
  let locked = true;
  let over = false;
  const sequence = [];
  const timers = new Set();

  function after(ms, fn) {
    const id = setTimeout(() => { timers.delete(id); if (!over) fn(); }, ms);
    timers.add(id);
    return id;
  }
  function clearTimers() { timers.forEach(clearTimeout); timers.clear(); }

  const seqLength = () => round + 2;

  function syncHud() {
    hud.setStats([
      { label: "Round", value: String(round) },
      { label: "Length", value: String(seqLength()) },
      { label: "Strikes", value: strikeDots(strikes, MAX_STRIKES) }
    ]);
  }

  // layout
  const wrap = document.createElement("div");
  wrap.className = "simon-grid";
  const nodes = [];
  for (let i = 0; i < 6; i++) {
    const node = document.createElement("button");
    node.className = "node";
    node.type = "button";
    node.style.setProperty("--c", COLORS[i]);
    node.addEventListener("pointerdown", e => { e.preventDefault(); onNodeTap(i); });
    nodes.push(node);
    wrap.appendChild(node);
  }

  const controls = document.createElement("div");
  controls.className = "actions";
  const replayBtn = document.createElement("button");
  replayBtn.type = "button";
  replayBtn.className = "btn-cyan";
  replayBtn.textContent = "REPLAY SEQUENCE";
  replayBtn.addEventListener("click", () => { if (!locked && !over) playback(); });
  controls.appendChild(replayBtn);

  root.appendChild(wrap);
  root.appendChild(document.createElement("div")).className = "spacer";
  root.appendChild(controls);

  function flash(i, dur) {
    nodes[i].classList.add("lit");
    sfx.tone(TONES[i]);
    after(dur, () => nodes[i].classList.remove("lit"));
  }

  function playback() {
    locked = true;
    inputIndex = 0;
    clearTimers();
    nodes.forEach(n => n.classList.remove("lit"));
    const lit = 440, gap = 200;
    sequence.forEach((nodeIdx, k) => {
      after(600 + k * (lit + gap), () => flash(nodeIdx, lit));
    });
    after(600 + sequence.length * (lit + gap), () => {
      locked = false;
      hud.setObjective("Repeat the sequence.");
    });
  }

  function startRound() {
    // extend the running sequence to the required length
    if (sequence.length === 0) {
      for (let i = 0; i < START_LENGTH; i++) sequence.push(rand());
    } else {
      while (sequence.length < seqLength()) sequence.push(rand());
    }
    syncHud();
    hud.setObjective("Watch the auth sequence...");
    playback();
  }

  function rand() { return Math.floor(Math.random() * 6); }

  function onNodeTap(i) {
    if (locked || over) return;
    flash(i, 220);

    if (sequence[inputIndex] === i) {
      inputIndex++;
      if (inputIndex >= sequence.length) {
        // round cleared
        locked = true;
        if (sequence.length >= WIN_LENGTH) { finish(true); return; }
        sfx.correct();
        round++;
        after(700, startRound);
      }
    } else {
      // wrong tap
      strikes++;
      sfx.wrong();
      syncHud();
      if (strikes >= MAX_STRIKES) { finish(false); return; }
      locked = true;
      hud.setObjective("Wrong. Replaying sequence...");
      after(700, playback);
    }
  }

  function finish(won) {
    if (over) return;
    over = true;
    locked = true;
    clearTimers();
    if (won) onComplete();
    else onFail();
  }

  syncHud();
  startRound();

  return {
    destroy() {
      over = true;
      locked = true;
      clearTimers();
    }
  };
}
