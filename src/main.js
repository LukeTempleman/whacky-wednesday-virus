// Boot, state machine + screen routing. Always destroys the active screen/level
// before switching (kills rAF/timers/listeners - critical on mobile).
import { state, load, reset, setMuted, clearLevel, canEnter } from "./state.js";
import { renderBoot, renderHome, renderLevelComplete, renderVictory, failOverlay } from "./ui/screens.js";
import { createHUD } from "./ui/hud.js";
import { sfx, music } from "./audio.js";
import createLevel1 from "./levels/level1.tendani.js";
import createLevel2 from "./levels/level2.sechaba.js";
import createLevel3 from "./levels/level3.katlego.js";
import createLevel4 from "./levels/level4.luke.js";
import createLevel5 from "./levels/level5.reshigan.js";

const LEVELS = {
  1: { factory: createLevel1, codename: "TENDANI",  theme: "Alias Interception", objective: "Tag the 4 real infiltrator aliases.", fail: "The aliases slipped the net." },
  2: { factory: createLevel2, codename: "SECHABA",  theme: "Firewall Bypass",    objective: "Mirror the firewall auth sequence.", fail: "The firewall locked you out." },
  3: { factory: createLevel3, codename: "KATLEGO",  theme: "Cipher Crack",       objective: "Brute the 4-symbol root cipher.",    fail: "The cipher held. Out of attempts." },
  4: { factory: createLevel4, codename: "LUKE",     theme: "Process Purge",      objective: "Kill malware. Spare system processes.", fail: "The terminal was overrun." },
  5: { factory: createLevel5, codename: "RESHIGAN", theme: "Core Override",      objective: "Override the virus core.", fail: "The core override timed out — the virus re-secured itself." }
};

const LEVEL_LIST = [1, 2, 3, 4, 5].map(n => ({
  n, codename: LEVELS[n].codename, theme: LEVELS[n].theme
}));

const app = document.getElementById("app");
let activeCleanup = null;

function clearActive() {
  if (typeof activeCleanup === "function") {
    try { activeCleanup(); } catch (e) { /* ignore cleanup errors */ }
  }
  activeCleanup = null;
  app.textContent = "";
}

function mount(renderFn) {
  clearActive();
  const result = renderFn(app);
  if (result && typeof result.destroy === "function") {
    activeCleanup = () => result.destroy();
  }
  music.sync();
}

/* ---------------- routes ---------------- */
function goBoot() {
  state.screen = "boot";
  mount(root => renderBoot(root, { onDone: goHome }));
}

function goHome() {
  state.screen = "home";
  mount(root => {
    renderHome(root, {
      levels: LEVEL_LIST,
      onPlay: () => {
        // continue at the first uncleared level, clamped to what is unlocked
        let next = 1;
        while (next < 5 && state.clearedLevels.includes(next)) next++;
        if (!canEnter(next)) next = state.unlockedLevel;
        goLevel(next);
      },
      onSelectLevel: goLevel,
      onReset: () => { reset(); goHome(); },
      onToggleMute: () => { sfx.unlock(); setMuted(!state.muted); music.sync(); }
    });
  });
}

function goLevel(n) {
  if (!canEnter(n)) { goHome(); return; }
  sfx.unlock();
  state.screen = "level";
  const def = LEVELS[n];

  mount(root => {
    const screen = document.createElement("div");
    screen.className = "level-screen";

    const hud = createHUD({
      codename: def.codename,
      objective: def.objective,
      onAbort: goHome
    });

    const stage = document.createElement("div");
    stage.className = "level-stage";

    screen.append(hud.el, stage);
    root.appendChild(screen);

    let level = null;
    let failed = false;

    level = def.factory(stage, {
      hud,
      onComplete: () => {
        sfx.win();
        clearLevel(n);
        if (n >= 5) goVictory();
        else goLevelComplete(n);
      },
      onFail: () => {
        if (failed) return;
        failed = true;
        sfx.wrong();
        failOverlay(stage, {
          codename: def.codename,
          reason: def.fail,
          onRetry: () => goLevel(n),
          onAbort: goHome
        });
      }
    });

    return {
      destroy() {
        try { if (level && level.destroy) level.destroy(); } catch (e) {}
        hud.destroy();
      }
    };
  });
}

function goLevelComplete(n) {
  state.screen = "levelComplete";
  const def = LEVELS[n];
  mount(root => renderLevelComplete(root, {
    codename: def.codename,
    isLast: n >= 5,
    onContinue: goHome
  }));
}

function goVictory() {
  state.screen = "victory";
  mount(root => renderVictory(root, {
    onPlayAgain: () => { reset(); goHome(); }
  }));
}

/* ---------------- start ---------------- */
load();
music.start();
// browsers may block autoplay until a gesture - catch the first tap
window.addEventListener("pointerdown", () => { sfx.unlock(); music.start(); }, { once: true });
goBoot();
