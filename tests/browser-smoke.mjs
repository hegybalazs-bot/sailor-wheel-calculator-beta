/* Chromium desktop/mobile-viewport smoke tests, run separately from no-dependency Node unit tests.
 * No network or game-client integration. Captures screenshots for human QA.
 */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root=resolve('.'),shots=join(root,'artifacts','browser');
await mkdir(shots,{recursive:true});
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.json':'application/json;charset=utf-8','.css':'text/css;charset=utf-8'};
const server=createServer(async(req,res)=>{
 let p;
 try{
  const url=new URL(req.url||'/', 'http://127.0.0.1'),decoded=decodeURIComponent(url.pathname);
  p=resolve(root,'.'+(decoded==='/'?'/publikus.html':decoded));
  if(!(p===root||p.startsWith(root+'/')))throw Error('forbidden');
  const body=await readFile(p);
  res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream',
   'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(body);
 }catch(_){res.writeHead(404);res.end('Not found');}
});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
const origin='http://127.0.0.1:'+server.address().port;
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
 await check('developer preview imports private art and remembers it after reload',async()=>{
  const {context,page,errors}=await newPage({width:1440,height:900});
  try{
   await page.goto(origin+'/index.html');
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
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
process.stdout.write(results.join('\n')+'\n');
if(failures){process.stderr.write(failures+' browser QA scenario(s) FAILED\n');process.exitCode=1;}
