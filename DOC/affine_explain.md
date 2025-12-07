# 📘 Vysvětlení — Affiní šifra

Affiní šifra je jednoduchá substituční šifra nad abecedou o velikosti 26. Každé písmeno (mapované na číslo 0–25) se zašifruje pomocí lineární transformace:

E(x) = (a · x + b) mod 26

kde:
- `a` a `b` jsou klíče (celá čísla),
- `a` musí být nesoudělné s 26 (tj. gcd(a,26) = 1), aby existoval multiplikativní inverz modulo 26 a šifra byla dešifrovatelná.

Pro dešifrování použijeme inverzní transformaci:

D(y) = a_inv · (y - b) mod 26

kde `a_inv` je multiplikativní inverz `a` modulo 26 (tj. hodnota taková, že `(a · a_inv) mod 26 = 1`).

Příklad

- Nechť `a = 5`, `b = 8`.
- Písmeno `A` (x = 0) se zašifruje na `E(0) = (5·0 + 8) mod 26 = 8` → písmeno `I`.
- Písmeno `B` (x = 1) → `E(1) = (5·1 + 8) mod 26 = 13` → `N`.

Jak najít `a_inv`

Multiplikativní inverz lze najít pomocí rozšířeného Eukleidova algoritmu. Pro malou konstantu `a` (v rozsahu 1–25) je praktické provést výpočet ručně nebo naprogramovaně:

- Najděte `t` takové, že `(a * t) % 26 == 1`.

Tipy

- Povolena hodnoty `a` jsou ty, které jsou nesoudělné s 26: 1,3,5,7,9,11,15,17,19,21,23,25.
- Hodnota `b` je posun (0–25).
- Šifrujte pouze písmena A–Z; zachovejte velká/malá písmena podle potřeby nebo normalizujte na velká písmena.

Implementace

- Při implementaci se ujistěte, že převádíte písmena na čísla 0–25 a po aplikaci výpočtů zpět na písmena.
- Při dešifrování nezapomeňte správně aplikovat modulární aritmetiku tak, aby byly hodnoty nezáporné (např. `(y - b + 26) % 26`).

Další čtení

- Toto je základní vysvětlení — Affiní šifra je kombinací multiplikativní a aditivní substituce a lze ji považovat za jednoduchý případ generické lineární substituce.

