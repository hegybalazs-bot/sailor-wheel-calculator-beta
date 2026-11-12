"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

test("Expert question bank is valid and contains meaningful Veteran/Legend content",()=>{
 const src=fs.readFileSync(path.join(__dirname,"..","hard-quiz.js"),"utf8");
 const ctx={window:{}};
 vm.runInNewContext(src,ctx,{timeout:1000,filename:"hard-quiz.js"});
 const pools=ctx.window.SILKDLE_HARD_QUIZ;
 assert.ok(pools);
 for(const [name,items] of Object.entries(pools)){
  assert.ok(items.length>=15,name+" should not be a tiny demo bank");
  const seen=new Set();
  for(const q of items){
   assert.ok(["Chinese","European","all"].includes(q.w),q.hu);
   assert.ok(q.hu.length>15&&q.en.length>15,"Both translations needed");
   assert.equal(q.o.length,4,q.hu);
   assert.ok(Number.isInteger(q.a)&&q.a>=0&&q.a<=3,q.hu);
   assert.equal(new Set(q.o.map(v=>v.toLocaleLowerCase())).size,4,q.hu);
   assert.ok(!seen.has(q.hu),"Duplicate question "+q.hu);
   if(q.o_en)assert.equal(q.o_en.length,4,q.hu);
   seen.add(q.hu);
  }
 }
});
test("Quiz defaults to Legend, separate daily key, and progressively gated hints",()=>{
 const src=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 assert.match(src,/id="difficulty"/);
 assert.match(src,/difficulty="legend"/);
 assert.match(src,/SILKDLE_HARD_QUIZ/);
 assert.match(src,/date\(\),world,difficulty,mode/);
 assert.match(src,/n>=3\?target\.clue/);
 const js=src.match(/<script>\s*([\s\S]*?)<\/script>/);
 assert.ok(js,"main game script not found");
 assert.doesNotThrow(()=>new Function(js[1]));
});
test("Image challenges start at 1% visibility and require free text",()=>{
 const src=fs.readFileSync(path.join(__dirname,"..","race.js"),"utf8");
 assert.match(src,/grid-template-columns:repeat\(10,1fr\)/);
 assert.match(src,/length:100/);
 assert.match(src,/function typedAnswer/);
 assert.doesNotMatch(src,/choose\(right,puzzle\.choices\)/);
 assert.doesNotThrow(()=>new Function(src));
});
