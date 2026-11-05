# Sailor Wheel Calculator – Emerald v4.5 BÉTA

A Sailor Online felszerelés / Wheel-sor kalkulátora, kipróbálásra szánt **béta verzió**.

## Jellemzők
- 90 / 100 / 110 / 120 / 125 / 130 / 140 CAP
- SoS / SoM / Sun, egyéni maximum sorok, manuális statértékek
- STR / INT / HP / MP / Attack Rate / Blocking / Parry / Critical / ékszereknél Freezing
- Eredmények, SET Manager, JSON biztonsági mentés
- Visszajelző oldal: `/visszajelzes.html` (kimásolható üzenet; nem küld automatikusan semmit)

## Közzététel Renderen

1. Hozz létre egy **külön GitHub repository-t** (pl. `sailor-wheel-calculator-beta`), a három weboldal fájllal és ezzel a `render.yaml` fájllal.
2. Render: **New → Static Site**, csatlakoztasd a GitHub repository-t.
3. Branch: `main`; Build Command: `echo Static beta: no build required`; Publish Directory: `.`
4. Állítsd be a public `onrender.com` linket a Discord tesztelőknek.

A `render.yaml` opcionális Render Blueprint-konfiguráció; manuális Static Site létrehozásakor a fenti beállításokat használd.

## Adatok és felelősség

A szerver pontos statmaximumai / esélyei **nem teljeskörűen igazoltak**. A program becslésre / közösségi tesztelésre való.
A személyes SET-adatokat a böngésző localStorage tárolja; nincs közös adatbázis. Rendszeresen használj JSON exportot.
A `noindex,nofollow` jelzés nem hozzáférésvédelem: aki megkapja a linket, megnyithatja.