# Wheel Calculator — Emerald v5 BETA handoff
**Status:** BETA, not officially certified by Sailor Online. **Updated:** 2026-11-08.

## Implemented and testable
- Separate public HU/EN player page `/publikus.html`, browser-local SET/CAP/server profiles and JSON backups.
- Private icon ZIP import and automatic degree/family matching; no icon/image upload controls on public page.
- Five-workspace responsive navigation, 12-slot quick-select icons and folded advanced item editor.
- Manual Wheel of Fate / Fortune / Feather Pen planning with explicitly conditional probability models.
- Configurable CAP 90–140 references and server-specific Blue/STR/INT/Rate limits.
- GitHub deterministic tests, public-only allowlisted deployment bundle and release-evidence validator.
- Chromium smoke QA: desktop, 390px phone viewport, CAP persistence, imported private ZIP + IndexedDB restore. Screenshots are stored as CI artifacts. **Not real Android or iPhone hardware testing.**

## Independent blockers to stable release
- Actual Sailor administrative approval and evidence for Blue types, maximum line counts, cap/degree limits and Wheel probability distributions.
- Public redistribution license for original game icons; high-degree (12–15DG) clothing sprites are absent/placeholder in the supplied pack.
- Physical Android/iOS, accessibility/assistive-technology, and backup recovery QA on real devices.
- Authenticated admin environment; present developer preview is not permission-protected.
- Migration of the existing Render service to allowlisted `dist-public` publishing and independently verified GitHub→Render automatic deployment (issue #4).

**Do not treat model probabilities as verified Sailor rates. No game client/server or bot access is ever used.**
