// --- helpers ---
export function mod(n, m) {
  return ((n % m) + m) % m;
}

export function egcd(a, b) {
  if (b === 0) return { g: a, x: 1, y: 0 };
  const res = egcd(b, a % b);
  return { g: res.g, x: res.y, y: res.x - Math.floor(a / b) * res.y };
}

export function modInv(a, m) {
  const res = egcd(a, m);
  if (res.g !== 1) return null;
  return mod(res.x, m);
}

export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) {
    const t = b; b = a % b; a = t;
  }
  return a;
}

