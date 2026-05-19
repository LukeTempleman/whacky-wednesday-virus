// Tiny WebAudio blips - no audio files. Default muted (mobile autoplay policy).
import { state } from "./state.js";

let ctx = null;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

function blip(freq, dur, type = "square", vol = 0.12) {
  if (state.muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur);
}

export const sfx = {
  click()   { blip(440, 0.06, "square", 0.08); },
  tone(f)   { blip(f, 0.3, "square", 0.1); },
  correct() { blip(660, 0.09, "square"); setTimeout(() => blip(990, 0.12, "square"), 70); },
  wrong()   { blip(150, 0.22, "sawtooth", 0.14); },
  win()     {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => blip(f, 0.18, "square", 0.12), i * 110));
  },
  // unlock the AudioContext on first user gesture
  unlock()  { const ac = ensureCtx(); if (ac && ac.state === "suspended") ac.resume(); }
};
