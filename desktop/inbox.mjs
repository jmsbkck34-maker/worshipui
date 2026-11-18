// The church's WorshipUI inbox: an ordinary email account (for example worship@yourchurch.org) that people send
// setlists and Scripture requests to. WorshipUI signs in with IMAP over TLS like any mail app, opens the inbox
// read-only (nothing is deleted or marked as read) and returns the plain text of recent messages.
import {ImapFlow} from 'imapflow';
import {simpleParser} from 'mailparser';

const MAX_MESSAGES=30,MAX_BYTES=300000,MAX_TEXT=20000,DAYS=30;
// Mail servers of the common providers; anything else tries imap.<domain>.
const PROVIDERS=[
 [/^(gmail|googlemail)\.com$/,'imap.gmail.com'],
 [/^(outlook|hotmail|live|msn)\.[a-z.]+$/,'outlook.office365.com'],
 [/^(yahoo|ymail|rocketmail)\.[a-z.]+$/,'imap.mail.yahoo.com'],
 [/^(icloud|me|mac)\.com$/,'imap.mail.me.com'],
 [/^aol\.com$/,'imap.aol.com']
];
export const validAddress=address=>typeof address==='string'&&address.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
const validHost=host=>typeof host==='string'&&/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(host)&&host.length<=253;

export function serverFor(address,server=''){
 const custom=String(server||'').trim().toLowerCase();
 if(custom){
  const [host,port]=custom.split(':');
  if(!validHost(host)||(port!==undefined&&!/^\d{2,5}$/.test(port)))throw Error('Enter the mail server as a name such as mail.yourchurch.org, or leave it empty.');
  return {host,port:Number(port||993)};
 }
 const domain=address.split('@')[1].toLowerCase();
 return {host:PROVIDERS.find(([pattern])=>pattern.test(domain))?.[1]||'imap.'+domain,port:993};
}

// Sign-in problems are explained in plain words; Gmail and Yahoo need an app password instead of the normal one.
function friendly(error,account){
 const text=String(error?.responseText||error?.message||'');
 const domain=account.address.split('@')[1].toLowerCase();
 if(error?.authenticationFailed||/AUTHENTICATIONFAILED|Invalid credentials|LOGIN failed|authenticat/i.test(text)){
  if(/gmail|googlemail/.test(domain))return Error('Gmail did not accept the password. Gmail needs an app password: in your Google account turn on 2-Step Verification, then create one at myaccount.google.com/apppasswords and paste it here.');
  if(/yahoo|aol/.test(domain))return Error('The password was not accepted. Yahoo and AOL need an app password from your account security settings.');
  return Error('The email address or password was not accepted.');
 }
 if(/ENOTFOUND|EAI_AGAIN/.test(error?.code||text))return Error('Could not find the mail server '+account.host+'. Check the address, or enter the mail server under More options.');
 if(/ETIMEDOUT|ECONNREFUSED|ECONNRESET|timeout/i.test(error?.code||text))return Error('Could not reach the mail server. Check the internet connection.');
 if(/certificate|self.signed|CERT/i.test(text))return Error('The mail server\'s security certificate is not valid, so WorshipUI did not connect.');
 return Error('Could not check the inbox. '+(text?text.slice(0,160):'Try again later.'));
}

// Returns {messages:[{id,from,fromName,subject,date,text}]}, newest first.
export async function checkInbox(account,{Client=ImapFlow,parse=simpleParser,now=Date.now()}={}){
 const client=new Client({host:account.host,port:account.port,secure:true,auth:{user:account.address,pass:account.password},logger:false,connectionTimeout:20000,greetingTimeout:15000,socketTimeout:60000,tls:{rejectUnauthorized:true}});
 client.on?.('error',()=>{});
 try{
  await client.connect();
 }catch(error){throw friendly(error,account)}
 try{
  const lock=await client.getMailboxLock('INBOX',{readOnly:true});
  try{
   const uids=(await client.search({since:new Date(now-DAYS*86400000)},{uid:true}))||[];
   const recent=uids.sort((a,b)=>a-b).slice(-MAX_MESSAGES);
   if(!recent.length)return {messages:[]};
   const fetched=await client.fetchAll(recent.join(','),{uid:true,size:true,source:{maxLength:MAX_BYTES}},{uid:true});
   const messages=[];
   for(const item of fetched){
    try{
     const mail=await parse(item.source,{skipHtmlToText:false,skipImageLinks:true,skipTextToHtml:true,skipTextLinks:true});
     const sender=mail.from?.value?.[0]||{};
     messages.push({id:String(mail.messageId||'uid-'+item.uid).slice(0,300),from:String(sender.address||'').slice(0,254),fromName:String(sender.name||'').slice(0,120),subject:String(mail.subject||'').slice(0,200),date:(mail.date instanceof Date&&!isNaN(mail.date)?mail.date:new Date(now)).toISOString(),text:String(mail.text||'').slice(0,MAX_TEXT)});
    }catch{}
   }
   return {messages:messages.sort((a,b)=>b.date.localeCompare(a.date))};
  }finally{lock.release()}
 }catch(error){throw friendly(error,account)}
 finally{try{await client.logout()}catch{client.close?.()}}
}
