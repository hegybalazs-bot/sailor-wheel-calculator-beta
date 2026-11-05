'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {buildLibrary}=require('../tools/prepare-icon-library.cjs');

function sandbox(){
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'sro-icons-'));
 const input=path.join(base,'extract'),output=path.join(base,'generated');
 fs.mkdirSync(path.join(input,'sprites','equipment'),{recursive:true});
 fs.mkdirSync(path.join(input,'sprites','wheel'),{recursive:true});
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAA=','base64');
 fs.writeFileSync(path.join(input,'sprites','equipment','sample.png'),png);
 fs.writeFileSync(path.join(input,'sprites','wheel','wheel.png'),png);
 return {base,input,output,
  write(icons){fs.writeFileSync(path.join(input,'manifest.json'),JSON.stringify({schemaVersion:1,icons},null,2));},
  clean(){fs.rmSync(base,{force:true,recursive:true});}
 };
}
function item(extra={}){
 return {
  category:'equipment',matchStatus:'verified',reviewStatus:'approved',matchEvidence:['Client icon mapping verified'],
  assetPath:'sprites/equipment/sample.png',region:'chinese',equipmentType:'garment',
  slot:'chest',degree:9,grade:'normal',itemCode:'ITEM_CH_M_GARMENT_09',...extra
 };
}
function readLibrary(output){
 const text=fs.readFileSync(path.join(output,'assets','icons','manifest.js'),'utf8');
 return JSON.parse(text.match(/window\.WHEEL_ICON_ASSETS_V1 = ([\s\S]*?);\n/)?.[1]||'null');
}
test('preparer emits local verified equipment images with matching source identifiers',()=>{
 const box=sandbox();
 try{
  box.write([item(),{...item({matchStatus:'candidate',itemCode:'OTHER'}),assetPath:'sprites/equipment/sample.png'}]);
  const report=buildLibrary(box.input,box.output);
  assert.equal(report.approved,1);
  assert.equal(report.unverifiedCandidates,1);
  const [a]=readLibrary(box.output);
  assert.equal(a.category,'equipment');
  assert.equal(a.region,'ch');
  assert.equal(a.grade,'Normal');
  assert.equal(a.itemCode,'ITEM_CH_M_GARMENT_09');
  assert.match(a.path,/^assets\/icons\/equipment\/[a-f0-9]{24}\.png$/);
  assert.ok(fs.existsSync(path.join(box.output,...a.path.split('/'))));
 }finally{box.clean();}
});

test('preparer ignores unmatched and not-yet-human-reviewed images',()=>{
 const box=sandbox();
 try{
  box.write([item({matchStatus:'candidate'}),item({reviewStatus:'pending',itemCode:'SECOND'})]);
  const report=buildLibrary(box.input,box.output);
  assert.equal(report.approved,0);
  assert.equal(report.unverifiedCandidates,1);
  assert.equal(report.awaitingHumanReview,1);
  assert.deepEqual(readLibrary(box.output),[]);
 }finally{box.clean();}
});

test('preparer refuses path traversal and does not generate a manifest on failure',()=>{
 const box=sandbox();
 try{
  box.write([item({assetPath:'../secret.png'})]);
  assert.throws(()=>buildLibrary(box.input,box.output),/invalid approved icon mappings/);
  const report=JSON.parse(fs.readFileSync(path.join(box.output,'report.json')));
  assert.equal(report.rejected,1);
  assert.match(report.issues[0],/unsafe or unsupported asset path/);
  assert.equal(fs.existsSync(path.join(box.output,'assets','icons','manifest.js')),false);
 }finally{box.clean();}
});

test('preparer refuses an ambiguous duplicate mapping',()=>{
 const box=sandbox();
 try{
  box.write([item(),item()]);
  assert.throws(()=>buildLibrary(box.input,box.output),/invalid approved icon mappings/);
  const report=JSON.parse(fs.readFileSync(path.join(box.output,'report.json')));
  assert.match(report.issues.join(' '),/duplicate/);
 }finally{box.clean();}
});

test('preparer refuses forged PNG signatures and wrong asset hashes',()=>{
 const box=sandbox();
 try{
  fs.writeFileSync(path.join(box.input,'sprites','equipment','sample.png'),'not an image');
  box.write([item()]);
  assert.throws(()=>buildLibrary(box.input,box.output),/invalid approved icon mappings/);
 }finally{box.clean();}
 const other=sandbox();
 try{
  other.write([item({assetSha256:'0'.repeat(64)})]);
  assert.throws(()=>buildLibrary(other.input,other.output),/invalid approved icon mappings/);
 }finally{other.clean();}
});

test('preparer supports independently verified Wheel and Feather Pen assets',()=>{
 const box=sandbox();
 try{
  box.write([
   {category:'wheel',role:'wheel_of_fortune',matchStatus:'verified',reviewStatus:'approved',
    matchEvidence:['Confirmed source link'],assetPath:'sprites/wheel/wheel.png'},
   {category:'wheel',role:'feather_pen',matchStatus:'verified',reviewStatus:'approved',
    matchEvidence:['Confirmed source link'],assetPath:'sprites/wheel/wheel.png'}
  ]);
  const report=buildLibrary(box.input,box.output);
  assert.equal(report.approved,2);
  const icons=readLibrary(box.output);
  assert.deepEqual(icons.map(x=>x.role),['wheel_of_fortune','feather_pen']);
 }finally{box.clean();}
});
