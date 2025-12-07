# Transposition cipher

The columnar transposition cipher **does not change the letters themselves**, it only **reorders them**.

- Input: `TAJNYUTOK`
- Output: `NOXJTXTYKAUX` (the same letters, different order)

> [!important]
> Unlike substitution ciphers (Caesar, Vigenère …), the **letter frequency remains the same** — the letters are just "shuffled".

## Basic idea

High-level steps:

1. **Pick a key** — typically a word or a numeric ordering.
2. Write the text into a **grid** (table).
3. Read the letters from the table in a different order — according to the key.

That produces the ciphertext. Decryption reverses the same steps.

## Columnar transposition

### 1. Keyword → column numbering

Choose a keyword, e.g.:

```text
KLÍČ
```

Convert it into an ordering according to the alphabet:

- Sort the letters Č, I, K, L → **Č (1)**, **Í (2)**, **K (3)**, **L (4)**

| Letter |  K |  L |  Í |  Č |
| ------:| -: | -: | -: | -: |
| Order  |  3 |  4 |  2 |  1 |

> [!note]
> If the keyword contains repeated letters, the usual rule is to break ties from left to right: identical letters receive order numbers according to their position.

### 2. Writing the text into the grid

Text:
`TAJNYUTOK` (no spaces, no diacritics; uppercase for clarity)

The key has 4 characters ⇒ the grid will have 4 columns:

| K (3) | L (4) | Í (2) | Č (1) |
| ----- | ----- | ----- | ----- |
| T     | A     | J     | N     |
| Y     | U     | T     | O     |
| K     | X     | X     | X     |

Remaining cells are padded with a chosen character (e.g. `X`).

### 3. Reading columns in key order

Read columns according to their numeric order:

1. Column with number 1 (Č): `N O X`
2. Column with number 2 (Í): `J T X`
3. Column with number 3 (K): `T Y K`
4. Column with number 4 (L): `A U X`

Result:

```text
NOXJTXTYKAUX
Ciphertext: `NOXJTXTYKAUX`
```

## Decryption (basic variant)

1. You know:

   * the keyword (e.g. `KLÍČ`),
   * the ciphertext length (e.g. 12 characters),
   * the grid width (number of letters in the key = 4).

2. Compute the number of rows:

```text
rows = ceil(text_length / num_columns)
     = ceil(12 / 4) = 3
```

3. Create an empty 3×4 grid and split the ciphertext **by columns** according to the key order:

* the first piece fills the column with order 1 (Č),
* the second fills the column with order 2 (Í),
* and so on.

4. Read the grid **row by row** → you recover the original plaintext (without padding).

## Advanced variants

The tool can offer advanced options that significantly change the cipher's behaviour and also demonstrate ways to increase security.

### Double transposition

Double transposition means performing the same (or a different) transposition twice in a row.

Procedure:

1. Encrypt the plaintext using key A and direction A.
2. Take the result and **encrypt it again** using key B and direction B.

Example:

```text
PLAIN → (Transposition with key A) → T1 → (Transposition with key B) → T2
```

T2 is the final ciphertext.

> [!tip]
> The tool may provide a `Double transposition` checkbox and a second key field.

- Variant 1: use the same keyword twice
- Variant 2: use two different keywords (`KEY1`, `KEY2`)
- Variant 3: use a different read/write direction in the second pass

### Write/read directions

Besides the "standard" write-left-to-right by rows and read top-to-bottom by columns, you can demonstrate other combinations:

#### Write direction:

- ▶ **rows left→right** (classic)
- ◀ rows right→left
- 🔽 columns top→bottom
- 🔼 columns bottom→top

#### Read direction:

- by **columns top→bottom** (classic),
- by columns **bottom→top**,
- row-wise left→right / right→left.

> [!example]
> The tool should expose options like:
>
> * "Write: rows left→right / rows right→left / columns…"
> * "Read: columns ↓ / columns ↑ / rows → / rows ←"

This nicely illustrates how the same grid can yield many different ciphers.

### Custom padding character

By default we pad with `X`. In practice:

- sometimes `X`,
- sometimes `Q`,
- sometimes random letters.

In the tool:

- a single-character `Pad character` input,
- optionally a `Random padding` option (harder for cryptanalysis).

> [!warning]
> For decryption you must **know** whether padding was used and where the real text ends. For a simple demo you can:
>
> * always pad,
> * show the decrypted text including `X` and explain the padding.

### Preserve/remove spaces and diacritics

> [!question]
> How to handle texts in languages with diacritics?

Tool options:
- "Remove spaces and punctuation" (classic crypto text)
- "Keep spaces at their positions" (transpose letters only)
- "Replace diacritics" (`Á→A`, `Č→C`, …)

```text
ORIGINAL:  "Ahoj světe!"
NORMAL:    "AHOJSVETE"    (no spaces or diacritics)
CIPHERTEXT: e.g. "AESVTJEOH"
```

## Exercises for the reader / student

1. Encrypt the same text with three different keys and compare the results.
2. Try toggling:

   * text normalization,
   * preserving spaces.
     How does the ciphertext readability change?
3. Produce ciphertexts using:

   * a single transposition,
   * a double transposition.
     Compare how different the outputs are.
4. Try to manually (without the tool) decrypt a short text encrypted with a transposition using a key of length 4. What information does the **key length** reveal?

## Links

- [Transposition cipher (Wikipedia)](https://cs.wikipedia.org/wiki/Transpozi%C4%8Dn%C3%AD_%C5%A1ifra)