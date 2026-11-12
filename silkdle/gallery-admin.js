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
await api("/api/admin/image/import","POST",{...image,catalogId:match?.id||"",answer,aliases:(files.length===1?$("aliases").value.split(","):(match?.aliases||[])).map(x=>x.trim()).filter(Boolean),category,world,region:match?.region||"",sourceUrl:$("sourceUrl").value.trim()||"admin screenshot import: "+file.name,rightsNote:$("rightsNote").value.trim()});uploaded++
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
$("catalogSearch").oninput=mapCatalog;$("catalogSearch").onchange=pickCatalog;$("fileInput").onchange=displayPreview;$("uploadForm").onsubmit=upload;status();api("/api/image/catalog").then(d=>{state.catalog=d.entries;message(d.entries.length+" előkészített tétel böngészhető. A publikáláshoz adatbázis és admin kulcs kell.","warn")}).catch(e=>message(e.message,"error"));
