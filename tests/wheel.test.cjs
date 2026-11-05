'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'The application must have an inline JavaScript module');

function boot(){
 const elements={},store={};
 const el=(selector)=>elements[selector]??={
  innerHTML:'',value:'',textContent:'',
  classList:{add(){},remove(){},toggle(){}},
  click(){this.onclick?.();}
 };
 const document={
  querySelector(s){return s.startsWith('#')?el(s):null;},
  querySelectorAll(s){
   const target=el('#root').innerHTML;
   let htmlMatcher,attr;
   if(s==='[data-balance-base]'){
     htmlMatcher=/<input\b[^>]*data-balance-base="[^"]+"[^>]*>/g;
     attr='balanceBase';
   }else if(s==='[data-set-compare]'){
     htmlMatcher=/<select\b[^>]*data-set-compare="[^"]+"[^>]*>[\s\S]*?<\/select>/g;
     attr='setCompare';
   }else return [];
   return [...target.matchAll(htmlMatcher)].map(match=>{
    const text=match[0],key=text.match(/data-(?:balance-base|set-compare)="([^"]+)"/)[1];
    const value=text.match(/value="([^"]*)"/)?.[1]??'';
    return {dataset:{[attr]:key},value};
   });
  },
  createElement(tag){return {tagName:tag,style:{},remove(){},click(){},append(){},select(){}};},
  body:{append(){}}
 };
 const localStorage={
  getItem(key){return store[key]??null;},
  setItem(key,value){store[key]=String(value);}
 };
 const sandbox={
  document,localStorage,window:{print(){}},
  prompt:()=>'Teszt SET',confirm:()=>true,alert:()=>{},
  setTimeout:()=>0,clearTimeout:()=>{},
  Blob:class Blob{},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}}
 };
 vm.createContext(sandbox);
 vm.runInContext(script+`
;globalThis.hooks={
 state:()=>S,html:()=>document.querySelector('#root').innerHTML,
 save,paint,createSet,selectSet,recordWheelSnapshot,
 wheelHistoryStats,wheelComparison,optimizedLinePlan,balanceTargetAdvice,
 getSetComparison,balanceThreshold,noteBackupExport,backupReminderState
};`,sandbox,{timeout:5000});
 return {hooks:sandbox.hooks,document,store};
}

test('initial UI includes all six feature areas',()=>{
 const {hooks}=boot(),rendered=hooks.html();
 for(const term of [
  'SET-optimalizáló','120% Balance célsegéd','JSON biztonsági mentés',
  'Régi/új Wheel összehasonlítás','SET-ek összehasonlítása',
  'Wheel-pörgetések naplója'
 ]) assert.ok(rendered.includes(term),term);
});

test('Balance fixed 90 CAP and computed 120 CAP thresholds',()=>{
 const {hooks}=boot();
 assert.equal(hooks.balanceThreshold(90).phy,505);
 assert.equal(hooks.balanceThreshold(90).mag,466);
 assert.equal(hooks.balanceThreshold(120).phy,661);
 assert.equal(hooks.balanceThreshold(120).mag,610);
 assert.equal(hooks.balanceThreshold(120).source,'képlet');
});

test('journal, current-vs-saved Wheel and target guidance',()=>{
 const {hooks}=boot(),s=hooks.state();
 const o=s.sets[90].shoulder;
 o.count=2;o.target=2;o.rows=[
  {type:'STR',value:5,modelMax:11},
  {type:'INT',value:4,modelMax:11}
 ];
 s.balanceBases[90]={str:485,int:450};
 hooks.save();hooks.paint();
 assert.equal(hooks.balanceTargetAdvice().out.STR.missing,15);
 assert.equal(hooks.balanceTargetAdvice().out.INT.missing,12);
 assert.equal(hooks.optimizedLinePlan('STR').remaining,9);
 hooks.recordWheelSnapshot('shoulder',o,new Date('2026-11-05T09:00:00Z'));
 o.rows[0].value=11;hooks.save();hooks.paint();
 assert.equal(hooks.wheelComparison('shoulder').delta.str,6);
 hooks.recordWheelSnapshot('shoulder',o,new Date('2026-11-05T10:00:00Z'));
 assert.equal(hooks.wheelHistoryStats('shoulder').count,2);
 assert.equal(hooks.wheelHistoryStats('shoulder').improvements,1);
 assert.equal(o.history[0].rows[0].value,5,'earlier snapshot must remain unchanged');
});

test('two SETs retain separate base stats and can be compared',()=>{
 const {hooks}=boot(),s=hooks.state(),first=s.setBank[90].activeId;
 const shoulder=s.sets[90].shoulder;
 shoulder.count=1;shoulder.target=1;shoulder.rows=[{type:'STR',value:8,modelMax:11}];
 s.balanceBases[90]={str:475,int:445};
 hooks.save();
 hooks.createSet(false);
 assert.equal(s.setBank[90].entries.length,2);
 assert.equal(s.balanceBases[90].str,'');
 const comparison=hooks.getSetComparison();
 assert.ok(comparison);
 assert.equal(comparison.left.stats,0);
 assert.equal(comparison.right.stats,8);
 hooks.selectSet(first);
 assert.equal(s.balanceBases[90].str,475);
 assert.equal(s.sets[90].shoulder.rows[0].value,8);
});

test('offline JSON export reminder uses seven-day cutoff',()=>{
 const {hooks,store}=boot();
 const t=Date.parse('2026-11-05T10:00:00Z');
 assert.equal(hooks.backupReminderState(t).due,true);
 hooks.noteBackupExport(new Date(t));
 assert.equal(hooks.backupReminderState(t+6*86400000).due,false);
 assert.equal(hooks.backupReminderState(t+7*86400000).due,true);
 assert.match(store['sailor-wheel-json-export-meta-v1'],/lastExportAt/);
});
