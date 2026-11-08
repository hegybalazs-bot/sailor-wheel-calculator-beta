'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs');
const {build}=require('../tools/build-public.cjs');
test('production public build contains only allowlisted files and excludes admin preview',()=>{
 const files=build(),dist=path.join(__dirname,'..','dist-public');
 assert.deepEqual(files,[
  'assets/icons/local-pack.js','assets/icons/manifest.js',
  'index.html','publikus.html','visszajelzes.html'
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
 assert.equal(fs.readFileSync(path.join(dist,'index.html'),'utf8'),
  fs.readFileSync(path.join(dist,'publikus.html'),'utf8'));
});
