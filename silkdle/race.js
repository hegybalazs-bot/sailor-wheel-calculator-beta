(()=>{
"use strict";
const root=document.querySelector(".wrap main")||document.querySelector("main.wrap")||document.querySelector("main");
if(!root)return;
const css=String.raw;
const styles=document.createElement("style");styles.textContent=
'.racebar{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 14px}.racebar button{background:#182b2d;color:#def5e9;border:1px solid #45635b;border-radius:11px;padding:11px 13px;font-weight:750}.racebar button.on{background:#286147;border-color:#76d4a1}.rpanel{background:linear-gradient(140deg,#142b29,#102128);border:1px solid #3b665b;border-radius:20px;padding:22px;margin:12px 0 45px}.rpanel h2{margin:4px 0 12px}.rmuted{color:#a9c4ba;line-height:1.6}.rgrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:19px;align-items:start}.imgframe{width:100%;max-width:390px;aspect-ratio:1;position:relative;overflow:hidden;border-radius:18px;border:2px solid #b69a62;box-shadow:0 12px 40px #0008;background:#10201f}.imgframe img{width:100%;height:100%;object-fit:cover;display:block}.maskgrid{position:absolute;inset:0;display:grid;grid-template-columns:repeat(10,1fr);grid-template-rows:repeat(10,1fr)}.maskgrid i{display:block;background:radial-gradient(circle at 20% 20%,#224538,#071c1f);border:.5px solid #35564b;opacity:1;transition:opacity .6s}.maskgrid i.revealed{opacity:0}.maskgrid.zoom-crop{display:none}.imgframe img{transition:transform .55s ease;transform-origin:51% 43%;will-change:transform}@media(prefers-reduced-motion:reduce){.imgframe img{transition:none}}.rstatline{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.rstatline span{background:#1e4237;padding:7px 11px;border-radius:10px;border:1px solid #47745a;font-weight:750}.rbtn{background:#3fa67a;border:0;border-radius:11px;color:#082219;padding:12px 17px;font-weight:850;cursor:pointer}.rbtn:disabled{opacity:.4;cursor:not-allowed}.rsecondary{background:#1a3731;border:1px solid #426756;border-radius:11px;color:#d9f2e1;padding:12px 15px;font-weight:700;cursor:pointer}.rpanel select,.rpanel input{width:100%;padding:12px;border-radius:11px;background:#0c1c1f;color:#e5f6eb;border:1px solid #46675d;margin:7px 0 12px}.rpanel label{display:block;color:#a4c4b7;font-size:.88rem;font-weight:700}.rerror{color:#ffb8a3}.rok{color:#93ebad}.rcontrols{display:flex;flex-wrap:wrap;gap:9px}.rprogress{background:#2a463d;border-radius:8px;height:10px;overflow:hidden;margin:15px 0}.rprogress div{height:100%;background:linear-gradient(90deg,#3eb38a,#d3af61);transition:width .12s}.rlist{width:100%;border-collapse:collapse;margin:12px 0}.rlist th,.rlist td{border-bottom:1px solid #3a544c;padding:13px 7px;text-align:left}.rlist th{color:#a4bcb0;font-size:.78rem;text-transform:uppercase;letter-spacing:.7px}.rlist td:first-child{color:#d0ac68;font-weight:850}.rform{max-width:480px}.rform details{margin:10px 0}.rform summary{cursor:pointer;color:#98e8bf}.rhelp{padding:13px;background:#182e29;border-left:3px solid #d6ab5e;border-radius:8px;line-height:1.55;color:#e2d1ac;font-size:.9rem;margin:12px 0}.rlegend{font-size:.76rem;color:#9fb8ad;margin:8px 0 0}.rtimer{font-size:2rem;font-variant-numeric:tabular-nums;color:#e9c37d;font-weight:900}.rpanel .tag{margin:0 0 6px}.modegrid[hidden],.panel[hidden],.rpanel[hidden]{display:none!important}@media(max-width:680px){.rgrid{grid-template-columns:1fr}.rpanel{padding:15px}.imgframe{margin:auto}.racebar button{padding:9px 11px;font-size:.85rem}}';
document.head.append(styles);
const bar=document.createElement("nav");bar.className="racebar";
const buttons=[["classic","⚔️ Classic"],["picture","🖼️ Picture Hunt"],["local","🗂️ My screenshots"],["ranked","⏱️ Speed Hunt"],["leaderboard","🏆 Ranking"],["account","👤 Account"]];
buttons.forEach(([k,label])=>{const b=document.createElement("button");b.textContent=label;b.dataset.view=k;b.onclick=()=>switchView(k);bar.append(b)});
const studioLink=document.createElement("a");studioLink.href="./admin.html";studioLink.textContent="📷 Studio";studioLink.title="Silkdle Screenshot Studio";studioLink.style.cssText="display:inline-flex;align-items:center;padding:11px 13px;border:1px solid #45635b;border-radius:11px;color:#b7ecd3;text-decoration:none;background:#122c27;font-weight:750";bar.append(studioLink);
const modeGrid=document.getElementById("modes"),classicPanel=document.getElementById("panel");modeGrid.parentNode.insertBefore(bar,modeGrid);
const screen=document.createElement("section");screen.className="rpanel";screen.id="racescreen";screen.hidden=true;classicPanel.after(screen);
const translations={
hu:{classic:"⚔️ Klasszikus",picture:"🖼️ Képfelismerés",local:"🗂️ Saját képek",ranked:"⏱️ Időre",leaderboard:"🏆 Ranglista",account:"👤 Fiók",pictureTitle:"Képfelismerés – közösségi mód",rankTitle:"Speed Hunt – időre menő kihívás",boardTitle:"Ranglista",accountTitle:"Játékosfiók",pictureIntro:"A kép először nagyon szűk kivágásban látszik, mint a LoLdle Splash módjában. Tippelj név alapján: minden hibánál távolodik a nézet. Nincs kész válaszlista.",rankIntro:"45 másodperc, 2 hibás próbálkozás és napi egy rangsorolt játék. Minél gyorsabban találod el, annál több pontot kapsz.",guest:"Vendégként a képfelismerés szabadon játszható. Ranglistához jelentkezz be.",start:"Verseny indítása",reveal:"További részlet",guess:"Válasz beküldése",again:"Új gyakorló kép",choose:"Írd be a pontos nevet",wrong:"Nem talált! Új részlet nyílt meg.",correct:"Megvan!",finish:"A kör befejeződött.",time:"Hátralévő idő",points:"Pont",mistakes:"Hibák",rankDay:"Mai ranglista",rankAll:"Összesített",rankEmpty:"Még nincs eredmény.",signIn:"Bejelentkezés",signUp:"Regisztráció",logout:"Kijelentkezés",username:"Felhasználónév",login:"Felhasználónév vagy e-mail",email:"E-mail",password:"Jelszó",submitLogin:"Belépés",submitRegister:"Regisztrálok",accountOk:"Bejelentkezve",accountHint:"Felhasználónév: 3–24 karakter (betű, szám, _). Jelszó: legalább 10 karakter. Az e-mail-cím megerősítése még fejlesztés alatt.",unavailable:"A közös ranglista és a fiókrendszer jelenleg nem elérhető. A képfelismerés vendégként működik.",demo:"A béta saját fantáziaillusztrációkkal működik; ellenőrzött Silkroad-képek később kerülnek bele.",expired:"Lejárt az idő!",done:"A mai rangsorolt próbálkozást már felhasználtad.",answer:"Megfejtés",name:"Játékos",score:"Pontszám",best:"Idő",connection:"Hálózati vagy szerverhiba. Próbáld újra.",pwWarn:"A béta még nem tartalmaz e-mail-megerősítést és jelszó-visszaállítást. Ne használj máshol használt jelszót.",delete:"Fiókom törlése"},
en:{classic:"⚔️ Classic",picture:"🖼️ Image Hunt",local:"🗂️ My screenshots",ranked:"⏱️ Speed Hunt",leaderboard:"🏆 Leaderboard",account:"👤 Account",pictureTitle:"Image Hunt – community mode",rankTitle:"Speed Hunt – timed challenge",boardTitle:"Leaderboard",accountTitle:"Player account",pictureIntro:"The image starts as a tiny close-up, like LoLdle Splash. Type your guess; each wrong attempt zooms the view out. No answer list.",rankIntro:"45 seconds, 2 wrong guesses, and one ranked attempt a day. Solve faster to earn more points.",guest:"Community image puzzles are available as a guest. Sign in for ranked play.",start:"Start challenge",reveal:"Reveal more",guess:"Submit guess",again:"New practice image",choose:"Type the exact name",wrong:"Not quite! More image revealed.",correct:"You got it!",finish:"Round complete.",time:"Time left",points:"Points",mistakes:"Mistakes",rankDay:"Today's ranking",rankAll:"All-time",rankEmpty:"No scores yet.",signIn:"Sign in",signUp:"Create account",logout:"Sign out",username:"Username",login:"Username or email",email:"Email",password:"Password",submitLogin:"Sign in",submitRegister:"Create account",accountOk:"Signed in",accountHint:"Username: 3–24 characters (letters, numbers, _). Password: at least 10 characters. Email verification is not implemented yet.",unavailable:"Global rankings and accounts are currently unavailable. Image practice works for guests.",demo:"Beta uses original fantasy illustrations; verified Silkroad game images will follow.",expired:"Time is up!",done:"Today's ranked attempt has already been used.",answer:"Answer",name:"Player",score:"Score",best:"Time",connection:"Network or server issue. Please try again.",pwWarn:"Beta does not yet support email verification or password recovery. Do not reuse a password.",delete:"Delete my account"}};
let view="classic",language=()=>document.documentElement.lang==="en"?"en":"hu",t=()=>translations[language()],me=null,dbAvailable=false,community=null,round=null,clock=null,clockBase=null,lock=false,scope="daily",currentIndex=0;
const samples=[
{id:"s01",image:"./art/s01.svg",answer:"Tiger Girl",choices:["Tiger Girl","Cerberus","Captain Ivy","Uruchi","Isyutaru","Lord Yarkan"],world:"Chinese"},
{id:"s02",image:"./art/s02.svg",answer:"Cerberus",choices:["Tiger Girl","Cerberus","Captain Ivy","Uruchi","Isyutaru","Lord Yarkan"],world:"European"},
{id:"s03",image:"./art/s03.svg",answer:"Glavie",choices:["Glavie","Spear","Bow","Blade","Sword","Shield"],world:"Chinese"},
{id:"s04",image:"./art/s04.svg",answer:"Harp",choices:["Harp","Cleric Rod","Crossbow","Dagger","Staff","Dark Staff"],world:"European"}
];
function el(tag,cl,text,parent){const x=document.createElement(tag);if(cl)x.className=cl;if(text!==null&&text!==undefined)x.textContent=text;if(parent)parent.append(x);return x}
function btn(label,parent,callback,cl="rbtn"){const x=el("button",cl,label,parent);x.type="button";x.onclick=callback;return x}
function clear(){screen.replaceChildren()}
function title(text){el("div","tag","SILKDLE CHALLENGE",screen);el("h2","",text,screen)}
function info(text,cls="rmuted"){return el("p",cls,text,screen)}
function showError(err){info(err?.message||t().connection,"rerror")}
function choose(parent,list){const s=el("select","",null,parent);const ph=el("option","",t().choose,s);ph.value="";s.value="";list.forEach(n=>{const o=el("option","",n,s);o.value=n});return s}
function typedAnswer(parent){const input=el("input","",null,parent);input.type="text";input.autocomplete="off";input.spellcheck=false;input.maxLength=80;input.placeholder=t().choose;return input}
function matchAnswer(a,b){const normal=s=>String(s).normalize("NFKC").trim().toLocaleLowerCase("en").replace(/\bglavie\b/g,"glaive");return normal(a)===normal(b)}
function dayKey(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Budapest",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
function selectSample(){return samples[currentIndex%samples.length]}
function newCommunity(){const mode=document.getElementById("world")?.value||"all",matches=samples.filter(s=>mode==="all"||s.world===mode);if(!matches.length)return samples[0];return matches[currentIndex%matches.length]}
function imageBox(image,parent,cropX=.5,cropY=.45){const box=el("div","imgframe",null,parent);const img=el("img","",null,box);if(image.startsWith("https://"))img.referrerPolicy="no-referrer";img.src=image;img.alt=(image.startsWith("/api/image/file/")||image.startsWith("blob:"))?(language()==="hu"?"Rejtett Silkroad játékbeli kép":"Hidden Silkroad gameplay screenshot"):(language()==="hu"?"Demó fantáziarajz":"Demo fantasy illustration");img.loading="eager";const mask=el("div","maskgrid zoom-crop",null,box);for(let i=0;i<100;i++)el("i","",null,mask);mask._cropImage=img;img.style.transformOrigin=Math.round(Math.min(1,Math.max(0,Number(cropX)))*100)+"% "+Math.round(Math.min(1,Math.max(0,Number(cropY)))*100)+"%";return mask}
const revealOrder=Array.from({length:100},(_,i)=>i).sort((a,b)=>{const distance=k=>Math.abs(k%10-4.5)+Math.abs(Math.floor(k/10)-4.5);return distance(a)-distance(b)||((a*37)%101)-((b*37)%101)});
function reveal(mask,count){const tiles=mask.children;for(let i=0;i<100;i++)tiles[revealOrder[i]].classList.toggle("revealed",i<count);
 if(mask._cropImage){const progress=Math.max(0,Math.min(1,count/100)),zoom=1+9*Math.pow(1-progress,4);mask._cropImage.style.transform="scale("+zoom.toFixed(2)+")";mask._cropImage.setAttribute("data-zoom",zoom.toFixed(2));}
}
function switchView(next){view=next;clearInterval(clock);clock=null;lock=false;modeGrid.hidden=next!=="classic";classicPanel.hidden=next!=="classic";screen.hidden=next==="classic";buttons.forEach(([k],i)=>{bar.children[i].textContent=t()[k];bar.children[i].classList.toggle("on",next===k)});if(next==="picture")showCommunity();if(next==="local")showLocal();if(next==="ranked")showRanked();if(next==="leaderboard")showLeaderboard();if(next==="account")showAccount()}
function showDemoCommunity(){clear();title(t().pictureTitle);info(t().pictureIntro);if(!community)community={sample:newCommunity(),mistakes:0,opened:1,done:false};
const sample=community.sample,layout=el("div","rgrid",null,screen),left=el("div","",null,layout),right=el("div","",null,layout),mask=imageBox(sample.image,left);
reveal(mask,community.done?100:community.opened);el("p","rlegend",t().demo,left);
el("div","rstatline",null,right).append(el("span","",t().mistakes+": "+community.mistakes+" / 6"));
if(community.done){el("h2",community.mistakes<6?"rok":"rerror",community.mistakes<6?t().correct:t().finish,right);el("p","rmuted",t().answer+": "+sample.answer,right);btn(t().again,right,()=>{currentIndex++;community={sample:newCommunity(),mistakes:0,opened:1,done:false};showDemoCommunity()});return}
const input=typedAnswer(right),message=el("p","rmuted","",right);
const submit=()=>{const v=input.value.trim();if(!v)return;if(matchAnswer(v,sample.answer)){community.done=true;showDemoCommunity();return}
community.mistakes++;community.opened=Math.min(100,community.opened+6);if(community.mistakes>=6){community.done=true;showDemoCommunity();return}
message.textContent=t().wrong;reveal(mask,community.opened);input.value="";input.focus()};
btn(t().guess,right,submit);input.onkeydown=e=>{if(e.key==="Enter")submit()};
el("div","",null,right).append(btn(t().reveal,right,()=>{community.opened=Math.min(100,community.opened+3);reveal(mask,community.opened)},"rsecondary"));
}

let imageCategory="all";

/* Local practice mode. It never contributes to the shared leaderboard. */
let localGame=null,localImageUrl=null,localCategory="all",localHistory=[];
function localGallery(){return window.SILKDLE_LOCAL_GALLERY}
function destroyLocalImage(){if(localImageUrl){URL.revokeObjectURL(localImageUrl);localImageUrl=null}}
function localChoices(){return [["all","Összes kategória"],["unique","Unique"],["mob","Mob"],["weapon","Weapon"],["armor","Armor"],["location","Location"],["npcquest","NPC / Quest"]]}
async function startLocalGame(){
 if(!localGallery())return;
 const all=await localGallery().list(),world=document.getElementById("world")?.value||"all";
 const options=all.filter(x=>(localCategory==="all"||x.category===localCategory)&&(world==="all"||x.world===world||x.world==="all"));
 if(!options.length){localGame=null;destroyLocalImage();return}
 const choices=options.filter(x=>!localHistory.includes(x.id)),pickPool=choices.length?choices:options;
 let index=0;try{index=crypto.getRandomValues(new Uint32Array(1))[0]%pickPool.length}catch{index=Math.floor(Math.random()*pickPool.length)}
 const target=pickPool[index];localHistory.push(target.id);if(localHistory.length>Math.min(8,options.length-1))localHistory.shift();
 const blob=await localGallery().getBlob(target.id);
 if(!blob)throw Error("Missing locally stored image");
 destroyLocalImage();localImageUrl=URL.createObjectURL(blob);
 localGame={target,wrong:0,opened:.01,done:false,correct:false};
}
async function showLocal(){
 clear();title(language()==="hu"?"Saját Silkroad képfelismerő":"My Silkroad Screenshot Hunt");
 info(language()==="hu"?"Valódi, saját feltöltésű játékfotókkal játszhatsz ebben a böngészőben. Nem kell fiók vagy adatbázis; mások viszont nem látják a helyi képeidet.":"Play with screenshots saved on this device. No account or server database needed; they are private to this browser.");
 if(!localGallery()){info("A böngésződ nem támogatja a helyi képmentést.","rerror");return}
 if(!localGame){
  try{await startLocalGame()}catch(e){info(e.message,"rerror");return}
 }
 if(view!=="local")return;
 drawLocal();
}
function drawLocal(){
 if(view!=="local")return;
 clear();title(language()==="hu"?"Saját Silkroad képfelismerő":"My Silkroad Screenshot Hunt");
 const categories=el("select","",null,screen);
 for(const [value,label] of localChoices()){const op=el("option","",label,categories);op.value=value}
 categories.value=localCategory;
 categories.onchange=async()=>{localCategory=categories.value;localGame=null;destroyLocalImage();showLocal()};
 const link=el("a","",language()==="hu"?"📷 Képeim hozzáadása és kezelése":"📷 Import / manage screenshots",screen);
 link.href="./admin.html";link.style.cssText="display:block;color:#85dfb5;margin:12px 0";
 if(!localGame){info(language()==="hu"?"Még nincs ilyen kategóriájú helyi képed. Az adminoldalon JPG/PNG képekből készíthetsz saját feladványokat.":"No local screenshots match this category. Add real JPG/PNG game captures in Screenshot Studio.","rerror");return}
 const game=localGame;
 const layout=el("div","rgrid",null,screen),left=el("div","",null,layout),right=el("div","",null,layout),mask=imageBox(localImageUrl,left,game.target.cropX,game.target.cropY);
 reveal(mask,Math.round(game.opened*100));
 el("p","rlegend",language()==="hu"?"Helyi képtár – csak ezen a készüléken":"On-device screenshot, not shared globally",left);
 const progress=el("div","rstatline",null,right);el("span","",t().mistakes+": "+game.wrong+" / 6",progress);
 if(game.done){reveal(mask,100);el("h2",game.correct?"rok":"rerror",game.correct?t().correct:t().finish,right);
 el("p","rmuted",t().answer+": "+game.target.answer,right);
 btn(t().again,right,async()=>{localGame=null;destroyLocalImage();await showLocal()});return}
 const input=typedAnswer(right),notice=el("p","rmuted","",right);
 const guess=()=>{const value=input.value.trim();if(!value)return;
 const all=[game.target.answer,...(game.target.aliases||[])];
 if(all.some(x=>matchAnswer(value,x))){game.done=true;game.correct=true;game.opened=1;drawLocal();return}
 game.wrong++;game.opened=[.01,.025,.07,.18,.45,.7,1][game.wrong];
 if(game.wrong>=6){game.done=true;game.opened=1;drawLocal();return}
 notice.textContent=t().wrong;progress.replaceChildren();el("span","",t().mistakes+": "+game.wrong+" / 6",progress);
 reveal(mask,Math.round(game.opened*100));input.value="";input.focus()
 };
 btn(t().guess,right,guess);input.onkeydown=e=>{if(e.key==="Enter")guess()};
 btn(t().reveal,right,()=>{game.opened=Math.min(1,game.opened+.12);reveal(mask,Math.round(game.opened*100))},"rsecondary");
}


/* Source-linked public practice: no copied game assets; no leaderboards or account required. */
let webHistory=[],webBroken=new Set();
function webChoices(){return [["all",language()==="hu"?"Összes kategória":"All categories"],["unique","Unique"],["mob","Mob"],["weapon",language()==="hu"?"Fegyver":"Weapon"],["location",language()==="hu"?"Helyszín":"Location"],["npcquest","NPC / Quest"]]}
function newWebPuzzle(){
 const world=document.getElementById("world")?.value||"all";
 const allowed=(window.SILKDLE_WEB_IMAGES_V1||[]).filter(x=>!webBroken.has(x.id)&&(imageCategory==="all"||x.category===imageCategory)&&(world==="all"||x.world==="all"||x.world===world));
 if(!allowed.length)return null;
 const unique=allowed.filter(x=>!webHistory.includes(x.id)),arr=unique.length?unique:allowed;
 let index=Math.floor(Math.random()*arr.length);
 if(typeof crypto!=="undefined"&&crypto.getRandomValues){const v=new Uint32Array(1);crypto.getRandomValues(v);index=v[0]%arr.length}
 const item=arr[index];webHistory.push(item.id);if(webHistory.length>Math.max(1,Math.min(10,allowed.length-1)))webHistory.shift();
 return {type:"web",item,wrong:0,opened:.01,done:false,correct:false};
}
function showWebCommunity(){
 if(view!=="picture")return;
 if(community?.type!=="web")community=newWebPuzzle();
 drawWebCommunity()
}
function drawWebCommunity(){
 if(view!=="picture")return;
 clear();title(language()==="hu"?"Képfelismerés – valódi Silkroad-képek":"Image Hunt – real Silkroad screenshots");
 info(language()==="hu"?"Interneten talált valódi Silkroad-képekkel játszhatsz. Nem kell képet hozzáadnod. Nincs időlimit; ez forráshivatkozásos gyakorlómód, nem a közös ranglista.":"Play with real Silkroad screenshots found online. No uploads required. This is unranked, source-linked practice.");
 const filter=el("select","",null,screen);
 for(const [value,label] of webChoices()){const o=el("option","",label,filter);o.value=value}
 filter.value=imageCategory;
 filter.onchange=()=>{imageCategory=filter.value;community=newWebPuzzle();drawWebCommunity()};
 if(!community){info(language()==="hu"?"Ehhez a szűrőhöz nincs működő online kép. Válts az összes kategóriára.":"No working image for this filter. Try all categories.","rerror");btn(language()==="hu"?"Összes kategória":"All categories",screen,()=>{imageCategory="all";community=newWebPuzzle();drawWebCommunity()},"rsecondary");return}
 const game=community,item=game.item,layout=el("div","rgrid",null,screen),left=el("div","",null,layout),right=el("div","",null,layout),mask=imageBox(item.image,left,item.cropX,item.cropY);
 const picture=mask._cropImage;
 picture.onerror=()=>{webBroken.add(item.id);if(view!=="picture"||community?.item?.id!==item.id)return;community=newWebPuzzle();drawWebCommunity()};
 reveal(mask,Math.round(game.opened*100));
 const intro=el("p","rlegend",language()==="hu"?"Külső forrásból betöltött Silkroad-játékfotó • A kép elérhetősége a forrástól függ":"Externally hosted Silkroad screenshot • Availability depends on the original site",left);
 const cite=el("a","rlegend",language()==="hu"?"Forrásoldal megnyitása":"Open original source",left);
 cite.href=item.source;cite.target="_blank";cite.rel="noopener noreferrer";cite.style.cssText="display:block;color:#9adfbe;word-wrap:break-word";
 const count=el("div","rstatline",null,right);el("span","",t().mistakes+": "+game.wrong+" / 6",count);
 const next=()=>{community=newWebPuzzle();drawWebCommunity()};
 if(game.done){
  reveal(mask,100);el("h2",game.correct?"rok":"rerror",game.correct?t().correct:t().finish,right);
  el("p","rmuted",t().answer+": "+item.answer,right);btn(t().again,right,next);return
 }
 const input=typedAnswer(right),notice=el("p","rmuted","",right);
 const submit=()=>{const value=input.value.trim();if(!value)return;
 if([item.answer,...(item.aliases||[])].some(x=>matchAnswer(x,value))){game.done=true;game.correct=true;game.opened=1;drawWebCommunity();return}
 game.wrong++;game.opened=[.01,.025,.07,.18,.45,.7,1][game.wrong];
 if(game.wrong>=6){game.done=true;game.opened=1;drawWebCommunity();return}
 notice.textContent=t().wrong;count.replaceChildren();el("span","",t().mistakes+": "+game.wrong+" / 6",count);
 reveal(mask,Math.round(game.opened*100));input.value="";input.focus();
 };
 btn(t().guess,right,submit);input.onkeydown=e=>{if(e.key==="Enter")submit()};
 const controls=el("div","rcontrols",null,right);
 btn(t().reveal,controls,()=>{game.opened=Math.min(1,game.opened+.12);reveal(mask,Math.round(game.opened*100))},"rsecondary");
 btn(language()==="hu"?"Másik kép":"Next image",controls,next,"rsecondary");
 el("p","rlegend",language()==="hu"?"Külső képek: az eredeti szerzői és játékjogok a tulajdonosokat illetik; ezek nem a Silkdle tárhelyén tárolt képek.":"Third-party screenshot rights remain with their respective owners; files are not stored on Silkdle.",right);
}

async function showCommunity(){
 clear();title(t().pictureTitle);info("Képek betöltése / Loading images...");
 let availability;
 try{availability=await api("/image/status")}catch(e){availability={approved:0,configured:false}}
 if(view!=="picture")return;
 if(availability.approved===0){
  if(community?.type==="real")community=null;
  if(Array.isArray(window.SILKDLE_WEB_IMAGES_V1)&&window.SILKDLE_WEB_IMAGES_V1.length){showWebCommunity();return}
  showDemoCommunity();
  info(language()==="hu"?"Nincs még publikált, ellenőrzött Silkroad-kép. A négy fantáziaillusztráció kizárólag demó. Képfeltöltés: /admin.html":"No approved Silkroad screenshots yet. The four fantasy drawings are demo content only. Import images through /admin.html","rerror");
  const link=el("a","",language()==="hu"?"Képkatalógus / admin":"Image catalog / admin",screen);link.href="./admin.html";
  try{const localCount=await localGallery()?.count();if(view==="picture"&&localCount>0)btn((language()==="hu"?"🗂️ Saját képeimmel játszom (":"🗂️ Play my screenshots (")+localCount+")",screen,()=>switchView("local"),"rsecondary")}catch{}
  return;
 }
 if(!community||community.type!=="real"){
  try{
   const r=await api("/image/practice/start","POST",{category:imageCategory,world:document.getElementById("world")?.value||"all"});
   community={type:"real",data:r,done:false,wrong:0,answer:null,opened:.01}
  }catch(e){clear();title(t().pictureTitle);info(e.message,"rerror");const again=btn(language()==="hu"?"Összes kategória":"All categories",screen,()=>{imageCategory="all";community=null;showCommunity()});return}
 }
 drawRealCommunity()
}
function drawRealCommunity(){
 if(view!=="picture"||community?.type!=="real")return;
 clear();title(t().pictureTitle);
 info(language()==="hu"?"Valódi, admin által jóváhagyott Silkroad-kép. Szűk részletből kell felismerned, a megfejtést írd be.":"Real administrator-approved Silkroad screenshot. Identify it from a tiny crop; type the name.");
 const filter=el("select","",null,screen);
 const options=[["all",language()==="hu"?"Összes kategória":"All categories"],["unique","Unique"],["mob","Mob"],["weapon",language()==="hu"?"Fegyver":"Weapon"],["armor",language()==="hu"?"Ruha / páncél":"Armor"],["location",language()==="hu"?"Helyszín":"Location"],["npcquest","NPC / Quest"]];
 for(const [value,label] of options){const o=el("option","",label,filter);o.value=value}
 filter.value=imageCategory;filter.onchange=()=>{imageCategory=filter.value;community=null;showCommunity()};
 const data=community.data,layout=el("div","rgrid",null,screen),left=el("div","",null,layout),right=el("div","",null,layout);
 const mask=imageBox(data.image,left,data.cropX,data.cropY);reveal(mask,Math.round((community.opened||.01)*100));
 const counter=el("div","rstatline",null,right);el("span","",t().mistakes+": "+community.wrong+" / 6",counter);
 const next=()=>{community=null;showCommunity()};
 if(community.done){reveal(mask,100);el("h2",community.correct?"rok":"rerror",community.correct?t().correct:t().finish,right);el("p","rmuted",t().answer+": "+community.answer,right);btn(t().again,right,next);return}
 const input=typedAnswer(right),notice=el("p","rmuted","",right);
 const submit=async()=>{const guess=input.value.trim();if(!guess||lock)return;lock=true;try{
 const outcome=await api("/image/practice/guess","POST",{guess});community.wrong=outcome.wrong;community.opened=outcome.opened;
 community.done=outcome.finished;community.correct=outcome.correct;community.answer=outcome.answer||null;
 if(outcome.finished){drawRealCommunity();return}
 notice.textContent=t().wrong;reveal(mask,Math.round(outcome.opened*100));counter.replaceChildren();el("span","",t().mistakes+": "+outcome.wrong+" / 6",counter);input.value="";input.focus()
 }catch(e){notice.textContent=e.message}finally{lock=false}};
 btn(t().guess,right,submit);input.onkeydown=e=>{if(e.key==="Enter")submit()};
 el("p","rlegend",language()==="hu"?"A helyes választ a szerver ellenőrzi. A kép csak jóváhagyás után kerül játékba.":"Answers are verified by the server. Only approved screenshots are playable.",right);
}

async function api(route,method="GET",body){const opts={method,credentials:"same-origin",headers:{"accept":"application/json"}};if(method!=="GET"){opts.headers["content-type"]="application/json";opts.body=JSON.stringify(body||{})}const resp=await fetch("/api"+route,opts);let data;try{data=await resp.json()}catch{throw Error(t().unavailable)}if(!resp.ok)throw Error(data.error||t().connection);return data}
async function fetchMe(){try{const d=await api("/me");me=d.user;dbAvailable=true}catch(e){me=null;dbAvailable=false}}
function counter(parent,serverState){const row=el("div","rstatline",null,parent);const time=el("span","rtimer","45.0s",row),wrong=el("span","",t().mistakes+": "+serverState.wrong,row),progress=el("div","rprogress",null,parent),bar=el("div","",null,progress);return {time,wrong,bar}}
async function showRanked(){clear();title(t().rankTitle);info(t().rankIntro);await fetchMe();if(view!=="ranked")return;if(!dbAvailable){showError({message:t().unavailable});return}if(!me){info(t().guest);btn(t().signIn,screen,()=>switchView("account"));return}const name=el("p","rok",t().accountOk+": "+me.username,screen);name.dataset.user=me.username;try{const d=await api("/race/status");if(view!=="ranked")return;if(d.started){round=d;drawRound(d)}else{btn(t().start,screen,async()=>{if(lock)return;lock=true;try{const s=await api("/race/start","POST",{});if(view==="ranked"){round=s;drawRound(s)}}catch(e){showError(e)}finally{lock=false}})}}catch(e){showError(e)}}
function drawRound(s){if(view!=="ranked")return;clearInterval(clock);clear();title(t().rankTitle);info(t().rankIntro);
const puzzle=s.puzzle;if(!puzzle){info(t().connection);return}
const layout=el("div","rgrid",null,screen),left=el("div","",null,layout),right=el("div","",null,layout),mask=imageBox(puzzle.image,left,puzzle.cropX,puzzle.cropY);
el("p","rlegend",t().demo,left);
const {time,wrong,bar}=counter(right,s);
const duration=Math.max(1,s.expiresAt-s.startedAt||45000),remaining=Math.max(0,s.expiresAt-(s.serverNow||Date.now()));
clockBase={remaining,start:performance.now()};
let bonus=0;
const label=el("p","rmuted",t().rankIntro,right);
function tick(){const ms=Math.max(0,clockBase.remaining-(performance.now()-clockBase.start)),seconds=ms/1000;
time.textContent=seconds.toFixed(1)+"s";bar.style.width=(100*ms/duration).toFixed(2)+"%";
const elapsed=duration-ms;
const visible=s.finished?100:elapsed>=40000?35:elapsed>=30000?22:elapsed>=20000?12:elapsed>=10000?6:elapsed>=5000?3:1;
reveal(mask,Math.min(100,visible+bonus));
if(ms<=0&&!s.finished){clearInterval(clock);clock=null;time.textContent=t().expired;setTimeout(async()=>{try{const status=await api("/race/status");if(view==="ranked")drawRound(status)}catch{}},400)}}
tick();
if(s.finished){clearInterval(clock);clock=null;reveal(mask,100);label.textContent=t().done;el("h2",s.correct?"rok":"rerror",s.correct?t().correct:t().finish,right);el("p","rmuted",t().answer+": "+s.answer,right);el("h2","rok",s.score+" "+t().points,right);btn(t().leaderboard,right,()=>switchView("leaderboard"));return}
const input=typedAnswer(right),message=el("p","rmuted","",right);
const submit=async()=>{if(lock||!input.value.trim())return;lock=true;try{const result=await api("/race/guess","POST",{guess:input.value.trim()});
if(result.finished){const updated=await api("/race/status");if(view==="ranked")drawRound(updated)}
else{message.textContent=t().wrong;wrong.textContent=t().mistakes+": "+result.wrong+" / 2";bonus+=8;tick();input.value="";input.focus()}}
catch(e){message.textContent=e.message}finally{lock=false}};
btn(t().guess,right,submit);input.onkeydown=e=>{if(e.key==="Enter")submit()};clock=setInterval(tick,120)
}
async function showLeaderboard(){clear();title(t().boardTitle);const row=el("div","rcontrols",null,screen);btn(t().rankDay,row,()=>{scope="daily";showLeaderboard()},"rsecondary");btn(t().rankAll,row,()=>{scope="all";showLeaderboard()},"rsecondary");try{const result=await api("/leaderboard?scope="+scope);if(view!=="leaderboard")return;if(!result.entries.length){info(t().rankEmpty);return}const table=el("table","rlist",null,screen),head=el("thead","",null,table),tr=el("tr","",null,head);["#",t().name,t().score,t().best].forEach(x=>el("th","",x,tr));const tbody=el("tbody","",null,table);result.entries.forEach((entry,i)=>{const r=el("tr","",null,tbody);[String(i+1),entry.username,String(entry.score),(Number(entry.elapsed_ms)/1000).toFixed(1)+"s"].forEach(x=>el("td","",x,r))})}catch(e){showError(e)}}
async function showAccount(){clear();title(t().accountTitle);info(t().guest);await fetchMe();if(view!=="account")return;if(!dbAvailable){showError({message:t().unavailable});return}if(me){el("h2","rok",t().accountOk+": "+me.username,screen);btn(t().logout,screen,async()=>{try{await api("/auth/logout","POST");me=null;switchView("account")}catch(e){showError(e)}});const detail=el("details","rform",null,screen),summary=el("summary","",t().delete,detail),p=el("div","rhelp",t().delete+" – "+t().password,detail),pass=el("input","",null,detail);pass.type="password";pass.autocomplete="current-password";btn(t().delete,detail,async()=>{if(!confirm(t().delete+"?"))return;try{await api("/account/delete","POST",{password:pass.value});me=null;switchView("account")}catch(e){showError(e)}},"rsecondary");return}
const form=el("div","rform",null,screen);const tabs=el("div","rcontrols",null,form);const fields=el("div","",null,form);const notice=el("p","rerror","",form);el("p","rhelp",t().pwWarn,form);let signup=false;
function field(label,type,autocomplete){const lab=el("label","",label,fields),input=el("input","",null,lab);input.type=type;input.autocomplete=autocomplete;input.required=true;return input}
function renderFields(){fields.replaceChildren();const username=field(signup?t().username:t().login,"text",signup?"username":"username"),email=signup?field(t().email,"email","email"):null,password=field(t().password,"password",signup?"new-password":"current-password");
btn(signup?t().submitRegister:t().submitLogin,fields,async()=>{notice.textContent="";if(!username.value||!password.value||(email&&!email.value)){notice.textContent=t().connection;return}lock=true;try{await api(signup?"/auth/register":"/auth/login","POST",signup?{username:username.value.trim(),email:email.value.trim(),password:password.value}:{login:username.value.trim(),password:password.value});await fetchMe();if(view==="account")showAccount()}catch(e){notice.textContent=e.message}finally{lock=false}})}
btn(t().signIn,tabs,()=>{signup=false;renderFields()},"rsecondary");btn(t().signUp,tabs,()=>{signup=true;renderFields()},"rsecondary");renderFields();info(t().accountHint)}
const langButton=document.getElementById("lang");if(langButton)langButton.addEventListener("click",()=>{if(view!=="classic")switchView(view)});
switchView(window.location?.search?.includes("mode=picture")?"picture":"classic");
})();