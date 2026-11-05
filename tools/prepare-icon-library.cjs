'use strict';
// Offline-only asset auditor. Never uploads any client files.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const ALLOWED_TYPES=new Set(['weapon','shield','armor','protector','garment','heavy_armor','light_armor','robe','jewelry']);
const CLOTHING=new Set(['head','shoulder','chest','hands','legs','foot']);
const JEWELRY=new Set(['necklace','earring','ring']);
const WEAPONS=new Set([
 'ch_spear','ch_bow','ch_glavie','ch_blade','ch_sword',
 'eu_twohand','eu_onehand','eu_warlock','eu_staff','eu_cleric',
 'eu_harp','eu_xbow','eu_dagger','eu_dualaxe'
]);
const WHEEL_ROLES=new Set(['wheel_of_fortune','wheel_of_fate','feather_pen']);
const GRADE={normal:'Normal',sos:'SoS',som:'SoM',sun:'Sun'};
const IMAGE_PATH=/^sprites\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(png|webp)$/;
const MAX_ICONS=20000,MAX_FILE_BYTES=512*1024,MAX_TOTAL_BYTES=80*1024*1024;

function normalizeIcon(e){
 const category=e.category;
 if(category==='wheel'){
  if(!WHEEL_ROLES.has(e.role))throw Error('unrecognized Wheel role');
  return {category:'wheel',role:e.role,verified:true};
 }
 if(category!=='equipment')throw Error('unsupported category');
 const region=e.region==='chinese'?'ch':e.region==='european'?'eu':e.region;
 const type=e.equipmentType;
 const slot=e.slot==='ring1'||e.slot==='ring2'?'ring':e.slot;
 const degree=Number(e.degree);
 const grade=e.grade==null?null:GRADE[String(e.grade).toLowerCase()];
 const itemCode=e.itemCode==null||e.itemCode===''?null:String(e.itemCode).toUpperCase();
 if(!['ch','eu'].includes(region))throw Error('invalid region');
 if(!ALLOWED_TYPES.has(type))throw Error('invalid equipment type');
 if(!Number.isInteger(degree)||degree<1||degree>20)throw Error('degree must be 1–20');
 if(e.grade!=null&&!grade)throw Error('unrecognized grade');
 if(itemCode&&!/^[A-Z0-9_]{3,128}$/.test(itemCode))throw Error('invalid item code');
 let weaponType=null;
 if(type==='weapon'){
  if(slot!=='weapon'||!WEAPONS.has(e.weaponType)||!e.weaponType.startsWith(region+'_'))throw Error('invalid weapon family');
  weaponType=e.weaponType;
 }else if(type==='shield'){
  if(slot!=='shield')throw Error('invalid shield slot');
 }else if(type==='jewelry'){
  if(!JEWELRY.has(slot))throw Error('invalid jewelry slot');
 }else{
  if(!CLOTHING.has(slot))throw Error('invalid clothing slot');
  if(region==='ch'&&!['armor','protector','garment'].includes(type))throw Error('EU armor type on Chinese item');
  if(region==='eu'&&!['heavy_armor','light_armor','robe'].includes(type))throw Error('CH armor type on European item');
 }
 return {category:'equipment',slot,region,equipmentType:type,weaponType,degree,grade,itemCode,verified:true};
}

function getImage(inputRoot,assetPath){
 if(typeof assetPath!=='string'||!IMAGE_PATH.test(assetPath))throw Error('unsafe or unsupported asset path');
 const loc=path.resolve(inputRoot,...assetPath.split('/'));
 const real=fs.realpathSync(loc);
 if(!real.startsWith(inputRoot+path.sep))throw Error('asset resolves outside extracted folder');
 if(!fs.statSync(real).isFile())throw Error('asset is not a regular file');
 const data=fs.readFileSync(real);
 if(!data.length||data.length>MAX_FILE_BYTES)throw Error('image too large or empty');
 const png=data.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
 const webp=data.subarray(0,4).toString()==='RIFF'&&data.subarray(8,12).toString()==='WEBP';
 const ext=assetPath.toLowerCase().endsWith('.png')?'png':'webp';
 if((ext==='png'&&!png)||(ext==='webp'&&!webp))throw Error('actual file signature disagrees with extension');
 return {data,ext,sha256:crypto.createHash('sha256').update(data).digest('hex')};
}

function buildLibrary(inputDir,outputDir){
 if(!inputDir||!outputDir)throw Error('input and output directory are required');
 const root=fs.realpathSync(inputDir);
 const output=path.resolve(outputDir);
 const generatedManifest=path.join(output,'assets','icons','manifest.js');
 if(fs.existsSync(generatedManifest))throw Error('target manifest exists; choose a fresh output directory');
 const raw=fs.readFileSync(path.join(root,'manifest.json'),'utf8');
 const source=JSON.parse(raw);
 if(source.schemaVersion!==1||!Array.isArray(source.icons)||source.icons.length>MAX_ICONS)
  throw Error('invalid manifest schema or icon count');
 const valid=[],copyJobs=[],issues=[],seen=new Set();
 let candidates=0,awaitingReview=0,total=0;
 for(const [i,entry] of source.icons.entries()){
  const key='icon '+(i+1);
  if(!entry||typeof entry!=='object'){issues.push(key+': invalid record');continue;}
  if(entry.category!=='equipment'&&entry.category!=='wheel')continue;
  if(entry.matchStatus!=='verified'){candidates++;continue;}
  if(entry.reviewStatus!=='approved'){awaitingReview++;continue;}
  try{
   if(!Array.isArray(entry.matchEvidence)||!entry.matchEvidence.length)throw Error('matching evidence missing');
   const model=normalizeIcon(entry);
   const {data,ext,sha256}=getImage(root,entry.assetPath);
   if(entry.assetSha256&&String(entry.assetSha256).toLowerCase()!==sha256)throw Error('converted image SHA-256 mismatch');
   total+=data.length;
   if(total>MAX_TOTAL_BYTES)throw Error('total icon size limit exceeded');
   const identity=JSON.stringify([
    model.category,model.role??null,model.region??null,model.equipmentType??null,
    model.slot??null,model.weaponType??null,model.degree??null,model.grade??null,model.itemCode??null
   ]);
   if(seen.has(identity))throw Error('ambiguous duplicate item or Wheel mapping');
   seen.add(identity);
   const rel='assets/icons/'+(model.category==='wheel'?'wheel':'equipment')+'/'+sha256.slice(0,24)+'.'+ext;
   valid.push({...model,path:rel,sha256});
   copyJobs.push({data,to:path.join(output,...rel.split('/'))});
  }catch(err){issues.push(key+': '+err.message);}
 }
 const report={
  inputIcons:source.icons.length,approved:valid.length,
  unverifiedCandidates:candidates,awaitingHumanReview:awaitingReview,
  rejected:issues.length,issues,
  reminder:'The output is LOCAL. Do not publish original Silkroad artwork without reuse permission.'
 };
 fs.mkdirSync(output,{recursive:true});
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 if(issues.length)throw Error(issues.length+' invalid approved icon mappings; see report.json');
 for(const job of copyJobs){fs.mkdirSync(path.dirname(job.to),{recursive:true});fs.writeFileSync(job.to,job.data);}
 fs.mkdirSync(path.dirname(generatedManifest),{recursive:true});
 fs.writeFileSync(generatedManifest,'/* Local-only generated file; verify redistribution permission before publishing. */\nwindow.WHEEL_ICON_ASSETS_V1 = '+JSON.stringify(valid,null,2)+';\n');
 return report;
}
module.exports={buildLibrary,normalizeIcon,getImage};
if(require.main===module){
 try{
  const report=buildLibrary(process.argv[2],process.argv[3]);
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
 }catch(err){
  process.stderr.write('Icon preparation failed: '+err.message+'\n');
  process.exitCode=1;
 }
}
