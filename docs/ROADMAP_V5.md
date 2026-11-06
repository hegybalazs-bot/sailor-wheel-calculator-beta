# Wheel Calculator — verified v5.0 release checklist

## Premium SET dashboard foundations (2026-11-06)

- [x] Responsive 12-slot armor/jewelry/weapon/shield loadout using the existing safe icon registry.
- [x] Per-item quality progress bars vs. custom targets; missing or invalid entries do not contribute to quality.
- [x] Prioritized improvement list based on valid manually entered values and known row maxima.
- [x] Bilingual copy and print styling; static fallback behavior.
- [ ] Obtain and approve authentic Silkroad sprites for the full CH/EU Degree/grade coverage.
- [ ] Run actual desktop/mobile portrait/landscape browser checks and accessible screen reader smoke tests.
- [ ] Validate estimates against representative in-game screenshots, without connecting to game clients.


Updated for the v5 Admin Preview (2026-11-06).

## Must pass before declaring v5.0

- [ ] **Authentic equipment icons:** obtain correctly matched CH/EU item sprites for all available degrees with appropriate reuse permission, including head, shoulder, chest, hands, legs, foot, weapon, shield and jewelry. Current imagery remains stylized when no verified source is present.
- [ ] **Gameplay-proven Blue catalogs:** verify each item slot's possible Blue types for Sailor and other user-selected servers; distinguish the number of possible types from the maximum lines visible on one item. Document server and date of evidence.
- [ ] **Real roll probabilities:** obtain measured/server-documented distribution for Wheel of Fortune line types and value ranges, Feather Pen line selection and value outcomes. Until verified, show conditional assumptions only; never invent odds.
- [ ] **Full CAP/degree references:** validate at least 90, 100, 110, 120, 125, 130 and 140 CAP with in-game screenshots. Preserve +11 STR/INT, Durability 200, HP 2300 / Parry 60 at 130+, and current 130=140 Wheel baseline. Check other server-specific Rate, Critical, status resistances and grade line limits.
- [ ] **Physical desktop and mobile E2E:** test Chrome/Chromium and Android/iOS portrait + landscape, Hungarian/English switching, all four tabs, custom icons, settings, set comparison, and imported backup flows. Record screenshots, observed bugs, and device/browser versions.
- [ ] **Backup recovery:** export multiple server profiles and item history, import in a new browser, verify every CAP/SET value, including old Sailor-only files, malformed backup rejection, and storage quota warnings.
- [ ] **Render auto-deploy:** verify that a new GitHub main commit triggers its own deploy without a manual deploy call; compare exact commit SHAs, then close GitHub issue #4 only after independent proof.
- [ ] **Accessibility and English text QA:** keyboard navigation, icon+label semantics, input errors, dialogs, English feedback form, untranslatable user-entered names, and complete language coverage of populated (not only empty) items.
- [ ] **Documentation and release:** update English/Hungarian changelog, pin a release commit/tag, archive tested JSON backups and publish beta caveats.

## Admin-preview foundations added (not final release sign-off)\n\n- [x] Three-stage Wheel overview and per-CAP/per-server manual budget planner.\n- [x] Fictional demo SET generator (90/100/130 CAP), independent of original SETs.\n- [x] Read-only share links for the current equipment snapshot, without other private history.\n- [x] Player-entered per-CAP/Degree evidence register (not admin certification).\n- [x] Bilingual standalone admin showcase page.\n- [x] Prior verified icon groundwork and local-only safe image manifest preparer.\n- [ ] Real in-game validation of Fate stage rules, actual prices and external stat limits.\n- [ ] Live-browser and device QA for all new admin-preview features.\n\n## Current completed foundations

- [x] Offline HU/EN interface and English feedback/help (v4.10.0).
- [x] Independently named server profiles with safe CAPS and guarded imports.
- [x] Blue catalog per equipment slot and expandable full-set Blue breakdown.
- [x] CAP select and manual entry with preserved separate set histories.
- [x] Fixed, user-supplied STR/INT +11 and Durability 200%; 130+ HP 2300, Parry 60; current 140 uses 130 Wheel reference.
- [x] Separate conditional Feather Pen, full Wheel simulation and their limitations.
- [x] JSON backup export including all server profiles, older Sailor-only import support.

**Do not mark user-facing production readiness PASS solely from Node regression tests.** Real browser and game-data verification remain necessary.
