import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const context={};context.window=context;vm.createContext(context);
for(const file of ['bible-search.js','email-requests.js'])vm.runInContext(await readFile(new URL('../'+file,import.meta.url),'utf8'),context);
const {WorshipEmail,WorshipBible}=context;
const parse=(subject,text)=>JSON.parse(JSON.stringify(WorshipEmail.parse({subject,text},WorshipBible.bookId)));

test('a setlist email becomes a list of songs, without greetings, numbering or quoted replies',()=>{
 const result=parse('Setlist for Sunday','Hi James,\n\n1. Amazing Grace\n2) How Great Is Our God - key of G\n• Cornerstone\n\nThanks!\nMaria\n\nOn Tue, Nov 17, 2026 Pastor wrote:\n> old list\n> Way Maker');
 assert.equal(result.kind,'setlist');
 assert.deepEqual(result.songs,['Amazing Grace','How Great Is Our God','Cornerstone','Maria']);
});

test('a Spanish setlist subject works too',()=>{
 assert.deepEqual(parse('Canciones para el domingo','Sublime Gracia\nCuán Grande Es Él').songs,['Sublime Gracia','Cuán Grande Es Él']);
});

test('a short list without a subject keyword is still read as a setlist',()=>{
 assert.equal(parse('Sunday','Amazing Grace\nCornerstone\nGoodness of God').kind,'setlist');
});

test('a Scripture request finds the reference, in English or Spanish',()=>{
 const english=parse('Scripture reading','Could we read John 3:16-18 this week?');
 assert.equal(english.kind,'scripture');
 assert.deepEqual(english.reference,{book:'JOH',chapter:3,first:16,last:18});
 assert.equal(english.verses,'');
 const spanish=parse('Lectura','Juan 3:16');
 assert.deepEqual(spanish.reference,{book:'JOH',chapter:3,first:16,last:16});
 const numbered=parse('Verse for Sunday','1 Corinthians 13:4-7 please');
 assert.deepEqual(numbered.reference,{book:'1CO',chapter:13,first:4,last:7});
});

test('verse text pasted after the reference is kept as the passage',()=>{
 const result=parse('Scripture','Psalm 23:1 (KJV)\nThe Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures.');
 assert.equal(result.kind,'scripture');
 assert.match(result.verses,/^The Lord is my shepherd/);
});

test('other emails are notes, and words that look like references but are not books are ignored',()=>{
 assert.equal(parse('Question','Can we start at 10:30 instead? The band meets at 9:15.').kind,'note');
 assert.equal(parse('','').kind,'note');
});

test('song titles match regardless of case, accents and punctuation',()=>{
 assert.equal(WorshipEmail.songKey('Cuán Grande Es Él!'),WorshipEmail.songKey('cuan grande es el'));
});
