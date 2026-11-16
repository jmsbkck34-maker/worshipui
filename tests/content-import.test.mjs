import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../content-import.js',import.meta.url),'utf8');
const normalize=value=>JSON.parse(JSON.stringify(value));
const text=value=>({nodeType:3,nodeValue:value,childNodes:[]});
function importerWithXml(document) {
 const context={window:{DOMParser:class{parseFromString(){return document}}}};
 vm.runInNewContext(source,context);
 return context.window.WorshipContentImport;
}

test('imports plain lyrics and ChordPro while preserving slide breaks',()=>{
 const importer=importerWithXml(null);
 assert.deepEqual(normalize(importer.parseLyricsFile('welcome.txt','First slide\n\nSecond slide')),[
  {title:'welcome',slides:['First slide','Second slide']}
 ]);
 assert.deepEqual(normalize(importer.parseLyricsFile('song.pro','{title: Test Song}\n[C]First line\n[G]Second line\n\n{start_of_chorus}\n[F]Chorus')),[
  {title:'Test Song',slides:['First line\nSecond line','Chorus']}
 ]);
});

test('imports SongSelect text with title, section labels and credit block',()=>{
 const importer=importerWithXml(null);
 const file='O Come All Ye Faithful\n\nVerse 1\nO come all ye faithful\nJoyful and triumphant\n\nChorus\nO come let us adore Him\nChrist the Lord\n\nC. Frederick Oakeley\nCCLI Song #31054\n© Words: Public Domain';
 assert.deepEqual(normalize(importer.parseLyricsFile('O Come All Ye Faithful-lyrics.txt',file)),[{
  title:'O Come All Ye Faithful',
  slides:['O come all ye faithful\nJoyful and triumphant','O come let us adore Him\nChrist the Lord','C. Frederick Oakeley\nCCLI Song #31054\n© Words: Public Domain'],
  sectionLabels:['Verse 1','Chorus','Copyright']
 }]);
});

test('imports multiple CSV songs and quoted multiline lyrics',()=>{
 const importer=importerWithXml(null);
 const items=importer.parseLyricsFile('songs.csv','title,lyrics\n"Amazing, Grace","First line\nSecond line"\nSecond,"Another song"');
 assert.deepEqual(normalize(items),[
  {title:'Amazing, Grace',slides:['First line\nSecond line']},
  {title:'Second',slides:['Another song']}
 ]);
});

test('imports OpenLyrics verses as separate slides',()=>{
 const lines={nodeType:1,localName:'lines',childNodes:[text('First line'),{nodeType:1,localName:'br',childNodes:[]},text('Second line')],getElementsByTagName:()=>[]};
 const verse={nodeType:1,localName:'verse',childNodes:[lines],getElementsByTagName:name=>name==='lines'?[lines]:[]};
 const document={getElementsByTagName:name=>{
  if(name==='parsererror')return [];
  if(name==='title')return [{textContent:'Open Hymn'}];
  if(name==='verse')return [verse];
  return [];
 }};
 const importer=importerWithXml(document);
 assert.deepEqual(normalize(importer.parseLyricsFile('song.xml','<song/>')),[{title:'Open Hymn',slides:['First line\nSecond line']}]);
});

test('imports Scripture CSV, USFM, and USX verse text',()=>{
 const importer=importerWithXml(null);
 assert.deepEqual(normalize(importer.parseScriptureFile('verses.csv','reference,text\n"John 3:16","First verse"\n"John 3:16","Second verse"')),{reference:'John 3:16',slides:['First verse','Second verse']});
 assert.deepEqual(normalize(importer.parseScriptureFile('passage.usfm','\\id JHN\n\\c 3\n\\p\n\\v 16 God so loved \\f + \\ft note\\f* the world.\n\\v 17 For God did not send.')),{reference:'',slides:['God so loved the world.','For God did not send.']});

 const verse=(number)=>({nodeType:1,localName:'verse',childNodes:[],getAttribute:name=>name==='number'?number:null});
 const usx={nodeType:1,localName:'usx',childNodes:[verse('1'),text('First verse'),verse('2'),text('Second verse')]};
 const document={getElementsByTagName:name=>name==='parsererror'?[]:name==='usx'?[usx]:[]};
 const usxImporter=importerWithXml(document);
 assert.deepEqual(normalize(usxImporter.parseScriptureFile('passage.usx','<usx/>')),{reference:'',slides:['First verse','Second verse']});
});

test('rejects malformed or oversized imports rather than partially importing',()=>{
 const importer=importerWithXml(null);
 assert.throws(()=>importer.parseLyricsFile('songs.csv','name,words\nSong,Text'),/needs a “lyrics” or “text” column/);
 assert.throws(()=>importer.parseScriptureFile('verses.csv','reference,words\nJohn,Text'),/needs a “text” or “verse” column/);
 assert.throws(()=>importer.parseLyricsFile('song.txt','x'.repeat(20001)),/20,000 characters or fewer/);
 assert.throws(()=>importer.parseScriptureFile('song.pdf','text'),/Choose a .txt/);
});
