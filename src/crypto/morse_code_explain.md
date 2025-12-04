# Morseův kód — vysvětlení

Tento dokument popisuje základní chování nástroje *Text ⇄ Morse*.

- Podporuje ITU znakovou sadu pro písmena, čísla a běžnou interpunkci.
- Česká diakritika je normalizována (řetězce se převádějí na základní písmena).
- Digraf `CH` je ošetřen jako samostatný symbol a mapuje na `----`.

Použití nástroje:
- Zadejte text do pole *Text → Morse* a stiskněte „Převést na Morse“ nebo nechte `Živý režim` (převod při psaní).
- Pro přehrání Morse zvuku nastavte WPM (rychlost) a frekvenci (Hz) a stiskněte „Přehrát Morse“.
- Morse text můžete stáhnout jako WAV přes tlačítko *Stáhnout WAV*.

Konvence:
- Písmena jsou oddělena mezerou; slova odděluje znak `/`.
- Pokud vstup obsahuje neznámé znaky, nástroj je nahradí `?`.
