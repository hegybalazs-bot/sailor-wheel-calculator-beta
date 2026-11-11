# Manual server configuration — agreed product contract

**2026-11-09 decision:** No official Sailor Online Blue reference dataset or admin verification is required. This tool is useful for Sailor and other Silkroad servers because **players configure the rules themselves**. An old iSRO list is merely an optional editable starting point, never authoritative.

## Share only CAP/Degree rules (no personal SET data)

In **⚙ Saját CAP-beállítások / CAP Settings**, find **Kézi CAP / Degree szabályok átadása**. Use **Szabályok exportálása** to save a small JSON template covering the active CAP/Degree stat maxima, Normal/SoS/SoM/Sun grade line limits, configured weapon requirements, the allowed Blue types of all 12 equipment slots, specialty Blue maxima and player-entered conditional probability assumptions.

This rules-only template deliberately **does not contain** any saved personal SETs, actual item rolls, Wheel history, character balances, icons, account credentials or even the local server profile name. To import, first select the **same CAP and Degree** under the intended destination server, and choose **Szabályok betöltése**. The app validates the entire template; unknown Blue types, duplicate entries, invalid values and mismatched CAP/Degree are rejected.

Before applying a matching file, the browser initiates a **complete** regular JSON rollback backup of every saved server/SET. Confirm that download is present. The import replaces **only** the selected CAP/Degree's shared rules and conditional assumptions; existing individual SETs and their item-specific Wheel line limits remain untouched. The original separate whole-profile **Mentés JSON-ba / Betöltés** flow remains available for moving personal items.

**No staff sign-off is required.** Templates are user-made assumptions; a transferred percent is not an official game roll rate.

## How a player configures a server

1. Pick or create a **server profile** under **⚙ Szerver beállításai**. Profiles are kept separately in the browser and included in one JSON export.
2. Choose the character **CAP**, and set its **Degree**. Every supported CAP/Degree has independent editable reference maxima.
3. In **Szett & itemek**, select an equipment slot. Expand **🧬 Lehetséges Blue-fajták** and check the Blue types actually allowed on that server. The current list is a *preset* until you change it. Unchecking a type never deletes previously entered Wheel lines; warnings show any mismatch.
4. In **CAP-beállítások**, adjust configurable 100% stat references and any specialty Blue-type maximum. A particular Wheel line can also keep its own manually supplied model maximum. Invalid/unset maxima do not magically count as verified game stats.
5. Choose the item **Normal / SoS / SoM / Sun** grade. Set global CAP/Degree per-grade limits and optional overrides for individual items; they are not inferred from an official site.
6. Enter the actual Blue lines and current Wheel values from the user's own item. Conditional estimates depend on those chosen maxima, line counts and any **manually entered assumptions/probabilities**. No type-count-to-drop-odds conversion, no undocumented server drop-rate prediction.
7. Export **↓ Mentés JSON-ba**. Before destructive full import, server deletion or SET deletion, the application initiates a rollback JSON download. Verify Downloads and retain a second copy.

## Fixed user-requested boundaries (not independently verified game facts)

- STR/INT model cap +11 per line, Durability 200% cap
- HP 2300 and Parry 60 from 130 CAP upward
- 140 CAP inherits 130 base where no later update is known; player-editable exceptions where the field supports it

## Destructive resets (with whole-profile rollback export)

The **CAP settings** page has two separate reset commands.

- **Ennek a CAP-nak a szabályait alaphelyzetbe** resets only the *active CAP's* manual configuration, including per-Degree Blue-type pools, specialty Blue maxima, manually assumed probability profiles and grade/weapon limit rules. Existing SET items, actual rolls, history and other CAPs remain unchanged.
- **Összes szerver és SET törlése** removes *every locally saved server profile* and all its CAPs, SETs and Wheel history, returning the calculator to one fresh Sailor Online profile. Its effect is global within the current browser/origin.

**Both** ask for explicit confirmation and initiate a complete, downloadable JSON archive of *all* server profiles before modifying data. Confirm the file is in Downloads. They verify both local storage keys and attempt to restore the original data if the browser refuses to save the reset. A private icon ZIP held separately in IndexedDB might still remain; these commands do not delete that asset store. If needed, recover from the exported JSON via normal **Betöltés**. They do not clear cloud accounts or game files; none are connected.

## Multiple browser tabs: protect unsaved changes

If you open the **same public site in two tabs**, both tabs initially show their own in-memory copies of the browser-local SET data. A newer version guards against an older tab silently overwriting the newer saved copy.

When a different tab saves SETs or server profiles, the older tab shows a persistent **"Másik böngészőlapon változtak a SET-ek"** warning and blocks subsequent saves from that tab. It **does not silently reload** its edited values, so you can choose **↓ Mentés JSON-ba** to download that tab's current unsaved state before closing or reloading it. Reload the stale tab to reopen the newest stored copy. Imported profiles, Blue settings and CAP rules still use the ordinary validated JSON flow.

This is *best-effort client-side overwrite protection*, not live collaboration, version-control merging, or a transactional database. Avoid editing the same browser-local profile simultaneously in multiple tabs/devices; each web origin remains independent. On storage failures, export a JSON backup before closing the tab.

## Privacy and presentation

- Every player's server settings are browser-local. Changing Blue types/maxima affects only their own locally saved profiles; it does not publish shared rules or modify anyone else's SET.
- No external approval is required. Do **not** label manually entered values "official Sailor Online maximums" or "verified drops."
- Original client images remain private and optional; no artwork/ZIP or screenshot is needed to use the calculator.
- Physical-device QA, public deployment isolation and real admin authentication (if ever wanted) are separate security/release checks, not Blue-data authorizations.
