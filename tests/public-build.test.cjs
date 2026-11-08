'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs');
const {build}=require('../tools/build-public.cjs');
test('production public build contains only allowlisted files and excludes admin preview',()=>{
 const files=build(),dist=path.join(__dirname,'..','dist-public');
 assert.deepEqual(files,[
  'assets/icons/local-pack.js','assets/icons/manifest.js',
  'ikon-helyreallitas.html','index.html','publikus.html','visszajelzes.html'
 ]);
 const index=fs.readFileSync(path.join(dist,'index.html'),'utf8');
 assert.match(index,/EMERALD · PUBLIC/);
 assert.doesNotMatch(index,/ADMIN PREVIEW|Admin Demo|<input[^>]+accept="\.zip/);
 assert.doesNotMatch(index,/id="localIconZip"|data-custom-icon="/);
 assert.equal(fs.existsSync(path.join(dist,'bemutato.html')),false);
 assert.equal(fs.existsSync(path.join(dist,'README.md')),false);
 assert.equal(fs.existsSync(path.join(dist,'tests')),false);
 assert.equal(fs.existsSync(path.join(dist,'data')),false);
 assert.equal(fs.existsSync(path.join(dist,'index.html')),true);
 const recovery=fs.readFileSync(path.join(dist,'ikon-helyreallitas.html'),'utf8');
 assert.match(recovery,/id="iconPack" type="file" accept="\.zip,application\/zip"/);
 assert.match(recovery,/WHEEL_LOCAL_PACK\.importFile/);
 assert.match(recovery,/WHEEL_LOCAL_PACK\.restore/);
 assert.match(recovery,/connect-src 'none'/);
 assert.doesNotMatch(recovery,/data-custom-icon=|ADMIN PREVIEW/);
 assert.match(index,/href="ikon-helyreallitas\.html"/);
 assert.equal(fs.readFileSync(path.join(dist,'index.html'),'utf8'),
  fs.readFileSync(path.join(dist,'publikus.html'),'utf8'));
});
