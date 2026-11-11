# Silkdle — web MVP

Standalone mobile-friendly Silkroad Online fan quiz, Chinese and European.

## First playable version
- Six playable modes: Mob Guess, Unique Hunter, Equipment, Mastery, Map Explorer, SRO Knowledge.
- Daily challenge in Europe/Budapest time and unlimited practice.
- Chinese / European / Mixed filters, HU / EN UI.
- 6-guess modes with progressive clues and 5-question classic quiz.
- Per-device results saved in localStorage; copyable score.
- Responsive layout; no dependencies, no trackers, no external images.

## Limitations
- Beta/demo content, not the full curated and validated 132-question bank.
- Daily challenges and answer keys currently run client-side and are not cheat-proof.
- No authentication, server-side admin, global leaderboard or official images yet.
- This is an unofficial Silkroad Online fan project.

## Deployment
A single static file: `silkdle/index.html`. Published as `/silkdle/` from the existing static host that exposes repository root. Code is intentionally isolated from the Wheel Calculator root app.

## Next steps
1. Independent repository and dedicated domain/site.
2. Licensed image assets.
3. Server-side question bank, secret answers, persistence, daily puzzle API.
4. Content editor and moderation workflows.
5. Import and review the existing 132-question seed, translate to EN.
