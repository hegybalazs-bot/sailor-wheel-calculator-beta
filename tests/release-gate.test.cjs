'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {checkEvidence}=require('../tools/release-gate.cjs');
const manifest=require('../data/release-evidence.json');
const copy=x=>JSON.parse(JSON.stringify(x));
test('release evidence is well-formed and cannot masquerade as stable',()=>{
 const out=checkEvidence(manifest);
 assert.equal(out.stage,'beta');
 assert(out.unresolved>0);
 assert.match(out.reasons.join('|'),/rights|admin|90 CAP|official probability/);
});
test('stable release cannot be declared while unverified data remains',()=>{
 const x=copy(manifest);x.stage='stable';
 assert.throws(()=>checkEvidence(x),/cannot label stable/);
});
test('CAP, official odds, 3 Wheel stages and required QA coverage cannot vanish silently',()=>{
 for(const mutation of [
  x=>{x.capScopes.pop();},
  x=>{x.capScopes[0].officialOdds='about_30_percent';},
  x=>{x.gameMechanics.pop();},
  x=>{x.qa.physicalIOS='omitted';},
  x=>{x.equipmentVerification.approvedItemEvidence='auto-approved';},
  x=>{x.delivery.adminAccess='secret_link_only';}
 ]){
  const x=copy(manifest);mutation(x);
  assert.throws(()=>checkEvidence(x));
 }
});
test('fake admin approval or fake item verification is rejected',()=>{
 const x=copy(manifest);x.adminApproval.status='verified';
 assert.throws(()=>checkEvidence(x),/admin approvals require/);
 const y=copy(manifest);y.equipmentVerification.status='verified';
 assert.throws(()=>checkEvidence(y),/requires screenshot/);
});
test('CAP 90 9DG remains explicitly pending and not published as official Sailor odds',()=>{
 assert.equal(manifest.capScopes[0].cap,90);
 assert.equal(manifest.capScopes[0].degree,9);
 assert.equal(manifest.capScopes[0].officialOdds,'unknown');
 assert.equal(manifest.adminApproval.status,'pending');
 assert.equal(manifest.icons.publicRedistribution,'permission_pending');
});

test('cannot spoof verified CAP limits or official probabilities without source and methodology',()=>{
 const a=copy(manifest);a.capScopes[0].blueCatalog='verified';
 assert.throws(()=>checkEvidence(a),/requires reviewer/);
 const b=copy(manifest);b.capScopes[0].officialOdds='verified';
 assert.throws(()=>checkEvidence(b),/odds require/);
});
test('cannot claim copied game graphics have permission without rights holder and license',()=>{
 const x=copy(manifest);x.icons.publicRedistribution='permission_granted';
 assert.throws(()=>checkEvidence(x),/rights holder/);
});
test('cannot certify mobile devices or deployment without proof',()=>{
 const x=copy(manifest);x.qa.physicalAndroid='passed';
 assert.throws(()=>checkEvidence(x),/requires a reviewer/);
 const y=copy(manifest);y.delivery.renderAutoDeployWebhook='verified';
 assert.throws(()=>checkEvidence(y),/proof URL/);
 const z=copy(manifest);z.delivery.adminAccess='authenticated';
 assert.throws(()=>checkEvidence(z),/proof URL/);
});
test('cannot certify Wheel semantics from a third-party summary alone',()=>{
 const x=copy(manifest);x.gameMechanics[0].status='verified';
 assert.throws(()=>checkEvidence(x),/requires official source/);
});
