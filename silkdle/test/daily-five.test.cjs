"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),src=fs.readFileSync(path.join(root,"daily-five.js"),"utf8");
function setup(){
 const store=new Map();
 const data={
  unique:[{name:"Tiger Girl",world:"Chinese",level:20,region:"Tiger Mountain"},{name:"Uruchi",world:"Chinese",level:40,region:"Tarim Basin"}],
  mob:[{name:"Ong",world:"European",level:34,region:"Samarkand"}],
  gear:[{name:"Glavie",world:"Chinese",region:"Two-handed",detail:{hu:"Heuksal",en:"Heuksal"}}],
  mastery:[{name:"Cleric",world:"European",region:"Support",detail:{hu:"Cleric Rod",en:"Cleric Rod"}}]
 };
 const fixture={window:{SILKDLE_CORE_ITEMS:data,SILKDLE_WEB_IMAGES_V1:[{id:"preview-uruchi-render",answer:"Uruchi",world:"Chinese",category:"unique",image:"https://example.test/uruchi.png"},{id:"preview-isyutaru-render",answer:"Isyutaru",world:"Chinese",category:"unique",image:"https://example.test/isyutaru.png"}],SILKDLE_HARD_QUIZ:{veteran:[{hu:"Inventory Expansion küldetés?",en:"Inventory Expansion quest?",o:["Ong","Mangyang","Uruchi","Cerberus"],a:0}],legend:[]}},document:{documentElement:{lang:"hu"}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},location:{origin:"https://silkdle.test"},Intl,Date,Math};
 vm.runInNewContext(src,fixture,{timeout:1000,filename:"daily-five.js"});
 return {api:fixture.window.SILKDLE_DAILY_FIVE.internals,store,fixture};
}
test("Daily Five mounts five modes and accessible CSS without changing core classic integration",()=>{
 assert.doesNotThrow(()=>new Function(src));
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 assert.match(html,/daily-five\.js/);assert.match(html,/daily-five\.css/);assert.match(html,/window\.SILKDLE_CORE_ITEMS=items/);
 const race=fs.readFileSync(path.join(root,"race.js"),"utf8");
 assert.match(race,/SILKDLE_DAILY_FIVE\?\.render\(screen\)/);
 const css=fs.readFileSync(path.join(root,"daily-five.css"),"utf8");
 assert.match(css,/\.d5-cells/);assert.match(css,/@media\(max-width:560px\)/);
});
test("all five modes have real data and stable daily targets",()=>{
 const {api}=setup();assert.equal(Array.from(api.MODES).join(","),"classic,item,splash,quest,emoji");
 for(const kind of api.MODES){assert.ok(api.catalog(kind).length,"Missing content in "+kind);assert.equal(api.target(kind,false,0).name||api.target(kind,false,0).answer,api.target(kind,false,4).name||api.target(kind,false,4).answer)}
 assert.ok(api.catalog("emoji").length>=10);
 assert.equal(api.normal("  Glaive "), "glavie");
});
test("classic compare paints matching world and arrows correctly",()=>{
 const {api}=setup(),base=api.catalog("classic");
 const got=api.compare(base[0],base[1],"classic");
 assert.equal(got.length,4);
 assert.equal(got[0][2],"exact");
 assert.equal(got[3][1],"20 ↑");
 assert.equal(got[3][2],"miss");
 const near=api.compare(base[0],{...base[0],level:25},"classic");
 assert.equal(near[3][2],"partial");
});
test("a broken external Splash can advance to a different local image without changing other modes",()=>{const {api}=setup();const one=api.target("splash",false,0,0),two=api.target("splash",false,0,1);assert.notEqual(one.id,two.id);assert.equal(api.catalog("splash").length,2)});
test("progressive hint never leaks the entire answer in initial stage",()=>{
 const {api}=setup(),u=api.catalog("classic")[0];
 const initial=api.hint("classic",u,0),later=api.hint("classic",u,4);
 assert.equal(initial.length,2);assert.ok(!initial.join(" ").includes("Tiger Girl"));
 assert.ok(later.length>initial.length);assert.match(later.at(-1),/T…/);
});
test("daily results are isolated in local storage and shared without spoilers",()=>{
 const {api,store}=setup(),date=api.day();
 for(const mode of api.MODES)store.set("silkdle-daily-five-v1-"+date+":"+mode,JSON.stringify({guesses:["Wrong","Answer"],done:true,won:true,score:80}));
 const summary=api.summary();assert.equal(summary.done,5);assert.equal(summary.points,400);assert.ok(summary.streak>=1);
 const shared=api.shareText();assert.match(shared,/400\/500/);assert.match(shared,/https:\/\/silkdle\.test/);assert.ok(!shared.includes("Answer"));
});
