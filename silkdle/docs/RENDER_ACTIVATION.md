# Silkdle public beta — Render activation runbook

This runbook applies only to the isolated Silkdle Render web service and database. **Never modify the Wheel Calculator service**, which uses a separate `main` deployment.

## Existing resources (checked 2026-11-13)

- Web: `silkdle-web-beta`, service ID `srv-dbq8bf59fdbs73dm9550`, `https://silkdle-web-beta.onrender.com`, branch `feature/silkdle-image-race-leaderboard`.
- PostgreSQL: `silkdle-leaderboard-beta`, instance ID `dpg-dbq839d9fdbs73dlgg20-a`, region Frankfurt; free instance **expires on 2026-12-11**. Arrange an appropriate persistent/backup-enabled plan before inviting the general public.
- Both run in the same Render workspace `My Workspace`. No linked database environment secret was detected at the latest deployed web service.

## Manual one-time private connection required

The connected Render tools can modify web-service environment variables, but **they cannot retrieve the database's confidential internal connection URL**. Do not invent a database URL, commit it, print it in logs, or store it in public GitHub.

1. Open the database in the [Render dashboard](https://dashboard.render.com/d/dpg-dbq839d9fdbs73dlgg20-a). In **Connect**, copy its **Internal Database URL** (not External URL). Prefer internal networking and don't weaken the IP allowlist.
2. Open the [Silkdle web-service environment](https://dashboard.render.com/web/srv-dbq8bf59fdbs73dm9550/env). Add `DATABASE_URL` with that full internal URI as a private environment variable. Do **not** set `DATABASE_URL` for the Wheel Calculator service.
3. Optionally add `SILKDLE_ADMIN_KEY` as a high-entropy admin password (at least 24 characters, e.g. generated locally with `openssl rand -hex 32`). Store it in a password manager; never commit or share it publicly. Required to approve images.
**Never set `SILKDLE_ALLOW_RANKED_DEMO=1` on the public Render service.** This test-only flag would allow fantasy SVG demo assets in score-bearing rounds.

4. Save and let Render redeploy. Check `https://silkdle-web-beta.onrender.com/api/health`: it should return `"database":"configured"`; check logs for `Silkdle PostgreSQL and screenshot gallery ready`. `configured` is not by itself proof of login end-to-end; test a fresh private test account and the leaderboard.
5. Admin-upload actual owned or permissioned game screenshots, validate answers/crops and explicit rights, then approve. Images from official game websites are **not automatically licensed for reuse** merely because they are viewable. The 30 externally linked candidates are unranked practice only; their loading and re-use rights remain unverified.
6. Before wider public signups: provide operator contact and a real privacy notice, email verification, password-reset email transport, abuse and moderation controls, backups and retention policy. There is **no transactional email provider configured** now. Avoid inviting players to use existing passwords.

## URLs and checks

- Game: `https://silkdle-web-beta.onrender.com/?mode=picture`
- Account: `https://silkdle-web-beta.onrender.com/?mode=account`
- Ranked: `https://silkdle-web-beta.onrender.com/?mode=ranked`
- Daily leaderboard: `https://silkdle-web-beta.onrender.com/?mode=leaderboard`
- Screenshot Studio: `https://silkdle-web-beta.onrender.com/admin.html`
- Health: `https://silkdle-web-beta.onrender.com/api/health`
- Gallery readiness: `https://silkdle-web-beta.onrender.com/api/image/status`

## Tests and release safety

- GitHub Actions **Silkdle Web CI** starts on pushes to the beta branch and tests PostgreSQL-backed API flows with an ephemeral PostgreSQL service.
- **Browser QA** starts on pushes to the beta branch and runs Chromium, Firefox and WebKit checks. CI substitutes stable fixture PNGs for unreliable external image hosts, so passing browser tests do **not** prove third-party image links are currently accessible.
- Wheel regression tests are independent; do not merge the entire beta feature branch into `main`. If needed, cherry-pick only isolated `silkdle/` files after reviewing the diff.
- API endpoint `/api/profile` requires sign-in; leaderboard reads are public after connection.
