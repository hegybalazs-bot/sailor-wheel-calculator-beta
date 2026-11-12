"use strict";
const {test,before,after}=require("node:test");
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const path=require("node:path");
const PORT=39000+Math.floor(Math.random()*10000),URL="http://127.0.0.1:"+PORT;
let child;
async function request(route,options={}){return fetch(URL+route,options)}
async function endpoint(route,method="GET",body,cookie){const headers={};if(body!==undefined)headers["content-type"]="application/json";if(cookie)headers.cookie=cookie;const response=await request("/api"+route,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});const data=await response.json();return {response,data}}
before(async()=>{child=spawn(process.execPath,[path.join(__dirname,"..","server.cjs")],{env:{...process.env,PORT:String(PORT),DATABASE_URL:process.env.TEST_DATABASE_URL||"",SILKDLE_ADMIN_KEY:"ci_secret_only_for_test_1357924680"},stdio:["ignore","pipe","pipe"]});let log="";child.stdout.on("data",x=>log+=x);child.stderr.on("data",x=>log+=x);for(let i=0;i<90;i++){if(child.exitCode!==null)throw Error("Server exited early: "+log);try{const r=await request("/api/health");if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw Error("Timed out starting server: "+log)});
after(()=>{if(child&&!child.killed)child.kill()});
test("serves the game and original image assets",async()=>{for(const [url,type] of [["/","text/html"],["/race.js","text/javascript"],["/art/s01.svg","image/svg+xml"]]){const r=await request(url);assert.equal(r.status,200,url);assert.ok(r.headers.get("content-type")?.includes(type));assert.ok((await r.text()).length>50)}});
test("no path traversal or arbitrary server files",async()=>{const r=await request("/server.cjs");assert.equal(r.status,404)});
test("health identifies whether database is configured",async()=>{const r=await endpoint("/health");assert.equal(r.response.status,200);assert.equal(r.data.ok,true)});
test("account, ranked scoring, and leaderboard work end to end", {skip:!process.env.TEST_DATABASE_URL}, async()=>{
const nick="tester"+Math.random().toString(36).slice(2,10),pass="UniqueTestPassword!55",email=nick+"@example.test";
let x=await endpoint("/auth/register","POST",{username:nick,email,password:pass});assert.equal(x.response.status,200,JSON.stringify(x.data));
const cookie=x.response.headers.get("set-cookie")?.split(";")[0];assert.ok(cookie?.startsWith("silkdle_session="));
x=await endpoint("/me","GET",undefined,cookie);assert.equal(x.data.user.username,nick);
x=await endpoint("/auth/register","POST",{username:nick.toUpperCase(),email:"other"+email,password:pass});assert.equal(x.response.status,409);
x=await endpoint("/race/start","POST",{},cookie);assert.equal(x.response.status,200);assert.equal(x.data.started,true);assert.ok(x.data.puzzle.image);assert.ok(!("answer" in x.data));assert.equal("choices" in x.data.puzzle,false);assert.equal(x.data.limitMs,undefined);
let first=x.data;assert.equal(first.wrong,0);
const expected={s01:"Tiger Girl",s02:"Cerberus",s03:"Glaive",s04:"Harp"}[first.puzzle.id];assert.ok(expected);
x=await endpoint("/race/guess","POST",{guess:expected},cookie);assert.equal(x.response.status,200);assert.equal(x.data.correct,true);assert.equal(x.data.finished,true);assert.ok(x.data.score>0);
x=await endpoint("/leaderboard?scope=daily");assert.equal(x.response.status,200);assert.ok(x.data.entries.some(e=>e.username===nick&&e.score>0));
x=await endpoint("/race/start","POST",{},cookie);assert.equal(x.data.finished,true);assert.equal(x.data.answer,expected);
x=await endpoint("/race/guess","POST",{guess:expected},cookie);assert.equal(x.response.status,409);
x=await endpoint("/auth/logout","POST",{},cookie);assert.equal(x.response.status,200);x=await endpoint("/me","GET",undefined,cookie);assert.equal(x.data.user,null);
x=await endpoint("/auth/login","POST",{login:nick,password:pass});assert.equal(x.response.status,200);const relogin=x.response.headers.get("set-cookie")?.split(";")[0];
x=await endpoint("/account/delete","POST",{password:pass},relogin);assert.equal(x.response.status,200);
x=await endpoint("/leaderboard?scope=daily");assert.ok(!x.data.entries.some(e=>e.username===nick));
});


test("hard-mode race: arbitrary wrong guesses consume two strikes and award zero", {skip:!process.env.TEST_DATABASE_URL}, async()=>{
const nick="expert"+Math.random().toString(36).slice(2,10),pass="ExpertTestPassword55!";
let x=await endpoint("/auth/register","POST",{username:nick,email:nick+"@example.test",password:pass});
assert.equal(x.response.status,200,JSON.stringify(x.data));
const cookie=x.response.headers.get("set-cookie")?.split(";")[0];
x=await endpoint("/race/start","POST",{},cookie);
assert.equal(x.response.status,200);
assert.equal(x.data.expiresAt-x.data.startedAt,45000);
x=await endpoint("/race/guess","POST",{guess:"NotRealGuessNameOne"},cookie);
assert.equal(x.response.status,200);assert.equal(x.data.finished,false);assert.equal(x.data.wrong,1);
x=await endpoint("/race/guess","POST",{guess:"NotRealGuessNameTwo"},cookie);
assert.equal(x.response.status,200);assert.equal(x.data.finished,true);assert.equal(x.data.correct,false);assert.equal(x.data.score,0);
x=await endpoint("/race/guess","POST",{guess:"Tiger Girl"},cookie);assert.equal(x.response.status,409);
x=await endpoint("/race/status","GET",undefined,cookie);
assert.equal(x.data.finished,true);assert.equal(x.data.wrong,2);
x=await endpoint("/account/delete","POST",{password:pass},cookie);assert.equal(x.response.status,200);
});


test("Screenshot workflow: pending image, admin approval, anonymous real-image guessing, revoke", {skip:!process.env.TEST_DATABASE_URL}, async()=>{
const zlib=require("node:zlib");
function crc32(b){let crc=0xffffffff;for(const v of b){crc^=v;for(let i=0;i<8;i++)crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1}return (crc^0xffffffff)>>>0}
function chunk(type,bytes){const a=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(bytes.length);crc.writeUInt32BE(crc32(Buffer.concat([a,bytes])));return Buffer.concat([size,a,bytes,crc])}
const header=Buffer.alloc(13);header.writeUInt32BE(160,0);header.writeUInt32BE(160,4);header[8]=8;header[9]=2;
const pixels=Buffer.alloc(160*(1+160*3));for(let y=0;y<160;y++){const base=y*481;pixels[base]=0;for(let x=0;x<160;x++){pixels[base+1+x*3]=90;pixels[base+2+x*3]=130;pixels[base+3+x*3]=110}}
const png=Buffer.concat([Buffer.from("89504e470d0a1a0a","hex"),chunk("IHDR",header),chunk("IDAT",zlib.deflateSync(pixels)),chunk("IEND",Buffer.alloc(0))]);
const ADMIN_KEY="ci_secret_only_for_test_1357924680",headers={"x-silkdle-admin-key":ADMIN_KEY,"content-type":"application/json"};
let r=await request("/api/image/status");assert.equal(r.status,200);
let d=await r.json();assert.ok(d.staged>=200);assert.equal(d.configured,true);
r=await request("/api/admin/image/catalog");assert.equal(r.status,403);
r=await request("/api/admin/image/catalog",{headers:{"x-silkdle-admin-key":ADMIN_KEY}});assert.equal(r.status,200);d=await r.json();assert.ok(d.entries.some(x=>x.id==="mob_mangyang"));
const uploaded=await request("/api/admin/image/import",{method:"POST",headers,body:JSON.stringify({catalogId:"mob_mangyang",answer:"Sample Mangyang",aliases:["Mangyang CI"],category:"mob",world:"Chinese",region:"Jangan",mime:"image/png",data:png.toString("base64"),sourceUrl:"CI synthetic image",rightsNote:"CI synthetic reference for integration test"})});assert.equal(uploaded.status,201,await uploaded.text().catch(()=>"" ));
const image=await uploaded.clone().json();assert.equal(image.status,"pending");
r=await request("/api/image/file/"+image.id);assert.equal(r.status,404,"pending media must remain private");
r=await request("/api/admin/image/"+image.id+"/approve",{method:"POST",headers,body:JSON.stringify({confirm:true,rightsBasis:"written_permission",rightsNote:"CI synthetic image explicitly authorized only for testing"})});assert.equal(r.status,200);d=await r.json();assert.equal(d.status,"approved");
r=await request("/api/image/file/"+image.id);assert.equal(r.status,200);assert.equal(r.headers.get("content-type"),"image/png");assert.ok((await r.arrayBuffer()).byteLength>100);
r=await request("/api/image/practice/start",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({category:"mob",world:"Chinese"})});assert.equal(r.status,200);const cookie=r.headers.get("set-cookie").split(";")[0];d=await r.json();assert.ok(d.image.includes(image.id));assert.ok(!("answer" in d));
const cHeaders={"content-type":"application/json",cookie};
r=await request("/api/image/practice/guess",{method:"POST",headers:cHeaders,body:JSON.stringify({guess:"Wrong Guess"})});assert.equal(r.status,200);d=await r.json();assert.equal(d.finished,false);assert.equal(d.wrong,1);assert.equal(d.opened,.025);
r=await request("/api/image/practice/guess",{method:"POST",headers:cHeaders,body:JSON.stringify({guess:"Mangyang CI"})});assert.equal(r.status,200);d=await r.json();assert.equal(d.finished,true);assert.equal(d.correct,true);assert.equal(d.answer,"Sample Mangyang");
r=await request("/api/admin/image/"+image.id+"/revoke",{method:"POST",headers,body:"{}"});assert.equal(r.status,200);
r=await request("/api/image/file/"+image.id);assert.equal(r.status,404,"revoked image must disappear");
});
