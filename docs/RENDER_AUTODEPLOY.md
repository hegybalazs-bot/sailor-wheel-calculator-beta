# Public Render auto-deploy — two supported paths

## Observed status (2026-11-09)

New public Render Static Site: `srv-dbocditg1s2s73ept23g`
- Public address: https://silkroad-wheel-calculator-public.onrender.com/
- Build: `node tools/build-public.cjs` → Publish: `dist-public`
- `autoDeploy=yes` / `autoDeployTrigger=commit` in service metadata
- **Actual previous deploys had `trigger=manual`** after GitHub merges; the GitHub main commit was newer than Render LIVE. Do not assume auto-deploy works based on the setting alone.

Render's official documentation explains that **automatic Git deployment requires a Git provider connection**. A service created only from a public repository clone URL is typically manual-deploy-only, even if the metadata appears enabled. This may explain this service's behavior, but requires the owner's dashboard inspection. See https://render.com/docs/deploys and https://render.com/docs/git-provider.

## Path A — native integration (preferred, no secrets to configure)

1. In Render Account Settings → Git Deployment Credentials, connect/reconnect **GitHub**.
2. Check Render's GitHub App installation at https://github.com/apps/render/installations/new and ensure `hegybalazs-bot/sailor-wheel-calculator-beta` is among its allowed repositories.
3. On the **new public** Render Static Site, ensure source is the connected GitHub repository/branch `main`, not a bare public clone URL.
4. Under Auto-Deploy, select **After CI Checks Pass** (preferred) or **On Commit**.
5. Merge one harmless test change; verify the Render deployment is actually triggered by Git commit and reaches the identical `main` SHA. Issue #4 remains open until this real-world observation succeeds.

## Path B — tested-code GitHub Actions deploy hook fallback

File: `.github/workflows/deploy-public-hook.yml`.

The workflow runs only after the **main-branch push** multi-engine browser QA succeeds, then waits for the Node regression workflow **on the same SHA**. It checks that the tested SHA is still the latest `main` commit before requesting a Render deploy. It never runs for PRs, forks or failed CI. It never supplies a historical `ref` to the deploy hook.

**One-time owner action to enable:**

1. On the *new public* Render service, open **Settings → Deploy Hook** and copy the unique secret hook URL. **Do not paste this URL in chat or commit it to GitHub.**
2. In the GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**.
3. Create the exact secret name `RENDER_PUBLIC_DEPLOY_HOOK_URL` and paste the Render deploy hook URL as the secret value.
4. To avoid duplicate deploys, set Render's native Auto-Deploy **Off** if you use this Actions fallback instead of Path A.
5. Merge one test change. GitHub's `Deploy public Wheel after verified CI` workflow must run and succeed; check Render for a **matching latest LIVE SHA**.
6. If the secret was absent, the workflow intentionally succeeds with a skip message and **does not deploy**. Verify Render separately.

Render deploy hooks accept GET or POST and return 200 (deploy started) or 202 (another deploy queued); their hook URL is confidential. See https://render.com/docs/deploy-hooks.

## Not performed by the assistant

The Render/GitHub account authorization, creation of GitHub repository secret, disabling native Auto-Deploy, and a real post-merge deployment observation are **owner-controlled settings**. Do not claim auto-deploy repaired until the live Render event proves it. Never place deploy hook URLs or API keys in source, issues, screenshots or messages.
