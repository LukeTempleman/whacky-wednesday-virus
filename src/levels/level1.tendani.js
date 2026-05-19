// LEVEL 1 - TENDANI - "Alias Interception" : tap the 4 real aliases among drifting decoys.
import { CORRECT, DECOYS, FILLER } from "../../data/aliases.js";
import { strikeDots } from "../ui/hud.js";
import { sfx } from "../audio.js";

const TOTAL_TAGS = 12;     // kept on screen at once (10-14 band)
const TIME_LIMIT = 90;     // seconds
const MAX_STRIKES = 3;
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export default function createLevel(root, { onComplete, onFail, hud }) {
  let captured = 0;
  let strikes = 0;
  let timeLeft = TIME_LIMIT;
  let over = false;

  const field = document.createElement("div");
  field.className = "tag-field";
  root.appendChild(field);

  // name pool: every decoy + filler, shuffled, drawn without replacement
  const pool = shuffle([...DECOYS, ...FILLER]);
  const tags = [];      // { name, correct, el, x, y, vx, vy, w, h, dead }

  function syncHud() {
    hud.setStats([
      { label: "Captured", value: captured + "/4" },
      { label: "Strikes", value: strikeDots(strikes, MAX_STRIKES) },
      { label: "Time", value: timeLeft + "s", cls: timeLeft <= 15 ? "hud-timer low" : "hud-timer" }
    ]);
  }

  function makeTag(name, correct) {
    const el = document.createElement("div");
    el.className = "tag";
    el.textContent = name;
    field.appendChild(el);
    const tag = { name, correct, el, x: 0, y: 0, vx: 0, vy: 0, w: 0, h: 0, dead: false };
    tag.w = el.offsetWidth;
    tag.h = el.offsetHeight;
    placeTag(tag);
    const speed = 22 + Math.random() * 24;        // px/sec - slow enough to tap
    const ang = Math.random() * Math.PI * 2;
    tag.vx = Math.cos(ang) * speed;
    tag.vy = Math.sin(ang) * speed;
    tags.push(tag);
    return tag;
  }

  function placeTag(tag) {
    const fw = field.clientWidth || 320;
    const fh = field.clientHeight || 400;
    tag.x = Math.random() * Math.max(1, fw - tag.w);
    tag.y = Math.random() * Math.max(1, fh - tag.h);
    tag.el.style.transform = `translate3d(${tag.x}px, ${tag.y}px, 0)`;
  }

  function spawnFromPool() {
    if (!pool.length) return;
    makeTag(pool.pop(), false);
  }

  // build the initial field: 4 correct always present + decoy/filler noise
  function buildField() {
    CORRECT.forEach(name => makeTag(name, true));
    while (tags.length < TOTAL_TAGS && pool.length) spawnFromPool();
  }

  // --- movement loop ---
  let rafId = null;
  let lastT = 0;

  function step(now) {
    if (over) return;
    if (!lastT) lastT = now;
    let dt = (now - lastT) / 1000;
    lastT = now;
    if (dt > 0.05) dt = 0.05;

    const fw = field.clientWidth;
    const fh = field.clientHeight;

    for (const tag of tags) {
      if (tag.dead) continue;
      tag.x += tag.vx * dt;
      tag.y += tag.vy * dt;
      const maxX = Math.max(0, fw - tag.w);
      const maxY = Math.max(0, fh - tag.h);
      if (tag.x <= 0)    { tag.x = 0;    tag.vx = Math.abs(tag.vx); }
      if (tag.x >= maxX) { tag.x = maxX; tag.vx = -Math.abs(tag.vx); }
      if (tag.y <= 0)    { tag.y = 0;    tag.vy = Math.abs(tag.vy); }
      if (tag.y >= maxY) { tag.y = maxY; tag.vy = -Math.abs(tag.vy); }
      tag.el.style.transform = `translate3d(${tag.x}px, ${tag.y}px, 0)`;
    }
    rafId = requestAnimationFrame(step);
  }

  // --- input ---
  function onPointerDown(e) {
    if (over) return;
    const el = e.target.closest(".tag");
    if (!el) return;
    const tag = tags.find(t => t.el === el && !t.dead);
    if (!tag) return;
    e.preventDefault();

    if (tag.correct) {
      tag.dead = true;
      captured++;
      sfx.correct();
      tag.el.style.setProperty("--tf", `translate3d(${tag.x}px, ${tag.y}px, 0)`);
      tag.el.classList.add("hit-correct");
      const dead = tag.el;
      setTimeout(() => dead.remove(), 320);
      const idx = tags.indexOf(tag);
      if (idx > -1) tags.splice(idx, 1);
      spawnFromPool();                     // keep the field populated
      syncHud();
      if (captured >= CORRECT.length) finish(true);
    } else {
      strikes++;
      sfx.wrong();
      tag.el.classList.add("hit-wrong");
      setTimeout(() => tag.el.classList.remove("hit-wrong"), 300);
      if (!reduced) {
        root.classList.add("shake");
        setTimeout(() => root.classList.remove("shake"), 300);
      }
      syncHud();
      if (strikes >= MAX_STRIKES) finish(false);
    }
  }

  // --- timer ---
  const timerId = setInterval(() => {
    if (over) return;
    timeLeft--;
    syncHud();
    if (timeLeft <= 0) finish(false);
  }, 1000);

  function finish(won) {
    if (over) return;
    over = true;
    if (rafId) cancelAnimationFrame(rafId);
    clearInterval(timerId);
    field.removeEventListener("pointerdown", onPointerDown);
    if (won) onComplete();
    else onFail();
  }

  function onResize() {
    const fw = field.clientWidth, fh = field.clientHeight;
    for (const tag of tags) {
      tag.x = Math.min(tag.x, Math.max(0, fw - tag.w));
      tag.y = Math.min(tag.y, Math.max(0, fh - tag.h));
    }
  }

  // boot the level
  buildField();
  syncHud();
  field.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("resize", onResize);
  rafId = requestAnimationFrame(step);

  return {
    destroy() {
      over = true;
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(timerId);
      field.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
    }
  };
}
