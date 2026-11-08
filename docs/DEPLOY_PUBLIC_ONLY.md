# Public-site deployment and admin access boundary

## Current risk

Render's existing static service (`sailor-wheel-calculator-beta`) publishes repository root `.`. This exposes the index-based **developer preview** and public assets together. A different URL, an unlinked page, a secret client-side password or a JavaScript role check are **NOT an admin permission system**. No protected admin API or server-side account management exists in this static application. Player edits are browser-local and do not grant powers over other users.

## Prepared fix

Run `node tools/build-public.cjs`. The deterministic `dist-public/` folder contains **only**:
- `index.html`: the public `publikus.html` copy, so the root opens a player-safe page;
- `publikus.html`: the unchanged public player interface;
- `visszajelzes.html`: public feedback form;
- `assets/icons/manifest.js` and `assets/icons/local-pack.js`: local-only icon rendering support.

It intentionally omits `bemutato.html`, developer `index.html`, sources, documentation, tool/test files, original PNG/DDJ game images and user ZIP packs. An allowlist test fails if unexpected files are present.

### Existing Render service migration (needs authorized dashboard action)

1. In the Render dashboard for `sailor-wheel-calculator-beta`, configure **Build Command**: `node tools/build-public.cjs`.
2. Configure **Publish Directory**: `dist-public` (instead of the current `.`).
3. Deploy the exact main commit; confirm `/` and `/publikus.html` show the public interface.
4. Confirm requests to `/bemutato.html`, `/docs/...`, `/tests/...`, `/data/...` and `/tools/...` return 404 (or a static fallback with **no** developer/admin controls).
5. Verify the user's original browser-local SETs and JSON backups still work; upgrading `/` to public uses the same storage keys.
6. Keep admin development in a **private source/deployment** with identity-aware access (e.g. enterprise SSO/reverse-proxy authorization), rather than serving it from the public static origin.

The current Render connection can inspect deploys and trigger manual deployments but does **not** expose a service-settings update action. Until the authorized migration above occurs, publishing `dist-public` is **prepared, not active**.

## Hard limitations

This is UI isolation and safer publication, not authentication. Users may inspect public JavaScript and edit their own local calculator values; they still cannot change a shared database because none exists. GitHub source access is separately governed by repository visibility. Never treat "admin preview" as confidential or implement client-side secrets.

## Render webhook bug

The service advertises `autoDeploy=yes` / `autoDeployTrigger=commit`, but issue #4 documents missing automatic deployment events after new main commits. Do not close it merely because a manual deploy succeeds. Verify a future code push produces a Render deploy with trigger `git_push`/matching provenance (platform vocabulary may differ) without manual API call, and matches exact main commit SHA.

## Release check

`node tools/release-gate.cjs`: summarize unresolved evidence and QA.
`node tools/release-gate.cjs --stable`: intentionally BLOCKS release until all required proof is recorded.
`node --test tests/*.test.cjs`: deterministic unit/backup/public-build checks.
`node tests/browser-smoke.mjs`: Chromium real-browser smoke test (requires installed Playwright).
