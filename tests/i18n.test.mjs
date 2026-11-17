import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

async function loadI18n(){
 const context={window:{addEventListener(){},localStorage:{getItem:()=>null}},document:{documentElement:{}}};
 context.window.window=context.window;vm.createContext(context);
 vm.runInContext(await readFile(new URL('../i18n.js',import.meta.url),'utf8'),context);
 return context.window.WorshipI18n;
}
// Names and proper nouns that stay as written in both languages.
const unchanged=new Set(['Worship','UI','Español','CCLI SongSelect','API.Bible','ESV API','eBible.org']);

test('every static interface label in index.html has a Spanish translation',async()=>{
 const i18n=await loadI18n();
 const html=(await readFile(new URL('../index.html',import.meta.url),'utf8')).replace(/<script[\s\S]*?<\/script>/g,'');
 const strings=new Set();
 for(const match of html.matchAll(/>([^<>]+)</g)){const text=match[1].replace(/\s+/g,' ').trim();if(/[A-Za-z]{2}/.test(text))strings.add(text)}
 for(const match of html.matchAll(/(?:placeholder|aria-label|title)="([^"]+)"/g))strings.add(match[1]);
 // Bible version names in the import list are proper names.
 const missing=[...strings].filter(text=>!unchanged.has(text)&&!/\((?:NIV|ESV|KJV|NLT|NKJV|CSB|NIrV|NRSV|NASB|MSG)\)$/.test(text)&&i18n.translate(text)===null);
 assert.deepEqual(missing,[]);
});

test('built messages translate with their values, and unknown text is left alone',async()=>{
 const i18n=await loadI18n();
 assert.equal(i18n.translate('Loading the RVR1909…'),'Cargando RVR1909…');
 assert.equal(i18n.translate('Song · 3 slides'),'Canto · 3 diapositivas');
 assert.equal(i18n.translate('+ Add English · KJV'),'+ Agregar Inglés · KJV');
 assert.equal(i18n.translate('All changes downloaded · revision 12'),'Todos los cambios descargados · revisión 12');
 assert.equal(i18n.translate('Take live'),'Poner en vivo');
 assert.equal(i18n.translate('Amazing grace! How sweet the sound'),null);
 assert.equal(i18n.translate('SLIDE 01 · SELECTED · Verse 1'),'DIAPOSITIVA 01 · SELECCIONADA · Estrofa 1');
 // The app appends to captions already shown in Spanish.
 assert.equal(i18n.translate('DIAPOSITIVA 02 · Coro 1 · Screen 2'),'DIAPOSITIVA 02 · Coro 1 · Pantalla 2');
 assert.equal(i18n.translate('6 items · 23 slides saved locally. Check text size and your projector before starting.'),'6 elementos · 23 diapositivas guardadas en este equipo. Revisa el tamaño del texto y el proyector antes de comenzar.');
});
