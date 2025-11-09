# ASCII kódování
ASCII (American Standard Code for Information Interchange) je standardní znaková sada používaná pro reprezentaci textu v počítačích a dalších zařízeních, která pracují s textovými daty. Byl vyvinut v 60. letech 20. století a stal se základem pro mnoho dalších kódovacích systémů.

![tabulka](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/ASCII_Code_Chart.svg/800px-ASCII_Code_Chart.svg.png)

## Vznik

Příchodem počítačových sítí a internetu tak jak je známe zde byl telegraf. Po dvou vodíčích (zem a napětí) se dali přenášet elektrické impulzy:
- krátký (tečka),
- dlouhý (čárka),
- a teké nic (mezera).

Kombinací těchto signálů vedlo na vznik Moresovy abecedy.

Ač byl telegraf na svou dobu extrémně průlomový a jediní jeho konkureti přenosu informací té době byli:
- rychlí poslové na koni,
- poštovní holuby,
- a mávání vlajkama z vysoké věže.

Tak měl telegrf několik značných nevýhod, zejména potřebu zručného telegrafisty, který dovede odesílat zrpávy nejen rychle, ale také s minimem překlepů.

Využití elektřiny umožnovalo odesílat zprávy na opravdu ohromné vzdálenosti a to prakticky rychlostí světla. Museli jste mezi všemi místy, kam jste chtěli odeslat zprávu natáhnout dráty, ale to vesrovnání stěvbě silnic pro poštovní vozy není zas taková tragedie.

Nacházíme se v době kdy rozšiřuje používání psacího stroje na tolik, že každé lepší sekretářka na něm dovede psát. A to je mnohem více lidí, než kolik existuje zručných telegrafistů. Tedy pokud by bylo možné nahradit telegraf jiným strojem, který by měl na jedné straně standardní klávesnici (takovou jakou používáme do dnes) a na druhé mechanizmus psacího stroje, tisknoucí člověku čitelný text. Tak by bylo možné nahradit telegrafickou síť a zbyvit se potřeby telegrafistů, protože by vaše maily mohla odesílat klidně sekretářka. 

Jako jediný praktický systém pro propojení těchto dvou částí stroje se nabízely elktrické vodiče, ale jejich pokládání se velmi zdokonalili s příchodem telgrafu, takže ani to by nemělo být problém.

Jak přenášet znaky psacího stroje po drátech?

Do hry přichází binární kodování. Pro jednoduchost si 0 a 1 přistavujte jako stav žárovky svítí / nesvítí.

Na anglickém psacím stroji máme:
| počet | znaky |
|---|---|
| 2x26 = 52 | znaků abecedy ( malé a velké) |
| 10 | číslic 0-9 |
| 32 | speciálních znaků (interpunkce, mezera, atd.) |
| 33 | řídící znaky (Enter, Backspace, Tab, atd.) |
| **127** | **celkem** |

> [!note]
> Na psacím stroji máme také znaky jako Enter, Backspace, Tab, atd., a i tyto řídící znaky je třeba nějak reprezentoat pro přenos po drátech. 

V desítkové abecedě se s každým řádem x10 násobí počet hodnot které dovedem rozlišit.

10, 100, 1000,...

V binární abecdě obdobně s každým dalším znakem (řádem) x2 zvětšíme počet rozlišitelných hodnot.

| Počet hodnot | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|--------------|---|---|---|---|---|---|---|
|              | 2 | 4 | 8 | 16 | 32 | 64 | 128 |

Nejmenší větší číslo je 128.

Pro reprezentaci 94 znaků potřebujeme minimálně 7 bitů (2^7 = 128). To znamená, že každý znak může být reprezentován jako kombinace 7 nul a jedniček.

Stačí tedy přiřadit každému znaku unikátní kombinaci 7 bitů a můžeme přenášet textové zprávy pomocí elektrických signálů. Po 7 bitech (7 vodičích + zem) a přijímač je dekóduje zpět na původní znak. Který vytiskne náš elektrický psací stroj.

Takto vznikl první dálnopisný psací stroj a s ním i ASCII kódování.

## Unicode
ASCII kódování je omezené na 128 znaků, což je nedostatečné pro pokrytí všech světových jazyků a speciálních symbolů. Proto byl vyvinut Unicode, který rozšiřuje počet znaků na více než 1 milion pomocí různých kódovacích schémat, jako je UTF-8, UTF-16 a UTF-32.

## Zdroje:
- [ASCII - Wikipedia](https://cs.wikipedia.org/wiki/ASCII)
- [Computerphile: Characters, Symbols and the Unicode Miracle](https://www.youtube.com/watch?v=MijmeoH9LT4)