/* Wheel Calculator local-only Sailor icon pack. No network or game-client access.
 * A browser-import ZIP must contain STORED (not DEFLATED) manifest.json + PNG sprites.
 * Gameplay-referenced images remain user-provided, candidate/unverified, never hosted.
 */
(function(g){
'use strict';
const MAX_PACK=12*1024*1024,MAX_ENTRIES=2000,MAX_ICON=512*1024;
const MAX_TOTAL=12*1024*1024,MAX_MANIFEST=1024*1024;
const PNG='89504e470d0a1a0a',IMAGE_PATH=/^sprites\/[a-f0-9]{20}\.png$/;
const SHA=/^[a-f0-9]{64}$/;
const DB_NAME='wheel-local-icon-pack-v1',STORE='packs',KEY='sailor-user-pack';
let state={icons:[],images:new Map(),urls:new Map(),status:'empty'};
function fail(message){throw new Error(message);}
function crc32(bytes){
 let crc=0xffffffff;
 for(const byte of bytes){
  crc^=byte;
  for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
 }
 return (crc^0xffffffff)>>>0;
}
function extractStoredZip(source){
 const bytes=source instanceof ArrayBuffer?new Uint8Array(source):
  (ArrayBuffer.isView(source)?new Uint8Array(source.buffer,source.byteOffset,source.byteLength):null);
 if(!bytes||bytes.length<22||bytes.length>MAX_PACK)fail('Invalid or oversized icon ZIP.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const need=(o,n)=>{if(!Number.isSafeInteger(o)||o<0||o+n>bytes.length)fail('Truncated ZIP entry.');};
 const u16=o=>{need(o,2);return view.getUint16(o,true);};
 const u32=o=>{need(o,4);return view.getUint32(o,true);};
 let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-22-65535);i--)
  if(u32(i)===0x06054b50&&i+22+u16(i+20)===bytes.length){end=i;break;}
 if(end<0)fail('Missing ZIP directory.');
 if(u16(end+4)!==0||u16(end+6)!==0)fail('Multi-volume ZIP is unsupported.');
 const count=u16(end+10),total=u16(end+8),dirBytes=u32(end+12),start=u32(end+16);
 if(!count||count!==total||count>MAX_ENTRIES||start+dirBytes>end)fail('Invalid ZIP directory.');
 const decoder=new TextDecoder('utf-8',{fatal:true}),files=new Map();
 let pos=start,sum=0;
 for(let n=0;n<count;n++){
  need(pos,46);
  if(u32(pos)!==0x02014b50)fail('Invalid ZIP central directory.');
  const flags=u16(pos+8),method=u16(pos+10),crc=u32(pos+16);
  const compressed=u32(pos+20),uncompressed=u32(pos+24);
  const nameLength=u16(pos+28),extra=u16(pos+30),comment=u16(pos+32),local=u32(pos+42);
  need(pos+46,nameLength+extra+comment);
  const name=decoder.decode(bytes.subarray(pos+46,pos+46+nameLength));
  if(!((name==='manifest.json')||(IMAGE_PATH.test(name)))||files.has(name))fail('Unsafe or duplicate ZIP filename.');
  if((flags&1)!==0||method!==0||compressed!==uncompressed||uncompressed>MAX_ICON&&name!=='manifest.json'||
   (name==='manifest.json'&&uncompressed>MAX_MANIFEST))fail('Use the generated uncompressed browser icon ZIP.');
  sum+=uncompressed;if(sum>MAX_TOTAL)fail('Icon pack exceeds memory limit.');
  need(local,30);
  if(u32(local)!==0x04034b50)fail('Broken ZIP local header.');
  if(u16(local+8)!==method||u16(local+6)!==flags)fail('Use the generated uncompressed browser icon ZIP.');
  const localNameLength=u16(local+26),localExtra=u16(local+28);
  need(local+30,localNameLength+localExtra+compressed);
  if(decoder.decode(bytes.subarray(local+30,local+30+localNameLength))!==name)fail('ZIP filename mismatch.');
  const fileStart=local+30+localNameLength+localExtra;
  const data=bytes.slice(fileStart,fileStart+compressed);
  if(crc32(data)!==crc)fail('ZIP checksum mismatch.');
  files.set(name,data);
  pos+=46+nameLength+extra+comment;
 }
 if(pos!==start+dirBytes||!files.has('manifest.json'))fail('Incomplete ZIP directory or manifest.');
 return files;
}
function pngOK(bytes){
 if(!bytes||bytes.length<24)return false;
 return PNG===Array.from(bytes.subarray(0,8),v=>v.toString(16).padStart(2,'0')).join('');
}
function normalizeRecord(entry,files){
 if(!entry||typeof entry!=='object'||entry.category!=='equipment'||
  entry.matchStatus!=='candidate'||entry.reviewStatus!=='pending'||
  !['ch','eu'].includes(entry.region)||
  !['head','shoulder','chest','hands','legs','foot','necklace','earring','ring','weapon','shield'].includes(entry.slot)||
  !['armor','protector','garment','heavy_armor','light_armor','robe','jewelry','shield','weapon'].includes(entry.equipmentType)||
  !Number.isInteger(entry.degree)||entry.degree<1||entry.degree>20||
  !IMAGE_PATH.test(entry.assetPath)||!SHA.test(entry.assetSha256)||
  !files.has(entry.assetPath))return null;
 const x={category:'equipment',matchStatus:'candidate',reviewStatus:'pending',region:entry.region,equipmentType:entry.equipmentType,
  slot:entry.slot,degree:entry.degree,weaponType:entry.weaponType||null,
  gender:typeof entry.gender==='string'?entry.gender.slice(0,40):null,
  grade:entry.grade||null,sourcePath:typeof entry.sourcePath==='string'?entry.sourcePath.slice(0,220):'',
  assetPath:entry.assetPath,assetSha256:entry.assetSha256,
  itemCodes:Array.isArray(entry.itemCodes)?entry.itemCodes.filter(c=>typeof c==='string'&&/^[A-Z0-9_]{3,128}$/.test(c)).slice(0,120):[]};
 if(x.equipmentType==='weapon'&&(x.slot!=='weapon'||typeof x.weaponType!=='string'))return null;
 return x;
}
async function validateZip(buffer){
 const files=extractStoredZip(buffer),raw=files.get('manifest.json');
 const manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
 if(!manifest||manifest.schemaVersion!==1||manifest.packType!=='wheel-browser-local-review'||
  manifest.status!=='unverified-candidates'||!Array.isArray(manifest.icons)||
  !manifest.icons.length||manifest.icons.length>1500)fail('This is not a supported local Sailor review pack.');
 if(!g.crypto?.subtle)fail('Secure browser image hashing is unavailable (HTTPS required).');
 const icons=[],images=new Map();
 for(const entry of manifest.icons){
  if(entry.category==='wheel_candidate')continue; // Unproven Wheel coupon sprites are intentionally not mapped.
  const e=normalizeRecord(entry,files);
  if(!e)fail('Invalid icon candidate metadata.');
  const bytes=files.get(e.assetPath);
  if(!pngOK(bytes))fail('Invalid PNG header.');
  const existing=images.get(e.assetSha256);
  if(existing&&existing!==e.assetPath)fail('One image digest maps to multiple source paths.');
  images.set(e.assetSha256,e.assetPath);
  icons.push(e);
 }
 const tested=new Set();
 for(const [digest,assetPath] of images){
  if(tested.has(digest))continue;
  const actual=new Uint8Array(await g.crypto.subtle.digest('SHA-256',files.get(assetPath)));
  const actualHex=Array.from(actual,v=>v.toString(16).padStart(2,'0')).join('');
  if(actualHex!==digest)fail('PNG SHA-256 mismatch.');
  tested.add(digest);
 }
 return {icons,images:new Map([...images].map(([hash,p])=>[hash,files.get(p)])),
  urls:new Map(),status:'ready'};
}
function setState(next){
 for(const value of state.urls.values())g.URL.revokeObjectURL(value);
 state=next;
}
function active(){return state.status==='ready';}
function candidates(identity){
 if(!active()||!identity?.region||!identity.equipmentType)return [];
 const code=identity.itemCode;
 return state.icons.filter(a=>a.region===identity.region&&a.equipmentType===identity.equipmentType&&
  a.slot===identity.slot&&a.degree===identity.degree&&
  (a.weaponType||null)===(identity.weaponType||null)&&
  (!code||a.itemCodes.includes(code)));
}
function iconURL(hash){
 if(!active()||!SHA.test(String(hash))||!state.images.has(hash))return null;
 if(!state.urls.has(hash))state.urls.set(hash,g.URL.createObjectURL(new Blob([state.images.get(hash)],{type:'image/png'})));
 return state.urls.get(hash);
}
function summary(){return {ready:active(),count:state.icons.length,images:state.images.size};}
function openDatabase(){
 if(!g.indexedDB)return Promise.resolve(null);
 return new Promise((resolve,reject)=>{
  const req=g.indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('IndexedDB unavailable.'));
 });
}
async function dbAction(mode,handler){
 const db=await openDatabase();if(!db)return null;
 try{
  return await new Promise((resolve,reject)=>{
   const tr=db.transaction(STORE,mode),req=handler(tr.objectStore(STORE));
   req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Storage access failed.'));
   tr.onerror=()=>reject(tr.error||Error('Storage failed.'));
  });
 }finally{db.close();}
}
async function importBuffer(buffer){
 const next=await validateZip(buffer);
 setState(next);
 let persisted=false;
 try{
  const copy=buffer instanceof ArrayBuffer?buffer.slice(0):Uint8Array.from(buffer).buffer;
  await dbAction('readwrite',s=>s.put(copy,KEY));
  persisted=!!g.indexedDB;
 }catch(_){persisted=false;}
 return {...summary(),persisted};
}
async function importFile(file){
 if(!file||!Number.isFinite(file.size)||file.size<22||file.size>MAX_PACK)fail('Invalid icon pack file size.');
 return importBuffer(await file.arrayBuffer());
}
async function restore(){
 try{
  const saved=await dbAction('readonly',s=>s.get(KEY));
  if(!saved)return false;
  setState(await validateZip(saved));return true;
 }catch(_){return false;}
}
async function clear(){
 setState({icons:[],images:new Map(),urls:new Map(),status:'empty'});
 try{await dbAction('readwrite',s=>s.delete(KEY));}catch(_){}
 return true;
}
g.WHEEL_LOCAL_PACK={importFile,importBuffer,restore,clear,summary,candidates,iconURL,
 extractStoredZip,validateZip};
})(window);
