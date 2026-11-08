# Wheel Calculator — Emerald v5 BÉTA: fejlesztési átadás
**Állapot:** BÉTA, nem végleges Sailor Online-hitelesítés. **Frissítés:** 2026-11-08.

## Kész és ellenőrzött
- Publikus, magyar/angol játékosnézet: `/publikus.html`; helyi SET/CAP/szerverprofilok és JSON biztonsági mentés.
- Automatikus helyi ikonpárosítás a saját felhasználói ZIP után; kézi feltöltő nincs a publikus felületen.
- Öt munkaterületre bontott, mobilbarát navigáció; gyors 12 itemes választósáv és összecsukható haladó mezők.
- Wheel of Fate / Fortune / Feather Pen manuális terv és feltételezett valószínűségi modellek.
- 90–140 CAP kezelése és szerkeszthető maximális Blue/STR/INT/Rate referencia-beállítások.
- GitHub CI: egységtesztek, nyilvános build allowlist, release-evidence séma.
- Chromium E2E: asztali, 390px mobilnézet, CAP-mentés, helyi ikon-ZIP és IndexedDB újratöltés ellenőrzése, screenshot-archívum. **Ez nem fizikai telefonos teszt.**

## Bétát lezáró tényleges akadályok
- 90/9DG majd további CAP/degree hiteles, server-admin által ellenőrzött Blue-listák, sormaximumok és valódi Wheel-eloszlások.
- Eredeti játékikonok nyilvános terjesztési engedélye. 12–15DG ruhaképek továbbra is hiányosak; a fegyverek/ékszerek/pajzsok lokális jelöltjei nem hivatalosan elfogadott public assetek.
- Valódi Android/iOS, képernyőolvasós akadálymentességi és hordozható mentés-visszaállítási eszközteszt.
- Valódi privát, belépéssel védett adminfelület. A fejlesztői nézet jelenleg **nem hitelesítetten védett**.
- Render publikus csomag `dist-public`-ra átállítása, valamint az automatikus GitHub→Render élesítés független igazolása (issue #4).

**Nem állítjuk, hogy a bemutatott esélyek a Sailor szerver valódi dobási arányai.** A játék klienséhez sosem kapcsolódunk.
