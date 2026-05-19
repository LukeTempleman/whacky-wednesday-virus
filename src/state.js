// Game state + localStorage persistence (key: wwv:progress).

const STORAGE_KEY = "wwv:progress";

const DEFAULTS = {
  screen: "home",
  unlockedLevel: 1,   // highest enterable level (1..5)
  clearedLevels: [],  // e.g. [1,2]
  muted: true
};

export const state = { ...DEFAULTS };

function isValidLevel(n) {
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && typeof data === "object") {
      if (isValidLevel(data.unlockedLevel)) state.unlockedLevel = data.unlockedLevel;
      if (Array.isArray(data.clearedLevels)) {
        state.clearedLevels = data.clearedLevels.filter(isValidLevel);
      }
      if (typeof data.muted === "boolean") state.muted = data.muted;
    }
  } catch (e) {
    // corrupt JSON - fall back to defaults and clear the bad value
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }
}

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlockedLevel: state.unlockedLevel,
      clearedLevels: state.clearedLevels,
      muted: state.muted
    }));
  } catch (e) {
    // storage unavailable (private mode) - game still works for this session
  }
}

export function clearLevel(n) {
  if (!isValidLevel(n)) return;
  if (!state.clearedLevels.includes(n)) state.clearedLevels.push(n);
  state.unlockedLevel = Math.max(state.unlockedLevel, Math.min(n + 1, 5));
  save();
}

export function canEnter(n) {
  return isValidLevel(n) && n <= state.unlockedLevel;
}

export function reset() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  state.unlockedLevel = DEFAULTS.unlockedLevel;
  state.clearedLevels = [];
  state.muted = DEFAULTS.muted;
}

export function setMuted(v) {
  state.muted = !!v;
  save();
}
