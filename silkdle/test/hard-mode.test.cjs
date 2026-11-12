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
 assert.match(src,/function faintHint\(target,n\)/);
 assert.match(src,/APRÓ ELSŐ NYOM/);
 assert.match(src,/comparison-cells/);
 assert.match(src,/\.comparison-cell\.exact/);
 assert.match(src,/date\(\),world,difficulty,mode/);
 assert.match(src,/input\.oninput=/);
 assert.match(src,/typed\.length<2/);
 assert.doesNotMatch(src,/LEGEND: Nincs kezdő leírás/);
 const js=src.match(/<script>\s*([\s\S]*?)<\/script>/);
 assert.ok(js,"main game script not found");
 assert.doesNotThrow(()=>new Function(js[1]));
});

test("Mastery begins with a real clue and a wrong guess shows comparisons",()=>{
 const src=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const main=src.match(/<script>\s*([\s\S]*?)<\/script>/);
 assert.ok(main);
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.innerHTML="";this.textContent="";this.value="";this.className="";this.style={};this.attrs={};this.classList={toggle(){},add(){}};}
  append(...nodes){this.children.push(...nodes)}
  replaceChildren(...nodes){this.children=[...nodes]}
  setAttribute(k,v){this.attrs[k]=v}
 }
 const nodes=new Map();
 const document={
  getElementById(id){if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id)},
  createElement(tag){return new Element(tag)},
  documentElement:{lang:"hu"}
 };
 class Storage{constructor(){this.entries=new Map()}getItem(k){return this.entries.get(k)||null}setItem(k,v){this.entries.set(k,String(v))}keys(){return [...this.entries.keys()]}}
 const localStorage=new Storage();
 const hard=fs.readFileSync(path.join(__dirname,"..","hard-quiz.js"),"utf8");
 const sandbox={window:{},document,localStorage,navigator:{clipboard:{}},Intl,Date};
 vm.createContext(sandbox);
 vm.runInContext(hard,sandbox,{timeout:1000});
 vm.runInContext(main[1],sandbox,{timeout:2000});
 vm.runInContext('mode="mastery";restore()',sandbox,{timeout:1000});
 const getClue=()=>nodes.get("panel").children.find(x=>x.className==="cluebox");
 assert.ok(getClue(),"Clue box missing");
 const first=getClue().children.find(x=>x.tag==="div");
 assert.ok(first?.innerHTML.includes("fő jellege"),"Legend must show an informative archetype hint");
 const count=vm.runInContext("state.guesses.length",sandbox);
 assert.equal(count,0);
 vm.runInContext('state.guesses.push(collection().find(e=>e.name!==collection()[state.target].name).name);renderPanel()',sandbox,{timeout:1000});
 const panel=nodes.get("panel");
 const grid=panel.children.find(x=>x.className==="comparison-list");
 assert.ok(grid,"Comparison history should be shown");
 assert.ok(grid.children.length===1);
 const row=grid.children[0],cells=row.children.find(x=>x.className==="comparison-cells");
 assert.ok(cells,"Comparison cells should be shown");
 assert.match(cells.innerHTML,/comparison-cell/);
});

test("Image challenges start at 1% visibility and require free text",()=>{
 const src=fs.readFileSync(path.join(__dirname,"..","race.js"),"utf8");
 assert.match(src,/grid-template-columns:repeat\(10,1fr\)/);
 assert.match(src,/length:100/);
 assert.match(src,/function typedAnswer/);
 assert.doesNotMatch(src,/choose\(right,puzzle\.choices\)/);
 assert.doesNotThrow(()=>new Function(src));
});
