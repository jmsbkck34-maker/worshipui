// Reads an email sent to the church's WorshipUI inbox and works out what it asks for:
//   setlist    a list of songs, one per line ("Setlist" or "Songs" in the subject, or a list of short lines)
//   scripture  a Bible reference such as "John 3:16-18", with or without the verse text
//   note       anything else, shown for the operator to read
// Nothing is added to the service automatically; the operator reviews each email and chooses to add it.
(function(root) {
 const MAX_TEXT=20000,MAX_SONGS=40;
 const SETLIST=/\b(set\s*list|setlist|songs?|worship\s+set|lista|canciones|alabanzas?)\b/i;
 const SCRIPTURE=/\b(scriptures?|verses?|readings?|bible|passages?|escrituras?|vers[ií]culos?|lecturas?|biblia|pasajes?)\b/i;
 // Book name (optionally numbered: "1 John", "2 Corintios"), chapter and verse range.
 const REFERENCE=/((?:[1-3] ?)?[A-Za-zÀ-ÿ]+(?: (?:of )?[A-Za-zÀ-ÿ]+)?)\.? +(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/g;

 // The new part of the message only: no quoted replies, forwarded headers or signatures.
 function ownText(text) {
  const lines=String(text||'').replace(/\r\n?/g,'\n').slice(0,MAX_TEXT).split('\n'),kept=[];
  for(const line of lines){
   if(/^\s*>/.test(line))continue;
   if(/^(On .+wrote:|El .+escribi[oó]:|-{2,}\s*Original Message|-{2,}\s*Forwarded message|From:\s.+|De:\s.+|Sent from my |Enviado desde mi )/i.test(line.trim()))break;
   if(/^--\s*$/.test(line))break;
   kept.push(line);
  }
  return kept.join('\n').trim();
 }
 function cleanLine(line) {
  return line.replace(/^\s*(?:[-*•·–]|\d{1,2}[.)]|#\d+)\s*/,'').replace(/\s+/g,' ').trim();
 }
 // Greetings and sign-offs that are not songs.
 const CHATTER=/^(hi|hello|hey|hola|dear|thanks?|thank you|gracias|blessings|bendiciones|regards|saludos|cheers|love|in christ|en cristo|here (?:is|are)|aqu[ií] (?:est[aá]|van)|please|por favor)\b/i;

 function references(text, bookId) {
  const found=[];
  for(const match of String(text).matchAll(REFERENCE)){
   const book=bookId(match[1])||bookId(match[1].split(' ').slice(-2).join(' '))||bookId(match[1].split(' ').slice(-1)[0]);
   if(!book)continue;
   const chapter=Number(match[2]),first=Number(match[3]),last=Number(match[4]||match[3]);
   if(chapter<1||first<1||last<first||last-first>=200)continue;
   found.push({book,chapter,first,last,text:match[0].trim(),index:match.index});
  }
  return found;
 }

 // bookId turns a book name ("John", "Juan", "Psalm") into its code; WorshipBible.bookId in the app.
 function parse(message, bookId) {
  const subject=String(message?.subject||'').replace(/\s+/g,' ').trim().slice(0,200);
  const body=ownText(message?.text);
  const lines=body.split('\n').map(cleanLine).filter(Boolean);
  const refs=references(subject+'\n'+body,bookId);
  const songLines=lines.filter(line=>!CHATTER.test(line)&&!/[:]$/.test(line)&&line.length<=80&&!/^(setlist|set list|songs|canciones|lista)\b/i.test(line));
  const result={subject,text:body};
  let kind='note';
  if(SCRIPTURE.test(subject)&&refs.length)kind='scripture';
  else if(SETLIST.test(subject)&&songLines.length)kind='setlist';
  else if(refs.length&&lines.length<=3)kind='scripture';
  else if(songLines.length>=2&&songLines.every(line=>line.length<=60&&!/[.!?]$/.test(line)))kind='setlist';
  if(kind==='scripture'){
   const ref=refs[0];
   // Text after the reference counts as the verses only when it is more than a short note.
   const after=body.slice(Math.max(0,body.indexOf(ref.text))+(body.includes(ref.text)?ref.text.length:0)).replace(/^[\s\-–:,(]*(?:[A-Z0-9]{2,10}\)?)?\s*/,'').trim();
   const verses=body.includes(ref.text)&&after.length>=40&&!references(after,bookId).length?after:'';
   Object.assign(result,{kind,reference:{book:ref.book,chapter:ref.chapter,first:ref.first,last:ref.last},referenceText:ref.text,verses,others:refs.slice(1).map(r=>r.text)});
  }else if(kind==='setlist')Object.assign(result,{kind,songs:[...new Set(songLines.map(line=>line.replace(/\s*[-–(].*?(?:key|tono|in [A-G][#b]?)\b.*$/i,'').trim()).filter(Boolean))].slice(0,MAX_SONGS)});
  else result.kind='note';
  return result;
 }
 // Matches song titles loosely: case, accents and punctuation do not matter.
 function songKey(title) {
  return String(title||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 }
 root.WorshipEmail={parse,ownText,songKey,references};
})(typeof window!=='undefined'?window:globalThis);
