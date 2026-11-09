# Public deployment and developer-workspace boundary

## Current services (last confirmed 2026-11-09)

**Dedicated public static site:** https://silkroad-wheel-calculator-public.onrender.com

Render service `srv-dbocditg1s2s73ept23g`, branch `main`, configured build `node tools/build-public.cjs` and publish `dist-public`. Its last confirmed **LIVE commit** was `0b3ec2d0a7c8b85c180d6493dd3ec153cf5da61b` (PR #42) when this document was updated. The precise live commit can change: always query Render deployments before saying a new PR is live.

**Older original static site:** https://sailor-wheel-calculator-beta.onrender.com

Its configured publish directory was repository root `.`. This exposes the developer **preview** and internal source files, and must not be considered an authenticated admin portal. It has no privileged shared database, but publishing the full repo is unnecessary and misleading. The user's browser localStorage is origin-scoped, so old and new site profiles do not automatically transfer.

## Public-only build (working and tested)

Run `node tools/build-public.cjs`. Its exact six-file allowlist:
- `index.html`: public player interface
- `publikus.html`: same player interface
- `visszajelzes.html`: offline feedback-copy helper
- `ikon-helyreallitas.html`: one-time private, browser-local sprite ZIP recovery (no upload)
- `assets/icons/manifest.js` and `assets/icons/local-pack.js`: safe client-local code

It excludes developer `index.html`, `bemutato.html`, `README.md`, `docs/`, `tests/`, `tools/`, `data/`, admin code and copyrighted original game sprites. Exact allowlist, real HTTP 404 and browser integration are checked in CI.

## Next operations

1. On the **new** Render service dashboard, use **Manual Deploy → Deploy latest commit** if main changes are not automatically built.
2. Verify exact new `main` SHA equals Render latest LIVE SHA, and that `/index.html`, `/ikon-helyreallitas.html` work and `/bemutato.html`, `/data/`, `/tests/` do not publicly serve content.
3. Correct Render/GitHub auto-deployment webhook integration. `autoDeploy=yes` alone does not prove successful automatic triggering; issue #4 remains open.
4. Restrict/retire the **old** root-publishing site in the dashboard, or change its build and publish path to the same public-only output if keeping it. **Do not** assume changing GitHub source edits the service settings.
5. If privileged server-side admin is actually desired, provision a separate identity-protected backend with secrets stored only on the server. There is presently no privileged admin capability to secure; a hidden link or JavaScript password is never real authentication.

## Release policy

Server Blue types, maxima, Normal/SoS/SoM/Sun line limits and modeled probabilities are **manually configured**, not awaiting Sailor administrator approval. The release gate blocks only independent QA evidence requirements (real physical browsers/accessibility/backup roundtrip), not missing official game data or deferred original art. The application remains a beta until independent checks are performed.
