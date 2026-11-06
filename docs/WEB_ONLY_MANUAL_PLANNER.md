# Wheel Calculator — web-only, manual planning boundary

**Status:** Emerald v5 Admin Preview feature. This is a static website, not a game integration.

## What the website does

- Players select a server profile, CAP, Degree, equipment slot and saved SET.
- They manually enter a target number of Wheel lines (Fate planning), observed Blue values (Fortune review) and a desired single-line value (Pen planning).
- The planner compares entered and desired numbers **only**. An actual Wheel result must still be obtained in the game by the human player and typed into the item's existing editor.
- The three-stage selection, line target and Pen target are saved per item **inside the selected SET**, following existing server/CAP isolation. The data are included in JSON backups; pre-feature backups without these fields continue to import.
- The rest of the existing calculator can provide manually entered statistics, roll history, conditional probability *models* and budget estimates. None of those are real server measurements unless separately verified.

## What it must NEVER do

- No reading, controlling, launching, modifying or hooking into Silkroad Online clients, game processes or memory.
- No game packets, socket connections, login sessions, game server APIs or private endpoints.
- No bot control, phBot integration, automated gameplay, wheel clicking, item use or injection.
- No automatic import of character/item data from game clients.
- No representation of invented or player-entered server rules as official drop probabilities.

## Technical guardrails

- The web page uses only its own local browser state (localStorage), the static site's files, user-selected images and explicit JSON backup files.
- Both `index.html` and `bemutato.html` include CSP `connect-src 'none'; object-src 'none'`: these documents cannot initiate programmatic `fetch`, XHR, EventSource, WebSocket or similar network connections. Standard navigation to linked public pages remains possible.
- The planner's state-change helper only writes its own SET-bound planning metadata; it does **not** update real Blue line values or run any Silkroad command.
- The read-only SET link is a static fragment preview, not a game or data-synchronization endpoint.
- App tests check manual-only semantics, invalid inputs, per-SET/per-CAP storage, backup import and absence of socket/API use.

## Example player flow

1. Select a server and existing SET, then choose the item.
2. In the **Wheel** tab, enter how many lines you want in Fate. Compare with the manually recorded line count.
3. Enter any new observed lines in **Szett & itemek / SET & items** after you perform the roll yourself in the game.
4. Review the Fortune stage for the manually recorded Blue composition and overall quality.
5. In the Pen stage, choose a recorded line and manually enter a value target. The page shows the numerical difference and does not click anything in-game.
6. Save/export JSON if you want a portable copy of your planning data.

**Release check:** unit tests are not physical desktop/mobile browser or in-game verification. The full v5 remains a preview until those checks and authenticated server references are complete.
