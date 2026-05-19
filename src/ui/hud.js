// Shared HUD: codename + objective pinned top, settable stat chips, Abort button.

export function strikeDots(used, max) {
  let s = "";
  for (let i = 0; i < max; i++) s += i < used ? "●" : "○";
  return s;
}

export function createHUD({ codename, objective, onAbort }) {
  const el = document.createElement("div");
  el.className = "hud";

  const row = document.createElement("div");
  row.className = "hud-row";
  const codeEl = document.createElement("span");
  codeEl.className = "hud-codename";
  codeEl.textContent = codename;
  const abortBtn = document.createElement("button");
  abortBtn.className = "btn-abort";
  abortBtn.type = "button";
  abortBtn.textContent = "ABORT";
  row.append(codeEl, abortBtn);

  const objEl = document.createElement("div");
  objEl.className = "hud-objective";
  objEl.textContent = objective;

  const statsEl = document.createElement("div");
  statsEl.className = "hud-stats";

  el.append(row, objEl, statsEl);

  const onAbortClick = () => onAbort();
  abortBtn.addEventListener("click", onAbortClick);

  function setObjective(text) { objEl.textContent = text; }

  // items: [{ label, value, cls? }]
  function setStats(items) {
    statsEl.textContent = "";
    for (const it of items) {
      const chip = document.createElement("span");
      chip.className = "hud-stat" + (it.cls ? " " + it.cls : "");
      const k = document.createElement("span");
      k.className = "k";
      k.textContent = it.label + " ";
      const v = document.createElement("span");
      v.className = "v";
      v.textContent = it.value;
      chip.append(k, v);
      statsEl.appendChild(chip);
    }
  }

  return {
    el,
    setObjective,
    setStats,
    destroy() { abortBtn.removeEventListener("click", onAbortClick); }
  };
}
