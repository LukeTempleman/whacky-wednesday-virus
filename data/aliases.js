// Level 1 - TENDANI : alias data.
// CORRECT answers are exactly these 4 (case-insensitive match, display as given).
export const CORRECT = ["Kamalu", "Tencent", "Katcheko", "Sechala"];

// Near-miss decoys - from SPEC section 6 Level 1. Do not invent extra real-word decoys.
export const DECOYS = [
  "Kamala", "Kamulu", "Kamatu", "Kamlau", "Kamali", "Kalamu", "Kamaru", "Kamula",
  "Tencet", "Tencint", "Tencentt", "Tenccnt", "Tenscent", "Tencnet", "Tentcen", "Tincent",
  "Katchecko", "Katcheka", "Ketcheko", "Katceko", "Kacheko", "Katchako", "Katcheku", "Katchejo",
  "Sechaba", "Sechela", "Sechalo", "Sachala", "Sechalla", "Sechara", "Sechula", "Seshala"
];

// Generic hacker-handle filler (extra noise).
export const FILLER = [
  "Nullbyte", "Zer0Day", "GhostShell", "Cipher", "Pwnr", "R00t", "Bytewolf", "Hexx",
  "Phant0m", "Tr0jan", "Glitch", "Daemon", "Cr4sh", "Vipr", "N3xus", "Spectre",
  "Wraith", "Kr4ken", "Bl4ck1ce", "Ov3rfl0w"
];
