/* Silkdle Daily Five. Local daily scores only; no global leaderboard claims.
   Splash sources are third-party links for unranked beta play. */
(()=>{
"use strict";
const MODES=["classic","item","splash","quest","emoji"],ICONS=["⚔️","🗡️","🖼️","📜","🧩"],PREFIX="silkdle-daily-five-v1-";
const EMOJI=[
 ["Tiger Girl","Chinese","🐯","👧","⛰️","⚔️"],["Cerberus","European","🐺","🐺","🐺","🚪"],
 ["Uruchi","Chinese","🏜️","👹","⚔️","🐫"],["Isyutaru","Chinese","❄️","👸","🏔️","🌨️"],
 ["Lord Yarkan","Chinese","👑","🏜️","🐫","⚔️"],["Demon Shaitan","all","😈","🔥","🏔️","👑"],
 ["Glavie","Chinese","🐉","🔱","⚔️","🇨🇳"],["Harp","European","🎶","🎻","✨","🇪🇺"],
 ["Bow","Chinese","🏹","🎯","🐉","🇨🇳"],["Cleric","European","❤️","🛡️","✨","🇪🇺"],
 ["Hotan","all","🏪","💰","🐫","🗺️"],["Jangan","Chinese","🏯","🐉","📍","🏹"]
].map(([name,world,...symbols])=>({name,world,symbols,aliases:name==="Glavie"?["Glaive"]:[]}));
const SOURCE_IDS=["preview-uruchi-render","preview-isyutaru-render","preview-cerberus-render","preview-yarkan-render","preview-shaitan-render","preview-tiger-woman-game"];
const TXT={
 hu:{title:"Napi ötös kihívás",description:"Öt különböző Silkroad Online rejtvény, minden nap új megfejtésekkel. Hibás tippeknél új támpontokat kapsz.",classic:["Classic Hunt","Mobok és unique-ok összehasonlítása"],item:["Item & Skill","Fegyverek és mastery-k"],splash:["Splash Hunt","Fokozatosan távolodó kép"],quest:["Quest Mystery","Küldetések és a válaszok"],emoji:["Emoji Mystery","Találd ki a nevet emojikból"],done:"Teljesítve",points:"Pont",streak:"Sorozat",reset:"Éjfélig",play:"Játék",win:"Megfejtve",lose:"Sikertelen",daily:"📅 Napi",practice:"♾️ Gyakorlás",local:"A napi ötös eredményei csak ebben a böngészőben tárolódnak. A közös ranglista külön működik.",submit:"Tippelés",input:"Írj be egy Silkroad-nevet…",hint:"HINT • Mindig kapsz segítséget",later:"További nyomok 2 és 4 hibás tipp után",wrong:"Nem talált. Újabb segítség nyílt meg.",again:"Új gyakorló kör",answer:"Megfejtés",success:"✅ Sikeres megfejtés!",failure:"❌ Elfogytak a próbálkozások!",next:"Következő játékmód",share:"📋 Napi eredmény másolása",copied:"✅ Másolva!",source:"Eredeti forrás",imageFail:"A külső kép jelenleg nem tölthető be. Ez a napi feladvány ilyenkor nem értékelhető megbízhatóan.",invalid:"Ismert nevet válassz a találatokból.",repeat:"Ezt a nevet már tippelted.",world:"Világ",type:"Típus",role:"Terület / szerep",level:"Szint",specialty:"Specializáció",completed:"Mind az öt mai kihívás kész!",note:"A Splash külső Silkroad-képlinkeket használ; a források elérhetősége és újrafelhasználási joga nincs garantálva. Ez a mód nem szerveresen rangsorolt.",count:"napi feladvány kész"},
 en:{title:"Five daily challenges",description:"Five Silkroad Online puzzles refreshed every day. Wrong guesses unlock progressively stronger hints.",classic:["Classic Hunt","Compare mobs and uniques"],item:["Item & Skill","Weapons and masteries"],splash:["Splash Hunt","Zooming-out image puzzle"],quest:["Quest Mystery","Quest questions and answers"],emoji:["Emoji Mystery","Guess the name from emojis"],done:"Completed",points:"Points",streak:"Streak",reset:"Until reset",play:"Play",win:"Solved",lose:"Missed",daily:"📅 Daily",practice:"♾️ Practice",local:"Daily Five progress is saved only in this browser. Global rankings are a separate feature.",submit:"Submit guess",input:"Enter a Silkroad name…",hint:"HINT • A clue is always visible",later:"More clues after 2 and 4 wrong guesses",wrong:"Not quite. Another clue is unlocked.",again:"New practice round",answer:"Answer",success:"✅ Well done!",failure:"❌ No attempts left!",next:"Next mode",share:"📋 Copy daily results",copied:"✅ Copied!",source:"Original source",imageFail:"The external image cannot load now. The puzzle cannot be fairly scored without it.",invalid:"Choose a known name from the suggestions.",repeat:"You already guessed that.",world:"World",type:"Type",role:"Area / role",level:"Level",specialty:"Specialization",completed:"All five daily challenges completed!",note:"Splash uses externally linked Silkroad images; availability and reuse rights are not guaranteed. This is not a server-ranked mode.",count:"daily puzzles completed"}
};
const locale=()=>document.documentElement.lang==="en"?"en":"hu",t=()=>TXT[locale()];
const day=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Budapest",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const hash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
const normal=s=>String(s||"").normalize("NFKC").trim().toLowerCase().replace(/\bglaive\b/g,"glavie");
const el=(type,cls,text,parent)=>{const x=document.createElement(type);if(cls)x.className=cls;if(text!=null)x.textContent=text;if(parent)parent.append(x);return x};
const btn=(label,parent,callback,cls="d5-button")=>{const b=el("button",cls,label,parent);b.type="button";b.onclick=callback;return b};
const catalog=kind=>{
 const all=window.SILKDLE_CORE_ITEMS||{};
 if(kind==="classic")return [...(all.unique||[]).map(x=>({...x,type:"Unique"})),...(all.mob||[]).map(x=>({...x,type:"Mob"}))];
 if(kind==="item")return [...(all.gear||[]).map(x=>({...x,type:"Weapon"})),...(all.mastery||[]).map(x=>({...x,type:"Mastery"}))];
 if(kind==="emoji")return EMOJI;
 if(kind==="quest"){
  const quiz=window.SILKDLE_HARD_QUIZ||{},all=[...(quiz.veteran||[]),...(quiz.legend||[])];
  const selected=all.filter(q=>/quest|inventory|npc|küldetés|leegak|material|present/i.test(q.hu+" "+q.en));
  return (selected.length?selected:all).map((q,i)=>({name:"q"+i,answer:q.o[q.a],question:q,world:q.w}));
 }
 if(kind==="splash"){
  const arr=window.SILKDLE_WEB_IMAGES_V1||[],allowed=arr.filter(e=>SOURCE_IDS.includes(e.id));
  return (allowed.length?SOURCE_IDS.map(id=>allowed.find(e=>e.id===id)).filter(Boolean):arr.slice(0,8));
 }
 return [];
};
const target=(kind,practice,round,offset=0)=>{const entries=catalog(kind);return entries.length?entries[(hash(day()+"/"+kind+"/"+(practice?round:"daily"))+Math.max(0,offset))%entries.length]:null};
const key=(kind,d=day())=>PREFIX+d+":"+kind;
const get=kind=>{try{const x=JSON.parse(localStorage.getItem(key(kind))||"null");return x&&Array.isArray(x.guesses)?x:null}catch{return null}};
const put=(kind,x)=>{try{localStorage.setItem(key(kind),JSON.stringify(x))}catch{}};
const fresh=()=>({guesses:[],done:false,won:false,score:0});
const summary=()=>{
 let done=0,points=0;
 for(const k of MODES){const x=get(k);if(x?.done){done++;points+=Number(x.score)||0}}
 const dt=new Date(day()+"T12:00:00Z");if(done!==5)dt.setUTCDate(dt.getUTCDate()-1);
 let streak=0;
 try{for(let i=0;i<365;i++){const d=dt.toISOString().slice(0,10);if(MODES.every(k=>JSON.parse(localStorage.getItem(key(k,d))||"null")?.done)){streak++;dt.setUTCDate(dt.getUTCDate()-1)}else break}}catch{}
 return {done,points,streak};
};
const timer=()=>{
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Budapest",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date()).split(":").map(Number);
 const n=(86400-(parts[0]%24*3600+parts[1]*60+parts[2]))%86400;
 return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(v=>String(v).padStart(2,"0")).join(":");
};
const choices=(kind,tgt)=>{
 if(kind==="quest"){
  const choices=new Set(tgt.question.o);
  catalog("quest").forEach(e=>{if(choices.size<25)choices.add(e.answer)});
  return [...choices].map(name=>({name}));
 }
 if(kind==="splash")return catalog(kind).map(e=>({...e,name:e.answer}));
 return catalog(kind);
};
const answer=(kind,tgt)=>kind==="quest"||kind==="splash"?tgt.answer:tgt.name;
const hint=(kind,tgt,n)=>{
 const a=[];
 if(kind==="classic"||kind==="item"){
  a.push("🌍 "+(tgt.world==="all"?"CH + EU":tgt.world),"⚔️ "+tgt.type);
  if(n>=2)a.push("🗺️ "+(tgt.region||"—"));
 }else if(kind==="emoji"){
  a.push("🌍 "+(tgt.world==="all"?"CH + EU":tgt.world));
  if(n>=2)a.push("🔢 "+answer(kind,tgt).length+" "+(locale()==="hu"?"karakter":"characters"));
 }else if(kind==="quest"){
  a.push("📜 "+(locale()==="hu"?"Silkroad quest":"Silkroad quest"));
  if(n>=2)a.push("🔢 "+answer(kind,tgt).length+" "+(locale()==="hu"?"karakter":"characters"));
 }else{
  a.push("🌍 "+(tgt.world==="all"?"CH + EU":tgt.world),"🗂️ "+tgt.category);
  if(n>=2)a.push("🔢 "+answer(kind,tgt).length+" "+(locale()==="hu"?"karakter":"characters"));
 }
 if(n>=4)a.push("🔤 "+answer(kind,tgt).charAt(0).toUpperCase()+"…");
 return a;
};
function compare(a,b,kind){
 const world=a.world===b.world?"exact":a.world==="all"||b.world==="all"?"partial":"miss";
 const fields=[[t().world,a.world,world],[t().type,a.type,a.type===b.type?"exact":"miss"],[t().role,a.region||"—",a.region===b.region?"exact":"miss"]];
 if(kind==="classic"){
  const diff=Number(a.level)-Number(b.level);
  fields.push([t().level,String(a.level)+(diff<0?" ↑":diff>0?" ↓":" ✓"),diff===0?"exact":Math.abs(diff)<=10?"partial":"miss"]);
 }else{
  const d=a.detail?.[locale()]||a.detail?.hu||"",f=b.detail?.[locale()]||b.detail?.hu||"";
  fields.push([t().specialty,d||"—",d&&d===f?"exact":"miss"]);
 }
 return fields;
}
let mount=null,currentMode="classic",practice=false,round=0,training={},clock=null;
const state=()=>practice?(training[currentMode]||(training[currentMode]=fresh())):(get(currentMode)||fresh());
const save=x=>{if(practice)training[currentMode]=x;else put(currentMode,x)};
function guessList(parent,kind,tgt,s,enabled){
 const row=el("div","d5-inputrow",null,parent);
 const input=el("input","",null,row);input.type="text";input.maxLength=100;input.autocomplete="off";input.spellcheck=false;input.placeholder=t().input;input.setAttribute("role","combobox");input.setAttribute("aria-label",t().input);
 const send=btn(t().submit,row,submit);const suggestions=el("div","d5-suggestions",null,parent);suggestions.setAttribute("role","listbox");suggestions.id="d5-suggestions";input.setAttribute("aria-controls",suggestions.id);
 const msg=el("p","d5-message","",parent);msg.setAttribute("aria-live","polite");
 const options=choices(kind,tgt);let selected=0;
 const matches=()=>{const val=normal(input.value);return val.length<2?[]:options.filter(x=>(normal(x.name).includes(val)||(x.aliases||[]).some(a=>normal(a).includes(val)))&&!s.guesses.some(y=>normal(y)===normal(x.name))).slice(0,8)};
 const update=()=>{
  suggestions.replaceChildren();const found=matches();input.setAttribute("aria-expanded",String(found.length>0));
  found.forEach((x,i)=>{const badge=kind==="classic"?(x.type==="Unique"?"👑 ":"🐾 "):kind==="item"?(x.type==="Weapon"?"🗡️ ":"✨ "):kind==="emoji"?"🧩 ":kind==="quest"?"📜 ":"🖼️ ";const b=btn(badge+x.name,suggestions,()=>{input.value=x.name;submit()},"d5-suggestion"+(selected===i?" active":""));b.setAttribute("role","option")});
 };
 function submit(){
  if(!enabled){msg.textContent=t().imageFail;return}
  const value=normal(input.value),match=options.find(x=>normal(x.name)===value||(x.aliases||[]).some(a=>normal(a)===value));
  if(!match){msg.textContent=t().invalid;input.focus();return}
  if(s.guesses.some(g=>normal(g)===normal(match.name))){msg.textContent=t().repeat;return}
  s.guesses.push(match.name);s.won=normal(match.name)===normal(answer(kind,tgt));s.done=s.won||s.guesses.length===6;
  s.score=s.won?[100,80,65,50,35,20][s.guesses.length-1]:0;save(s);render();
 }
 input.oninput=()=>{selected=0;update()};
 input.onkeydown=e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){const m=matches();if(!m.length)return;e.preventDefault();selected=(selected+(e.key==="ArrowDown"?1:m.length-1))%m.length;update()}if(e.key==="Enter"){e.preventDefault();const m=matches();if(m.length&&input.value!==m[selected].name)input.value=m[selected].name;submit()}if(e.key==="Escape")suggestions.replaceChildren()};
 if(!enabled){input.disabled=true;send.disabled=true}
}
function history(panel,kind,tgt,s){
 const tries=el("div","d5-tries",null,panel);for(let i=0;i<6;i++)el("i",i<s.guesses.length?"used":"",null,tries);
 if(!s.guesses.length)return;
 if(kind==="classic"||kind==="item"){
  const legend=el("div","d5-legend",null,panel);
  for(const [state,label] of [["exact",locale()==="hu"?"Pontos":"Exact"],["partial",locale()==="hu"?"Közeli / részleges":"Near / partial"],["miss",locale()==="hu"?"Eltérő":"Different"]]){const item=el("span","",null,legend);el("i","d5-dot "+state,null,item);item.append(document.createTextNode(label))}
  const rows=el("div","d5-history",null,panel);
  for(const name of s.guesses){
   const r=el("div","d5-historyrow",null,rows);el("strong","",name,r);
   const g=catalog(kind).find(x=>normal(x.name)===normal(name)),cells=el("div","d5-cells",null,r);
   if(g)for(const [label,v,c] of compare(g,tgt,kind)){const box=el("div","d5-cell "+c,null,cells);el("small","",label,box);el("span","",v,box)}
  }
 }else{
  const rows=el("div","d5-history",null,panel);
  s.guesses.forEach(name=>el("div","d5-historyrow",name+(normal(name)===normal(answer(kind,tgt))?" ✓":" ✕"),rows));
 }
}
function puzzle(panel,kind){
 const s=state();
 const tgt=target(kind,practice,round,kind==="splash"?(s.imageOffset||0):0);if(!tgt){el("p","d5-message","No puzzle data available",panel);return}
 const head=el("div","d5-puzzlehead",null,panel);el("span","d5-icon",ICONS[MODES.indexOf(kind)],head);
 const text=el("div","",null,head);el("h3","",t()[kind][0],text);el("p","",t()[kind][1],text);
 let canGuess=true;
 if(kind==="emoji"){
  const emojis=el("div","d5-emojis",null,panel);
  tgt.symbols.forEach((symbol,i)=>el("span",i<2+s.guesses.length||s.done?"":"locked",i<2+s.guesses.length||s.done?symbol:"?",emojis));
 }
 if(kind==="quest"){el("div","d5-question",tgt.question[locale()],panel)}
 if(kind==="splash"){
  const crop=el("div","d5-crop",null,panel),img=el("img","",null,crop);
  img.src=tgt.image;img.alt=locale()==="hu"?"Silkroad-kép részlete":"Silkroad image crop";img.referrerPolicy="no-referrer";
  const scale=[10,6,4,2.6,1.5,1][Math.min(5,s.guesses.length)];
  img.style.transform="scale("+(s.done?1:scale)+")";
  img.style.transformOrigin=Math.round((tgt.cropX??.5)*100)+"% "+Math.round((tgt.cropY??.5)*100)+"%";
  const err=el("div","d5-message","",panel);img.onerror=()=>{if(!panel.isConnected)return;canGuess=false;err.textContent=t().imageFail;panel.querySelectorAll(".d5-inputrow input,.d5-inputrow button").forEach(x=>x.disabled=true);if((s.imageOffset||0)<catalog("splash").length-1)btn(locale()==="hu"?"🔄 Másik kép próbálása":"🔄 Try another image",err,()=>{s.imageOffset=(s.imageOffset||0)+1;save(s);render()},"d5-button subtle")};
  if(tgt.source){const source=el("a","d5-source",t().source,panel);source.href=tgt.source;source.target="_blank";source.rel="noopener noreferrer"}
 }
 const hintBox=el("div","d5-hint",null,panel);el("strong","",t().hint,hintBox);
 const ul=el("ul","",null,hintBox);hint(kind,tgt,s.guesses.length).forEach(x=>el("li","",x,ul));
 if(s.guesses.length<4)el("small","",t().later,hintBox);
 history(panel,kind,tgt,s);
 if(s.done){
  const finish=el("div","d5-finish",null,panel);
  el("h3","",s.won?t().success:t().failure,finish);
  el("p","",t().answer+": "+answer(kind,tgt)+" • "+s.score+" "+t().points,finish);
  if(practice)btn(t().again,finish,()=>{round++;training[currentMode]=fresh();render()});
  else{
   const next=MODES.slice(MODES.indexOf(kind)+1).concat(MODES.slice(0,MODES.indexOf(kind))).find(k=>!get(k)?.done);
   if(next)btn(t().next,finish,()=>{currentMode=next;render()});
  }
 }else guessList(panel,kind,tgt,s,canGuess);
}
function shareText(){
 const s=summary(),rows=MODES.map((k,i)=>{const r=get(k);const cells=r?.done?(r.won?"🟥".repeat(Math.max(0,r.guesses.length-1))+"🟩":"🟥".repeat(r.guesses.length)):"⬛";return ICONS[i]+" "+cells+" "+(r?.done?r.guesses.length+"/6":"—")});
 return "⚔️ SILKDLE • "+day()+"\n"+rows.join("\n")+"\n🏆 "+s.points+"/500 • "+s.done+"/5\n"+location.origin+"/?mode=daily5";
}
function render(){
 if(!mount)return;mount.replaceChildren();
 const page=el("div","daily-five",null,mount),hero=el("div","d5-hero",null,page);
 el("span","d5-overline","⚔ SILKDLE • THE DAILY SILKROAD CHALLENGE",hero);el("h2","",t().title,hero);el("p","",t().description,hero);
 const total=summary(),stats=el("div","d5-stats",null,page);
 for(const [v,label,id] of [[total.done+"/5",t().done,""],[total.points+"/500",t().points,""],[total.streak+" 🔥",t().streak,""],[timer(),t().reset,"d5-clock"]]){const item=el("div","d5-stat",null,stats);const number=el("strong","",v,item);if(id)number.id=id;el("small","",label,item)}
 const progress=el("div","d5-progress",null,page);progress.setAttribute("role","progressbar");progress.setAttribute("aria-valuenow",String(total.done));progress.setAttribute("aria-valuemax","5");el("div","",null,progress).style.width=(total.done*20)+"%";
 if(total.streak>=3){const rank=total.streak>=30?"Silkroad Legend":total.streak>=7?"Unique Hunter":"Daily Adventurer";el("p","d5-achievement","🏅 "+rank+" • "+total.streak+" "+(locale()==="hu"?"napos sorozat":"day streak"),page)}
 const controls=el("div","d5-controls",null,page);
 btn(t().daily,controls,()=>{practice=false;render()},practice?"d5-button subtle":"d5-button");
 btn(t().practice,controls,()=>{practice=true;render()},practice?"d5-button":"d5-button subtle");
 const cards=el("div","d5-cards",null,page);
 MODES.forEach((k,i)=>{const state=get(k);const card=btn("",cards,()=>{currentMode=k;render()},"d5-card"+(k===currentMode?" active":"")+(state?.done?" finished":""));card.setAttribute("aria-pressed",String(k===currentMode));el("span","d5-icon",ICONS[i],card);el("strong","",t()[k][0],card);el("small","",t()[k][1],card);el("span","d5-result",state?.done?(state.won?"✅ "+t().win:"❌ "+t().lose):"○ "+t().play,card)});
 const game=el("section","d5-game",null,page);game.id="dailyfive-game";puzzle(game,currentMode);
 const foot=el("div","d5-foot",null,page);
 btn(t().share,foot,async()=>{try{await navigator.clipboard.writeText(shareText());foot.querySelector("button").textContent=t().copied}catch{const pre=el("pre","d5-message",shareText(),foot);pre.style.whiteSpace="pre-wrap"}},"d5-button subtle");
 if(total.done===5)el("p","d5-celebrate",t().completed,page);
 el("p","d5-note",t().local,page);el("p","d5-note",t().note,page);
 if(clock)clearInterval(clock);
 mount.dataset.d5day=day();
 clock=setInterval(()=>{if(!mount?.isConnected||mount.hidden){clearInterval(clock);clock=null;return}const x=document.getElementById("d5-clock");if(x)x.textContent=timer();if(mount.dataset.d5day!==day()){practice=false;training={};round=0;render()}},1000);
}
window.SILKDLE_DAILY_FIVE={
 render(element){mount=element;render()},
 stop(){if(clock)clearInterval(clock);clock=null},
 internals:{MODES,EMOJI,day,normal,hash,catalog,target,compare,hint,summary,shareText}
};
})();
