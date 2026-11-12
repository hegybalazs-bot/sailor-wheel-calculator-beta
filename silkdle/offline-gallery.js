/* Silkdle Local Screenshot Library: private browser-only IndexedDB. Never syncs or uploads. */
(function(global){
"use strict";
const NAME="silkdle-local-gallery-v1",VERSION=1,MAX_ITEMS=500,MAX_BYTES=3_600_000;
function open(){
  return new Promise((resolve,reject)=>{
    if(!global.indexedDB){reject(Error("This browser does not support offline images (IndexedDB)."));return}
    const request=global.indexedDB.open(NAME,VERSION);
    request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains("meta"))db.createObjectStore("meta",{keyPath:"id"});if(!db.objectStoreNames.contains("media"))db.createObjectStore("media",{keyPath:"id"})};
    request.onerror=()=>reject(request.error||Error("Cannot open local library"));
    request.onsuccess=()=>resolve(request.result);
    request.onblocked=()=>reject(Error("Close other Silkdle tabs and try again"));
  })
}
function transactional(stores,mode,doWork){
 return open().then(db=>new Promise((resolve,reject)=>{
   let tx,output;
   try{tx=db.transaction(stores,mode);output=doWork(tx)}catch(e){db.close();reject(e);return}
   tx.oncomplete=()=>{db.close();resolve(output)};
   tx.onerror=()=>{db.close();reject(tx.error||Error("Browser image storage failed"))};
   tx.onabort=()=>{db.close();reject(tx.error||Error("Browser image storage cancelled"))};
 }))
}
function read(store,fn){
 return open().then(db=>new Promise((resolve,reject)=>{
 const t=db.transaction([store],"readonly"),request=fn(t.objectStore(store));let result;
 request.onsuccess=()=>result=request.result;
 request.onerror=()=>reject(request.error||Error("Cannot read local image"));
 t.oncomplete=()=>{db.close();resolve(result)};
 t.onerror=()=>{db.close();reject(t.error||Error("Image read failed"))}
 }))
}
const clean=s=>String(s||"").trim();
function normalize(v){return clean(v).normalize("NFKC").toLocaleLowerCase("en")}
function storeScreenshot(data){
 if(!data||!(data.blob instanceof Blob)||!["image/png","image/jpeg"].includes(data.blob.type)||data.blob.size<100||data.blob.size>MAX_BYTES) return Promise.reject(Error("A screenshot must be JPG/PNG under 3.6 MB."));
 const answer=clean(data.answer),category=clean(data.category),world=clean(data.world);
 if(answer.length<2||answer.length>120||!["unique","mob","weapon","armor","location","npcquest"].includes(category)||!["Chinese","European","all"].includes(world))return Promise.reject(Error("Check the answer, category and Chinese/European world."));
 const id="local_"+(global.crypto?.randomUUID?.()||String(Date.now())+"_"+Math.random().toString(36).slice(2));
 const meta={id,answer,category,world,region:clean(data.region).slice(0,120),aliases:Array.isArray(data.aliases)?data.aliases.filter(x=>typeof x==="string").slice(0,12).map(clean):[],source:clean(data.source).slice(0,500),filename:clean(data.filename).slice(0,160),cropX:Math.min(1,Math.max(0,Number(data.cropX??.5))),cropY:Math.min(1,Math.max(0,Number(data.cropY??.45))),createdAt:Date.now(),size:data.blob.size};
 return count().then(n=>{if(n>=MAX_ITEMS)throw Error("500 images per browser is the beta limit");return transactional(["meta","media"],"readwrite",tx=>{tx.objectStore("meta").put(meta);tx.objectStore("media").put({id,blob:data.blob});return meta})})
}
const count=()=>read("meta",s=>s.count());
const list=()=>read("meta",s=>s.getAll()).then(rows=>rows.sort((a,b)=>b.createdAt-a.createdAt));
const getBlob=id=>read("media",s=>s.get(id)).then(record=>record?.blob||null);
const remove=id=>transactional(["meta","media"],"readwrite",tx=>{tx.objectStore("meta").delete(id);tx.objectStore("media").delete(id)});
const clear=()=>transactional(["meta","media"],"readwrite",tx=>{tx.objectStore("meta").clear();tx.objectStore("media").clear()});
global.SILKDLE_LOCAL_GALLERY={storeScreenshot,count,list,getBlob,remove,clear,normalize,limit:MAX_ITEMS};
})(window);
