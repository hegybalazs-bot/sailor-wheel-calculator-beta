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
 const elements={},store={},writeFailures={};
 const el=(selector)=>elements[selector]??={
  innerHTML:'',value:'',textContent:'',
  classList:{add(){},remove(){},toggle(){}},
  remove(){},
  click(){this.onclick?.();}
 };
 const document={
  querySelector:el,
  querySelectorAll:()=>[],
  createElement:tag=>({tagName:tag,style:{},remove(){},click(){},append(){},select(){}}),
  body:{append(){}}
 };
 const sandbox={
  document,localStorage:{getItem:key=>store[key]??null,setItem:(key,v)=>{if(writeFailures[key]>0){writeFailures[key]--;throw Error('QuotaExceededError')}store[key]=String(v);},removeItem:key=>{delete store[key];}},
  window:{print(){}},prompt:()=>null,confirm:()=>true,alert:()=>{},
  setTimeout:()=>0,clearTimeout:()=>{},
  Blob:class Blob{},URL:{createObjectURL:()=> 'blob:public-test',revokeObjectURL(){}}
 };
 vm.createContext(sandbox);
 vm.runInContext(inline(html)+`
;globalThis.audit={
 state:()=>S,html:()=>document.querySelector('#root').innerHTML,
 inspectImportBackup,backupImportConfirmation,exportAllProfiles,importAllProfiles,
 save,staleWheelPair,staleState:()=>STORAGE_STALE,
 exportManualRuleTemplate,inspectManualRuleTemplate,applyManualRuleTemplate,
 addServerProfile,deleteServerProfile,serverProfiles:()=>P,
 deleteSet,
 resetCurrentCapRules,resetAllSavedProfiles,
 paint,setLanguage:setUiLanguage,selectedTab:()=>S.tab,
 items:()=>itemList(),renderEditor:()=>editPanel()
};`,sandbox,{timeout:7000});
 return {audit:sandbox.audit,store,document,failNextWrite:key=>{writeFailures[key]=(writeFailures[key]||0)+1;}};
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


test('compact Silkroad shell keeps all existing controls accessible in expandable management panels',()=>{
 for(const page of [base,publicHtml]){
  assert.match(page,/<details class="beta-caution">[\s\S]*?<summary>⚠ BÉTA/);
  assert.match(page,/<details class="compact-manage"><summary>⚙ Szerver beállításai<\/summary>/);
  assert.match(page,/<details class="compact-manage set-manage"><summary>⚙ SET kezelése<\/summary>/);
  assert.match(page,/<div class="controls" role="group" aria-label="Gyors karakterbeállítások, vízszintesen görgethető">/);
  for(const id of ['serverPicker','newServerBtn','renameServerBtn','deleteServerBtn','setPicker','newSetBtn','copySetBtn','renameSetBtn','deleteSetBtn','capSel','degreeInput','weaponSel','apparelStyleSel','iconGenderSel','capQuick','capApply','goalSel','applyGoalAll','exportBtn','importBtn'])
   assert.match(page,new RegExp('id="'+id+'"'),id);
  const band=page.slice(page.indexOf('<div class="controls"'),page.indexOf('<div class="weapon-strip"'));
  assert(band.indexOf('id="capSel"')<band.indexOf('id="degreeInput"'));
  assert(band.indexOf('id="degreeInput"')<band.indexOf('id="weaponSel"'));
  assert(band.indexOf('id="weaponSel"')<band.indexOf('id="capQuick"'));
  assert.match(page,/\.controls\{display:flex;flex-wrap:nowrap;overflow-x:auto/);
 }
});


test('Silkroad feedback and public save status use correct beta naming and no preview labels',()=>{
 const feedback=fs.readFileSync(path.join(__dirname,'..','visszajelzes.html'),'utf8');
 assert.match(feedback,/<title>Silkroad Wheel Calculator – Béta visszajelzés<\/title>/);
 assert.match(feedback,/Silkroad caravan visual language/);
 assert.match(feedback,/Emerald v5 BETA/);
 assert.doesNotMatch(feedback,/Emerald v4\.10\.0/);
 assert.match(publicHtml,/id="saveStatus" role="status" aria-live="polite"/);
 assert.match(publicHtml,/✓ SET helyben mentve/);
 assert.match(publicHtml,/✓ Set saved in this browser/);
 assert.doesNotMatch(publicHtml,/Emerald v5 preview set saved|Emerald v5 előzetes SET mentve/);
});

test('public calculator links to a distinct same-origin one-time icon recovery page',()=>{
 assert.match(publicHtml,/href="ikon-helyreallitas\.html"/);
 assert.doesNotMatch(publicHtml.slice(0,publicHtml.indexOf('<script>')),/id="iconPack"|id="localIconZip"|data-pick-local-icon/);
 const recovery=fs.readFileSync(path.join(__dirname,'..','ikon-helyreallitas.html'),'utf8');
 assert.match(recovery,/WHEEL_LOCAL_PACK\.importFile\(file\)/);
 assert.match(recovery,/WHEEL_LOCAL_PACK\.restore\(\)/);
 assert.match(recovery,/90 CAP, 9DG/);
 assert.match(recovery,/fájlokat nem/);
 assert.doesNotMatch(recovery,/admin|data-custom-icon|data-icon-itemcode/i);
});

test('safe import preview validates profiles and previews CAP/SET counts without mutating state',()=>{
 const {audit}=boot(publicHtml);
 const snapshot=audit.exportAllProfiles();
 const prior=JSON.stringify(audit.state());
 const detail=audit.inspectImportBackup(snapshot);
 assert.equal(detail.count,1);
 assert.equal(detail.cap,90);
 assert.equal(detail.name,'Sailor Online');
 assert(detail.sets>=7);
 assert.match(audit.backupImportConfirmation(detail),/MENTÉS BETÖLTÉSE/);
 assert.match(audit.backupImportConfirmation(detail),/Szerverprofilok: 1/);
 assert.match(audit.backupImportConfirmation(detail),/automatikusan letöltünk/);
 assert.equal(JSON.stringify(audit.state()),prior);
 audit.setLanguage('en');
 assert.match(audit.backupImportConfirmation(detail),/IMPORT PREVIEW/);
 assert.match(audit.backupImportConfirmation(detail),/downloaded BEFORE importing/);
 assert.throws(()=>audit.inspectImportBackup({cfg:{},sets:{}}),/mentés/);
 const duplicate=structuredClone(snapshot);
 duplicate.serverProfiles.entries.push(structuredClone(duplicate.serverProfiles.entries[0]));
 assert.throws(()=>audit.inspectImportBackup(duplicate),/ismétlődő/);
 const missing=structuredClone(snapshot);
 missing.serverProfiles.activeId='not-present';
 assert.throws(()=>audit.inspectImportBackup(missing),/hiányzik/);
});
test('safe import invokes pre-import JSON download before data replacement in both interfaces',()=>{
 for(const html of [base,publicHtml]){
  const download=html.indexOf("downloadBlob('Wheel_Calculator_Import_Elotti_Mentes_");
  assert(download>0);
  const importAt=html.indexOf('importAllProfiles(data);',download);
  assert(importAt>download);
  assert.match(html,/MAX_BACKUP_IMPORT_BYTES=10\*1024\*1024/);
  assert.match(html,/inspectImportBackup\(data\)/);
  assert.match(html,/Régi weboldal adatai áthozása/);
  assert.match(html,/sailor-wheel-calculator-beta\.onrender\.com\/publikus\.html/);
 }
});

test('server deletion guards final profile and preserves the other server/CAP/SET state',()=>{
 for(const html of [base,publicHtml]){
  const {audit}=boot(html);
  const originalId=audit.serverProfiles().activeId;
  assert.equal(audit.deleteServerProfile(),false,'the final server cannot be deleted');
  assert.equal(audit.serverProfiles().entries.length,1);
  assert.equal(audit.addServerProfile('Pirate Test Server'),true);
  assert.equal(audit.serverProfiles().entries.length,2);
  const removedId=audit.serverProfiles().activeId;
  assert.notEqual(removedId,originalId);
  const before=audit.exportAllProfiles();
  assert.equal(before.serverProfiles.entries.length,2);
  assert.equal(before.serverProfiles.entries.find(e=>e.id===removedId).name,'Pirate Test Server');
  assert.equal(audit.deleteServerProfile(),true,'delete active temporary server');
  assert.equal(audit.serverProfiles().entries.length,1);
  assert.equal(audit.serverProfiles().activeId,originalId,'select original surviving profile');
  assert.equal(audit.state().cap,90);
  assert.equal(audit.deleteServerProfile(),false,'cannot delete last profile after switching');
  assert.match(html, /Wheel_Calculator_Server_Torles_Elotti_Mentes_/);
  assert.match(html,/id="deleteServerBtn"/);
 }
});

test('SET deletion safeguards the final SET and leaves other CAPs and server profiles intact',()=>{
 for(const html of [base,publicHtml]){
  const {audit}=boot(html),state=audit.state();
  assert.equal(audit.deleteSet(),false);
  const bank=state.setBank[90],cap100Before=JSON.stringify(state.setBank[100]);
  const duplicate=structuredClone(bank.entries[0]);
  duplicate.id='disposable-90';duplicate.name='Disposable 90 SET';
  bank.entries.push(duplicate);bank.activeId=duplicate.id;
  assert.equal(audit.deleteSet(),true);
  assert.equal(bank.entries.length,1);
  assert.equal(bank.activeId,bank.entries[0].id);
  assert.equal(JSON.stringify(state.setBank[100]),cap100Before);
  assert.equal(audit.deleteSet(),false);
  assert.match(html,/Wheel_Calculator_Set_Torles_Elotti_Mentes_/);
  assert.match(html,/id="deleteSetBtn"/);
  assert.match(html,/remove\.disabled=bank\.entries\.length<=1/);
 }
});

test('workspace tabs expose roving keyboard navigation, Blue focus recovery and persistent live announcements',()=>{
 for(const html of [base,publicHtml]){
  assert.match(html,/data-workspace-go="\$\{p\.id\}" aria-selected="\$\{WORKSPACE_ACTIVE===p\.id\}" tabindex="\$\{WORKSPACE_ACTIVE===p\.id\?'0':'-1'\}"/);
  assert.match(html,/event\.key==='ArrowRight'/);
  assert.match(html,/event\.key==='ArrowLeft'/);
  assert.match(html,/event\.key==='Home'/);
  assert.match(html,/event\.key==='End'/);
  assert.match(html,/setAttribute\('tabindex',selected\?'0':'-1'\)/);
  assert.match(html,/function rememberWheelFocus\(\)/);
  assert.match(html,/const keepBlueOpen=\$\('#blue-catalog'\)\?\.open===true/);
  assert.match(html,/id="wheelAnnouncer" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(html,/const announcer=\$\('#wheelAnnouncer'\)/);
  assert.match(html,/target\.focus\(\{preventScroll:true\}\)/);
 }
});

test('failed second-key localStorage write rolls back import instead of silently claiming success',()=>{
 for(const html of [base,publicHtml]){
  const {audit,store,failNextWrite}=boot(html);
  const incoming=JSON.parse(JSON.stringify(audit.exportAllProfiles()));
  // The incoming SET is meaningfully different and has a valid active profile.
  incoming.cap=130;
  incoming.serverProfiles.entries.find(e=>e.id===incoming.serverProfiles.activeId).data.cap=130;
  const original=JSON.stringify(audit.state());
  const savedState=store['sailor-wheel-calculator-v4'];
  const savedProfiles=store['wheel-calculator-server-profiles-v1'];
  assert(savedState&&savedProfiles);
  // The first key will already have changed when the second write throws.
  failNextWrite('wheel-calculator-server-profiles-v1');
  assert.throws(()=>audit.importAllProfiles(incoming),/nem tudta teljesen eltárolni/i);
  assert.equal(JSON.stringify(audit.state()),original,'in-memory current SET and CAP rolled back');
  assert.equal(store['sailor-wheel-calculator-v4'],savedState,'first partially written key rolled back');
  assert.equal(store['wheel-calculator-server-profiles-v1'],savedProfiles,'second key preserved');
  assert.equal(audit.state().cap,90);
  assert.equal(audit.importAllProfiles(incoming),true,'next import succeeds when storage recovers');
  assert.equal(audit.state().cap,130);
 }
});
test('failed first-key localStorage write also leaves all server data untouched',()=>{
 const {audit,store,failNextWrite}=boot(publicHtml);
 const incoming=JSON.parse(JSON.stringify(audit.exportAllProfiles()));
 incoming.cap=120;
 incoming.serverProfiles.entries.find(e=>e.id===incoming.serverProfiles.activeId).data.cap=120;
 const before=JSON.stringify(audit.state());
 const keys=JSON.stringify(store);
 failNextWrite('sailor-wheel-calculator-v4');
 assert.throws(()=>audit.importAllProfiles(incoming),/nem tudta teljesen eltárolni/i);
 assert.equal(JSON.stringify(audit.state()),before);
 assert.equal(JSON.stringify(store),keys);
});

test('CAP/Degree rule-only JSON export excludes personal SETs, rolls, item history and server names',()=>{
 for(const html of [base,publicHtml]){
  const {audit}=boot(html),data=audit.exportManualRuleTemplate();
  assert.equal(data.kind,'wheel-manual-cap-degree-rules-v1');
  assert.equal(data.cap,90);
  assert.equal(data.degree,9);
  assert.equal(data.maxima.maxSTR,11);
  assert.equal(data.gradeMax.SoS,9);
  assert.equal(data.blueTypes.shoulder.length>0,true);
  assert.equal(data.chances.shoulder&&typeof data.chances.shoulder==='object',true);
  const json=JSON.stringify(data);
  for(const privateField of ['serverProfiles','setBank','sets','weaponInventory','history',
    'apparelStyle','serverName','localIconSelections','balanceBases']){
   assert.equal(Object.prototype.hasOwnProperty.call(data,privateField),false,privateField);
  }
  assert.doesNotMatch(json,/"serverProfiles"|"weaponInventory"|"setBank"|"history"|"items"/);
  const scan=audit.inspectManualRuleTemplate(JSON.parse(json));
  assert.equal(scan.cap,90);assert.equal(scan.degree,9);
  assert(scan.types>0);
 }
});
test('manual rule-only import updates Blue limits but preserves the current SET and all other CAPs',()=>{
 const {audit,store}=boot(publicHtml),state=audit.state();
 const beforeSet=JSON.stringify(state.sets[90].shoulder);
 const cap100=JSON.stringify(state.cfg[100]);
 const beforeProfiles=JSON.parse(store['wheel-calculator-server-profiles-v1']);
 const data=JSON.parse(JSON.stringify(audit.exportManualRuleTemplate()));
 data.maxima.maxAR=58;
 data.gradeMax.SoS=12;
 data.blueTypes.shoulder=['STR','INT'];
 data.chances.shoulder={STR:'55',INT:'45'};
 data.blueMaxima.STUN=87;
 const result=audit.applyManualRuleTemplate(data);
 assert.equal(result.cap,90);
 assert.equal(audit.state().cfg[90].maxAR,58);
 assert.equal(audit.state().cfg[90].gradeMax.SoS,12);
 assert.deepEqual(Array.from(audit.state().blueCatalogOverrides['90_9'].shoulder),['STR','INT']);
 assert.equal(audit.state().blueTypeMaxima['90_9'].STUN,87);
 assert.equal(JSON.stringify(audit.state().sets[90].shoulder),beforeSet);
 assert.equal(JSON.stringify(audit.state().cfg[100]),cap100);
 assert.equal(JSON.parse(store['wheel-calculator-server-profiles-v1']).activeId,beforeProfiles.activeId);
 assert.equal(audit.state().cap,90);
});
test('manual rule-only import validates scope/Blue catalog/maxima and never edits state on rejection',()=>{
 const {audit}=boot(publicHtml);
 const data=JSON.parse(JSON.stringify(audit.exportManualRuleTemplate()));
 const baseline=JSON.stringify(audit.state());
 for(const mutator of [
  x=>{x.cap=110;},
  x=>{x.degree=12;},
  x=>{x.kind='full-backup';},
  x=>{x.maxima.maxSTR=1000;},
  x=>{x.gradeMax.Sun=99;},
  x=>{x.blueTypes.shoulder=['STR','STR'];},
  x=>{x.blueTypes.shoulder=['NOT_BLUE'];},
  x=>{x.chances.shoulder={STR:101};},
  x=>{x.blueMaxima.STUN=-1;},
  x=>{x.blueMaxima.UNKNOWN=50;}
 ]){
  const malformed=JSON.parse(JSON.stringify(data));
  mutator(malformed);
  assert.throws(()=>audit.inspectManualRuleTemplate(malformed));
  assert.equal(JSON.stringify(audit.state()),baseline);
 }
});

test('cross-tab state conflict refuses to overwrite a newer saved SET and allows an emergency JSON export',()=>{
 for(const html of [base,publicHtml]){
  const {audit,store,document}=boot(html);
  const stateKey='sailor-wheel-calculator-v4';
  const profileKey='wheel-calculator-server-profiles-v1';
  assert(store[stateKey]&&store[profileKey]);
  const fromOtherTab=JSON.parse(store[stateKey]);
  fromOtherTab.goal=88;
  store[stateKey]=JSON.stringify(fromOtherTab);
  const latest=store[stateKey],profiles=store[profileKey];
  audit.state().goal=62;
  assert.equal(audit.save(),false,'stale tab must not write');
  assert.equal(store[stateKey],latest,'other tab saved state must stay intact');
  assert.equal(store[profileKey],profiles,'other tab profiles must stay intact');
  assert.equal(audit.staleState(),true);
  assert.match(document.querySelector('#saveStatus').textContent,/Másik böngészőlapon|Another tab/);
  assert.equal(audit.exportAllProfiles().goal,62,'the unsaved edits remain downloadable as JSON');
  assert.equal(audit.save(),false,'retries cannot silently take over saved data');
 }
});
test('second browser tab can change only server profile metadata and still be protected',()=>{
 const {audit,store}=boot(publicHtml);
 const key='wheel-calculator-server-profiles-v1';
 const profile=JSON.parse(store[key]);
 profile.entries[0].name='Updated in tab A';
 store[key]=JSON.stringify(profile);
 const old=store[key];
 audit.state().goal=44;
 assert.equal(audit.save(),false);
 assert.equal(store[key],old);
 assert.equal(audit.staleState(),true);
});

test('CAP rules reset includes manual Blue type/maximum/probability rules without deleting stored SETs',()=>{
 for(const html of [base,publicHtml]){
  const {audit,store}=boot(html),st=audit.state();
  const originalSet=JSON.stringify(st.setBank[90].entries.map(e=>({id:e.id,name:e.name,data:e.data})));
  st.cfg[90].maxAR=58;
  st.blueCatalogOverrides??={};st.blueCatalogOverrides['90_9']={shoulder:['STR','INT']};
  st.blueTypeMaxima??={};st.blueTypeMaxima['90_9']={STUN:87};
  st.blueChanceProfiles??={};st.blueChanceProfiles['90_9']={shoulder:{STR:60,INT:40}};
  st.blueCatalogOverrides['100_10']={shoulder:['STR']};
  assert.equal(audit.resetCurrentCapRules(),true);
  assert.equal(audit.state().cfg[90].maxAR,40);
  assert.equal(audit.state().blueCatalogOverrides['90_9'],undefined);
  assert.equal(audit.state().blueTypeMaxima['90_9'],undefined);
  assert.equal(audit.state().blueChanceProfiles['90_9'],undefined);
  assert.deepEqual(Array.from(audit.state().blueCatalogOverrides['100_10'].shoulder),['STR']);
  assert.equal(JSON.stringify(audit.state().setBank[90].entries.map(e=>({id:e.id,name:e.name,data:e.data}))),originalSet);
  // Save refreshes updatedAt; that timestamp is metadata, not a SET/item change.
  assert.match(html,/Wheel_Cap_Szabalyok_Elotti_Mentes/);
  assert.equal(JSON.parse(store['sailor-wheel-calculator-v4']).cfg[90].maxAR,40);
 }
});
test('global reset actually removes all other server profiles and supports rollback after quota error',()=>{
 for(const html of [base,publicHtml]){
  const {audit,store,failNextWrite}=boot(html);
  assert.equal(audit.addServerProfile('Rumlord'),true);
  audit.state().goal=93;
  assert.equal(audit.save(),true);
  const beforeState=store['sailor-wheel-calculator-v4'];
  const beforeProfiles=store['wheel-calculator-server-profiles-v1'];
  assert.equal(audit.serverProfiles().entries.length,2);
  failNextWrite('wheel-calculator-server-profiles-v1');
  assert.equal(audit.resetAllSavedProfiles(),false);
  assert.equal(store['sailor-wheel-calculator-v4'],beforeState);
  assert.equal(store['wheel-calculator-server-profiles-v1'],beforeProfiles);
  assert.equal(audit.serverProfiles().entries.length,2);
  assert.equal(audit.state().goal,93);
  assert.equal(audit.resetAllSavedProfiles(),true);
  assert.equal(audit.serverProfiles().entries.length,1);
  assert.equal(audit.serverProfiles().activeId,'srv_sailor');
  assert.equal(audit.state().cap,90);
  assert.equal(audit.state().goal,75);
  assert.equal(JSON.parse(store['wheel-calculator-server-profiles-v1']).entries.length,1);
  assert.match(html,/Wheel_Osszes_Adat_Torles_Elotti_Mentes/);
 }
});
