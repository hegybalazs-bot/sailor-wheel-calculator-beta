# Wheel Calculator — Emerald v5 Admin Preview (Beta)

## Sailor icons: private ZIP import with degree-specific selection

Open **SET & items → Private Sailor icon pack · by Degree**, then import your own prepared **Sailor_Ikoncsomag_Bongeszobe.zip** file. The extracted PNG files stay **in your browser**; the public GitHub/Render app does not include copyrighted game artwork. Pick matching candidate pictures manually by CH/EU region, apparel family, weapon, slot, Degree and optional item code. Candidate images are **not** automatically verified as authentic item art.

The local image bytes use browser IndexedDB when available. The JSON backup retains only the selected icon identifiers, so you must reimport the prepared ZIP on another browser. This loader accepts only the dedicated **uncompressed browser ZIP**, not the original extracted Media.pk2 or the older v2 review ZIP. No game client or server integration. Details: [Local browser icon workflow](docs/LOCAL_BROWSER_ICONS.md).


## Emerald v5 premium SET loadout and quality insights

The home page now includes a **12-slot equipment loadout**, covering armor, jewelry, weapon and shield. Clicking a slot opens its existing manual editor. The display uses an authorized user icon, a unique verified sprite match or a stylized fallback. Its quality chart only scores **complete and valid manually recorded Wheel lines**; empty/invalid items remain unscored. It compares personal item goals with current quality and ranks below-target, valid items by percentage-point gap. Improvement room on known existing rows is *theoretical*, **never a drop probability**.

This is a browser-only manual planner. Authentic client artwork requires independently sourced and licensed/approved files. [Full premium dashboard and icon intake notes](docs/PREMIUM_SET_DASHBOARD.md).


## Interactive Wheel steps — strictly manual, browser-only

The **Next Wheel / Pen** tab now includes a manual Fate → Fortune → Pen planning workflow. Enter a line-count target, review already recorded Blue lines, then set a desired value for one chosen scored line. Each item plan is saved in the current SET and included in JSON backups.

**Never touches the game:** no Silkroad client, account, bot, memory, packets or game-server connection. Actual in-game rolls must be performed by the player, and observations must be typed manually into the item editor. The static pages enforce a restrictive CSP against programmatic API and socket connections. See [WEB_ONLY_MANUAL_PLANNER.md](docs/WEB_ONLY_MANUAL_PLANNER.md) for the technical boundary.


**Offline Hungarian / English Silkroad Wheel calculator** for Sailor Online and other customizable Silkroad servers.

[Open the app](https://sailor-wheel-calculator-beta.onrender.com/) · [Report a bug or share a verified stat](https://sailor-wheel-calculator-beta.onrender.com/visszajelzes.html)

## Emerald v5 Admin Preview — showcase and planning features (2026-11-06)

**Admin presentation:** [open bilingual showcase](https://sailor-wheel-calculator-beta.onrender.com/bemutato.html). Mobile-friendly and explicit about beta limitations.

- **Three Wheel stages:** separate explanation of Wheel of Fate, Wheel of Fortune and Feather Pen; actual server behavior must be verified.
- **Budget planner:** independent per-server/per-CAP, manual Fate/Fortune/Pen unit prices and planned counts, in one common Gold, Silk or custom currency. No invented prices, exchange rates, success chances or guarantees.
- **Admin demo SETs:** 90, 100 and 130 CAP examples are created as separate, explicitly fictional SETs. Existing SETs are retained.
- **Shareable read-only SET:** copy a URL fragment containing only the current equipment lines and CAP. It does not expose history, other saved sets, server bank data, or uploaded sprites; visiting it never imports or overwrites the viewer's data.
- **Source-evidence register:** server/CAP/Degree-specific player-entered HTTPS source, notes and review-request status, with no claim of independent administrator certification.
- **Icon groundwork:** validated local preparer and empty verified-asset registry with safe fallbacks. Original client sprites and unverified game artwork are **not** publicly distributed.

**Release gate:** v5 is a PREVIEW, not full production validation. Real-world mobile/desktop browser QA, accurate server-specific Blue limits/odds, asset source review and Render auto-deploy remediation remain open. CI alone cannot certify gameplay assumptions.

## English interface

Switch **Language / Nyelv → English** in the top toolbar. The choice is saved in your browser separately from your server/SET data. The feedback form follows the same choice, and its Discord-ready report can be copied in English.

The app supports independent **server profiles** (one starts as "Sailor Online"), and each profile has separate CAP, Degree, SETs, Wheel lines, Blue-type catalogs, goals, and simulated roll assumptions. Language selection does **not** translate or modify stored stat data, item IDs, or JSON backups.

## Quick start

1. Back up existing work with **Export JSON**. JSON exports contain **all server profiles**, not just the active profile. Keep an offline copy; there is no automatic account/cloud sync.
2. Select or create a server profile. Choose a CAP from the standard presets (90, 100, 110, 120, 125, 130, 140) or enter your own integer CAP between 1 and 200.
3. Choose Degree and weapon, then select an equipment item such as Shoulder, Hands, Foot, Head, Chest, Legs, necklace, earrings, rings, weapon, or shield.
4. Enter the actual Wheel-line count, Blue types, and each line's value. Use **Wheel line composition** to enter several lines of the same type more quickly.
5. For each item, set a personal target percentage. View the **Full set – Blues & stats** comparison: all potential Blue types are listed, including absent types, with recorded values and maxima.
6. View **120% Balance**, the optimizer, the Wheel journal, saved-set comparison, and the **Keep or reroll?** conditional estimator.

## Player-supplied reference limits

| Stat | Applicable CAP | Default upper limit |
| --- | --- | --- |
| STR / INT | All CAPs | +11 per line |
| Durability | All CAPs | 200%, excluded from Wheel quality |
| HP | 130 CAP and higher | 2300 |
| Parry Rate | 130 CAP and higher | 60 |
| MP | 130 and 140 CAP | 2300 reference (140 currently inherits 130) |

The **140 CAP Wheel reference currently matches 130 CAP**, as the player reports no relevant intervening game update. Character-level Balance targets remain level-specific; 130 CAP and 140 CAP Balance are not identical.

Other Blue types, rate values, status resistances, per-grade line limits, and percentages can be **server-dependent or provisional**. Confirm with actual in-game evidence. Existing saved values over a fixed limit are preserved for correction, but are not counted as valid stats.

## Two different roll models

**Feather Pen decision helper:** a mathematical model of changing the **value of one** existing Blue line. It assumes a uniformly selected line and uniformly sampled legal value. It reports improvement, unchanged, worsening, and non-improvement odds for that *assumed* model and suggests keeping vs. considering a reroll.

**Wheel of Fortune / entire Wheel:** the full-reroll model can also change **Blue types**. It only runs with a manually entered assumed probability distribution that totals 100%. **The number of possible Blue types does not establish their occurrence rates.**

**Neither model exposes verified server odds, guarantees better rolls, or computes the actual Gold/Silk cost.** Displayed percentages are conditional estimates. Unknown Blue maxima are not silently invented.

## Inventory icons

By default, the app uses **original stylized vectors inspired by 9DG Chinese Garment**, not authentic game sprite images. Under Equipment → Original Silkroad icons, users can choose local PNG/WebP images (up to 96 KB each). These replace the illustration while preserving the item name and are included in JSON backups. The app does not distribute or automatically fetch original Silkroad artwork.

## Data safety

- Data are saved locally in the browser. Export JSON periodically and before major changes.
- Import supports all-server backups and older Sailor-only backups.
- Invalid, duplicate, or incomplete multi-server profiles are rejected before data replacement; CAP lists are isolated between different server profiles.
- Existing saved items and manually provided server values are not silently translated or overwritten.
- If localStorage is unavailable or full, use Export JSON and avoid relying on automatic saving alone.

## Tests and limitations

Node-based regression tests: `node --test tests/wheel.test.cjs`. GitHub Actions runs the same checks on the main branch and pull requests.

The product is still **Beta**, not final v5.0. Remaining release requirements: independent gameplay evidence for the Blue/drop distributions; legal authentic 9DG inventory sprites if desired; full mobile and desktop browser visual testing; explicit verification of static-site auto-deployment and backup recovery on real devices. Do not claim these are complete without evidence.


### Update: automatic item icon matching

**No per-item picture picking is required after importing the user-owned browser ZIP.** The website now selects unique local candidates automatically from CH/EU, apparel family, weapon, Degree, item code and a single **Character / Icon gender** preference (Male by default for legacy SETs). A real apparel family must still be set if the existing SET says `Not set`. Missing, ambiguous and reused 12DG placeholder artwork safely falls back to SVG. Manual overrides remain optional. Source art is stored in your own browser only and never communicates with the game.


## Compact workspace — less scrolling

Inside **SET & items**, the sticky top workspace switcher offers **⚔ Items / Wheel**, **⚖ Balance / Target**, **📊 Analysis**, **🧠 Optimize / Compare**, and **🧰 Sharing / Tools**. Only the active work area is visible. A horizontal, sticky 12-item icon strip lets you change equipment without scrolling through the full SET overview, which is still available in an optional expander. Detailed explanations, advanced Blue/Wheel controls, HP/MP/Rate inputs, and previous rolls are also collapsible. These are **presentation-only changes**: SETs, CAP/degree limits, Wheel statistics, server profiles and JSON backup contents are preserved. Both workspace tabs and item icons remain touch-scrollable on mobile; print CSS exposes the complete report.
