# Emerald v5 — Codex handoff: original SRO icon extraction

**Current state (2026-11-05):** Icon identity and presentation code is staged on a feature branch; the committed `assets/icons/manifest.js` is **empty**. No original game images have been extracted or published.

## Codex assignment for the next session

Read the user-supplied Silkroad client **locally and read-only**. Do not edit `Media.pk2`, game executables, phBot, anti-cheat software, or the game installation. Do not attempt to bypass login/security checks.

Extract only:
- Chinese and European **weapons**, **shields**, **apparel** (head, shoulder, chest, hands, legs, foot) and **jewelry** (necklace, earring, ring).
- Wheel / Feather Pen tool icons, if present and identifiable.

Include **every degree actually available** in the client's source files. Do not assume a CAP determines a unique visual item, and do not auto-guess SoS / SoM / Sun differences.

Convert supported original icon formats to **PNG/WebP**, preserving transparency and recording original source path, actual client item code, converted SHA-256, and evidence for each source-to-icon match. A `.ddj` extension alone does not prove the decoding format; inspect headers before processing.

Expected local output structure:

```text
sro-icon-extract/
  manifest.json
  report.json
  sprites/
    equipment/
      [converted PNG/WebP images]
    wheel/
      [converted PNG/WebP images]
  unresolved.csv
  failed-conversions.csv
```

## Machine-readable manifest contract

`manifest.json` has `schemaVersion: 1` and an `icons` array. Example structure below is **fictional test metadata, not an actual game item**:

```json
{
  "schemaVersion": 1,
  "icons": [
    {
      "category": "equipment",
      "sourcePath": "icon/item/example.ddj",
      "assetPath": "sprites/equipment/example.png",
      "assetSha256": null,
      "itemCode": "ITEM_EXAMPLE_GARMENT_09",
      "region": "ch",
      "equipmentType": "garment",
      "slot": "chest",
      "weaponType": null,
      "degree": 9,
      "grade": "Normal",
      "matchStatus": "candidate",
      "reviewStatus": "pending",
      "matchEvidence": []
    }
  ]
}
```

Supported regions: `ch` / `eu` (also `chinese` / `european` during preparation). Equipment types: `armor`, `protector`, `garment`, `heavy_armor`, `light_armor`, `robe`, `weapon`, `shield`, `jewelry`. Slot names: `head`, `shoulder`, `chest`, `hands`, `legs`, `foot`, `necklace`, `earring`, `ring`, `weapon`, `shield`. For weapons provide the exact picker ID (such as `ch_bow` or `eu_staff`).

Wheel records use `category: "wheel"` plus `role: "wheel_of_fortune"`, `"wheel_of_fate"`, or `"feather_pen"`. They do not use item slot fields.

## Human source review and validation

Codex must set `reviewStatus: "pending"` by default. Only after comparing each icon with client item definitions/screenshots and confirming the mapping may the reviewer explicitly set:

- `matchStatus: "verified"`
- `reviewStatus: "approved"`
- Nonempty `matchEvidence` with concrete item-file or game evidence.

Do **not** mark any icon verified just because its filename contains a likely term, its color looks right, or a model guesses its identity.

Run the local offline preparation tool from the repository working copy:

```bash
node tools/prepare-icon-library.cjs ./sro-icon-extract ./local-icon-preview
node --test tests/*.test.cjs
```

The output includes `report.json`, a generated `assets/icons/manifest.js`, and the approved PNG/WebP sprites. Unsupported/unfinished candidates stay out of the generated library. Bad paths, wrong file signatures/hashes, invalid categories, conflicting mappings, and unsafe input block generation.

The generated output is **local-only**. Never automatically push it to a public repository or deploy it; confirm reuse/redistribution rights first. The static website can load the generated catalog if files are deliberately copied to a local preview deployment. The normal release keeps the empty catalog and stylized SVG fallback.

## Regression and acceptance checklist

- [ ] Correct CH/EU family, actual weapon type and exact Degree determine equipment picture.
- [ ] An optional icon-only item Degree override never changes Wheel/stat values.
- [ ] Item-code-specific art never appears for unrelated item codes.
- [ ] If more than one approved matching image remains, show the fallback instead of guessing.
- [ ] Both ring slots can resolve to one verified `ring` sprite.
- [ ] Wheel/Feather Pen graphics display only after verified image files exist.
- [ ] Existing manually uploaded per-slot icons keep priority.
- [ ] Old SETs without a style remain `unknown`, not falsely identified.
- [ ] Saved SETs, server profiles, JSON backup import/export and 90–140 CAP rules remain intact.
- [ ] Real browsers, mobile and actual game screenshots have been inspected separately from Node tests.

## Remaining work, deliberately not claimed complete

Full in-browser ZIP importing, client asset decoding, source review, permission review, and physical mobile/desktop QA are **not** completed merely by this infrastructure. See related v5 design PR #16.
