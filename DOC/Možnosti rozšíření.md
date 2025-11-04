# Nápady k rozšíření webových nástrojů

> [!tip] "Crypto & Code Playground"
> *Interaktivní webové ukázky šifer, kódování a algoritmů (HTML+JS, žádný server).*

- [Nápady k rozšíření webových nástrojů](#nápady-k-rozšíření-webových-nástrojů)
  - [🔢 Datové typy](#-datové-typy)
  - [⏱️ Práce s časem](#️-práce-s-časem)
  - [🧮 Kódování a převody](#-kódování-a-převody)
    - [📦 Bezdrátová komprese:](#-bezdrátová-komprese)
    - [🛠️ Opravné kódy:](#️-opravné-kódy)
    - [Kódování barev a obrazových dat:](#kódování-barev-a-obrazových-dat)
  - [🔐 Kryptografie a šifry](#-kryptografie-a-šifry)
  - [📶 Signály](#-signály)
  - [📡 Modulace signálu](#-modulace-signálu)
    - [🎧 Základní audio efekty:](#-základní-audio-efekty)
    - [🔊 Audio:](#-audio)
  - [Hry](#hry)

## 🔢 Datové typy
Datové typy:
- Int
- Float
Reprezentace, výpočet, binární podoba.
Možnost ukládání v paměti (grafy) int.

## ⏱️ Práce s časem
Práce s časem:
- Aktuální čas 
- Stopky
- Odpočet, Ala pomodoro

## 🧮 Kódování a převody

Zaměřené na znaky, čísla a datové formáty.

| Název                          | Popis                                                              | Obtížnost |
| ------------------------------ | ------------------------------------------------------------------ | --------- |
| 🧾 HEXdump                        | zobrazí hex hodnoty souboru nebo textu                             | 🟢        |
| Checksum / Hash ukázka         | spočítá SHA-1 / SHA-256 hash a ukáže rozdíl po změně znaku         | 🟡        |
| Generátor a ověřovač kontrolních součtů (např. rodné číslo, IBAN) | reálné využití mod 11 a jiných pravidel         | 🟡        |
| QR Encoder                     | z textu vygeneruje QR kód (pomocí JS knihovny `qrcode.js`)         | 🟡        |

Kódování úlohy co jsme dělali s chaloupkou pro komprimaci.
VCard do qr code pro generování vizitek.

### 📦 Bezdrátová komprese:
- RLE
- LZW
- Huffmanovo kódování

### 🛠️ Opravné kódy:
Parita
RAID 0,1,5 ukázka

🗄️RAID:
- Demonstrace stripování dat v RAID
- Text -> ascii -> bin, ukládání na "discích"
- Použití parity pro výpočet chybějící informace na jednom disku (nahrání do hot spare)

### Kódování barev a obrazových dat:
Obraz a barvy:
- Paleta barev
- RGB složka obrazu
- YUV složka obrazu
- Ukládání dat do bmp

## 🔐 Kryptografie a šifry

| Název                | Popis                                                                                | Obtížnost |
| -------------------- | ------------------------------------------------------------------------------------ | --------- |
| Caesarova šifra      | jednoduché posunutí písmen o pevný počet míst                                        | 🟢        |
| Atbash               | jednoduché zrcadlení abecedy (A↔Z, B↔Y…)                                             | 🟢        |
| ROT13 / ROT47          | jednoduchá obměna Caesarovy šifry pro ASCII        | 🟢        |
| Pig Latin / švachština | jazyková transformace textu                        | 🟢        |
| Textový analyzátor     | spočítá počet slov, znaků, frekvence písmen        | 🟡        |
| Vigenèrova šifra     | zadáš klíčové slovo, provádí posuny jako Caesar, ale podle klíče. Generování kroků.  | 🟡        |
| Transpoziční šifra   | ukazuje, jak se písmena přesouvají v textu podle klíče                               | 🟡        |
| Modulo aritmetika vizualizátor     | ukáže výsledek (a mod n) jako kruh nebo tabulku | 🟡        |
| Affine Cipher        | ukazuje, jak se písmena mapují lineárně `E(x) = (a*x + b) mod 26`                    | 🟡        |
| One-Time Pad         | vysvětlí princip náhodného klíče a XOR operace                                       | 🟡        |
| Braillovo písmo      | převod textu na Braillovo                                                            | 🟡        |
| RSA mini demo        | ukázka generování malých prvočísel, výpočtu `n, e, d`, a šifrování/dešifrování čísla | 🔴        |

🛡️ RSA:
- ukázka generování klíčů a šifrování/dešifrování zprávy pomocí RSA
- demonstrace výpočtu `n, e, d` a jejich použití při šifrování a dešifrování

## 📶 Signály
Signály:
- Generátor funkcí a audio výstup 
- Grafické znázornění 
- 50Hz - 20kHz
- Nastavení hlasitosti 
- Usměrněná sinusovka.
- Jak se syntetizují hudební nástroje?

## 📡 Modulace signálu 
PWM
Rotující kolečko, podle nastavení střídy.
AM
PSK
QAM

### 🎧 Základní audio efekty:
Ozvěna 
Konvoluce s impulzní odezvou.

### 🔊 Audio:
mp3 přehrávač 
Midi přehrávač a úprava notového zápisu.

## Hry
Sudoku
Piškvorky 