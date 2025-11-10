# Lámání zahashovaných hesel

Této části předcházejí informace o tom jak generovat hesla v nástroji [password-generator.md](./password_generator_explain.md).

> [!warning]
> Toto je **simulovaný** výukový nástroj. Používání obdobných nástrojů na cizí hesla v obdobných "penetračních" je nelegální!

## Uniklá data

Běžne při úniku dat z databáze hacker nedostane do rukou rovnou plan-text soubory s hesly. Hesla se standardně ukládájí v zaheschované podobě. 

Takový soubor může vypadat například takto:
```csv
email,hash,reg_date
...
```

> [!note]
> `.csv` = comma-separated values (hodnoty oddělené čárkou).

## Hashujeme hesla

Více o hashovacích funkcích se dočtete v dokumentu [hashing.md](./hashing_explain.md).

Nejhorší věc co zprávce databáze může udělat je uživatelská hesla ukládat v *plain-text* podobě. 

> [!note]
> `plain-text`

Pokud dojde k úniku dat z tahové databáze, tak útočníci nemají žádnou práci s přihlašováním na kradené účty. 

Mnohem lepším přístupem (dnes bezpečnostní standard) je hesla "zahashovat". Tedy použít funkci, která zkryje obsah hesla. 

$$
f(x) -> \text{hash}
$$

Kryptografický hashovací algoritmus (funkce) je takový, které je jednosměrný. Z hesla lze relativně snadno odvodit jeho hash, ale opačně to nelze. A to i když známe předpis kryptografické funkce.

> [!info]
> Představe si funkci `mocnina(x)` a `odmocnia(y)`. Jsou vůči sobě inverzní: $x = \sqrt{x^2}$. 
> Když vám řeknu že máte vypočítat $3^2$, nebudete dlouho přemýšlet. Pokud chcete ale zjisti $\sqrt{3}$, tak se trochu zapotíte. 

Proto i když získáte obsah databáze úživatelů, tak nejdříve musíte hesla prolomit. To můžete udělat tak, že projdete přes všechna možná hesla, ty zahešujete a porovnáte se záznamy v databázy.

```python
for pwd in possible_passwords: # vsechny mozne hesla
    hash = hash_function(pwd)  # spocitej hash
    if hash in leaked_hashes:  # je v unikle databazi?
        print(f'Found password for hash {hash}: {pwd}')
```

Pokud hash najdete v databázi, znáte i původní heslo. Není to tedy problém neřešitelný, ale výrazně to zpomalí hackera pokud vaše heslo je dostatečně dlouhé a obsahuje v sobě dostatečný prvek náhody. 

## Wordlist útok

Efektivní způsob jak lámat hesla je nezkoušet všechny šechny náhodné kombinace písmen, které by mohli tvořit heslo, ale začít se slovníkovým útokem.

Začnete tím že si sestavíte slovník možných hesel. Dobrými kandidáty jsou:
- reálná slova ze slovníku (lze si je zapamatovat),
- již dříve použitá hesla, který někdo před vámi rozlouskl.

Pokud máte slovník, tak může vytvářet další obdobná hesla: 
- kombinací slov,
- přidáním čísel,
- změna malá/velká písmena,
- záměna písmen a čísel.

Součástí tohoto nástroje jsou seznamy nejčasteji používaných hesel, které sestavili organizace zajímající se o cybersec:
- 10 nejčastějších hesel [eabm](https://eabm.cz/1947-100-nejpouzivanejsich-hesel-v-cr-za-rok-2021),
- 200 hesel podle [nordpass](https://nordpass.com/),
- 10000 hesel podle [SecLists](https://github.com/danielmiessler/SecLists).
 

## Rainbow table

Vypočítávat hashe on-demand (vy chvíli kdy lámeme hesla) je velmi pomalé a pro každý únik dat, který by jsme chtěli rozlousknot by bylo potřeba tuto práci opakovat. 

Proto někdo přišel s takzvanými Rainbow tables (duhové slovníky), který si napočíte jednou (případně je stáhenete předpočítané) a používáte je opakovaně. 

Rainbow tables (duhové tabulky) jsou předpočítané tabulky používané k lámání hashovaných hesel. Umožňují rychlejší nalezení původního hesla z jeho hash hodnoty pomocí předpočítaných řetězců.

> [!tip] Rainbow table
> Nejdříve vytvoříme "předpočítáme si" vyhledávací tabulku `heslo;hash` a pak teprve začneme hledat shody v úniku dat.  

> [!note]
> Pro každá hashovací algoritmus musíte sestavit vlastní rainbow table.

Přístup přes Rainbow table je výrazně rychlejší při lámání hesel i pro velké slovníky.

Rainbow tables fungují hlavně proti rychlým hashům bez soli (např. MD5/SHA-1).
Protiopatření: unikátní salt pro každé heslo + pomalá KDF (Argon2id/bcrypt/scrypt), což dělá předpočítávání tabulek neefektivní.

Jak se proti tomuto útoku bránit? Použitím soli.

## Solíme hesla

Hackeři sázejí na to, že používáme snadno prolomitelné heslo (takové, které nejspíš používá i někdo jiný a uniklo na internet).

Mají předpočítaný Rainbow table pro každá používaný hashovací algoritmus a hledají jaká hesla půjde snadno prolomit. 

Aplikace implemetují způsoby ochrany jak se před takovými útoky bránit v případě únika databáze uživatelů. 

Premisa haskerů je: "většina lidí používá stejná hesla pořád dokola".

> [!question] Co s tím můžeme udělat?
> Poupravit heslo tak aby bylo pro každého uživatele unikátní.

Typy soli:
- per-user = náhodná hex sůl,
- regdate = deterministická sůl odvozená z data registrace.


Umístění soli:
 - prefix: `salted = salt + pwd`  
 - sufix: `salted = pwd + salt`

> [!tip]
> "Solení" hesel představuje přidání k heslu ještě unikátní textový řetězec.

Použití soli znemožnuje aplikaci Rainbow table pro lámání hesel. 

> [!note]
> Pokud je použit deterministický algoritmus pro získání soli eg: "odvození z datumu registrace", tak hackera se slovníkovým útokem sice jen "zpomalíme", ale to pro hesla rozumné délky s použitím kvalitního kryptografického algoritmu může pořád znamenat roky práce.

# Úlohy

## Zahashováno bez soli + MD5

Nastavte generování databáze s následujícími parametry:
- hashovací algoritmus: `MD5`
- způsob solení: `žádná sůl`
- počet záznamů: `50`
- slovník: `10 hesel`

Vygenerujte databázi a poté spusťte útok na lámání hesel. Najděte parametr útoku, který umožní prolomení co nejvíce hesel.

## Zahashováno bez soli + SHA-256

Nastavte generování databáze s následujícími parametry:
- hashovací algoritmus: `SHA-256`
- způsob solení: `žádná sůl`
- počet záznamů: `50`
- slovník: `10000 hesel`

> [!question]
> Jaký útočný mód je nejefektivnější pro lámání těchto hesel? Proč?

## Zahashováno + posoleno

Nastavte generování databáze s následujícími parametry:
- hashovací algoritmus: `SHA-1`
- způsob solení: `sůl z data registrace`
- počet záznamů: `100`
- slovník: `200 hesel`

Vygenerujte databázi a poté spusťte útok na lámání hesel. Najděte parametr útoku, který umožní prolomení co nejvíce hesel.

> [!question]
> Proč nefunguje rainbow table útok na tato hesla?

## Zahashováno + sůl (volba algoritmu)
Nastavte generování databáze s následujícími parametry:
- hashovací algoritmus: **VOLTE SI**
- způsob solení: `sůl z data registrace`
- počet záznamů: `50`
- slovník: `200 hesel`

Vygenerujte databázi a poté spusťte útok na lámání hesel. Pozorujte jak dlouho trvá jejich prolomení.

| Hashovací algoritmus | Čas na prolomení |
|---------------------|------------------|
| MD5                 |                  |
| SHA-1               |                  |
| SHA-256             |                  |

> [!question]
> Jaký hashovací algoritmus by jste považovali za bezpečný proti útokům? Proč?

# Ovládání nástroje (manual)

Nástroj simuluje dvě strany: 
- databázi hesel (server, ze kterého unikly zahashovaná hesla), 
- útočníka (který se snaží hesla rozlousknout).
  
## Generování databáze
Nejdříve je potřeba vygenerovat databázi zahashovaných hesel.

Uživatel si může navolit:
- počet záznamů v databázi (počet uživatelů),
- hashovací algoritmus (`MD5`, `SHA-1`, `SHA-256`),
- způsob solení hesel (žádná sůl, sůl na uživatele, sůl z data registrace),
- slovník pro generování hesel.

Tlačítkem **Generovat DB** se vytvoří databáze a zobrazí v tabulce.

## Lámání hesel

Nástoj pro lámání hesel umožňuje zvolit má několik režimů:
- **Brute-force**: zkouší všechny možné kombinace znaků až do určité délky.
- **Wordlist**: zkouší hesla ze slovníku.
- **Wordlist + salt**: zkouší hesla ze slovníku, přičemž k heslům přidává sůl (pokud je použita).
- **Rainbow table**: používá předpočítané tabulky pro lámání hashovaných hesel.

Uživatel si může navolit:
- počet zkoušených kandidátů (z wordlistu) / limit,
- zdali zná speciální sůl pro uživatele (pokud je použita),
- slovník pro lámání hesel.

Tlačítkem **Spustit útok** se spustí proces lámání hesel. Průběh je zobrazen v konzoli a výsledky v tabulce.

> [!note]
> Předpokládá se že útočník zná použitý hashovací algoritmus a způsob solení hesel. 

## Použití

1. Vygenerujte databázi zahashovaných hesel pomocí tlačítka **Generovat DB**.
2. Nastavte parametry útoku (režim, počet kandidátů, slovník).
3. Klikněte na tlačítko **Spustit útok** pro zahájení procesu lámání hesel.
4. Sledujte průběh v konzoli a výsledky v tabulce.

## Tipy pro efektivní lámání hesel

Použitý hashovací algoritmus ovlivňuje rychlost lámání hesel. Rychlé algoritmy jako MD5 a SHA-1 jsou náchylnější k útokům, zatímco pomalejší algoritmy jako SHA-256 zpomalují proces lámání.

Aby lámání hesel bylo efektivní je důležité mít správně nastevanou konfiguraci.
Pokud je použita sůl, útočník musí znát její hodnotu (např. z data registrace), jinak nemá šanci heslo prolomit.

Osolená hesla:
- sůl z data registrace -> `wordlist + salt` mód,
- náhodná sůl -> útočník musí znát sůl pro každého uživatele zvlášť (zaškrtnout "znám náhodnou sůl").

Slovníky hesel musejí být voleny tak, aby útočník měl "obsáhlejší" seznam možných hesel. Jinak bude jeho úspěšnost výrazně nižší.

Čím delší slovník útočník použije, tím větší je šance na úspěch, ale zároveň se zvyšuje čas potřebný k lámání hesel.


## Zdroje a další čtení
- [github: SecLists](https://github.com/danielmiessler/SecLists)
- [Computerphile: How NOT to Store Passwords!](https://www.youtube.com/watch?v=8ZtInClXe1Q)