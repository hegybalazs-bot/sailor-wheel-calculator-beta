'use strict';
/* Manual-only Wheel Calculator release checks. Official Sailor server approval
 * is deliberately NOT a publication requirement. The client stores only each
 * player's manually entered CAP/Degree/Blue data and conditional assumptions.
 *
 * node tools/release-gate.cjs          # factual current beta report
 * node tools/release-gate.cjs --stable # gates on independent device/access QA
 */
const fs=require('node:fs');
const path=require('node:path');
const evidencePath=path.resolve(__dirname,'../data/release-evidence.json');
const caps=[90,100,110,120,125,130,140];
const modes={
 mode:'manual_per_server_cap_degree',
 blueTypes:'player_selected_per_item',
 blueMaxima:'player_entered_per_cap_degree_or_row',
 lineLimits:'player_editable_per_grade_and_item',
 odds:'hypothetical_only_when_entered'
};
const qaRequired=['physicalAndroid','physicalIOS','screenReader','backupRoundtripPhysicalBrowsers'];
const sourceStatuses=new Set(['pending','verified','reference_only']);
function fail(message){throw Error('Release evidence error: '+message);}
function verifiableUrl(url){return typeof url==='string'&&/^https:\/\/[^\s<>"']{5,512}$/i.test(url);}
function hasReviewer(x){return typeof x.verifiedBy==='string'&&x.verifiedBy.trim().length>1&&
 /^20\d{2}-\d{2}-\d{2}$/.test(x.reviewedAt||'');}
function checkEvidence(e){
 if(!e||e.schemaVersion!==1||!['beta','stable'].includes(e.stage))fail('invalid version/stage');
 if(e.productMode!=='manual_configuration')fail('manual-only product mode required');
 if(!e.configurationPolicy||Object.entries(modes).some(([k,v])=>e.configurationPolicy[k]!==v)||
  e.configurationPolicy.externalServerSync!==false||
  e.configurationPolicy.officialApprovalRequired!==false)fail('must use user-configured rules without server sync or official approval');
 if(e.server!=='Sailor Online'||!Array.isArray(e.capScopes)||e.capScopes.length!==caps.length||
  JSON.stringify(e.capScopes.map(x=>x.cap))!==JSON.stringify(caps))fail('missing/reordered editable CAP profiles');
 const advisory=[],blockers=[];
 // Legacy source statuses only matter IF someone explicitly claims official verification.
 for(const item of e.capScopes){
  for(const field of ['blueCatalog','lineLimits','statMaximums']){
   if(!['editable','verified'].includes(item[field]))fail(item.cap+' CAP '+field+' must be editable or independently verified');
   if(item[field]==='verified'&&(!hasReviewer(item)||!verifiableUrl(item.sources?.[field])))
    fail(item.cap+' CAP '+field+' cannot be declared officially verified without provenance');
  }
  if(!['unknown','verified'].includes(item.officialOdds))fail('invalid official odds status');
  if(item.officialOdds==='verified'&&(!hasReviewer(item)||!verifiableUrl(item.sources?.officialOdds)||
   typeof item.oddsMethodology!=='string'||item.oddsMethodology.length<15))
   fail(item.cap+' CAP claimed official odds require source, reviewer and methodology');
  if(item.degree!==null&&(!Number.isInteger(item.degree)||item.degree<1||item.degree>20))
   fail('invalid degree');
  // No approval needed; editing parameters yourself is the design, not missing QA.
 }
 advisory.push('Server/CAP/Degree Blue types, values, grade row limits and odds are user-editable; not a Sailor official claim');
 if(!Array.isArray(e.gameMechanics)||e.gameMechanics.length!==3)fail('3 Wheel stages required');
 for(const m of e.gameMechanics){
  if(!sourceStatuses.has(m.status))fail('invalid Wheel source status');
  if(m.status==='verified'&&(!verifiableUrl(m.officialEvidenceUrl)||
   typeof m.reviewedBy!=='string'||m.reviewedBy.length<2||
   !/^20\d{2}-\d{2}-\d{2}$/.test(m.reviewedAt||'')))
   fail(m.name+' official source assertion requires dated reviewer');
 }
 if(!e.equipmentVerification||!['not_required','pending','verified'].includes(e.equipmentVerification.status)||
  !Array.isArray(e.equipmentVerification.approvedItemEvidence))fail('invalid item evidence');
 if(e.equipmentVerification.status==='verified'&&
  (!e.equipmentVerification.approvedItemEvidence.length||
   e.equipmentVerification.approvedItemEvidence.some(x=>!x?.url||!x.approvedBy||!x.reviewedAt)))
  fail('item verification claim requires proof');
 const icons=e.icons||{};
 if(!['permission_pending','permission_granted'].includes(icons.publicRedistribution))fail('invalid icon permission');
 if(icons.publicRedistribution==='permission_granted'&&
  (!verifiableUrl(icons.reuseLicenseUrl)||!icons.rightsHolder||String(icons.rightsHolder).length<3))
  fail('cannot claim rights for game graphics without evidence');
 if(icons.allowedPublicAssets!=='Only original program-created SVG fallback art')
  fail('public manual release may include only original UI SVG art');
 // No original game graphics are shipped, so unresolved permission for optional
 // private ZIPs is not a public release blocker.
 if(icons.publicRedistribution==='permission_pending')advisory.push('Private original game sprites are not redistributed');
 const admin=e.adminApproval||{};
 if(!['pending','not_required','verified'].includes(admin.status))fail('invalid admin approval state');
 if(admin.status==='verified'&&(!admin.reviewer||!admin.reviewDate||!verifiableUrl(admin.evidenceUrl)))
  fail('explicit admin approval claim requires a reviewer and source');
 if(admin.status!=='not_required')fail('manual calculator must not depend on admin sign-off');
 for(const name of qaRequired){
  const status=e.qa?.[name];
  if(!['passed','not_run','failed'].includes(status))fail('invalid QA state '+name);
  if(status==='passed'){
   const proof=e.qaEvidence?.[name];
   if(!proof||!verifiableUrl(proof.proofUrl)||typeof proof.reviewedBy!=='string'||
    proof.reviewedBy.length<2||!/^20\d{2}-\d{2}-\d{2}$/.test(proof.reviewedAt||''))
    fail(name+' requires a reviewer, test date and evidence URL');
  }else blockers.push(name+(status==='failed'?' FAILED':' NOT RUN'));
 }
 const d=e.delivery||{};
 if(d.publicPlayerOnly!==true)fail('public bundle isolation must remain mandatory');
 if(!verifiableUrl(d.publicPlayerUrl))fail('missing public player URL');
 if(!['verified','unverified'].includes(d.renderAutoDeployWebhook))fail('invalid auto-deploy status');
 if(d.renderAutoDeployWebhook==='verified'&&!verifiableUrl(d.renderWebhookProofUrl))
  fail('claimed auto-deploy verification requires evidence');
 if(!['authenticated','not_authenticated'].includes(d.adminAccess))fail('invalid admin access status');
 if(d.adminAccess==='authenticated'&&!verifiableUrl(d.adminAuthProofUrl))
  fail('claimed admin authentication requires evidence');
 if(d.renderAutoDeployWebhook!=='verified')advisory.push('Render git-push auto-deploy not proven; manual deployment is an operating task');
 if(d.adminAccess!=='authenticated')advisory.push('Separate authenticated developer workspace remains optional / not deployed');
 if(e.stage==='stable'&&blockers.length)fail('cannot label stable while '+blockers.length+' independent QA gates unresolved');
 return {stage:e.stage,unresolved:blockers.length,reasons:blockers,advisory,manual:true};
}
function main(argv=process.argv.slice(2)){
 const e=JSON.parse(fs.readFileSync(evidencePath,'utf8')),report=checkEvidence(e);
 console.log('Wheel Calculator: '+report.stage.toUpperCase()+' / MANUAL PER-SERVER MODE');
 console.log('Independent QA blockers: '+report.unresolved);
 for(const r of report.reasons)console.log('BLOCKED '+r);
 for(const r of report.advisory)console.log('INFO '+r);
 if(argv.includes('--stable')&&report.unresolved)
  fail('stable release BLOCKED; '+report.unresolved+' independent QA gates unresolved');
 return report;
}
if(require.main===module){
 try{main();}catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={checkEvidence,main};
