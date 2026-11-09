/* Chromium desktop/mobile-viewport smoke tests, run separately from no-dependency Node unit tests.
 * No network or game-client integration. Captures screenshots for human QA.
 */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';

const root=resolve('.'),shots=join(root,'artifacts','browser');
const require=createRequire(import.meta.url);
const {build}=require('../tools/build-public.cjs');
build(); // Test the real public-only release bundle, not repository-root publishing.
const publicRoot=join(root,'dist-public');
await mkdir(shots,{recursive:true});
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.json':'application/json;charset=utf-8','.css':'text/css;charset=utf-8'};
function serveStatic(directory){
 return createServer(async(req,res)=>{
  try{
   const url=new URL(req.url||'/', 'http://127.0.0.1');
   const decoded=decodeURIComponent(url.pathname),target=decoded==='/'?'/index.html':decoded;
   const file=resolve(directory,'.'+target);
   if(!file.startsWith(directory+'/'))throw Error('forbidden');
   const bytes=await readFile(file);
   res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(bytes);
  }catch(_){res.writeHead(404);res.end('Not found');}
 });
}
async function listen(server){
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
 return 'http://127.0.0.1:'+server.address().port;
}
const server=serveStatic(publicRoot);
const developerServer=serveStatic(root);
const origin=await listen(server),developerOrigin=await listen(developerServer);
let browser,failures=0;
const results=[];
async function check(title,fn){
 try{await fn();results.push('PASS '+title);process.stdout.write('PASS '+title+'\n');}
 catch(error){failures++;results.push('FAIL '+title+' '+error.message);process.stderr.write('FAIL '+title+'\n'+(error.stack||error)+'\n');}
}
async function newPage(viewport){
 const context=await browser.newContext({viewport,locale:'en-US',acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 return {context,page,errors};
}
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j9ioAAAAASUVORK5CYII=','base64');
function crc32(bytes){
 let crc=0xffffffff;for(const b of bytes){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return (crc^0xffffffff)>>>0;
}
function storedZip(files){
 let offset=0;const a=[],b=[];
 for(const [filename,bytes0] of files){
  const bytes=Buffer.isBuffer(bytes0)?bytes0:Buffer.from(bytes0),name=Buffer.from(filename,'utf8'),crc=crc32(bytes);
  const l=Buffer.alloc(30),c=Buffer.alloc(46);
  l.writeUInt32LE(0x04034b50,0);l.writeUInt16LE(20,4);l.writeUInt32LE(crc,14);
  l.writeUInt32LE(bytes.length,18);l.writeUInt32LE(bytes.length,22);l.writeUInt16LE(name.length,26);
  c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);
  c.writeUInt32LE(crc,16);c.writeUInt32LE(bytes.length,20);c.writeUInt32LE(bytes.length,24);
  c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);
  a.push(l,name,bytes);b.push(c,name);offset+=l.length+name.length+bytes.length;
 }
 const dir=Buffer.concat(b),end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);
 end.writeUInt16LE(files.length,10);end.writeUInt32LE(dir.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...a,dir,end]);
}
function syntheticPack(){
 const hash=createHash('sha256').update(pixel).digest('hex'),assetPath='sprites/'+hash.slice(0,20)+'.png';
 return storedZip([
  ['manifest.json',JSON.stringify({schemaVersion:1,packType:'wheel-browser-local-review',
   status:'unverified-candidates',icons:[{category:'equipment',region:'ch',equipmentType:'jewelry',
    slot:'earring',degree:9,weaponType:null,gender:null,grade:null,
    sourcePath:'icon/item/china/acc/earring_09.ddj',itemCodes:[],
    assetPath,assetSha256:hash,matchStatus:'candidate',reviewStatus:'pending'}]})],
  [assetPath,pixel]
 ]);
}

try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 await check('public release bundle serves player root and excludes developer files over HTTP',async()=>{
  const {context,page,errors}=await newPage({width:1200,height:780});
  try{
   await page.goto(origin+'/',{waitUntil:'load'});
   await page.waitForSelector('#root [data-workspace-go="items"]',{timeout:12000});
   assert.match(await page.title(),/Silkroad Wheel Calculator/);
   const revision=await page.locator('#buildVersion').getAttribute('data-build-commit');
   assert.match(revision,/^(?:[a-f0-9]{40}|unavailable)$/);
   assert.match(await page.locator('#buildVersion').innerText(),/^Build:/);
   assert.equal(await page.locator('#buildVersion').getAttribute('data-build-commit'),revision);

   assert.equal(await page.locator('#localIconZip').count(),0);
   const paths=['/bemutato.html','/README.md','/data/release-evidence.json',
    '/tests/browser-smoke.mjs','/tools/build-public.cjs','/.github/workflows/wheel-tests.yml',
    '/assets/icons/original.ddj','/nonexistent.html'];
   for(const path of paths){
    const response=await context.request.get(origin+path);
    assert.equal(response.status(),404,path+' should not be included in the public bundle');
   }
   for(const publicPath of ['/','/index.html','/publikus.html','/visszajelzes.html',
    '/ikon-helyreallitas.html',
    '/assets/icons/local-pack.js','/assets/icons/manifest.js']){
    const response=await context.request.get(origin+publicPath);
    assert.equal(response.status(),200,publicPath+' must remain available');
   }
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 });


 await check('90 CAP private icons recover once on same public origin and persist across reload',async()=>{
  const {context,page,errors}=await newPage({width:1100,height:850});
  const requests=[];
  page.on('request',request=>{
   if(request.method()!=='GET')requests.push(request.url()+' '+request.method());
  });
  try{
   await page.goto(origin+'/');
   await page.waitForSelector('#root [data-workspace-go="items"]');
   assert.equal(await page.locator('[data-icon-source="local-auto"]').count(),0);
   assert.equal(await page.locator('input[accept*="zip"]').count(),0,'player calculator has no ZIP/image uploader');
   await page.locator('.icon-recovery-link').click();
   await page.waitForURL('**/ikon-helyreallitas.html');
   assert.match(await page.locator('h1').innerText(),/90 CAP/);
   await page.locator('#iconPack').setInputFiles({
    name:'test-private-9dg.zip',mimeType:'application/zip',buffer:syntheticPack()
   });
   await page.waitForFunction(()=>document.querySelector('#message')?.dataset.level==='ok',null,{timeout:16000});
   assert.match(await page.locator('#message').innerText(),/1 jelölt/);
   await page.selectOption('#language','en');
   assert.match(await page.locator('#message').innerText(),/1 candidates/);
   await page.locator('a[href="index.html"]').click();
   await page.waitForSelector('#root [data-icon-source="local-auto"]',{timeout:12000});
   assert.equal(await page.locator('input[accept*="zip"]').count(),0);
   await page.reload();
   await page.waitForSelector('#root [data-icon-source="local-auto"]',{timeout:12000});
   assert.deepEqual(requests,[],'private sprite transfer must remain in-browser');
   assert.deepEqual(errors,[]);
   await page.screenshot({path:join(shots,'recovered-9dg-icon-player.png'),fullPage:true});
  }finally{await context.close();}
 });
 await check('Silkroad feedback page switches language and copies current beta report',async()=>{
  const {context,page,errors}=await newPage({width:880,height:780});
  try{
   await context.grantPermissions(['clipboard-read','clipboard-write']);
   await page.goto(origin+'/visszajelzes.html');
   assert.match(await page.title(),/Silkroad Wheel Calculator/);
   assert.match(await page.locator('h1').innerText(),/Silkroad Wheel Calculator/);
   await page.selectOption('#feedbackLanguage','en');
   assert.match(await page.locator('h1').innerText(),/Feedback/);
   await page.locator('#current').fill('A test example for the public beta feedback');
   await page.locator('#copy').click();
   const copied=await page.evaluate(()=>navigator.clipboard.readText());
   assert.match(copied,/Emerald v5 BETA/);
   assert.match(copied,/A test example for the public beta feedback/);
   await page.locator('a[href="index.html"]').click();
   await page.waitForSelector('#root [data-workspace-go="items"]');
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 });

 await check('accessible workspace tabs, focused Blue editing, and live save messages',async()=>{
  const {context,page,errors}=await newPage({width:1080,height:840});
  try{
   await page.goto(origin+'/');
   await page.waitForSelector('#root [data-workspace-go="items"]');
   const tabs=page.locator('.workspace-nav [role="tab"]');
   assert.equal(await tabs.count(),5);
   assert.equal(await tabs.nth(0).getAttribute('tabindex'),'0');
   assert.equal(await tabs.nth(1).getAttribute('tabindex'),'-1');
   await tabs.nth(0).focus();
   await page.keyboard.press('ArrowRight');
   assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-workspace-go')),'balance');
   assert.equal(await tabs.nth(1).getAttribute('aria-selected'),'true');
   assert.equal(await tabs.nth(0).getAttribute('tabindex'),'-1');
   await page.keyboard.press('End');
   assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-workspace-go')),'extras');
   assert.equal(await tabs.nth(4).getAttribute('tabindex'),'0');
   await page.keyboard.press('Home');
   assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-workspace-go')),'items');
   assert.equal(await page.locator('[data-workspace-pane="items"]').isVisible(),true);
   await page.locator('.workspace-item-button[data-item="hands"]').click();
   assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-item')),'hands');
   // Blue catalog lives in the closed-by-default advanced editor disclosure.
   await page.locator('[data-editor-fold="tools"] > summary').click();
   await page.waitForFunction(()=>document.querySelector('[data-editor-fold="tools"]')?.open===true);
   const catalog=page.locator('#blue-catalog');
   await catalog.locator('summary').click();
   assert.equal(await catalog.evaluate(el=>el.open),true);
   const str=page.locator('#blue-catalog [data-blue-type="STR"]');
   const original=await str.isChecked();
   await str.click();
   assert.equal(await page.locator('#blue-catalog').evaluate(el=>el.open),true,
    'checkbox changes must not collapse manually expanded Blue catalog');
   assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-blue-type')),'STR',
    'focus must remain on the same Blue checkbox after a redraw');
   assert.equal(await page.locator('#blue-catalog [data-blue-type="STR"]').isChecked(),!original);
   assert.equal(await page.locator('#wheelAnnouncer').getAttribute('role'),'status');
   const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:16000}),
    page.locator('#exportBtn').click()
   ]);
   assert.match(download.suggestedFilename(),/Wheel_Calculator_Backup/);
   assert.match(await page.locator('#wheelAnnouncer').innerText(),/JSON-export|JSON export/);
   await page.reload();
   assert.equal(await page.locator('.workspace-item-button[data-item="hands"]').count(),1);
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 });
 await check('keyboard disclosures and landscape viewport allow access to all settings',async()=>{
  const {context,page,errors}=await newPage({width:844,height:390});
  try{
   await page.goto(origin+'/');
   const setSummary=page.locator('.setbar > .compact-manage summary');
   await setSummary.focus();
   await page.keyboard.press('Enter');
   assert.equal(await page.locator('#newSetBtn').isVisible(),true);
   await page.locator('#capSel').focus();
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'capSel');
   await page.selectOption('#capSel','125');
   await page.locator('#degreeInput').focus();
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'degreeInput');
   await page.locator('[data-workspace-go="items"]').click();
   await page.screenshot({path:join(shots,'public-landscape-844.png'),fullPage:true});
   const dims=await page.evaluate(()=>({window:innerWidth,page:document.documentElement.scrollWidth}));
   assert(dims.page-dims.window<=6,'no landscape page overflow '+JSON.stringify(dims));
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 });
 await check('two server profiles, separately named CAP sets and custom rules restore from JSON',async()=>{
  const source=await newPage({width:1200,height:800}),destination=await newPage({width:1200,height:800});
  try{
   await source.page.goto(origin+'/');
   await source.page.locator('.setbar > .compact-manage summary').click();
   source.page.once('dialog',dialog=>dialog.accept('Original 90 SET'));
   await source.page.locator('#newSetBtn').click();
   await source.page.waitForFunction(()=>[...document.querySelectorAll('#setPicker option')].some(o=>o.textContent.includes('Original 90 SET')));
   const oldSetId=await source.page.locator('#setPicker').inputValue();
   await source.page.locator('.serverbar > .compact-manage summary').click();
   source.page.once('dialog',dialog=>dialog.accept('Legends Realm'));
   await source.page.locator('#newServerBtn').click();
   await source.page.waitForFunction(()=>[...document.querySelectorAll('#serverPicker option')].some(o=>o.textContent.includes('Legends Realm')));
   await source.page.selectOption('#capSel','120');
   source.page.once('dialog',dialog=>dialog.accept('Legends 120 SET'));
   await source.page.locator('#newSetBtn').click();
   await source.page.locator('[data-tab="rules"]').click();
   await source.page.locator('[data-config="maxAR"]').fill('53');
   await source.page.locator('[data-config="maxAR"]').press('Tab');
   const [download]=await Promise.all([
    source.page.waitForEvent('download',{timeout:12000}),
    source.page.locator('#exportBtn').click()
   ]);
   const buffer=await readFile(await download.path());
   const backup=JSON.parse(buffer.toString('utf8'));
   assert.equal(backup.serverProfiles.entries.length,2);
   const sail=backup.serverProfiles.entries.find(e=>e.name==='Sailor Online');
   const realm=backup.serverProfiles.entries.find(e=>e.name==='Legends Realm');
   assert.ok(sail&&realm);
   assert(sail.data.setBank[90].entries.some(e=>e.id===oldSetId&&e.name==='Original 90 SET'));
   assert.equal(realm.data.cap,120);
   assert.equal(realm.data.cfg[120].maxAR,53);
   assert(realm.data.setBank[120].entries.some(e=>e.name==='Legends 120 SET'));
   await destination.page.goto(origin+'/');
   destination.page.on('dialog',dialog=>dialog.accept());
   await destination.page.locator('#importFile').setInputFiles({
    name:'multiserver.json',mimeType:'application/json',buffer
   });
   await destination.page.waitForFunction(()=>[...document.querySelectorAll('#serverPicker option')].length===2,{timeout:12000});
   assert.equal(await destination.page.locator('#capSel').inputValue(),'120');
   const savedNames=await destination.page.locator('#serverPicker option').allTextContents();
   assert(savedNames.includes('Sailor Online')&&savedNames.includes('Legends Realm'));
   const originalId=await destination.page.locator('#serverPicker option',{hasText:'Sailor Online'}).getAttribute('value');
   await destination.page.selectOption('#serverPicker',originalId);
   assert.equal(await destination.page.locator('#capSel').inputValue(),'90');
   assert((await destination.page.locator('#setPicker option').allTextContents()).includes('Original 90 SET'));
   const realmId=await destination.page.locator('#serverPicker option',{hasText:'Legends Realm'}).getAttribute('value');
   await destination.page.selectOption('#serverPicker',realmId);
   assert.equal(await destination.page.locator('#capSel').inputValue(),'120');
   await destination.page.locator('[data-tab="rules"]').click();
   assert.equal(await destination.page.locator('[data-config="maxAR"]').inputValue(),'53');
   assert.deepEqual(source.errors,[]);
   assert.deepEqual(destination.errors,[]);
  }finally{await source.context.close();await destination.context.close();}
 });



 await check('SET deletion preserves final SET, provides full backup and restores deleted set in clean browser',async()=>{
  const source=await newPage({width:1140,height:840}),fresh=await newPage({width:1140,height:840});
  try{
   const {page,errors}=source;
   await page.goto(origin+'/');
   await page.locator('.setbar > .compact-manage summary').click();
   assert.equal(await page.locator('#deleteSetBtn').isDisabled(),true);
   page.once('dialog',dialog=>dialog.accept('Disposable 90 CAP'));
   await page.locator('#newSetBtn').click();
   await page.waitForFunction(()=>document.querySelectorAll('#setPicker option').length===2);
   assert.equal(await page.locator('#deleteSetBtn').isEnabled(),true);
   await page.locator('#goalSel').fill('64');
   await page.locator('#goalSel').press('Tab');
   page.once('dialog',dialog=>dialog.dismiss());
   await page.locator('#deleteSetBtn').click();
   assert.equal(await page.locator('#setPicker option').count(),2);
   let question='';
   page.once('dialog',dialog=>{question=dialog.message();dialog.accept();});
   const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:16000}),
    page.locator('#deleteSetBtn').click()
   ]);
   assert.match(question,/Disposable 90 CAP/);
   assert.match(question,/ÖSSZES szerver és CAP/);
   assert.match(download.suggestedFilename(),/Set_Torles_Elotti_Mentes/);
   const bytes=await readFile(await download.path()),backup=JSON.parse(bytes.toString('utf8'));
   assert.equal(backup.serverProfiles.entries.length,1);
   assert.equal(backup.setBank[90].entries.length,2);
   assert(backup.setBank[90].entries.some(e=>e.name==='Disposable 90 CAP'));
   assert.equal(backup.goal,64);
   await page.waitForFunction(()=>document.querySelectorAll('#setPicker option').length===1);
   assert.equal(await page.locator('#deleteSetBtn').isDisabled(),true);
   await page.reload();
   assert.equal(await page.locator('#setPicker option').count(),1);
   await fresh.page.goto(origin+'/');
   fresh.page.on('dialog',dialog=>dialog.accept());
   await fresh.page.locator('#importFile').setInputFiles({
    name:'restore-deleted-set.json',mimeType:'application/json',buffer:bytes
   });
   await fresh.page.waitForFunction(()=>document.querySelectorAll('#setPicker option').length===2,null,{timeout:12000});
   assert((await fresh.page.locator('#setPicker option').allTextContents()).includes('Disposable 90 CAP'));
   assert.deepEqual(errors,[]);
   assert.deepEqual(fresh.errors,[]);
  }finally{await source.context.close();await fresh.context.close();}
 });
 await check('delete server is reversible with whole-profile JSON backup and cannot remove last server',async()=>{
  const own=await newPage({width:1180,height:850});
  const recovery=await newPage({width:1180,height:850});
  const {page,context,errors}=own;
  try{
   await page.goto(origin+'/');
   await page.locator('.serverbar > .compact-manage summary').click();
   assert.equal(await page.locator('#deleteServerBtn').isDisabled(),true);
   page.once('dialog',dialog=>dialog.accept('Rumlord Temporary'));
   await page.locator('#newServerBtn').click();
   await page.waitForFunction(()=>document.querySelectorAll('#serverPicker option').length===2);
   assert.equal(await page.locator('#deleteServerBtn').isEnabled(),true);
   await page.selectOption('#capSel','120');
   await page.locator('#goalSel').fill('68');
   await page.locator('#goalSel').press('Tab');
   await page.locator('.setbar > .compact-manage summary').click();
   page.once('dialog',dialog=>dialog.accept('Temporary 120 SET'));
   await page.locator('#newSetBtn').click();
   assert((await page.locator('#setPicker option').allTextContents()).includes('Temporary 120 SET'));
   page.once('dialog',dialog=>dialog.dismiss());
   await page.locator('#deleteServerBtn').click();
   assert.equal(await page.locator('#serverPicker option').count(),2,'canceled deletion preserves profiles');
   assert.equal(await page.locator('#capSel').inputValue(),'120');
   let question='';
   page.once('dialog',dialog=>{question=dialog.message();dialog.accept();});
   const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:16000}),
    page.locator('#deleteServerBtn').click()
   ]);
   assert.match(question,/Rumlord Temporary/);
   assert.match(question,/ÖSSZES szerverről JSON-mentés/);
   assert.match(download.suggestedFilename(),/Server_Torles_Elotti_Mentes/);
   const bytes=await readFile(await download.path());
   const backup=JSON.parse(bytes.toString('utf8'));
   assert.equal(backup.serverProfiles.entries.length,2,'whole-store backup covers both servers');
   const temp=backup.serverProfiles.entries.find(e=>e.name==='Rumlord Temporary');
   assert(temp,'deleted profile must be recoverable from backup');
   assert.equal(temp.data.cap,120);
   assert.equal(temp.data.goal,68);
   assert(temp.data.setBank[120].entries.some(e=>e.name==='Temporary 120 SET'));
   await page.waitForFunction(()=>document.querySelectorAll('#serverPicker option').length===1,null,{timeout:12000});
   assert.equal(await page.locator('#serverPicker option').innerText(),'Sailor Online');
   assert.equal(await page.locator('#capSel').inputValue(),'90');
   assert.equal(await page.locator('#deleteServerBtn').isDisabled(),true);
   await page.reload();
   assert.equal(await page.locator('#serverPicker option').count(),1);
   assert.equal(await page.locator('#capSel').inputValue(),'90');
   await recovery.page.goto(origin+'/');
   recovery.page.on('dialog',dialog=>dialog.accept());
   await recovery.page.locator('#importFile').setInputFiles({
    name:'restore-deleted-server.json',mimeType:'application/json',buffer:bytes
   });
   await recovery.page.waitForFunction(()=>document.querySelectorAll('#serverPicker option').length===2,null,{timeout:12000});
   assert.equal(await recovery.page.locator('#capSel').inputValue(),'120');
   assert((await recovery.page.locator('#setPicker option').allTextContents()).includes('Temporary 120 SET'));
   assert.deepEqual(errors,[]);
   assert.deepEqual(recovery.errors,[]);
  }finally{await context.close();await recovery.context.close();}
 });
 await check('JSON import previews profile, saves previous state, restores new data and rejects unsafe files',async()=>{
  const original=await newPage({width:1200,height:850});
  const replacement=await newPage({width:1200,height:850});
  try{
   await original.page.goto(origin+'/');
   await original.page.locator('#goalSel').fill('83');
   await original.page.locator('#goalSel').press('Tab');
   await replacement.page.goto(origin+'/');
   await replacement.page.locator('#goalSel').fill('42');
   await replacement.page.locator('#goalSel').press('Tab');
   const [sourceDownload]=await Promise.all([
    replacement.page.waitForEvent('download',{timeout:15000}),
    replacement.page.locator('#exportBtn').click()
   ]);
   const incoming=await readFile(await sourceDownload.path());
   assert.equal(JSON.parse(incoming.toString('utf8')).goal,42);
   const dialogs=[];
   original.page.on('dialog',dialog=>{
    dialogs.push({type:dialog.type(),message:dialog.message()});
    if(dialog.type()==='confirm')dialog.accept();else dialog.dismiss();
   });
   const [safetyDownload]=await Promise.all([
    original.page.waitForEvent('download',{timeout:15000}),
    original.page.locator('#importFile').setInputFiles({name:'restored-sets.json',mimeType:'application/json',buffer:incoming})
   ]);
   assert.match(safetyDownload.suggestedFilename(),/Import_Elotti_Mentes/);
   const safety=JSON.parse((await readFile(await safetyDownload.path())).toString('utf8'));
   assert.equal(safety.goal,83,'automatic rollback JSON contains previous value');
   assert.match(dialogs[0]?.message||'',/MENTÉS BETÖLTÉSE/);
   assert.match(dialogs[0]?.message||'',/Szerverprofilok: 1/);
   await original.page.waitForFunction(()=>document.querySelector('#goalSel')?.value==='42',null,{timeout:15000});
   await original.page.reload();
   assert.equal(await original.page.locator('#goalSel').inputValue(),'42');
   // A second, explicitly canceled import must leave the restored data unchanged.
   original.page.removeAllListeners('dialog');
   original.page.once('dialog',dialog=>dialog.dismiss());
   await original.page.locator('#importFile').setInputFiles({name:'canceled-import.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(safety))});
   assert.equal(await original.page.locator('#goalSel').inputValue(),'42');
   assert.deepEqual(original.errors,[]);
   assert.deepEqual(replacement.errors,[]);
  }finally{await original.context.close();await replacement.context.close();}
 });
 await check('public desktop loads and has no admin image inputs',async()=>{
  const {context,page,errors}=await newPage({width:1440,height:900});
  try{
   await page.goto(origin+'/publikus.html',{waitUntil:'load'});
   await page.waitForSelector('#root [data-workspace-go="items"]',{timeout:12000});
   assert.equal(await page.locator('#localIconZip').count(),0);
   assert.equal(await page.locator('[data-custom-icon]').count(),0);
   assert.equal(await page.locator('[data-icon-itemcode]').count(),0);
   assert.equal(await page.locator('#importFile[accept*="json"]').count(),1);
   assert.equal(await page.locator('#root [data-item="earring"]').count()>0,true);
   assert.deepEqual(errors,[],'no uncaught browser errors');
   await page.screenshot({path:join(shots,'public-desktop.png'),fullPage:true});
  }finally{await context.close();}
 });
 await check('public tabs switch and save a CAP in browser storage',async()=>{
  const {context,page,errors}=await newPage({width:1440,height:900});
  try{
   await page.goto(origin+'/publikus.html');
   await page.selectOption('#capSel','100');
   await page.waitForFunction(()=>document.querySelector('#capSel')?.value==='100');
   await page.locator('[data-workspace-go="balance"]').click();
   assert.equal(await page.locator('[data-workspace-pane="balance"]').getAttribute('hidden'),null);
   await page.locator('[data-workspace-go="items"]').click();
   await page.locator('[data-item="head"]').first().click();
   assert.equal(await page.locator('#root .item-editor-head').innerText().then(v=>v.toLowerCase().includes('head')),true);
   await page.reload();
   assert.equal(await page.locator('#capSel').inputValue(),'100');
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 });
 await check('public phone-width interaction, HU/EN and no horizontal overflow',async()=>{
  const {context,page,errors}=await newPage({width:390,height:844});
  try{
   await page.goto(origin+'/publikus.html');
   await page.locator('[data-workspace-go="analytics"]').click();
   assert.equal(await page.locator('[data-workspace-pane="analytics"]').getAttribute('hidden'),null);
   await page.locator('[data-workspace-go="items"]').click();
   await page.selectOption('#langSel','en');
   await page.locator('[data-workspace-go="planner"]').click();
   assert.equal(await page.locator('[data-workspace-pane="planner"]').getAttribute('hidden'),null);
   await page.screenshot({path:join(shots,'public-mobile-390.png'),fullPage:true});
   const widths=await page.evaluate(()=>({window:innerWidth,body:document.body.scrollWidth,root:document.documentElement.scrollWidth}));
   assert(widths.root-widths.window<=6,'horizontal overflow '+JSON.stringify(widths));
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 });

 await check('compact player layout keeps CAP at hand, expands SET/server actions and persists CAP',async()=>{
  const {context,page,errors}=await newPage({width:390,height:844});
  try{
   await page.goto(origin+'/publikus.html');
   assert.equal(await page.locator('.beta-caution').evaluate(el=>el.open),false);
   assert.equal(await page.locator('.serverbar > .compact-manage').evaluate(el=>el.open),false);
   assert.equal(await page.locator('.setbar > .compact-manage').evaluate(el=>el.open),false);
   assert.equal(await page.locator('#capSel').isVisible(),true);
   const dims=await page.locator('.controls').evaluate(el=>({height:el.getBoundingClientRect().height,
    scroll:el.scrollWidth,client:el.clientWidth}));
   assert(dims.height<105,'quick character settings should be one row '+JSON.stringify(dims));
   assert(dims.scroll>dims.client,'extra selectors should scroll inside the bar '+JSON.stringify(dims));
   await page.locator('.setbar > .compact-manage summary').click();
   assert.equal(await page.locator('#newSetBtn').isVisible(),true);
   assert.equal(await page.locator('#deleteSetBtn').isVisible(),true);
   await page.locator('.serverbar > .compact-manage summary').click();
   assert.equal(await page.locator('#newServerBtn').isVisible(),true);
   await page.locator('.beta-caution > summary').click();
   assert.match(await page.locator('.beta-caution').innerText(),/NYILVÁNOS WHEEL CALCULATOR/);
   await page.selectOption('#capSel','110');
   await page.reload();
   assert.equal(await page.locator('#capSel').inputValue(),'110');
   await page.selectOption('#langSel','en');
   assert.match(await page.locator('.beta-caution summary').innerText(),/BETA/);
   assert.match(await page.locator('.setbar > .compact-manage summary').innerText(),/Manage sets/);
   const widths=await page.evaluate(()=>({win:innerWidth,page:document.documentElement.scrollWidth}));
   assert(widths.page-widths.win<=6,'no global horizontal overflow '+JSON.stringify(widths));
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 });
 await check('public JSON export restores own SET and target in a clean browser',async()=>{
  const source=await newPage({width:1200,height:800});
  const destination=await newPage({width:1200,height:800});
  try{
   await source.page.goto(origin+'/publikus.html');
   await source.page.locator('#goalSel').fill('81');
   await source.page.locator('#goalSel').dispatchEvent('change');
   const [download]=await Promise.all([
    source.page.waitForEvent('download',{timeout:12000}),
    source.page.locator('#exportBtn').click()
   ]);
   const buffer=await readFile(await download.path());
   const snapshot=JSON.parse(buffer.toString('utf8'));
   assert.equal(typeof snapshot,'object');
   await destination.page.goto(origin+'/publikus.html');
   destination.page.on('dialog',dialog=>dialog.accept());
   await destination.page.locator('#importFile').setInputFiles({
    name:'wheel-backup.json',mimeType:'application/json',buffer
   });
   await destination.page.waitForFunction(()=>document.querySelector('#goalSel')?.value==='81',null,{timeout:12000});
   assert.equal(await destination.page.locator('#goalSel').inputValue(),'81');
   assert.deepEqual(source.errors,[]);
   assert.deepEqual(destination.errors,[]);
  }finally{await source.context.close();await destination.context.close();}
 });
 await check('public chance planner and rules pages render without browser errors',async()=>{
  const {context,page,errors}=await newPage({width:1200,height:850});
  try{
   await page.goto(origin+'/publikus.html');
   await page.locator('[data-tab="chance"]').click();
   await page.waitForSelector('#root [data-wheel-stage="fate"]');
   await page.locator('[data-wheel-stage="fortune"]').click();
   await page.waitForSelector('#root [data-wheel-stage="pen"]');
   await page.locator('[data-tab="rules"]').click();
   await page.waitForSelector('#root');
   assert.match(await page.locator('#root').innerText(),/90 CAP/i);
   await page.locator('[data-tab="help"]').click();
   assert.equal((await page.locator('#root').innerText()).length>150,true);
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 });

 await check('manual Blue max is preserved across CAP-default change, reload and JSON import',async()=>{
  const source=await newPage({width:1200,height:850}),target=await newPage({width:1200,height:850});
  const readState=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('sailor-wheel-calculator-v4')));
  try{
   await source.page.goto(origin+'/publikus.html');
   await source.page.locator('[data-workspace-go="items"]').click();
   await source.page.locator('[data-item="head"]').first().click();
   await source.page.locator('[data-item-field="count"]').fill('1');
   await source.page.locator('[data-item-field="count"]').press('Tab');
   await source.page.locator('[data-row-type="0"]').selectOption('HP');
   await source.page.locator('[data-row-value="0"]').fill('300');
   await source.page.locator('[data-row-value="0"]').press('Tab');
   const modelInput=source.page.locator('[data-row-model-max="0"]');
   assert.equal(await modelInput.inputValue(),'','inherited max is displayed only as a placeholder');
   await modelInput.fill('600');
   await modelInput.press('Tab');
   assert.equal((await readState(source.page)).sets[90].head.rows[0].modelMax,600);
   await source.page.locator('[data-tab="rules"]').click();
   const capMax=source.page.locator('[data-config="maxHP"]');
   await capMax.fill('900');
   await capMax.press('Tab');
   await source.page.reload();
   const old=await readState(source.page);
   assert.equal(old.cfg[90].maxHP,900);
   assert.equal(old.sets[90].head.rows[0].modelMax,600);
   await source.page.locator('[data-tab="set"]').click();
   await source.page.locator('[data-workspace-go="items"]').click();
   await source.page.locator('[data-item="head"]').first().click();
   assert.equal(await source.page.locator('[data-row-model-max="0"]').inputValue(),'600');
   assert.match(await source.page.locator('[data-row-model-max="0"]').getAttribute('class'),/is-manual/);
   const [download]=await Promise.all([
    source.page.waitForEvent('download',{timeout:12000}),
    source.page.locator('#exportBtn').click()
   ]);
   const buffer=await readFile(await download.path());
   await target.page.goto(origin+'/publikus.html');
   target.page.on('dialog',dialog=>dialog.accept());
   await target.page.locator('#importFile').setInputFiles({
    name:'silkroad-manual-max.json',mimeType:'application/json',buffer
   });
   await target.page.waitForFunction(()=>{
    const data=JSON.parse(localStorage.getItem('sailor-wheel-calculator-v4')||'{}');
    return data?.cfg?.[90]?.maxHP===900&&data?.sets?.[90]?.head?.rows?.[0]?.modelMax===600;
   },null,{timeout:12000});
   const imported=await readState(target.page);
   assert.equal(imported.sets[90].head.rows[0].value,300);
   assert.deepEqual(source.errors,[]);
   assert.deepEqual(target.errors,[]);
  }finally{await source.context.close();await target.context.close();}
 });
 await check('developer preview imports private art and remembers it after reload',async()=>{
  const {context,page,errors}=await newPage({width:1440,height:900});
  try{
   await page.goto(developerOrigin+'/index.html');
   await page.waitForSelector('#root');
   await page.locator('#localIconZip').setInputFiles({name:'test-local-icons.zip',mimeType:'application/zip',buffer:syntheticPack()});
   await page.waitForFunction(()=>document.querySelector('#root')?.textContent?.includes('1 jelölt'),{timeout:16000});
   await page.waitForSelector('#root [data-icon-source="local-auto"]',{timeout:12000});
   await page.reload();
   await page.waitForSelector('#root [data-icon-source="local-auto"]',{timeout:12000});
   assert.deepEqual(errors,[]);
   await page.screenshot({path:join(shots,'private-zip-auto-icons.png'),fullPage:true});
  }finally{await context.close();}
 });
}finally{if(browser)await browser.close();await Promise.all([new Promise(ok=>server.close(ok)),new Promise(ok=>developerServer.close(ok))]);}
process.stdout.write(results.join('\n')+'\n');
if(failures){process.stderr.write(failures+' browser QA scenario(s) FAILED\n');process.exitCode=1;}
