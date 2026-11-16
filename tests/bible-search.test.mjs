import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('bundled KJV supports passage ranges and text search with complete data',async()=>{
 const context={};vm.createContext(context);
 vm.runInContext(await readFile(new URL('../bible-search.js',import.meta.url),'utf8'),context);
 const bible=context.WorshipBible;
 const verses=bible.parse(await readFile(new URL('../assets/bibles/kjv.vpl.txt',import.meta.url),'utf8'));
 assert.equal(verses.length,31102);
 const passage=bible.search(verses,'John 3:16-18');
 assert.equal(passage.length,1);assert.equal(passage[0].reference,'John 3:16-18');assert.equal(passage[0].slides.length,3);
 assert.match(passage[0].slides[0],/God so loved the world/);
 assert.equal(bible.search(verses,'Genesis 1:999').length,0);
 assert.ok(bible.search(verses,'God so loved').some(result=>result.reference==='John 3:16'));
 assert.throws(()=>bible.search(verses,'John 3:18-16'),/valid book/);
 assert.throws(()=>bible.parse('GEN 1:1 Incomplete'),/incomplete/);
});
