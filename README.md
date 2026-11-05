# Sailor Wheel Calculator – Emerald v4.6.2 BÉTA

A Sailor Online felszerelés / Wheel-sor kalkulátora, kipróbálásra szánt **béta verzió**.

## Jellemzők
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