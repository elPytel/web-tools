// Presety harmonických pro additivní syntézu
// Formát: { n: pořadí harmonické (1= základ), amp: 0..1 }

export const Flute = [
  {n:1, amp:1.00}, {n:2, amp:0.18}, {n:3, amp:0.10}, {n:4, amp:0.06}, {n:5, amp:0.03}
];

export const Clarinet = [
  // převaha lichých harmonických
  {n:1, amp:1.00}, {n:3, amp:0.50}, {n:5, amp:0.35}, {n:7, amp:0.22}, {n:9, amp:0.12}
];

export const Violin = [
  {n:1, amp:1.00}, {n:2, amp:0.75}, {n:3, amp:0.55}, {n:4, amp:0.40}, {n:5, amp:0.28}, {n:6, amp:0.20}
];
