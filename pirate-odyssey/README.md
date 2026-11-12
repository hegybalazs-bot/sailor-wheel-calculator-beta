# Sailor Online: Pirate Odyssey — countdown microsite

Standalone bilingual (EN/HU) HTML/CSS/JavaScript countdown for four community-announced milestones:

| Milestone | Date (2026) |
| --- | --- |
| Cinematic trailer | November 22 |
| Detailed server presentation (Elitepvpers) | November 24 |
| Open beta | November 27 |
| Grand opening | December 11 |

**Source:** `pirate-odyssey/index.html` on this branch.
**No dependencies:** static HTML, CSS, JS, and inline SVG. No tracking, API, or external images.
**Timezone:** Europe/Budapest (CET, UTC+01:00). Because event hours were not supplied, each timer currently uses midnight at the start of the published date. Do not imply exact event start hours are confirmed.

## Deploy to Render Static Site

Use this repository and branch `feature/pirate-odyssey-countdown`.

- Build command: `mkdir -p public && cp pirate-odyssey/index.html public/index.html`
- Publish directory: `public`
- Auto deploy: enabled

This is an independent feature branch; no Wheel Calculator main-branch files have been modified.

## GitHub Pages alternative

In repository Settings → Pages, choose **Deploy from a branch**, branch `feature/pirate-odyssey-countdown`, folder `/ (root)`.
The countdown will be under the `/pirate-odyssey/` path, if Pages is enabled.

## Content

Community timeline supplied by user. The title is **Sailor Online: Pirate Odyssey**.
The page is an unofficial community fan page and links to the Sailor Online public Discord listing.
