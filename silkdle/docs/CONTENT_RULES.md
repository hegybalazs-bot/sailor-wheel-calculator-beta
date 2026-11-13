# Content approval and legal checks

Silkdle is an unofficial noncommercial fan experiment and not affiliated with Joymax / Wemade. Game visuals may remain protected by their copyright owners. A public website must not assume random internet photos or fan site reuploads are freely licensed.

### Allowed admin rights declarations (do not bypass review)
- `own_capture_noncommercial`: personally captured in-game media for the noncommercial fansite, with game rights separately considered.
- `official_fansite_terms`: screenshot demonstrably from the official Silkroad homepage with explicit verified scope of fansite reuse; link to original and note when terms were checked.
- `written_permission`: recorded permission from relevant rights holder with scope and date.

Each image must have a true answer and intended mode. A candidate entry is not evidence of an available image, and a screenshot of a city isn't automatically an acceptable image for a mob's answer. Never approve merely to hit a marketing target (200/300/400).
Records default to `pending`; all public game queries filter `status='approved'`. Revoke removes it from public gameplay and disables its HTTP image link, without silently deleting review evidence. Test SVG illustrations remain separately marked as DEMO and never appear in the real-image catalog.

### Security and retention
- Admin requires a strong secret configured in `SILKDLE_ADMIN_KEY`, supplied only over HTTPS.
- This first admin API is a beta. Replace the shared key with proper audited role-based authentication and action logs before a large public launch.
- Image bytes live in PostgreSQL; free-tier expiry and lack of backups make this unsuitable for long-term media preservation.
- Build an asset backup/storage plan before public screenshot collection.
- For player account management, add verified email and password recovery before public registration.
