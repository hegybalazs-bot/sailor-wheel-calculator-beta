# Silkdle image database — next action

Current technical implementation:
- 441 staged candidate slots in six categories, all deliberately marked `needs_image`
- Screenshot Studio at `/admin.html` (search, batch import, preview, approve/revoke)
- PostgreSQL-backed `/api/image/*` and `/api/admin/image/*` endpoints, server-validated answers
- Image Hunt dynamically prefers approved game screenshots, falling back to four clearly labelled original demo illustrations if none exist
- Ranked challenge can rotate approved images once at least 40 are available
- CI integration tests cover upload, moderation, guest answer checks, revoke, and regressions

**Blocking requirements:**
1. Configure `DATABASE_URL` privately on the dedicated Silkdle Render web service. Existing free PostgreSQL expires in December 2026; upgrade to persistent storage before accepting long-term accounts/images.
2. Configure a randomly generated 32+ character `SILKDLE_ADMIN_KEY` on the service's Environment page. Do not paste secrets into GitHub or chat. Redistribute only to trusted admins.
3. Gather authentic, properly sourced/permissioned gameplay captures. Zero actual Silkroad screenshots were supplied as part of this implementation; do not present candidate slots as live images.
4. Use Screenshot Studio for manual review and approval. Automated import guesses filename matches only; do not auto-publish without visual review.
5. Replace shared admin key with role-scoped auth, backups and audit logs; add copyright/permission review; add email verification, password reset and privacy policy for account launch.

6. **NEW:** The website now has private, IndexedDB-backed Local Screenshot Hunt. It works without a Render database. Users can bring their own screenshot PNG/JPG packs, adjust the crop focal point in Screenshot Studio, save photos locally, and play. Photos are not automatically uploaded or added to the public leaderboard. Keep source screenshot files backed up.

Run checks: `npm install --prefix silkdle` and `node --test silkdle/test/*.test.cjs`. Use `TEST_DATABASE_URL` for temporary PostgreSQL integration tests. All tests on GitHub Actions use disposable Postgres in CI.
