'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const base=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const publicHtml=fs.readFileSync(path.join(__dirname,'..','publikus.html'),'utf8');
const inline=x=>x.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
function boot(html){
 const elements={},store={};
 const el=(selector)=>elements[selector]??={
  innerHTML:'',value:'',textContent:'',
  classList:{add(){},remove(){},toggle(){}},
  click(){this.onclick?.();}
 };
 const document={
  querySelector:el,
  querySelectorAll:()=>[],
  createElement:tag=>({tagName:tag,style:{},remove(){},click(){},append(){},select(){}}),
  body:{append(){}}
 };
 const sandbox={
  document,localStorage:{getItem:key=>store[key]??null,setItem:(key,v)=>{store[key]=String(v);}},
  window:{print(){}},prompt:()=>null,confirm:()=>true,alert:()=>{},
  setTimeout:()=>0,clearTimeout:()=>{},
  Blob:class Blob{},URL:{createObjectURL:()=> 'blob:public-test',revokeObjectURL(){}}
 };
 vm.createContext(sandbox);
 vm.runInContext(inline(html)+`
;globalThis.audit={
 state:()=>S,html:()=>document.querySelector('#root').innerHTML,
 paint,setLanguage:setUiLanguage,selectedTab:()=>S.tab,
 items:()=>itemList(),renderEditor:()=>editPanel()
};`,sandbox,{timeout:7000});
 return {audit:sandbox.audit,store,document};
}

test('public calculator is its own indexable URL, not an admin preview',()=>{
 assert.match(publicHtml,/<meta name="robots" content="index,follow">/);
 assert.match(publicHtml,/<title>Silkroad Wheel Calculator – SET és Wheel kalkulátor<\/title>/);
 assert.match(publicHtml,/EMERALD · PUBLIC/);
 assert.doesNotMatch(publicHtml.slice(0,publicHtml.indexOf('<script>')),/Admin Demo|ADMIN PREVIEW/);
 assert.match(base,/href="publikus\.html"/);
 assert.match(base,/<meta name="robots" content="noindex,nofollow">/);
 assert.match(base,/ADMIN PREVIEW/);
});
test('public HTML remains a fully executable calculator with no image upload controls',()=>{
 const {audit}=boot(publicHtml),rendered=audit.html();
 assert.match(rendered,/data-workspace-go="items"/);
 assert.match(rendered,/data-row-type|Valódi Wheel-sorok száma/);
 assert.match(rendered,/id="wheel-items"/);
 assert.doesNotMatch(rendered,/id="localIconZip"|data-custom-icon|data-pick-local-icon/);
 assert.doesNotMatch(rendered,/data-icon-itemcode|data-icon-degree/);
 assert.doesNotMatch(rendered,/Admin bemutató|Admin showcase|copyReviewRequest/);
 assert.doesNotMatch(publicHtml,/id="localIconZip"|data-custom-icon="/);
 assert.match(publicHtml,/id="importFile" accept="\.json,application\/json"/,
  'JSON backup remains available and is not an image upload');
});
test('public tabs keep full Wheel, analysis and editable local math without admin controls',()=>{
 const {audit,store}=boot(publicHtml);
 const state=audit.state(),old=JSON.stringify(state.sets[state.cap].shoulder);
 state.tab='chance';audit.paint();
 assert.match(audit.html(),/Következő Wheel|Interaktív Wheel-tervezés/);
 state.tab='rules';audit.paint();
 assert.match(audit.html(),/szerverparaméterek/);
 assert.doesNotMatch(audit.html(),/data-evidence|copyReviewRequest|Sailor ikon ZIP/);
 state.tab='set';audit.paint();
 assert.match(audit.html(),/data-item="shoulder"/);
 assert.doesNotMatch(audit.html(),/data-icon-itemcode|localIconZip/);
 assert.equal(JSON.stringify(state.sets[state.cap].shoulder),old);
 assert.ok(Object.keys(store).some(k=>/wheel-calculator/.test(k)),
  'calculations save to local browser keys only');
});
test('public page retains HU/EN and never renders original art import UI',()=>{
 const {audit}=boot(publicHtml);
 assert.equal(audit.setLanguage('en'),true);
 assert.match(audit.html(),/Items \/ Wheel/);
 assert.doesNotMatch(audit.html(),/data-custom-icon|localIconZip|admin-demo|copyReviewRequest/);
 const active=audit.state();
 active.tab='rules';audit.paint();
 assert.doesNotMatch(audit.html(),/data-evidence/);
 assert.doesNotMatch(publicHtml,/name="image"|accept="image\/png|accept="\.zip,application\/zip"/);
});
