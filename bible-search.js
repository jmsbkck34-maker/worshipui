(function(root){
 const names=[
  ['GEN','Genesis'],['EXO','Exodus'],['LEV','Leviticus'],['NUM','Numbers'],['DEU','Deuteronomy'],['JOS','Joshua'],['JDG','Judges'],['RUT','Ruth'],['1SA','1 Samuel'],['2SA','2 Samuel'],['1KI','1 Kings'],['2KI','2 Kings'],['1CH','1 Chronicles'],['2CH','2 Chronicles'],['EZR','Ezra'],['NEH','Nehemiah'],['EST','Esther'],['JOB','Job'],['PSA','Psalms'],['PRO','Proverbs'],['ECC','Ecclesiastes'],['SOL','Song of Solomon'],['ISA','Isaiah'],['JER','Jeremiah'],['LAM','Lamentations'],['EZE','Ezekiel'],['DAN','Daniel'],['HOS','Hosea'],['JOE','Joel'],['AMO','Amos'],['OBA','Obadiah'],['JON','Jonah'],['MIC','Micah'],['NAH','Nahum'],['HAB','Habakkuk'],['ZEP','Zephaniah'],['HAG','Haggai'],['ZEC','Zechariah'],['MAL','Malachi'],['MAT','Matthew'],['MAR','Mark'],['LUK','Luke'],['JOH','John'],['ACT','Acts'],['ROM','Romans'],['1CO','1 Corinthians'],['2CO','2 Corinthians'],['GAL','Galatians'],['EPH','Ephesians'],['PHI','Philippians'],['COL','Colossians'],['1TH','1 Thessalonians'],['2TH','2 Thessalonians'],['1TI','1 Timothy'],['2TI','2 Timothy'],['TIT','Titus'],['PHM','Philemon'],['HEB','Hebrews'],['JAM','James'],['1PE','1 Peter'],['2PE','2 Peter'],['1JO','1 John'],['2JO','2 John'],['3JO','3 John'],['JUD','Jude'],['REV','Revelation']
 ];
 const bookNames=new Map(names);
 function parse(source){
  if(typeof source!=='string')throw Error('Bible data is not text.');
  const lines=source.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);
  const verses=lines.map(line=>{
   const match=line.match(/^([A-Z0-9]+) ([0-9]+):([0-9]+) (.+)$/);
   if(!match||!bookNames.has(match[1]))throw Error('Bible data contains an invalid verse.');
   return {book:match[1],chapter:Number(match[2]),verse:Number(match[3]),text:match[4]};
  });
  if(verses.length!==31102||new Set(verses.map(v=>v.book)).size!==66||new Set(verses.map(v=>v.book+':'+v.chapter+':'+v.verse)).size!==verses.length)throw Error('The KJV data is incomplete or contains duplicate verses.');
  return verses;
 }
 function books(){return names.map(([id,name])=>({id,name}))}
 function chapters(verses,book){return [...new Set(verses.filter(verse=>verse.book===book).map(verse=>verse.chapter))]}
 function verseNumbers(verses,book,chapter){return verses.filter(verse=>verse.book===book&&verse.chapter===chapter).map(verse=>verse.verse)}
 function passage(verses,book,chapter,first,last){
  if(!bookNames.has(book)||!Number.isInteger(chapter)||!Number.isInteger(first)||!Number.isInteger(last)||first<1||last<first||last-first>=200)throw Error('Choose a valid verse range.');
  const found=verses.filter(verse=>verse.book===book&&verse.chapter===chapter&&verse.verse>=first&&verse.verse<=last);
  if(found.length!==last-first+1||found.some((verse,index)=>verse.verse!==first+index))throw Error('The selected passage is unavailable.');
  const label=bookNames.get(book)+' '+chapter+':'+first+(last!==first?'-'+last:'');
  return {reference:label,slides:found.map(verse=>verse.text),verseReferences:found.map(verse=>bookNames.get(verse.book)+' '+verse.chapter+':'+verse.verse)};
 }
 root.WorshipBible={parse,books,chapters,verseNumbers,passage};
})(globalThis);
