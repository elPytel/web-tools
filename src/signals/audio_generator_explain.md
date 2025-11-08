# Generátor signálů

> [!warning] Bezpečnost: 
> Začínej vždy s nízkou hlasitostí **<10%**! V aplikaci je kompresor/limiter, ale se sluchátky buď opatrný.

Tato stránka ukazuje **základní průběhy** (sinus, čtverec, trojúhelník, pila), jejich **spektrum** a **audio výstup**.

## Frekvence a logaritmická škála
U ucha vnímáme frekvenci logaritmicky. Proto slider 0–1 mapujeme na 50–20 000 Hz pomocí:

$$
f = 50 · (20000/50)^x
$$

## Rectifikace (nelinearita)
- **Půlvlnná:** $y = \max(0, x)$
- **Plnovlnná:** $y = |x|$

V obou případech vznikají **nové harmonické** → ve spektru uvidíš čáry tam, kde předtím nebyly.

## Additivní syntéza
Zvuk lze skládat jako součet sinusů:
$$
s(t) = \sum_{k=0}^{n} a_k \sin(2\pi k f_0 t + \phi_k)
$$

- $k$ je index, který prochází hodnoty od 0 do $n$ (počet harmonických).
- $n$ je celkový počet harmonických frekvencí, které přidáváme k základní frekvenci $f_0$.
- $a_k$ je amplituda (hlasitost) každé harmonické frekvence.
- $f_0$ je základní frekvence (první harmonická).
- $\phi_k$ je fáze každé harmonické frekvence.

Fáze ($\phi_k$) může ovlivnit zvuk, ale v tomto jednoduchém modelu ji často nastavujeme na 0 pro všechny harmonické.

Presety (Flute, Clarinet, Violin, ...) ukazují různé **barvy tónů** díky rozdílným amplitudám harmonických frekvencí ve spektru.

### Příklad

Například nástroj Flute (flétna) má harmonické s amplitudami:
```txt
1:1, 2:0.18, 3:0.1, 4:0.06, 5:0.03
```
> [!tip] Formát: 
> `n:amp` představuje jednotlivé složky, které jsou oddělené čárkami `,`. Amplituda je z rozsahu: (0–1).

- $n$ - číslo harmonické (1 = základní frekvence, 2 = 1. harmonická, 3 = 2. harmonická, ...)
- $amp$ - amplituda harmonické frekvence (0–1) (poměr k základní frekvenci)

V našem případě to znamená:
1. harmonická (základní frekvence) má amplitudu `1`
2. harmonická má amplitudu `0.18`
3. harmonická má amplitudu `0.1`
4. harmonická má amplitudu `0.06`
5. harmonická má amplitudu `0.03`

Symbol suma ve vzorečku:
$$\sum_{k=0}^{n}$$
Představuje součet všech harmonických od $k=0$ do $k=n$.

Výpočet signálu $s(t)$ v čase $t$ zahrnuje výpočet hodnoty každé harmonické frekvence a jejich sečtení.

```
s(t) = a_k * sin(2π * k * f_0 * t + φ_k) + ...
```
- $φ_k = 0$ 
- $sin(x)$ - chceme generovat sinusový průběh pro každou harmonickou.

Dosadíme hodnoty pro každou harmonickou a sečteme je, abychom získali výsledný signál $s(t)$.

```
s(t) =	
	1.00 * sin(2π * 1 * f_0 * t) + 
	0.18 * sin(2π * 2 * f_0 * t) + 
	0.10 * sin(2π * 3 * f_0 * t) + 
	0.06 * sin(2π * 4 * f_0 * t) + 
	0.03 * sin(2π * 5 * f_0 * t)
```

- $f_0$ je základní frekvence (nastavená uživatelem, například 440 Hz).

## FFT a zobrazení
- **Osciloskop** = časová doména
- **Spektrum** = magnituda vs. frekvence (log-f osa)

### FFT rozlišení (počet vzorků)
- FFT (Fast Fourier Transform) pracuje nad blokem vzorků délky N (tzv. "FFT size").
- Čím větší N, tím jemnější frekvenční rozlišení (menší šířka "binu").
- Nevýhoda: větší N znamená horší časové rozlišení a větší výpočetní náročnost.
- Praktické tipy:
	- `bins = N / 2` (počet frekvenčních binů zobrazených ve spektru).
	- Frekvenční šířka jednoho binu: `Δf = sampleRate / N`.
	- Běžné volby: 512, 1024, 2048 (výchozí), 4096 — 2048 je dobrý kompromis pro interaktivní vizualizaci.
	- Pokud chceš zvýraznit blízké harmonické, zvol větší N; pokud potřebuješ rychlou reakci na změny signálu, zvol menší N.

## Sinus, sinus, sinus

Všechny základní průběhy (čtverec, trojúhelník, pila) lze vyjádřit jako součet sinusů (Fourierova analýza). 

### Čtvercový průběh

Například čtvercový průběh obsahuje pouze liché harmonické s amplitudami klesajícími s $1/n$:

$$
s_{square}(t) = \sum_{k=0}^{\infty} \frac{1}{2k+1} \sin(2\pi (2k+1) f_0 t)
$$

Tabulka harmonických pro čtvercový průběh:
| Harmonická (n) | Frekvence (Hz) | Amplituda |
|----------------|----------------|-----------|
| 1 (základní)   | $f_0$          | 1         |
| 3 harmonická | $3f_0$       |  1/3       |
| 5 harmonická | $5f_0$       | 1/5       |
| 7 harmonická | $7f_0$       | 1/7       |


### Trojúhelníkový průběh

Trojúhelníkový průběh obsahuje všechny harmonické s amplitudami klesajícími s $1/n^2$:

$$
s_{triangle}(t) = \sum_{k=0}^{\infty} \frac{1}{(2k+1)^2} \sin(2\pi (2k+1) f_0 t)
$$

### Pilový průběh

Pilový průběh obsahuje všechny harmonické s amplitudami klesajícími s $1/n$:

$$
s_{sawtooth}(t) = \sum_{k=1}^{\infty} \frac{1}{k} \sin(2\pi k f_0 t)
$$

### Úlohy

> [!question]
> Vyzkoušej aditivní syntézu tím, že nastavíš různé amplitudy harmonických pro vlastní zvukové průběhy!

Přepiš hodnoty harmonických pro čtvercový (z tabulky výše) do vstupu pro additivní syntézu a poslouchej výsledný zvuk. Podívej se na spektrum a ověř, že obsahuje pouze liché harmonické s očekávanými amplitudami. Jak vypadá amplitudové spektrum?



