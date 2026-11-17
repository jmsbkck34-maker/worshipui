// Convert a Bible SuperSearch plain-text export into the app's verse-per-line format ("GEN 1:1 text").
// Usage: node tools/bible-text-to-vpl.mjs input.txt output.vpl.txt
// The conversion itself lives in bible-search.js (WorshipBible.toVerseLines), shared with Settings → Licensed Bible versions.
import {readFileSync,writeFileSync} from 'node:fs';
await import('../bible-search.js');
const bible=globalThis.WorshipBible;
const lines=bible.toVerseLines(readFileSync(process.argv[2],'utf8'));
const verses=bible.parse(lines);
writeFileSync(process.argv[3],lines);
console.log(`${verses.length} verses, ${new Set(verses.map(v=>v.book)).size} books`);
