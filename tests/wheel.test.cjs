'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
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
 state:()=>S,html:()=>document.querySelector('#root').innerHTML,translateText,translateMarkup,setUiLanguage,helpViewEnglish,promptUI,confirmUI,alertUI,validServerState,profileCaps,
 save,paint,createSet,selectSet,recordWheelSnapshot,
 wheelHistoryStats,wheelComparison,optimizedLinePlan,balanceTargetAdvice,
 getSetComparison,compareSetSlots,setSlotComparePanel,balanceThreshold,balanceMetrics,qualifiedWheelStats,chooseCap,rowValueEditor,itemBlueInventory,blueInventoryView,addServerProfile,renameServerProfile,switchServerProfile,currentServerName,exportAllProfiles,importAllProfiles,applyFixedStatLimits,switchDegreeModel,blueTypesFor,blueCatalogKey,BLUE_BASE,setBlueTypes,resetBlueTypes,blueCatalogWarnings,blueCatalogPanel,blueTypeCountPanel,visiblePlanTypes,chanceWeightsFor,ensureChanceWeights,chancesComplete,rowMax,penOneBlueEstimate,keepOrRerollAdvice,keepOrRerollPanel,validUserIconData,setUserIcon,clearUserIcon,userIconPanel,localIconLibraryPanel,localIconChoiceKey,manuallySelectedIconFor,autoIconFor,normalizeIconGender,quickItemStrip,chooseWorkspace,WORKSPACE_PANELS:()=>WORKSPACE_PANELS,workspaceActive:()=>WORKSPACE_ACTIVE,editorFolds:()=>EDITOR_FOLDS,uiIcon,itemLabel,statLabel,itemList,editPanel,iconIdentity,verifiedIconFor,verifiedWheelIconFor,wheelToolIcon,VERIFIED_ICON_ASSETS,normalizeApparelStyle,autoWheelEstimate,autoWheelChancePanel,chanceView,interactiveWheelPlanner,wheelPlannerFor,setWheelPlannerField,cleanWheelPlanner,wheelStagesPanel,wheelCostPanel,calculateCost,costPlanFor,adminDemoData,createAdminDemo,adminShowcasePanel,shareSetSnapshot,validateSharedSet,encodeSharedSet,decodeSharedSet,sharedSetPreviewPanel,evidenceFor,evidenceKey,evidencePanel,adminReviewReport,shellCards,parryWheelOverview,parryWheelOverviewCell,overviewValidWheelStats,overviewItemView,overviewSummary,overviewTable,check,total,premiumSlotMetrics,premiumSetInsights,premiumLoadoutPanel,premiumAnalyticsPanel,noteBackupExport,backupReminderState
};`,sandbox,{timeout:5000});
 return {hooks:sandbox.hooks,document,store,inputs,window:sandbox.window};
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
 assert.match(navigation,/data-workspace-go="balance"/);
 assert.match(navigation,/role="tablist"/);
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
 assert.equal(headerCount,10);
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
 assert.equal((row('chest').match(/<td\b/g)||[]).length,10);
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

test('v4.9.5: all six armor slots keep original SVG placeholders and readable text',()=>{
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
 for(const [key,label] of cases){
  const block=hooks.itemLabel(key);
  assert.match(block,/class="sro-item-label"/);
  assert.match(block,/<svg/);
  assert.match(block,/Stilizált helyettesítő/);
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
  assert.match(section,/Stilizált helyettesítő/);
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
 assert.ok(panel.includes('opcionális kézi felülbírálás'));
 assert.ok(panel.includes('minden Degree-nél felülírja'));
 assert.ok(panel.includes('data-custom-icon="hands"'));
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
 for(const word of ['Javulás','Változatlan','Romlás','Nem javul','Nem valós, igazolt szerveresély']){
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
 assert.match(hooks.keepOrRerollPanel('shoulder'),/nem igazolt szerveresély/);
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

test('v4.9.8: each configured 90–140 CAP accepts independent Wheel rows and persists',()=>{
 const {hooks,document,store}=boot();
 const caps=[90,100,110,120,125,130,140];
 for(const cap of caps){
  assert.equal(hooks.chooseCap(cap),true,'switch to '+cap);
  const s=hooks.state();
  assert.equal(s.cap,cap);
  assert.equal(document.querySelector('#capQuick').value,String(cap));
  const shoulder=s.sets[cap].shoulder;
  shoulder.count=1;shoulder.rows=[{type:'STR',value:Math.max(1,Math.min(11,Math.floor(cap/10)-7)),modelMax:20}];
  hooks.save();hooks.paint();
  assert.equal(hooks.qualifiedWheelStats(shoulder).str,Math.max(1,Math.min(11,Math.floor(cap/10)-7)));
  assert.equal(JSON.parse(store['sailor-wheel-calculator-v4']).sets[cap].shoulder.rows[0].value,Math.max(1,Math.min(11,Math.floor(cap/10)-7)));
 }
 for(const cap of caps){
  assert.equal(hooks.chooseCap(cap),true);
  assert.equal(hooks.state().sets[cap].shoulder.rows[0].value,Math.max(1,Math.min(11,Math.floor(cap/10)-7)),'CAP data must not leak or reset');
 }
});

test('v4.9.8: typeable 100/110/120/125/130/140 CAP and adding custom CAP without changing old items',()=>{
 const {hooks,document}=boot();
 const manual=document.querySelector('#capQuick'),apply=document.querySelector('#capApply');
 assert.equal(typeof apply.onclick,'function');
 assert.equal(typeof manual.onkeydown,'function');
 assert.equal(hooks.chooseCap('100'),true);
 assert.equal(hooks.chooseCap('110'),true);
 manual.value='120';apply.onclick();assert.equal(hooks.state().cap,120);
 manual.value='125';apply.onclick();assert.equal(hooks.state().cap,125);
 manual.value='130';apply.onclick();assert.equal(hooks.state().cap,130);
 manual.value='140';apply.onclick();assert.equal(hooks.state().cap,140);
 assert.equal(hooks.chooseCap('150'),true);
 assert.equal(hooks.state().cap,150);
 assert.equal(hooks.state().cfg[150].degree,9);
 assert.equal(hooks.chooseCap('90'),true);
 assert.equal(hooks.state().cfg[90].degree,9);
 assert.equal(hooks.chooseCap('200'),true);
 assert.equal(hooks.chooseCap('201'),false);
 assert.equal(hooks.chooseCap('100.5'),false);
 assert.equal(hooks.chooseCap('nope'),false);
 assert.equal(hooks.state().cap,200);
});

test('v4.9.8: fixed +11 STR/INT maxima across CAPs, preserving legacy over-cap rows as warnings',()=>{
 const {hooks,document}=boot();
 assert.equal(hooks.chooseCap(130),true);
 const s=hooks.state(),obj=s.sets[130].shoulder;
 s.cfg[130].maxSTR=45;s.cfg[130].maxINT=32;
 obj.count=2;obj.rows=[{type:'STR',value:40,modelMax:45},{type:'INT',value:30,modelMax:32}];
 hooks.save();hooks.paint();
 assert.equal(s.cfg[130].maxSTR,11);
 assert.equal(s.cfg[130].maxINT,11);
 assert.equal(hooks.check('shoulder').str,0);
 assert.equal(hooks.check('shoulder').int,0);
 assert.equal(hooks.qualifiedWheelStats(obj).stats,0);
 assert.ok(hooks.check('shoulder').issues.some(x=>x.includes('maximum 11')));
 assert.equal(obj.rows[0].value,40,'old rows retained for correction');
 assert.ok(hooks.rowValueEditor(obj.rows[0],0).includes('1–11'),'fixed ceiling must be shown in the row value selector');
 assert.ok(hooks.rowValueEditor(obj.rows[0],0).includes('határon kívül'));
 obj.rows=[{type:'STR',value:11,modelMax:45},{type:'INT',value:11,modelMax:32}];
 hooks.save();hooks.paint();
 assert.equal(hooks.qualifiedWheelStats(obj).stats,22);
 assert.equal(document.querySelector('#capQuick').value,'130');
 assert.ok(hooks.html().includes('STR (+11 fix)'));
});

test('v4.9.8: final SET overview lists every possible Blue with missing versus present markers',()=>{
 const {hooks}=boot(),s=hooks.state(),shoulder=s.sets[90].shoulder;
 shoulder.count=2;shoulder.rows=[{type:'STR',value:11,modelMax:11},{type:'PARRY',value:20,modelMax:40}];
 const data=hooks.itemBlueInventory('shoulder');
 assert.equal(data.available,4);
 assert.equal(data.present,2);
 assert.equal(data.records.length,4);
 assert.equal(data.records.find(r=>r.type==='STR').values[0],'+11 / +11 (100%)');
 assert.equal(data.records.find(r=>r.type==='PARRY').values[0],'+20 / +40 (50%)');
 assert.equal(data.records.find(r=>r.type==='INT').count,0);
 assert.equal(data.records.find(r=>r.type==='DUR').count,0);
 const table=hooks.overviewTable();
 assert.match(table,/>Összes Blue-típus<\/th>/);
 const row=table.match(/data-overview-row="shoulder"[\s\S]*?<\/tr>/)?.[0];
 assert.ok(row);
 assert.match(row,/2\/4 Blue-fajta felvéve/);
 assert.match(row,/Nincs az itemen/);
 assert.match(row,/Parry Rate/);
 assert.match(table,/data-overview-card="shoulder"[\s\S]*?blue-inventory-overview/);
});

test('v4.9.8: unexpected Blue is visible but does not alter source data or catalog',()=>{
 const {hooks}=boot(),s=hooks.state(),obj=s.sets[90].shoulder;
 obj.count=1;obj.rows=[{type:'HP',value:200,modelMax:600}];
 const data=hooks.itemBlueInventory('shoulder');
 assert.equal(data.available,4);
 assert.equal(data.present,0);
 assert.equal(data.extra,1);
 assert.equal(data.records.length,5);
 assert.match(hooks.blueInventoryView('shoulder'),/nem szerepel a listában/);
 assert.equal(hooks.blueTypesFor('shoulder').length,4);
 assert.equal(obj.rows[0].value,200);
});

test('v4.9.8: independent server profiles keep CAP, Wheel rows, and Blue overrides separate',()=>{
 const {hooks,store}=boot(),s=hooks.state();
 assert.equal(hooks.currentServerName(),'Sailor Online');
 s.sets[90].shoulder.count=1;
 s.sets[90].shoulder.rows=[{type:'STR',value:11,modelMax:11}];
 assert.equal(hooks.setBlueTypes('shoulder',['STR','INT']),true);
 hooks.save();
 assert.equal(hooks.addServerProfile('Test Server'),true);
 assert.equal(hooks.currentServerName(),'Test Server');
 assert.equal(hooks.state().sets[90].shoulder.count,0);
 assert.equal(hooks.blueTypesFor('shoulder').length,4);
 assert.equal(hooks.renameServerProfile('Other Silkroad Server'),true);
 const other=hooks.exportAllProfiles();
 assert.equal(other.serverProfiles.entries.length,2);
 const sailor=other.serverProfiles.entries.find(e=>e.name==='Sailor Online');
 assert.equal(sailor.data.sets[90].shoulder.rows[0].value,11);
 const first=other.serverProfiles.entries.find(e=>e.name==='Sailor Online').id;
 assert.equal(hooks.switchServerProfile(first),true);
 assert.equal(hooks.currentServerName(),'Sailor Online');
 assert.equal(hooks.state().sets[90].shoulder.rows[0].value,11);
 assert.equal(hooks.blueTypesFor('shoulder').length,2);
 assert.equal(hooks.switchServerProfile(other.serverProfiles.activeId),true);
 assert.equal(hooks.currentServerName(),'Other Silkroad Server');
 assert.equal(hooks.state().sets[90].shoulder.count,0);
 assert.ok(JSON.parse(store['wheel-calculator-server-profiles-v1']).entries.length===2);
});

test('v4.9.8: importing all-server JSON restores separate profiles and old Sailor-only export',()=>{
 const {hooks}=boot();
 assert.equal(hooks.addServerProfile('Server Two'),true);
 assert.equal(hooks.chooseCap(140),true);
 const now=hooks.state();
 now.sets[140].shoulder.count=1;
 now.sets[140].shoulder.rows=[{type:'INT',value:8,modelMax:11}];
 hooks.save();
 const backup=JSON.parse(JSON.stringify(hooks.exportAllProfiles()));
 assert.equal(backup.serverProfiles.entries.length,2);
 assert.equal(hooks.addServerProfile('Temporary'),true);
 assert.equal(hooks.importAllProfiles(backup),true);
 assert.equal(hooks.currentServerName(),'Server Two');
 assert.equal(hooks.state().sets[140].shoulder.rows[0].value,8);
 assert.equal(hooks.exportAllProfiles().serverProfiles.entries.length,2);
 const legacy=JSON.parse(JSON.stringify(backup.serverProfiles.entries[0].data));
 assert.equal(hooks.importAllProfiles(legacy),true);
 assert.equal(hooks.state().cap,90);
 assert.equal(hooks.exportAllProfiles().serverProfiles.entries.length,2);
});

test('v4.9.8: fixed maxima apply to all profiles and degree snapshots without deleting rolls',()=>{
 const {hooks}=boot(),s=hooks.state();
 assert.equal(s.cfg[90].maxSTR,11);
 assert.equal(s.cfg[90].maxINT,11);
 assert.equal(s.cfg[90].maxDUR,200);
 for(const cap of [130,140]){
  assert.equal(hooks.chooseCap(cap),true);
  const cfg=hooks.state().cfg[cap];
  assert.equal(cfg.maxHP,2300);
  assert.equal(cfg.maxPARRY,60);
  assert.equal(cfg.maxDUR,200);
  assert.equal(cfg.maxSTR,11);
  assert.equal(cfg.maxINT,11);
  cfg.maxHP=99999;cfg.maxPARRY=500;cfg.maxSTR=30;cfg.maxDUR=300;
  hooks.save();
  assert.equal(cfg.maxHP,2300);assert.equal(cfg.maxPARRY,60);
  assert.equal(cfg.maxSTR,11);assert.equal(cfg.maxDUR,200);
  hooks.switchDegreeModel(cfg.degree+1);
  assert.equal(cfg.maxSTR,11);
  assert.equal(cfg.maxHP,2300);
  assert.equal(cfg.maxPARRY,60);
  assert.equal(cfg.maxDUR,200);
  const obj=hooks.state().sets[cap].shoulder;
  obj.count=2;
  obj.rows=[{type:'HP',value:3000,modelMax:9999},{type:'PARRY',value:80,modelMax:99}];
  assert.ok(hooks.check('shoulder').issues.some(x=>x.includes('maximum 2300')));
  assert.ok(hooks.check('shoulder').issues.some(x=>x.includes('maximum 60')));
  assert.equal(obj.rows[0].value,3000);
 }
 assert.equal(hooks.chooseCap(90),true);
 const o=hooks.state().sets[90].shoulder;
 o.count=1;o.rows=[{type:'DUR',value:201}];
 assert.ok(hooks.check('shoulder').issues.some(x=>x.includes('Durability maximum 200%')));
 o.rows[0].value=200;
 assert.ok(!hooks.check('shoulder').issues.some(x=>x.includes('Durability maximum')));
 assert.match(hooks.blueInventoryView('shoulder'),/200% \/ 200%/);
});

test('v4.9.8: input constraints signal true STR INT caps, universal Durability and 130+ HP Parry',()=>{
 const {hooks}=boot();
 assert.equal(hooks.chooseCap(140),true);
 const html=hooks.html();
 assert.match(html,/max="11"[^>]*data-config="maxSTR"/);
 assert.match(html,/max="11"[^>]*data-config="maxINT"/);
 assert.match(html,/data-config="maxHP"/);
 assert.match(html,/data-config="maxPARRY"/);
 assert.equal(hooks.state().cfg[140].maxHP,2300);
 assert.equal(hooks.state().cfg[140].maxPARRY,60);
 assert.equal(hooks.state().cfg[140].maxDUR,200);
});

test('v4.9.9: 140 CAP Wheel maxima match 130 CAP including MP, Balance remains level-specific',()=>{
 const {hooks}=boot(),s=hooks.state();
 const keys=['maxSTR','maxINT','maxAR','maxBR','maxCRIT','maxHP','maxMP','maxDUR','maxPARRY','maxFREEZE'];
 for(const key of keys)assert.equal(s.cfg[140][key],s.cfg[130][key],key+' should inherit 130 CAP reference');
 assert.equal(s.cfg[140].maxMP,2300);
 assert.equal(s.cfg[140].degreeMaxima[s.cfg[140].degree].maxMP,2300);
 assert.notEqual(s.cfg[140].degree,s.cfg[130].degree,'Degree choice is separate from Wheel maxima');
 assert.notEqual(hooks.balanceThreshold(130).maxStat,hooks.balanceThreshold(140).maxStat,'Balance still follows character level');
 assert.equal(hooks.chooseCap(140),true);
 const c=hooks.state().cfg[140];
 assert.equal(c.maxMP,2300);
 hooks.switchDegreeModel(16);
 assert.equal(c.maxMP,2300,'new Degree keeps the 130 CAP MP reference');
 hooks.state().tab='rules';hooks.paint();
 assert.match(hooks.html(),/140 CAP MP-referenciája jelenleg a 130 CAP-éval egyezik/);
});

test('v4.9.9: blank legacy 140 MP maxima inherit 130 across CAP and saved Degree snapshots',()=>{
 const {hooks,store}=boot(),s=hooks.state();
 s.cfg[140].maxMP=null;
 s.cfg[140].degreeMaxima[15].maxMP='';
 s.cfg[140].degreeMaxima[14]={...s.cfg[140].degreeMaxima[15],maxMP:null};
 s.cfg[130].maxMP=2300;
 hooks.applyFixedStatLimits();
 assert.equal(s.cfg[140].maxMP,2300);
 assert.equal(s.cfg[140].degreeMaxima[15].maxMP,2300);
 assert.equal(s.cfg[140].degreeMaxima[14].maxMP,2300);
 assert.equal(hooks.chooseCap(140),true);
 hooks.save();
 assert.equal(JSON.parse(store['sailor-wheel-calculator-v4']).cfg[140].maxMP,2300);
 hooks.switchDegreeModel(14);
 assert.equal(hooks.state().cfg[140].maxMP,2300);
});

test('v4.9.9: explicit 140 MP overrides and existing Wheel rows are not silently overwritten',()=>{
 const {hooks}=boot(),s=hooks.state();
 const c=s.cfg[140];
 c.maxMP=2100;
 c.degreeMaxima[15].maxMP=2100;
 const obj=s.sets[140].chest;
 obj.count=1;obj.rows=[{type:'MP',value:1900,modelMax:2300}];
 hooks.applyFixedStatLimits();
 assert.equal(c.maxMP,2100,'user-defined server maximum must survive');
 assert.equal(c.degreeMaxima[15].maxMP,2100);
 assert.equal(obj.rows[0].value,1900,'saved Wheel roll untouched');
 assert.equal(obj.rows[0].modelMax,2300,'per-item custom ceiling untouched');
 assert.equal(hooks.chooseCap(140),true);
 assert.equal(hooks.state().cfg[140].maxMP,2100);
 assert.equal(hooks.chooseCap(130),true);
 assert.equal(hooks.state().cfg[130].maxMP,2300,'130 CAP independent from 140 override');
});


test('v4.10.0: language switch persists EN without modifying SET values or stored server data',()=>{
 const {hooks,store}=boot(),s=hooks.state();
 const o=s.sets[90].shoulder;
 o.count=1;o.rows=[{type:'STR',value:7,modelMax:11}];
 hooks.save();
 const before=JSON.stringify(s.cfg),beforeItem=JSON.stringify(o.rows);
 assert.equal(hooks.setUiLanguage('en'),true);
 assert.equal(store['wheel-calculator-language-v1'],'en');
 const root=hooks.html();
 assert.match(root,/Equipment/);
 assert.match(root,/Overall Wheel quality/);
 assert.match(root,/All Blue types|Full set/);
 assert.equal(JSON.stringify(s.cfg),before);
 assert.equal(JSON.stringify(o.rows),beforeItem);
 assert.equal(hooks.setUiLanguage('hu'),true);
 assert.equal(store['wheel-calculator-language-v1'],'hu');
 assert.match(hooks.html(),/Felszerelés/);
 assert.equal(hooks.setUiLanguage('invalid'),false);
});

test('v4.10.0: HTML localizer translates visible text, alt/title and placeholders but not item stat input values',()=>{
 const {hooks}=boot();
 const src='<div title="Fegyver típusa"><span>Mentés</span><input value="Mentés" placeholder="Fegyver típusa" aria-label="Hibajelentés / ötlet"></div>';
 const en=hooks.translateMarkup(src,'en');
 assert.match(en,/>Save<\/span>/);
 assert.match(en,/title="Weapon type"/);
 assert.match(en,/placeholder="Weapon type"/);
 assert.match(en,/aria-label="Bug report \/ suggestion"/);
 assert.match(en,/value="Mentés"/);
 assert.equal(hooks.translateMarkup(src,'hu'),src);
 assert.equal(hooks.translateText('STR összesen','en'),'Total STR');
});

test('v4.10.0: English guide covers instructions, backups, assumptions and 140 CAP rules',()=>{
 const {hooks}=boot();
 assert.equal(hooks.setUiLanguage('en'),true);
 hooks.state().tab='help';hooks.paint();
 const markup=hooks.html();
 assert.match(markup,/Guide \/ known limitations/);
 assert.match(markup,/JSON backup/);
 assert.match(markup,/STR and INT each have a fixed maximum of \+11/);
 assert.match(markup,/140 CAP Wheel reference matches the 130 CAP/);
 assert.match(markup,/conditional mathematical estimates, not verified server probabilities/);
 assert.match(markup,/language/i);
 hooks.setUiLanguage('hu');
 assert.match(hooks.html(),/Útmutató \/ ismert korlátok/);
});

test('v4.10.0: static text changes language in place and restores Hungarian on switch',()=>{
 const {hooks,document}=boot();
 const n={nodeValue:'Aktív szerver',parentElement:{closest:()=>false}};
 const originalQuery=document.querySelector;
 document.querySelector=s=>s==='.shell'?{}:originalQuery(s);
 document.querySelectorAll=()=>[];
 document.createTreeWalker=()=>({nextNode:(()=>{let read=false;return ()=>read?null:(read=true,n);})()});
 document.documentElement={lang:'hu'};
 assert.equal(hooks.setUiLanguage('en'),true);
 assert.equal(n.nodeValue,'Active server');
 assert.equal(document.documentElement.lang,'en');
 assert.equal(hooks.setUiLanguage('hu'),true);
 assert.equal(n.nodeValue,'Aktív szerver');
 assert.equal(document.documentElement.lang,'hu');
});

test('v4.10.0: custom CAP in one server does not leak into newly created or restored other servers',()=>{
 const {hooks}=boot();
 assert.equal(hooks.chooseCap(175),true);
 assert.ok(hooks.profileCaps(hooks.state()).includes(175));
 assert.equal(hooks.addServerProfile('Second server'),true);
 assert.equal(hooks.currentServerName(),'Second server');
 assert.equal(hooks.profileCaps(hooks.state()).includes(175),false);
 assert.equal(hooks.chooseCap(180),true);
 assert.equal(hooks.profileCaps(hooks.state()).includes(180),true);
 const snapshot=hooks.exportAllProfiles();
 const first=snapshot.serverProfiles.entries.find(e=>e.name==='Sailor Online');
 const second=snapshot.serverProfiles.entries.find(e=>e.name==='Second server');
 assert.equal(hooks.switchServerProfile(first.id),true);
 assert.equal(hooks.profileCaps(hooks.state()).includes(175),true);
 assert.equal(hooks.profileCaps(hooks.state()).includes(180),false);
 assert.equal(hooks.switchServerProfile(second.id),true);
 assert.equal(hooks.profileCaps(hooks.state()).includes(180),true);
 assert.equal(hooks.profileCaps(hooks.state()).includes(175),false);
});

test('v4.10.0: corrupt multi-server import is rejected atomically with all previous data intact',()=>{
 const {hooks,store}=boot();
 const stable=obj=>JSON.stringify(obj,(key,value)=>key==='updatedAt'?undefined:value);
 assert.equal(hooks.addServerProfile('English server'),true);
 assert.equal(hooks.chooseCap(140),true);
 hooks.state().sets[140].shoulder.count=1;
 hooks.state().sets[140].shoulder.rows=[{type:'STR',value:11,modelMax:11}];
 hooks.save();
 const baseline=stable(hooks.exportAllProfiles());
 const active=hooks.currentServerName();
 const beforeStored=store['sailor-wheel-calculator-v4'];
 const invalid=JSON.parse(baseline);
 delete invalid.serverProfiles.entries[0].data.cfg[130];
 assert.throws(()=>hooks.importAllProfiles(invalid),/Sérült|hiányos|szerverprofil/);
 assert.equal(hooks.currentServerName(),active);
 assert.equal(stable(hooks.exportAllProfiles()),baseline);
 assert.equal(store['sailor-wheel-calculator-v4'],beforeStored);
 const duplicate=JSON.parse(baseline);
 duplicate.serverProfiles.entries[1].id=duplicate.serverProfiles.entries[0].id;
 assert.throws(()=>hooks.importAllProfiles(duplicate),/Sérült|ismétlődő/);
 assert.equal(stable(hooks.exportAllProfiles()),baseline);
 const badActive=JSON.parse(baseline);
 badActive.serverProfiles.activeId='missing';
 assert.throws(()=>hooks.importAllProfiles(badActive),/aktív szerverprofilja hiányzik/);
 assert.equal(stable(hooks.exportAllProfiles()),baseline);
});

test('v4.10.0: feedback page offers English/Hungarian text and no duplicated calculator name',()=>{
 const feedback=fs.readFileSync(path.join(__dirname,'..','visszajelzes.html'),'utf8');
 assert.match(feedback,/id="feedbackLanguage"/);
 assert.match(feedback,/BETA feedback/);
 assert.match(feedback,/BÉTA visszajelzés/);
 assert.match(feedback,/function fbLocalize/);
 assert.match(feedback,/localStorage\.setItem\(FB_LANG_KEY,fbLanguage\)/);
 assert.doesNotMatch(feedback,/Wheel Calculator Calculator/);
 const code=feedback.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(code,'Feedback page must have a script');
 assert.doesNotThrow(()=>new Function(code));
});

test('v4.10.0: all four default English views contain no Hungarian accented UI fragments',()=>{
 const {hooks}=boot();
 assert.equal(hooks.setUiLanguage('en'),true);
 for(const tab of ['set','chance','rules','help']){
  hooks.state().tab=tab;hooks.paint();
  const textNodes=[...hooks.html().matchAll(/>([^<>]{2,450})</g)].map(x=>x[1].trim());
  const untranslated=textNodes.filter(x=>/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/.test(x));
  assert.deepEqual(untranslated,[],tab+' still has untranslated HU UI labels');
 }
 assert.equal(hooks.setUiLanguage('hu'),true);
 hooks.state().tab='set';hooks.paint();
 assert.match(hooks.html(),/Felszerelés/);
});

test('v4.10.0: English translation avoids word fragments and translates safety confirmations',()=>{
 const {hooks}=boot();
 assert.equal(hooks.translateText('sorok','en'),'sorok','do not produce lineok');
 assert.equal(hooks.translateText('sor','en'),'line');
 assert.equal(hooks.translateText('Nem ígér jobb rollt','en'),'Nem ígér jobb rollt','do not produce mixed No ígér');
 const msg='Betöltöd a teljes mentést? A jelenlegi v4-es adatok felülíródnak. Előbb érdemes JSON-ba menteni.';
 assert.match(hooks.translateText(msg,'en'),/Import the full backup/);
 assert.match(hooks.translateText('A SET neve nem lehet üres.','en'),/Set name cannot be empty/);
 assert.match(hooks.translateText('Csak 1 és 200 közötti egész CAP adható meg.','en'),/whole-number CAP/);
 assert.match(hooks.translateText('V4.10.0 BÉTA JSON-export indítva, ellenőrizd a letöltött fájlt.','en'),/JSON export started/);
});

test('v4.10.0: switching language survives server creation and JSON round trip',()=>{
 const {hooks,store}=boot();
 hooks.setUiLanguage('en');
 assert.equal(hooks.addServerProfile('New Silkroad server'),true);
 assert.equal(hooks.chooseCap(140),true);
 const backup=JSON.parse(JSON.stringify(hooks.exportAllProfiles()));
 assert.equal(backup.serverProfiles.entries.length,2);
 assert.equal(hooks.importAllProfiles(backup),true);
 assert.equal(hooks.state().cap,140);
 assert.equal(store['wheel-calculator-language-v1'],'en');
 assert.match(hooks.html(),/Equipment/);
 hooks.setUiLanguage('hu');
 assert.equal(store['wheel-calculator-language-v1'],'hu');
 assert.match(hooks.html(),/Felszerelés/);
});


test('v5 icon foundation: legacy SETs stay unidentified and use safe placeholders',()=>{
 const {hooks,document}=boot(),s=hooks.state();
 assert.equal(s.apparelStyle,'unknown');
 assert.equal(hooks.iconIdentity('chest').equipmentType,null);
 assert.equal(hooks.verifiedIconFor('chest'),null);
 assert.match(hooks.itemLabel('chest'),/Stilizált helyettesítő/);
 assert.match(hooks.html(),/Ikon Degree/);
 assert.match(document.querySelector('#apparelStyleSel').innerHTML,/Chinese/);
});

test('v5 icon foundation: matching requires exact outfit family, region, degree, slot and verification',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.apparelStyle='ch_garment';
 const chest=s.sets[90].chest;
 const icons=hooks.VERIFIED_ICON_ASSETS;
 const mk=(degree,path,grade=null)=>({
  category:'equipment',slot:'chest',region:'ch',equipmentType:'garment',weaponType:null,
  degree,grade,path,verified:true
 });
 icons.push(mk(9,'assets/icons/ch/garment/chest-9.png'),
            mk(11,'assets/icons/ch/garment/chest-11.webp'));
 assert.equal(hooks.iconIdentity('chest').degree,9);
 assert.equal(hooks.verifiedIconFor('chest').path,'assets/icons/ch/garment/chest-9.png');
 chest.iconDegree=11;
 assert.equal(hooks.verifiedIconFor('chest').path,'assets/icons/ch/garment/chest-11.webp');
 assert.match(hooks.uiIcon('item','chest'),/data-icon-source="verified"/);
 s.apparelStyle='ch_armor';
 assert.equal(hooks.verifiedIconFor('chest'),null,'garment must not become armor');
 s.apparelStyle='eu_robe';
 assert.equal(hooks.verifiedIconFor('chest'),null,'Chinese icon must not be European icon');
});

test('v5 icon foundation: sprite paths and match verification are not trusted implicitly',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.apparelStyle='ch_protector';
 hooks.VERIFIED_ICON_ASSETS.push({
  category:'equipment',slot:'head',region:'ch',equipmentType:'protector',weaponType:null,
  degree:9,grade:null,path:'javascript:alert(1)',verified:true
 },{
  category:'equipment',slot:'head',region:'ch',equipmentType:'protector',weaponType:null,
  degree:9,grade:null,path:'assets/icons/ch/protector/head9.png',verified:false
 });
 assert.equal(hooks.verifiedIconFor('head'),null);
 assert.ok(!hooks.uiIcon('item','head').includes('<img'));
});

test('v5 icon foundation: weapon and rings identify the actual item family',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.weaponByCap[90]='eu_staff';
 const weapon=hooks.iconIdentity('weapon');
 assert.equal(weapon.region,'eu');
 assert.equal(weapon.weaponType,'eu_staff');
 assert.equal(weapon.equipmentType,'weapon');
 assert.equal(hooks.iconIdentity('shield').equipmentType,'shield');
 assert.equal(hooks.iconIdentity('ring1').slot,'ring');
 assert.equal(hooks.iconIdentity('ring2').slot,'ring');
});

test('v5 icon foundation: apparel style is preserved per SET and independently per CAP',()=>{
 const {hooks,document}=boot(),s=hooks.state();
 const first=s.setBank[90].activeId;
 const picker=document.querySelector('#apparelStyleSel');
 picker.onchange({target:{value:'ch_garment'}});
 assert.equal(s.apparelStyle,'ch_garment');
 hooks.createSet(false);
 assert.equal(s.apparelStyle,'unknown','new SET does not inherit old item family');
 hooks.selectSet(first);
 assert.equal(s.apparelStyle,'ch_garment');
 hooks.chooseCap(100);
 assert.equal(s.apparelStyle,'unknown','a different CAP has independent settings');
 document.querySelector('#apparelStyleSel').onchange({target:{value:'eu_robe'}});
 hooks.chooseCap(90);
 assert.equal(s.apparelStyle,'ch_garment');
 hooks.chooseCap(100);
 assert.equal(s.apparelStyle,'eu_robe');
});

test('v5 icon foundation: existing manual icon still takes precedence over future verified asset',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.apparelStyle='ch_garment';
 hooks.VERIFIED_ICON_ASSETS.push({
  category:'equipment',slot:'chest',region:'ch',equipmentType:'garment',weaponType:null,
  degree:9,grade:null,path:'assets/icons/ch/garment/chest.png',verified:true
 });
 assert.ok(hooks.setUserIcon('chest','data:image/png;base64,AA=='));
 const html=hooks.uiIcon('item','chest');
 assert.match(html,/data:image\/png;base64,AA==/);
 assert.doesNotMatch(html,/assets\/icons/);
});

test('v5 icon foundation: never assign a named item sprite to unrelated item codes',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.apparelStyle='ch_garment';
 const obj=s.sets[90].chest;
 hooks.VERIFIED_ICON_ASSETS.push({
  category:'equipment',slot:'chest',region:'ch',equipmentType:'garment',weaponType:null,
  degree:9,grade:null,itemCode:'ITEM_CH_M_GARMENT_09',
  path:'assets/icons/ch/garment/chest-specific.png',verified:true
 });
 assert.equal(hooks.verifiedIconFor('chest'),null,'item-specific art must not become a generic fallback');
 obj.iconItemCode='ITEM_CH_M_GARMENT_09';
 assert.match(hooks.uiIcon('item','chest'),/chest-specific.png/);
 obj.iconItemCode='ITEM_CH_M_GARMENT_10';
 assert.equal(hooks.verifiedIconFor('chest'),null);
});

test('v5 icon foundation: ambiguous verified matches fail closed',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.apparelStyle='ch_garment';
 hooks.VERIFIED_ICON_ASSETS.push(...['a.png','b.png'].map(file=>({
  category:'equipment',slot:'chest',region:'ch',equipmentType:'garment',
  degree:9,grade:null,itemCode:null,verified:true,path:'assets/icons/ch/garment/'+file
 })));
 assert.equal(hooks.verifiedIconFor('chest'),null);
 assert.match(hooks.itemLabel('chest'),/helyettesítő/);
});

test('v5 Wheel icon registry: only unique verified Wheel/Feather Pen art is rendered',()=>{
 const {hooks}=boot();
 assert.equal(hooks.verifiedWheelIconFor('wheel_of_fortune'),null);
 assert.match(hooks.wheelToolIcon('wheel_of_fortune','🎲'),/🎲/);
 hooks.VERIFIED_ICON_ASSETS.push({
  category:'wheel',role:'wheel_of_fortune',verified:true,
  path:'assets/icons/wheel/wheel.png'
 },{
  category:'wheel',role:'feather_pen',verified:true,
  path:'assets/icons/wheel/pen.webp'
 });
 assert.match(hooks.chanceView(),/data-icon-source="verified-wheel"/);
 assert.match(hooks.wheelToolIcon('feather_pen','🧠'),/pen.webp/);
 assert.equal(hooks.verifiedWheelIconFor('unknown'),null);
 hooks.VERIFIED_ICON_ASSETS.push({
  category:'wheel',role:'feather_pen',verified:true,
  path:'assets/icons/wheel/another.png'
 });
 assert.equal(hooks.verifiedWheelIconFor('feather_pen'),null,'ambiguous wheel role must use fallback');
});


test('v5 icon foundation: JSON backup roundtrip preserves icon metadata without changing Wheel scores',()=>{
 const original=boot(),s=original.hooks.state(),chest=s.sets[90].chest;
 s.apparelStyle='ch_garment';
 chest.iconDegree=10;chest.iconItemCode='ITEM_CH_M_GARMENT_10';
 chest.count=1;chest.target=1;chest.rows=[{type:'STR',value:7,modelMax:11}];
 original.hooks.save();
 const before=original.hooks.total().str;
 const backup=JSON.parse(JSON.stringify(original.hooks.exportAllProfiles()));
 const restored=boot();
 assert.equal(restored.hooks.importAllProfiles(backup),true);
 assert.equal(restored.hooks.state().apparelStyle,'ch_garment');
 assert.equal(restored.hooks.state().sets[90].chest.iconDegree,10);
 assert.equal(restored.hooks.state().sets[90].chest.iconItemCode,'ITEM_CH_M_GARMENT_10');
 assert.equal(restored.hooks.total().str,before);
});

test('showcase: three Wheel stages and a manual budget remain conditional',()=>{
 const {hooks}=boot();
 assert.match(hooks.wheelStagesPanel(),/Wheel of Fate/);
 assert.match(hooks.wheelStagesPanel(),/Wheel of Fortune/);
 assert.match(hooks.wheelStagesPanel(),/Feather Pen/);
 const s=hooks.state();
 s.costPlans={90:{currency:'Gold',fatePrice:500,fateCount:2,fortunePrice:250,fortuneCount:4,penPrice:100,penCount:3}};
 const calc=hooks.calculateCost();
 assert.equal(calc.total,2300);
 assert.equal(calc.subtotals.fate,1000);
 assert.equal(calc.subtotals.fortune,1000);
 assert.equal(calc.subtotals.pen,300);
 assert.match(hooks.wheelCostPanel(),/2\s?300/);
 assert.equal(hooks.calculateCost({...s.costPlans[90],fateCount:-1}),null);
 assert.equal(hooks.calculateCost({...s.costPlans[90],penCount:2.5}),null);
 assert.equal(hooks.calculateCost({...s.costPlans[90],penPrice:Infinity}),null);
});

test('showcase: demo SET never replaces the existing set or pollutes another CAP',()=>{
 const {hooks}=boot(),s=hooks.state();
 const id=s.setBank[90].activeId;
 const before=JSON.stringify(s.setBank[90].entries.find(x=>x.id===id).data);
 s.sets[90].head.rows=[{type:'STR',value:3}];
 hooks.save();
 const saved=JSON.stringify(s.setBank[90].entries.find(x=>x.id===id).data);
 assert.notEqual(saved,before);
 assert.equal(hooks.createAdminDemo(90),true);
 assert.equal(s.setBank[90].entries.length,2);
 assert.match(s.setBank[90].entries.find(x=>x.id===s.setBank[90].activeId).name,/DEMO/);
 assert.equal(s.sets[90].chest.rows[0].type,'STR');
 hooks.selectSet(id);
 assert.equal(JSON.stringify(s.setBank[90].entries.find(x=>x.id===id).data),saved);
 assert.equal(s.sets[90].head.rows[0].value,3);
 assert.equal(hooks.createAdminDemo(130),true);
 assert.equal(s.cap,130);
 assert.equal(s.setBank[90].entries.length,2);
 assert.equal(s.setBank[100].entries.length,1);
 assert.equal(hooks.createAdminDemo(95),false);
});

test('showcase: read-only shared snapshot is validated and cannot overwrite data',()=>{
 const {hooks,window}=boot(),s=hooks.state();
 s.sets[90].chest.count=1;
 s.sets[90].chest.rows=[{type:'STR',value:8}];
 const snap=JSON.parse(JSON.stringify(hooks.shareSetSnapshot()));
 assert.equal(hooks.validateSharedSet(snap),true);
 const encoded=hooks.encodeSharedSet(snap);
 assert.equal(typeof encoded,'string');
 assert.equal(hooks.decodeSharedSet(encoded).items[4].rows[0].value,8);
 window.location={hash:'#set='+encoded};
 const before=JSON.stringify(s);
 assert.match(hooks.sharedSetPreviewPanel(),/read-only|olvasható/);
 assert.equal(JSON.stringify(s),before);
 assert.equal(hooks.decodeSharedSet(encodeURIComponent(JSON.stringify({...snap,cap:9999}))),null);
 assert.equal(hooks.decodeSharedSet('%ZZ'),null);
 assert.equal(hooks.decodeSharedSet('x'.repeat(16001)),null);
});

test('showcase: link contains no other SET history, server bank or saved icon data',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.userIcons={head:'data:image/png;base64,AA=='};
 s.sets[90].head.history=[{secret:'not shared'}];
 const text=decodeURIComponent(hooks.encodeSharedSet(hooks.shareSetSnapshot()));
 assert.ok(!text.includes('not shared'));
 assert.ok(!text.includes('userIcons'));
 assert.ok(!text.includes('serverProfiles'));
});

test('showcase: source metadata is explicitly user-reported and stays CAP scoped',()=>{
 const {hooks}=boot(),s=hooks.state();
 assert.equal(hooks.evidenceKey(),'90:9');
 assert.match(hooks.evidencePanel(),/Még nincs bizonyíték/);
 s.dataEvidence={'90:9':{status:'submitted',sourceUrl:'https://example.org/sro',notes:'player screenshot',updatedAt:'2026-11-06T00:00:00Z'}};
 assert.match(hooks.evidencePanel(),/example.org/);
 hooks.chooseCap(100);
 assert.equal(hooks.evidenceFor().status,'missing');
 hooks.chooseCap(90);
 assert.equal(hooks.evidenceFor().notes,'player screenshot');
 const exportData=hooks.exportAllProfiles();
 assert.equal(exportData.dataEvidence['90:9'].status,'submitted');
});

test('showcase: the new panels render in both languages',()=>{
 const {hooks}=boot();
 assert.match(hooks.html(),/Admin bemutató/);
 assert.equal(hooks.setUiLanguage('en'),true);
 assert.match(hooks.html(),/Admin showcase/);
 hooks.state().tab='chance';hooks.paint();
 assert.match(hooks.html(),/Three-stage Wheel planner/);
 assert.match(hooks.html(),/Wheel budget planner/);
 hooks.state().tab='rules';hooks.paint();
 assert.match(hooks.html(),/CAP \/ Degree evidence record/);
});

test('showcase: legacy string-valued Wheel rolls remain safe in share links',()=>{
 const {hooks}=boot(),o=hooks.state().sets[90].chest;
 o.count=2;o.rows=[{type:'STR',value:'8'},{type:'INT',value:'9'}];
 const snapshot=hooks.shareSetSnapshot();
 assert.equal(hooks.validateSharedSet(snapshot),true);
 const encoded=hooks.encodeSharedSet(snapshot);
 assert.ok(encoded);
 assert.equal(hooks.decodeSharedSet(encoded).items[4].rows[0].value,'8');
 snapshot.items[4].rows[0].value='<img onerror=alert(1)>';
 assert.equal(hooks.validateSharedSet(snapshot),false);
});

test('showcase: bilingual admin page exists and describes beta limitations',()=>{
 const file=fs.readFileSync(path.join(__dirname,'..','bemutato.html'),'utf8');
 assert.match(file,/Admin Showcase/);
 assert.match(file,/Wheel of Fate/);
 assert.match(file,/Wheel of Fortune/);
 assert.match(file,/Feather Pen/);
 assert.match(file,/data-hu=/);
 assert.match(file,/data-en=/);
 assert.match(file,/nem valós|nem valódi|kitalált/);
 assert.match(html,/href="bemutato.html"/);
});

test('showcase: server rule review request contains Blue pools, limits and honest caveats',()=>{
 const {hooks}=boot();
 const hu=hooks.adminReviewReport();
 assert.match(hu,/90 \/ 9DG/);
 assert.match(hu,/Shoulder:/);
 assert.match(hu,/STR \/ INT per line: \+11/);
 assert.match(hu,/200%/);
 assert.match(hu,/Kérjük az ehhez a CAP/);
 assert.match(hooks.evidencePanel(),/copyReviewRequest/);
 hooks.setUiLanguage('en');
 const en=hooks.adminReviewReport();
 assert.match(en,/verification request/);
 assert.match(en,/no official odds are claimed/);
});

test('manual Wheel planner starts in Fate and never mutates recorded item values',()=>{
 const {hooks}=boot(),state=hooks.state(),ob=state.sets[90].shoulder;
 ob.count=2;ob.rows=[{type:'STR',value:8},{type:'INT',value:9}];
 const before=JSON.stringify(ob);
 assert.equal(hooks.wheelPlannerFor().stage,'fate');
 assert.match(hooks.interactiveWheelPlanner(),/Wheel of Fate/);
 assert.match(hooks.interactiveWheelPlanner(),/nem kommunikál a Silkroaddal/);
 assert.equal(hooks.setWheelPlannerField('targetLines',3),true);
 assert.equal(hooks.wheelPlannerFor().targetLines,3);
 assert.match(hooks.interactiveWheelPlanner(),/1 sor hiányzik/);
 assert.equal(JSON.stringify(ob),before,'planning changes must not rewrite real item rows');
 assert.equal(hooks.setWheelPlannerField('targetLines',0),false);
 assert.equal(hooks.setWheelPlannerField('targetLines',999),false);
 assert.equal(hooks.setWheelPlannerField('targetLines','not-a-number'),false);
 assert.equal(hooks.setWheelPlannerField('unknown','x'),false);
});

test('manual Wheel planner changes stages independently of actual Wheel rolls',()=>{
 const {hooks}=boot(),state=hooks.state();
 const before=JSON.stringify(state.sets[90].shoulder);
 assert.equal(hooks.setWheelPlannerField('stage','fortune'),true);
 assert.equal(hooks.wheelPlannerFor().stage,'fortune');
 assert.match(hooks.interactiveWheelPlanner(),/Blue-sorok/);
 assert.equal(hooks.setWheelPlannerField('stage','pen'),true);
 assert.match(hooks.interactiveWheelPlanner(),/Feather Pen/);
 assert.equal(hooks.setWheelPlannerField('stage','client_attack'),false);
 assert.equal(hooks.wheelPlannerFor().stage,'pen');
 assert.equal(JSON.stringify(state.sets[90].shoulder),before);
});

test('manual Pen target validates known line maxima and resets when line selection changes',()=>{
 const {hooks}=boot(),state=hooks.state(),ob=state.sets[90].shoulder;
 ob.count=2;ob.rows=[{type:'STR',value:7},{type:'INT',value:8}];
 assert.equal(hooks.setWheelPlannerField('stage','pen'),true);
 assert.equal(hooks.setWheelPlannerField('penTarget',11),true);
 assert.equal(hooks.wheelPlannerFor().penTarget,11);
 assert.match(hooks.interactiveWheelPlanner(),/Hiányzó érték: \+4/);
 assert.equal(hooks.setWheelPlannerField('penTarget',12),false,'STR fixed maximum is +11');
 assert.equal(hooks.setWheelPlannerField('penTarget',1.5),false);
 assert.equal(hooks.setWheelPlannerField('penLine',1),true);
 assert.equal(hooks.wheelPlannerFor().penLine,1);
 assert.equal(hooks.wheelPlannerFor().penTarget,null);
 assert.equal(hooks.setWheelPlannerField('penTarget',10),true);
 assert.equal(hooks.setWheelPlannerField('penLine',2),false);
 assert.equal(ob.rows[0].value,7);
 assert.equal(ob.rows[1].value,8);
});

test('manual planner refuses Pen goals for unknown or unscored line types',()=>{
 const {hooks}=boot(),state=hooks.state(),ob=state.sets[90].shoulder;
 ob.count=1;ob.rows=[{type:'OTHER',value:''}];
 assert.equal(hooks.setWheelPlannerField('penTarget',2),false);
 ob.rows=[{type:'DUR',value:200}];
 assert.equal(hooks.setWheelPlannerField('penTarget',20),false);
 ob.rows=[{type:'AR',value:20}];
 assert.equal(hooks.setWheelPlannerField('penTarget',0),false);
 assert.equal(hooks.setWheelPlannerField('penTarget','abc'),false);
 assert.equal(hooks.setWheelPlannerField('penTarget','40'),true);
});

test('manual planner is separately saved for each SET and CAP',()=>{
 const {hooks}=boot(),state=hooks.state(),old=state.setBank[90].activeId;
 assert.equal(hooks.setWheelPlannerField('targetLines',5),true);
 assert.equal(hooks.setWheelPlannerField('stage','fortune'),true);
 hooks.createSet(false);
 assert.equal(hooks.wheelPlannerFor().targetLines,null,'new SET starts without target');
 assert.equal(hooks.wheelPlannerFor().stage,'fate');
 assert.equal(hooks.setWheelPlannerField('targetLines',3),true);
 hooks.selectSet(old);
 assert.equal(hooks.wheelPlannerFor().targetLines,5);
 assert.equal(hooks.wheelPlannerFor().stage,'fortune');
 assert.equal(hooks.chooseCap(100),true);
 assert.equal(hooks.wheelPlannerFor().targetLines,null,'different CAP starts empty');
 assert.equal(hooks.setWheelPlannerField('targetLines',7),true);
 hooks.chooseCap(90);
 assert.equal(hooks.wheelPlannerFor().targetLines,5);
 hooks.chooseCap(100);
 assert.equal(hooks.wheelPlannerFor().targetLines,7);
});

test('manual planner survives backup import and old profiles without planner fields',()=>{
 const original=boot();
 original.hooks.setWheelPlannerField('stage','pen');
 original.hooks.setWheelPlannerField('targetLines',4);
 const json=JSON.parse(JSON.stringify(original.hooks.exportAllProfiles()));
 const copy=boot();
 assert.equal(copy.hooks.importAllProfiles(json),true);
 assert.equal(copy.hooks.wheelPlannerFor().stage,'pen');
 assert.equal(copy.hooks.wheelPlannerFor().targetLines,4);
 const legacy=JSON.parse(JSON.stringify(json));
 delete legacy.wheelPlanner;
 for(const bank of Object.values(legacy.setBank||{}))
  for(const entry of bank.entries||[])delete entry.data.wheelPlanner;
 if(legacy.serverProfiles)
  for(const profile of legacy.serverProfiles.entries||[]){
   delete profile.data.wheelPlanner;
   for(const bank of Object.values(profile.data.setBank||{}))
    for(const entry of bank.entries||[])delete entry.data.wheelPlanner;
  }
 assert.equal(copy.hooks.importAllProfiles(legacy),true);
 assert.equal(copy.hooks.wheelPlannerFor().targetLines,null);
});

test('manual planner UI is bilingual and includes no game client integration',()=>{
 const {hooks}=boot();
 hooks.state().tab='chance';hooks.paint();
 assert.match(hooks.html(),/Interaktív Wheel-tervezés/);
 assert.match(hooks.html(),/data-wheel-stage="fate"/);
 assert.match(hooks.html(),/data-wheel-plan="targetLines"/);
 assert.match(hooks.html(),/id="wheelGoEditor"/);
 hooks.setUiLanguage('en');
 assert.match(hooks.html(),/Interactive Wheel planning/);
 assert.match(hooks.html(),/does not communicate with Silkroad/);
 assert.doesNotMatch(script,/\b(?:WebSocket|XMLHttpRequest|RTCPeerConnection)\s*\(/);
 assert.doesNotMatch(script,/\bfetch\s*\(/);
});

test('web-only pages enforce CSP denying browser API and socket connections',()=>{
 const presentation=fs.readFileSync(path.join(__dirname,'..','bemutato.html'),'utf8');
 for(const page of [html,presentation]){
  assert.match(page,/<meta http-equiv="Content-Security-Policy" content="connect-src 'none'; object-src 'none'">/);
 }
 const guide=fs.readFileSync(path.join(__dirname,'..','docs','WEB_ONLY_MANUAL_PLANNER.md'),'utf8');
 assert.match(guide,/No game packets, socket connections/);
 assert.match(guide,/No bot control, phBot integration/);
});

test('manual Wheel plans do not leak across server profiles',()=>{
 const {hooks}=boot();
 assert.equal(hooks.setWheelPlannerField('stage','pen'),true);
 assert.equal(hooks.setWheelPlannerField('targetLines',7),true);
 assert.equal(hooks.addServerProfile('Second SRO server'),true);
 assert.equal(hooks.wheelPlannerFor().stage,'fate');
 assert.equal(hooks.wheelPlannerFor().targetLines,null);
 assert.equal(hooks.setWheelPlannerField('targetLines',2),true);
 assert.equal(hooks.switchServerProfile('srv_sailor'),true);
 assert.equal(hooks.wheelPlannerFor().stage,'pen');
 assert.equal(hooks.wheelPlannerFor().targetLines,7);
});

test('premium armory renders 12 equipment slots with verified/placeholder icons and click targets',()=>{
 const {hooks}=boot(),html=hooks.premiumLoadoutPanel();
 assert.match(html,/Felszerelés-kirakat/);
 assert.match(html,/EMERALD · SET SHOWCASE/);
 for(const id of ['head','shoulder','chest','hands','legs','foot','necklace','earring','ring1','ring2','weapon','shield']){
  assert.match(html,new RegExp('data-item="'+id+'" data-loadout="true"'),id);
 }
 assert.equal((html.match(/data-loadout="true"/g)||[]).length,12);
 assert.match(html,/Stilizált|helyettesítő/);
 assert.match(hooks.html(),/premium-armory/);
 assert.match(hooks.html(),/premium-analytics/);
});

test('premium analytics distinguishes zero data from a perfect score and excludes missing items',()=>{
 const {hooks}=boot();
 const before=hooks.premiumSetInsights();
 assert.equal(before.valid.length,0);
 assert.equal(before.average,null);
 assert.equal(before.unknown,before.active);
 assert.match(hooks.premiumAnalyticsPanel(),/Átlagos rögzített minőség/);
 assert.match(hooks.premiumAnalyticsPanel(),/—/);
 const o=hooks.state().sets[90].head;
 o.count=1;o.rows=[{type:'STR',value:11}];
 const after=hooks.premiumSetInsights();
 assert.equal(after.valid.length,1);
 assert.equal(after.slots.find(x=>x.id==='head').qualityPct,100);
 assert.ok(after.unknown>0);
 assert.equal(after.average,100);
 assert.equal(after.goalsMet,1);
 assert.match(hooks.premiumAnalyticsPanel(),/100%/);
});

test('premium priority insights use only valid complete item data and do not invent odds',()=>{
 const {hooks}=boot(),s=hooks.state(),head=s.sets[90].head,shoulder=s.sets[90].shoulder;
 head.count=1;head.rows=[{type:'STR',value:5}];
 shoulder.count=1;shoulder.rows=[{type:'INT',value:10}];
 const trackedBefore=JSON.stringify({head,shoulder});
 const info=hooks.premiumSetInsights();
 assert.equal(info.valid.length,2);
 assert.equal(info.priority.length,1);
 assert.equal(info.priority[0].id,'head');
 assert.ok(info.priority[0].opportunity.gain>0);
 assert.equal(JSON.stringify({head,shoulder}),trackedBefore);
 assert.match(hooks.premiumAnalyticsPanel(),/Fejlesztési sorrend/);
 assert.match(hooks.premiumAnalyticsPanel(),/elméleti/);
 assert.doesNotMatch(hooks.premiumAnalyticsPanel(),/90% esély|real drop rate/);
});

test('premium analytics never includes inactive shields or malformed scores in average',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.weaponByCap[90]='ch_bow';
 const shield=s.sets[90].shield;
 shield.count=1;shield.rows=[{type:'STR',value:11}];
 const head=s.sets[90].head;
 head.count=1;head.rows=[{type:'STR',value:99}];
 const info=hooks.premiumSetInsights();
 const shieldInfo=info.slots.find(x=>x.id==='shield');
 assert.equal(shieldInfo.equipped,false);
 assert.equal(shieldInfo.qualityPct,null);
 assert.equal(info.valid.length,0,'invalid item value must not be included');
 assert.equal(info.average,null);
 const display=hooks.premiumLoadoutPanel();
 assert.match(display,/Nem használt/);
});

test('premium dashboard is bilingual and retains responsive mobile presentation',()=>{
 const {hooks}=boot();
 assert.match(hooks.premiumLoadoutPanel(),/Ruházat/);
 assert.equal(hooks.setUiLanguage('en'),true);
 assert.match(hooks.premiumLoadoutPanel(),/Equipment loadout/);
 assert.match(hooks.premiumAnalyticsPanel(),/SET quality dashboard/);
 assert.match(hooks.premiumAnalyticsPanel(),/does not predict drop rates/);
 assert.match(html,/@media\(max-width:390px\)/);
 assert.match(html,/@media print\{/);
});

test('premium comparison: per-item quality deltas require valid complete values',()=>{
 const {hooks}=boot(),st=hooks.state(),a=st.setBank[90].entries[0];
 const first=st.sets[90].head;first.count=1;first.rows=[{type:'STR',value:5}];
 hooks.save();
 hooks.createSet(false);
 const b=st.setBank[90].entries.find(x=>x.id===st.setBank[90].activeId);
 const second=st.sets[90].head;second.count=1;second.rows=[{type:'STR',value:11}];
 hooks.save();
 const rows=hooks.compareSetSlots(90,a,b),head=rows.find(x=>x.id==='head');
 assert.equal(head.strDelta,6);
 assert.ok(head.qualityDelta>0);
 assert.equal(rows.length,12);
 assert.match(hooks.setSlotComparePanel(hooks.getSetComparison()),/Itemenkénti SET-összehasonlítás/);
 assert.match(hooks.setSlotComparePanel(hooks.getSetComparison()),/STR Δ/);
 assert.equal(st.sets[90].head.rows[0].value,11);
});

test('premium comparison: invalid items and inactive shields cannot produce fake quality',()=>{
 const {hooks}=boot(),st=hooks.state(),a=st.setBank[90].entries[0];
 st.sets[90].head.count=1;st.sets[90].head.rows=[{type:'STR',value:99}];
 hooks.save();hooks.createSet(false);
 const b=st.setBank[90].entries.find(x=>x.id===st.setBank[90].activeId);
 st.sets[90].head.count=1;st.sets[90].head.rows=[{type:'STR',value:11}];
 hooks.save();
 const rows=hooks.compareSetSlots(90,a,b),head=rows.find(x=>x.id==='head');
 assert.equal(head.left.quality,null);
 assert.equal(head.qualityDelta,null);
 const shield=rows.find(x=>x.id==='shield');
 assert.equal(shield.equippedL,false);
 assert.equal(shield.equippedR,false);
 assert.equal(shield.qualityDelta,null);
 assert.match(hooks.setSlotComparePanel(hooks.getSetComparison()),/Nem használt/);
});

test('premium comparison: bilingual mobile-scrollable report without network calls',()=>{
 const {hooks}=boot();
 hooks.createSet(false);
 hooks.setUiLanguage('en');
 const panel=hooks.setSlotComparePanel(hooks.getSetComparison());
 assert.match(panel,/Equipment-by-equipment comparison/);
 assert.match(panel,/second SET minus the first/);
 assert.match(html,/slot-compare-scroll\{overflow-x:auto/);
 assert.doesNotMatch(panel,/fetch\(|WebSocket|phBot/);
});

test('optional manual Sailor icon override still uses exact item identity and selected hash',()=>{
 const {hooks,window}=boot(),state=hooks.state(),sha='f'.repeat(64);
 state.apparelStyle='ch_garment';state.cfg[90].degree=9;
 const identity=hooks.iconIdentity('head'),key=hooks.localIconChoiceKey(identity);
 window.WHEEL_LOCAL_PACK={
  summary:()=>({ready:true,count:1273,images:1091}),
  candidates:x=>x.region==='ch'&&x.equipmentType==='garment'&&x.slot==='head'&&x.degree===9?
   [{assetSha256:sha,sourcePath:'icon/item/china/clothes/hat_09.ddj',reviewStatus:'pending'}]:[],
  iconURL:x=>x===sha?'blob:chosen-hat':null
 };
 assert.equal(hooks.manuallySelectedIconFor('head'),null,'a pack alone must not autoselect art');
 state.localIconSelections={[key]:sha};
 const img=hooks.uiIcon('item','head');
 assert.match(img,/data-icon-source="local-manual"/);
 assert.match(img,/blob:chosen-hat/);
 assert.match(hooks.itemLabel('head'),/nem hitelesített/);
 assert.doesNotMatch(hooks.uiIcon('item','chest'),/blob:chosen-hat/,'no cross-slot guessing');
 state.active='head';
 assert.match(hooks.localIconLibraryPanel(),/data-pick-local-icon=/);
 hooks.chooseCap(100);
 assert.doesNotMatch(hooks.uiIcon('item','head'),/blob:chosen-hat/,'no cross-degree auto substitution');
});
test('private icon selection metadata is saved in JSON while original sprite bytes are omitted',()=>{
 const {hooks,window}=boot(),state=hooks.state(),sha='a'.repeat(64);
 const key=hooks.localIconChoiceKey(hooks.iconIdentity('earring'));
 state.localIconSelections={[key]:sha};hooks.save();
 const snapshot=hooks.exportAllProfiles();
 assert.equal(snapshot.localIconSelections[key],sha);
 assert.doesNotMatch(JSON.stringify(snapshot),/data:image\/png;base64/);
 const other=boot();other.hooks.importAllProfiles(JSON.parse(JSON.stringify(snapshot)));
 assert.equal(other.hooks.state().localIconSelections[key],sha);
 assert.match(other.hooks.itemLabel('earring'),/helyettesítő/i);
});
test('local icon pack UI renders a safe manual import fallback in HU and EN',()=>{
 const {hooks}=boot();
 const fallback=hooks.localIconLibraryPanel();
 assert.match(fallback,/localIconZip/);
 assert.match(fallback,/Automatikus Sailor ikonok/);
 assert.doesNotMatch(fallback,/data-pick-local-icon/);
 hooks.setUiLanguage('en');
 assert.match(hooks.localIconLibraryPanel(),/Automatic Sailor icons/);
 assert.match(hooks.localIconLibraryPanel(),/No game login, bot, packet or API integration/);
 assert.match(html,/<script src="assets\/icons\/local-pack\.js"><\/script>/);
 assert.match(html,/local-icon-gallery/);
});

test('Sailor local import UI reports unresolved _ca sprites without blocking other icons',()=>{
 const {hooks,window}=boot();
 window.WHEEL_LOCAL_PACK={
  summary:()=>({ready:true,count:1153,images:1031,skippedUnresolved:120}),
  candidates:()=>[],iconURL:()=>null
 };
 const hu=hooks.localIconLibraryPanel();
 assert.match(hu,/120 azonosítatlan ruházati ikont kihagytunk/);
 assert.match(hu,/A többi ikon használható/);
 assert.match(hu,/1153 jelölt/);
 hooks.setUiLanguage('en');
 const en=hooks.localIconLibraryPanel();
 assert.match(en,/120 unresolved clothing sprites were excluded/);
 assert.match(en,/Other icons remain available/);
});

test('automatic Sailor icons appear immediately after ZIP load without any item image click',()=>{
 const {hooks,window}=boot(),s=hooks.state(),hash='f'.repeat(64);
 s.apparelStyle='ch_garment';s.active='head';s.cfg[90].degree=9;
 window.WHEEL_LOCAL_PACK={
  summary:()=>({ready:true,count:1153,images:1031,skippedUnresolved:0}),
  candidates:()=>[],
  autoCandidate:(id,gender)=>{
   if(id.region==='ch'&&id.equipmentType==='garment'&&id.slot==='head'&&id.degree===9&&gender==='man')
    return {assetSha256:hash,sourcePath:'icon/item/china/man_item/clothes_09_ha.ddj'};
   return null;
  },
  iconURL:x=>x===hash?'blob:automatic-hat':null
 };
 assert.equal(s.localIconSelections,undefined,'no manual image picks were saved');
 assert.match(hooks.uiIcon('item','head'),/data-icon-source="local-auto"/);
 assert.match(hooks.uiIcon('item','head'),/blob:automatic-hat/);
 assert.match(hooks.itemLabel('head'),/Automatikusan párosított/);
 assert.doesNotMatch(hooks.uiIcon('item','chest'),/blob:automatic-hat/);
 assert.match(hooks.localIconLibraryPanel(),/1\/11/,'spear loadout has no equipped shield');
 assert.match(hooks.localIconLibraryPanel(),/Nem kell itemenként választani/);
 assert.equal(s.localIconSelections,undefined,'auto matching must not create per-item overrides');
 s.tab='set';hooks.paint();
 assert.match(hooks.html(),/blob:automatic-hat/,'loadout updates with no manual selection');
});

test('automatic icons update on gender switch and item degree; missing sources fall back',()=>{
 const {hooks,window}=boot(),s=hooks.state();
 s.apparelStyle='ch_armor';s.cfg[90].degree=9;
 window.WHEEL_LOCAL_PACK={
  summary:()=>({ready:true,count:100,images:100}),
  candidates:()=>[],
  autoCandidate:(id,gender)=>
   id.region==='ch'&&id.equipmentType==='armor'&&id.slot==='head'&&id.degree===9?
    {assetSha256:gender==='woman'?'b'.repeat(64):'a'.repeat(64)}:null,
  iconURL:hash=>'blob:'+hash.slice(0,1)
 };
 assert.match(hooks.uiIcon('item','head'),/blob:a/);
 s.iconGender='woman';hooks.save();hooks.paint();
 assert.match(hooks.uiIcon('item','head'),/blob:b/);
 hooks.chooseCap(100);
 assert.doesNotMatch(hooks.uiIcon('item','head'),/data-icon-source="local-auto"/);
 hooks.chooseCap(90);
 assert.equal(s.iconGender,'woman');
 assert.match(hooks.uiIcon('item','head'),/blob:b/);
 assert.equal(hooks.normalizeIconGender('corrupted'),'man');
});

test('manual slot overrides have priority over auto matching and do not affect Blue rows',()=>{
 const {hooks,window}=boot(),s=hooks.state(),hash='a'.repeat(64);
 s.apparelStyle='ch_garment';s.cfg[90].degree=9;
 const obj=s.sets[90].head,before=JSON.stringify(obj);
 window.WHEEL_LOCAL_PACK={
  summary:()=>({ready:true,count:2,images:2}),
  candidates:()=>[{assetSha256:'b'.repeat(64),gender:'man',sourcePath:'override.ddj'}],
  autoCandidate:()=>({assetSha256:hash}),
  iconURL:h=>'blob:'+h.slice(0,1)
 };
 assert.match(hooks.uiIcon('item','head'),/blob:a/);
 s.localIconSelections={[hooks.localIconChoiceKey(hooks.iconIdentity('head'))]:'b'.repeat(64)};
 assert.match(hooks.uiIcon('item','head'),/data-icon-source="local-manual"/);
 assert.match(hooks.uiIcon('item','head'),/blob:b/);
 delete s.localIconSelections[hooks.localIconChoiceKey(hooks.iconIdentity('head'))];
 assert.match(hooks.uiIcon('item','head'),/data-icon-source="local-auto"/);
 assert.equal(JSON.stringify(obj),before,'sprite state must not edit actual Wheel stat data');
});

test('gender choice is preserved per SET, CAP and multi-server JSON backup',()=>{
 const {hooks}=boot(),s=hooks.state(),baseId=s.setBank[90].activeId;
 s.iconGender='woman';hooks.save();
 hooks.createSet(false);
 assert.equal(s.iconGender,'woman','new SET inherits character appearance');
 s.iconGender='man';hooks.save();
 hooks.selectSet(baseId);
 assert.equal(s.iconGender,'woman','switching sets restores appearance');
 hooks.chooseCap(100);
 assert.equal(s.iconGender,'man','other CAP uses default appearance');
 hooks.chooseCap(90);
 assert.equal(s.iconGender,'woman');
 const snapshot=JSON.parse(JSON.stringify(hooks.exportAllProfiles()));
 const imported=boot();
 assert.equal(imported.hooks.importAllProfiles(snapshot),true);
 assert.equal(imported.hooks.state().iconGender,'woman');
 assert.doesNotMatch(JSON.stringify(snapshot),/blob:automatic|png;base64/i);
});

test('automatic icon UI remains bilingual and private, manual gallery optional only',()=>{
 const {hooks,window}=boot();
 window.WHEEL_LOCAL_PACK={
  summary:()=>({ready:true,count:1,images:1}),
  candidates:()=>[{assetSha256:'a'.repeat(64),sourcePath:'client.ddj'}],
  autoCandidate:()=>null,iconURL:()=> 'blob:local'
 };
 const hu=hooks.localIconLibraryPanel();
 assert.match(hu,/Kézi felülbírálás \(nem kötelező\)/);
 assert.match(hu,/ZIP-betöltés után/);
 assert.match(html,/id="iconGenderSel"/);
 assert.match(html,/\$\('#iconGenderSel'\)\.onchange/);
 hooks.setUiLanguage('en');
 assert.match(hooks.localIconLibraryPanel(),/Optional manual override \(not required\)/);
 assert.match(hooks.localIconLibraryPanel(),/No individual icon clicks are required/);
 assert.doesNotMatch(hooks.localIconLibraryPanel(),/fetch\(|WebSocket/);
});


test('compact workspace defaults to item editor with other long sections hidden',()=>{
 const {hooks}=boot(),html=hooks.html();
 assert.match(html,/role="tablist" aria-label="Kalkulátor munkafelület"/);
 assert.match(html,/data-workspace-pane="items"/);
 assert.match(html,/data-workspace-pane="balance"\s+hidden/);
 assert.match(html,/data-workspace-pane="analytics"\s+hidden/);
 assert.match(html,/data-workspace-pane="planner"\s+hidden/);
 assert.match(html,/data-workspace-pane="extras"\s+hidden/);
 assert.match(html,/class="workspace-item-strip"/);
 assert.equal((html.match(/class="workspace-item-button/g)||[]).length,12);
 assert.match(html,/data-editor-fold="overview"\s*>/,'full 12-slot SET is folded by default');
 assert.match(html,/data-editor-fold="guide"\s*>/);
 assert.match(html,/data-editor-fold="tools"\s*>/);
 assert.match(html,/data-editor-fold="bonus"\s*>/);
 assert.match(html,/data-editor-fold="history"\s*>/);
 assert.match(html,/id="wheel-items"/);
});

test('workspace navigation switches areas without changing SET data or stat calculations',()=>{
 const {hooks}=boot(),s=hooks.state();
 s.sets[90].head.count=1;
 s.sets[90].head.rows=[{type:'STR',value:7}];
 const before=JSON.stringify(s.sets[90]),str=hooks.total().str;
 assert.equal(hooks.chooseWorkspace('balance'),true);
 hooks.paint();
 assert.equal(hooks.workspaceActive(),'balance');
 assert.match(hooks.html(),/data-workspace-pane="balance">/);
 assert.match(hooks.html(),/data-workspace-pane="items"\s+hidden/);
 assert.match(hooks.html(),/id="wheel-balance"/);
 assert.equal(hooks.chooseWorkspace('analytics'),true);
 hooks.paint();
 assert.match(hooks.html(),/data-workspace-pane="analytics">/);
 assert.equal(hooks.chooseWorkspace('planner'),true);
 hooks.paint();
 assert.match(hooks.html(),/data-workspace-pane="planner">/);
 assert.equal(hooks.chooseWorkspace('extras'),true);
 hooks.paint();
 assert.match(hooks.html(),/data-workspace-pane="extras">/);
 assert.equal(hooks.chooseWorkspace('unknown'),false);
 assert.equal(hooks.workspaceActive(),'extras');
 assert.equal(hooks.chooseWorkspace('items'),true);
 hooks.paint();
 assert.match(hooks.html(),/data-workspace-pane="items">/);
 assert.equal(JSON.stringify(s.sets[90]),before);
 assert.equal(hooks.total().str,str);
});

test('compact workspace remains bilingual, touch-scrollable and print-safe',()=>{
 const {hooks}=boot();
 assert.match(html,/\.workspace-nav\{display:flex/);
 assert.match(html,/\.workspace-item-strip\{display:flex/);
 assert.match(html,/@media\(max-width:780px\)/);
 assert.match(html,/\.workspace-pane\[hidden\]\{display:none!important\}/);
 assert.match(html,/@media print\{[\s\S]*?\.workspace-pane\[hidden\]\{display:block!important\}/);
 assert.equal(hooks.setUiLanguage('en'),true);
 assert.match(hooks.html(),/Items \/ Wheel/);
 assert.match(hooks.html(),/Balance \/ Target/);
 assert.match(hooks.html(),/Optimize \/ Compare/);
 assert.doesNotMatch(hooks.quickItemStrip(),/data-workspace-go/);
 assert.match(hooks.quickItemStrip(),/aria-pressed="true"/);
});

test('editor advanced input panels and old SET overview are collapsed without deleting controls',()=>{
 const {hooks}=boot(),root=hooks.html();
 for(const fold of ['overview','guide','tools','bonus','history'])
  assert.match(root,new RegExp('data-editor-fold="'+fold+'"'));
 assert.match(root,/data-blue-type/);
 assert.match(root,/data-row-type=/);
 assert.match(root,/data-bonus-stat=/);
 assert.match(root,/id="snapshotBtn"/);
 assert.match(root,/id="localIconZip"/);
 assert.equal(hooks.editorFolds().overview,false);
 assert.equal(hooks.editorFolds().bonus,false);
});
