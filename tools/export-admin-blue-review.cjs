'use strict';
/* Create a human-review CSV from the app's existing iSRO reference Blue list.
 * IMPORTANT: zero fields are filled with "verified" values by this script.
 * All actual Sailor values, limits, probabilities and approval stay blank.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=path.resolve(__dirname,'../index.html');
const output=path.resolve(__dirname,'../artifacts/review/Sailor_Blue_Verification_Template.csv');
const CAP_DG=[[90,9],[100,10],[110,11],[120,12],[125,13],[130,14],[140,15]];
const APPAREL=[
 ['ch','armor'],['ch','protector'],['ch','garment'],
 ['eu','heavy_armor'],['eu','light_armor'],['eu','robe']
];
const ARMOR_SLOTS=['head','shoulder','chest','hands','legs','foot'];
const JEWELRY_SLOTS=['necklace','earring','ring1','ring2'];
const HEADER=[
 'server','cap','degree_reference_not_official','region','family','item_slot','weapon_type',
 'reference_possible_blue_types_UNVERIFIED','official_possible_blue_types',
 'grade_normal_max_lines','grade_SoS_max_lines','grade_SoM_max_lines','grade_Sun_max_lines',
 'official_min_max_per_blue','official_type_probability','official_value_distribution',
 'evidence_url','verified_by_staff','verified_on_date','verification_status'
];
function parseSource(html){
 const begin=html.indexOf('const BLUE_BASE={'),end=html.indexOf('};',begin);
 if(begin<0||end<begin||end-begin>4500)throw Error('BLUE_BASE source not found');
 const block=html.slice(begin,end),types={};
 for(const m of block.matchAll(/^\s*(\w+):\[([^\]]+)\]/gm)){
  const arr=[...m[2].matchAll(/'([A-Z_]+)'/g)].map(x=>x[1]);
  if(!arr.length||types[m[1]])throw Error('Invalid BLUE_BASE item '+m[1]);
  types[m[1]]=arr;
 }
 const expected=[...ARMOR_SLOTS,...JEWELRY_SLOTS,'weapon','shield'].sort();
 assert.deepEqual(Object.keys(types).sort(),expected);
 const start=html.indexOf('const WEAPON_GROUPS={'),stop=html.indexOf('const WEAPONS=',start);
 if(start<0||stop<start)throw Error('WEAPON_GROUPS source not found');
 const weaponIds=[...html.slice(start,stop).matchAll(/\['((?:ch|eu)_[a-z0-9_]+)'/g)].map(x=>x[1]);
 assert.equal(weaponIds.length,14);
 return {types,weaponIds};
}
function makeRecords({types,weaponIds}){
 const records=[];
 const add=(cap,degree,region,family,slot,weaponType)=>{
  const ref=types[slot];
  if(!ref)throw Error('Missing source Blue type '+slot);
  records.push(['Sailor Online',cap,degree,region,family,slot,weaponType||'',
   ref.join('|'),'','','','','','','','','','','','UNVERIFIED_REFERENCE_ONLY']);
 };
 for(const [cap,degree] of CAP_DG){
  for(const [region,family] of APPAREL)
   for(const slot of ARMOR_SLOTS)add(cap,degree,region,family,slot,'');
  for(const region of ['ch','eu'])
   for(const slot of JEWELRY_SLOTS)add(cap,degree,region,'jewelry',slot,'');
  for(const id of weaponIds)add(cap,degree,id.startsWith('ch_')?'ch':'eu','weapon','weapon',id);
  for(const region of ['ch','eu'])add(cap,degree,region,'shield','shield','');
 }
 assert.equal(records.length,420);
 assert(records.every(row=>row[7]&&row.slice(8,19).every(v=>v==='')));
 return records;
}
function csvCell(val){
 let s=String(val??'');
 if(/^[=+\-@]/.test(s))s="'"+s;
 return '"'+s.replaceAll('"','""')+'"';
}
function build(){
 const parsed=parseSource(fs.readFileSync(source,'utf8')),rows=makeRecords(parsed);
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,'\ufeff'+[HEADER,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n');
 console.log('ADMIN BLUE REVIEW TEMPLATE: 420 rows · 7 CAP scopes · 6 apparel families · 14 weapons · 2 shield regions');
 console.log('All official Blue values, line limits and odds remain BLANK and UNVERIFIED.');
 return {count:rows.length,path:output,header:HEADER,records:rows};
}
if(require.main===module)build();
module.exports={parseSource,makeRecords,build};
