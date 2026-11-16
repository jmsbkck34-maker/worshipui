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
