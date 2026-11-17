# WorshipUI status — 2026-11-16

Branch: `work/setlist-history-20261116` (version 0.3.4). Automated tests: 29 passing (`npm test`).

## Working in the demo

- **Livestream (OBS):** Screens → Livestream (OBS) gives an overlay address (http://127.0.0.1:48095/stream) to add in OBS as a Browser source over the camera, for YouTube or Facebook Live. It has a lower-third or full-screen layout and a language choice, follows Take live, Blackout and Clear, and shows the CCLI Streaming License number on songs. Verified in the installed app (overlay updates). OBS itself is not tested here; setup steps are in the README.
- **Slide editing:** drag slides to reorder them, or use ◀ Move / Move ▶, Duplicate slide (for example to repeat a chorus) and Delete slide. Section labels, screen targets and second translations move with their slides, and the live slide stays correct.
- **Licensed Bible versions (Settings):** import a text file for a version the church is licensed to use (for example NIV). It is stored only in the desktop app data folder, never in services, sync, backups or Git, and appears under Version when adding Scripture. Includes links to publisher permission pages and API sign-ups. Not tested in the installed app yet; tested with a stand-in in the automated tests.
- **Songs:** SongSelect text import with section labels. A newly imported song appears in search and loads into the editor. Each slide can have a section label (Verse 1, Chorus, …).
- **Scripture:**
  - Bundled KJV and Reina-Valera 1909, plus WEB as the English second translation.
  - Other translations come from YouVersion: **Get verses from YouVersion** loads the chapter from bible.com in a hidden window, reads the verses and closes it. A preview shows the slides before **Add**. Copying on bible.com and coming back also works.
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

- **macOS app:** it is built by GitHub Actions (`build-mac.yml`) and ad-hoc signed, but has not been run on a real Mac. The install steps, including Open Anyway, are in the README.
- Placing windows on a second physical display (the development PC has one display).
- The hidden **Get verses from YouVersion** fetch, added at the end of the session, passes the automated tests but has not been tried against live bible.com. The earlier visible-window version, which uses the same verse reader, was verified with John 3:16–17.
- The copy-and-paste YouVersion route was verified with one real bible.com copy (John 3:1). The in-app bible.com window was verified with John 3:16–17 in NIV and ESV.

## Requested, not built

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
