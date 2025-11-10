# MIDI

MIDI (Musical Instrument Digital Interface) je technický standard pro komunikaci mezi elektronickými hudebními nástroji, počítači a dalšími zařízeními. Umožňuje přenos hudebních informací, jako jsou noty, dynamika, tempo a další parametry, mezi různými zařízeními.

MIDI neobsahuje skutečný zvuk, ale spíše instrukce pro generování zvuku na základě těchto informací. To znamená, že MIDI soubor sám o sobě neobsahuje zvuková data, ale spíše "noty" a další informace, které říkají hudebnímu zařízení, jak má tyto noty přehrát.

> [!tip]
> Je to jako příkazy dirigenta pro orchestr - říká, které nástroje mají hrát, kdy a jak hlasitě, ale neobsahuje samotný zvuk orchestru.

Výhody MIDI:
- Malá velikost souborů: MIDI soubory jsou obvykle mnohem menší než audio soubory, protože neobsahují skutečný zvuk.
- Flexibilita: MIDI umožňuje snadné úpravy not, tempa, nástrojů a dalších parametrů bez ztráty kvality zvuku.
- Široká kompatibilita: MIDI je podporováno mnoha hudebnímimi nástroji a softwarem.

Odbočka do historie

Ve starých počítačových hrách jako je jsou Mario, Princ of Persia a podobné autoři chtěli přidat zvuk, který by podbarvil děj na obrazovce.

Odbočka do ještě větší historie

Při přechodu z vinilových desek (analog) na CD (digitál) byl zvolen takový datový tok (vzorkovací frekvence a rozlišení na kanál), že bylo možné na jeden disk CD o velikosti cca 700MB uložit jednu hudební nahrávku (zjistit jakou si japonci vybrali) v bezztrátové (lossles) kvalitě. Až s příchodem formátů jako je `.mp3` a podobné, který jsou ztrátové (neukládají celý popis audio nahrávky jako, ale odfiltrují to co lidské ucho "neslyší") se podařilo jednu písničku srazit na velikost cca 3MB. Což umožnilo vznik kapesních mp3 přehrávačů.

V době prvních počítačových her se většina sw distibuovala na disketách (2,4MB), nebo na magnetických páskách. A pro takovou počítačovou hru by si autoři nemohli dovolit na disketu uložit byť jen jednu písničku v mp3 kvalitě (3MB). Proto se rozhodli použít MIDI, které zabíralo jen pár kB a přehrávalo se pomocí zvukové karty počítače.

Na přehrávání midi potřebujete orchest

Staré zvukové karty obsahovaly systetizátory zvuku (hudby), které byli dělené do kanálů (co kanál to jeden hudební nístroj), zpravidla jich měli jen několik a často ne každý kanál dovedl syntetizovat veškeré hudební nástroje. 

## MIDI zprávy
MIDI komunikace probíhá prostřednictvím MIDI zpráv, které jsou krátké datové pakety obsahující informace o hudebních událostech. Některé běžné typy MIDI zpráv zahrnují:
- Note On/Off: Označuje začátek a konec hraní noty.
- Control Change: Umožňuje změnu různých parametrů, jako je hlasitost, modulace nebo efekty.
- Program Change: Umožňuje změnu nástrojů nebo zvukových presetů.
- Pitch Bend: Umožňuje jemné ladění výšky tónu. 

## MIDI kanály
MIDI zařízení mohou komunikovat na různých kanálech (0-15), což umožňuje více nástrojům nebo stopám hrát současně bez vzájemného rušení. Každý kanál může být přiřazen k jinému nástroji nebo zvuku, což umožňuje komplexní hudební aranžmá.