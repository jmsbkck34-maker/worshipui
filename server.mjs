import SlideTemplate from './slide-template.cjs';
import http from 'node:http';
import {readFile, writeFile, mkdir, rename} from 'node:fs/promises';
import {randomBytes, scryptSync, timingSafeEqual, createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const hash = text => createHash('sha256').update(text).digest('hex');
function validDate(value) {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}
function validTranslations(item) {
  if (item.fitText !== undefined && (item.type !== 'Scripture' || typeof item.fitText !== 'boolean')) return false;
  // verseSlides keeps the separate verses of a combined passage so it can be split again.
  const verseList = (list, length) => Array.isArray(list) && list.length >= 2 && list.length <= 200 &&
    (length === undefined || list.length === length) && list.every(text => typeof text === 'string' && text.length > 0 && text.length <= 20000);
  if (item.verseSlides !== undefined && !(item.type === 'Scripture' && item.fitText === true && item.slides.length === 1 && verseList(item.verseSlides))) return false;
  if (item.secondaryVerseSlides !== undefined && !(item.verseSlides && Array.isArray(item.secondarySlides) && verseList(item.secondaryVerseSlides, item.verseSlides.length))) return false;
  if (item.primaryVersion !== undefined && (item.type !== 'Scripture' || typeof item.primaryVersion !== 'string' || item.primaryVersion.length > 80)) return false;
  if (item.secondarySlides === undefined && item.secondaryVersion === undefined) return true;
  return item.type === 'Scripture' && typeof item.primaryVersion === 'string' && item.primaryVersion.length > 0 && item.primaryVersion.length <= 80 &&
    typeof item.secondaryVersion === 'string' && item.secondaryVersion.trim().length > 0 && item.secondaryVersion.length <= 80 &&
    Array.isArray(item.secondarySlides) && item.secondarySlides.length === item.slides.length && item.secondarySlides.length <= 200 &&
    item.secondarySlides.every(text => typeof text === 'string' && text.length > 0 && text.length <= 20000);
}
export function validService(s) {
  return s && typeof s.title === 'string' && s.title.length <= 100 &&
    Array.isArray(s.items) && s.items.length <= 200 &&
    new Set(s.items.map(i => i?.id)).size === s.items.length &&
    s.items.every(i => i && typeof i.id === 'string' && i.id.length <= 100 &&
      typeof i.title === 'string' && i.title.length <= 100 &&
      ['Song','Scripture','Announcement','Sermon','Countdown','Media'].includes(i.type) &&
      // Countdown items carry their timer settings, Media items their files; other items have neither.
      (i.type === 'Countdown' ? SlideTemplate.validCountdown(i.countdown) : i.countdown === undefined) &&
      (i.type === 'Media' ? SlideTemplate.validMediaItem(i) : i.media === undefined) &&
      ['dusk','ocean','ember','midnight'].includes(i.theme) && SlideTemplate.validTemplate(i.template) &&
      Array.isArray(i.slides) && i.slides.length > 0 && i.slides.length <= 200 &&
      i.slides.every(t => typeof t === 'string' && t.length <= 20000) && validTranslations(i) &&
      (i.sectionLabels === undefined || i.type === 'Song' && Array.isArray(i.sectionLabels) &&
       i.sectionLabels.length === i.slides.length && i.sectionLabels.every(label => typeof label === 'string' && label.length <= 50)) &&
      // Optional per-slide audience screen: '' all screens, '1' or '2'.
      (i.slideScreens === undefined || Array.isArray(i.slideScreens) && i.slideScreens.length === i.slides.length &&
       i.slideScreens.every(target => ['','1','2'].includes(target)) && i.slideScreens.some(Boolean)));
}
function passwordHash(password, salt) { return scryptSync(password, salt, 64).toString('hex'); }
export async function openStore(directory) {
  await mkdir(directory, {recursive:true});
  const filename = path.join(directory, 'workspace.json');
  let state;
  try { state = JSON.parse(await readFile(filename, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; state = {users:[], versions:[]}; }
  // One process owns this store. Mutations are serialized, including disk writes.
  let queue = Promise.resolve();
  const mutate = callback => {
    const task = queue.then(async () => {
      const next = structuredClone(state);
      const result = callback(next);
      await writeFile(filename+'.tmp', JSON.stringify(next), {mode:0o600});
      await rename(filename+'.tmp', filename);
      state = next;
      return result;
    });
    queue = task.catch(() => {});
    return task;
  };
  return {
    state: () => state,
    async addUser(username, password, role) {
      if (!/^[a-zA-Z0-9._@-]{1,80}$/.test(username) || password.length < 12 ||
          password.length > 256 || !['editor','operator'].includes(role)) throw Error('Invalid account details');
      return mutate(next => {
        if (next.users.some(u => u.username === username)) throw Error('Account already exists');
        const salt = randomBytes(16).toString('hex');
        next.users.push({username, role, salt, password:passwordHash(password,salt)});
      });
    },
    async save(base, service, username) {
      return mutate(next => {
        const latest = next.versions.at(-1);
        if (base !== (latest?.revision || 0)) return {conflict:true, current:latest || null};
        const version = {revision:(latest?.revision || 0)+1, service,
          author:username, savedAt:new Date().toISOString()};
        next.versions.push(version);
        return {version};
      });
    },
    async saveDated(date, base, service, username) {
      if (!validDate(date)) throw Error('Invalid date');
      return mutate(next => {
        next.datedVersions ||= {};
        const versions = next.datedVersions[date] ||= [];
        const latest = versions.at(-1);
        if (base !== (latest?.revision || 0)) return {conflict:true, current:latest || null};
        const version = {revision:(latest?.revision || 0)+1, service,
          author:username, savedAt:new Date().toISOString()};
        versions.push(version);
        return {version};
      });
    },
    // Church branding uses the same compare-and-swap revisions as services.
    async saveBranding(base, branding, username) {
      return mutate(next => {
        const latest = next.branding || null;
        if (base !== (latest?.revision || 0)) return {conflict:true, current:latest};
        const version = {revision:(latest?.revision || 0)+1, branding, author:username, savedAt:new Date().toISOString()};
        next.branding = version;
        return {version};
      });
    }
  };
}
export function createApp(store, {origin='http://127.0.0.1:8090', secure=false}={}) {
  const sessions = new Map(), attempts = new Map();
  const publicFiles = new Map([
    ['/', ['index.html','text/html']], ['/index.html',['index.html','text/html']],
    ['/style.css',['style.css','text/css']], ['/app.js',['app.js','text/javascript']], ['/content-import.js',['content-import.js','text/javascript']],
    ['/bible-search.js',['bible-search.js','text/javascript']], ['/assets/bibles/kjv.vpl.txt',['assets/bibles/kjv.vpl.txt','text/plain']], ['/assets/bibles/web.vpl.txt',['assets/bibles/web.vpl.txt','text/plain']], ['/assets/bibles/rv1909.vpl.txt',['assets/bibles/rv1909.vpl.txt','text/plain']],
    ['/sync.js',['sync.js','text/javascript']], ['/i18n.js',['i18n.js','text/javascript']], ['/sync-core.js',['sync-core.js','text/javascript']],
    ['/sw.js',['sw.js','text/javascript']], ['/desktop-ui.js',['desktop-ui.js','text/javascript']], ['/slide-template.cjs',['slide-template.cjs','text/javascript']],['/assets/fonts/Inter.ttf',['assets/fonts/Inter.ttf','font/ttf']],['/assets/fonts/Montserrat.ttf',['assets/fonts/Montserrat.ttf','font/ttf']],['/assets/fonts/Lato.ttf',['assets/fonts/Lato.ttf','font/ttf']],['/assets/fonts/Merriweather.ttf',['assets/fonts/Merriweather.ttf','font/ttf']],['/assets/fonts/PlayfairDisplay.ttf',['assets/fonts/PlayfairDisplay.ttf','font/ttf']],['/assets/fonts/Oswald.ttf',['assets/fonts/Oswald.ttf','font/ttf']],['/assets/fonts/Poppins.ttf',['assets/fonts/Poppins.ttf','font/ttf']],['/assets/fonts/SourceSans3.ttf',['assets/fonts/SourceSans3.ttf','font/ttf']]
  ]);
  return http.createServer(async (req,res) => {
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    const send = (status,data,headers={}) => {
      res.writeHead(status, {'Content-Type':'application/json',...headers});
      res.end(JSON.stringify(data));
    };
    try {
      if (req.headers.host !== new URL(origin).host) return send(403,{error:'Unexpected host'});
      const url = new URL(req.url,origin);
      if (!url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET') return send(405,{error:'Method not allowed'});
        const file = publicFiles.get(url.pathname);
        if (!file) return send(404,{error:'Not found'});
        const content = await readFile(path.join(root,file[0]));
        res.writeHead(200,{'Content-Type':file[1]+'; charset=utf-8'});res.end(content);return;
      }
      if (!['GET','POST','PUT'].includes(req.method)) return send(405,{error:'Method not allowed'});
      if (req.method !== 'GET' && (req.headers.origin !== origin ||
          !req.headers['content-type']?.startsWith('application/json'))) return send(403,{error:'Same-origin JSON required'});
      const body = async () => {
        let size=0, chunks=[];
        for await (const chunk of req) {
          size+=chunk.length;if(size>5_000_000) throw Object.assign(Error('Too large'),{status:413});
          chunks.push(chunk);
        }
        try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
        catch { throw Object.assign(Error('Invalid JSON'),{status:400}); }
      };
      const cookie = req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('wui_session='))?.slice(12);
      const sessionKey = cookie ? hash(cookie) : '';
      const session = sessions.get(sessionKey);
      if (session && session.expires <= Date.now()) sessions.delete(sessionKey);
      const user = session && session.expires > Date.now()
        ? store.state().users.find(u=>u.username===session.username) : null;
      const cookieValue = (token,age) => `wui_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure?'; Secure':''}`;
      if (url.pathname === '/api/login' && req.method === 'POST') {
        const ip=req.socket.remoteAddress;
        const now=Date.now();
        for (const [key,value] of attempts) if (value.until<now) attempts.delete(key);
        if (attempts.size>10000 || (attempts.get(ip)?.count||0)>=10) return send(429,{error:'Too many attempts. Try again in 15 minutes.'});
        const b=await body();
        if (typeof b?.username!=='string' || typeof b.password!=='string' || b.password.length>256) return send(400,{error:'Invalid login'});
        const account=store.state().users.find(u=>u.username===b.username);
        const actual=passwordHash(b.password,account?.salt||'dummy-salt');
        if (!account || !timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(account.password,'hex'))) {
          const old=attempts.get(ip)||{count:0,until:now+900000};old.count++;attempts.set(ip,old);
          return send(401,{error:'Incorrect username or password'});
        }
        attempts.delete(ip);
        for (const [key,value] of sessions) if (value.expires<now) sessions.delete(key);
        if(sessionKey)sessions.delete(sessionKey);
        const token=randomBytes(32).toString('hex');
        sessions.set(hash(token),{username:account.username,expires:now+43200000});
        return send(200,{username:account.username,role:account.role},{'Set-Cookie':cookieValue(token,43200)});
      }
      if (!user) return send(401,{error:'Sign in to sync. Your downloaded service remains available.'});
      if(url.pathname==='/api/me' && req.method==='GET') return send(200,{username:user.username,role:user.role});
      if(url.pathname==='/api/logout' && req.method==='POST') {
        sessions.delete(sessionKey);return send(200,{ok:true},{'Set-Cookie':cookieValue('',0)});
      }
      const dated=url.pathname.match(/^\/api\/setlists\/([0-9]{4}-[0-9]{2}-[0-9]{2})(?:\/versions(?:\/([0-9]+))?)?$/);
      if(dated) {
        const date=dated[1];
        if(!validDate(date)) return send(400,{error:'Invalid date'});
        const versions=store.state().datedVersions?.[date] || [];
        const history=url.pathname.includes('/versions');
        if(req.method==='GET' && history && dated[2]) {
          const version=versions.find(v=>v.revision===Number(dated[2]));
          return send(version?200:404,version?{version}:{error:'Version not found'});
        }
        if(req.method==='GET' && history) return send(200,{versions:versions.slice(-100).reverse().map(({service,...v})=>({...v,title:service.title}))});
        if(req.method==='GET') return send(200,{version:versions.at(-1)||null});
        if(req.method==='PUT' && !history) {
          const b=await body();
          if(!Number.isInteger(b?.baseRevision)||b.baseRevision<0||!validService(b.service)) return send(400,{error:'Invalid service or revision'});
          const result=await store.saveDated(date,b.baseRevision,b.service,user.username);
          return send(result.conflict?409:200,result);
        }
        return send(405,{error:'Method not allowed'});
      }
      if(url.pathname==='/api/branding' && req.method==='GET') return send(200,{version:store.state().branding||null});
      if(url.pathname==='/api/branding' && req.method==='PUT') {
        const b=await body();
        if(!Number.isInteger(b?.baseRevision)||b.baseRevision<0||!SlideTemplate.validBranding(b.branding)) return send(400,{error:'Invalid branding or revision'});
        const result=await store.saveBranding(b.baseRevision,b.branding,user.username);
        return send(result.conflict?409:200,result);
      }
      if(url.pathname==='/api/service' && req.method==='GET') return send(200,{version:store.state().versions.at(-1)||null});
      if(url.pathname==='/api/service' && req.method==='PUT') {
        const b=await body();
        if(!Number.isInteger(b?.baseRevision)||b.baseRevision<0||!validService(b.service)) return send(400,{error:'Invalid service or revision'});
        const result=await store.save(b.baseRevision,b.service,user.username);
        return send(result.conflict?409:200,result);
      }
      if(url.pathname==='/api/versions' && req.method==='GET') return send(200,{versions:store.state().versions.slice(-100).reverse().map(({service,...v})=>({...v,title:service.title}))});
      const match=url.pathname.match(/^\/api\/versions\/(\d+)$/);
      if(match && req.method==='GET') {
        const version=store.state().versions.find(v=>v.revision===Number(match[1]));
        return send(version?200:404,version?{version}:{error:'Version not found'});
      }
      return send(404,{error:'Not found'});
    } catch(error) { if(!res.headersSent)send(error.status||500,{error:error.status?error.message:'Server error. Local service is unchanged.'});else res.end(); }
  });
}
export async function start({directory=path.join(root,'.data'),host='127.0.0.1',port=8090,origin,secure=false}={}) {
  const store=await openStore(directory);
  const server=createApp(store,{origin:origin||`http://${host}:${port}`,secure});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve)});
  return {server,store};
}
