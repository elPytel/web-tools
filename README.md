# web-tools

![index](./src/assets/WebTools.png)

- [web-tools](#web-tools)
- [Průvodce pro vývojáře](#průvodce-pro-vývojáře)
  - [Instalace Node.js](#instalace-nodejs)
    - [Pomocí winget](#pomocí-winget)
    - [Přidání do PATH](#přidání-do-path)
  - [Spouštění testů](#spouštění-testů)
    - [Pouze Vitest](#pouze-vitest)
  - [Spuštění v prohlížeči](#spuštění-v-prohlížeči)
    - [S podporou načítání skriptů (lokální server)](#s-podporou-načítání-skriptů-lokální-server)

# Průvodce pro vývojáře

Níže jsou kroky, jak si projekt otestovat lokálně ve Windows pomocí PowerShellu.

## Instalace Node.js
Pokud ještě nemáte nainstalovaný Node.js (obsahuje npm), stáhněte LTS verzi z https://nodejs.org/ nebo použijte správce balíčků.

### Pomocí winget

V PowerShellu spusťte:
```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

### Přidání do PATH

Pokud instalátor nainstaloval Node do `C:\Program Files\nodejs`, ale příkazy `node`/`npm` nejsou dostupné v terminálu, můžete tuto složku přidat do uživatelského PATH:

```powershell
# Získat současný uživatelský PATH
$userPath = [Environment]::GetEnvironmentVariable('Path','User')

# Pokud cesta ještě není přítomná, připojíme ji a uložíme
if ($userPath -notlike '*C:\Program Files\nodejs*') {
  $newUserPath = 'C:\Program Files\nodejs' + ';' + $userPath
  [Environment]::SetEnvironmentVariable('Path', $newUserPath, 'User')
  Write-Output 'Cesta k Node byla přidána do uživatelského PATH. Otevřete nové PowerShell okno.'
} else {
  Write-Output 'Cesta již byla v uživatelském PATH.'
}
```

Po provedení této změny zavřete a znovu otevřete PowerShell a ověřte instalaci:

```powershell
node -v
npm -v
```

## Spouštění testů
V kořenovém adresáři projektu spusťte:

```powershell
cd E:\Git\web-tools
npm install    # nebo 'npm ci' pokud máte package-lock.json
npm test
```

### Pouze Vitest
Pokud chcete nainstalovat pouze Vitest jako dev-dependenci a spustit testy:

```powershell
npm install --save-dev vitest@latest
npm test
```

Očekávaný výsledek: Vitest spustí testy z adresáře `tests/` a měly by projít (zelené).

## Spuštění v prohlížeči

Pro prohlížení nástrojů v prohlížeči otevřete `src/index.html`.

> [!warning]
> Některé funkce nemusí fungovat správně při přímém otevření souboru v prohlížeči kvůli omezením CORS a bezpečnostním politikám. Doporučuje se použít lokální HTTP server.

### S podporou načítání skriptů (lokální server)

Pro spuštění projektu v prohlížeči s podporou ES modulů použijte lokální HTTP server. Například:

```powershell
# Python 3
python -m http.server 8000 --directory src
```