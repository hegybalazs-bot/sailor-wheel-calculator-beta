'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {parseSource,makeRecords,build}=require('../tools/export-admin-blue-review.cjs');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
test('admin review matrix covers 7 CAPs, 6 gear families and 14 weapon types',()=>{
 const input=parseSource(source),rows=makeRecords(input);
 assert.equal(rows.length,420);
 assert.equal(input.weaponIds.length,14);
 assert.equal(rows.filter(x=>x[1]===90).length,60);
 assert.equal(rows.filter(x=>x[1]===140).length,60);
 assert.equal(rows.filter(x=>x[1]===90&&x[2]===9).length,60);
 assert.equal(rows.filter(x=>x[1]===140&&x[2]===15).length,60);
 const weapon=rows.filter(x=>x[1]===90&&x[5]==='weapon').map(x=>x[6]);
 assert(weapon.includes('ch_spear')&&weapon.includes('eu_staff'));
 assert.equal(rows.filter(x=>x[1]===90&&x[5]==='shoulder').length,6);
});
test('admin review CSV never claims source blue types or model values are verified',()=>{
 const {header,records,path:out}=build();
 assert(header.includes('official_type_probability'));
 assert(header.includes('verified_by_staff'));
 for(const row of records){
  assert.equal(row[row.length-1],'UNVERIFIED_REFERENCE_ONLY');
  assert(row[7].length>0);
  assert(row.slice(8,19).every(v=>v===''));
 }
 const text=fs.readFileSync(out,'utf8');
 assert(text.startsWith('\ufeff'));
 assert.match(text,/Sailor Online/);
 assert.match(text,/UNVERIFIED_REFERENCE_ONLY/);
 assert.equal(text.trim().split(/\r?\n/).length,421);
});
test('generator rejects changes to the core 12 item list rather than silently dropping items',()=>{
 const broken=source.replace("shoulder:['STR','INT','PARRY','DUR'],",'');
 assert.throws(()=>parseSource(broken));
});
