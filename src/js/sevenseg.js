// Reusable 7-segment display helper
// Usage:
// import { createSevenSeg, DEFAULT_MAP } from './js/sevenseg.js';
// const seg = createSevenSeg('#segDemo'); seg.setValue('123');

export const DEFAULT_MAP = {
  // digits
  "0": "abcdef",
  "1": "bc",
  "2": "abged",
  "3": "abgcd",
  "4": "fgbc",
  "5": "afgcd",
  "6": "afgecd",
  "7": "abc",
  "8": "abcdefg",
  "9": "abfgcd",
  "-": "g",
  " ": "",

  // Letters (approximate representations on a 7-seg display)
  "A": "abcefg",
  "B": "cdefg",   // lowercase b style
  "C": "adef",
  "D": "bcdeg",
  "E": "adefg",
  "F": "aefg",
  "G": "acdef",
  "H": "cefg",
  "I": "ef",
  "J": "bcde",
  "K": "efg",
  "L": "def",
  "M": "acef",
  "N": "ceg",
  "O": "abcdef",
  "P": "abefg",
  "Q": "abcfg",
  "R": "eg",
  "S": "acdfg",
  "T": "defg",
  "U": "bcdef",
  "V": "cde",
  "W": "bdf",
  "X": "bcefg",
  "Y": "bcfg",
  "Z": "abdeg"
};

function setDigitEl(el, char, map) {
  const on = (map[char] || "").split('');
  el.querySelectorAll('.seg').forEach(s => s.classList.remove('on'));
  el.querySelectorAll('.dp').forEach(s => s.classList.remove('on'));
  on.forEach(k => { const seg = el.querySelector('.' + k); if (seg) seg.classList.add('on'); });
  if (char === '.') el.querySelector('.dp')?.classList.add('on');
}

export function createSevenSeg(container, options = {}) {
  const el = (typeof container === 'string') ? document.querySelector(container) : container;
  if (!el) throw new Error('7-seg container not found: ' + container);
  const map = Object.assign({}, DEFAULT_MAP, options.map || {});
  const digits = () => Array.from(el.querySelectorAll('.digit'));

  function renderValue(val) {
      const ds = digits();
      // normalize to string and uppercase so alphabetic chars map correctly
      const s = String(val == null ? '' : val).toUpperCase();
      // take at most digits.length characters; pad on the left with spaces
      const chars = s.slice(0, ds.length).padStart(ds.length, ' ').split('');
      ds.forEach((d, i) => setDigitEl(d, chars[i] === '.' ? '.' : chars[i], map));
  }

  return {
    setValue(v) { renderValue(v); },
    setMap(newMap) { Object.assign(map, newMap); },
    getMap() { return Object.assign({}, map); },
    el,
  };
}

export default createSevenSeg;
