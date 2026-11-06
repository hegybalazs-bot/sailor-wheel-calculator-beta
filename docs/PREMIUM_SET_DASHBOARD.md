# Emerald v5 — premium SET dashboard handoff

Status: feature preview, not gameplay certification.

## Implemented in the website

- Equipment loadout with the 12 existing equipment slots: 6 armor, 4 jewelry and weapon/shield.
- Uses the existing icon renderer. A custom user-provided icon is shown first, then one correctly matched verified registry sprite, then the original stylized fallback. Nothing attempts to extract media from Silkroad or fetch a remote game asset.
- Item click focuses the same existing item editor (the real Blue row data are untouched by the dashboard).
- Mobile layouts adapt from 3 columns to 2 to 1; 390px widths get single slot columns. Printable styles preserve readability.
- Quality charts show only a fully entered and valid Wheel item percentage. Incomplete, unsupported or invalid items show **—** and are excluded from means.
- Targets are manual item-specific percentage goals. Graph marks show those goals; they are not probabilities.
- Improvement priorities rank already-valid, below-target equipment by quality-percent gap. Candidate upgrades use actual existing scored lines and their configured maxima only; hypothetical improvement is **not** a predicted roll or success rate.
- Shield is excluded from aggregate quality and priorities when the selected weapon cannot equip it.
- HU/EN text remains separate from stored item data. No new browser storage keys or backup schema changes required.
- All presentation logic is browser-local with existing CSP `connect-src 'none'`; the feature has no Silkroad client, API, bot, packet or game connection.

## How to get authentic icons later

The current repository's `assets/icons/manifest.js` is intentionally empty. Supply extracted PNG/WebP sprites from a client/resource pack you are entitled to use, along with precise identity:
`itemCode`, `slot`, `degree`, `region`, `equipmentType`, `weaponType`, `grade` and path. Match every icon to an actual in-game screenshot and verify redistribution permission before publishing. Use `tools/prepare-icon-library.cjs` and `docs/ICON_EXTRACTION_HANDOFF.md` as the existing intake process. **Do not fabricate or silently hotlink original assets.**

## Not yet complete

- No original Silkroad sprite pack has been provided or approved for redistribution, so placeholders remain by design.
- Actual Chrome/Firefox/Android/iOS touch and screenshot QA remains NOT RUN.
- Server-specific Blue maximum verification and actual Wheel odds remain outside this presentation feature.
- Render auto-deploy GitHub issue #4 remains open independently of static UI changes.
