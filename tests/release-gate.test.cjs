'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {checkEvidence}=require('../tools/release-gate.cjs');
const manifest=require('../data/release-evidence.json');
const copy=x=>JSON.parse(JSON.stringify(x));
test('manual per-server data is the contract; official Sailor approval is not required',()=>{
 const out=checkEvidence(manifest);
 assert.equal(out.stage,'beta');
 assert.equal(out.manual,true);
 assert.equal(manifest.configurationPolicy.officialApprovalRequired,false);
 assert.equal(manifest.configurationPolicy.externalServerSync,false);
 assert.equal(manifest.adminApproval.status,'not_required');
 assert(manifest.capScopes.every(x=>x.blueCatalog==='editable'&&
  x.lineLimits==='editable'&&x.statMaximums==='editable'&&x.officialOdds==='unknown'));
 assert(out.unresolved>0);
 assert(!out.reasons.some(x=>/90 CAP|official|admin|art|icons|render/i.test(x)));
});
test('stable release is blocked only by real independent QA, not generic editable presets',()=>{
 const x=copy(manifest);x.stage='stable';
 assert.throws(()=>checkEvidence(x),/cannot label stable/);
 for(const name of ['physicalAndroid','physicalIOS','screenReader','backupRoundtripPhysicalBrowsers']){
  x.qa[name]='passed';
  x.qaEvidence[name]={proofUrl:'https://example.org/testing/'+name,reviewedBy:'Tester',
   reviewedAt:'2026-11-09'};
 }
 assert.equal(checkEvidence(x).unresolved,0);
 assert.equal(checkEvidence(x).stage,'stable');
 // Unverified official mechanics, private images and autoDeploy are not falsely
 // described as verified, and aren't prerequisites of a manual, public-only tool.
 assert.equal(x.capScopes[0].officialOdds,'unknown');
 assert.equal(x.delivery.renderAutoDeployWebhook,'unverified');
 assert.equal(x.icons.publicRedistribution,'permission_pending');
});
test('manual mode, all CAPs, three Wheel stages and QA cannot vanish silently',()=>{
 for(const mutation of [
  x=>{delete x.productMode;},
  x=>{x.configurationPolicy.officialApprovalRequired=true;},
  x=>{x.configurationPolicy.externalServerSync=true;},
  x=>{x.capScopes.pop();},
  x=>{x.capScopes[0].blueCatalog='not_a_real_status';},
  x=>{x.capScopes[0].officialOdds='about_30_percent';},
  x=>{x.gameMechanics.pop();},
  x=>{x.qa.physicalIOS='omitted';},
  x=>{x.delivery.publicPlayerOnly=false;},
  x=>{x.icons.allowedPublicAssets='Any game PNG';},
  x=>{x.delivery.adminAccess='secret_link_only';}
 ]){
  const x=copy(manifest);mutation(x);
  assert.throws(()=>checkEvidence(x));
 }
});
test('manual inputs never imply official odds or fake verified Blue limits',()=>{
 const a=copy(manifest);a.capScopes[0].blueCatalog='verified';
 assert.throws(()=>checkEvidence(a),/cannot be declared officially verified/);
 const b=copy(manifest);b.capScopes[0].officialOdds='verified';
 assert.throws(()=>checkEvidence(b),/source, reviewer and methodology/);
 const c=copy(manifest);c.gameMechanics[0].status='verified';
 assert.throws(()=>checkEvidence(c),/dated reviewer/);
});
test('screenshot approvals and game copyright cannot be fabricated',()=>{
 const x=copy(manifest);x.equipmentVerification.status='verified';
 assert.throws(()=>checkEvidence(x),/item verification claim requires proof/);
 const y=copy(manifest);y.icons.publicRedistribution='permission_granted';
 assert.throws(()=>checkEvidence(y),/rights for game graphics/);
 const z=copy(manifest);z.adminApproval.status='verified';
 assert.throws(()=>checkEvidence(z),/admin approval claim requires/);
});
test('cannot certify physical QA or deployment without actual proof',()=>{
 const x=copy(manifest);x.qa.physicalAndroid='passed';
 assert.throws(()=>checkEvidence(x),/reviewer, test date and evidence URL/);
 const y=copy(manifest);y.delivery.renderAutoDeployWebhook='verified';
 assert.throws(()=>checkEvidence(y),/requires evidence/);
 const z=copy(manifest);z.delivery.adminAccess='authenticated';
 assert.throws(()=>checkEvidence(z),/requires evidence/);
});
