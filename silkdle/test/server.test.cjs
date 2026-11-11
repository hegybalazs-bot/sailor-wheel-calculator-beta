"use strict";
const {test,before,after}=require("node:test");
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const path=require("node:path");
const PORT=39000+Math.floor(Math.random()*10000),URL="http://127.0.0.1:"+PORT;
let child;
async function request(route,options={}){return fetch(URL+route,options)}
async function endpoint(route,method="GET",body,cookie){const headers={};if(body!==undefined)headers["content-type"]="application/json";if(cookie)headers.cookie=cookie;const response=await request("/api"+route,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});const data=await response.json();return {response,data}}
before(async()=>{child=spawn(process.execPath,[path.join(__dirname,"..","server.cjs")],{env:{...process.env,PORT:String(PORT),DATABASE_URL:process.env.TEST_DATABASE_URL||""},stdio:["ignore","pipe","pipe"]});let log="";child.stdout.on("data",x=>log+=x);child.stderr.on("data",x=>log+=x);for(let i=0;i<90;i++){if(child.exitCode!==null)throw Error("Server exited early: "+log);try{const r=await request("/api/health");if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw Error("Timed out starting server: "+log)});
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
x=await endpoint("/race/start","POST",{},cookie);assert.equal(x.response.status,200);assert.equal(x.data.started,true);assert.ok(x.data.puzzle.image);assert.ok(!("answer" in x.data));
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
