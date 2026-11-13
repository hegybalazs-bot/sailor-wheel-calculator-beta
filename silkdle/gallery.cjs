"use strict";
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,"data/image-manifest.json"),"utf8"));
const CATEGORIES=["unique","mob","weapon","armor","location","npcquest"],WORLDS=["Chinese","European","all"];
const RIGHTS=["own_capture_noncommercial","official_fansite_terms","written_permission"];
const sessions=new Map(),rate=new Map();
const norm=x=>String(x||"").normalize("NFKC").trim().toLowerCase().replace(/\bglaive\b/g,"glavie");
function json(res,code,obj){res.writeHead(code,{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"});res.end(JSON.stringify(obj))}
const fail=(res,code,msg)=>json(res,code,{error:msg});
function validAdmin(req,secret){const a=Buffer.from(String(req.headers["x-silkdle-admin-key"]||"")),b=Buffer.from(secret||"");return b.length>=24&&a.length===b.length&&crypto.timingSafeEqual(a,b)}
function cookie(req,name){return String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="))?.slice(name.length+1)||""}
function body(req,limit=5_200_000){return new Promise((ok,no)=>{let chunks=[],size=0,ended=false;if(Number(req.headers["content-length"])>limit){req.resume();no(Error("Body too large"));return}req.on("data",chunk=>{size+=chunk.length;if(size>limit){if(!ended){ended=true;no(Error("Body too large"));req.destroy()}}else chunks.push(chunk)});req.on("end",()=>{if(ended)return;try{ok(JSON.parse(Buffer.concat(chunks).toString("utf8")))}catch{no(Error("Invalid JSON"))}});req.on("error",no)})}
function dimensions(bytes,mime){
 if(mime==="image/png"){if(bytes.length<48||!bytes.subarray(bytes.length-12).equals(Buffer.from("0000000049454e44ae426082","hex"))||bytes.indexOf(Buffer.from("IDAT"))<0||bytes.subarray(0,8).toString("hex")!=="89504e470d0a1a0a"||bytes.toString("ascii",12,16)!=="IHDR")throw Error("Invalid PNG");return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)]}
 if(mime==="image/jpeg"){if(bytes.length<80||bytes[0]!==255||bytes[1]!==216||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)throw Error("Invalid JPEG");let i=2;while(i<bytes.length-12){if(bytes[i]!==255){i++;continue}const k=bytes[i+1];if(k===217||k===218)break;if(k===216||k===1){i+=2;continue}const n=bytes.readUInt16BE(i+2);if(n<2)break;if([192,193,194,195,198,199,201,202,203,205,206,207].includes(k))return [bytes.readUInt16BE(i+7),bytes.readUInt16BE(i+5)];i+=n+2}throw Error("Cannot read JPEG dimensions")}
 throw Error("JPEG or PNG only");
}
function toPublic(r){return {id:r.id,catalogId:r.catalog_id,answer:r.answer,aliases:r.aliases,category:r.category,world:r.world,region:r.region,status:r.status,rightsBasis:r.rights_basis,rightsNote:r.rights_note,sourceUrl:r.source_url,width:r.width,height:r.height,cropX:Number(r.cropX??.5),cropY:Number(r.cropY??.45),preview:"/api/image/file/"+r.id}}
module.exports=function(db,adminKey){
 async function init(){if(!db)return;await db.query("create table if not exists silkdle_images (id varchar(40) primary key,catalog_id varchar(100),answer varchar(120) not null,aliases jsonb not null default '[]'::jsonb,category varchar(24) not null,world varchar(16) not null,region varchar(120),mime varchar(24) not null,bytes bytea not null,width integer not null,height integer not null,crop_x numeric not null default 0.5,crop_y numeric not null default 0.45,source_url text,rights_basis varchar(40),rights_note text,status varchar(20) not null default 'pending',reviewed_at timestamptz,created_at timestamptz not null default now())");await db.query("alter table silkdle_images add column if not exists crop_x numeric not null default 0.5");await db.query("alter table silkdle_images add column if not exists crop_y numeric not null default 0.45");await db.query("create index if not exists silkdle_images_status_category on silkdle_images(status,category)")}
 async function approved(){if(!db)return [];return (await db.query("select id,answer,aliases,category,world,region,crop_x as \"cropX\",crop_y as \"cropY\" from silkdle_images where status='approved' order by id")).rows}
 async function find(id){if(!db)return null;return (await db.query("select id,answer,aliases,category,world,region,crop_x as \"cropX\",crop_y as \"cropY\" from silkdle_images where id=$1 and status='approved'",[id])).rows[0]||null}
 async function handle(req,res,url){
  const p=url.pathname;
  if(!p.startsWith("/api/image/")&&!p.startsWith("/api/admin/image"))return false;
  const ip=String(req.headers["x-forwarded-for"]||req.socket.remoteAddress||"unknown").split(",")[0],now=Date.now(),r=rate.get(ip)||{end:now+60000,count:0};if(r.end<now){r.end=now+60000;r.count=0}r.count++;rate.set(ip,r);if(rate.size>10000){for(const [key,v] of rate)if(v.end<now)rate.delete(key)}if(r.count>60){fail(res,429,"Too many requests");return true}
  if(p==="/api/image/catalog"&&req.method==="GET"){json(res,200,{schemaVersion:catalog.schemaVersion,entries:catalog.entries.map(e=>({id:e.id,answer:e.answer,aliases:e.aliases,category:e.category,world:e.world,region:e.region,level:e.level,degree:e.degree,status:e.status}))});return true}
  if(p==="/api/image/status"&&req.method==="GET"){const n=db?Number((await db.query("select count(*)::int as n from silkdle_images where status='approved'")).rows[0].n):0;json(res,200,{configured:!!db,staged:catalog.entries.length,approved:n,adminConfigured:!!adminKey&&adminKey.length>=24});return true}
  if(!db){fail(res,503,"Database is not connected");return true}
  const admin=validAdmin(req,adminKey);
  if(p==="/api/admin/image/catalog"&&req.method==="GET"){if(!admin)fail(res,403,"Admin key required");else json(res,200,{entries:catalog.entries});return true}
  if(p==="/api/admin/image/list"&&req.method==="GET"){if(!admin){fail(res,403,"Admin key required");return true}const rows=(await db.query("select id,catalog_id,answer,aliases,category,world,region,source_url,rights_basis,rights_note,status,width,height,crop_x as \"cropX\",crop_y as \"cropY\" from silkdle_images order by created_at desc limit 1000")).rows;json(res,200,{images:rows.map(toPublic)});return true}
  if(p==="/api/admin/image/import"&&req.method==="POST"){
   if(!admin){fail(res,403,"Admin key required");return true}
   let b;try{b=await body(req)}catch(e){fail(res,413,e.message);return true}
   const answer=String(b.answer||"").trim(),category=String(b.category||""),world=String(b.world||""),catalogId=String(b.catalogId||""),sourceUrl=String(b.sourceUrl||""),rightsNote=String(b.rightsNote||"");
   if(answer.length<2||answer.length>120||!CATEGORIES.includes(category)||!WORLDS.includes(world)||catalogId.length>100||sourceUrl.length>2000||rightsNote.length>2000){fail(res,400,"Invalid image metadata");return true}
   if(catalogId&&!catalog.entries.some(e=>e.id===catalogId)){fail(res,400,"Unknown catalog entry");return true}
   const mime=String(b.mime||"");if(!["image/png","image/jpeg"].includes(mime)||typeof b.data!=="string"||b.data.length>4_850_000||!/^[A-Za-z0-9+/]+={0,2}$/.test(b.data)){fail(res,400,"Invalid PNG/JPEG image data");return true}
   const bytes=Buffer.from(b.data,"base64");if(!bytes.length||bytes.length>3_600_000){fail(res,413,"Image too large");return true}
   let size;try{size=dimensions(bytes,mime)}catch(e){fail(res,400,e.message);return true}
   if(size[0]<160||size[1]<160||size[0]*size[1]>6_553_600){fail(res,400,"Invalid image size");return true}
   const aliases=Array.isArray(b.aliases)?b.aliases.filter(x=>typeof x==="string"&&x.length<90).slice(0,12):[];
   const id="img_"+crypto.randomBytes(10).toString("hex");
   await db.query("insert into silkdle_images(id,catalog_id,answer,aliases,category,world,region,mime,bytes,width,height,source_url,rights_note,crop_x,crop_y,status) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending')",[id,catalogId||null,answer,JSON.stringify(aliases),category,world,String(b.region||"").slice(0,120),mime,bytes,size[0],size[1],sourceUrl,rightsNote,Math.min(1,Math.max(0,Number(b.cropX??.5))),Math.min(1,Math.max(0,Number(b.cropY??.45)))]);
   json(res,201,{id,status:"pending",width:size[0],height:size[1],note:"Requires separate approval"});return true
  }
  const review=p.match(/^\/api\/admin\/image\/(img_[a-f0-9]{20})\/(approve|revoke)$/);
  if(review&&req.method==="POST"){
   if(!admin){fail(res,403,"Admin key required");return true}
   const b=await body(req,5000);
   if(review[2]==="approve"){
    if(b.confirm!==true||!RIGHTS.includes(b.rightsBasis)||String(b.rightsNote||"").trim().length<10){fail(res,400,"Rights and source must be explicitly confirmed");return true}
    const q=await db.query("update silkdle_images set status='approved',rights_basis=$2,rights_note=$3,reviewed_at=now() where id=$1 returning id",[review[1],b.rightsBasis,String(b.rightsNote).slice(0,2000)]);if(!q.rowCount){fail(res,404,"Missing");return true}json(res,200,{id:review[1],status:"approved"});return true
   }
   const q=await db.query("update silkdle_images set status='pending',reviewed_at=null where id=$1 returning id",[review[1]]);if(!q.rowCount)fail(res,404,"Missing");else json(res,200,{id:review[1],status:"pending"});return true
  }
  const file=p.match(/^\/api\/image\/file\/(img_[a-f0-9]{20})$/);
  if(file&&req.method==="GET"){const q=await db.query("select mime,bytes,status from silkdle_images where id=$1",[file[1]]);if(!q.rowCount||q.rows[0].status!=="approved"&&!admin){fail(res,404,"Image not available");return true}const row=q.rows[0];res.writeHead(200,{"content-type":row.mime,"cache-control":row.status==="approved"?"public,max-age=3600":"no-store","x-content-type-options":"nosniff"});res.end(row.bytes);return true}
  if(p==="/api/image/practice/start"&&req.method==="POST"){
   const b=await body(req,1000),cat=CATEGORIES.includes(b.category)?b.category:null,world=WORLDS.includes(b.world)?b.world:null;
   const rows=(await approved()).filter(x=>(!cat||x.category===cat)&&(!world||world==="all"||x.world===world||x.world==="all"));
   if(!rows.length){fail(res,409,"No approved screenshot yet for this category");return true}
   const previous=sessions.get(cookie(req,"silkdle_practice")),history=Array.isArray(previous?.history)?previous.history:[];
   const novel=rows.filter(x=>!history.includes(x.id)),pool=novel.length?novel:rows,selected=pool[crypto.randomInt(pool.length)],key=crypto.randomBytes(24).toString("hex");
   if(sessions.size>10000){for(const [k,v] of sessions)if(v.expires<Date.now())sessions.delete(k)}
   const maxRecent=Math.max(1,Math.min(10,rows.length-1));
   sessions.set(key,{id:selected.id,wrong:0,expires:Date.now()+1200000,finished:false,history:[...history,selected.id].slice(-maxRecent)});
   res.setHeader("Set-Cookie","silkdle_practice="+key+"; Path=/; HttpOnly; SameSite=Strict; Max-Age=1200"+(req.headers["x-forwarded-proto"]==="https"?"; Secure":""));
   json(res,200,{id:selected.id,image:"/api/image/file/"+selected.id,category:selected.category,world:selected.world,region:selected.region||null,cropX:Number(selected.cropX??.5),cropY:Number(selected.cropY??.45),wrong:0,opened:.01,maxWrong:6});return true
  }
  if(p==="/api/image/practice/guess"&&req.method==="POST"){
   const key=cookie(req,"silkdle_practice"),run=sessions.get(key);if(!run||run.finished||run.expires<Date.now()){fail(res,409,"Start a new puzzle");return true}
   const b=await body(req,2000),guess=norm(b.guess);if(!guess||guess.length>100){fail(res,400,"Invalid answer");return true}
   const item=await find(run.id);if(!item){fail(res,410,"Item is no longer published");return true}
   const correct=[item.answer,...(Array.isArray(item.aliases)?item.aliases:[])].some(v=>norm(v)===guess);
   if(!correct)run.wrong++;run.finished=correct||run.wrong>=6;
   json(res,200,{correct,finished:run.finished,wrong:run.wrong,opened:run.finished?1:[.01,.025,.07,.18,.45,.7,.95][run.wrong],...(run.finished?{answer:item.answer}:{})});return true
  }
  fail(res,404,"Unknown image endpoint");return true;
 }
 return {init,handle,approved,find};
};
