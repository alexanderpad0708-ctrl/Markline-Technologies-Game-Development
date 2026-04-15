// --- NebulaOS WordSwap™ core ---

// SAFE: no replacement
const SAFE_WORDS = new Set([
  "dang",
  "heck",
  "crap",
  "darn",
  "shoot",
  "frick"
]);

// SPICY → silly
const SPICY_MAP = {
  "ass": "apples",
  "asshole": "sugar-apple",
  "shit": "dang",
  "bitch": "bunny",
  "hell": "heck"
};

// NUCLEAR → maximum nonsense
const NUCLEAR_MAP = {
  "fuck": "fun",
  "fucking": "funning",
  "wtf": "what the heck",
  "screw": "fun"
};

// Normalize word for matching
function normalizeWord(word) {
  return word.toLowerCase();
}

// Preserve capitalization style
function applyCase(original, replacement) {
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

// Main swap function
function nebulaWordSwap(text) {
  // Split on word boundaries but keep punctuation
  return text.replace(/\b[\w']+\b/gi, (match) => {
    const base = normalizeWord(match);

    // SAFE: leave as-is
    if (SAFE_WORDS.has(base)) return match;

    // NUCLEAR first
    if (NUCLEAR_MAP[base]) {
      return applyCase(match, NUCLEAR_MAP[base]);
    }

    // SPICY next
    if (SPICY_MAP[base]) {
      return applyCase(match, SPICY_MAP[base]);
    }

    // No change
    return match;
  });
}

// --- Hook up UI ---

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("inputText");
  const output = document.getElementById("outputText");
  const btn = document.getElementById("swapBtn");

  function runSwap() {
    const text = input.value || "";
    const swapped = nebulaWordSwap(text);
    output.textContent = swapped;
  }

  btn.addEventListener("click", runSwap);

  // Live update as you type (optional)
  input.addEventListener("input", runSwap);
});