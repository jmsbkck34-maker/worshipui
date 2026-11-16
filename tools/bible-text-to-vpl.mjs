// Convert a Bible SuperSearch plain-text export (book line, "Chapter N", wrapped "N text" verses)
// into the app's VPL format ("GEN 1:1 text" per line). Usage: node tools/bible-text-to-vpl.mjs input.txt output.vpl.txt
import {readFileSync,writeFileSync} from 'node:fs';
const names=[['GEN','Genesis'],['EXO','Exodus'],['LEV','Leviticus'],['NUM','Numbers'],['DEU','Deuteronomy'],['JOS','Joshua'],['JDG','Judges'],['RUT','Ruth'],['1SA','1 Samuel'],['2SA','2 Samuel'],['1KI','1 Kings'],['2KI','2 Kings'],['1CH','1 Chronicles'],['2CH','2 Chronicles'],['EZR','Ezra'],['NEH','Nehemiah'],['EST','Esther'],['JOB','Job'],['PSA','Psalms'],['PRO','Proverbs'],['ECC','Ecclesiastes'],['SOL','Song of Solomon'],['ISA','Isaiah'],['JER','Jeremiah'],['LAM','Lamentations'],['EZE','Ezekiel'],['DAN','Daniel'],['HOS','Hosea'],['JOE','Joel'],['AMO','Amos'],['OBA','Obadiah'],['JON','Jonah'],['MIC','Micah'],['NAH','Nahum'],['HAB','Habakkuk'],['ZEP','Zephaniah'],['HAG','Haggai'],['ZEC','Zechariah'],['MAL','Malachi'],['MAT','Matthew'],['MAR','Mark'],['LUK','Luke'],['JOH','John'],['ACT','Acts'],['ROM','Romans'],['1CO','1 Corinthians'],['2CO','2 Corinthians'],['GAL','Galatians'],['EPH','Ephesians'],['PHI','Philippians'],['COL','Colossians'],['1TH','1 Thessalonians'],['2TH','2 Thessalonians'],['1TI','1 Timothy'],['2TI','2 Timothy'],['TIT','Titus'],['PHM','Philemon'],['HEB','Hebrews'],['JAM','James'],['1PE','1 Peter'],['2PE','2 Peter'],['1JO','1 John'],['2JO','2 John'],['3JO','3 John'],['JUD','Jude'],['REV','Revelation']];
// Chapter headings in the supported export languages (English and Spanish).
const CHAPTER=/^(?:Chapter|Psalm|Capítulo|Salmo) (\d+)$/;
export function convert(source){
 const verses=[];let book=null,bookIndex=-1,chapter=0,current=null,expected=0;
 const lines=source.replace(/^﻿/,'').replace(/\r\n?/g,'\n').split('\n');
 const nextText=n=>{for(let k=n+1;k<lines.length;k++)if(lines[k].trim())return lines[k].trim();return ''};
 for(let n=0;n<lines.length;n++){
  const line=lines[n].trim(),previousBlank=n===0||lines[n-1].trim()==='';
  if(!line){current=null;continue}
  // Book names are language-specific, so a book is the title line right before chapter 1; books follow canonical order.
  const opening=nextText(n).match(CHAPTER);
  if(previousBlank&&!CHAPTER.test(line)&&opening&&opening[1]==='1'){
   bookIndex++;if(bookIndex>=names.length)throw Error(`More than 66 books (line ${n+1})`);
   book=names[bookIndex][0];chapter=0;current=null;continue;
  }
  const heading=line.match(CHAPTER);
  if(heading&&book){chapter=Number(heading[1]);expected=1;current=null;continue}
  if(!book||!chapter)continue;
  // A wrapped line can also start with a number, so only accept the next verse number (or a small skip after a blank line).
  // Verses a translation omits appear as a bare number; they are left out of the output.
  const verse=line.match(/^(\d+)(?: (.*))?$/),number=verse&&Number(verse[1]);
  if(verse&&(number===expected||(previousBlank&&number>expected&&number<=expected+3))){
   expected=number+1;
   if(!verse[2]){current=null;continue}
   current={book,chapter,verse:number,text:verse[2]};verses.push(current);continue;
  }
  if(!current)throw Error(`Unexpected text at line ${n+1}: ${line.slice(0,60)}`);
  current.text+=' '+line;
 }
 return verses.map(v=>({...v,text:v.text.replace(/\s+/g,' ').trim()}));
}
if(process.argv[2]){
 const verses=convert(readFileSync(process.argv[2],'utf8'));
 writeFileSync(process.argv[3],verses.map(v=>`${v.book} ${v.chapter}:${v.verse} ${v.text}`).join('\n')+'\n');
 console.log(`${verses.length} verses, ${new Set(verses.map(v=>v.book)).size} books`);
}
