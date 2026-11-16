(function(root){
 const names=[
  ['GEN','Genesis'],['EXO','Exodus'],['LEV','Leviticus'],['NUM','Numbers'],['DEU','Deuteronomy'],['JOS','Joshua'],['JDG','Judges'],['RUT','Ruth'],['1SA','1 Samuel'],['2SA','2 Samuel'],['1KI','1 Kings'],['2KI','2 Kings'],['1CH','1 Chronicles'],['2CH','2 Chronicles'],['EZR','Ezra'],['NEH','Nehemiah'],['EST','Esther'],['JOB','Job'],['PSA','Psalms'],['PRO','Proverbs'],['ECC','Ecclesiastes'],['SOL','Song of Solomon'],['ISA','Isaiah'],['JER','Jeremiah'],['LAM','Lamentations'],['EZE','Ezekiel'],['DAN','Daniel'],['HOS','Hosea'],['JOE','Joel'],['AMO','Amos'],['OBA','Obadiah'],['JON','Jonah'],['MIC','Micah'],['NAH','Nahum'],['HAB','Habakkuk'],['ZEP','Zephaniah'],['HAG','Haggai'],['ZEC','Zechariah'],['MAL','Malachi'],['MAT','Matthew'],['MAR','Mark'],['LUK','Luke'],['JOH','John'],['ACT','Acts'],['ROM','Romans'],['1CO','1 Corinthians'],['2CO','2 Corinthians'],['GAL','Galatians'],['EPH','Ephesians'],['PHI','Philippians'],['COL','Colossians'],['1TH','1 Thessalonians'],['2TH','2 Thessalonians'],['1TI','1 Timothy'],['2TI','2 Timothy'],['TIT','Titus'],['PHM','Philemon'],['HEB','Hebrews'],['JAM','James'],['1PE','1 Peter'],['2PE','2 Peter'],['1JO','1 John'],['2JO','2 John'],['3JO','3 John'],['JUD','Jude'],['REV','Revelation']
 ];
 const bookNames=new Map(names),normalize=value=>value.toLowerCase().replace(/[^a-z0-9]/g,'');
 const aliases=new Map(names.flatMap(([id,name])=>[[normalize(id),id],[normalize(name),id]]));
 aliases.set('psalm','PSA');aliases.set('songofsongs','SOL');
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
 function search(verses,query){
  const input=String(query||'').trim();
  if(input.length<3)throw Error('Enter a passage or at least three search characters.');
  const reference=input.match(/^(.+?)\s+([0-9]+)(?::([0-9]+)(?:\s*[-–]\s*([0-9]+))?)?$/);
  if(reference){
   const book=aliases.get(normalize(reference[1])),chapter=Number(reference[2]),first=reference[3]?Number(reference[3]):1,last=reference[4]?Number(reference[4]):reference[3]?first:200;
   if(!book||first<1||last<first||last-first>=200)throw Error('Enter a valid book and verse range, such as John 3:16-18.');
   const found=verses.filter(v=>v.book===book&&v.chapter===chapter&&v.verse>=first&&v.verse<=last);
   if(!found.length||(reference[3]&&(found[0].verse!==first||found.at(-1).verse!==last)))return [];
   const label=bookNames.get(book)+' '+chapter+(reference[3]?':'+first+(last!==first?'-'+last:''):'');
   return [{reference:label,slides:found.map(v=>v.text),verseReferences:found.map(v=>bookNames.get(v.book)+' '+v.chapter+':'+v.verse)}];
  }
  const term=input.toLowerCase();
  return verses.filter(v=>v.text.toLowerCase().includes(term)).slice(0,30).map(v=>{const reference=bookNames.get(v.book)+' '+v.chapter+':'+v.verse;return {reference,slides:[v.text],verseReferences:[reference]}});
 }
 root.WorshipBible={parse,search};
})(globalThis);
