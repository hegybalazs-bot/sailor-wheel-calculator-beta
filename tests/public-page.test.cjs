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
  document,localStorage:{getItem:key=>store[key]??null,setItem:(key,v)=>{store[key]=String(v);}},
  window:{print(){}},prompt:()=>null,confirm:()=>true,alert:()=>{},
  setTimeout:()=>0,clearTimeout:()=>{},
  Blob:class Blob{},URL:{createObjectURL:()=> 'blob:public-test',revokeObjectURL(){}}
 };
 vm.createContext(sandbox);
 vm.runInContext(inline(html)+`
;globalThis.audit={
 state:()=>S,html:()=>document.querySelector('#root').innerHTML,
 inspectImportBackup,backupImportConfirmation,exportAllProfiles,
 addServerProfile,deleteServerProfile,serverProfiles:()=>P,
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
