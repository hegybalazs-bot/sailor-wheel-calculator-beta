# Wheel Calculator — manual-first release plan

**Policy accepted 2026-11-09:** This is a manually configured Silkroad Wheel calculator, *not* an official Sailor Online rules database. There is **no administrator sign-off requirement** for allowed Blue types, 100% maxima, Normal/SoS/SoM/Sun line limits, Fortune/Fate/Pen rules, or hypothetical probability input. All supported server-specific values must remain editable locally by the user. Existing initial values are merely editable presets; do not silently apply them as verified facts.

## Completed in GitHub main

- [x] Separate local server profiles with independent CAPs/Degree models, SETs, weapons, Blues and Wheel models
- [x] CAP selector 90 / 100 / 110 / 120 / 125 / 130 / 140 and additional custom 1–200 CAP support
- [x] Blue-type allowlist editable per item + CAP/Degree, status-resistance Blue maxima editable and per-row 100% reference overrides
- [x] Normal/SoS/SoM/Sun and item-specific per-grade line limits editable (no admin requirement)
- [x] User-requested universal limits: STR/INT +11, Durability 200%; 130+ HP 2300, Parry 60, 140 uses 130 reference until user edits
- [x] Wheel Fate/Fortune/Pen planning and explicitly conditional estimators: **no default claim about actual game roll odds**
- [x] HU/EN, compact responsive interface, multi-server SET manager and full local JSON backup/import
- [x] On overwrite/delete: save current profile-bank JSON before changes; guard last server and last SET
- [x] 9/10/11DG candidate icons locally recoverable at a separate same-origin route, without publishing game artwork (icons deferred)
- [x] Public-only 6-file Render build allowlist excludes source, developer preview, private extracted PNG/DDJ and review ZIP
- [x] Automated Node, Chromium, Firefox and WebKit smoke tests, including backup recovery and 390px UI viewports
- [x] Release policy changed to **manual configuration** with no official-data gate

## Actual pending requirements

- [ ] Verify latest GitHub main commit deployed on the dedicated public Render static site; **do not** claim new code live before checking exact Render deploy SHA. Manually deploy until GitHub webhook autoDeploy is fixed.
- [ ] Real Android Chrome and physical iPhone Safari portrait/landscape; record device/version and screenshots
- [ ] Physical keyboard and screen-reader testing using populated Wheel rows, error messages, SET selectors and editable Blue controls
- [ ] Export/restore full real personal multi-server, multi-CAP JSON on a clean physical browser; verify actual saved values and legacy backup migration
- [ ] Repair GitHub→Render commit auto-deployment and verify a genuine new main commit triggers automatic deploy (issue #4)
- [ ] If a **privileged** administration service is desired, host it separately with genuine server-side login; no static JavaScript password, hidden admin URL or public root-preview constitutes protected admin
- [ ] Human QA/release notes and optional version tag after checks; until then keep **beta**

## Explicitly not required / deferred

- **No Sailor administrator verification** of any Blue/type/max/line/probability value. Players supply their own, and conditional models should be labeled assumptions.
- **No official drop probabilities** needed. If unknown, probability remains unknown or an explicitly user-supplied mathematical model.
- **Original game icons deferred**. Placeholder SVGs are acceptable; reuse or distribution rights are relevant *only* if authentic original art is eventually publicly shipped.
- No game-client, server, bot, memory, packet, credential or account integration; this is a browser-local calculator.

## Verification

- `node --test tests/*.test.cjs`
- `node tools/release-gate.cjs` — manual policy plus real QA blockers
- `node tools/release-gate.cjs --stable` — blocks unless physical/independent QA proof is on record, **not** unless a Sailor admin sends data
- `node tools/build-public.cjs` — only intended public files
- CI browser workflow checks Chromium + Firefox + WebKit; not equivalent to physical device QA
