(function(root) {
 const MAX_FILE_CHARS=5000000,MAX_SLIDES=200,MAX_SLIDE_CHARS=20000;

 function sourceText(value) {
  if(typeof value!=='string')throw Error('The imported file is not text.');
  const text=value.replace(/^\uFEFF/,'');
  if(text.length>MAX_FILE_CHARS)throw Error('Choose a text file under 5 MB.');
  return text;
 }
 function fileType(name) {
  const match=String(name||'').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?match[1]:'';
 }
 function fileTitle(name) {
  return String(name||'Imported content').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim()||'Imported content';
 }
 function splitTextSlides(text) {
  return String(text||'').replace(/\r\n?/g,'\n').trim().split(/\n\s*\n+/).map(slide=>slide.trim()).filter(Boolean);
 }
 function checkedSlides(slides) {
  const result=slides.map(slide=>String(slide).trim()).filter(Boolean);
  if(!result.length)throw Error('No lyric or scripture text was found in the file.');
  if(result.length>MAX_SLIDES)throw Error('An import can contain at most 200 slides or verses.');
  if(result.some(slide=>slide.length>MAX_SLIDE_CHARS))throw Error('Each imported slide must be 20,000 characters or fewer.');
  return result;
 }
 function parseCsv(source) {
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<source.length;i++){
   const char=source[i];
   if(quoted){
    if(char==='"'&&source[i+1]==='"'){field+='"';i++}
    else if(char==='"')quoted=false;
    else field+=char;
   }else if(char==='"'&&field.length===0)quoted=true;
   else if(char===','){row.push(field);field=''}
   else if(char==='\n'||char==='\r'){
    if(char==='\r'&&source[i+1]==='\n')i++;
    row.push(field);
    if(row.some(value=>value.trim()))rows.push(row);
    row=[];field='';
   }else field+=char;
  }
  if(quoted)throw Error('The CSV file has an unclosed quoted field.');
  row.push(field);
  if(row.some(value=>value.trim()))rows.push(row);
  if(!rows.length)throw Error('The CSV file is empty.');
  return rows;
 }
 function normalizedHeader(value) {
  return String(value||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
 }
 function columnIndex(headers,names) {
  return headers.findIndex(header=>names.includes(normalizedHeader(header)));
 }
 function parseChordPro(source,titleFallback) {
  let title=titleFallback;
  const lines=source.replace(/\r\n?/g,'\n').split('\n').map(line=>{
   const titleMatch=line.match(/^\s*\{\s*(?:title|t)\s*:\s*([^}]+)\}\s*$/i);
   if(titleMatch){title=titleMatch[1].trim();return ''}
   if(/^\s*\{\s*(?:start_of_|end_of_|so$|eo$|soc|eoc|sov|eov|sob|eob)[^}]*\}\s*$/i.test(line))return '';
   return line.replace(/\{(?:comment|c|comment_italic)\s*:[^}]*\}/gi,'')
    .replace(/\{[^}]*\}/g,'').replace(/\[[^\]\r\n]*\]/g,'');
  }).join('\n');
  return [{title:title||titleFallback,slides:checkedSlides(splitTextSlides(lines))}];
 }
 function nodeText(node) {
  if(node.nodeType===3||node.nodeType===4)return node.nodeValue||'';
  if(node.nodeType===1&&String(node.localName||node.nodeName).toLowerCase()==='br')return '\n';
  return Array.from(node.childNodes||[]).map(nodeText).join('');
 }
 function parseXml(source) {
  if(/<!DOCTYPE|<!ENTITY/i.test(source))throw Error('XML files with document type or entity declarations are not supported.');
  if(typeof root.DOMParser!=='function')throw Error('XML import requires a browser with DOMParser support.');
  const document=new root.DOMParser().parseFromString(source,'application/xml');
  if(document.getElementsByTagName('parsererror').length)throw Error('The XML file is not valid.');
  return document;
 }
 function parseOpenLyrics(source,titleFallback) {
  const document=parseXml(source);
  const titles=Array.from(document.getElementsByTagName('title'));
  const title=titles.length?titles[0].textContent.trim():titleFallback;
  const verses=Array.from(document.getElementsByTagName('verse'));
  const slides=verses.map(verse=>{
   const lines=Array.from(verse.getElementsByTagName('lines'));
   return lines.length?lines.map(nodeText).join('\n'):nodeText(verse);
  });
  return [{title:title||titleFallback,slides:checkedSlides(slides)}];
 }
 function parseLyricsCsv(source,titleFallback) {
  const rows=parseCsv(source),headers=rows.shift();
  const titleColumn=columnIndex(headers,['title','song','songtitle']);
  const lyricsColumn=columnIndex(headers,['lyrics','text','content','slidetext']);
  if(lyricsColumn<0)throw Error('Lyrics CSV needs a “lyrics” or “text” column.');
  const items=rows.map((row,index)=>({
   title:(titleColumn>=0?row[titleColumn]:'').trim()||`${titleFallback} ${index+1}`,
   slides:checkedSlides(splitTextSlides(row[lyricsColumn]||''))
  }));
  if(!items.length)throw Error('The CSV file has no song rows.');
  return items;
 }
 const SECTION_HEADER=/^(?:verse|chorus|pre-?chorus|bridge|tag|intro|outro|ending|interlude|refrain|coda|instrumental|vamp|misc|turnaround)(?:\s*\d+[a-z]?)?$/i;
 const COPYRIGHT_BLOCK=/ccli\s*(?:song|license)\s*#|ccli\.com|songselect|copyright|©|public domain/i;
 // SongSelect-style text: optional title line, "Verse 1"/"Chorus" headers, and a closing credit block.
 function parseLyricsText(source,titleFallback) {
  const blocks=splitTextSlides(source);
  const isHeaded=block=>block.includes('\n')&&SECTION_HEADER.test(block.split('\n')[0].trim());
  if(!blocks.some(isHeaded))return {title:titleFallback,slides:checkedSlides(blocks)};
  let title=titleFallback;
  if(blocks[0]&&!blocks[0].includes('\n')&&!SECTION_HEADER.test(blocks[0].trim())&&blocks[0].length<=100)title=blocks.shift().trim();
  const slides=[],labels=[];
  for(const block of blocks){
   if(isHeaded(block)){const lines=block.split('\n');slides.push(lines.slice(1).join('\n').trim());labels.push(lines[0].trim().slice(0,50))}
   else{slides.push(block);labels.push(COPYRIGHT_BLOCK.test(block)?'Copyright':'')}
  }
  const checked=checkedSlides(slides);
  return checked.length===labels.length?{title,slides:checked,sectionLabels:labels}:{title,slides:checked};
 }
 function parseLyricsFile(name,value) {
  const source=sourceText(value),extension=fileType(name),title=fileTitle(name).replace(/[\s_-]+lyrics$/i,'').trim()||fileTitle(name);
  if(extension==='txt')return [parseLyricsText(source,title)];
  if(extension==='pro'||extension==='chopro'||extension==='chordpro')return parseChordPro(source,title);
  if(extension==='xml')return parseOpenLyrics(source,title);
  if(extension==='csv')return parseLyricsCsv(source,title);
  throw Error('Choose a .txt, .pro, .chordpro, OpenLyrics .xml, or lyrics .csv file.');
 }
 function cleanUsfmText(value) {
  return value.replace(/\\f\b[\s\S]*?\\f\*/gi,' ')
   .replace(/\\x\b[\s\S]*?\\x\*/gi,' ')
   .replace(/\\w\b\s+([^|\\]+)\|[^\\]*\\w\*/gi,'$1')
   .replace(/\\[a-z][a-z0-9-]*\*?/gi,' ')
   .replace(/\\\*/g,' ').replace(/\s+/g,' ').trim();
 }
 function parseUsfm(source) {
  const matches=Array.from(source.matchAll(/\\v\b\s+\d+(?:-\d+)?/gi));
  const slides=matches.map((match,index)=>{
   const start=match.index+match[0].length;
   const end=index+1<matches.length?matches[index+1].index:source.length;
   return cleanUsfmText(source.slice(start,end).split(/\\c\b\s+\d+/i)[0]);
  });
  return checkedSlides(slides);
 }
 function parseUsx(source) {
  const document=parseXml(source);
  const roots=Array.from(document.getElementsByTagName('usx'));
  if(!roots.length)throw Error('This XML is not a USX scripture file.');
  const slides=[];let started=false,current='';
  function walk(node) {
   for(const child of Array.from(node.childNodes||[])){
    if(child.nodeType===1){
     const name=String(child.localName||child.nodeName).toLowerCase();
     if(name==='verse'&&child.getAttribute('number')){
      if(started&&current.trim())slides.push(current.trim());
      current='';started=true;
     }else if(name==='note')continue;
     walk(child);
    }else if(started&&(child.nodeType===3||child.nodeType===4))current+=child.nodeValue||'';
   }
  }
  walk(roots[0]);
  if(started&&current.trim())slides.push(current.trim());
  return checkedSlides(slides);
 }
 function parseScriptureCsv(source) {
  const rows=parseCsv(source),headers=rows.shift();
  const textColumn=columnIndex(headers,['text','verse','scripture','content']);
  const referenceColumn=columnIndex(headers,['reference','passage','ref']);
  if(textColumn<0)throw Error('Scripture CSV needs a “text” or “verse” column.');
  const data=rows.map(row=>({text:(row[textColumn]||'').trim(),reference:referenceColumn>=0?(row[referenceColumn]||'').trim():''})).filter(row=>row.text);
  const references=[...new Set(data.map(row=>row.reference).filter(Boolean))];
  return {reference:references.length===1?references[0]:'',slides:checkedSlides(data.map(row=>row.text))};
 }
 function parseScriptureFile(name,value) {
  const source=sourceText(value),extension=fileType(name);
  if(extension==='txt')return {reference:'',slides:checkedSlides(splitTextSlides(source))};
  if(extension==='csv')return parseScriptureCsv(source);
  if(extension==='usfm'||extension==='sfm')return {reference:'',slides:parseUsfm(source)};
  if(extension==='usx')return {reference:'',slides:parseUsx(source)};
  throw Error('Choose a .txt, scripture .csv, .usfm, or .usx file.');
 }
 root.WorshipContentImport=Object.freeze({parseLyricsFile,parseScriptureFile,parseScriptureText:value=>checkedSlides(splitTextSlides(sourceText(value)))});
})(window);
