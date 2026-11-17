# WorshipUI status — 2026-11-16

Branch: `work/setlist-history-20261116` (version 0.3.3). Automated tests: 26 passing (`npm test`).

## Working in the demo

- **Songs:** SongSelect text import with section labels. A newly imported song appears in search and loads into the editor. Each slide can have a section label (Verse 1, Chorus, …).
- **Scripture:**
  - Bundled KJV and Reina-Valera 1909, plus WEB as the English second translation.
  - Other translations come from YouVersion: **Open passage in YouVersion** opens bible.com in a WorshipUI window, and **Use these verses** brings the verses in and closes that window. Copying on bible.com and coming back also works.
  - The second language (Spanish by default) is added with a button.
  - Each Scripture item switches between one verse per slide and all verses on one slide.
- **Language:** the English / Español toggle switches the whole interface (`i18n.js`) and the Scripture language options.
- **Slide template:** motion backgrounds and fonts, and a draggable text position.
- **Presenting:**
  - Double-click a slide to take it live. Space advances.
  - Blackout shows the church logo.
- **Screens:**
  - Two audience screens, each showing both languages, the first only or the second only. Slides can target one screen.
  - Screen setup detects displays, shows a map of them, has Identify, and opens each output fullscreen on its assigned display.
- **Setlists:**
  - Dated setlists listed under the calendar: click to open, × to delete. Deleted setlists go to the recovery copies.
  - A warning appears before switching away from unsaved or unpublished changes.
- **Branding:** church name, address and logo, shared through `/api/branding`.
- **Backups:** **Back up** and **Restore backup** in the left column.
- **App:** named WorshipUI, with its own icon.

## Not tested yet

- Placing windows on a second physical display (the development PC has one display).
- The copy-and-paste YouVersion route was verified with one real bible.com copy (John 3:1). The in-app bible.com window was verified with John 3:16–17 in NIV and ESV.

## Requested, not built

- **Song editing:** drag to reorder song slides; duplicate a slide (for example, repeat the chorus).
- **Media:** PowerPoint import (with animations when PowerPoint is installed), timed slides, background music, countdown timer. Waiting on a decision: keep media on the computer it was added to until a shared server host is chosen?
- **Machine translation** of non-Scripture text. Needs a provider choice (for example Azure Translator).
- **Shared server:** deleting a setlist there (deletion is local only today), recent-setlist history, a shared song library.
- **NET Bible:** headings are fused into the verse text in the downloaded file, so it was not imported.

## Notes

- **Reading bible.com:** "Use these verses" reads the text shown on bible.com in a WorshipUI window, at the user's request. YouVersion's terms may not allow this, and it depends on bible.com's page layout (verses are elements with `data-usfm`).
- **Desktop build quirks:** see the memory notes in the development environment. In short:
  - put the project-local Node on PATH;
  - clear `ELECTRON_RUN_AS_NODE` before launching from VS Code;
  - the winCodeSign cache folder was prepared by hand.
