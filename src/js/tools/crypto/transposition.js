// ===== Normalizace textu (A–Z, bez diakritiky, bez mezer) =====
export function normalizeAZ(text) {
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // odstranění diakritiky
    .replace(/[^A-Z]/g, '');           // jen A–Z
}

// ===== Pomocné funkce pro práci s klíčem =====

// Vrátí pole indexů sloupců v pořadí podle klíče.
// Např. "KLÍC" -> [0,1,2,3] seřazené podle znaků (včetně řešení duplicit).
function columnOrderFromKey(key, cols) {
  const n = cols ?? Math.max(1, key?.length || 1);
  if (!key || !key.length) {
    return Array.from({ length: n }, (_, i) => i);
  }

  const pairs = Array.from({ length: n }, (_, i) => ({
    idx: i,
    ch: key[i] ?? String.fromCharCode(0x7f + i) // fallback pro kratší klíče
  }));

  pairs.sort((a, b) => {
    const ca = a.ch.toUpperCase();
    const cb = b.ch.toUpperCase();
    if (ca < cb) return -1;
    if (ca > cb) return 1;
    return a.idx - b.idx; // stabilní pořadí při duplicitách
  });

  return pairs.map(p => p.idx);
}

// ===== Vytváření pořadí pozic v mřížce (rows x cols) =====

function buildFillOrder(rows, cols, mode) {
  // mode: 'row-lr', 'row-rl', 'col-tb', 'col-bt'
  const out = [];
  if (mode === 'row-rl') {
    for (let r = 0; r < rows; r++) {
      for (let c = cols - 1; c >= 0; c--) out.push({ r, c });
    }
  } else if (mode === 'col-tb') {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) out.push({ r, c });
    }
  } else if (mode === 'col-bt') {
    for (let c = 0; c < cols; c++) {
      for (let r = rows - 1; r >= 0; r--) out.push({ r, c });
    }
  } else {
    // default row-lr
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) out.push({ r, c });
    }
  }
  return out;
}

function buildReadOrder(rows, cols, key, mode) {
  // mode: 'col-tb', 'col-bt', 'row-lr', 'row-rl'
  const colOrder = columnOrderFromKey(key, cols);
  const out = [];

  if (mode === 'col-tb') {
    for (const c of colOrder) {
      for (let r = 0; r < rows; r++) out.push({ r, c });
    }
  } else if (mode === 'col-bt') {
    for (const c of colOrder) {
      for (let r = rows - 1; r >= 0; r--) out.push({ r, c });
    }
  } else if (mode === 'row-rl') {
    for (let r = 0; r < rows; r++) {
      for (let i = colOrder.length - 1; i >= 0; i--) {
        out.push({ r, c: colOrder[i] });
      }
    }
  } else {
    // row-lr (default) – čte řádky, ale sloupce v pořadí podle klíče
    for (let r = 0; r < rows; r++) {
      for (const c of colOrder) out.push({ r, c });
    }
  }

  return out;
}

// ===== Jádro transpozice pro libovolný text (bez řešení mezer / normalizace) =====

function coreEncrypt(text, {
  key = '',
  fillMode = 'row-lr',  // 'row-lr' | 'row-rl' | 'col-tb' | 'col-bt'
  readMode = 'col-tb',  // 'col-tb' | 'col-bt' | 'row-lr' | 'row-rl'
  padChar = 'X'
} = {}) {
  const cols = Math.max(1, key?.length || 1);
  const total = text.length;
  const rows = Math.ceil(total / cols);
  const cellCount = rows * cols;

  const padded = text.padEnd(cellCount, padChar);

  const fillOrder = buildFillOrder(rows, cols, fillMode);
  const readOrder = buildReadOrder(rows, cols, key, readMode);

  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => padChar)
  );

  // Naplnění mřížky podle fillOrder
  for (let i = 0; i < cellCount; i++) {
    const { r, c } = fillOrder[i];
    grid[r][c] = padded[i];
  }

  // Čtení podle readOrder
  let out = '';
  for (let i = 0; i < cellCount; i++) {
    const { r, c } = readOrder[i];
    out += grid[r][c];
  }
  return out;
}

function coreDecrypt(cipher, {
  key = '',
  fillMode = 'row-lr',
  readMode = 'col-tb',
  padChar = 'X'
} = {}) {
  const cols = Math.max(1, key?.length || 1);
  const total = cipher.length;
  const rows = Math.ceil(total / cols);
  const cellCount = rows * cols;

  const padded = cipher.padEnd(cellCount, padChar);

  const fillOrder = buildFillOrder(rows, cols, fillMode);
  const readOrder = buildReadOrder(rows, cols, key, readMode);

  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => padChar)
  );

  // Při dešifrování plníme mřížku v pořadí readOrder
  for (let i = 0; i < cellCount; i++) {
    const { r, c } = readOrder[i];
    grid[r][c] = padded[i];
  }

  // Čtení v pořadí fillOrder (opačný směr)
  let out = '';
  for (let i = 0; i < cellCount; i++) {
    const { r, c } = fillOrder[i];
    out += grid[r][c];
  }
  return out;
}

// ===== Režim „jen písmena, zbytek nechat na místě“ =====

const letterRegex = /\p{L}/u; // libovolné Unicode písmeno

function transformLettersOnly(text, transformFn) {
  const chars = [...text];
  const letters = [];
  const positions = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (letterRegex.test(ch)) {
      letters.push(ch);
      positions.push(i);
    }
  }

  const joined = letters.join('');
  const transformed = transformFn(joined);
  const outLetters = [...transformed].slice(0, letters.length);

  const result = [...chars];
  let j = 0;
  for (const pos of positions) {
    result[pos] = outLetters[j++] ?? result[pos];
  }
  return result.join('');
}

// ===== Veřejné API: encrypt / decrypt s pokročilými volbami =====

/**
 * options:
 * {
 *   key1: string,          // hlavní klíč
 *   key2?: string,         // druhý klíč pro dvojitou transpozici (pokud chybí, použije se key1)
 *   double?: boolean,      // dvojitá transpozice ano/ne
 *   fillMode?: 'row-lr' | 'row-rl' | 'col-tb' | 'col-bt',
 *   readMode?: 'col-tb' | 'col-bt' | 'row-lr' | 'row-rl',
 *   padChar?: string,      // 1 znak, default 'X'
 *   normalize?: boolean,   // true → A–Z, bez mezer
 *   lettersOnly?: boolean  // true → transponují se jen písmena, zbytek zůstává na místě
 * }
 */

export function transposeEncrypt(plainText, options = {}) {
  const {
    key1 = '',
    key2,
    double = false,
    fillMode = 'row-lr',
    readMode = 'col-tb',
    padChar = 'X',
    normalize = false,
    lettersOnly = false
  } = options;

  const pad = (padChar && padChar.length) ? padChar[0] : 'X';

  const coreOpts1 = { key: key1, fillMode, readMode, padChar: pad };
  const coreOpts2 = { key: key2 || key1, fillMode, readMode, padChar: pad };

  let text = plainText;

  if (normalize) {
    text = normalizeAZ(text);
  }

  const applyOnce = (input) => coreEncrypt(input, coreOpts1);
  const applyDouble = (input) => coreEncrypt(coreEncrypt(input, coreOpts1), coreOpts2);

  if (lettersOnly && !normalize) {
    // Transpozice jen na písmena, ostatní znaky zůstávají na místě.
    const fn = double ? applyDouble : applyOnce;
    return transformLettersOnly(text, (letters) => {
      const enc = fn(letters);
      // Ořízneme doplňovací znaky navíc – zachováme původní počet písmen
      return enc.slice(0, letters.length);
    });
  } else {
    const fn = double ? applyDouble : applyOnce;
    const enc = fn(text);
    return enc;
  }
}

export function transposeDecrypt(cipherText, options = {}) {
  const {
    key1 = '',
    key2,
    double = false,
    fillMode = 'row-lr',
    readMode = 'col-tb',
    padChar = 'X',
    normalize = false,
    lettersOnly = false
  } = options;

  const pad = (padChar && padChar.length) ? padChar[0] : 'X';

  const coreOpts1 = { key: key1, fillMode, readMode, padChar: pad };
  const coreOpts2 = { key: key2 || key1, fillMode, readMode, padChar: pad };

  let text = cipherText;

  const applyOnce = (input) => coreDecrypt(input, coreOpts1);
  const applyDouble = (input) => coreDecrypt(coreDecrypt(input, coreOpts2), coreOpts1);
  // Pozn.: pořadí je opačné než při šifrování:
  // E = E2(E1(P)) → D = D1(D2(C))

  if (lettersOnly && !normalize) {
    const fn = double ? applyDouble : applyOnce;
    return transformLettersOnly(text, (letters) => {
      const dec = fn(letters);
      return dec.slice(0, letters.length);
    });
  } else {
    const fn = double ? applyDouble : applyOnce;
    const dec = fn(text);
    if (normalize) {
      // při normalize jsme původně přišli o mezery/diakritiku – tady je prostě necháme pryč
      return dec;
    }
    return dec;
  }
}
