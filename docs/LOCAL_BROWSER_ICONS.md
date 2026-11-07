# Sailor local icon pack — browser-only integration

## Purpose

The user supplied extracted Sailor Online client artwork and a locally reviewed candidate catalog. **The public website contains no extracted PNG or DDJ files.** Instead, the player imports a browser-specific ZIP from their own computer. Only images the player explicitly chooses for the current item are displayed. **Candidate** does not mean official/verified.

### How to use

1. Download **Sailor_Ikoncsomag_Bongeszobe.zip** generated from the locally reviewed extracted assets. It is approximately 3 MB, ZIP **STORE** format (not the original extracted archive).
2. Open the Wheel Calculator → **Szett & itemek**.
3. Expand **Saját Sailor ikoncsomag · Degree szerint** under the equipment list.
4. Load the browser ZIP via **Saját ikon ZIP betöltése**. Image integrity is checked locally via ZIP CRC and PNG SHA-256; no upload happens.
5. Select the equipment item, weapon, CH/EU clothing family, Degree and, if known, exact item code. The gallery displays only matching icon **candidates**.
6. Visually compare the picture to your real item and click the desired candidate. It is marked **manually selected, not verified**.
7. The choice is saved by server profile (slot, region, family, weapon, Degree, grade and optional item code). Existing SET values, Blue lines and probabilities do not change.
8. Image bytes persist privately in **IndexedDB** if supported; the regular JSON backup retains only picture identifiers. If you change browser/device, reimport the icon ZIP. Manual per-slot PNG uploads (legacy feature) keep priority.

### Security

- Static local ZIP reader: `assets/icons/local-pack.js` verifies the ZIP central directory, entry names, counts, size limits, CRC32, PNG signature, and SHA-256.
- The import format supports only the prepared `ZIP_STORED` package: `manifest.json` and files under `sprites/[20 hexadecimal digits].png`. It deliberately rejects the original extracted archive, unsafe paths, DEFLATE archives and unknown files.
- The website has CSP `connect-src 'none'; object-src 'none'` — no programmatic network access to Silkroad, bots or other endpoints.
- Data from the archive are rendered only as escaped text and browser-local `blob:` URLs. No remote asset hotlinks or game client processing.
- Unknown clothing families, missing image hashes, conflicting item codes or absent sources display the normal SVG fallback.
- Shared Wheel coupons are **not** mapped automatically to Wheel of Fate / Fortune / Feather Pen: the extracted metadata do not prove those exact roles.

### Production/legal distinction

Only the **code** for local import and filtering is shipped publicly. All Sailor original sprites and itemdata-derived candidate mappings remain inside the **user-owned local ZIP**. Publicly hosting the original images or converting candidates into a globally shared verified catalog remains blocked until their mappings are individually reviewed and redistribution rights are confirmed.

### Test and verification matrix

- [x] Local source archive conversion / SHA and ZIP integrity checks completed while preparing the browser-only ZIP.
- [x] Node tests for malformed ZIP headers, path traversal, hash mismatch, candidate-only metadata, family/degree filtering, backup isolation and absence of game interaction.
- [ ] Actual Chrome / Safari / mobile browser manual import and reload test (not run by Node unit tests).
- [ ] Official image rights confirmation for *public redistribution*.
- [ ] Screenshot-based verification and approval of each advertised item + Wheel tool image.

## Contract

Browser importer expects a ZIP with `manifest.json`:
```json
{
  "schemaVersion": 1,
  "packType": "wheel-browser-local-review",
  "status": "unverified-candidates",
  "icons": [
    {
      "category": "equipment",
      "region": "ch",
      "equipmentType": "jewelry",
      "slot": "earring",
      "degree": 9,
      "weaponType": null,
      "gender": null,
      "grade": null,
      "itemCodes": ["ITEM_CH_EARRING_09_A"],
      "sourcePath": "icon/item/china/acc/earring_09.ddj",
      "assetPath": "sprites/0123456789abcdef0123.png",
      "assetSha256": "64 lowercase hexadecimal SHA-256 digits go here",
      "matchStatus": "candidate",
      "reviewStatus": "pending"
    }
  ]
}
```
Example values above are illustrative, not verified game data; the hash and filename are placeholders.


### 2026-11-07 original ZIP compatibility fix

The first `Sailor_Ikoncsomag_Bongeszobe.zip` includes **120 apparel `_ca.ddj` source sprites** whose slot is `null` because their exact meaning was not established. The original import rejected the *entire* ZIP as `Invalid icon candidate metadata`.

The browser importer now **skips exactly these recognized unresolved records**, leaves them unassigned, and retains all 1,153 identifiable equipment candidates. Only this narrow `_ca` pattern is skipped; invalid metadata for other records still causes a rejected import. The source path, region, gender, apparel family, Degree, image name and source digest must still agree. The gallery reports how many unresolved records were skipped.

The smaller `Sailor_Ikoncsomag_Bongeszobe_Javitott.zip` (1,153 equipment records, 1,031 PNGs) can also be imported; it contains no unresolved `_ca` candidates. **Neither ZIP requires uploading original sprites to GitHub/Render.** The code remains strictly browser-local. Browser import and reload E2E are still not verified in real mobile/desktop devices.



## 2026-11-07 — automatically matched item pictures (v5 preview)

After loading a supported **user-owned private ZIP** (original or corrected), the website now selects a sprite **automatically for each matching equipment slot**, without clicking on individual candidate images. It uses the active server/SET, CH/EU apparel family, weapon type, individual icon Degree override or the current Degree, optional exact item code, and character gender.

- **Character / Icon gender** is one shared Male/Female selector near the apparel-family selector. Default for old saved SETs is Male. It is stored per SET and preserved when switching CAP, server profile, SET or importing a JSON backup. There is **no required per-item image selection**.
- Existing manual uploaded per-slot PNG/WebP icons remain highest priority, followed by optional existing manual per-item picks, then deterministic automatic matches, followed by existing rights-cleared static sprites and SVG fallback.
- The original candidate gallery remains only inside **Optional manual override**. No user interaction in that gallery is required when a unique match is available.
- If family/style is unknown, the user must set the **actual apparel family once** rather than have the website guess their character's gear.
- Exact source match with the correct gender is required for apparel. Neutral weapon/jewelry/shield art needs no gender.
- If two distinct asset hashes match one identity, if an exact item code disagrees, or if a sprite is reused across four or more different apparel slots (known 12DG placeholder pattern), use the existing SVG fallback. **Never pick randomly or falsely label unverified candidates official**.
- All sprites stay in local IndexedDB and transient browser object URLs. Automatic matching saves *no* individual icon selections into the SET, and never changes Wheel lines or item stats.
- The ZIP importer and upload policy are unchanged: no game client access, server calls, bot commands, extraction, external uploads or public redistribution of proprietary PNG/DDJ images.

### Actual user ZIP coverage audit (candidate metadata, not full game verification)

Inspecting the supplied corrected review ZIP locally shows one usable candidate for each 9DG/10DG/11DG slot in the common Chinese Garment + Spear and European Robe + Staff configurations (both male and female), including 6 clothing slots, 3 jewelry categories and the chosen weapon; shield variants also have their own mapped art. The 12DG clothing set is incomplete or placeholder-based, so SVG fallback is deliberate. Other configured weapons/armor families are resolved only where their exact source entries exist.

**Quality status:** Node/unit and ZIP metadata audits are not evidence of successful physical mobile/desktop browser imports or independent rights verification. Those gates remain separate.
