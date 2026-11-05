# Sailor Wheel Calculator – Emerald v4.9.4 BÉTA

A Sailor Online felszerelés / Wheel-sor kalkulátora, kipróbálásra szánt **béta verzió**.

## Jellemzők
- 120%-os **Physical és Magical Balance** célértékek CAP szerint, a korábban küldött képből
- Alap STR/INT kézi megadása és aktív SET Wheel-bónuszainak hozzáadása: folyamatosan látható a Balance% és a 120%-ig hiányzó pont
- Az alap STR/INT SET-enként külön mentődik a meglévő JSON-backupba
- Mobilon jól kezelhető, zöld keretes, ténylegesen szerkeszthető soronkénti 100%-os modellmaximum
- CAP + Degree szerint külön menthető STR / INT / HP / MP / Parry / Rate / Critical / Freezing statreferenciák; a meglévő SET-adatok megőrződnek
- 90 / 100 / 110 / 120 / 125 / 130 / 140 CAP
- Normal / SoS / SoM / Sun, CAP- és itemenként külön állítható maximális sorszám (1–30)
- Sorként külön megadható, feltételezett 100%-os modellmaximum; STR/INT értékválasztó követi a beállított sormaximumot (30 felett számmező)
- Már megadott, új maximumot meghaladó értékek láthatók maradnak és figyelmeztetést kapnak
- STR / INT / HP / MP / Attack Rate / Blocking / Parry / Critical / ékszereknél Freezing
- Eredmények, SET Manager, JSON biztonsági mentés
- Visszajelző oldal: `/visszajelzes.html` (kimásolható üzenet; nem küld automatikusan semmit)

## Közzététel Renderen

1. Hozz létre egy **külön GitHub repository-t** (pl. `sailor-wheel-calculator-beta`), a `README.md`, `index.html` és `visszajelzes.html` fájlokkal.
2. Render: **New → Static Site**, csatlakoztasd a GitHub repository-t.
3. Branch: `main`; Build Command: `echo Static beta: no build required`; Publish Directory: `.`
4. Állítsd be a public `onrender.com` linket a Discord tesztelőknek.

A `render.yaml` opcionális Render Blueprint-konfiguráció, a jelenlegi tároló nem tartalmaz ilyen fájlt. Manuális Static Site létrehozásakor a fenti beállításokat használd.

## Adatok és felelősség

A szerver pontos statmaximumai / esélyei **nem teljeskörűen igazoltak**. A program becslésre / közösségi tesztelésre való.
A személyes SET-adatokat a böngésző localStorage tárolja; nincs közös adatbázis. Rendszeresen használj JSON exportot.
A `noindex,nofollow` jelzés nem hozzáférésvédelem: aki megkapja a linket, megnyithatja.
## 120%-os Balance-referencia (2026.11.04-i kép alapján)

| CAP | Physical 120% | Magical 120% | Forrás |
| --- | ---: | ---: | --- |
| 80 | 453 STR | 418 INT | Képen látható |
| 90 | 505 STR | 466 INT | Képen látható |
| 100 | 557 STR | 514 INT | Képen látható |
| 110 | 609 STR | 562 INT | Képen látható |
| 120 | 661 STR | 610 INT | Képletből számított |
| 125 | 687 STR | 634 INT | Képen látható |
| 130 | 713 STR | 658 INT | Képen látható |
| 140 | 765 STR | 706 INT | Képen látható |

A képen megadott képlet szerint `MaxStat = 28 + karakter szint×4`, `Magical Balance = min(120,100×INT/MaxStat)`, `Physical Balance = min(120,100−(100×2/3)×(MaxStat−STR)/MaxStat)`. A kalkulátor alapértelmezésként a CAP-et veszi karakterszintnek, de a karakter tényleges szintje külön beírható. A tényleges játékmechanika ettől eltérhet, ezért a Balance százalék **számított érték**, nem a szerverből kiolvasott mutató.

A karakter **felszerelés nélküli** STR/INT értékeit külön meg kell adni. A kalkulátor a kiválasztott, felszerelt SET **érvényes Wheel-soraiból** származó STR/INT pontokat adja hozzá. A Wheel-en kívüli bónuszokat külön megadhatod, automatikusan nem talál ki más statokat. Hiányzó alapérték esetén a százalék helyén „—” látszik. Az adatok SET-enként megmaradnak, és a JSON mentésbe is bekerülnek.

## Emerald v4.8 – hat új funkció

1. **Wheel-napló és statisztikák:** a „Pörgetés mentése” gombbal rögzített állapotok számát, átlagát, rekordját és egymás utáni javulásait összesíti. A napló nem detektálja a tényleges szerverpörgetéseket; a javulási arány nem dobási esély.
2. **Régi/új Wheel összevetése:** az utolsó mentett eredményt az aktuálissal, illetve két korábbi mentést egymással hasonlít össze. STR/INT és teljes Wheel%-változások.
3. **120%-os Balance célsegéd:** az aktuális CAP-küszöbhöz hiányzó pontokat a meglévő STR/INT sorok saját kézzel beállított maximumával veti össze.
4. **SET-optimalizáló:** a legnagyobb elméleti javulási lehetőséggel rendelkező meglévő sorokat sorolja előre; nem állítja, hogy hány pörgetés kell majd hozzá. Nem feltételez új sorokat vagy bizonyított dobáseloszlást.
5. **SET-összehasonlító:** ugyanazon CAP két mentett szettjének STR, INT, Wheel-minőség, Balance és teljesített itemfeltételeit jeleníti meg. Az aktuális CAP/DG modellmaximummal számol.
6. **JSON-export emlékeztető:** a helyi böngészőben megjegyzi az utolsó **exportindítás** idejét, és 7 nap elteltével figyelmeztet. A tényleges fájl sikeres letöltését a böngészőben kell ellenőrizni.

**Adatmegőrzés:** a `sailor-wheel-calculator-v4` localStorage-kulcs változatlan. A meglévő SET-ekhez és Wheel-előzményekhez kompatibilis mezők kerültek. A korábbi előzmények összehasonlíthatók, de a régi modellezési maximumok nem mindig rekonstruálhatók pontosan.

**Tesztfuttatás** (Node.js 20+; nincs külső csomag): `node --test tests/wheel.test.cjs`. A GitHub Actions PR-ellenőrzés is ezt futtatja. A fizikai Android-böngészős vizsgálat ettől külön teszt.

## Emerald v4.9 – statpont-pontosság, mért Balance, mobilos használat

- A **CAP és a karakter tényleges szintje különbözhet**. A `MaxStat=28+szint×4` képlet és a 120%-os STR/INT határ a karakter szintjéből számol, az alapértelmezett szint a választott CAP.
- A karakter felszerelés és bónusz nélküli STR/INT értékéhez hozzáadódnak az **érvényes**, felszerelt Wheel-statpontok és a külön megadott **egyéb STR/INT bónuszok**. A többszörös beszámítás elkerülése érdekében a bónuszokat ne írd bele újra az alapstatokhoz.
- A hiányos, nem egész vagy **beállított sormaximumot meghaladó STR/INT** értékek nem javítják a SET összpontját és Balance százalékát. Az érték a sor szerkesztőjében megmarad, a hibára figyelmeztetés jelenik meg.
- A Wheel-naplóba csak hibamentes, kitöltött állapotok rögzíthetők. A csak nem pontozható `DUR/OTHER` sorokat tartalmazó érvényes állapotok is naplózhatók.
- A játékban ténylegesen látott **Physical/Magical Balance%** külön megadható és a kalkulált százalékkal összevethető. A ±0,5 százalékpontos eltérést közel egyezőnek jelöljük. A mért számok nem kalibrálják automatikusan a képletet.
- A „Wheel-sorok”, „Balance”, „Célsegéd”, „Optimalizáló”, „SET-ek” részhez mobilon vízszintesen görgethető gyorsnavigáció került. A Wheel-szerkesztő előrébb került.
- Az új mezők SET-enként tárolódnak; a régi JSON-mentések továbbra is használhatók. A `localStorage` kulcsa változatlan.

**Ellenőrzés:** `node --test tests/wheel.test.cjs` futtatja az automatikus regressziós teszteket. Az eredmények matematikai modellek, nem igazolt Sailor Online szerverparaméterek. A tényleges játékkal való eltérés dokumentálható, de a teljes egyezés még közösségi tesztelést igényel.

## Emerald v4.9.1 – automatikus Balance-kisokos és ruha nélküli összevetés

- A CAP kiválasztásakor a karakter szintje alapból megegyezik a CAP-pel, és **látható értékként megjelenik**. Külön is szerkeszthető.
- A `Balance-kisokos` automatikusan mutatja a képen megadott vagy képletből számított **120%-os Physical STR és Magical INT célt**, a képlethez használt `MaxStat` értéket és a 120%-os százalékhatárt. 90 CAP / 90 LVL esetén **505 STR**, **466 INT**, `MaxStat=388`.
- A 120%-os **célérték nem ruházat nélküli karakterstat**. Egy karakter alap STR/INT értéke az elosztott pontjaitól függ, így nem állítható elő kizárólag a CAP/level alapján.
- A saját alap STR/INT megadása után külön megjelenik a **ruha nélküli Balance** és az aktív felszerelt SET + egyéb bónuszok alapján számolt Balance.
- A régi SET-adatok és JSON formátum változatlanok; az adattárolási séma továbbra is 4.9, mert nem kerül be új mező.

## Emerald v4.9.2 – Parry Rate a teljes SET áttekintésében

- A legalsó **Teljes szett – célértékek és állapotok** táblázat most külön **„Parry Rate (Wheel)”** oszlopot mutat minden itemhez.
- Az adott item **legmagasabb érvényes Parry Wheel-sorát** jeleníti meg a sor saját, akár kézzel szerkesztett modellmaximumával és minőségi százalékával. Több sor esetén a legjobb értéket mutatja, nem az összegüket; hibás sorra figyelmeztet.
- Az eddigi, az itemhez kézzel megadott **„Parry külön (kézi) / max”** megmarad külön oszlopban. A két adat nem adódik össze, így nem kerül tévesen duplán beszámításra.
- A meglévő mentések és a 4.9-es adattárolási séma nem változnak; csak a megjelenítés bővült.

## Emerald v4.9.3 – egyetlen Parry Rate oszlop

A teljes SET-táblázatban a korábbi két Parry-oszlop helyett **egyetlen „Parry Rate / max” oszlop** jelenik meg. A Wheel-ről kiolvasott legjobb érvényes Parry-sor **Wheel** jelöléssel látszik (például `+20 / +40 (50%)`). Ha ugyanahhoz az itemhez külön **kézi Parry** értéket is megadtak, az ugyanebben a cellában egy másik sorban jelenik meg. Az értékeket nem adjuk össze és egyik forrást sem töröljük. Hiányzó és hibás sorok kezelése megmaradt.

## Emerald v4.9.4 – áttekinthető SET-összesítő

- A „Teljes SET – átlátható statisztika” **9 főoszlopos** asztali táblázatot és **mobilon külön itemkártyákat** használ (920 px alatt); a részletes STR/INT minőség, egyedi grade, Wheel HP/MP, Attack/Block/Critical, Freezing, cél és hibák lenyithatók.
- Az öt SET-összesítő panel mutatja a **csak felszerelt itemekből** ellenőrzötten számított STR/INT értékeket, az érvényes Attack Rate/Blocking Rate Wheel-sorok összegeit, Critical/Parry sorszámokat, és a **Wheel vs. kézzel rögzített HP/MP** értékeket külön. Ezek **nem mind karakterstatok**; az Attack/Block és Critical/Parry sorösszeg itt leltárstatisztika, nem becsült karakterharci képlet.
- A Parry továbbra is **egyetlen oszlopban**, Wheel: és Kézi: megkülönböztetéssel jelenik meg; nincs duplázás vagy kéretlen összeadás.
- Hibás vagy a saját sormaximumot meghaladó Rate/STR/INT sort nem számol a végösszegbe. A kézzel megadott HP/MP referencia feletti érték látszik figyelmeztetéssel, de nem növeli az összesített kézi bónuszt.
- Hiányzó HP/MP és Attack/Block adatoknál **„—”** jelzi, hogy nincs rögzített adat: ez nem tévesztendő össze a tényleges +0 értékkel.
- Meglévő Wheel-adatok, SET-ek, CAP/DG modellek és JSON-exportok változatlan adattárolási formátumban megmaradnak. A vizuális változások nem jelentenek igazolt Sailor szerveresélyeket.

**Tesztek:** `node --test tests/wheel.test.cjs` (24 regressziós teszt); a fizikai Android/iOS böngészős ellenőrzés ettől külön feladat.

## Emerald v4.9.5 – 9DG Chinese Garment ikonstílus

A vizuális téma alapja a klasszikus **9th Degree (9DG) Chinese Garment**, különösen a Mad Sky Storm itemcsalád. A választott tematika **nem változtatja meg** a CAP / Degree beállításokat, a Wheel-sorok maximumát, a fegyvertípust vagy a mentett SET-eket.

- **Felszerelések:** a Shoulder, Hands, Foot, Head, Chest és Legs sorok külön, Garment-ihletésű, offline vektorikont kapnak. Az ékszerek, fegyver és Shield saját, megkülönböztethető díszítő piktogramot kapnak. Minden ikon mellett megmarad a kiírt itemnév.
- **Statok:** STR = **piros erő**, INT = **kék mana/kristály**, HP = szív, MP = kék vízcsepp, Parry = keresztezett pengék, AR = támadás, BR = pajzs, Critical = célkereszt, Freeze = hópehely. Tooltip minden ikon mellett. A statértékek és a már rögzített megnevezések változatlanok.
- Az ikonok a 12 elemes itemlistában, a szerkesztő fejlécében, a Wheel-soroknál, a statmezőknél, a SET végső táblázatában és a mobilos itemkártyákon jelennek meg.
- **Fontos jogi és technikai különbség:** a beépített SVG-piktogramok **saját, stilizált grafikai elemek**, **nem eredeti Silkroad Online kliens- vagy inventory-iconfájlok**. A 9DG témát a [9th Degree Chinese Garment itemek](https://sroway.com/threads/silkroad-online-chinese-garment-list-lv-1-101.1400/) alapján neveztük el. Eredeti fájlokat csak megfelelő jogosultságú, megbízható forrásból szabad később a helyükre tenni.
- A piktogramok közvetlenül az egyfájlos HTML-ben vannak; **nincs külső ikon-CDN**, így az offline jelleg és a JSON-mentés megmarad.

Tesztelés: a `node --test tests/wheel.test.cjs` regressziós tesztek ellenőrzik a 12 item ikonját, a piros STR/kék INT színét, a neveket és a számítások változatlanságát. Valódi mobilböngészős megjelenítési teszt külön feladat.
