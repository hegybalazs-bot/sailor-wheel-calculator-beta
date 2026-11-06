'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const js=fs.readFileSync(path.join(__dirname,'..','assets','icons','local-pack.js'),'utf8');
function crc32(data){
 let crc=0xffffffff;
 for(const b of data){crc^=b;for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return (crc^0xffffffff)>>>0;
}
function zipStored(entries){
 const locals=[],centrals=[];let offset=0;
 for(const [name,source] of entries){
  const data=Buffer.isBuffer(source)?source:Buffer.from(source),n=Buffer.from(name);
  const crc=crc32(data);
  const local=Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);
  local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);
  local.writeUInt16LE(n.length,26);
  const c=Buffer.alloc(46);
  c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);
  c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);
  c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);
  locals.push(local,n,data);centrals.push(c,n);
  offset+=local.length+n.length+data.length;
 }
 const cd=Buffer.concat(centrals),end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);
 end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,cd,end]);
}
function mock(){
 const urls=[];
 const window={crypto:crypto.webcrypto,
  URL:{createObjectURL:(x)=>{urls.push(x);return 'blob:local-icon-'+urls.length;},revokeObjectURL:()=>{}},
  indexedDB:null};
 const box={window,TextDecoder,Blob,Uint8Array,ArrayBuffer,DataView,Map,Promise,Error};
 vm.createContext(box);vm.runInContext(js,box,{timeout:5000});
 return {api:window.WHEEL_LOCAL_PACK,urls};
}
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j9ioAAAAASUVORK5CYII=','base64');
const sha=crypto.createHash('sha256').update(image).digest('hex');
const name='sprites/'+sha.slice(0,20)+'.png';
function icon(){
 return {category:'equipment',region:'ch',equipmentType:'jewelry',slot:'earring',
 degree:9,gender:null,weaponType:null,grade:null,assetPath:name,assetSha256:sha,
 sourcePath:'icon/item/china/acc/earring_09.ddj',
 itemCodes:['ITEM_CH_EARRING_09_A'],
 matchStatus:'candidate',reviewStatus:'pending'};
}
function packageWith(modify=x=>x){
 const m=modify({schemaVersion:1,packType:'wheel-browser-local-review',status:'unverified-candidates',
  icons:[icon(),{category:'wheel_candidate',role:null,sourcePath:'shared_coupon.ddj'}]});
 return zipStored([['manifest.json',JSON.stringify(m)],[name,image]]);
}
test('private local icon loader verifies a stored browser ZIP, keeps candidate status',async()=>{
 const {api,urls}=mock(),result=await api.importBuffer(packageWith());
 assert.equal(result.ready,true);assert.equal(result.count,1);assert.equal(result.images,1);
 assert.equal(result.persisted,false,'no IndexedDB provided by this mock');
 const matches=api.candidates({region:'ch',equipmentType:'jewelry',slot:'earring',degree:9,weaponType:null});
 assert.equal(matches.length,1);assert.equal(matches[0].reviewStatus,'pending');
 assert.equal(matches[0].matchStatus,'candidate');
 assert.equal(api.iconURL(sha),'blob:local-icon-1');assert.equal(urls.length,1);
 assert.equal(api.iconURL(sha),'blob:local-icon-1','previews use cached local URL');
 assert.equal(api.iconURL('wrong'),null);
 await api.clear();
 assert.equal(api.summary().ready,false);assert.equal(api.iconURL(sha),null);
});
test('local icon matching never guesses mismatched region, slot, degree or item code',async()=>{
 const {api}=mock();await api.importBuffer(packageWith());
 const known={region:'ch',equipmentType:'jewelry',slot:'earring',degree:9,weaponType:null};
 for(const change of [
  {region:'eu'},{equipmentType:'weapon'},{slot:'ring'},
  {degree:10},{itemCode:'ITEM_CH_EARRING_09_B'}
 ])assert.equal(api.candidates({...known,...change}).length,0,JSON.stringify(change));
 assert.equal(api.candidates({...known,itemCode:'ITEM_CH_EARRING_09_A'}).length,1);
});
test('browser importer rejects traversal, compressed entries and tampered checksum',()=>{
 const {api}=mock();
 const illegal=zipStored([['../manifest.json','{}']]);
 assert.throws(()=>api.extractStoredZip(illegal),/Unsafe or duplicate/);
 const unsupported=packageWith();
 unsupported.writeUInt16LE(8,8);
 assert.throws(()=>api.extractStoredZip(unsupported),/uncompressed browser icon ZIP/);
 const damaged=packageWith(),loc=damaged.indexOf('earring_09');
 assert.ok(loc>=0);damaged[loc]=0x7a;
 assert.throws(()=>api.extractStoredZip(damaged),/checksum/);
});
test('browser importer rejects invalid image hashes, unverified role injection and metadata',async()=>{
 const {api}=mock();
 await assert.rejects(api.importBuffer(packageWith(m=>{
  m.icons[0].assetSha256='0'.repeat(64);return m;
 })),/PNG SHA-256 mismatch/);
 await assert.rejects(api.importBuffer(packageWith(m=>{
  m.icons[0].reviewStatus='approved';return m;
 })),/Invalid icon candidate metadata/);
 await assert.rejects(api.importBuffer(packageWith(m=>{
  m.icons[0].assetPath='../evil.png';return m;
 })),/Invalid icon candidate metadata/);
 await assert.rejects(api.importBuffer(packageWith(m=>{
  m.packType='untrusted-network-pack';return m;
 })),/supported local Sailor review pack/);
 assert.equal(api.summary().ready,false,'failed import must not replace the current gallery');
});
test('browser importer is strictly file-local and cannot fetch client or server data',()=>{
 assert.doesNotMatch(js,/\b(?:fetch|WebSocket|XMLHttpRequest|EventSource|RTCPeerConnection)\s*\(/);
 assert.doesNotMatch(js,/phBot|sbot|game packet|client hook/i);
 assert.match(js,/indexedDB/);assert.match(js,/SHA-256/);
});
