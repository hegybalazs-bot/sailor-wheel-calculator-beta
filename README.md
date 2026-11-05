# Sailor Wheel Calculator – Emerald v4.7 BÉTA

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

A képen megadott képlet szerint `MaxStat = 28 + CAP×4`, `Magical Balance = min(120,100×INT/MaxStat)`, `Physical Balance = min(120,100−(100×2/3)×(MaxStat−STR)/MaxStat)`. A szimuláció a CAP-et veszi karakterszintnek. A tényleges játékmechanika ettől eltérhet, ezért a Balance százalék **számított érték**, nem a szerverből kiolvasott mutató.

A karakter **felszerelés nélküli** STR/INT értékeit külön meg kell adni. A kalkulátor ehhez csak a kiválasztott, felszerelt SET **Wheel-soraiból** származó STR/INT pontokat adja hozzá; egyéb bónuszokat nem talál ki. Hiányzó alapérték esetén a százalék helyén „—” látszik. Az adatok SET-enként megmaradnak, és a JSON mentésbe is bekerülnek.
