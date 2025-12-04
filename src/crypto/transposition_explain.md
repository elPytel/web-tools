# Transpoziční šifra

Transpoziční šifra **nemění písmena**, ale **mění jejich pořadí**.

- Vstup: `TAJNYUTOK`
- Výstup: `TYKAUXJTXNOX` (písmena stejná, pořadí jiné)

> [!important]
> Na rozdíl od substitučních šifer (Caesar, Vigenère…) zůstává **frekvence písmen stejná** – jen jsou „promíchaná“.

## Základní princip

Postup (obecná představa):

1. **Vybereme klíč** – typicky slovo nebo pořadí čísel.
2. Text rozepíšeme do **tabulky**.
3. Písmena z tabulky **čteme v jiném pořadí** – podle klíče.

Tím získáme šifrovaný text. Při dešifrování se stejné kroky dělají **obráceně**.

## Sloupcová transpoziční šifra (columnar transposition)

### 1. Klíčové slovo → číslování sloupců

Zvolíme klíčové slovo, např.:

```text
KLÍČ
````

Převedeme ho na pořadí podle abecedy:

* Č, I, K, L seřadíme podle abecedy: **Č (1)**, **K (2)**, **L (3)**, **Í (4)**

| Písmeno |  Č |  K |  L |  Í |
| ------: | -: | -: | -: | -: |
|  Pořadí |  1 |  2 |  3 |  4 |

> [!note]
> Pokud má klíč opakující se písmena, postupuje se typicky zleva doprava a stejná písmena dostanou pořadí podle pozice.


### 2. Zápis textu do tabulky

Text:
`TAJNYUTOK` (bez mezer, bez diakritiky; pro jednoduchost velká písmena)

Klíč má 4 znaky ⇒ tabulka bude mít 4 sloupce:

| Č (1) | K (2) | L (3) | Í (4) |
| ----- | ----- | ----- | ----- |
| T     | A     | J     | N     |
| Y     | U     | T     | O     |
| K     | X     | X     | X     |

Zbývající políčka doplníme speciálním znakem (např. `X`).

### 3. Čtení sloupců podle pořadí

Čteme sloupce podle čísel:

1. Sloupec s číslem 1 (Č): `T Y K`
2. Sloupec s číslem 2 (K): `A U X`
3. Sloupec s číslem 3 (L): `J T X`
4. Sloupec s číslem 4 (Í): `N O X`

Výsledek:

```text
TYK A U X J T X N O X
→ TYKAUXJTXNOX
```


## Dešifrování základní varianty

1. Známe:

   * klíčové slovo (např. `KLÍČ`),
   * délku šifrovaného textu (např. 12 znaků),
   * šířku tabulky (počet písmen v klíči = 4).

2. Spočítáme počet řádků:

```text
počet_řádků = ceil(délka_textu / počet_sloupců)
            = ceil(12 / 4) = 3
```

3. Vytvoříme prázdnou tabulku 3×4 a rozdělíme šifrotext **po sloupcích** podle pořadí klíče:

* první dostane sloupec s pořadím 1 (Č),
* druhý dostane sloupec s pořadím 2 (K),
* atd.

4. Pak čteme tabulku **po řádcích** → získáme původní text (bez doplňovacích znaků).

## Pokročilé varianty

V nástroji můžeme nabídnout pokročilé volby, které výrazně mění chování šifry a zároveň ukazují studentům, jak se dá bezpečnost zvýšit.

### 1. Dvojitá transpozice

Dvojitá transpozice = stejný (nebo jiný) postup proveden **dvakrát za sebou**.

Postup:

1. Zašifruj text způsobem (klíč A, směr A).
2. Vezmi výsledek a **znovu** ho zašifruj (klíč B, směr B).

Např.:

```text
PLAIN → (Transpozice s klíčem A) → T1 → (Transpozice s klíčem B) → T2
```

T2 je výsledný šifrotext.

> [!tip]
> V nástroji může být checkbox `Dvojitá transpozice` a druhé pole pro klíč.

* Varianta 1: stejné klíčové slovo dvakrát za sebou
* Varianta 2: dvě různá klíčová slova (`KLÍČ1`, `KLÍČ2`)
* Varianta 3: v druhém kole jiný směr čtení (viz níže)

### 2. Směry zápisu a čtení

Kromě „standardního“ zápisu po řádcích zleva doprava a čtení po sloupcích shora dolů můžeš ukázat různé kombinace:

#### Směr zápisu:

* ▶ **řádky zleva doprava** (klasika)
* ◀ řádky zprava doleva
* 🔽 sloupce shora dolů
* 🔼 sloupce zdola nahoru

#### Směr čtení:

* po **sloupcích shora dolů** (klasika),
* po sloupcích **zdola nahoru**,
* po řádcích zleva doprava / zprava doleva.

> [!example]
> V nástroji může být volba:
>
> * „Zápis: řádky zleva doprava / zprava doleva / sloupce…“
> * „Čtení: sloupce ↓ / sloupce ↑ / řádky → / řádky ←“

Tím získáš hezkou vizualizaci, že „stejná tabulka“ může vést k mnoha různým šifrám.

### 3. Vlastní doplňovací znak (padding)

V základní variantě se doplňuje `X`. V praxi:

* někdy `X`,
* někdy `Q`,
* někdy náhodná písmena.

V nástroji:

* textové pole `Doplňovací znak` (1 znak),
* případně volba `Náhodná písmena` (vyšší obtížnost pro kryptoanalýzu).

> [!warning]
> Při dešifrování musíme **vědět**, jestli doplňovací písmena existují, nebo kde končí skutečný text.
> V jednoduchém demo stačí:
>
> * vždy doplňovat,
> * a při dešifrování ukazovat text i s `X` a vysvětlit, co znamenají.

### 4. Zachování / odstranění mezer a diakritiky

Jak se vypořádat s českým textem?

Možnosti v nástroji:

* „Odstranit mezery a interpunkci“ (klasický krypto text)
* „Zachovat mezery na svých pozicích“ (transpozici dělat jen na písmena)
* „Nahradit diakritiku“ (`Á→A`, `Č→C`, …)

Pro studenty je dobré ukázat:

```text
PŮVODNÍ:  "Ahoj světe!"
NORMAL:   "AHOJSVETE"    (bez mezer a diakritiky)
ŠIFERTEXT: např. "AESVTJEOH"
```

> [!tip]
> V nástroji může být checkbox:
>
> * `Normalizovat text (A–Z, bez mezer)`
> * `Zachovat původní znaky (transpozice jen na písmena A–Z)`

### 5. Kombinace s jinými šiframi

Transpozice se často používá **v kombinaci** se substitucí:

1. hrubě text „zamícháme“ transpozicí,
2. výsledný text zašifrujeme např. Caesarovou nebo Vigenèrovou šifrou.

V demo můžeš ukázat volbu:

* `Nejprve Caesar, potom Transpozice`
* `Nejprve Transpozice, potom Caesar`

> [!question]
> Ukažte rozdíl v tom, jak vypadá frekvenční analýza pro:
>
> * samotný Caesar
> * samotnou Transpozici
> * kombinaci Caesar + Transpozice

## Úkoly pro čtenáře / studenta

1. Zašifrujte stejný text třemi různými klíči a porovnejte výsledky.
2. Zkuste zapnout/vypnout:

   * normalizaci textu,
   * zachování mezer.
     Jak se změní čitelnost šifrotextu?
3. Vygenerujte šifru s:

   * jednou transpozicí,
   * dvojitou transpozicí.
     Porovnejte, jak moc se liší výsledný text.
4. Zkuste ručně (bez nástroje) dešifrovat krátký text zašifrovaný transpozicí s klíčem o délce 4. Jaké informace vám pomůže odhalit **délka klíče**?