# Generátor signálů (MVP)

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

> [!warning] Bezpečnost: 
> Začínej vždy s nízkou hlasitostí. V aplikaci je kompresor/limiter, ale se sluchátky buď opatrný.
