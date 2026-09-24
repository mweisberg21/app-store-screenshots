import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, cp, symlink, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import net from 'node:net';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const require = createRequire(process.cwd() + '/package.json');
const JSZip = require('jszip');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
let browser;
const source = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'screenshot-runtime-'));
const server = net.createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
await new Promise(resolve => server.close(resolve));
for (const name of ['scripts', 'package.json', 'next.config.mjs', 'app-store-screenshots.json', 'public']) await cp(path.join(source,name), path.join(directory,name), {recursive:true});
const fixture = JSON.parse(await readFile(path.join(directory,'app-store-screenshots.json'),'utf8'));
fixture.slidesByDevice.iphone = fixture.slidesByDevice.iphone.slice(0,1);
fixture.device = 'iphone';
await writeFile(path.join(directory,'app-store-screenshots.json'), JSON.stringify(fixture));
await symlink(path.join(source,'node_modules'),path.join(directory,'node_modules'));
await symlink(path.join(source,'.next'),path.join(directory,'.next'));
const child = spawn(process.execPath,['scripts/local-server.mjs','start','--port',String(port)],{cwd:directory,stdio:['ignore','pipe','pipe']});
let output = '';
child.stdout.on('data',data => { output += data; });
child.stderr.on('data',data => { output += data; });
const origin = `http://127.0.0.1:${port}`;
try {
  for (let count=0; count<100; count++) {
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
  const project = (await (await fetch(origin+'/api/project',{headers})).json()).state;
  project.appName='';
  assert.equal((await fetch(origin+'/api/project',{method:'POST',headers,body:JSON.stringify(project)})).status,200);
  assert.equal(JSON.parse(await readFile(path.join(directory,'app-store-screenshots.json'),'utf8')).appName,'');
  assert.equal((await fetch(origin+'/api/project',{method:'POST',headers:{...headers,Origin:'https://attacker.example'},body:'{}'})).status,403);
  assert.equal((await fetch(origin+'/api/project',{method:'POST',headers:{...headers,'Content-Type':'text/plain'},body:'{}'})).status,415);
  assert.equal((await fetch(origin+'/api/project',{method:'POST',headers,body:JSON.stringify({pad:'x'.repeat(4*1024*1024)})})).status,413);
  const png=await readFile(path.join(directory,'public/mockup.png'));
  const uploaded=await fetch(origin+'/api/upload',{method:'POST',headers,body:JSON.stringify({dataUrl:`data:image/png;base64,${png.toString('base64')}`})});
  assert.equal(uploaded.status,200);
  const uploadPath=(await uploaded.json()).path;
  assert.equal((await fetch(origin+uploadPath)).status,401);
  assert.equal((await fetch(origin+uploadPath,{headers})).status,200,'new uploads are readable in production');
  browser = await chromium.launch({channel:'chrome',headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin+'/unlock#'+token);
  await page.waitForURL(origin+'/');
  await page.getByRole('textbox',{name:'App name',exact:true}).waitFor();

  const resultDir = process.argv[2] || path.join(directory, 'review-results');
  const {mkdir}=await import('node:fs/promises');
  await mkdir(resultDir,{recursive:true});
  // Artificial fixtures test crop geometry without customer material.
  const fixtures=await page.evaluate(()=>{
    function paint(kind) {
      const c=document.createElement('canvas'); c.width=kind==='app'?918:1200; c.height=kind==='app'?1990:1600;
      const x=c.getContext('2d'); x.fillStyle='#f7f4eb'; x.fillRect(0,0,c.width,c.height);
      if(kind==='app') {
        x.fillStyle='#253d33'; x.fillRect(0,0,c.width,290); x.fillStyle='white'; x.font='bold 72px sans-serif'; x.fillText('TEST APP',60,190);
        ['Sample class','Sample program','Saved content'].forEach((name,i)=>{x.fillStyle=['#aabcab','#d8b288','#758e92'][i];x.fillRect(50,360+i*440,818,270);x.fillStyle='#263d33';x.font='44px sans-serif';x.fillText(name,50,690+i*440);});
      } else {
        ['#ba745a','#779691','#d4b675'].forEach((col,i)=>{x.fillStyle=col;x.fillRect(i*400,0,400,1600);});
        x.fillStyle='#fff';x.font='bold 72px sans-serif';x.fillText('CROP TEST',170,720);x.font='38px sans-serif';x.fillText('Test artwork only',180,790);
        x.strokeStyle='#202020';x.lineWidth=8;x.strokeRect(60,60,1080,1480);
      }
      return c.toDataURL('image/png');
    }
    return {app:paint('app'),photo:paint('photo')};
  });
  const appFile=path.join(directory,'app-test.png'),photoFile=path.join(directory,'photo-test.png');
  await writeFile(appFile,Buffer.from(fixtures.app.split(',')[1],'base64'));
  await writeFile(photoFile,Buffer.from(fixtures.photo.split(',')[1],'base64'));
  async function upload(label,file) {
    const response=page.waitForResponse(r=>r.url()===origin+'/api/upload'&&r.request().method()==='POST');
    await page.getByLabel(label,{exact:true}).setInputFiles(file);
    const res=await response;assert.equal(res.status(),200);return(await res.json()).path;
  }
  async function saved(check) {
    for(let i=0;i<80;i++){const s=JSON.parse(await readFile(path.join(directory,'app-store-screenshots.json'),'utf8'));if(check(s))return s;await new Promise(r=>setTimeout(r,100));}
    throw new Error('Autosave condition timed out');
  }
  async function layout(name){await page.getByRole('combobox',{name:'Template',exact:true}).click();await page.getByRole('option',{name,exact:true}).click();}
  await page.getByRole('textbox',{name:'App name',exact:true}).fill('Template test');
  await page.getByRole('textbox',{name:'Headline',exact:true}).fill('Browse your classes');
  const appPath=await upload('Upload primary',appFile);
  await layout('Creator with app');
  await page.getByRole('button',{name:'Export bundle',exact:true}).click();
  await page.getByText(/add the creator photo/).waitFor();
  await page.getByRole('button',{name:'Back to editor'}).click();
  const photoPath=await upload('Upload creator photo',photoFile);
  const image=page.locator('main [data-image-role="Creator photo"]').first();
  await image.waitFor();const before=await image.screenshot();
  await page.getByRole('slider',{name:'Creator photo horizontal crop',exact:true}).focus();await page.keyboard.press('End');
  await page.getByRole('slider',{name:'Creator photo zoom',exact:true}).focus();await page.keyboard.press('End');
  await saved(s=>s.slidesByDevice.iphone[0].photo?.crop?.x===100&&s.slidesByDevice.iphone[0].photo?.crop?.zoom===3);
  assert.notDeepEqual(before,await image.screenshot(),'crop controls change pixels');
  await layout('App screen');await layout('Creator with app');
  assert.equal(await page.getByRole('slider',{name:'Creator photo zoom',exact:true}).inputValue(),'3');
  await page.reload();await page.getByRole('textbox',{name:'App name',exact:true}).waitFor();
  assert.equal(await page.getByRole('slider',{name:'Creator photo horizontal crop',exact:true}).inputValue(),'100');
  await page.getByRole('button',{name:'Reset creator photo crop',exact:true}).click();
  await layout('Content library');
  await upload('Upload catalog image 1',photoFile);await upload('Upload catalog image 2',photoFile);
  await page.getByRole('button',{name:'Add catalog image',exact:true}).click();await upload('Upload catalog image 3',photoFile);
  await page.getByRole('button',{name:'Remove catalog image 2',exact:true}).click();
  await saved(s=>s.slidesByDevice.iphone[0].artworks?.length===2&&s.slidesByDevice.iphone[0].artworks.every(a=>a.src));
  await page.getByRole('button',{name:'Brand',exact:true}).click();
  await page.getByRole('textbox',{name:'Brand background',exact:true}).fill('#F6EEE3');
  await page.getByRole('textbox',{name:'Brand foreground',exact:true}).fill('#262D24');
  await page.getByLabel('Headline type',{exact:true}).selectOption('serif');
  await page.getByRole('button',{name:'Apply brand',exact:true}).click();
  let testProject=await saved(s=>s.brand?.font==='serif');
  const captions=[['Browse your classes','Deine Kurse entdecken'],['Meet your teacher','Lerne deine Lehrerin kennen'],['Choose your program','Wähle dein Programm']];
  testProject.locales=['en','de'];
  testProject.slidesByDevice.iphone=['device-bottom','creator','content-library'].map((layout,i)=>({id:`template-${i}`,layout,label:{},headline:{en:captions[i][0],de:captions[i][1]},screenshot:appPath,photo:{src:photoPath,crop:{x:50,y:50,zoom:1}},artworks:[{src:photoPath},{src:photoPath},{src:photoPath}]}));
  async function put(state){const res=await page.request.post(origin+'/api/project',{headers:{Origin:origin},data:state});assert.equal(res.status(),200);await page.reload();await page.getByRole('textbox',{name:'App name',exact:true}).waitFor();}
  testProject.slidesByDevice.iphone[2].headline.de='Sehr lange Überschrift '.repeat(22);
  await put(testProject);await page.getByRole('button',{name:'Export bundle',exact:true}).click();
  await page.getByText(/Screen 3 · DE: text exceeds its frame/).waitFor({timeout:15000});
  await page.getByRole('button',{name:'Back to editor'}).click();
  testProject.slidesByDevice.iphone[2].headline.de=captions[2][1];await put(testProject);
  const downloadPromise=page.waitForEvent('download',{timeout:120000});await page.getByRole('button',{name:'Export bundle',exact:true}).click();
  const zip=await JSZip.loadAsync(await readFile(await (await downloadPromise).path()));
  const store=Object.values(zip.files).filter(f=>f.name.startsWith('ios/')&&f.name.endsWith('.png'));
  const reviews=Object.values(zip.files).filter(f=>f.name.startsWith('review/')&&f.name.endsWith('.png'));
  assert.equal(store.length,24);assert.equal(reviews.length,2);
  for(const f of store){const d=await f.async('nodebuffer');const [,w,h]=f.name.match(/\/(\d+)x(\d+)\//);assert.equal(d.readUInt32BE(16),Number(w));assert.equal(d.readUInt32BE(20),Number(h));}
  for(const f of reviews)await writeFile(path.join(resultDir,path.basename(f.name)),await f.async('nodebuffer'));
  testProject.brand={background:'#1B252E',foreground:'#FFF8E8',font:'sans',alignment:'left'};
  testProject.locales=['en'];testProject.locale='en';testProject.device='android-7';testProject.orientation='landscape';
  testProject.slidesByDevice['android-7']=structuredClone(testProject.slidesByDevice.iphone);await put(testProject);
  const landscapeDownload=page.waitForEvent('download',{timeout:120000});await page.getByRole('button',{name:'Export bundle',exact:true}).click();
  const secondZip=await JSZip.loadAsync(await readFile(await (await landscapeDownload).path()));
  const landscape=Object.values(secondZip.files).filter(f=>f.name.startsWith('android/')&&f.name.endsWith('.png'));assert.equal(landscape.length,3);
  for(const f of landscape){const d=await f.async('nodebuffer');assert.equal(d.readUInt32BE(16),1920);assert.equal(d.readUInt32BE(20),1200);}
  await writeFile(path.join(resultDir,'landscape.png'),await secondZip.file('review/en.png').async('nodebuffer'));
  assert.deepEqual(errors,[]);
  console.log('Browser checks passed: uploads, crop pixels and persistence, template switching, library add/remove, German text overflow blocked, 24 iPhone PNGs, 3 landscape tablet PNGs, 3 review sheets, no page errors.');
} finally {
  await browser?.close();
  child.kill('SIGTERM');
  await new Promise(resolve => child.once('exit',resolve));
  await rm(directory,{recursive:true,force:true});
}
