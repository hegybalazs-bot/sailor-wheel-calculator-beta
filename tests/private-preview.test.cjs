'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {once}=require('node:events');
const {createPrivatePreviewServer,credentialsValid,ALLOWED}=require('../server/private-preview.cjs');

const user='wheel-owner',password='ExampleTestPassword-ChangeMe-2026!';
function auth(u=user,p=password){
 return 'Basic '+Buffer.from(u+':'+p,'utf8').toString('base64');
}
async function withServer(fn){
 const server=createPrivatePreviewServer({user,password});
 server.listen(0,'127.0.0.1');
 await once(server,'listening');
 try{return await fn('http://127.0.0.1:'+server.address().port);}
 finally{await new Promise(resolve=>server.close(resolve));}
}
test('protected preview never starts with missing/weak credentials',()=>{
 for(const x of [
  {},{user:'ok',password},{user,password:'weak'},
  {user:'a bad user',password},{user:'x',password}
 ]) assert.throws(()=>createPrivatePreviewServer(x),/strong|needs/);
 assert.equal(credentialsValid(auth(),user,password),true);
 assert.equal(credentialsValid(auth('someone'),user,password),false);
 assert.equal(credentialsValid(auth(user,'not-it'),user,password),false);
 assert.equal(credentialsValid('Bearer fake',user,password),false);
 assert.equal(ALLOWED.has('/data/release-evidence.json'),false);
});
test('protected site requires valid credentials on every asset and preview page',async()=>{
 await withServer(async base=>{
  for(const uri of ['/','/index.html','/bemutato.html','/assets/icons/manifest.js']){
   const no=await fetch(base+uri);
   assert.equal(no.status,401,uri);
   assert.match(no.headers.get('www-authenticate'),/Basic realm="Wheel Developer"/);
   const bad=await fetch(base+uri,{headers:{Authorization:auth(user,'WRONG')}});
   assert.equal(bad.status,401,uri);
   const ok=await fetch(base+uri,{headers:{Authorization:auth()}});
   assert.equal(ok.status,200,uri);
   assert.equal(ok.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
   assert.equal(ok.headers.get('cache-control'),'no-store, max-age=0');
   assert.equal(ok.headers.get('x-frame-options'),'DENY');
  }
  const index=await fetch(base+'/',{headers:{Authorization:auth()}});
  assert.match(await index.text(),/ADMIN PREVIEW/);
 });
});
test('health status cannot bypass authentication, and internal source files never served',async()=>{
 await withServer(async base=>{
  const health=await fetch(base+'/__health');
  assert.equal(health.status,200);assert.equal(await health.text(),'ready');
  const forbidden=[
   '/README.md','/server/private-preview.cjs','/tests/wheel.test.cjs',
   '/data/release-evidence.json','/.github/workflows/wheel-tests.yml',
   '/tools/release-gate.cjs','/docs/ROADMAP_V5.md',
   '/%2e%2e%2fREADME.md','/assets/icons/a-game.png','/nope.html'
  ];
  for(const uri of forbidden){
   const response=await fetch(base+uri,{headers:{Authorization:auth()}});
   assert.equal(response.status,404,uri);
  }
  const post=await fetch(base+'/index.html',{method:'POST',headers:{Authorization:auth()}});
  assert.equal(post.status,405);
  const head=await fetch(base+'/index.html',{method:'HEAD',headers:{Authorization:auth()}});
  assert.equal(head.status,200);assert.equal(await head.text(),'');
 });
});
