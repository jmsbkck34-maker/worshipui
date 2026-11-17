import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('bundled KJV supports book, chapter and passage selection with complete data',async()=>{
 const context={};vm.createContext(context);
 vm.runInContext(await readFile(new URL('../bible-search.js',import.meta.url),'utf8'),context);
 const bible=context.WorshipBible;
 const verses=bible.parse(await readFile(new URL('../assets/bibles/kjv.vpl.txt',import.meta.url),'utf8'));
 assert.equal(verses.length,31102);
 assert.equal(bible.books().length,66);assert.equal(bible.chapters(verses,'JOH').length,21);
 assert.equal(bible.verseNumbers(verses,'JOH',3).length,36);
 const passage=bible.passage(verses,'JOH',3,16,18);
 assert.equal(passage.reference,'John 3:16-18');assert.equal(passage.slides.length,3);
 assert.match(passage.slides[0],/God so loved the world/);
 assert.throws(()=>bible.passage(verses,'GEN',1,999,999),/unavailable/);
 assert.throws(()=>bible.passage(verses,'JOH',3,18,16),/valid verse range/);
 assert.throws(()=>bible.parse('GEN 1:1 Incomplete'),/incomplete/);
});

test('bundled WEB loads, lists the bundled versions and skips verses the translation omits',async()=>{
 const context={};vm.createContext(context);
 vm.runInContext(await readFile(new URL('../bible-search.js',import.meta.url),'utf8'),context);
 const bible=context.WorshipBible;
 assert.equal(JSON.stringify(bible.versions.map(version=>version.id)),'["KJV","WEB","RVR1909"]');
 const verses=bible.parse(await readFile(new URL('../assets/bibles/web.vpl.txt',import.meta.url),'utf8'));
 assert.equal(verses.length,31098);
 assert.match(bible.passage(verses,'PSA',23,1,1).slides[0],/^Yahweh is my shepherd/);
 assert.equal(bible.verseNumbers(verses,'ACT',15).includes(34),false);
 const gap=bible.passage(verses,'ACT',15,33,35);
 assert.equal(gap.slides.length,2);assert.equal(JSON.stringify(gap.verseReferences),'["Acts 15:33","Acts 15:35"]');
 assert.throws(()=>bible.passage(verses,'ACT',15,34,35),/unavailable/);
});

test('Spanish RV 1909 aligns verse for verse and labels references in Spanish',async()=>{
 const context={};vm.createContext(context);
 vm.runInContext(await readFile(new URL('../bible-search.js',import.meta.url),'utf8'),context);
 const bible=context.WorshipBible;
 assert.equal(bible.languages[0].id,'es');assert.equal(bible.languages[0].bible,'RVR1909');
 const kjv=bible.parse(await readFile(new URL('../assets/bibles/kjv.vpl.txt',import.meta.url),'utf8'));
 const rv=bible.parse(await readFile(new URL('../assets/bibles/rv1909.vpl.txt',import.meta.url),'utf8'));
 assert.equal(rv.length,31102);
 const english=bible.passage(kjv,'JOH',3,16,17);
 const spanish=bible.parallel(rv,english.verses,'es');
 assert.equal(spanish.length,2);assert.equal(spanish[0].reference,'Juan 3:16');assert.match(spanish[0].text,/^Porque de tal manera amó Dios al mundo/);
 assert.equal(bible.passage(rv,'REV',1,1,1,'es').reference,'Apocalipsis 1:1');
 const web=bible.parse(await readFile(new URL('../assets/bibles/web.vpl.txt',import.meta.url),'utf8'));
 assert.throws(()=>bible.parallel(web,bible.passage(kjv,'ACT',15,34,34).verses),/not in the second translation/);
});

test('paragraph marks in the source text never reach slides',async()=>{
 const context={};vm.createContext(context);
 vm.runInContext(await readFile(new URL('../bible-search.js',import.meta.url),'utf8'),context);
 const verses=context.WorshipBible.parse(await readFile(new URL('../assets/bibles/kjv.vpl.txt',import.meta.url),'utf8'));
 assert.equal(verses.filter(verse=>verse.text.includes('¶')||verse.text.includes('  ')).length,0);
 assert.match(context.WorshipBible.passage(verses,'JOH',3,16,16).slides[0],/^For God so loved the world/);
});
