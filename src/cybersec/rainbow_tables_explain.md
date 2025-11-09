# Lámání zaheshovaných hesel

Této části předcházejí informace o tom jak generovat hesla v nástroji [password-generator.md](./password_generator_explain.md).

> [!warning]
> Toto je **simulovaný** výukový nástroj. Používání obdobných nástrojů na cizí hesla v obdobných "penetračních" je nelegální!

## Uniklá data

Běžne při úniku dat z databáze hacker nedostane do rukou rovnou plan-text soubory s hesly. Hesla se standardně ukládájí v zaheschované podobě. 

Takový soubor může vypadat například takto:
```csv
email,hash,salt,reg_date
...
```

## Solíme hesla

Krátce a přímo — jak se v tomto kódu vytváří „posolené“ zahashované heslo:

1. Výběr vstupů  
   - generuje se email a regdate (funkce randEmail(), randDate()).  
   - vybere se plain heslo (z poolu nebo náhodné).

2. Volba módu soli (saltMode): none / per-user / regdate.  
   - none = žádná sůl (salt = '').  
   - per-user = náhodná hex sůl délky saltLen (makeSalt(len, null, 'random') → crypto.getRandomValues).  
   - regdate = deterministická sůl odvozená z data registrace (makeSalt(len, regdate, 'regdate') → SparkMD5.hash(regdate) a případné doplnění do požadované délky).

3. Umístění soli (saltPos): prefix nebo suffix.  
   - Pokud je prefix: salted = salt + pwd  
   - Jinak: salted = pwd + salt

4. Vypočet hashe (digestText):  
   - Pokud je algoritmus MD5: používá se SparkMD5.hash(text) (synchronně, vrací hex).  
   - Jinak (SHA‑1, SHA‑256): používá se Web Crypto API crypto.subtle.digest(name, encoder.encode(text)), výstup se převede na hex.

5. Uložení záznamu do DB objektu: { id, email, hash, salt, regdate, cracked:false, plain:null, orig: pwd }.

## Rainbow tables
Rainbow tables (duhové tabulky) jsou předpočítané tabulky používané k lámání hashovaných hesel. Umožňují rychlejší nalezení původního hesla z jeho hash hodnoty pomocí předpočítaných řetězců.

Rainbow tables fungují hlavně proti rychlým hashům bez soli (např. MD5/SHA-1).
Protiopatření: unikátní salt pro každé heslo + pomalá KDF (Argon2id/bcrypt/scrypt),
což dělá předpočítávání tabulek neefektivní.

## Zdroje a další čtení
- [github: SecLists](https://github.com/danielmiessler/SecLists)