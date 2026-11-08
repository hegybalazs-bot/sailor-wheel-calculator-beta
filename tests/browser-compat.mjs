/* Genuine Playwright Firefox and WebKit smoke checks against the same public-only
 * dist-public build served through HTTP. This is not a physical Android or iOS test. */
import {firefox,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve,join,extname} from 'node:path';
import assert from 'node:assert/strict';

const require=createRequire(import.meta.url);
const {build}=require('../tools/build-public.cjs');
build();
const dist=resolve('dist-public');
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url||'/','http://127.0.0.1');
  const decoded=decodeURIComponent(url.pathname),local=decoded==='/'?'/index.html':decoded;
  const file=resolve(dist,'.'+local);
  if(!file.startsWith(dist+'/'))throw Error('path traversal');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(data);
 }catch(_){res.writeHead(404);res.end('Not found');}
});
await new Promise((done,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',done);});
const base='http://127.0.0.1:'+server.address().port;
let failures=0;
async function check(name,fn){
 try{await fn();console.log('PASS '+name);}
 catch(err){failures++;console.error('FAIL '+name+'\n'+(err.stack||err));}
}
try{
 for(const [engine,driver] of [['Firefox',firefox],['WebKit',webkit]]){
  let browser;
  try{browser=await driver.launch({headless:true});}
  catch(err){failures++;console.error('FAIL '+engine+' browser launch: '+err);continue;}
  try{
   await check(engine+' mobile player CAP, EN/HU switch and reload',async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-US',acceptDownloads:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try{
     const response=await page.goto(base+'/');
     assert.equal(response.status(),200);
     await page.waitForSelector('#root [data-workspace-go="items"]',{timeout:20000});
     assert.equal(await page.locator('#localIconZip').count(),0);
     assert.equal(await page.locator('#iconPack').count(),0);
     await page.selectOption('#capSel','140');
     await page.selectOption('#langSel','en');
     assert.match(await page.locator('.beta-caution summary').innerText(),/BETA/);
     await page.locator('[data-workspace-go="analytics"]').click();
     assert.equal(await page.locator('[data-workspace-pane="analytics"]').getAttribute('hidden'),null);
     await page.reload();
     assert.equal(await page.locator('#capSel').inputValue(),'140');
     assert.equal(await page.locator('#langSel').inputValue(),'en');
     const dims=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth}));
     assert(dims.doc-dims.width<=6,'mobile overflow '+JSON.stringify(dims));
     await page.selectOption('#langSel','hu');
     assert.equal(await page.locator('#langSel').inputValue(),'hu');
     assert.deepEqual(errors,[]);
    }finally{await context.close();}
   });
   await check(engine+' JSON backup export, pre-import safety copy and clean-browser restore',async()=>{
    const source=await browser.newContext({viewport:{width:1200,height:800},acceptDownloads:true});
    const target=await browser.newContext({viewport:{width:1200,height:800},acceptDownloads:true});
    const src=await source.newPage(),dst=await target.newPage(),errors=[];
    src.on('pageerror',e=>errors.push(e.message));
    dst.on('pageerror',e=>errors.push(e.message));
    try{
     await src.goto(base+'/');
     await src.selectOption('#capSel','130');
     await src.locator('#goalSel').fill('71');
     await src.locator('#goalSel').press('Tab');
     const [exported]=await Promise.all([
      src.waitForEvent('download',{timeout:16000}),src.locator('#exportBtn').click()
     ]);
     const bytes=await readFile(await exported.path());
     const parsed=JSON.parse(bytes.toString('utf8'));
     assert.equal(parsed.cap,130);
     assert.equal(parsed.goal,71);
     await dst.goto(base+'/');
     dst.on('dialog',dialog=>dialog.accept());
     const [oldBackup]=await Promise.all([
      dst.waitForEvent('download',{timeout:16000}),
      dst.locator('#importFile').setInputFiles({name:'safe-cross-engine.json',mimeType:'application/json',buffer:bytes})
     ]);
     assert.match(oldBackup.suggestedFilename(),/Import_Elotti_Mentes/);
     const previous=JSON.parse((await readFile(await oldBackup.path())).toString('utf8'));
     assert.equal(previous.cap,90);
     await dst.waitForFunction(()=>document.querySelector('#capSel')?.value==='130',null,{timeout:16000});
     assert.equal(await dst.locator('#goalSel').inputValue(),'71');
     await dst.reload();
     assert.equal(await dst.locator('#capSel').inputValue(),'130');
     assert.deepEqual(errors,[]);
    }finally{await source.close();await target.close();}
   });
  }finally{await browser.close();}
 }
}finally{await new Promise(ok=>server.close(ok));}
if(failures){console.error('Cross-engine smoke FAIL: '+failures+' scenario(s)');process.exitCode=1;}
else console.log('Cross-engine smoke PASS: Firefox and WebKit scenarios');
