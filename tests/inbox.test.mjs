import test from 'node:test';
import assert from 'node:assert/strict';
import {checkInbox,serverFor,validAddress} from '../desktop/inbox.mjs';

test('the mail server is found from the address, or entered by hand',()=>{
 assert.deepEqual(serverFor('worship.church@gmail.com'),{host:'imap.gmail.com',port:993});
 assert.deepEqual(serverFor('office@outlook.com'),{host:'outlook.office365.com',port:993});
 assert.deepEqual(serverFor('worship@gracechurch.org'),{host:'imap.gracechurch.org',port:993});
 assert.deepEqual(serverFor('worship@gracechurch.org','Mail.GraceChurch.org:143'),{host:'mail.gracechurch.org',port:143});
 assert.throws(()=>serverFor('a@b.org','http://evil/'),/mail server/);
 assert.equal(validAddress('worship@gracechurch.org'),true);
 assert.equal(validAddress('not an address'),false);
});

const raw=(subject,body,extra='')=>Buffer.from(`From: Maria Lopez <maria@example.org>\r\nTo: worship@gracechurch.org\r\nSubject: ${subject}\r\nDate: Tue, 17 Nov 2026 10:00:00 +0000\r\nMessage-ID: <${subject.replace(/\W/g,'')}@example.org>\r\n${extra}\r\n${body}`);

function fakeClient(log,{fail=null,messages=[]}={}){
 return class {
  constructor(options){log.options=options}
  on(){}
  async connect(){if(fail)throw fail}
  async getMailboxLock(path,options){log.lock={path,options};return {release(){log.released=true}}}
  async search(query,options){log.search={query,options};return messages.map((_,n)=>n+1)}
  async fetchAll(range,query){log.fetch={range,query};return messages.map((source,n)=>({uid:n+1,source}))}
  async logout(){log.loggedOut=true}
 };
}

test('the inbox is opened read-only over TLS and emails come back as plain text, newest first',async()=>{
 const log={};
 const html=raw('Scripture','<p>Please read <b>John 3:16</b></p>','Content-Type: text/html; charset=utf-8\r\n');
 const older=Buffer.from(raw('Setlist','Amazing Grace\r\nCornerstone').toString().replace('10:00:00','08:00:00'));
 const {messages}=await checkInbox({address:'worship@gracechurch.org',password:'secret',host:'imap.gracechurch.org',port:993},{Client:fakeClient(log,{messages:[older,html]}),now:Date.parse('2026-11-17T12:00:00Z')});
 assert.equal(log.options.secure,true);assert.equal(log.options.tls.rejectUnauthorized,true);assert.equal(log.options.logger,false);
 assert.deepEqual(log.lock,{path:'INBOX',options:{readOnly:true}});
 assert.equal(log.search.query.since.toISOString(),'2026-10-18T12:00:00.000Z');
 assert.equal(log.fetch.query.source.maxLength,300000);
 assert.equal(log.released,true);assert.equal(log.loggedOut,true);
 assert.deepEqual(messages.map(m=>m.subject),['Scripture','Setlist']);
 assert.equal(messages[0].from,'maria@example.org');assert.equal(messages[0].fromName,'Maria Lopez');
 assert.match(messages[0].text,/Please read JOHN 3:16|Please read John 3:16/);
 assert.doesNotMatch(messages[0].text,/<p>|<b>/);
 assert.equal(messages[1].text.trim(),'Amazing Grace\nCornerstone');
});

test('a rejected Gmail password explains app passwords; other failures are explained plainly',async()=>{
 const account={address:'worship.church@gmail.com',password:'normal',host:'imap.gmail.com',port:993};
 await assert.rejects(checkInbox(account,{Client:fakeClient({},{fail:Object.assign(Error('Command failed'),{authenticationFailed:true})})}),/app password/);
 await assert.rejects(checkInbox({...account,address:'w@gracechurch.org',host:'imap.gracechurch.org'},{Client:fakeClient({},{fail:Object.assign(Error('getaddrinfo ENOTFOUND'),{code:'ENOTFOUND'})})}),/Could not find the mail server imap\.gracechurch\.org/);
});

test('an empty inbox returns no messages without fetching',async()=>{
 const log={};
 assert.deepEqual(await checkInbox({address:'w@gracechurch.org',password:'x',host:'imap.gracechurch.org',port:993},{Client:fakeClient(log)}),{messages:[]});
 assert.equal(log.fetch,undefined);assert.equal(log.loggedOut,true);
});
