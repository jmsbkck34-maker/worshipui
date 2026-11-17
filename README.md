# WorshipUI

Local-first service preparation and presentation, with shared revision-based editing for a home editor and a church operator.

## Start locally on Windows

Run `powershell -ExecutionPolicy Bypass -File .\start-local.ps1` from this folder. Open **http://127.0.0.1:8091**. The launcher uses Node.js when installed, or VS Code's bundled Node runtime for local development. For normal hosting, use Node.js 22+ and `npm start` (port 8090 by default). No npm dependencies or build step are required.

The local preview is bound to your own computer. It is not accessible from home or church over the internet until a shared HTTPS host is configured.

## Prepare accounts

Stop the server before creating accounts; the initial single-process store loads accounts at startup. The account script uses Node.js or the installed VS Code development runtime:

```powershell
.\add-user.ps1 -Username home-editor -Role editor
.\add-user.ps1 -Username church-operator -Role operator
npm start
```

The script prompts privately for each password (12–256 characters). Do not put passwords in command arguments, source control, or chat. `server-run.mjs add-user` also accepts a JSON account through stdin for container provisioning; run it against the same persistent data directory while the server is stopped. There is no public account-registration endpoint.

## Home-to-church workflow

Use the **Setlist calendar** at the upper left to open a date, or **Copy to date** to start with the current service. **Undated service** returns to the original workspace. Each date keeps its own local setlist and shared revision history. Leave Live mode and finish editing before switching. Offline edits remain on this device and are sent when connected; if another device changed the same date, open it and review the conflict. The shared server must run this version before dated setlists can sync.

1. Both computers open the **same HTTPS address** and sign in to their separate accounts.
2. First connection: review the shared service before replacing an existing local service, or explicitly keep and publish the local version. An empty server receives the first published service.
3. At home, edit the service normally. In preparation mode changes publish after a short pause; connected computers check every five seconds. Unsaved edits and open item editors prevent incoming updates from replacing local work.
4. At church, wait for **All changes downloaded** and **App downloaded**. These are separate checks: text content is saved in browser storage and application files in the offline cache.
5. Choose **Enter Live mode** before worship. Incoming changes wait for review. The review shows both complete copies and a change summary. Only the operator chooses when to apply them. Applying an update never changes the projected slide; **Take live** is a separate local action.
6. If both people change the service, neither copy silently wins. Review the copies and choose the shared version or explicitly keep and publish the local version. The server checks the revision again during that save; another intervening update produces another conflict.
7. Export backups before important services. Replacing a local copy also retains the last five recovery snapshots; **Download recovery** exports the latest one. Shared **Version history** can restore an earlier service locally and publish it as a new revision.

## During an outage

Once the app download and service download are complete, the prepared service, backgrounds, audience screen, stage screen, and live controls use this computer. They do not require a server round trip. Offline reload uses the cached app shell; use the same browser profile and exact address. Remote updates and sign-in require connectivity; saved content and locally retained operator mode do not. Reconnection resumes checking when the sign-in session is still valid; an expired session needs sign-in when online.

Keep the browser's stored site data, export backups, and test an actual disconnected rehearsal on church hardware. Browser data eviction, clearing site data, a different profile/address, or a first-ever offline visit can remove/prevent the offline copy. Offline caching requires HTTPS, or localhost/127.0.0.1 in development. New software versions wait until existing app windows close rather than replacing a running service.

## Presentation

Audience and Stage open separate local windows. Allow pop-ups, move Audience to the projector, and select Enter fullscreen. Arrows change preview; Space takes the first selected slide live, then advances the live presentation. B toggles blackout; advancing preserves blackout or cleared text. Remote editors can prepare content; their UI disables live controls. The server has **no live-output API**: projection data is kept in the church browser and never synchronized through the shared service API. Role checks in the UI are convenience controls; the isolation comes from not exposing remote projection control at all.

## Hosting preparation

A Dockerfile is included. Use one app process/replica with a persistent disk mounted at `/data`; keep it across restarts and back it up. Set `WUI_ORIGIN` to the exact public HTTPS origin and terminate TLS at the hosting proxy. The container binds port 8090; set the platform target port accordingly. Production sessions use Secure, HttpOnly, SameSite=Strict cookies. State-changing API requests require the configured origin and JSON. Login attempts are rate-limited; sessions expire after 12 hours and reset after a server restart.

`HOST`, `PORT`, `WUI_ORIGIN`, and `WUI_DATA_DIR` are optional runtime settings. The file-backed store serializes saves and uses atomic replacement. It is designed for one small shared workspace, not multiple replicas or a multi-tenant SaaS. Accounts share that workspace. A larger hosted product should move revision storage to a transactional database and add account administration. This project has not been deployed; hosting selection remains open.

## Checks

With Node.js 22+: `npm test`. Tests cover authentication, protected data files, same-origin enforcement, concurrent saves, revision conflicts, history, persistence, local recovery, review snapshots, live-output isolation, editor controls, offline navigation, and offline presentation. Frontend tests use a simulated DOM and service-worker environment; they do not establish browser layout, real service-worker lifecycle, or physical projector compatibility.

## Lyrics and Scripture sources

Choose **Add service item** and select **Song** to search the local song library, save an entered song as a reusable template, or import an authorized TXT, ChordPro, OpenLyrics XML, or CSV file. Saved songs appear after you enter a search term. Right-click a song slide, or select it and choose **Set selected slide section**, to label it Verse, Chorus, Bridge, or another section. Labels appear only in the editor and are saved with the service and manually saved templates. Imported files are copied into the desktop app's `songs` folder under its user-data directory; **Open song folder** opens it. Save a SongSelect download there or elsewhere and then select it with **Import a song file**. The app cannot change an external browser's download destination. The song library and files remain on this device; a song added to a service is included in that service's exports and shared revisions.

Use **Open SongSelect** or **Settings** for a direct link to [CCLI SongSelect](https://songselect.ccli.com/). SongSelect access to lyrics is included for churches with an active [CCLI Church Copyright License](https://ccli.com/us/en+songselect/church-copyright-license); it is not an unrestricted free catalog. WorshipUI does not sign in to SongSelect or fetch lyrics. Check imported title, writer, and copyright notices before display.

Settings can store Church Copyright, Streaming, Streaming Plus, and Rehearsal license numbers on the current device. When configured, the Church Copyright number is shown as `CCLI License #...` on Song slides; the other numbers are stored but not printed. These numbers are not included in service exports or shared revisions. Follow CCLI's current terms and keep required song title, writer, and copyright notices with reproduced lyrics.

Choose **Add service item**, select **Scripture**, and select a book, chapter, and verse range from the included KJV. Choose one verse per slide or combine all verses on one slide, then add the passage; when editing an existing item, the selection fills the editor for review instead. Combined passages shrink to fit the preview and audience screens; long passages can become too small to read, so check before projecting. A title is optional for manually entered Scripture. The bundled public-domain KJV is sourced from [eBible.org](https://ebible.org/find/details.php?id=engkjv); see the bundled notice for UK printing restrictions. Other complete translations are not bundled or indexed.

Settings also supports pasted Scripture or `.txt`, `.csv`, USFM (`.usfm`, `.sfm`), and USX (`.usx`) passage files. CSV files need a `text` or `verse` column and may include a `reference` column. Choose one verse per slide or combine the verses on one slide; combined text is limited to 20,000 characters per translation. Choose the primary version and optionally enter a passage reference in Settings; optionally add a second translation by entering its name and pasting or importing its text. Both versions appear side by side and must have matching verse counts. The English-only primary selector uses nine English entries from the [2025 ECPA bestseller list](https://new.christianbookexpo.com/bestseller/translations.php?id=BO25); it replaces the list's Spanish Reina-Valera with The Message, so it is not itself a strict sales ranking. Selecting a name does not download the translation.

Imported Scripture is added as a service item and saved with the local service. It can therefore appear in JSON exports, recovery files, and shared revisions. Import only Scripture your church is licensed or otherwise authorized to display; follow any attribution, reporting, storage, copying, territory, and offline-use conditions.

Bible provider details and current plans:
- [API.Bible documentation](https://docs.api.bible/): the Starter plan includes up to three licensed Bibles for non-commercial use and 5,000 calls per month. Its licensing terms constrain storage and copying; this local-file importer does not make API.Bible requests or claim compliance for downstream uses.
- [ESV API terms](https://api.esv.org/api/): free for qualifying non-commercial use, with attribution and a 500-verse local-cache limit.
- [eBible.org](https://ebible.org/): downloadable Bible files are available; terms vary by translation and edition.

Plans and licensing terms can change. Direct provider APIs and OAuth are deferred; the Settings hub only links to providers and imports authorized local files.

## Current content scope

Songs, imported or manually entered Scripture, announcements, sermons, gradient backgrounds, and JSON backup import/export. Sample content includes traditional Amazing Grace lyrics and KJV Psalm 100. Static background images are embedded with service content and synchronize with its revision. There is no video library or separate media-streaming service.

## Windows desktop app (church computer)

The generated installer is `release/WorshipUI-Setup-0.3.2.exe`. Install on Windows x64 and launch WorshipUI from the desktop shortcut. The full interface is bundled; no Node.js installation, browser cache, internet access, or sign-in is required to prepare and present a local service. The preview can also be launched from `release/win-unpacked/WorshipUI.exe` without installing it; keep that whole folder intact.

The desktop app stores its service, sync baseline, and recovery snapshots under the Windows user profile in `WorshipUI/workspace/device.json` inside the app's Roaming AppData folder. Each successful save atomically replaces the file and retains the previous workspace as `device.previous.json`. Do not edit these files while the app is running. A corrupt current file produces an error rather than silently replacing your service. Export JSON backups to another drive before important services. Uninstalling retains the workspace; the file store is separate from the installation directory.

To move a service from the browser prototype: use **Export** there, launch the desktop app, and choose **Import**. The desktop has its own workspace and does not automatically read another browser's storage.

Use **Shared server** to enter the HTTPS address of your shared backend. Leave it blank for independent operation. The saved service stays on this computer when you change the server. Server changes reset the sync baseline, so the first incoming version is reviewed before replacing local content. Leave Live mode before changing connections. Sign in with the church operator account to sync; a desktop restart requires signing in again when online, but local preparation and presentation remain available. Session cookies stay in the app's main process memory and are not exposed to page scripts or persisted with services.

Audience and Stage are local desktop windows and work without connectivity. A new app session starts with blank live output, rather than automatically redisplaying last week's slide. Only one instance of the desktop workspace runs at a time. Closing the main window closes its display windows; Live mode asks before closing. Remote content cannot navigate the app away from its bundled interface, create arbitrary windows, or access Node.js APIs.

Before first church use, rehearse the real workflow: import the service, close/reopen the app, disconnect internet, open Audience and Stage, advance slides, clear lyrics, and blackout. Automated tests cover persistence and local screen serving; physical projector/display placement and the complete disconnected desktop workflow still need a hardware rehearsal. The current installer is unsigned and this is a development preview. Static background images are stored inside the service for offline use. Video imports and playback have not been implemented.

### Desktop development

- `npm ci` installs locked development dependencies.
- `npm run desktop` launches the app from source.
- `npm test` runs shared-service, frontend, offline-cache, and desktop storage/proxy tests.
- `npm run build:win` generates the Windows x64 NSIS installer without publishing anything.

A project-local Node runtime was used for this build, under ignored `.tools/`. It is not included in the installer or source control. Build output is ignored under `release/`. The shared web backend remains independently deployable; the desktop app connects to it through its local proxy and does not bundle server user accounts or any server workspace database.

## Slide template editor

Choose **Edit slide template** below the slide thumbnails. It edits all slides in the current service item, with immediate thumbnail and preview updates. The audience output remains unchanged until **Take live**.

- **Color wheel** opens the system color picker. **Pick screen color** uses the screen eyedropper when supported; Escape cancels it. Unsupported browsers disable the eyedropper while keeping the color picker available.
- **Import image** accepts PNG, JPEG, and WebP files up to 10 MB. Images are resized to fit within 1920×1080, converted to JPEG, and embedded in the service. The background fills the screen with center cropping. Use **Remove image** or one of the gradient swatches to return to a preset background.
- **Font** selects a system font, and **Font size** accepts 24–200 on the slide's 1920-pixel reference width. Preview and output scale together. Fonts marked included are bundled with the app and work offline. Other font choices use the fonts installed on each computer, with a system fallback if unavailable.

Templates and embedded images are included in local saves, desktop recovery files, JSON exports, shared revisions, and audience snapshots. Services with no template continue to use their existing gradient and the default font. A service remains subject to the existing shared-service/import size limit; the editor rejects changes that would exceed that limit instead of dropping the image. These are static background images; video support is still separate work.

## Fonts and motion backgrounds (0.3.2)

**Edit slide template** now offers 29 font families. Inter, Montserrat, Lato, Merriweather, Playfair Display, Oswald, Poppins, and Source Sans 3 are bundled with their original SIL Open Font License notices in `assets/fonts/`. They require no internet access or separate font installation. The remaining choices use local system fonts. Included fonts are also cached for browser-based offline use; the desktop installer includes the font files directly.

Choose one of six built-in **Motion backgrounds**: Aurora Drift, Ocean Flow, Warm Glow, Quiet Clouds, Starfield, or Light Rays. These are locally generated animated backgrounds, not streamed videos. They appear in slide thumbnails, preview, and audience output, with text remaining still. **Animate background** can pause the motion, and the operating system's reduced-motion setting keeps the backgrounds static. Motion choices, pause state, and fonts save in the service, export/import, recovery files, and shared revisions. Existing templates remain compatible.

Selecting a motion background changes the prepared item only; the current audience snapshot stays unchanged until **Take live**. Clear lyrics leaves the motion running; Blackout removes the motion and shows black. Update the shared backend from the same version before syncing motion templates. The Windows installer for this version is under `release/0.3.2/`.

## Branding, text position and quick live (0.3.3)

**Settings → Church branding** stores the church name, address and logo (PNG, JPEG or WebP, resized to fit 800×800 and embedded). The name and logo appear in the workspace header. When **Show logo on the audience screen during blackout** is on, Blackout shows the logo centered on black instead of an empty screen. Branding is saved on each computer and, when signed in, shared through `/api/branding` with the same revision checks as services. If two computers change branding before syncing, Settings asks which copy to keep; nothing is overwritten silently. Branding is not synced while Live mode is on.

**Edit slide template → Text position** moves the text box: drag the text on the preview or use the left–right, up–down and width sliders. **Center text** restores the default layout. The position applies to every slide in the item and to the audience screen; the stage screen stays centered.

**Edit slide template → Verses** switches a Scripture item between one verse per slide and all verses on one auto-fit slide. Passages combined before this version cannot be split again; re-add them to use the button.

Importing a song file shows it in the song search and loads it into the editor. SongSelect text files use the first line as the title, turn “Verse 1”, “Chorus” and similar headers into section labels, and keep the CCLI credit block as a final slide labelled “Copyright”.

Double-click a slide thumbnail to take it live. A single click still only changes the preview.

## Scripture versions and second language

Add item → Scripture offers the bundled **KJV** or **Another version · YouVersion**. For another version, choose the YouVersion translation and the passage, select **Open passage in YouVersion** (bible.com opens in the system browser), copy the verses there and paste them back. Pasted text that includes verse numbers becomes one slide per verse; without them the passage becomes one auto-fit slide. YouVersion has no export, so text comes back by copy and paste. Check each translation’s copyright terms for projection and streaming.

**Settings → Second language** chooses the default second language (Spanish to start). While adding Scripture, **+ Add Spanish · RVR1909** adds the same verses from the bundled Reina-Valera 1909 as the second translation, aligned verse for verse. It is off until pressed for each passage. Languages without a bundled public-domain Bible do not show the button yet.

Bundled texts (KJV, WEB, Reina-Valera 1909) are public domain; see `assets/bibles/NOTICE.txt`. `tools/bible-text-to-vpl.mjs` converts other Bible SuperSearch plain-text exports to the app’s format.

## Main language and audience screens

The **English / Español** toggle under the WorshipUI name sets the main language. With Spanish as main, the bundled Bible is Reina-Valera 1909, book names appear in Spanish, YouVersion lists Spanish translations first, and the second-language buttons add English (KJV). With English as main, the second language comes from Settings.

The live column's **Audience screens** panel opens Screen 1 and Screen 2 and sets what each shows: both languages, the first language only, or the second only — for example English on one projector and Spanish on the other. **Selected slide shows on** sends a slide to all screens or to one screen; the other screen keeps what it was showing. Blackout and Clear lyrics apply to every screen. The header **Audience** button opens Screen 1.

The **English / Español** toggle also switches the whole interface — menus, buttons, dialogs, status messages and the Audience/Stage windows — between English and Spanish (`i18n.js`). Slide content, item titles, lyrics, Scripture and anything typed into fields are never translated. `tests/i18n.test.mjs` fails if a new label in `index.html` has no Spanish translation.
