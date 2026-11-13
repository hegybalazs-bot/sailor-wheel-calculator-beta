"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","race.js"),"utf8");
const a=source.indexOf("const HINT_LOCATIONS="),b=source.indexOf("function switchView(next)",a);
assert.ok(a>0&&b>a,"Hint module boundaries must exist");
const helpers=source.slice(a,b);
const get=(lang)=>new Function("language",helpers+";return {hintEntries,hintCategory};")(()=>lang);

test("Community Hint is available immediately in Hungarian",()=>{
 const {hintEntries}=get("hu");
 const clues=hintEntries({answer:"Uruchi",category:"unique",world:"Chinese"},0,false);
 assert.equal(clues.length,2);
 assert.ok(clues.some(c=>c[1].includes("Chinese")));
 assert.ok(clues.some(c=>c[1].includes("Unique")));
 assert.ok(clues.every(c=>!c[1].includes("Uruchi")));
});
test("Two mistakes unlock a region clue, four reveal an initial",()=>{
 const {hintEntries}=get("hu"),target={answer:"Uruchi",category:"unique",world:"Chinese"};
 const stage2=hintEntries(target,2,false),stage3=hintEntries(target,4,false);
 assert.equal(stage2.length,3);
 assert.ok(stage2.some(c=>c[1].includes("Donwhang")));
 assert.equal(stage3.length,4);
 assert.ok(stage3.some(c=>c[1].includes("betűje: U")));
});
test("English local picture hints use safe fallback clues",()=>{
 const {hintEntries}=get("en");
 const clues=hintEntries({answer:"Unknown Test",category:"armor",world:"European"},2,false);
 assert.ok(clues.some(c=>c[1].includes("European")));
 assert.ok(clues.some(c=>c[1].includes("Armor")));
 assert.ok(clues.some(c=>c[1].includes("2 word(s)")));
});
test("Region hint must not directly reveal a location answer",()=>{
 const {hintEntries}=get("hu");
 const clues=hintEntries({answer:"Samarkand",category:"location",world:"European",region:"Samarkand"},2,false);
 assert.ok(clues.some(c=>c[1].includes("1 szóból")));
 assert.ok(clues.every(c=>!c[1].includes("Kapcsolódó terület: Samarkand")));
});
test("Timed ranked games never reveal answer-dependent hints",()=>{
 const {hintEntries}=get("en"),target={answer:"Tiger Girl",category:"unique",world:"Chinese",region:"Tiger Mountain"};
 const start=hintEntries(target,0,true),late=hintEntries(target,4,true);
 assert.deepEqual(late,start);
 assert.equal(start.length,2);
});
test("Approved server screenshot hints work without a client-side answer",()=>{
 const {hintEntries}=get("hu");
 const clues=hintEntries({category:"mob",world:"Chinese",region:"Jangan",firstLetter:"M"},4,false);
 assert.equal(clues.length,4);
 assert.ok(clues.some(c=>c[1].includes("betűje: M")));
});
