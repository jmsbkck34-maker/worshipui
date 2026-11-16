import process from 'node:process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openStore,start} from './server.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const directory=process.env.WUI_DATA_DIR||path.join(root,'.data');
  if(process.argv[2]==='add-user') {
    // Supply a JSON account over stdin; never pass passwords as command arguments.
    let input='';for await(const part of process.stdin)input+=part;
    try { const b=JSON.parse(input);await (await openStore(directory)).addUser(b.username,b.password,b.role);console.log('Account created.'); }
    catch { console.error('Account not created. Check username, role and password (12–256 characters), or duplicate username.');process.exitCode=1; }
  } else {
    const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||8090);
    const origin=process.env.WUI_ORIGIN||`http://${host}:${port}`;
    if(host!=='127.0.0.1' && !origin.startsWith('https://')) throw Error('Remote hosting requires WUI_ORIGIN with HTTPS behind a TLS proxy.');
    await start({directory,host,port,origin,secure:origin.startsWith('https://')});
    console.log('Worship UI server ready. Open the configured origin.');
  }
}
