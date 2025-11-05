# Detekce klíče u Caesarovy šifry
Na **detekci posunu** u Caesarovy šifry se hodí dvě jednoduché metody (můžeš je i zkombinovat):

1. **Brute-force všech 26 posunů** a u každého spočítat „skóre čitelnosti“.
2. **Frekvenční analýza (chi-square)** – porovnáš rozložení písmen s očekávanou distribucí (např. angličtiny) a vybereš nejnižší χ².

Níže je hotová implementace v JavaScriptu, která:

* projde všech 26 posunů,
* pro každý spočítá **χ² skóre** podle frekvencí angličtiny,
* přidá **bonus** za výskyt častých slov (funguje i pro češtinu – jednoduchý slovníček),
* vrátí **nejpravděpodobnější posun** + **TOP kandidáty** s náhledem dešifrovaného textu.

> [!tip]
> I když řešíš češtinu, frekvenční test pro EN funguje překvapivě dobře. Přidaný „word bonus“ s běžnými CZ slovy (“se, je, že, a, na, to, v, jsem…”) tomu dost pomůže.

## Funkce do stránky (JS)

```html
<script>
  // Posun o 'shift' (může být záporný). Zachová písmena, ostatní znaky nechá být.
  function caesarShift(str, shift) {
    const A = "A".charCodeAt(0), Z = "Z".charCodeAt(0);
    return str.split("").map(ch => {
      const code = ch.charCodeAt(0);
      const isLower = (code >= 97 && code <= 122);
      const base = isLower ? 97 : 65;
      const isLetter = (isLower || (code >= 65 && code <= 90));
      if (!isLetter) return ch;
      const off = (code - base + shift + 26*100) % 26;
      return String.fromCharCode(base + off);
    }).join("");
  }

  // Anglické frekvence (pro χ²), v procentech
  const EN_FREQ = {
    A:8.167, B:1.492, C:2.782, D:4.253, E:12.702, F:2.228, G:2.015,
    H:6.094, I:6.966, J:0.153, K:0.772, L:4.025, M:2.406, N:6.749,
    O:7.507, P:1.929, Q:0.095, R:5.987, S:6.327, T:9.056, U:2.758,
    V:0.978, W:2.360, X:0.150, Y:1.974, Z:0.074
  };

  // Pár častých CZ/EN slov pro bonus (hrubá heuristika)
  const COMMON_WORDS = [
    " a ", " v ", " se ", " je ", " že ", " na ", " to ", " pro ", " z ", " do ",
    " jsem ", " jsme ", " jako ", " the ", " and ", " of ", " to ", " is ", " in ", " it "
  ];

  function chiSquareScore(textUpper) {
    // spočítat četnosti jen z A–Z
    const counts = new Array(26).fill(0);
    let letters = 0;
    for (const ch of textUpper) {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        counts[code - 65]++;
        letters++;
      }
    }
    if (letters === 0) return Number.POSITIVE_INFINITY;

    // χ² = Σ ( (O - E)^2 / E ), kde E = očekávané podle EN_FREQ
    let chi2 = 0;
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      const expected = EN_FREQ[letter] / 100 * letters;
      if (expected > 0) {
        const diff = counts[i] - expected;
        chi2 += (diff * diff) / expected;
      }
    }
    return chi2;
  }

  // Bonus za výskyt běžných slov (snižuje skóre = zlepšuje kandidáta)
  function wordBonus(textLower) {
    let bonus = 0;
    for (const w of COMMON_WORDS) {
      // jednoduché hledání s mezerami pro omezení falešných zásahů
      const occurrences = textLower.split(w).length - 1;
      if (occurrences > 0) bonus += occurrences * 2.0; // váha bonusu: klidně uprav
    }
    return bonus;
  }

  // Vrátí nejlepší posun a TOP kandidáty s náhledem
  function guessShift(cipherText, topK = 5) {
    const candidates = [];
    for (let s = 0; s < 26; s++) {
      // Pro Caesarovu šifru „správný posun“ pro dešifrování je -s
      const plain = caesarShift(cipherText, -s);
      // Skóre = chi2 - bonus (nižší lepší)
      const chi2 = chiSquareScore(plain.toUpperCase());
      const bonus = wordBonus(plain.toLowerCase());
      const score = chi2 - bonus;
      candidates.push({
        shift: s,
        score,
        preview: plain.slice(0, 120) // krátký náhled
      });
    }
    candidates.sort((a, b) => a.score - b.score);
    return {
      best: candidates[0],
      top: candidates.slice(0, topK)
    };
  }

  // === Příklad použití ===
  // const cipher = "WKH TXLFN EURZQ IRA MXPSV RYHU WKH ODCB GRJ";
  // const guess = guessShift(cipher, 5);
  // console.log("Nejlepší posun:", guess.best.shift, guess.best);
  // console.table(guess.top);
</script>
```

## Jak to napojit do UI

Do své stránky přidej tlačítko „Detekovat klíč“ a tabulku s kandidáty:

```html
<button onclick="detectKey()">Detekovat klíč</button>
<div id="candidates"></div>

<script>
  function detectKey() {
    const text = document.getElementById("text").value;
    const res = guessShift(text, 5);
    // Předvyplň posuvník/number nalezeným klíčem:
    const shiftInput = document.getElementById("shift");
    if (shiftInput) shiftInput.value = res.best.shift;

    // Vypiš top kandidáty
    const div = document.getElementById("candidates");
    const rows = res.top.map(c =>
      `<tr><td style="text-align:right">${c.shift}</td><td>${c.score.toFixed(2)}</td><td><code>${c.preview.replace(/</g,"&lt;")}</code></td></tr>`
    ).join("");
    div.innerHTML = `
      <h3>Nejpravděpodobnější posuny</h3>
      <table border="1" cellpadding="6">
        <thead><tr><th>Klíč</th><th>Skóre</th><th>Náhled dešifrovaného textu</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }
</script>
```

## Proč to funguje

* **χ² test** dává nízké skóre, když rozložení písmen připomíná přirozený jazyk.
* **Word bonus** posune nahoru kandidáta, který obsahuje běžná slova (CZ/EN).
* Kombinace obou je na krátkých textech robustnější než samotná frekvenční analýza.

