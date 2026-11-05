# Emerald v5.0 — Silkroad equipment & Wheel icon specification

**Status:** DESIGN READY / EXTRACTION NOT RUN / ASSETS NOT VERIFIED (2026-11-05)

This is a scoped, implementation-oriented specification. Do **not** mark the authentic-icon task complete or ship copyrighted client assets before the extracted data and reuse permissions have been checked.

## 1. Scope / Pontos cél

Include **only** equipment and Wheel-related icons:
- Weapons: Chinese and European weapon families (selected actual weapon type, not the generic `weapon` slot).
- Chinese/European shields.
- Apparel: Chinese Armor / Protector / Garment, European Heavy Armor / Light Armor / Robe; for Head, Shoulder, Chest, Hands, Legs, Foot.
- Accessories: Necklace, Earring, Ring (one sprite can serve both `ring1` and `ring2` when correct).
- Wheel of Fortune / Feather Pen / related identifiable icons and Blue/stat icons **only if found and verified**; UI can retain stylized stat icons when no authentic counterpart exists.
- All degrees present in the supplied client dataset (not only 9DG); CAP is a character/server configuration and **does not uniquely determine** an item's icon or degree.
- Include original-game variant sprites for Normal/SoS/SoM/Sun when they really differ; otherwise retain the same sprite and display an independent textual grade badge.
- Do **not** extract pets, mounts, avatars, consumables, monster icons, or miscellaneous game assets.

## 2. Existing v4.10.0 integration facts

- `index.html` keeps 12 item slots in `IDS`: shoulder, hands, foot, head, chest, legs, necklace, earring, ring1, ring2, weapon, shield.
- `ITEM_ICON_PATHS` and `STAT_ICON_PATHS` produce original placeholder SVG drawings, not authentic Silkroad sprites.
- `S.userIcons[id]` stores user PNG/WebP **per slot only**, not per degree/item; the existing small `localStorage`/JSON-backup approach must not be enlarged with hundreds of base64 sprites.
- Existing legacy key `sailor-wheel-calculator-v4`, multi-server backup flow, saved sets, Wheel rows, CAPS and scoring MUST remain compatible.
- Users can select standard CAPs and manual CAP from 1 to 200. Do not hardcode cap-to-icon assumptions. Current default degrees 9–15 can be changed by user.
- UI language is HU/EN. Every added string, fallback state, and error must have proper translations.

## 3. Asset extraction (separate offline tool / Codex handoff)

1. Locate user-provided Silkroad client `Media.pk2` (possibly related item-data resources); open **read-only**; never modify client files, run executable patches, or bypass protection. Avoid needing phBot login/API.
2. Extract candidate paths under relevant equipment / alchemy / Wheel image families; retain raw relative path and SHA-256. Do not guess that every `.ddj` is a convertible DDS; inspect real headers/formats and document decoder used.
3. Convert verified supported image formats into lossless PNG; optionally produce small WebP with alpha preserved. Avoid stretching; retain source icon dimensions, commonly small, and check transparency.
4. Match item image paths to **actual client item definition references** / item codes where available. Never infer a confirmed item ID from visual similarity or filename-only guesses.
5. Emit a clear list of `verified`, `candidate`, `unmatched`, `failed_conversion`, `duplicate_asset`. The importer must not silently promote candidates to verified.
6. Supply a **local** ZIP of conversion output and machine-readable manifest, plus a text report with counts and decoder errors. Keep raw media outside the public repo pending reuse permission.

Suggested output:
```
sro-icon-extract/
  README.md
  manifest.json
  report.json
  sprites/equipment/...
  sprites/wheel/...
  unresolved.csv
  failures.csv
```

Recommended per-entry manifest schema (fields may be `null` when unknown):
```json
{
  "schemaVersion": 1,
  "source": {"client": "user-supplied", "file": "Media.pk2", "fingerprint": "<hash>"},
  "icons": [{
    "id": "stable-normalized-id",
    "category": "equipment",
    "sourcePath": "icon/item/.../example.ddj",
    "assetPath": "sprites/equipment/example.png",
    "sha256": "<hash>",
    "itemCode": null,
    "region": "chinese",
    "equipmentType": "garment",
    "slot": "chest",
    "weaponType": null,
    "degree": 9,
    "grade": "normal",
    "matchStatus": "candidate",
    "matchEvidence": []
  }]
}
```
The shown entry is illustrative, **not** a claim that an actual game asset exists.

## 4. Identity and lookup

A `slot` alone is insufficient. Define normalized equipment identity:
```
serverProfileId + itemCode? + region + equipmentType/weaponType +
slot + degree + gradeVariant?
```
Use reliable `itemCode -> icon` mapping first if available; otherwise explicitly reviewed `region/type/slot/degree` mapping; only then a generic slot placeholder.

Important separations:
- CAP != degree, and two items at the same CAP might legitimately use different sprites.
- `weapon` selection must resolve Chinese/European weapon family from the existing weapon picker, not show a single generic sword.
- A shield icon depends on the actually selected shield item; hide/disable its participation in totals when not equippable, preserving current logic.
- Ring 1 and Ring 2 are distinct tracked slots, but may reuse the same inventory sprite.
- Wheel/Feather Pen are consumable/system icons, not equipment slot sprites; Blue/stat piktograms have their own mapping namespace.
- Official/client item codes and server-specific custom codes are not automatically interchangeable. Maintain per-server optional overrides **without** changing shared canonical mappings.

Lookup order:
1. user override for exact server + item identity,
2. verified server-specific mapping,
3. verified general client item-code mapping,
4. verified generic combination region/type/slot/degree,
5. existing stylized SVG placeholder **with a truthful fallback label**.

Do not fake `SoS`/`SoM`/`Sun` sprite variants or silently substitute an icon from another degree.

## 5. Browser UI plan

- Item cards, editor header, set overview and compare tables use one `resolveItemIcon()` pipeline.
- Add equipment type and appropriate region/style settings as needed, without changing Blue/stat rules; preserve older sets with a documented `unknown` state rather than guessing their armor type.
- An **Icon Library** UI: filter region, equipment family, type, degree, slot, source profile; review matched/unmatched counts; preview with item code/source; explicit manually approved override.
- Add `auto / custom / placeholder` status and reset override control.
- Keep icon + text (accessibility), descriptive `alt` or hidden decorative images where text already labels item.
- Preserve 32x32 native crisp pixels with `image-rendering: pixelated` as appropriate; support mobile and dark mode.
- Do not load remote hotlinks by default. Support the existing static-site/offline deployment.
- A ZIP import requires an actual validated decompressor or an offline prep step; **do not claim the browser can read arbitrary ZIPs natively**.
- Bulk image data must stay out of existing base64 JSON profile backups and `localStorage`; back up only mappings/override metadata and clearly indicate when external local image assets need to be reimported.
- Consider a separate optional local image cache (e.g. IndexedDB) with quota/errors and an explicit clear path. No silent global database migration.

## 6. Security, compatibility, permissions

- Accept only supported PNG/WebP post-conversion; inspect type and actual dimensions; enforce per-file and total extraction/import size limits.
- ZIP validation: reject path traversal, absolute paths, duplicate logical IDs, decompression bombs and malformed paths.
- User-derived strings and manifest values are untrusted: escape all HTML and never construct executable HTML/JS from import text.
- Preserve all existing 12 slot IDs, Blue catalogs, Wheel scoring, manual line maxima, fixed +11 STR/INT, 200% Durability, 130+ HP 2300 and Parry 60, and currently inherited 140-cap Wheel reference.
- Never upload/distribute extracted original game artwork to public GitHub/Render without verifying permission; ship mapping engine and placeholders safely first.
- The feature must be optional: no icons imported => current UI and old JSON still work unchanged.

## 7. Work split / Dependency-ordered implementation

**Phase A — now (no client assets needed):**
1. Write technical spec and acceptance tests.
2. Implement icon identity resolver with mocked manifest + fallback; keep new namespace separate from existing `S.userIcons`.
3. Add equipment family selectors or explicit mapping as necessary; no assumptions for old sets.
4. Test existing SETs, import/export, HU/EN, CAP and stats for regressions.

**Phase B — after Codex extraction:**
5. Validate manifest against real client source; review sample previews and item-data links.
6. Implement optional bulk import plus bounded image storage, visual unmatched queue and per-server custom mapping.
7. Add verified icons in the UI, distinguish authentic vs fallback, include Wheel/Feather icons only where verified.
8. Check permission before publishing artwork; otherwise support purely local user-imported assets.

**Phase C — v5 release gate:**
9. Desktop and mobile E2E, exported old and new backups, manual CAP, item switching, all 12 slots, SoX variant handling.
10. Update README HU/EN and `docs/ROADMAP_V5.md` evidence; do not claim PASS until actual tests and icon source matching are observed.

## 8. Acceptance criteria / Tesztlista

- [ ] 9DG garment Chest and another Degree Chest can display **different** verified icons.
- [ ] Garment vs Armor and Chinese vs European do not alias accidentally.
- [ ] Bow / Glavie / Staff and Shield show correct types, independently of generic equipment slot.
- [ ] Necklace, Earring and both rings render; same ring sprite reuse is allowed.
- [ ] Wheel of Fortune / Feather Pen icons are visually and source-verified or retain honest placeholders.
- [ ] No image import is required to use the calculator.
- [ ] Custom override affects only intended server+item, not other CAP/degree or servers.
- [ ] JSON backup round-trip preserves all original SET and Wheel data; icon cache loss never deletes game data.
- [ ] Inputs, missing sprites, malformed manifests and cache quota failures are handled without breaking screens.
- [ ] All new UI/help strings work in Hungarian and English.
- [ ] Node regression tests and real desktop/mobile visual checks recorded independently.
- [ ] Original artwork redistribution permissions confirmed before any public release.

## 9. Tomorrow's Codex instruction

**Only** perform the asset extraction and local manifest/report export above from an explicitly provided client directory. Do not modify the Wheel Calculator, do not push game assets, do not invent item codes, and report exactly what was verified vs unmatched. Return a local ZIP, manifest, counts, sample gallery and failures list. Implementation in this repo begins after inspecting that output.

**Project repo:** `hegybalazs-bot/sailor-wheel-calculator-beta`.
