# Separate authenticated developer preview (prepared, NOT deployed)

The public calculator must **remain** on the dedicated six-file static Render site:
https://silkroad-wheel-calculator-public.onrender.com/

The repository's older Render static site still published developer preview files at the root. It is **NOT authenticated** and must not be used for private administration. Source code is also visible because the GitHub repository is public. The developer preview is a **local SET demo**, not a privileged API or shared user database; it has no power to edit other players' data.

## Prepared safe hosting

`server/private-preview.cjs` runs a separate Node.js HTTP server with:

- Password-protected access to every developer HTML/JS route (HTTP Basic Auth), denied by default.
- Startup **refuses missing/invalid username or password shorter than 24 characters**.
- No passwords, hashes or login credentials are committed to GitHub.
- Only a small HTML/JS allowlist is served; no source files, documentation, repo internals, original PNG/DDJ game artwork or user-private icon ZIP files.
- No game client connection, shared database or privileged mutation APIs; app data remains in the viewer's own browser.
- An unauthenticated `/__health` endpoint reports only readiness; no protected page is exposed through it.
- Security headers `noindex`, `no-store`, `nosniff`, anti-framing and restrictive CSP.

**Basic authentication MUST be used behind HTTPS only.** Render terminates HTTPS at its public ingress; do not publish a direct HTTP port. Choose a new, unique, randomly generated password, not a game account password. Because HTTP Basic Auth may remain cached by the browser, sign out by closing the session and avoid shared computers. This is simple preview access control, not an enterprise identity provider or a production multiuser administration system.

## How the owner can deploy (requires their action)

Create a **new Render Web Service**, not a Static Site, from the GitHub repository, with:
- Runtime: Node.js, branch: `main`
- Build command: `echo "Private preview server is ready"` (no package install required)
- Start command: `node server/private-preview.cjs`
- Health-check path: `/__health`
- Environment variable `PRIVATE_PREVIEW_USER`: a unique login name, 3–80 characters
- Environment variable `PRIVATE_PREVIEW_PASSWORD`: a **secret** random password of 24–256 characters, added in Render's environment settings (never in a repo, issue or chat)
- `PORT`: allow Render to inject this automatically

The process **must fail startup** without valid credentials. Do not create a public service with a fallback default password. Once ready, verify 401 challenge without a password, 200 with correct credentials, 404 for `/README.md`, `/data/`, `/tools/` and `/tests/`. Protect this new service's URL and do not share the password.

**Retire or reconfigure the old unprotected** `sailor-wheel-calculator-beta.onrender.com` static site through Render settings. Creating an authenticated replacement does not retroactively protect the original URL.

## Tests

`node --test tests/private-preview.test.cjs` checks fail-closed startup, 401 on all preview routes, 200 only with credentials, the health route, path traversal/source exclusion, HEAD and POST behavior. Normal `node --test tests/*.test.cjs` includes it.

## Limits

This component is *prepared in code* until the owner supplies environment secrets and provisions the new service. It does not claim an authenticated admin deployment already exists. Keeping an authenticated developer preview is optional; server Blue types, maximums and line limits remain locally editable by all users without any admin approval.
