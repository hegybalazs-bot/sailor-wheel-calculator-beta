/* Playwright browser integration: local screenshots work even without a server database. */
import { chromium, firefox, webkit } from "playwright";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import path from "node:path";

const port=31800+Math.floor(Math.random()*2000),base="http://127.0.0.1:"+port,timeout=30000;
let child=null;
const pngChunk=(name,data)=>{
 const len=Buffer.alloc(4);len.writeUInt32BE(data.length);
 const kind=Buffer.from(name);
 const all=Buffer.concat([kind,data]);
 let crc=0xffffffff;for(const b of all){crc^=b;for(let j=0;j<8;j++)crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1}
 const c=Buffer.alloc(4);c.writeUInt32BE((crc^0xffffffff)>>>0);
 return Buffer.concat([len,kind,data,c])
};
function png(){
 const w=240,h=240,head=Buffer.alloc(13);head.writeUInt32BE(w,0);head.writeUInt32BE(h,4);head[8]=8;head[9]=2;
 const pixels=Buffer.alloc(h*(1+w*3));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const o=y*(1+w*3)+1+3*x;pixels[o]=x%255;pixels[o+1]=y%255;pixels[o+2]=140}
 return Buffer.concat([Buffer.from("89504e470d0a1a0a","hex"),pngChunk("IHDR",head),pngChunk("IDAT",zlib.deflateSync(pixels)),pngChunk("IEND",Buffer.alloc(0))])
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<100;i++){if(child?.exitCode!==null)throw Error("Silkdle server stopped unexpectedly");try{const r=await fetch(base+"/api/image/status");if(r.ok)return}catch{}await wait(150)}throw Error("Silkdle did not start")}
async function main(){
 child=spawn(process.execPath,[path.join(process.cwd(),"silkdle","server.cjs")],{env:{...process.env,PORT:String(port),DATABASE_URL:"",SILKDLE_ADMIN_KEY:""},stdio:"inherit"});
 await ready();
 for(const [name,driver] of [["Chromium",chromium],["Firefox",firefox],["WebKit",webkit]]){
  const browser=await driver.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1024,height:768}});
   const page=await context.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(String(e)));
   await page.goto(base+"/admin.html");
   await page.locator("#answer").fill("Uruchi");
   await page.locator("#category").selectOption("unique");
   await page.locator("#world").selectOption("Chinese");
   await page.locator("#fileInput").setInputFiles({name:"uruchi.png",mimeType:"image/png",buffer:png()});
   await page.locator("#localSave").click();
   await page.waitForFunction(()=>document.getElementById("localStatus").textContent.includes("1 sikeres"),null,{timeout});
   assert.match(await page.locator("#localStatus").innerText(),/1 sikeres/);
   assert.equal(await page.locator("#localList .item").count(),1);
   await page.goto(base+"/");
   await page.locator(".racebar button").filter({hasText:"Saját képek"}).click();
   await page.waitForSelector("#racescreen img[src^='blob:']", {timeout});
   await page.locator("#racescreen input[type=text]").fill("Uruchi");
   await page.locator("#racescreen button").filter({hasText:"Válasz beküldése"}).click();
   await page.waitForFunction(()=>document.getElementById("racescreen").textContent.includes("Megvan!"),null,{timeout});
   assert.match(await page.locator("#racescreen").innerText(),/Megvan!/);
   await page.reload();
   await page.locator(".racebar button").filter({hasText:"Saját képek"}).click();
   await page.waitForSelector("#racescreen img[src^='blob:']", {timeout});
   assert.deepEqual(errors,[],name+" JavaScript errors");
   console.log(name+": local offline PNG screenshot import → play → success → reload: PASS");
   await context.close();
  }finally{await browser.close()}
 }
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{if(child)child.kill()});
