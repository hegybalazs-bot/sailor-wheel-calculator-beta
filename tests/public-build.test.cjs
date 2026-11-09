'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs');
const {build,buildCommit}=require('../tools/build-public.cjs');
test('production public build contains only allowlisted files and excludes admin preview',()=>{
 const files=build(),dist=path.join(__dirname,'..','dist-public');
 assert.deepEqual(files,[
  'assets/icons/local-pack.js','assets/icons/manifest.js',
  'ikon-helyreallitas.html','index.html','publikus.html','visszajelzes.html'
 ]);
 const index=fs.readFileSync(path.join(dist,'index.html'),'utf8');
 assert.match(index,/EMERALD · PUBLIC/);
 const sha=buildCommit();
 const expected=sha?sha:'unavailable';
 assert.match(index,/id="buildVersion" data-build-commit="(?:[a-f0-9]{40}|unavailable)"/);
 assert.match(index,new RegExp('data-build-commit="'+expected+'"'));
 assert.match(index,new RegExp('Build: '+(sha?sha.slice(0,8):'ismeretlen')));

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

test('build version is pinned to Render Git SHA when present, with no secret input',()=>{
 const valid='0123456789abcdef0123456789abcdef01234567';
 assert.equal(buildCommit({RENDER_GIT_COMMIT:valid.toUpperCase()}),valid);
 assert.equal(buildCommit({RENDER_GIT_COMMIT:''}),buildCommit());
 const raw=fs.readFileSync(path.join(__dirname,'..','publikus.html'),'utf8');
 assert.match(raw,/id="buildVersion" data-build-commit="unavailable"/);
 const built=fs.readFileSync(path.join(__dirname,'..','dist-public','index.html'),'utf8');
 assert.doesNotMatch(built,/RENDER_GIT_COMMIT|PRIVATE_PREVIEW_PASSWORD|deploy-hook-key/);
});
