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
 assert.match(src,/zoom-crop/);
 assert.match(src,/Math\.pow\(1-progress,4\)/);
 assert.match(src,/function typedAnswer/);
 assert.doesNotMatch(src,/choose\(right,puzzle\.choices\)/);
 assert.doesNotThrow(()=>new Function(src));
});


test("Screenshot staging manifest has unique IDs, valid categories, crop coordinates, and no fake active images",()=>{
 const dir=path.join(__dirname,"..","data"),manifest=JSON.parse(fs.readFileSync(path.join(dir,"image-manifest.json"),"utf8"));
 const pools=JSON.parse(fs.readFileSync(path.join(dir,"image-pools.json"),"utf8"));
 const rules=JSON.parse(fs.readFileSync(path.join(dir,"daily-rules.json"),"utf8"));
 assert.ok(manifest.entries.length>=200);
 assert.ok(Array.isArray(pools.categories));
 const ids=new Set();
 for(const x of manifest.entries){
  assert.ok(!ids.has(x.id),"Duplicate "+x.id);ids.add(x.id);
  assert.ok(pools.categories.includes(x.category),x.id);
  assert.ok(["Chinese","European","all"].includes(x.world),x.id);
  assert.ok(x.answer.length>=2,x.id);
  assert.ok(!x.image,"Unreviewed candidate must not pretend to have an image");
  assert.equal(x.status,"needs_image");
  assert.notEqual(x.licenseStatus,"approved");
  for(const c of x.cropPresets){
   for(const key of ["x","y","w","h"])assert.ok(c[key]>=0&&c[key]<=1,x.id+" "+key);
   assert.ok(c.x+c.w<=1.00001&&c.y+c.h<=1.00001,x.id+" crop exceeds image");
  }
 }
 assert.equal(rules.timezone,"Europe/Budapest");
 assert.deepEqual([...pools.allowedStatuses],["approved"]);
});
test("Admin UI validates MIME and backend routes remain separate",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","admin.html"),"utf8");
 const js=fs.readFileSync(path.join(__dirname,"..","gallery-admin.js"),"utf8");
 const api=fs.readFileSync(path.join(__dirname,"..","gallery.cjs"),"utf8");
 assert.match(html,/SILKDLE_ADMIN_KEY/);
 assert.match(js,/createImageBitmap/);
 assert.match(js,/admin\/image\/import/);
 assert.match(js,/admin\/image\/catalog/);
 assert.match(api,/x-silkdle-admin-key/);
 assert.match(api,/status='approved'/);
 assert.doesNotThrow(()=>new Function(js));
});

test("Online image hunt uses authentic externally sourced screenshots with source links",()=>{
 const script=fs.readFileSync(path.join(__dirname,"..","web-image-sources.js"),"utf8");
 const ctx={window:{}};
 vm.runInNewContext(script,ctx,{timeout:1000});
 const items=ctx.window.SILKDLE_WEB_IMAGES_V1;
 assert.ok(Array.isArray(items));
 assert.ok(items.length>=20,"Online source pool should meaningfully exceed four demo illustrations");
 const ids=new Set(),answers=new Set(),worlds=new Set();
 for(const x of items){
  assert.ok(x.id&&!ids.has(x.id),"Duplicate image ID: "+x.id);ids.add(x.id);
  assert.ok(x.answer.length>=3,"Nonempty answer required");
  answers.add(x.answer);worlds.add(x.world);
  assert.ok(["unique","mob","weapon","armor","location","npcquest"].includes(x.category),x.id);
  assert.ok(["Chinese","European","all"].includes(x.world),x.id);
  assert.ok(x.image.startsWith("https://"),x.id+" HTTPS image expected");
  assert.ok(x.source.startsWith("https://"),x.id+" source attribution expected");
  assert.equal(x.sourceStatus,"external_unverified_reuse_rights","No permission claim permitted");
  assert.ok(x.cropX>=0&&x.cropX<=1&&x.cropY>=0&&x.cropY<=1,x.id);
 }
 assert.ok(answers.size>=12,"Avoid dozens of trivial duplicates");
 assert.ok(worlds.has("Chinese")&&worlds.has("European"));
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const race=fs.readFileSync(path.join(__dirname,"..","race.js"),"utf8");
 assert.match(html,/web-image-sources\.js/);
 assert.match(race,/showWebCommunity\(\);return/);
 assert.match(race,/function drawWebCommunity\(\)/);
 assert.match(race,/source-linked/);
 assert.match(race,/webBroken\.add/);
 assert.match(race,/item\.source/);
});


test("GLAVIE is canonical; Glaive remains accepted as a legacy alias",()=>{
 const src=fs.readFileSync(path.join(__dirname,"..","race.js"),"utf8");
 const images=fs.readFileSync(path.join(__dirname,"..","web-image-sources.js"),"utf8");
 const ctx={window:{}};vm.runInNewContext(images,ctx,{timeout:1000});
 const weapon=ctx.window.SILKDLE_WEB_IMAGES_V1.find(x=>x.id==="glaive-1");
 assert.equal(weapon.answer,"Glavie");
 assert.ok(weapon.aliases.includes("Glaive"));
 const fn=src.match(/function matchAnswer\(a,b\)\{[^\n]+\}/);
 assert.ok(fn);
 const compare=new Function(fn[0]+";return matchAnswer;");
 assert.equal(compare()("Glavie","Glaive"),true);
 assert.equal(compare()("Glaive","Glavie"),true);
 assert.equal(compare()("Glavie","Spear"),false);
 const classic=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 assert.match(classic,/normalizedGuess=guess\.toLocaleLowerCase\(\)\.replace/);
 const api=fs.readFileSync(path.join(__dirname,"..","server.cjs"),"utf8");
 assert.match(api,/replace\(\/\\bglaive\\b\/g,"glavie"\)/);
});

test("Glaive/Glavie weapon catalog displays GLAVIE by default while retaining aliases",()=>{
 const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,"..","data","image-manifest.json"),"utf8"));
 const candidates=catalog.entries.filter(x=>x.category==="weapon"&&x.subcategory==="Glavie");
 assert.equal(candidates.length,10);
 for(const x of candidates){assert.ok(x.answer.startsWith("Glavie "));assert.ok(x.aliases.some(a=>a.startsWith("Glaive ")));}
 const src=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 assert.match(src,/name:"Glavie"/);assert.match(src,/Spear \/ Glavie/);
});
