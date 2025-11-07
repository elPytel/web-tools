# Generátor signálů

Tato stránka ukazuje **základní průběhy** (sinus, čtverec, trojúhelník, pila), jejich **spektrum** a **audio výstup**.

## Frekvence a logaritmická škála
U ucha vnímáme frekvenci logaritmicky. Proto slider 0–1 mapujeme na 50–20 000 Hz pomocí:

$$
f = 50 · (20000/50)^x
$$


## Rectifikace (nelinearita)
- **Půlvlnná:** \( y = \max(0, x) \)
- **Plnovlnná:** \( y = |x| \)

V obou případech vznikají **nové harmonické** → ve spektru uvidíš čáry tam, kde předtím nebyly.

## Additivní syntéza
Zvuk lze skládat jako součet sinusů:
\[
s(t) = \sum_k a_k \sin(2\pi k f_0 t + \phi_k)
\]
Presety (Flute, Clarinet, Violin) ukazují různé **tóny barvy** díky rozdílným amplitudám harmonických.

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

> [!warning] Bezpečnost: 
> Začínej vždy s nízkou hlasitostí. V aplikaci je kompresor/limiter, ale se sluchátky buď opatrný.
