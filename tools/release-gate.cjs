'use strict';
/* Strict proof-of-work release gate. Run:
 *   node tools/release-gate.cjs          # factual beta summary; success if data schema valid
 *   node tools/release-gate.cjs --stable # fails unless independently evidenced
 */
const fs=require('node:fs');
const path=require('node:path');
const evidencePath=path.resolve(__dirname,'../data/release-evidence.json');
const allowed=new Set(['pending','verified']);
const sourceStatuses=new Set(['pending','verified','reference_only']);
const capList=[90,100,110,120,125,130,140];
function fail(msg){throw Error('Release evidence error: '+msg);}
function checkEvidence(e){
 if(!e||e.schemaVersion!==1||e.stage!=='beta'&&e.stage!=='stable')fail('invalid version/stage');
 if(e.server!=='Sailor Online'||!Array.isArray(e.capScopes)||e.capScopes.length!==7)fail('missing server CAP scopes');
 const caps=e.capScopes.map(x=>x.cap);
 if(JSON.stringify(caps)!==JSON.stringify(capList))fail('missing/reordered CAP profiles');
 let unresolved=0;const reasons=[];
 for(const item of e.capScopes){
  for(const prop of ['blueCatalog','lineLimits','statMaximums']){
   if(!allowed.has(item[prop]))fail(item.cap+' '+prop+' invalid status');
   if(item[prop]!=='verified'){unresolved++;reasons.push(item.cap+' CAP '+prop);}
  }
  if(!['unknown','verified'].includes(item.officialOdds))fail('invalid odds status');
  if(item.officialOdds!=='verified'){unresolved++;reasons.push(item.cap+' CAP official probability');}
  if(item.degree!==null&&(!Number.isInteger(item.degree)||item.degree<1||item.degree>20))fail('invalid degree');
 }
 if(!Array.isArray(e.gameMechanics)||e.gameMechanics.length!==3)fail('3 Wheel stages required');
 for(const m of e.gameMechanics){
  if(!sourceStatuses.has(m.status))fail('invalid Wheel evidence status');
  if(m.status!=='verified'){unresolved++;reasons.push(m.name+' mechanics');}
 }
 const x=e.equipmentVerification;
 if(!x||!allowed.has(x.status)||!Array.isArray(x.approvedItemEvidence))fail('invalid item evidence');
 if(x.status==='verified'){
  if(!x.approvedItemEvidence.length||x.approvedItemEvidence.some(row=>!row?.url||!row?.approvedBy||!row?.reviewedAt))
   fail('item verification requires screenshot/source and reviewer details');
 }else{unresolved++;reasons.push('equipment slot and Blue image evidence');}
 const icons=e.icons||{};
 if(!['permission_pending','permission_granted'].includes(icons.publicRedistribution))fail('invalid icon permission');
 if(icons.publicRedistribution!=='permission_granted'){unresolved++;reasons.push('rights to distribute game artwork');}
 const admin=e.adminApproval||{};
 if(!allowed.has(admin.status))fail('invalid admin approval status');
 if(admin.status==='verified'&&(!admin.reviewer||!admin.reviewDate||!/^https:\/\//.test(admin.evidenceUrl||'')))
  fail('admin approvals require reviewer, date and HTTPS source');
 if(admin.status!=='verified'){unresolved++;reasons.push('named admin approval');}
 for(const mode of ['physicalAndroid','physicalIOS','screenReader','backupRoundtripPhysicalBrowsers']){
  const v=e.qa?.[mode];
  if(!['passed','not_run','failed'].includes(v))fail('invalid QA state '+mode);
  if(v!=='passed'){unresolved++;reasons.push(mode);}
 }
 for(const prop of ['renderAutoDeployWebhook','adminAccess']){
  const accepted=prop==='adminAccess'?['authenticated','not_authenticated']:['verified','unverified'];
  if(!accepted.includes(e.delivery?.[prop]))fail('invalid delivery status '+prop);
  if(e.delivery[prop]!==(prop==='adminAccess'?'authenticated':'verified')){unresolved++;reasons.push(prop);}
 }
 if(e.stage==='stable'&&unresolved)fail('cannot label stable while '+unresolved+' gates unresolved');
 return {stage:e.stage,unresolved,reasons};
}
function main(argv=process.argv.slice(2)){
 const e=JSON.parse(fs.readFileSync(evidencePath,'utf8')),report=checkEvidence(e);
 console.log('Wheel Calculator release gate: '+report.stage.toUpperCase());
 console.log('Unresolved evidence/QA gates: '+report.unresolved);
 for(const r of report.reasons)console.log('PENDING '+r);
 if(argv.includes('--stable')&&report.unresolved)fail('stable release BLOCKED; '+report.unresolved+' gates unresolved');
 return report;
}
if(require.main===module){
 try{main();}catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={checkEvidence,main};
