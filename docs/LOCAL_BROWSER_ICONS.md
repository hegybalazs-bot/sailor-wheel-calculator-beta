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
