"use strict";
const $=id=>document.getElementById(id),state={key:"",catalog:[],images:[],selected:null};
function message(v,kind=""){const n=$("message");n.textContent=v;n.className=kind}
function make(tag,text,parent){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(parent)parent.append(n);return n}
async function api(route,method="GET",body){const opts={method,headers:{"Accept":"application/json"},credentials:"same-origin"};
if(state.key)opts.headers["X-Silkdle-Admin-Key"]=state.key;
if(method!=="GET"){opts.headers["Content-Type"]="application/json";opts.body=JSON.stringify(body||{})}
const r=await fetch(route,opts),raw=await r.json();if(!r.ok)throw Error(raw.error||"Hálózati hiba "+r.status);return raw}
async function status(){try{const d=await api("/api/image/status");$("stats").replaceChildren();[d.staged+" katalógustétel",d.approved+" jóváhagyott kép",d.configured?"Adatbázis: kapcsolódva":"Adatbázis: NINCS",d.adminConfigured?"Admin: konfigurálva":"Admin: nincs kulcs"].forEach(t=>{const x=make("span",t,$("stats"));x.className="pill"})}catch(e){message(e.message,"error")}}
function mapCatalog(){const term=$("catalogSearch").value.trim().toLowerCase(),list=$("catalogSuggestions");list.replaceChildren();
if(term.length<2)return;
for(const e of state.catalog.filter(x=>x.answer.toLowerCase().includes(term)||x.id.includes(term.replace(/\s+/g,"-"))).slice(0,40)){const o=make("option",null,list);o.value=e.answer;o.label=e.category+" • "+e.id}}
function pickCatalog(){const q=$("catalogSearch").value.toLowerCase(),item=state.catalog.find(x=>x.answer.toLowerCase()===q||x.id.toLowerCase()===q);
if(!item)return;state.selected=item;$("category").value=item.category;$("world").value=item.world;$("answer").value=item.answer;$("aliases").value=(item.aliases||[]).join(", ")}
async function connect(){state.key=$("adminKey").value.trim();if(state.key.length<24){message("Az admin kulcs legalább 24 karakteres.","warn");return}
try{const [data,uploaded]=await Promise.all([api("/api/admin/image/catalog"),api("/api/admin/image/list")]);state.catalog=data.entries;state.images=uploaded.images;message("Admin csatlakoztatva. "+state.catalog.length+" előkészített katalógustétel és "+uploaded.images.length+" feltöltött kép.","ok");renderList()}catch(e){state.key="";message(e.message,"error")}}
function displayPreview(){const f=$("fileInput").files?.[0],container=$("preview");container.replaceChildren();if(!f){make("span","Nincs kiválasztott kép",container);return}const image=make("img",null,container);const url=URL.createObjectURL(f);image.onload=()=>URL.revokeObjectURL(url);image.src=url}
function imageBlob(file){return new Promise(async(ok,no)=>{try{
if(!["image/png","image/jpeg"].includes(file.type))throw Error("Csak valódi JPG/PNG kép engedélyezett");
const bitmap=await createImageBitmap(file),scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height)),w=Math.round(bitmap.width*scale),h=Math.round(bitmap.height*scale);if(w<160||h<160)throw Error("Túl kicsi kép");
const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(bitmap,0,0,w,h);bitmap.close();
const data=canvas.toDataURL("image/jpeg",.86).split(",")[1];if(data.length>4_850_000)throw Error("Túl nagy képfájl");
ok({mime:"image/jpeg",data});
}catch(e){no(e)}})}
function matchFile(file){
 const normalize=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
 const base=normalize(file.name.replace(/\.(png|jpg|jpeg)$/i,""));
 const matches=[];
 for(const row of state.catalog){
 const labels=[row.id,row.answer,...(row.aliases||[])];
 if(labels.some(label=>{const n=normalize(label);return base===n||base.startsWith(n+"-")}))matches.push(row);
 }
 matches.sort((a,b)=>b.answer.length-a.answer.length);
 return matches[0]||null
}
async function upload(e){e.preventDefault();if(!state.key){message("Előbb admin belépés szükséges.","warn");return}
const files=[...$("fileInput").files];if(!files.length){message("Válassz egy vagy több képet.","warn");return}const btn=$("upload");btn.disabled=true;
let uploaded=0,skipped=0,failed=0;
for(let i=0;i<files.length;i++){
const file=files[i],match=files.length===1?(state.selected||matchFile(file)):matchFile(file);
if(files.length>1&&!match){skipped++;continue}
const answer=match?.answer||$("answer").value.trim(),category=match?.category||$("category").value,world=match?.world||$("world").value;
if(!answer||answer.length<2){skipped++;continue}
try{message("Feldolgozás: "+(i+1)+"/"+files.length+" • "+file.name,"warn");
const image=await imageBlob(file);
await api("/api/admin/image/import","POST",{...image,catalogId:match?.id||"",answer,aliases:(files.length===1?$("aliases").value.split(","):(match?.aliases||[])).map(x=>x.trim()).filter(Boolean),category,world,region:match?.region||"",sourceUrl:$("sourceUrl").value.trim()||"admin screenshot import: "+file.name,rightsNote:$("rightsNote").value.trim(),...cropCoords()});uploaded++
}catch(e){failed++;message("Kép hiba: "+file.name+": "+e.message,"error")}
}
btn.disabled=false;message("Feltöltés befejezve. Ellenőrzésre vár: "+uploaded+" | kihagyott: "+skipped+" | hibás: "+failed+".\nTöbb fájl esetén a fájlnévnek a katalógusban szereplő névvel/azonosítóval kell egyeznie.",uploaded?"ok":"warn");await Promise.all([status(),reload()])}
async function reload(){if(!state.key)return;try{const d=await api("/api/admin/image/list");state.images=d.images;renderList()}catch(e){message(e.message,"error")}}
async function preview(row,button){try{const r=await fetch(row.preview,{headers:{"X-Silkdle-Admin-Key":state.key}});if(!r.ok)throw Error("Nem tölthető be a kép");const blob=await r.blob(),url=URL.createObjectURL(blob);const img=document.createElement("img");img.src=url;img.style.maxWidth="210px";img.style.maxHeight="160px";img.onload=()=>URL.revokeObjectURL(url);button.after(img)}catch(e){message(e.message,"error")}}
async function review(row,action){const basis=$("rightsBasis").value,notes=$("rightsNote").value.trim();
if(action==="approve"&&(!basis||notes.length<10)){message("Publikálás előtt jogalap és legalább 10 karakteres forrásleírás kell.","warn");return}
if(!window.confirm((action==="approve"?"Biztosan publikálod?":"Visszavonod?")+" "+row.answer))return;
try{await api("/api/admin/image/"+row.id+"/"+action,"POST",{confirm:true,rightsBasis:basis,rightsNote:notes});await Promise.all([reload(),status()]);message("Kép állapota frissítve.","ok")}catch(e){message(e.message,"error")}}
function renderList(){const list=$("imageList");list.replaceChildren();if(!state.images.length){make("p","Még nincs feltöltött kép. A 441 tétel egyelőre csak előkészített katalógusadat.",list);return}
for(const row of state.images){const card=make("div",null,list);card.className="item";const body=make("div",null,card);make("strong",row.answer+" • "+row.category,body);const info=make("small",row.id+" | "+row.world+" | "+row.width+"×"+row.height,body);const status=make("small",row.status,body);status.className="status "+row.status;const controls=make("div",null,card);controls.className="row";const pr=make("button","Előnézet",controls);pr.className="secondary";pr.onclick=()=>preview(row,pr);
const reviewBtn=make("button",row.status==="approved"?"Visszavonás":"Jóváhagyás",controls);reviewBtn.onclick=()=>review(row,row.status==="approved"?"revoke":"approve")}}
function exportCatalog(){if(!state.catalog.length){message("Először csatlakozz az adminhoz.","warn");return}
const data=JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),entries:state.catalog},null,2),blob=new Blob([data],{type:"application/json"}),url=URL.createObjectURL(blob),link=make("a",null,document.body);link.href=url;link.download="silkdle-kepkatalogus.json";link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),500)}
$("connect").onclick=connect;$("refreshList").onclick=reload;$("exportCatalog").onclick=exportCatalog;
$("catalogSearch").oninput=mapCatalog;$("catalogSearch").onchange=pickCatalog;$("fileInput").onchange=()=>{displayPreview();renderCropPreview()};$("uploadForm").onsubmit=upload;status();api("/api/image/catalog").then(d=>{state.catalog=d.entries;message(d.entries.length+" előkészített tétel böngészhető. A publikáláshoz adatbázis és admin kulcs kell.","warn")}).catch(e=>message(e.message,"error"));


function cropCoords(){return {cropX:Number($("cropX")?.value||50)/100,cropY:Number($("cropY")?.value||45)/100}}
function renderCropPreview(){
 const container=$("cropPreview");if(!container)return;
 const f=$("fileInput").files?.[0];container.replaceChildren();if(!f)return;
 const image=make("img",null,container),url=URL.createObjectURL(f);image.src=url;image.onload=()=>URL.revokeObjectURL(url);
 updateCropPreview();
}
function updateCropPreview(){
 const {cropX,cropY}=cropCoords();$("cropXvalue").textContent=Math.round(cropX*100)+"%";$("cropYvalue").textContent=Math.round(cropY*100)+"%";
 const img=$("cropPreview").querySelector("img");if(img){img.style.transform="scale(10)";img.style.transformOrigin=Math.round(cropX*100)+"% "+Math.round(cropY*100)+"%"}
}
$("cropX").oninput=updateCropPreview;
$("cropY").oninput=updateCropPreview;

/* Private offline screenshot import; this does not publish or grant site-wide rights. */
const local=()=>window.SILKDLE_LOCAL_GALLERY;
function localMessage(text,kind=""){const p=$("localStatus");if(!p)return;p.textContent=text;p.className="small "+kind}
async function refreshLocal(){
 const list=$("localList");if(!list)return;list.replaceChildren();
 if(!local()){localMessage("Offline image library is unavailable in this browser","error");return}
 try{
 const entries=await local().list();localMessage(entries.length+" helyi Silkroad-feladvány ezen a készüléken. Mások számára nem publikus.","ok");
 if(!entries.length){make("p","Még nincs helyi kép. Tölts fel képet a felső részen, majd kattints a Mentés a saját képtárba gombra.",list);return}
 for(const item of entries){
  const card=make("div",null,list);card.className="item";
  const details=make("div",null,card);make("strong",item.answer+" • "+item.category,details);make("small",item.world+" | "+(item.filename||"helyi kép")+" | "+new Date(item.createdAt).toLocaleString("hu-HU"),details);
  const controls=make("div",null,card);controls.className="row";
  const show=make("button","Előnézet",controls);show.className="secondary";
  show.onclick=async()=>{const image=await local().getBlob(item.id);if(!image)return;const url=URL.createObjectURL(image),preview=make("img",null,card);preview.src=url;preview.alt="Helyi screenshot: "+item.answer;preview.style.cssText="max-width:230px;max-height:190px;object-fit:contain";preview.onload=()=>URL.revokeObjectURL(url)};
  const remove=make("button","Törlés",controls);remove.className="secondary";
  remove.onclick=async()=>{if(!confirm("Eltávolítod ezt a helyi képet? "+item.answer))return;await local().remove(item.id);refreshLocal()};
 }
 }catch(e){localMessage("Helyi képtárhiba: "+e.message,"error")}
}
async function saveOffline(){
 if(!local()){localMessage("A böngésződ nem támogatja ezt a funkciót.","error");return}
 const files=[...$("fileInput").files];if(!files.length){localMessage("Előbb válassz ki egy vagy több JPG/PNG screenshotot fent!","warn");return}
 const b=$("localSave");b.disabled=true;let done=0,skipped=0,failed=0;
 for(let i=0;i<files.length;i++){
  const file=files[i],matched=files.length===1?(state.selected||matchFile(file)):matchFile(file);
  const answer=matched?.answer||$("answer").value.trim();
  if(!answer||(files.length>1&&!matched)){skipped++;continue}
  try{
   localMessage("Kép import: "+(i+1)+"/"+files.length+" – "+file.name,"warn");
   const encoded=await imageBlob(file),blob=await (await fetch("data:"+encoded.mime+";base64,"+encoded.data)).blob();
   await local().storeScreenshot({blob,answer,aliases:matched?.aliases||$("aliases").value.split(",").map(x=>x.trim()).filter(Boolean),category:matched?.category||$("category").value,world:matched?.world||$("world").value,region:matched?.region||"",source:$("sourceUrl").value.trim()||"Saját fájl: "+file.name,filename:file.name,...cropCoords()});
   done++;
  }catch(e){failed++;localMessage(file.name+": "+e.message,"error")}
 }
 b.disabled=false;await refreshLocal();
 localMessage("Helyi mentés: "+done+" sikeres • "+skipped+" kihagyott • "+failed+" hibás. Nyisd meg a Játék → Saját képek menüt.",done?"ok":"warn");
}
$("localSave").onclick=saveOffline;
$("localRefresh").onclick=refreshLocal;
$("localClear").onclick=async()=>{if(!confirm("Biztosan törlöd az összes helyi screenshotot ebből a böngészőből?"))return;await local().clear();refreshLocal()};
refreshLocal();
