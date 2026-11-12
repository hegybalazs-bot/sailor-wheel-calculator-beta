# Silkdle — Chinese + European Silkroad fan quiz

Silkdle is an unofficial fan-made, mobile-friendly Silkroad Online quiz. It lives in its own \`silkdle/\` directory; the Wheel Calculator homepage is not modified.

## Play modes

- **Classic**: Mob Guess, Unique Hunter, Equipment, Mastery, Map Explorer, SRO Knowledge (daily + practice, HU/EN, CH/EU/Mixed).
- **Image Hunt (community)**: Free, accountless image recognition. A **10×10 cover** initially reveals only 1% of the image. The player must type a name without a visible choice list; wrong guesses or the Reveal button open more pieces. Six wrong attempts end the round. No ranked points.
- **Speed Hunt (ranked beta)**: one shared puzzle every Budapest-local day; **45 seconds, two wrong guesses**, one attempt per account/day. No answer dropdown. The server measures elapsed time, correctness and points; faster correct answers receive more points. Each wrong guess subtracts 250 points.
- **Leaderboard**: today's highest ranked score and all-time cumulative points, stored in PostgreSQL.
- **Accounts**: username, email, password, login/logout, server-side sessions and account deletion.

Scoring: on correct answer before deadline, \`max(100, 1000 - floor(elapsed_ms / 1000) * 12 - 100 * wrong_guesses)\`. On timeout or reaching three wrong guesses, 0 points. A user can play community mode without registering; only ranked mode writes shared leaderboard scores.

## Expert difficulty

- Classic defaults to **Legend**, with **Veteran** and Beginner available as alternatives.
- Initial clues and autocomplete are suppressed in Legend; further clues unlock only after wrong guesses.
- A new bank of **34 Veteran/Legend questions** emphasizes verified vSRO 1.188 quest requirements, NPCs, quantities, European mastery classifications and classic unique comparisons. Answer positions are shuffled by puzzle/day.
- Sources for editorial review: [vSRO quest guide](https://github.com/AlighieriDemiurgs/SROquests), [classic uniques](https://silkroadonline.wiki/guides/uniques) and [class mastery taxonomy](https://silkroadonline.fandom.com/wiki/Skills). Version-dependent answers must retain source/version metadata.

## Demo pictures and future content

Four **original vector illustrations** are provided solely as gameplay placeholders. They do not claim to be Silkroad screenshots and do not reproduce copyrighted client artwork. Replace them with authorized, vetted, answer-tagged actual SRO screenshots later. Do not silently copy game files into this public repository.

## Local run

Requires Node.js >= 20, optional PostgreSQL for ranked features.

\`\`\`bash
cd silkdle
npm install
npm start
\`\`\`

Open \`http://localhost:3000\`. With no \`DATABASE_URL\`, casual modes work; signup, login and worldwide rankings return HTTP 503 (no fake leaderboard).

For PostgreSQL, set \`DATABASE_URL\` securely in your terminal or deployment dashboard. On startup, the server creates the three \`silkdle_*\` tables and indexes.

## Deployment (Render)

A standalone Render **web service** runs this branch with:
- Build command: \`npm install --prefix silkdle --no-audit --no-fund\`
- Start command: \`node silkdle/server.cjs\`
- Region: Frankfurt; runtime: Node; HTTPS URL provided by Render.

To connect the pre-provisioned Render database **privately**, open the database's Render Dashboard, copy its **Internal Database URL**, then open this web service's **Environment** settings and set \`DATABASE_URL\`. **Never paste passwords or database URLs into chat, code, commits, GitHub issues or public logs.** Both resources must be in the same Render region.

Do not invite public account registration until database connectivity, email verification, password recovery, abuse prevention, privacy policy and consent handling have been reviewed. Render Free PostgreSQL expires after 30 days and has no backups; upgrade to a persistent database before using real long-term accounts.

## Tests

\`\`\`bash
npm install --prefix silkdle --no-audit --no-fund
node --test silkdle/test/server.test.cjs
\`\`\`

With \`TEST_DATABASE_URL\` set to a disposable local test database, the test suite covers registration, case-insensitive username conflicts, login, rank scoring, leaderboard, logout and account deletion. GitHub CI provisions a temporary PostgreSQL container for integration testing.

## Security model

- Passwords are salted and hashed via scrypt; no plaintext password storage.
- Sessions use hashed random tokens in PostgreSQL, with HttpOnly SameSite=Strict cookies.
- SQL uses parameterized queries and a unique constraint for per-user per-day attempts.
- Server decides game time, matching, score and leaderboard entries.
- Rate limiting is basic and per process; distributed production rate limiting, email verification and bot detection must be added before a public launch.
- No claims are made that client-side image puzzles are entirely cheat-proof.

## Scope of next development

1. Connect database and run E2E deployment checks.
2. Add verified image assets, better image sequence pools and image moderation.
3. Email verification, password reset and privacy/data-retention controls.
4. Content administration, per-mode rankings and more daily questions.
