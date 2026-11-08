# Wheel Calculator — Sailor Online admin verification request
**Project:** Emerald v5 beta • **Requested scope:** first verify Sailor 90 CAP / 9DG, then expand by CAP/degree.
**Public demo:** https://sailor-wheel-calculator-beta.onrender.com/publikus.html
**Feature demo:** https://sailor-wheel-calculator-beta.onrender.com/bemutato.html
**Status:** This is a player-entered, local-only calculator; its probability outputs are models, NOT measured or official Sailor drop rates.

Hello Sailor Online Team,

We have built a standalone Wheel Calculator with multilingual SET editing, optional CH/EU equipment categories, Wheel of Fate/Fortune/Feather Pen planning, item quality comparisons, and browser-local JSON backups. We would appreciate a technical review so the tool can represent the real Sailor rules accurately rather than make guesses.

## First milestone: 90 CAP / 9DG

Please supply or confirm:
1. **Line limits per Normal / SoS / SoM / Sun** and any different limits for weapons, shields, clothes, jewelry.
2. **Each possible Blue type by item class** (Chinese Armor, Protector, Garment; European Heavy, Light, Robe; jewelry, shields, every weapon type), plus which types can coexist.
3. **Per-line value bounds and 100% reference numbers:** STR/INT, HP/MP, Parry, Attack Rate, Blocking Rate, Critical, Freezing, Durability, resistances, special cases and any per-weapon exceptions.
4. **Wheel of Fate:** whether it changes the number of Blue lines, legal counts, limits and any stage dependencies.
5. **Wheel of Fortune:** whether line count stays constant, and whether all Blue types and values are rerolled; actual distribution if available.
6. **Feather Pen:** whether only one randomly selected Blue value is changed; line-selection probability and per-type value distribution if available.
7. **Prices/currencies and availability** only if consistent and documented for this exact server/season.

## What counts as verified evidence

- A server-owned announcement with direct link, or explicit written confirmation from an authorized staff member (name, role and verification date).
- A screenshot showing the exact server, CAP/degree, equipment slot, item grade and on-screen Blue results. Repeated observations prove possible outcomes, **not** exact probabilities.
- For probability claims, original configuration or sufficiently documented methodology/sample-size. A list of possible values alone cannot establish the probability of each value.
- For original game graphics on a PUBLIC website, permission from the artwork rights holder or a license explicitly allowing redistribution; staff permission alone may not cover third-party IP.

## Standard response template

| Field | Answer / evidence |
|---|---|
| Server / season | Sailor Online — [name] |
| CAP / Degree | 90 CAP / 9DG |
| Item region / class / slot / grade | [e.g. CH / Garment / Shoulder / SoS] |
| Allowed Blue types | [list or official URL] |
| Min / max per Blue | [values and units] |
| Max line count | [Normal / SoS / SoM / Sun values] |
| Probability distribution, if known | [specific data or “not published”] |
| Evidence source | [official URL, screenshot or documented staff confirmation] |
| Verified by / role / date | [...] |
| Authorization to publish original icons? | [yes/no; license source] |

For other CAPs (100, 110, 120, 125, 130, 140) repeat this template. No numerical claims will be marked official until traceable evidence exists.

**Privacy/security:** No credentials, game client connection, phBot, item reading or game automation is requested. All game values are entered manually by the player.


## Ready-to-fill verification worksheet

GitHub Actions now generates the artifact `wheel-blue-admin-review-template` containing **Sailor_Blue_Verification_Template.csv** with **420 rows** covering all seven CAPs, the six CH/EU apparel families, four jewelry slots per region, fourteen weapon types and CH/EU shields. Each row includes the current generic Blue-type list **clearly labeled UNVERIFIED_REFERENCE_ONLY**. Columns for official possible types, Normal/SoS/SoM/Sun line maximums, per-type value limits, type probability, value distribution, evidence URL, reviewer and date are deliberately blank.

Please fill in only rules and evidence you can confirm. Leave unknown probabilities blank; do not convert zero recorded examples into 0% odds. The Degree column is the calculator's present default reference; verify the actual Sailor season and item Degree separately. Provide this CSV back alongside any screenshots and published sources; no bot/client credentials or executable files are needed.
