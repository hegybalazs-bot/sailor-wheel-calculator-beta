'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'The application must have an inline JavaScript module');

const plain=html=>html.replace(/<[^>]*>/g,'');
function boot(){
 const elements={},store={},inputs={};
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
   if(s==='[data-balance-field]'){
     htmlMatcher=/<input\b[^>]*data-balance-field="[^"]+"[^>]*>/g;
     attr='balanceField';
   }else if(s==='[data-set-compare]'){
     htmlMatcher=/<select\b[^>]*data-set-compare="[^"]+"[^>]*>[\s\S]*?<\/select>/g;
     attr='setCompare';
   }else return [];
   const found=[...target.matchAll(htmlMatcher)].map(match=>{
    const text=match[0],key=text.match(/data-(?:balance-field|set-compare)="([^"]+)"/)[1];
    const value=text.match(/value="([^"]*)"/)?.[1]??'';
    return {dataset:{[attr]:key},value};
   });
   inputs[s]=found;return found;
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
 getSetComparison,balanceThreshold,balanceMetrics,qualifiedWheelStats,blueTypesFor,blueCatalogKey,BLUE_BASE,setBlueTypes,resetBlueTypes,blueCatalogWarnings,blueCatalogPanel,blueTypeCountPanel,visiblePlanTypes,chanceWeightsFor,ensureChanceWeights,chancesComplete,rowMax,penOneBlueEstimate,keepOrRerollAdvice,keepOrRerollPanel,validUserIconData,setUserIcon,clearUserIcon,userIconPanel,uiIcon,itemLabel,statLabel,itemList,editPanel,autoWheelEstimate,autoWheelChancePanel,chanceView,shellCards,parryWheelOverview,parryWheelOverviewCell,overviewValidWheelStats,overviewItemView,overviewSummary,overviewTable,check,total,noteBackupExport,backupReminderState
};`,sandbox,{timeout:5000});
 return {hooks:sandbox.hooks,document,store,inputs};
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

test('v4.9: invalid or over-maximum STR/INT never increase SET or Balance',()=>{
 const {hooks}=boot(),s=hooks.state(),o=s.sets[90].shoulder;
 o.count=3;o.target=3;o.rows=[
  {type:'STR',value:5,modelMax:11},
  {type:'STR',value:99,modelMax:11},
  {type:'INT',value:4.5,modelMax:11}
 ];
 s.balanceBases[90]={str:400,int:400};hooks.save();hooks.paint();
 assert.equal(hooks.qualifiedWheelStats(o).str,5);
 assert.equal(hooks.qualifiedWheelStats(o).int,0);
 assert.equal(hooks.qualifiedWheelStats(o).excluded,2);
 assert.equal(hooks.total().str,5);
 assert.equal(hooks.balanceMetrics().str,405);
 assert.equal(hooks.balanceMetrics().int,400);
 assert.ok(hooks.check('shoulder').issues.some(x=>x.includes('maximum')));
 assert.ok(hooks.check('shoulder').issues.some(x=>x.includes('egész szám')));
 assert.equal(hooks.recordWheelSnapshot('shoulder',o),null,'invalid snapshot must not be added');
 assert.match(hooks.html(),/2 hibás vagy maximumot túllépő/);
});

test('v4.9: character level changes fixed Balance goal independently of CAP',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.balanceBases[90]={level:80,str:453,int:418,extraStr:'',extraInt:''};
 hooks.save();hooks.paint();
 const b=hooks.balanceMetrics();
 assert.equal(s.cap,90);
 assert.equal(b.level,80);
 assert.equal(b.refPhy,453);
 assert.equal(b.refMag,418);
 assert.equal(b.phy,120);
 assert.equal(b.mag,120);
 assert.match(hooks.html(),/80\. szint/);
 assert.match(hooks.html(),/120% cél: 453 STR/);
 assert.match(hooks.html(),/120% cél: 418 INT/);
});

test('v4.9: extra non-Wheel bonus is included once, and observed percentage is only compared',()=>{
 const {hooks}=boot(),s=hooks.state(),o=s.sets[90].shoulder;
 o.count=2;o.rows=[{type:'STR',value:10,modelMax:11},{type:'INT',value:6,modelMax:11}];
 s.balanceBases[90]={str:490,int:450,extraStr:5,extraInt:10,observedPhy:116.5,observedMag:117.2};
 hooks.save();hooks.paint();
 const b=hooks.balanceMetrics();
 assert.equal(b.gearSTR,10);
 assert.equal(b.extraSTR,5);
 assert.equal(b.str,505);
 assert.equal(b.int,466);
 assert.equal(b.phy,120);
 assert.equal(b.mag,120);
 assert.ok(hooks.html().includes('Játékban látott:'));
 assert.ok(hooks.html().includes('Eltérés (számolt'));
 assert.ok(hooks.html().includes('Egyéb: +5'));
 assert.equal(hooks.balanceTargetAdvice().out.STR.target,505,'must use STR goal, not Balance percent');
});

test('v4.9: responsive navigation and inputs persist with strict validation',()=>{
 const {hooks,inputs}=boot(),s=hooks.state();
 const navigation=hooks.html();
 assert.match(navigation,/id="wheel-items"/);
 assert.match(navigation,/href="#wheel-balance"/);
 assert.match(navigation,/id="wheel-optimize"/);
 assert.match(navigation,/id="wheel-compare"/);
 const field=key=>inputs['[data-balance-field]'].find(el=>el.dataset.balanceField===key);
 assert.equal(typeof field('level')?.onchange,'function');
 field('level').value='80';field('level').onchange();
 assert.equal(s.balanceBases[90].level,80);
 field('extraStr').value='5';field('extraStr').onchange();
 assert.equal(s.balanceBases[90].extraStr,5);
 field('observedMag').value='117.2';field('observedMag').onchange();
 assert.equal(s.balanceBases[90].observedMag,117.2);
 field('level').value='999';field('level').onchange();
 assert.equal(s.balanceBases[90].level,80,'invalid level must not overwrite valid level');
 field('observedPhy').value='121';field('observedPhy').onchange();
 assert.equal(s.balanceBases[90].observedPhy??'','');
 assert.match(hooks.html(),/Játékban látott Magical Balance/);
});

test('v4.9: separate SETs preserve observed and extra values on switching',()=>{
 const {hooks}=boot(),s=hooks.state(),before=s.setBank[90].activeId;
 s.balanceBases[90]={str:400,int:410,extraStr:7,observedMag:111.8,level:90};
 hooks.save();
 hooks.createSet(false);
 assert.equal(s.balanceBases[90].str,'');
 hooks.selectSet(before);
 assert.equal(s.balanceBases[90].extraStr,7);
 assert.equal(s.balanceBases[90].observedMag,111.8);
 assert.equal(s.balanceBases[90].level,90);
});

test('v4.9: valid non-scored Durability/Other rows can still be journaled',()=>{
 const {hooks}=boot(),o=hooks.state().sets[90].shoulder;
 o.count=2;o.rows=[{type:'DUR',value:120},{type:'OTHER',value:''}];
 const saved=hooks.recordWheelSnapshot('shoulder',o,new Date('2026-11-05T09:00:00Z'));
 assert.ok(saved,'the manual journal should allow non-scored but complete outcomes');
 assert.equal(o.history.length,1);
 assert.equal(saved.count,2);
});

test('v4.9.1: 90 CAP / 90 LVL reference appears automatically without guessing naked stats',()=>{
 const {hooks,inputs}=boot(),s=hooks.state();
 assert.equal(s.cap,90);
 const b=hooks.balanceMetrics();
 assert.equal(b.level,90);
 assert.equal(b.refPhy,505);
 assert.equal(b.refMag,466);
 assert.equal(b.maxStat,388);
 assert.equal(b.nakedPhy,null);
 assert.equal(b.nakedMag,null);
 const html=hooks.html();
 assert.match(html,/Balance-kisokos: 90 CAP \/ 90 LVL/);
 assert.match(html,/505 STR/);
 assert.match(html,/466 INT/);
 assert.match(html,/MaxStat a képletben/);
 assert.match(html,/ruha nélküli alapstatjai/);
 assert.match(html,/Ruha nélkül/);
 const level=inputs['[data-balance-field]'].find(x=>x.dataset.balanceField==='level');
 assert.equal(level.value,'90','the level field must show its automatic CAP fallback');
 assert.equal(s.balanceBases[90]?.str??'','');
 assert.equal(s.balanceBases[90]?.int??'','');
});
test('v4.9.1: naked and geared Balance use distinct totals',()=>{
 const {hooks}=boot(),s=hooks.state(),obj=s.sets[90].shoulder;
 obj.count=2;obj.rows=[{type:'STR',value:5,modelMax:11},{type:'INT',value:4,modelMax:11}];
 s.balanceBases[90]={str:450,int:400,extraStr:10,extraInt:5};
 hooks.save();hooks.paint();
 const b=hooks.balanceMetrics();
 assert.equal(b.nakedSTR,450);
 assert.equal(b.nakedINT,400);
 assert.equal(b.gearSTR,5);
 assert.equal(b.gearINT,4);
 assert.equal(b.extraSTR,10);
 assert.equal(b.extraINT,5);
 assert.equal(b.str,465);
 assert.equal(b.int,409);
 assert.ok(b.phy>b.nakedPhy);
 assert.ok(b.mag>b.nakedMag);
 assert.match(hooks.html(),/Felszereléssel számolt teljes STR/);
 assert.match(hooks.html(),/Ruha nélkül:/);
});
test('v4.9.1: CAP change updates mini-guide, level override still works',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.cap=100;hooks.paint();
 let b=hooks.balanceMetrics();
 assert.equal(b.level,100);
 assert.equal(b.refPhy,557);
 assert.equal(b.refMag,514);
 assert.equal(b.maxStat,428);
 assert.match(hooks.html(),/Balance-kisokos: 100 CAP \/ 100 LVL/);
 s.balanceBases[100]={level:90,str:'',int:''};hooks.paint();
 b=hooks.balanceMetrics();
 assert.equal(b.level,90);
 assert.equal(b.refPhy,505);
 assert.equal(b.refMag,466);
 assert.match(hooks.html(),/Balance-kisokos: 100 CAP \/ 90 LVL/);
 s.cap=120;hooks.paint();
 b=hooks.balanceMetrics();
 assert.equal(b.level,120);
 assert.equal(b.refPhy,661);
 assert.equal(b.refMag,610);
 assert.equal(b.source,'képlet');
});

test('v4.9.2: Parry from Wheel rows is shown in final SET overview',()=>{
 const {hooks}=boot(),s=hooks.state(),item=s.sets[90].shoulder;
 item.count=3;item.rows=[
  {type:'STR',value:5,modelMax:11},
  {type:'PARRY',value:32,modelMax:40},
  {type:'INT',value:4,modelMax:11}
 ];
 hooks.save();hooks.paint();
 const p=hooks.parryWheelOverview(item);
 assert.equal(p.best,32);
 assert.equal(p.max,40);
 assert.equal(p.quality,80);
 assert.equal(p.count,1);
 const table=hooks.overviewTable();
 assert.match(plain(table.match(/<thead>[\s\S]*?<\/thead>/)?.[0]??''),/Parry Rate/);
 assert.doesNotMatch(table,/<th>Parry külön/);
 const row=table.match(/data-overview-row="shoulder"[\s\S]*?<\/tr>/)?.[0];
 assert.ok(row,'shoulder row missing');
 assert.match(row,/\+32 \/ \+40 \(80%\)/);
 assert.match(row,/Wheel:<\/b> \+32 \/ \+40/);
 assert.doesNotMatch(row,/Kézi:/,'unused manual field must not create a duplicate Parry value');
});

test('v4.9.2: manually entered Parry and Wheel Parry are separate, not added',()=>{
 const {hooks}=boot(),s=hooks.state(),item=s.sets[90].hands;
 item.count=1;item.rows=[{type:'PARRY',value:33,modelMax:50}];
 item.bonusStats.PARRY=35;
 hooks.save();hooks.paint();
 const row=hooks.overviewTable().match(/data-overview-row="hands"[\s\S]*?<\/tr>/)?.[0];
 assert.ok(row);
 assert.match(row,/\+33 \/ \+50 \(66%\)/);
 assert.match(row,/Kézi:<\/b> \+35 \/ \+40 \(87[,.]5%\)/);
 assert.doesNotMatch(row,/\+68 \/ /,'manual and Wheel Parry must not be summed');
});

test('v4.9.2: multi-line Parry uses best valid row maximum; invalid values are warned',()=>{
 const {hooks}=boot(),s=hooks.state(),obj=s.sets[90].head;
 obj.count=3;obj.rows=[
  {type:'PARRY',value:25,modelMax:40},
  {type:'PARRY',value:39,modelMax:50},
  {type:'PARRY',value:99,modelMax:40}
 ];
 let p=hooks.parryWheelOverview(obj);
 assert.equal(p.count,3);
 assert.equal(p.validCount,2);
 assert.equal(p.best,39);
 assert.equal(p.max,50);
 assert.equal(p.quality,78);
 assert.match(hooks.parryWheelOverviewCell(obj),/\+39 \/ \+50 \(78%\)/);
 assert.match(hooks.parryWheelOverviewCell(obj),/⚠/);
 obj.rows=[{type:'PARRY',value:99,modelMax:40}];obj.count=1;
 p=hooks.parryWheelOverview(obj);
 assert.equal(p.best,null);
 assert.match(hooks.parryWheelOverviewCell(obj),/Hibás sor/);
});

test('v4.9.4: 9 headers align with row cells and Parry does not duplicate',()=>{
 const {hooks}=boot();
 const html=hooks.overviewTable();
 const thead=html.match(/<thead>([\s\S]*?)<\/thead>/)?.[1]??'';
 const headerCount=(thead.match(/<th>/g)||[]).length;
 assert.equal(headerCount,9);
 assert.equal([...thead.matchAll(/<th>[\s\S]*?<\/th>/g)].filter(m=>plain(m[0]).trim()==='Parry Rate').length,1,'one visible Parry header');
 for(const name of ['shoulder','hands','weapon']){
  const row=html.match(new RegExp('data-overview-row="'+name+'"[\\s\\S]*?<\\/tr>'))?.[0];
  assert.ok(row,name+' row must exist');
  assert.equal((row.match(/<td\b/g)||[]).length,headerCount,name+' cells must align with headers');
 }
});

test('v4.9.3: Wheel-only, manual-only and both display in one Parry cell',()=>{
 const {hooks}=boot(),s=hooks.state();
 const shoulder=s.sets[90].shoulder;shoulder.count=1;
 shoulder.rows=[{type:'PARRY',value:20,modelMax:40}];
 const hands=s.sets[90].hands;hands.count=0;
 hands.bonusStats.PARRY=25;
 const chest=s.sets[90].chest;chest.count=1;
 chest.rows=[{type:'PARRY',value:30,modelMax:40}];
 chest.bonusStats.PARRY=35;
 hooks.save();
 const table=hooks.overviewTable();
 const row=name=>table.match(new RegExp('data-overview-row="'+name+'"[\\s\\S]*?<\\/tr>'))?.[0];
 assert.match(row('shoulder'),/Wheel:<\/b> \+20 \/ \+40 \(50%\)/);
 assert.doesNotMatch(row('shoulder'),/Kézi:/);
 assert.match(row('hands'),/Kézi:<\/b> \+25 \/ \+40 \(62[,.]5%\)/);
 assert.doesNotMatch(row('hands'),/Wheel:<\/b>/);
 assert.match(row('chest'),/Wheel:<\/b> \+30 \/ \+40 \(75%\)/);
 assert.match(row('chest'),/Kézi:<\/b> \+35 \/ \+40 \(87[,.]5%\)/);
 assert.equal((row('chest').match(/<td\b/g)||[]).length,9);
});

test('v4.9.4: desktop table and mobile cards cover the same 12 items',()=>{
 const {hooks}=boot();
 const html=hooks.overviewTable();
 const desktop=(html.match(/data-overview-row="/g)||[]).length;
 const mobile=(html.match(/data-overview-card="/g)||[]).length;
 assert.equal(desktop,12);
 assert.equal(mobile,12);
 assert.match(plain(html.match(/<thead>[\s\S]*?<\/thead>/)?.[0]??''),/STR \/ INT/);
 assert.match(plain(html.match(/<thead>[\s\S]*?<\/thead>/)?.[0]??''),/Parry Rate/);
 assert.match(plain(html.match(/<thead>[\s\S]*?<\/thead>/)?.[0]??''),/Rate: AR \/ BR \/ Crit/);
 assert.match(html,/class="overview-cards"/);
 assert.match(html,/Mutasd a többi statot/);
 assert.match(html,/SET statösszesítés/);
});

test('v4.9.4: separate validated Wheel and manual stat totals without duplicate HP/MP',()=>{
 const {hooks}=boot(),s=hooks.state(),shoulder=s.sets[90].shoulder,hands=s.sets[90].hands;
 shoulder.count=6;shoulder.rows=[
  {type:'STR',value:5,modelMax:11},
  {type:'INT',value:4,modelMax:11},
  {type:'AR',value:20,modelMax:40},
  {type:'BR',value:80,modelMax:100},
  {type:'CRIT',value:3,modelMax:3},
  {type:'AR',value:99,modelMax:40}
 ];
 hands.count=3;hands.rows=[
  {type:'HP',value:500,modelMax:600},
  {type:'MP',value:450,modelMax:600},
  {type:'PARRY',value:20,modelMax:40}
 ];
 hands.bonusStats.HP=300;
 hands.bonusStats.MP=200;
 hands.bonusStats.PARRY=30;
 const shield=s.sets[90].shield;shield.count=1;shield.rows=[{type:'STR',value:11,modelMax:11}];
 hooks.save();hooks.paint();
 const stats=hooks.overviewSummary(['shoulder','hands','shield'].map(id=>hooks.overviewItemView(id)));
 assert.equal(stats.str,5,'unused spear shield must not add STR');
 assert.equal(stats.int,4);
 assert.equal(stats.ar,20,'invalid AR 99/40 should not be counted');
 assert.equal(stats.br,80);
 assert.equal(stats.crit,1);
 assert.equal(stats.hpWheel,500);
 assert.equal(stats.mpWheel,450);
 assert.equal(stats.hpManual,300);
 assert.equal(stats.mpManual,200);
 assert.equal(stats.parryLines,1);
 assert.equal(stats.invalid,1,'invalid rate roll excluded and flagged');
 const row=hooks.overviewTable().match(/data-overview-row="hands"[\s\S]*?<\/tr>/)?.[0];
 assert.ok(row);
 assert.match(row,/Wheel:<\/b> \+20 \/ \+40 \(50%\)/);
 assert.match(row,/Kézi:<\/b> \+30 \/ \+40 \(75%\)/);
 assert.match(plain(row),/HP \+300 \/ \+600 \(50%\)/);
 assert.doesNotMatch(row,/\+800 \/ /);
});

test('v4.9.4: custom row ceilings and CAP reference change remain consistent',()=>{
 const {hooks}=boot(),s=hooks.state(),shoulder=s.sets[90].shoulder;
 shoulder.count=2;
 shoulder.rows=[{type:'PARRY',value:33,modelMax:50},{type:'AR',value:45,modelMax:60}];
 shoulder.bonusStats.PARRY=38;
 hooks.save();hooks.paint();
 let item=hooks.overviewItemView('shoulder');
 assert.equal(item.extra.totals.PARRY.sum,33);
 assert.equal(item.extra.totals.AR.sum,45);
 assert.equal(hooks.parryWheelOverview(shoulder).max,50);
 const first=hooks.overviewTable().match(/data-overview-row="shoulder"[\s\S]*?<\/tr>/)?.[0];
 assert.ok(first);
 assert.match(first,/\+33 \/ \+50 \(66%\)/);
 assert.match(first,/\+38 \/ \+40 \(95%\)/);
 assert.match(plain(first),/AR: \+45/);
 s.cfg[90].maxPARRY=60;
 hooks.paint();
 const second=hooks.overviewTable().match(/data-overview-row="shoulder"[\s\S]*?<\/tr>/)?.[0];
 assert.match(second,/Kézi:<\/b> \+38 \/ \+60 \(63[,.]3%\)/);
 assert.match(second,/Wheel:<\/b> \+33 \/ \+50 \(66%\)/);
});

test('v4.9.4: out-of-model manual values are flagged rather than inflating totals',()=>{
 const {hooks}=boot(),s=hooks.state(),hands=s.sets[90].hands;
 hands.count=1;hands.rows=[{type:'HP',value:400,modelMax:600}];
 hands.bonusStats.HP=999; // model cap for 90 is 600
 hooks.save();hooks.paint();
 const summary=hooks.overviewSummary(['hands'].map(id=>hooks.overviewItemView(id)));
 assert.equal(summary.hpWheel,400);
 assert.equal(summary.hpManual,0,'invalid manual over-cap must not inflate estimated SET totals');
 assert.match(hooks.overviewTable(),/\+999 \/ \+600 \(166[,.]5%\) ⚠/);
});

test('v4.9.4: missing HP/MP/Rate data show a dash instead of pretend +0',()=>{
 const {hooks}=boot();
 const summary=hooks.overviewSummary(['shoulder','hands'].map(id=>hooks.overviewItemView(id)));
 assert.equal(summary.hpWheelCount,0);
 assert.equal(summary.hpManualCount,0);
 assert.equal(summary.arCount,0);
 const overview=hooks.overviewTable();
 assert.match(plain(overview),/HP \/ MP Wheel— \/ —/);
 assert.match(plain(overview),/HP \/ MP kézi— \/ —/);
 assert.match(plain(overview),/Attack \/ Block— \/ —/);
});

test('v4.9.5: all six armor slots use 9DG Garment-inspired original icons and retain text',()=>{
 const {hooks}=boot();
 const cases=[
  ['shoulder','Shoulder','Mad Sky Storm Talisman'],
  ['hands','Hands','Mad Sky Storm Wristlet'],
  ['foot','Foot','Mad Sky Storm Shoes'],
  ['head','Head','Mad Sky Storm Hat'],
  ['chest','Chest','Mad Sky Storm Suit'],
  ['legs','Legs','Mad Sky Storm Trousers']
 ];
 const html=hooks.itemList();
 for(const [key,label,reference] of cases){
  const block=hooks.itemLabel(key);
  assert.match(block,/class="sro-item-label"/);
  assert.match(block,/<svg/);
  assert.match(block,new RegExp(reference));
  assert.ok(plain(block).includes(label));
  assert.ok(html.includes(block),'The item list must show the item icon + readable name');
 }
 for(const key of ['necklace','earring','ring1','ring2','weapon','shield']){
  assert.match(hooks.itemLabel(key),/<svg/);
  assert.match(hooks.itemLabel(key),/sro-ornament/);
  assert.doesNotMatch(hooks.itemLabel(key),/Mad Sky Storm/,'accessories and weapons are not Garment armor');
 }
 assert.equal((html.match(/data-item="/g)||[]).length,12);
});

test('v4.9.5: STR is red force and INT is blue mana, with text labels intact',()=>{
 const {hooks}=boot();
 const str=hooks.statLabel('STR','STR'),int=hooks.statLabel('INT','INT');
 assert.match(str,/stat-str/);
 assert.match(int,/stat-int/);
 assert.match(str,/<svg/);
 assert.match(int,/<svg/);
 assert.equal(plain(str),'STR');
 assert.equal(plain(int),'INT');
 assert.match(html, /\.sro-icon--stat\.stat-str\{color:#ff6675/);
 assert.match(html, /\.sro-icon--stat\.stat-int,\.sro-icon--stat\.stat-mp\{color:#66baff/);
 assert.match(hooks.shellCards(),/stat-str/);
 assert.match(hooks.shellCards(),/stat-int/);
});

test('v4.9.5: icon and text in desktop/mob SET overview; data are unchanged',()=>{
 const {hooks}=boot(),s=hooks.state(),o=s.sets[90].shoulder;
 o.count=2;o.rows=[{type:'STR',value:6,modelMax:11},{type:'INT',value:5,modelMax:11}];
 hooks.save();hooks.paint();
 const before=JSON.stringify(hooks.total());
 const table=hooks.overviewTable();
 const desktop=table.match(/data-overview-row="shoulder"[\s\S]*?<\/tr>/)?.[0];
 const mobile=table.match(/data-overview-card="shoulder"[\s\S]*?<\/article>/)?.[0];
 assert.ok(desktop&&mobile);
 for(const section of [desktop,mobile]){
  assert.match(section,/sro-icon--item/);
  assert.match(section,/Mad Sky Storm Talisman/);
  assert.match(section,/stat-str/);
  assert.match(section,/stat-int/);
 }
 assert.match(hooks.editPanel(),/class="item-editor-head"/);
 assert.match(hooks.editPanel(),/sro-icon--item/);
 assert.equal(JSON.stringify(hooks.total()),before);
 assert.equal(hooks.state().sets[90].shoulder.rows[0].value,6);
});

test('v4.9.6: local PNG replaces inventory illustration without altering SET stats',()=>{
 const {hooks,store}=boot(),s=hooks.state(),o=s.sets[90].shoulder;
 o.count=1;o.rows=[{type:'STR',value:6,modelMax:11}];
 const before=hooks.total().str;
 const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAA=';
 assert.equal(hooks.validUserIconData(png),true);
 assert.equal(hooks.setUserIcon('shoulder',png),true);
 assert.ok(hooks.itemLabel('shoulder').includes('sro-icon--custom'));
 assert.ok(hooks.itemLabel('shoulder').includes('<img'));
 assert.ok(hooks.itemLabel('shoulder').includes('Shoulder'));
 assert.ok(hooks.itemList().includes('sro-icon--custom'));
 assert.ok(hooks.overviewTable().includes('sro-icon--custom'));
 assert.ok(hooks.editPanel().includes('sro-icon--custom'));
 assert.equal(hooks.total().str,before);
 hooks.save();
 assert.equal(JSON.parse(store['sailor-wheel-calculator-v4']).userIcons.shoulder,png);
});

test('v4.9.6: PNG/WebP upload restrictions, clearing and labelled inputs',()=>{
 const {hooks}=boot(),png='data:image/png;base64,AAAA';
 assert.equal(hooks.setUserIcon('shoulder','data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pg=='),false);
 assert.equal(hooks.setUserIcon('invalid-slot',png),false);
 assert.equal(hooks.setUserIcon('hands','https://example.invalid/a.png'),false);
 assert.equal(hooks.setUserIcon('hands','data:image/png;base64,'+'A'.repeat(145001)),false);
 assert.equal(hooks.setUserIcon('hands',png),true);
 assert.ok(hooks.uiIcon('item','hands').includes('<img'));
 assert.equal(hooks.clearUserIcon('hands'),true);
 assert.ok(hooks.uiIcon('item','hands').includes('<svg'));
 const panel=hooks.userIconPanel();
 assert.equal((panel.match(/data-custom-icon="/g)||[]).length,12);
 assert.ok(panel.includes('Media.pk2'));
 assert.ok(panel.includes('9DG Garment'));
});

test('v4.9.6: perfect shoulder cannot improve under same-types uniform-value model',()=>{
 const {hooks}=boot(),s=hooks.state(),o=s.sets[90].shoulder;
 o.count=1;o.rows=[{type:'STR',value:11,modelMax:11}];
 hooks.save();hooks.paint();
 const e=hooks.autoWheelEstimate('shoulder');
 assert.equal(e.ready,true);
 assert.equal(e.baseQuality,100);
 assert.equal(e.better,0);
 assert.ok(e.worse>80);
 assert.ok(e.same>0&&e.same<20);
 assert.equal(e.notBetter,100);
 assert.equal(e.statBetter,0);
 for(const word of ['Javulás','Változatlan','Romlás','Nem javul','Nem valós Sailor szerveresély']){
  assert.ok(hooks.autoWheelChancePanel('shoulder').includes(word),word);
 }
 assert.ok(hooks.editPanel().includes('Minden sor értékének újrahúzása'));
 assert.ok(hooks.chanceView().includes('Minden sor értékének újrahúzása'));
});

test('v4.9.6: low-value shoulder cannot worsen and model follows changes',()=>{
 const {hooks}=boot(),s=hooks.state(),o=s.sets[90].shoulder;
 o.count=1;o.rows=[{type:'STR',value:1,modelMax:11}];
 let e=hooks.autoWheelEstimate('shoulder');
 assert.equal(e.ready,true);
 assert.equal(e.worse,0);
 assert.ok(e.better>80);
 o.rows[0].value=11;
 e=hooks.autoWheelEstimate('shoulder');
 assert.equal(e.better,0);
 assert.equal(e.notBetter,100);
 assert.ok(Math.abs(e.better+e.same+e.worse-100)<0.00001);
 o.rows[0].value='';
 assert.equal(hooks.autoWheelEstimate('shoulder').ready,false);
});

test('v4.9.6: multislot model is deterministic and keeps STR+INT comparison distinct',()=>{
 const {hooks}=boot(),s=hooks.state(),o=s.sets[90].shoulder;
 o.count=3;o.rows=[
  {type:'STR',value:6,modelMax:11},
  {type:'INT',value:7,modelMax:11},
  {type:'PARRY',value:20,modelMax:40}
 ];
 const a=hooks.autoWheelEstimate('shoulder'),b=hooks.autoWheelEstimate('shoulder');
 assert.equal(a.ready,true);
 assert.equal(a.trials,20000);
 assert.equal(a.rated,3);
 assert.equal(a.statLines,2);
 assert.equal(a.baseStats,13);
 assert.ok(a.better>0&&a.better<100);
 assert.ok(a.worse>0&&a.worse<100);
 assert.ok(Math.abs(a.better+a.same+a.worse-100)<0.00001);
 assert.equal(a.better,b.better);
 assert.equal(a.statBetter,b.statBetter);
 assert.ok(hooks.autoWheelChancePanel('shoulder').includes('típusa és száma változatlan'));
});

test('v4.9.6: incomplete and invalid item does not get invented percentages',()=>{
 const {hooks}=boot(),s=hooks.state(),o=s.sets[90].shoulder;
 assert.equal(hooks.autoWheelEstimate('shoulder').ready,false);
 o.count=2;o.rows=[{type:'STR',value:5,modelMax:11},{type:'INT',value:'',modelMax:11}];
 assert.equal(hooks.autoWheelEstimate('shoulder').ready,false);
 o.rows[1].value=99;
 assert.equal(hooks.autoWheelEstimate('shoulder').ready,false);
 o.rows=[{type:'OTHER',value:''},{type:'DUR',value:''}];
 assert.equal(hooks.autoWheelEstimate('shoulder').ready,false);
});

test('v4.9.7: distinct Blue catalog per slot, not Wheel line count',()=>{
 const {hooks}=boot();
 const expected={
  shoulder:4,hands:4,foot:4,head:6,legs:6,chest:7,
  necklace:8,earring:8,ring1:10,ring2:10,weapon:6,shield:5
 };
 for(const [id,count] of Object.entries(expected)){
  const types=hooks.blueTypesFor(id);
  assert.equal(types.length,count,id);
  assert.equal(new Set(types).size,count,id+' no duplicate blue types');
 }
 assert.ok(hooks.blueTypesFor('head').includes('HP'));
 assert.ok(!hooks.blueTypesFor('hands').includes('HP'));
 assert.ok(hooks.blueTypesFor('chest').includes('HPMP_REC'));
 assert.ok(hooks.blueTypesFor('shield').includes('CRIT_RESIST'));
 assert.ok(!hooks.blueTypesFor('shield').includes('CRIT'));
 assert.ok(hooks.blueTypesFor('ring1').includes('DISEASE'));
 assert.equal((hooks.blueTypeCountPanel().match(/data-open-blue-item="/g)||[]).length,12);
 assert.match(hooks.blueCatalogPanel('shoulder'),/4 típus/);
 assert.match(hooks.blueCatalogPanel('ring1'),/10 típus/);
 assert.match(hooks.blueCatalogPanel('ring1'),/nem a Wheel-en megjelenő sorok maximuma/);
});

test('v4.9.7: Blue overrides are CAP/Degree-specific, restorable and preserve rows',()=>{
 const {hooks,store}=boot(),s=hooks.state();
 const ob=s.sets[90].shoulder;
 ob.count=1;ob.rows=[{type:'HP',value:100,modelMax:600}];
 const preserved=JSON.stringify(ob.rows);
 assert.deepEqual(Array.from(hooks.blueCatalogWarnings('shoulder',ob)),['1. sor: HP']);
 assert.ok(hooks.blueCatalogPanel('shoulder').includes('1. sor: HP'));
 assert.equal(hooks.setBlueTypes('shoulder',['STR','INT','HP']),true);
 assert.equal(hooks.blueTypesFor('shoulder').length,3);
 assert.equal(hooks.blueCatalogWarnings('shoulder',ob).length,0);
 assert.equal(JSON.stringify(ob.rows),preserved);
 assert.ok(hooks.blueCatalogPanel('shoulder').includes('Egyedi lista aktív'));
 hooks.save();
 const exported=JSON.parse(store['sailor-wheel-calculator-v4']);
 assert.equal(exported.blueCatalogOverrides['90_9'].shoulder[2],'HP');
 s.cfg[90].degree=10;
 assert.equal(hooks.blueTypesFor('shoulder').length,4);
 s.cfg[90].degree=9;
 assert.equal(hooks.blueTypesFor('shoulder').length,3);
 s.cap=100;
 assert.equal(hooks.blueTypesFor('shoulder').length,4);
 s.cap=90;
 assert.equal(hooks.resetBlueTypes('shoulder'),true);
 assert.equal(hooks.blueTypesFor('shoulder').length,4);
 assert.equal(hooks.blueCatalogWarnings('shoulder',ob).length,1);
 assert.equal(hooks.setBlueTypes('shoulder',[]),false);
});

test('v4.9.7: catalog-aware row options keep legacy blue type without data loss',()=>{
 const {hooks}=boot(),s=hooks.state(),obj=s.sets[90].hands;
 s.active='hands';obj.count=1;obj.rows=[{type:'HP',value:100,modelMax:600}];
 hooks.paint();
 const editor=hooks.editPanel();
 assert.ok(editor.includes('data-row-type="0"'));
 assert.ok(editor.includes('value="HP" selected'));
 assert.ok(editor.includes('data-plan-type="HP"'));
 assert.ok(hooks.visiblePlanTypes('hands',obj).includes('HP'));
 assert.ok(hooks.visiblePlanTypes('hands',obj).includes('PARRY'));
 assert.ok(!hooks.visiblePlanTypes('hands',obj).includes('HPMP_REC'));
 assert.ok(hooks.blueCatalogPanel('hands').includes('HP'));
 assert.equal(obj.rows[0].value,100);
});

test('v4.9.7: one-Pen math for perfect and minimum Shoulder STR',()=>{
 const {hooks}=boot(),s=hooks.state(),obj=s.sets[90].shoulder;
 obj.count=1;obj.target=1;obj.rows=[{type:'STR',value:11,modelMax:11}];
 let estimate=hooks.penOneBlueEstimate('shoulder');
 assert.equal(estimate.ready,true);
 assert.equal(estimate.better,0);
 assert.ok(Math.abs(estimate.same-100/11)<1e-6);
 assert.ok(Math.abs(estimate.worse-1000/11)<1e-6);
 assert.equal(estimate.notBetter,100);
 assert.equal(hooks.keepOrRerollAdvice('shoulder').tone,'keep');
 obj.rows[0].value=1;
 estimate=hooks.penOneBlueEstimate('shoulder');
 assert.equal(estimate.worse,0);
 assert.ok(Math.abs(estimate.better-1000/11)<1e-6);
 assert.equal(hooks.keepOrRerollAdvice('shoulder').tone,'reroll');
 assert.match(hooks.keepOrRerollPanel('shoulder'),/Újrapörgetés mérlegelhető/);
});

test('v4.9.7: Pen changes one blue, preserves unscored DUR without false improvement',()=>{
 const {hooks}=boot(),s=hooks.state(),obj=s.sets[90].shoulder;
 obj.count=2;obj.rows=[
  {type:'STR',value:1,modelMax:11},
  {type:'DUR',value:''}
 ];
 const p=hooks.penOneBlueEstimate('shoulder');
 assert.equal(p.ready,true);
 assert.ok(Math.abs(p.better-500/11)<1e-6);
 assert.ok(Math.abs(p.same-(100/11+100)/2)<1e-6);
 assert.equal(p.worse,0);
 assert.ok(Math.abs(p.better+p.same+p.worse-100)<1e-7);
 assert.match(hooks.keepOrRerollPanel('shoulder'),/Feather Pen/);
 assert.match(hooks.keepOrRerollPanel('shoulder'),/nem igazolt Sailor szerveresély/);
});

test('v4.9.7: Pen estimate refuses missing/unsupported Blue limits',()=>{
 const {hooks}=boot(),s=hooks.state(),obj=s.sets[90].ring1;
 obj.count=1;obj.rows=[{type:'DISEASE',value:5}];
 let p=hooks.penOneBlueEstimate('ring1');
 assert.equal(p.ready,false);
 assert.match(hooks.keepOrRerollPanel('ring1'),/döntés|adat|maximum/i);
 obj.rows[0].modelMax=10;
 p=hooks.penOneBlueEstimate('ring1');
 assert.equal(p.ready,true);
 assert.ok(p.better>0&&p.worse>0);
 obj.rows=[{type:'OTHER',value:''}];
 assert.equal(hooks.penOneBlueEstimate('ring1').ready,false);
});

test('v4.9.7: a met item goal yields KEEP advice even with high improvement chance',()=>{
 const {hooks}=boot(),s=hooks.state(),obj=s.sets[90].shoulder;
 obj.count=1;obj.target=1;obj.rows=[{type:'STR',value:8,modelMax:11}];obj.goalPct=50;
 const a=hooks.keepOrRerollAdvice('shoulder');
 assert.equal(a.ready,true);
 assert.equal(a.tone,'keep');
 assert.equal(a.estimate.goalMet,true);
 assert.match(hooks.keepOrRerollPanel('shoulder'),/Inkább megtartás/);
 assert.match(hooks.chanceView(),/Megtartsam vagy újrapörgessem/);
});

test('v4.9.7: full Wheel simulation lists only the selected item Blue pool',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.active='shoulder';
 let html=hooks.chanceView();
 assert.equal((html.match(/data-prob="/g)||[]).length,4);
 assert.match(html,/data-prob="STR"/);
 assert.match(html,/data-prob="INT"/);
 assert.match(html,/data-prob="PARRY"/);
 assert.match(html,/data-prob="DUR"/);
 assert.doesNotMatch(html,/data-prob="AR"/);
 assert.doesNotMatch(html,/data-prob="CRIT"/);
 s.active='head';
 html=hooks.chanceView();
 assert.equal((html.match(/data-prob="/g)||[]).length,6);
 assert.match(html,/data-prob="HP"/);
 assert.match(html,/data-prob="MP"/);
 s.active='ring1';
 html=hooks.chanceView();
 assert.equal((html.match(/data-prob="/g)||[]).length,10);
 assert.match(html,/data-prob="DISEASE"/);
 assert.match(html,/data-prob="SLEEP"/);
 assert.match(html,/data-prob="FEAR"/);
});

test('v4.9.7: manually assumed type weights are slot-specific and must total 100',()=>{
 const {hooks,store}=boot(),s=hooks.state();
 let p=hooks.ensureChanceWeights('shoulder');
 Object.assign(p,{STR:25,INT:25,PARRY:25,DUR:25});
 assert.equal(hooks.chancesComplete(),true);
 assert.equal(hooks.chancesComplete(s.cfg[90],'shoulder'),true);
 assert.equal(hooks.chancesComplete(s.cfg[90],'head'),false);
 p.PARRY=24;
 assert.equal(hooks.chancesComplete(),false);
 p.PARRY=25;
 hooks.save();
 assert.equal(JSON.parse(store['sailor-wheel-calculator-v4']).blueChanceProfiles['90_9'].shoulder.STR,25);
 s.cfg[90].degree=10;
 assert.equal(hooks.chancesComplete(),false);
 assert.equal(hooks.ensureChanceWeights('shoulder').STR,'');
 s.cfg[90].degree=9;
 assert.equal(hooks.chancesComplete(),true);
});

test('v4.9.7: unknown status Blue maximum must be entered for positive chance weight',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.active='ring1';
 const p=hooks.ensureChanceWeights('ring1');
 for(const k of hooks.blueTypesFor('ring1'))p[k]=0;
 p.DISEASE=100;
 assert.equal(hooks.chancesComplete(),false);
 assert.match(hooks.chanceView(),/data-blue-chance-max="DISEASE"/);
 s.blueTypeMaxima={'90_9':{DISEASE:10}};
 assert.equal(hooks.rowMax('DISEASE'),10);
 assert.equal(hooks.chancesComplete(),true);
 s.blueTypeMaxima['90_9'].DISEASE=0;
 assert.equal(hooks.chancesComplete(),false);
});

test('v4.9.7: legacy global chance assumptions are not erased by per-item profiles',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.cfg[90].chances={STR:30,INT:70,AR:0,BR:0,CRIT:0,OTHER:0};
 const shoulder=hooks.ensureChanceWeights('shoulder');
 assert.equal(shoulder.STR,30);
 assert.equal(shoulder.INT,70);
 assert.equal(shoulder.PARRY,'');
 assert.equal(shoulder.DUR,'');
 shoulder.PARRY=0;shoulder.DUR=0;
 assert.equal(hooks.chancesComplete(),true);
 assert.deepEqual(JSON.parse(JSON.stringify(s.cfg[90].chances)),{STR:30,INT:70,AR:0,BR:0,CRIT:0,OTHER:0});
});

test('v4.9.7: do not recommend Feather Pen when required Blue line type/count is missing',()=>{
 const {hooks}=boot(),s=hooks.state(),ob=s.sets[90].shoulder;
 ob.count=1;ob.target=7;ob.rows=[{type:'STR',value:1,modelMax:11}];
 const p=hooks.penOneBlueEstimate('shoulder');
 assert.equal(p.ready,true);
 assert.ok(p.better>80);
 const a=hooks.keepOrRerollAdvice('shoulder');
 assert.equal(a.ready,true);
 assert.equal(a.tone,'review');
 assert.match(a.decision,/Blue-összetétel/);
 assert.match(a.reason,/Feather Pen/);
 assert.match(a.reason,/Wheel of Fortune/);
 ob.target=1;
 assert.equal(hooks.keepOrRerollAdvice('shoulder').tone,'reroll');
});
