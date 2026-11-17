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
  // Translations differ slightly (KJV 31,102 verses; WEB omits a few textual variants), so require a near-complete Bible.
  if(verses.length<31000||verses.length>31200||new Set(verses.map(v=>v.book)).size!==66||new Set(verses.map(v=>v.book+':'+v.chapter+':'+v.verse)).size!==verses.length)throw Error('The Bible data is incomplete or contains duplicate verses.');
  return verses;
 }
 // Bundled translations: id, label, language and data file. Only public-domain texts are bundled.
 const versions=[
  {id:'KJV',name:'King James Version (KJV)',language:'en',file:'/assets/bibles/kjv.vpl.txt'},
  {id:'WEB',name:'World English Bible (WEB)',language:'en',file:'/assets/bibles/web.vpl.txt'},
  {id:'RVR1909',name:'Reina-Valera 1909 (Español)',language:'es',file:'/assets/bibles/rv1909.vpl.txt'}
 ];
 // Languages offered for the second translation; bible names a bundled version when one exists.
 const languages=[{id:'es',name:'Spanish (Español)',bible:'RVR1909'},{id:'fr',name:'French (Français)'},{id:'pt',name:'Portuguese (Português)'},{id:'de',name:'German (Deutsch)'},{id:'zh',name:'Chinese (中文)'},{id:'ko',name:'Korean (한국어)'},{id:'vi',name:'Vietnamese (Tiếng Việt)'},{id:'tl',name:'Tagalog'},{id:'ar',name:'Arabic (العربية)'},{id:'ru',name:'Russian (Русский)'},{id:'en',name:'English',bible:'KJV'}];
 const localNames={es:['Génesis','Éxodo','Levítico','Números','Deuteronomio','Josué','Jueces','Rut','1 Samuel','2 Samuel','1 Reyes','2 Reyes','1 Crónicas','2 Crónicas','Esdras','Nehemías','Ester','Job','Salmos','Proverbios','Eclesiastés','Cantares','Isaías','Jeremías','Lamentaciones','Ezequiel','Daniel','Oseas','Joel','Amós','Abdías','Jonás','Miqueas','Nahum','Habacuc','Sofonías','Hageo','Zacarías','Malaquías','Mateo','Marcos','Lucas','Juan','Hechos','Romanos','1 Corintios','2 Corintios','Gálatas','Efesios','Filipenses','Colosenses','1 Tesalonicenses','2 Tesalonicenses','1 Timoteo','2 Timoteo','Tito','Filemón','Hebreos','Santiago','1 Pedro','2 Pedro','1 Juan','2 Juan','3 Juan','Judas','Apocalipsis']};
 function bookName(book,language='en'){const index=names.findIndex(([id])=>id===book);return localNames[language]?.[index]||bookNames.get(book)}
 // Book id from a displayed name in any bundled language ("John", "Juan", "Psalm" or "Psalms").
 function bookId(name){
  const wanted=String(name).trim().toLowerCase();if(wanted==='psalm')return 'PSA';
  const english=names.find(([,n])=>n.toLowerCase()===wanted);if(english)return english[0];
  for(const list of Object.values(localNames)){const index=list.findIndex(n=>n.toLowerCase()===wanted);if(index>=0)return names[index][0]}
  return null;
 }
 // Verse references written on slides by the picker, e.g. "John 3:16 · KJV".
 function slideReferences(text){
  return [...String(text).matchAll(/^(.+?) (\d+):(\d+) · [A-Za-z0-9]+$/gm)].map(match=>({book:bookId(match[1]),chapter:Number(match[2]),verse:Number(match[3])})).filter(reference=>reference.book);
 }
 function books(language='en'){return names.map(([id])=>({id,name:bookName(id,language)}))}
 function chapters(verses,book){return [...new Set(verses.filter(verse=>verse.book===book).map(verse=>verse.chapter))]}
 function verseNumbers(verses,book,chapter){return verses.filter(verse=>verse.book===book&&verse.chapter===chapter).map(verse=>verse.verse)}
 // The same verses from another translation, labelled in its language; fails if that translation lacks any of them.
 function parallel(verses,references,language='en'){
  const byKey=new Map(verses.map(verse=>[verse.book+' '+verse.chapter+':'+verse.verse,verse]));
  return references.map(({book,chapter,verse})=>{
   const found=byKey.get(book+' '+chapter+':'+verse);
   if(!found)throw Error(bookName(book,language)+' '+chapter+':'+verse+' is not in the second translation.');
   return {text:found.text,reference:bookName(book,language)+' '+chapter+':'+verse};
  });
 }
 function passage(verses,book,chapter,first,last,language='en'){
  if(!bookNames.has(book)||!Number.isInteger(chapter)||!Number.isInteger(first)||!Number.isInteger(last)||first<1||last<first||last-first>=200)throw Error('Choose a valid verse range.');
  const found=verses.filter(verse=>verse.book===book&&verse.chapter===chapter&&verse.verse>=first&&verse.verse<=last);
  // Verses a translation omits (for example WEB Acts 15:34) are skipped; the range ends must exist.
  if(!found.length||found[0].verse!==first||found.at(-1).verse!==last)throw Error('The selected passage is unavailable.');
  const label=bookName(book,language)+' '+chapter+':'+first+(last!==first?'-'+last:'');
  return {reference:label,slides:found.map(verse=>verse.text),verseReferences:found.map(verse=>bookName(verse.book,language)+' '+verse.chapter+':'+verse.verse),verses:found.map(({book,chapter,verse})=>({book,chapter,verse}))};
 }
 // YouVersion (bible.com): other versions are read there and pasted back. Ids are bible.com version ids.
 const youVersions=[
  {abbr:'NIV',id:111,name:'New International Version'},{abbr:'ESV',id:59,name:'English Standard Version'},{abbr:'NLT',id:116,name:'New Living Translation'},
  {abbr:'NKJV',id:114,name:'New King James Version'},{abbr:'CSB',id:1713,name:'Christian Standard Bible'},{abbr:'NASB1995',id:100,name:'New American Standard Bible 1995'},
  {abbr:'AMP',id:1588,name:'Amplified Bible'},{abbr:'MSG',id:97,name:'The Message'},
  {abbr:'RVR1960',id:149,name:'Reina-Valera 1960 (Español)',language:'es'},{abbr:'NVI',id:128,name:'Nueva Versión Internacional (Español)',language:'es'},{abbr:'NTV',id:127,name:'Nueva Traducción Viviente (Español)',language:'es'}
 ];
 // bible.com uses USFM book codes, which differ from this data set for some books.
 const usfm={SOL:'SNG',EZE:'EZK',JOE:'JOL',NAH:'NAM',MAR:'MRK',JOH:'JHN',PHI:'PHP',JAM:'JAS','1JO':'1JN','2JO':'2JN','3JO':'3JN'};
 // Book id from a bible.com (USFM) code such as "JHN" or "PSA".
 function usfmBook(code){const upper=String(code).toUpperCase();return Object.entries(usfm).find(([,u])=>u===upper)?.[0]||(bookNames.has(upper)?upper:null)}
 function youVersionUrl(version,book,chapter,first,last){
  const code=usfm[book]||book;
  return 'https://www.bible.com/bible/'+version.id+'/'+code+'.'+chapter+'.'+first+(last>first?'-'+last:'')+'.'+version.abbr;
 }
 // Which passage was copied from bible.com: the share link when present, otherwise a "John 3:16-17 NIV" line.
 // Returns {book, chapter, first, last, abbr} or null.
 function youVersionReference(text){
  const clean=String(text||'').replace(/[‎‏‪-‮⁦-⁩]/g,'');
  const link=clean.match(/bible\.com\/bible\/\d+\/([1-3A-Za-z]{3})\.(\d+)\.(\d+)(?:-(\d+))?\.([A-Za-z0-9]+)/i);
  if(link){
   const code=link[1].toUpperCase(),book=Object.entries(usfm).find(([,u])=>u===code)?.[0]||(bookNames.has(code)?code:null);
   if(book)return {book,chapter:Number(link[2]),first:Number(link[3]),last:Number(link[4]||link[3]),abbr:link[5].toUpperCase()};
  }
  const line=clean.match(/(?:^|\n|\s)([1-3]?\s?[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+){0,3}) (\d+):(\d+)(?:\s*[-–]\s*(\d+))?(?:\s+([A-Z0-9]{2,10}))?\s*$/m);
  if(line){
   const book=bookId(line[1]);
   if(book)return {book,chapter:Number(line[2]),first:Number(line[3]),last:Number(line[4]||line[3]),abbr:line[5]||''};
  }
  return null;
 }
 // Text copied from bible.com: remove direction marks and quotes, drop a trailing "John 3:16 NIV" reference,
 // then split on the expected verse numbers when they are present ("16 For God… 17 For God…").
 function pastedPassage(text,numbers){
  let clean=String(text||'').replace(/[‎‏‪-‮⁦-⁩]/g,'').replace(/\r\n?/g,'\n').trim();
  // bible.com adds a share link line ("https://bible.com/bible/111/jhn.3.16-17.NIV"); it is metadata, not text.
  clean=clean.split('\n').filter(line=>!/^\s*(?:https?:\/\/)?(?:www\.)?bible\.com\/\S*\s*$/i.test(line)).join('\n').trim();
  clean=clean.replace(/^[1-3]?\s?[A-Za-zÀ-ÿ ]+\s\d+:\d+(?:[-–]\d+)?(?:\s+[A-Z0-9]{2,10})?\s*\n/,'').trim();
  clean=clean.replace(/\s*\n?[1-3]?\s?[A-Za-zÀ-ÿ ]+\s\d+:\d+(?:[-–]\d+)?(?:\s+[A-Z0-9]{2,10})?\s*$/,'').trim();
  clean=clean.replace(/^[“"]+|[”"]+$/g,'').trim();
  // "Share → Copy link" or the address bar gives only the link, with no verse text.
  if(!clean&&/bible\.com\/bible\//i.test(String(text)))throw Error('Only the bible.com link was copied. On bible.com, click the verses to highlight them, then choose Copy.');
  if(!clean)throw Error('Paste the passage copied from YouVersion first.');
  if(numbers.length>1){
   const parts=[];let rest=clean,ok=true;
   for(let n=0;n<numbers.length&&ok;n++){
    const marker=new RegExp('(?:^|\\s)'+numbers[n]+'\\s+');
    const found=rest.match(marker);
    if(!found||(n===0&&found.index>0&&rest.slice(0,found.index).trim())){ok=false;break}
    rest=rest.slice(found.index+found[0].length);
    const next=n+1<numbers.length?rest.match(new RegExp('(?:^|\\s)'+numbers[n+1]+'\\s+')):null;
    if(n+1<numbers.length&&!next){ok=false;break}
    parts.push((next?rest.slice(0,next.index):rest).replace(/\s+/g,' ').trim());
    if(next)rest=rest.slice(next.index);
   }
   if(ok&&parts.every(Boolean))return {perVerse:true,slides:parts};
  }
  if(numbers.length===1)clean=clean.replace(new RegExp('^'+numbers[0]+'\\s+'),'');
  return {perVerse:numbers.length===1,slides:[clean.replace(/[ \t]+/g,' ').trim()]};
 }
 root.WorshipBible={usfmBook,parse,books,bookName,bookId,slideReferences,youVersionReference,chapters,verseNumbers,passage,parallel,versions,languages,youVersions,youVersionUrl,pastedPassage};
})(globalThis);
