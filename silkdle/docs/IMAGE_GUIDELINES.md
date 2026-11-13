# Silkdle screenshot guidelines

## What makes a playable image?
- A **real Silkroad Online in-game screenshot** (or game client capture), not an AI illustration or a random picture from the historical Silk Road.
- One main identifiable subject; no target names, health bar names or chat messages that reveal the answer.
- At least 160×160 pixels; ideally 1280–1920px wide before client downscaling.
- Good contrast; enough distinguishing subject detail survives a close-up crop.
- Accurate answer, accepted aliases, category, Chinese/European tag, source and game-version notes.
- **Do not upload copyrighted third-party artwork without appropriate permission.** Original captures still contain game copyright. The historical 2006 Joymax fansite Q&A mentioned non-commercial use of images published on its official homepage, but its current applicability and the particular asset's provenance must be checked.
- Do not upload player identifying names or private chat in a way that would be shared publicly.
- Never claim a candidate row is a playable image until a real screenshot was uploaded, reviewed and approved.

## Image pipeline
1. Choose a candidate in Screenshot Studio, or enter a new accurately named entry.
2. Select one or multiple JPG/PNG screenshots, ensuring each image depicts the named target.
3. Admin frontend removes excess metadata by redrawing to a JPEG canvas and scales to a maximum of 1800 pixels on the longest edge.
4. Backend validates file type and dimensions, stores bytes in PostgreSQL and marks image `pending`.
5. Manually preview and check the answer (including common misspellings) and source.
6. Approve with explicit permission basis and descriptive rights note.
7. Only approved rows are returned to the game. Revoke immediately if the image or attribution is disputed.

## Difficulty
The renderer starts at approximately 1% of the image and zooms out as guesses fail. Keep crop centers off any obvious UI answer, label, or watermark. One screenshot should be one reviewed asset; crop zoom is computed dynamically. Avoid copying all crops as distinct binaries.

## Supported data
`silkdle/data/image-manifest.json` stores prepublication candidate slots. The persistent uploaded image records live in PostgreSQL and are never trusted merely because a JSON filename exists.
