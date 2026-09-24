import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, cp, symlink, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import net from 'node:net';
import { createRequire } from 'node:module';
const require = createRequire(process.cwd() + '/package.json');
const JSZip = require('jszip'), sharp = require('sharp');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const source = process.cwd(), directory = await mkdtemp(path.join(tmpdir(), 'background-test-'));
const resultDir = process.argv[2] || path.join(directory,'results');
await mkdir(resultDir,{recursive:true});
const socket = net.createServer();
await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));
const port=socket.address().port;
await new Promise(resolve=>socket.close(resolve));
for(const name of ['scripts','src','package.json','next.config.mjs','app-store-screenshots.json','public']) await cp(path.join(source,name),path.join(directory,name),{recursive:true});
await symlink(path.join(source,'node_modules'),path.join(directory,'node_modules'));
await symlink(path.join(source,'.next'),path.join(directory,'.next'));
const child=spawn(process.execPath,['scripts/local-server.mjs','start','--port',String(port)],{cwd:directory,stdio:['ignore','pipe','pipe']});
let output='',browser,page;
child.stdout.on('data',data=>output+=data);child.stderr.on('data',data=>output+=data);
const origin=`http://127.0.0.1:${port}`;
try {
  for(let i=0;i<100;i++){try{if((await fetch(origin+'/unlock')).ok)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
  const token=output.match(/\/unlock#([a-f0-9]{64})/)?.[1];assert.ok(token);
  browser=await chromium.launch({channel:'chrome',headless:true});
  page=await browser.newPage({viewport:{width:1480,height:1060}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/unlock#'+token);await page.waitForURL(origin+'/');
  await page.getByRole('button',{name:'Background',exact:true}).waitFor();
  const state=(await(await page.request.get(origin+'/api/project')).json()).state;
  const assets=await page.evaluate(()=>{
    const app=document.createElement('canvas');app.width=1320;app.height=2868;
    const c=app.getContext('2d');c.fillStyle='#f4f2ea';c.fillRect(0,0,1320,2868);
    c.fillStyle='#254036';c.fillRect(0,0,1320,450);c.fillStyle='#fff';c.font='bold 90px sans-serif';c.fillText('TEST APP',90,290);
    ['Morning practice','Build your strength','A moment to reset'].forEach((label,i)=>{c.fillStyle=['#adc4b1','#d8b993','#819da0'][i];c.fillRect(80,560+i*680,1160,430);c.fillStyle='#254036';c.font='54px sans-serif';c.fillText(label,80,1080+i*680);});
    const image=document.createElement('canvas');image.width=1800;image.height=900;
    const x=image.getContext('2d');['#D88A7C','#85B399','#6E92B3'].forEach((color,i)=>{x.fillStyle=color;x.fillRect(i*600,0,600,900);});
    return {app:app.toDataURL('image/png'),image:image.toDataURL('image/png')};
  });
  async function asset(dataUrl){const response=await page.request.post(origin+'/api/upload',{headers:{Origin:origin},data:{dataUrl}});assert.equal(response.status(),200);return(await response.json()).path;}
  const appPath=await asset(assets.app);
  const imageFile=path.join(directory,'background.png');await writeFile(imageFile,Buffer.from(assets.image.split(',')[1],'base64'));
  await writeFile(path.join(resultDir,'test-app.png'),Buffer.from(assets.app.split(',')[1],'base64'));
  await writeFile(path.join(resultDir,'test-background.png'),Buffer.from(assets.image.split(',')[1],'base64'));
  state.appName='Background studio';state.device='iphone';state.orientation='portrait';state.locales=['en'];state.locale='en';
  state.brand={background:'#F6EEE3',foreground:'#262D24',font:'serif',alignment:'center'};
  state.slidesByDevice.iphone=[{id:'background-1',layout:'device-bottom',label:{},headline:{en:'Your daily practice'},screenshot:appPath}];
  async function put(value){const response=await page.request.post(origin+'/api/project',{headers:{Origin:origin},data:value});assert.equal(response.status(),200);await page.reload();await page.getByRole('button',{name:'Background',exact:true}).waitFor();}
  async function saved(check){for(let i=0;i<100;i++){const value=JSON.parse(await readFile(path.join(directory,'app-store-screenshots.json'),'utf8'));if(check(value))return value;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error('Saved background condition timed out');}
  async function open(){await page.getByRole('button',{name:'Background',exact:true}).click();await page.getByRole('dialog').waitFor();}
  async function apply(){await page.getByRole('button',{name:'Apply background',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});}
  async function range(label,value){const control=page.getByRole('slider',{name:label,exact:true});await control.evaluate((element,value)=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(element,String(value));element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));},value);}
  async function preview(){return page.locator('[data-background-preview]').screenshot();}
  async function exportZip(){const download=page.waitForEvent('download',{timeout:120000});await page.getByRole('button',{name:'Export bundle',exact:true}).click();const result=await Promise.race([download,page.getByRole('dialog').waitFor({state:'visible',timeout:120000}).then(async()=>{throw new Error(await page.getByRole('dialog').innerText());})]);return JSZip.loadAsync(await readFile(await result.path()));}
  await put(state);
  await open();await page.getByRole('textbox',{name:'Solid color',exact:true}).fill('#EEDCC5');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.equal((await(await page.request.get(origin+'/api/project')).json()).state.background,undefined);
  await open();await page.getByRole('textbox',{name:'Solid color',exact:true}).fill('#BAD');
  assert.equal(await page.getByRole('button',{name:'Apply background',exact:true}).isDisabled(),true);
  await page.getByRole('textbox',{name:'Solid color',exact:true}).fill('#EEDCC5');await apply();
  await saved(value=>value.background?.color==='#EEDCC5');
  await page.keyboard.press('Meta+z');await saved(value=>!value.background);
  await page.keyboard.press('Meta+Shift+z');await saved(value=>value.background?.color==='#EEDCC5');
  await page.reload();await open();assert.equal(await page.getByRole('textbox',{name:'Solid color',exact:true}).inputValue(),'#EEDCC5');
  await page.getByLabel('Apply to',{exact:true}).selectOption('slide');
  await page.getByRole('button',{name:'Gradient',exact:true}).click();
  await page.getByRole('button',{name:'Use Forest gradient',exact:true}).click();
  const before=await preview();await range('Gradient angle',270);assert.notDeepEqual(await preview(),before);
  for(let i=0;i<3;i++)await page.getByRole('button',{name:'Add color stop',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Add color stop',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Remove stop 5',exact:true}).click();
  await page.getByRole('button',{name:'Remove stop 4',exact:true}).click();
  await range('Stop 2 position',35);
  await page.getByRole('button',{name:'Reverse',exact:true}).click();
  await page.getByLabel('Gradient shape',{exact:true}).selectOption('radial');
  await range('Gradient center X',25);await range('Gradient center Y',15);
  await page.getByRole('button',{name:'Image',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Apply background',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Gradient',exact:true}).click();
  assert.equal(await page.getByLabel('Gradient shape',{exact:true}).inputValue(),'radial');
  await page.getByRole('dialog').evaluate(element=>element.scrollTop=0);
  await page.getByRole('dialog').screenshot({path:path.join(resultDir,'gradient-picker.png')});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.getByRole('dialog').evaluate(element=>element.scrollWidth<=element.clientWidth+1),true,'picker fits a narrow viewport');
  await page.setViewportSize({width:1480,height:1060});
  await apply();let current=await saved(value=>value.slidesByDevice.iphone[0].background?.style==='radial');
  assert.equal(current.background.color,'#EEDCC5');
  const radial=structuredClone(current.slidesByDevice.iphone[0].background);
  assert.equal(radial.center.x,25);assert.equal(radial.stops.length,3);
  await page.reload();await open();assert.equal(await page.getByLabel('Apply to',{exact:true}).inputValue(),'slide');
  await page.getByRole('button',{name:'Image',exact:true}).click();
  await page.getByLabel('Upload background image',{exact:true}).setInputFiles(imageFile);
  await page.getByRole('button',{name:'Apply background',exact:true}).waitFor();
  for(let i=0;i<50&&await page.getByRole('button',{name:'Apply background',exact:true}).isDisabled();i++)await page.waitForTimeout(50);
  const imageBefore=await preview();await range('Image horizontal position',100);await range('Image zoom',2);assert.notDeepEqual(await preview(),imageBefore);
  await page.getByLabel('Image size',{exact:true}).selectOption('contain');
  assert.equal(await page.getByRole('slider',{name:'Image zoom',exact:true}).count(),0);
  await page.getByRole('textbox',{name:'Image base color',exact:true}).fill('#ECE5DC');
  const contain=await preview();await page.getByLabel('Image size',{exact:true}).selectOption('cover');assert.notDeepEqual(await preview(),contain);
  await page.getByRole('button',{name:'Reset image position',exact:true}).click();
  assert.equal(await page.getByRole('slider',{name:'Image zoom',exact:true}).inputValue(),'1');
  await range('Image horizontal position',100);
  await page.getByRole('textbox',{name:'Image tint',exact:true}).fill('#102F34');await range('Tint strength',40);
  await page.getByRole('textbox',{name:'Background text color',exact:true}).fill('#FFFFFF');
  await page.getByRole('dialog').evaluate(element=>element.scrollTop=0);
  await page.getByRole('dialog').screenshot({path:path.join(resultDir,'image-picker.png')});
  await apply();current=await saved(value=>value.slidesByDevice.iphone[0].background?.kind==='image');
  const picture=structuredClone(current.slidesByDevice.iphone[0].background);
  assert.equal(picture.image.crop.x,100);assert.equal(picture.tint.opacity,40);
  await page.reload();await open();assert.equal(await page.getByRole('slider',{name:'Tint strength',exact:true}).inputValue(),'40');
  await page.getByRole('button',{name:'Clear background image',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Apply background',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await open();await page.getByRole('button',{name:'Use project background',exact:true}).click();await saved(value=>!value.slidesByDevice.iphone[0].background);
  current=JSON.parse(await readFile(path.join(directory,'app-store-screenshots.json'),'utf8'));
  current.slidesByDevice.iphone.push({...structuredClone(current.slidesByDevice.iphone[0]),id:'background-2',background:radial});await put(current);
  await open();await page.getByLabel('Apply to',{exact:true}).selectOption('project');await page.getByRole('button',{name:'Gradient',exact:true}).click();await page.getByRole('button',{name:'Use Ocean gradient',exact:true}).click();await apply();
  await saved(value=>value.background?.kind==='gradient'&&value.slidesByDevice.iphone[1].background?.kind==='gradient');
  await open();await page.getByRole('checkbox',{name:/Replace 1 screen override/}).check();await page.getByRole('button',{name:'Use Warm neutral gradient',exact:true}).click();await apply();
  await saved(value=>value.slidesByDevice.iphone.every(slide=>!slide.background));
  console.log('Background controls passed: cancel, undo/redo, persistence, stops, radial center, upload, crop, fit/fill, tint, reset, scopes.');
  const deck=[
    {...state.slidesByDevice.iphone[0],id:'solid',background:{kind:'solid',color:'#EEDCC5',textColor:'#302B25'}},
    {...state.slidesByDevice.iphone[0],id:'linear',background:{kind:'gradient',style:'linear',angle:90,center:{x:50,y:50},stops:[{color:'#DDEFF0',position:0},{color:'#73ACBD',position:100}],textColor:'#153A43'},headline:{en:'Find your next class'}},
    {...state.slidesByDevice.iphone[0],id:'gradient',background:radial,headline:{en:'Build your strength'}},
    {...state.slidesByDevice.iphone[0],id:'image',background:picture,headline:{en:'Make time for yourself'}},
  ];
  current.slidesByDevice.iphone=deck;current.background=undefined;current.locales=['en','de'];
  deck.forEach(slide=>slide.headline.de='Deine tägliche Praxis');await put(current);
  const zip=await exportZip();const files=Object.values(zip.files).filter(file=>file.name.startsWith('ios/')&&file.name.endsWith('.png'));assert.equal(files.length,32);
  for(const file of files){const bytes=await file.async('nodebuffer');const [,w,h]=file.name.match(/\/(\d+)x(\d+)\//);assert.equal(bytes.readUInt32BE(16),Number(w));assert.equal(bytes.readUInt32BE(20),Number(h));}
  async function pixel(file,x,y){const bytes=await file.async('nodebuffer');const image=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});const n=(y*image.info.width+x)*4;return [...image.data.subarray(n,n+3)];}
  const solid=zip.file('ios/iphone/1320x2868/en/01-device-bottom.png');assert.deepEqual(await pixel(solid,10,10),[238,220,197]);
  const image=zip.file('ios/iphone/1320x2868/en/04-device-bottom.png');const rgb=await pixel(image,10,10);const expected=[110,146,179].map((v,i)=>Math.round(v*.6+[16,47,52][i]*.4));assert.ok(rgb.every((v,i)=>Math.abs(v-expected[i])<=2),`image crop and tint pixels: ${rgb}`);
  const linear=zip.file('ios/iphone/1320x2868/en/02-device-bottom.png');
  const left=await pixel(linear,10,10),right=await pixel(linear,1310,10);assert.ok(left[0]>right[0]+90&&left[1]>right[1]+50,'linear gradient survives PNG export');
  const gradient=zip.file('ios/iphone/1320x2868/en/03-device-bottom.png');assert.notDeepEqual(await pixel(gradient,10,10),await pixel(gradient,1310,2850));
  await writeFile(path.join(resultDir,'background-templates.png'),await zip.file('review/en.png').async('nodebuffer'));
  // The shared layer must also render in landscape iPad and feature graphic exports.
  current.locales=['en'];current.locale='en';current.device='ipad';current.orientation='landscape';current.background=radial;current.connectedCanvas=true;
  current.slidesByDevice.ipad=[{...deck[0],id:'ipad',layout:'no-device',background:undefined,headline:{en:'Your classes'}}];await put(current);
  const ipad=await exportZip();assert.equal(Object.values(ipad.files).filter(file=>file.name.startsWith('ios/')&&file.name.endsWith('.png')).length,2);
  current.device='feature-graphic';current.orientation='portrait';current.appIcon=appPath;current.background={...picture,fit:'contain'};
  current.slidesByDevice['feature-graphic']=[{...deck[0],id:'feature',layout:'feature-graphic',background:undefined,headline:{en:'Your classes'}}];await put(current);
  const feature=await exportZip();const featureFile=Object.values(feature.files).find(file=>file.name.startsWith('android/')&&file.name.endsWith('.png'));assert.ok(featureFile);
  const basePixel=await pixel(featureFile,10,10);const baseExpected=[236,229,220].map((v,i)=>Math.round(v*.6+[16,47,52][i]*.4));assert.ok(basePixel.every((v,i)=>Math.abs(v-baseExpected[i])<=2),'fit leaves the tinted base color around the image');
  await writeFile(path.join(resultDir,'background-feature.png'),await featureFile.async('nodebuffer'));
  current.background={...picture,image:{src:'/screenshots/missing-background.png'}};await put(current);await page.getByRole('button',{name:'Export bundle',exact:true}).click();await page.getByText(/background image could not load/).waitFor();
  assert.deepEqual(errors,[]);
  console.log('Background exports passed: 32 iPhone PNGs in two languages, 2 landscape iPad PNGs, 1 feature graphic, exact solid/image-tint pixels, linear/radial/fit pixels, narrow viewport, missing-image block, no page errors.');
} catch(error) {
  if(page){await page.screenshot({path:path.join(resultDir,'failure.png')}).catch(()=>{});console.error((await page.locator('body').innerText()).slice(-6000));}
  throw error;
} finally {
  await browser?.close();
  if(child.exitCode===null&&child.signalCode===null){const stopped=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');await stopped;}
  await rm(directory,{recursive:true,force:true});
}
