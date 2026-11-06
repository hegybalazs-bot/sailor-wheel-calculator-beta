# Wheel Calculator – Emerald v5 ADMIN PREVIEW (BÉTA)

## Interaktív Wheel-lépéstervező — kizárólag webes, kézi működés

A **Következő Wheel / Pen esélye** fülön a Wheel of Fate / Wheel of Fortune / Feather Pen lépések között válthatsz. A sorszámcél, a meglévő Blue-sorok áttekintése és egy kiválasztott sor Pen-célértéke **csak a böngészőben** működik. A tervek külön mentődnek itemenként, SET-enként és CAP-onként, a JSON-mentésben is megmaradnak.

**Nem befolyásolja a játékot:** a kalkulátor nem kapcsolódik Silkroad-klienshez, játékosfiókhoz, bothoz vagy játékszerverhez, nem küld parancsot, nem pörget és nem változtat itemet. A játékos a valódi eredményt manuálisan viszi fel. A főoldal CSP-vel tiltja az API- és WebSocket-kapcsolatokat. Részletes technikai szabályok: [WEB_ONLY_MANUAL_PLANNER.md](docs/WEB_ONLY_MANUAL_PLANNER.md).


A Silkroad Online szerverekhez használható felszerelés- és Wheel-sor-kalkulátor, kipróbálásra szánt **béta verzió**. Alapértelmezett profilja: Sailor Online.

**Nyelv:** magyar / angol, a felső **Nyelv / Language** kapcsolóval; a választást a böngésző helyben megőrzi. A súgó és a visszajelző oldal is kétnyelvű. [English user guide](README_EN.md) · [Ellenőrzött v5.0 kiadási lista](docs/ROADMAP_V5.md).


## Emerald v5 Admin Preview – új bemutató és játékosfunkciók (2026-11-06)

**Admin bemutató:** [bemutato.html](https://sailor-wheel-calculator-beta.onrender.com/bemutato.html) – mobilbarát, kétnyelvű prezentáció a jelenlegi lehetőségekről és korlátokról.

- **Wheel-folyamat:** a Wheel of Fate, Wheel of Fortune és Feather Pen külön megmagyarázott szakaszai. A szerverfüggő mechanikák nincsenek ellenőrzött tényként feltüntetve.
- **Költségtervező:** minden CAP/szerverprofil saját, kézzel beírt Fate/Fortune/Pen árakkal és tervezett darabszámokkal; Gold, Silk vagy egyedi közös pénznem. Nem jósol valódi árakat, sikeres pörgetéseket vagy Gold–Silk árfolyamot.
- **Admin DEMO SET:** 90, 100 és 130 CAP-hoz egy kattintással külön **kitalált példa-SET** hozható létre. A meglévő SET-ek változatlanok. A példák nem igazolt játékosdobások.
- **SET megosztás:** csak olvasható URL-fragmentum az aktív SET felszerelési soraival; nem exportál mentési előzményeket, másik SET-et, profilbankot vagy feltöltött képet. Megtekintése nem importálja és nem írja felül a saját adatokat.
- **Adatforrások:** szerverprofilon belül CAP/DG szerint külön játékos által megadott HTTPS-forráslink, megjegyzés és ellenőrzésre váró státusz. Az alkalmazás NEM hitelesíti automatikusan az admin jóváhagyását.
- **Eredeti ikonok:** továbbra is az üres, ellenőrzött ikontárra előkészített rendszer és helyettesítő grafika az alap. A Media.pk2 fájlokat és jogvédett képeket nem tesszük közzé automatikusan.

**Fontos:** a 83 korábbi tesztet kibővítettük; a Node tesztek és a Render deploy sikere nem helyettesíti a valós böngészős/mobilos és játékbeli ellenőrzést. A v5 jelzés **PREVIEW, nem végleges kiadás**. A statmaximumok és dobási esélyek szerverfüggők lehetnek.

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

## Emerald v4.9.6 – automatikus javulásbecslés itemenként és eredeti képek betöltése

### Azonnali becslés a kijelölt itemhez
Ha kiválasztod például a **Shoulder** itemet és megadod az összes pontozott Wheel-sor típusát, értékét, valamint a szerkeszthető soronkénti maximumát, a **Szett & itemek** és a **Következő Wheel / Feather Pen** nézetben azonnal megjelenik az automatikus becslés:

- **Javulás**: a következő értéksor a jelenleginél nagyobb átlagos Wheel-minőséget ad.
- **Változatlan**: azonos átlagos Wheel-minőség.
- **Romlás**: alacsonyabb átlagos Wheel-minőség.
- **Nem javul**: a változatlan és a romlás együtt.
- Külön jelenik meg a **STR+INT összpontszám növekedésének modellezett esélye**, ha az itemen van STR/INT sor.

A becslés **20 000 determinisztikus Monte Carlo próbadobással** készül; nem igényli a sorok esélyeinek manuális kitöltését, és automatikusan frissül az itemek és statok változásakor. **Feltételezés:** az item Wheel-sorainak típusa és száma **nem változik**, csak az egyes, már ismert sorok értéke; a sorsolás a beállított `1…maximum` tartományon belül *egyenletes* (Freezing esetén 0,1 lépéssel). Az összes számszerű, pontozott sor azonos súllyal szerepel a Wheel-minőségben, a Durability és az Egyéb nem pontozott. A kijelzett százalék a **feltételes modell eredménye**, **nem ellenőrzött szerveresély**, és nem jósolja meg az eltérő sorösszetételű újrapörgetést. Ez utóbbihoz az eddigi kézi teljes-újrapörgetés modell megmarad. **Hiányos vagy érvénytelen sorok esetén nem jelenítünk meg kitalált százalékot.**

### Eredeti Silkroad inventory ikonok saját képből
A felszereléslista alján az új **„Eredeti Silkroad ikonok betöltése”** kinyitható panellel a 12 felszerelési slothoz külön **PNG vagy WebP** ikon választható (maximum 96 KB / kép). A betöltött kép automatikusan és mindenhol lecseréli a v4.9.5-ben készült stilizált SVG-t, az **ikon + szöveg** formátum megmarad. A saját képek is bekerülnek a helyi mentés és a JSON-export adataiba, más CAP és SET esetén is látszanak; külön törölhetők, amivel a vektoros helyettesítő visszaáll.

**A csomag nem tartalmazza az eredeti Silkroad 9DG játékikonokat**: azokat a felhasználó tölti fel megbízható, jogszerűen használható PNG/WebP fájlból. A Silkroad kliens ikonjai jellemzően a `Media.pk2` / `.ddj` formátumhoz kötődnek, amit először képformátumba kell alakítani. A program nem nyúl a játék klienséhez. Az ikonok helyi fájlok, **nincs külső képlink és nincs automatikus szerverfeltöltés**.

A meglévő SET-adatok, szabályok, JSON-visszatöltés és alapvető képlet változatlan; a tárolás szerkezete visszafelé kompatibilis.

**Teszt:** `node --test tests/wheel.test.cjs` – 33 automatizált regressziós teszt. Mobilos valós eszközteszt még hátravan.

## Emerald v4.9.7 – Blue-típusok itemenként, KEEP / REROLL

### Különböző Blue-fajták felszerelésenként

A kalkulátor a **lehetséges különböző Blue-típusok** Silkroad R-listájával indul (nem a Wheel sorok darabszámával):

| Item | Blue-fajták |
| --- | ---: |
| Shoulder (Talisman), Hands (Wristlet), Foot (Shoes) | 4 mindegyik |
| Head (Hat), Legs (Trousers) | 6 mindegyik |
| Chest (Suit) | 7 |
| Earring, Necklace | 8 mindegyik |
| Ring 1, Ring 2 | **10 mindegyik** |
| Weapon | 6 |
| Shield | 5 |

A **Chest** speciális „HP/MP Recovery” típusa; a **Shield** külön „Critical Ratio” típusa; az ékszerek többféle státuszellenállással (Freeze, Burn, Electric Shock, Poison, Zombie, valamint ékszertípustól függő Stun / Combustion / Disease / Sleep / Fear) szerepelnek.

Források: [SRO Wheel itemenkénti Blue-lista](https://www.srolobby.com/konular/silkroad-online-wheel-sistemi-fate-fortune-pen.1422/) és [Eris Wheel magyarázat](https://www.eris-silkroad.online/guide/system). **A lista iSRO/Silkroad R referencia, nem Sailor által megerősített.** Ha egy 90 CAP / 9DG itemnél más típusok lehetségesek, a panelen hozzáadhatók vagy kikapcsolhatók.

A **Szett & itemek** fülön a Blue-katalógus mutatja az adott item típusait; a nagy SET-összesítő alatt egy **12 itemes típusáttekintő** is van. Az aktív lista külön mentődik **CAP + Degree + item** szinten a böngészőben és a teljes JSON-exportban. A felhasználó által kikapcsolt típusok **nem törlik** a már rögzített Wheel-sorokat: a kalkulátor figyelmeztet az eltérésre, és azok szerkeszthetők maradnak. A szerszám oldali sorválasztók és az „összetétel” gyorskitöltés a kiválasztott Blue-típusokat ajánlják fel.

### Megtartás vagy újrapörgetés?

- A **Feather Pen** rendszerének megfelelő *feltételes* képlet egy jelenlegi Wheel-sorból választ egyet azonos eséllyel, és annak **értékét** a beállított 1…maximum tartományból egyenletesen újrasorsolja. Az eredményből pontosan számolja a **javulás / változatlan / romlás / nem javul** arányokat a teljes Wheel-minőségre. Ha a kiválasztott sor Durability, nem változik a pontozott Wheel-minőség. Egyéb vagy hibás sorok, ismeretlen maximumok esetén **nem ad kitalált esélyt**.
- Az „**Inkább tartsd meg / Újrapörgetés mérlegelhető / Mérlegeld a kockázatot**” tanácsok *heurisztikus döntéstámogatást* adnak: a felhasználó célját és a modellezett javulási arányt veszik figyelembe. Az item előírt STR/INT sorai és Weapon/Shield speciális Rate-feltételei hiányakor **nem ajánlja a Feather Pent**, mert az értékújradobás nem hoz létre új típusú Blue-sorokat.
- A **Wheel of Fortune** a sorok **típusát is módosíthatja**. A Pen modell eredményét **nem szabad** Fortune esélynek nevezni, mert a valódi Blue-típus gyakorisága ismeretlen. A régi 20 000 próbadobásos „minden sorérték újrahúzása” külön hipotetikus összehasonlítás marad, nem a Pen valódi működése.
- A 30 000 próbadobásos **teljes-újrapörgetés** kézi modellje is itemenkénti Blue-készletből dolgozik. A valós típusesélyek **nincsenek előre kitöltve**; minden engedélyezett típushoz 0–100%-os feltételezés kell, összesen 100%. A szervermaximum nélküli státusz-Blue-oknál **külön 100%-os maximumot** is kell megadni, ha pozitív esélyt kapnak. Az ilyen maximumok külön CAP/Degree profilban tárolódnak. Az egyenlő eloszlás kizárólag felhasználó által választott **DEMÓ** feltevés, nem hivatalos érték.

**Fontos:** a Sailor szerver eredeti Blue gyakoriságai, Feather Pen sorválasztási súlyai és értékeloszlásai jelenleg ismeretlenek. Egyetlen kijelzett százalék vagy tanács sem bizonyítja a játék tényleges esélyét, és a program nem számol Silk/Gold költséggel. Ezeket a valódi játékadatokkal később hitelesíteni kell.

Tesztek: `node --test tests/wheel.test.cjs` – **45 automatizált teszt**, a végleges CI-ellenőrzéssel. Valódi mobilböngészős vizuális teszt külön szükséges.

## Emerald v4.9.8 – több szerver, CAP bevitel, összes Blue és véglegesített statkorlátok

- Az alkalmazás látható neve **Wheel Calculator**. Az alapértelmezett szerverprofil neve **Sailor Online**, de további, egymástól független nevű Silkroad szerverprofilok létrehozhatók/átnevezhetők/kiválaszthatók. Profilonként külön CAP, Degree, SET-ek, Blue-katalógusok és szerveres maximumok mentődnek.
- A CAP választható legördülő menüből vagy közvetlenül begépelve (1–200, egész szám). A 90, 100, 110, 120, 125, 130 és 140 CAP külön menthető és visszatölthető. Új CAP kiválasztása csak új CAP-profilt készít, a többi CAP mentését nem törli.
- A „**Teljes SET – Blue-k és statok**” összesítő most minden felszerelésnél megjeleníti az adott item **összes lehetséges Blue-fajtáját**, a kitöltött típusokat saját értékkel / maximummal / százalékkal, a hiányzókat „Nincs az itemen” jelzéssel és az alaplistán kívül beírt sorokat figyelmeztetéssel. Az asztali táblázat 10 főoszlopos, a mobilkártyák saját lenyitható Blue-listát kapnak. A Blue-lista **nem** ad hozzá automatikusan új Wheel-sort, és a különböző típusok száma **nem** az egyszerre pörgethető sorok maximális száma.
- **Pontosított, közös statkorlátok a felhasználó által megadott szabály alapján:** minden szerveren és CAP-on **STR max +11 / sor, INT max +11 / sor**; minden szerveren **Durability maximum 200%**, nem pontozott Wheel-minőségként; **130 CAP-től HP maximum 2300, Parry maximum 60**. Ezek a korlátok új profiloknál, más Degree beállításnál és régebbi mentések visszatöltése után is érvényesek. A régi, föléjük eső Wheel-sorokat nem töröljük; hibásnak jelöljük, és nem számoljuk érvényes statnak.
- A **130+ HP 2300 és Parry 60** a közös felső határ. A 140 CAP MP referencia egyelőre azonos a 130 CAP MP értékével: **2300**; az esetleges későbbi szerverfrissítéstől függetlenül továbbra is szerkeszthető referencia.
- A teljes JSON-export **minden szerverprofil adatait tartalmazza**. A korábbi Sailor-only JSON mentés importálható; a böngészőben korábban tárolt régi SET-eket az új szerverprofil-rendszer migrációja nem törli. A legbiztonságosabb, ha szerverváltás előtt és után rendszeresen JSON-exportot készítünk.

**Ellenőrzés:** a `tests/wheel.test.cjs` automatikus regressziós tesztjei a CAP-beállításokat, a szerverprofilok szétválasztását, a teljes Blue-táblázatot, a végleges statkorlátokat és a régi SET-működést fedik le. Valódi mobilos megjelenítés és a valós játékbeli Wheel-esélyek ellenőrzése továbbra is külön feladat.

## Emerald v4.9.9 – 140 CAP Wheel-értékek a 130 CAP alapján

A játékos megerősítése szerint a 140 CAP-es Wheel statrendszer egyelőre **ugyanaz, mint 130 CAP-on**, mert a játékban nem történt további releváns frissítés. A két CAP alap **STR/INT, Attack/Block/Critical, HP/MP, Durability, Parry és Freezing maximuma** megegyezik. Különösen: **140 CAP MP: 2300** (ugyanúgy, mint 130-on).

A 140 CAP-re korábban elmentett **üres vagy hiányzó MP referencia** az aktív szerverprofil 130-as MP értékéből – annak hiányában 2300-ból – feltöltődik, beleértve a CAP + Degree pillanatképeket. A **szándékosan megadott eltérő, érvényes 140-es MP-értéket és valamennyi item Wheel-sorát megőrizzük**. Ez kezdeti szerveradat-referencia, nem bizonyított Wheel-esély. A karakter aktuális szintjéből számított Balance **továbbra is különbözik** 130 és 140 szinten.

## Emerald v4.10.0 – magyar–angol felület és biztonságos szerverprofil-kezelés

- Felül **Nyelv / Language → Magyar / English** kapcsoló. A nyelv a gépen tárolódik; nem változtatja meg az itemazonosítókat, CAP-okat, statértékeket és a JSON-mentés adatstruktúráját.
- A négy fő fül, a SET-összesítő, a Blue-katalógus, a Pen/Wheel feltételes esélymodell, az **angol útmutató**, a megerősítő ablakok és a Discordra másolható visszajelző jelentés is elérhető angolul, internet nélkül.
- Az önálló szerverprofilok CAP-listái most **különülnek el**: egyik szerveren beírt saját CAP nem jelenik meg automatikusan másik szerver új profiljában. Szerverváltás és mentésimport előtt az adatszerkezetet ellenőrizzük.
- Sérült, hiányos, duplikált szerverazonosítójú vagy hiányzó aktív profillal rendelkező JSON-import **hibára fut és nem írja felül a jelenlegi profilokat**. Régi Sailor-only mentés továbbra is importálható.
- Új fájlok: [README_EN.md](README_EN.md) – angol használati útmutató; [docs/ROADMAP_V5.md](docs/ROADMAP_V5.md) – bizonyítékalapú v5.0 kiadási lista.

**Korlátok:** az eredeti 9DG játékikonok nem részei a csomagnak (csak stilizált SVG-k és saját PNG/WebP betöltés). A valódi szerveres dobási esélyek továbbra sem igazoltak. A tényleges mobil/asztali vizuális E2E és az automatikus Render-élesítés külön ellenőrzendő; a Node-tesztek nem helyettesítik őket.
