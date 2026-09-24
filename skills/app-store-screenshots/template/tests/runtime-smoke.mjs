import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, cp, symlink, readFile, writeFile, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import net from 'node:net';
const source = process.cwd();
const mode = process.argv[2] === 'dev' ? 'dev' : 'start';
const directory = await mkdtemp(path.join(tmpdir(), 'screenshot runtime-'));
const server = net.createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
await new Promise(resolve => server.close(resolve));
for (const name of ['scripts', 'package.json', 'next.config.mjs', 'app-store-screenshots.json', 'public', 'src', 'tsconfig.json', 'postcss.config.mjs', 'tailwind.config.ts']) await cp(path.join(source,name), path.join(directory,name), {recursive:true});
if (mode === 'dev') await cp(path.join(source,'node_modules'),path.join(directory,'node_modules'),{recursive:true,verbatimSymlinks:true});
else await symlink(path.join(source,'node_modules'),path.join(directory,'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
if (mode === 'start') await symlink(path.join(source,'.next'),path.join(directory,'.next'), process.platform === 'win32' ? 'junction' : 'dir');
const frameCache = path.join(directory, 'operator-frame-cache');
// A fresh package must run with no original asset folder and no operator cache.
await assert.rejects(access(frameCache), {code: 'ENOENT'});
const child = spawn(process.execPath,['scripts/local-server.mjs',mode,'--port',String(port)],{cwd:directory,stdio:['ignore','pipe','pipe'],env:{...process.env,SCREENSHOT_FRAME_CACHE_DIR:frameCache}});
let output = '';
child.stdout.on('data',data => { output += data; });
child.stderr.on('data',data => { output += data; });
const origin = `http://127.0.0.1:${port}`;
try {
  for (let count=0; count<300; count++) {
    if (child.exitCode !== null) throw new Error('The local server exited before it was ready.');
    try { if ((await fetch(origin+'/unlock')).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve,100));
  }
  const token = output.match(/\/unlock#([a-f0-9]{64})/)?.[1];
  assert.ok(token,'launcher emits access link');
  assert.equal((await fetch(origin+'/api/project')).status,401);
  assert.equal((await fetch(origin+'/mockup.png')).status,401);
  assert.equal((await fetch(origin+'/api/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({token:'bad'})})).status,401);
  const session = await fetch(origin+'/api/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({token})});
  assert.equal(session.status,200);
  const cookie = session.headers.get('set-cookie').split(';')[0];
  const headers = {Cookie:cookie,Origin:origin,'Content-Type':'application/json'};
  assert.equal((await fetch(origin,{headers})).status,200);
  assert.equal((await fetch(origin+'/mockup.png',{headers})).status,200);
  {
    const frames = Object.values(JSON.parse(await readFile(path.join(directory,'src/lib/apple-frames.json'),'utf8')));
    for (const frame of frames) {
      const url = origin+'/api/device-frames/'+frame.filename;
      const original = await readFile(path.join(source,'public/device-frames',frame.filename));
      const installed = path.join(directory,'public/device-frames',frame.filename);
      assert.deepEqual(await readFile(installed), original, 'the package includes unchanged original frames without a cache');
      assert.equal((await fetch(url)).status,401);
      const response = await fetch(url,{headers});
      assert.equal(response.status,200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()),original);
      await writeFile(installed,'modified frame');
      assert.equal((await fetch(url,{headers})).status,409,'changed source bytes cannot be served as an original frame');
      await writeFile(installed,original);
    }
  }
  await assert.rejects(access(frameCache), {code: 'ENOENT'});
  for (const name of ['apple-design-resources.txt', 'editor-mit.txt']) {
    const url = origin + '/licenses/' + name;
    assert.equal((await fetch(url)).status, 401);
    const response = await fetch(url, {headers});
    assert.equal(response.status, 200);
    assert.equal(await response.text(), await readFile(path.join(source, 'public/licenses', name), 'utf8'));
  }
  const project = (await (await fetch(origin+'/api/project',{headers})).json()).state;
  project.appName='Runtime test';
  assert.equal((await fetch(origin+'/api/project',{method:'POST',headers,body:JSON.stringify(project)})).status,200);
  assert.equal(JSON.parse(await readFile(path.join(directory,'app-store-screenshots.json'),'utf8')).appName,'Runtime test');
  assert.equal((await fetch(origin+'/api/project',{method:'POST',headers:{...headers,Origin:'https://attacker.example'},body:'{}'})).status,403);
  assert.equal((await fetch(origin+'/api/project',{method:'POST',headers:{...headers,'Content-Type':'text/plain'},body:'{}'})).status,415);
  assert.equal((await fetch(origin+'/api/project',{method:'POST',headers,body:JSON.stringify({pad:'x'.repeat(4*1024*1024)})})).status,413);
  const png=await readFile(path.join(directory,'public/mockup.png'));
  const uploaded=await fetch(origin+'/api/upload',{method:'POST',headers,body:JSON.stringify({dataUrl:`data:image/png;base64,${png.toString('base64')}`})});
  assert.equal(uploaded.status,200);
  const uploadPath=(await uploaded.json()).path;
  assert.equal((await fetch(origin+uploadPath)).status,401);
  assert.equal((await fetch(origin+uploadPath,{headers})).status,200,'new uploads are readable in production');
  const largest = Buffer.alloc(8*1024*1024);
  png.copy(largest);
  const maximum = await fetch(origin+'/api/upload',{method:'POST',headers,body:JSON.stringify({dataUrl:`data:image/png;base64,${largest.toString('base64')}`})});
  assert.equal(maximum.status,200,'full 8 MiB upload is supported');
  console.log('Runtime checks passed: session, protected pages/assets, save/read, cross-origin and size rejection, upload/read.' + ' Included frames work without a cache; source integrity and license notices also passed.');
} catch (error) {
  console.error(output.replace(/#[a-f0-9]{64}/g, '#[redacted]'));
  throw error;
} finally {
  if (child.exitCode === null && child.signalCode === null) {
    const stopped = new Promise(resolve => child.once('exit',resolve));
    // On Windows a forced parent termination does not stop its Next child.
    // Stop only this test's process tree before removing the temporary copy.
    if (process.platform === 'win32') {
      await promisify(execFile)('taskkill', ['/PID', String(child.pid), '/T', '/F']);
    } else child.kill('SIGTERM');
    await stopped;
  }
  await rm(directory,{recursive:true,force:true});
}
