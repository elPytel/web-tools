# Lámání hesel

Většina aplikací má implementovaný bezpečnostní count-down, takže člověk může zkoušet hádat hesla jen omezenou rychlostí. Některé aplikace se po určitém množství pokusů zablokují, jiné postupně prodlužují čas, po který musí uživatel čekat, než smí znovu zadat heslo. Oba tyto přístupy jsou validní při pokusu o spomalení útočníka.

(latence, rate-limit, lockout, CAPTCHA, MFA)


## Příklad

Představme si že náš procesor má jedno jádro pracující na frekvenci 5GHz a vyzkoušet nové heslo nás stojí 10 instrukcí procesoru.

> [!note]
> Uvažujeme tvorbu hesla jako: inkrementální generování všech možných kombinací znaků a jejich porovnání s cílovým heslem.

$$
5 \text{ GHz} = 5 \cdot 10^9 \text{ cyklů za sekundu}
$$

$$
\text{Počet hesel za sekundu} = \frac{5 \cdot 10^9 \text{ cyklů za sekundu}}{10 \text{ instrukcí na heslo}} = 5 \cdot 10^8 \text{ hesel za sekundu}
$$

Nuly pro přehlednost:
$$
5 \cdot 10^8 = 500,000,000 \text{ hesel za sekundu}
$$

Náš počítač tedy dokáže vyzkoušet 500 milionů hesel za sekundu.

Volíme jednoduché heslo, které má 3 znaky z malé abecedy.

Pro jeden znak máme 26 možností.

Pro 3 znaky:
$$
23 \cdot 23 \cdot 23 = 23^3 = 17,576 \text{ možných hesel}
$$

To se může zdát jako hodně možných hesel, ale pokud je nezadáváme ručně, ale dělá to za nás počítač, tak je obrázek trochu jiný.

Tabulka pro názornost:

| Délka hesla | malá abeceda | velká abeceda | čísla | speciální znaky | počet kombinací | "délka výpočtu" |
|-------------|--------------|----------------|-------|-----------------|------------------|-----------------|
| 3 | ✅ | ❌ | ❌ | ❌ | 26^3 = 17,576 | 0.000035152 sekund |
| 8 | ✅ | ❌ | ❌ | ❌ | 26^8 = 208,827,064,576 | 417.654 s (6.96 min) |
| 8 | ✅ | ✅ | ❌ | ❌ | (26+26)^8 = 53,459,728,531,456 | 106 919.457 s (29.70 h) |
| 8 | ✅ | ✅ | ✅ | ❌ | (26+26+10)^8 = 218,340,105,584,896 |  436 680.211 s (5.05 d)  |
| 8 | ✅ | ✅ | ✅ | ✅ | (26+26+10+32)^8 = 6,634,204,312,890,625 | 12 191 378.771 s (141.10 d) |
| 12 | ✅ | ✅ | ✅ | ✅ | (26+26+10+32)^12 = 95,428,956,661,682,176,870,000 | 9.518×10^14 s (3.016×10^7 let) |
| 20 | ✅ | ✅ | ✅ | ✅ | (26+26+10+32)^20 = 73,786,976,294,838,206,464,677,109,728,000,000 | 5.802×10^27 s (1.839×10^23 let) |

> [!info]
> Výpočet je ilustrativní a nezohlednuje optimalizace jako paralelní zpracování, použití GPU, distribuované výpočty nebo specializovaný hardware (ASIC, FPGA). V reálném světě mohou být tyto faktory významné a mohou výrazně zkrátit dobu potřebnou k prolomení hesla.

> [!tip]
> Pokud nás aplikace zablokuje po **n** pokusech nebo se s každým pokusem prodlouží **čas**, který musíme čekat. Tak se tento *brute-force* přístup stává nepoužitelný pro velmi krátká hesla (3-4 znaky).

## Jaká nevolit hesla?

`Anička12Facebook!`

| Délka hesla | malá abeceda | velká abeceda | čísla | speciální znaky | počet kombinací | "délka výpočtu" |
|-------------|--------------|----------------|-------|-----------------|------------------|-----------------|
| 17 | ✅ | ✅ | ✅ | ✅ | (26+26+10+32)^17 = 4,722,366,482,869,645,213,696 | 9,444,732,965,739.29 sekund (≈2,623,481,379.37 hodin / ≈109,312,557.47 dní / ≈299,502.88 let) |

Dle tabulky a našeho vzorového výpočtu by člověk řekl, že se jedná o velmi bezpečné heslo, které by trvalo uhádnout cca 300 let, což pro existeční potřeby člověka je dostatečně dlouhá doba. 

Problém nastvá při použití obdobných hesel na dalších stránkách:
- `Anička12Instagram!`
- `Anička12Twitter!`
- `Anička12Snapchat!`
- `Anička12Linkedin!`
- `Anička12Gmail!`
- `Anička12Microsoft!`

Za keždým algoritmem pro lámání hesel stojí zkušený hacker s analitickým mozkem a snaží se nalézt nějaké vzory. Pokud se mu například podaří pořídit nějaký data-leak z velké organiazce, který by obsahoval plain-text adresy, nicky, hesla,... Tak mu nedá moc práce dovtípit se jaká má hádat hesla pro další platformy tohoto uživatele.

```csv
email,username,password
...
anicka12@gmail.com,anicka12,Anička12Facebook!
pepa97@seznam.cz,pepa97,Xvql!12s
...
```

Proti tomu Pepa97 má silné heslo, které neobsahuje žádný vzor a je náhodně generované. Má sice jenom 8 znaků, ale obsahuje velká i malá písmena, čísla a speciální znaky. Když se Pepa ve zprávách dozví o úniku dat z nějaké platformy, tak si změní jenom jedno heslo a ostatní jeho účty zůstanou v bezpečí.

> [!tip]
> Únik dat můžete snadno zkontrolovat na stránkách [haveibeenpwned](https://haveibeenpwned.com/).

## Úkol pro čtenáře

Doplněte tabulku o další řádky s různými kombinacemi délky a znaků v hesle. Zkuste najít nějaké vzory, které by mohly být použity při lámání hesel.

> [!question]
> Je heslo `4h0jP3p0!' silné heslo?

## Zdroje a reference
- [avast: Random Password Generator](https://www.avast.com/random-password-generator)