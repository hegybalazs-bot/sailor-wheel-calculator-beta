'use strict';
/* Generate a public-only static deployment. No admin preview, extracted PNG/DDJ,
 * review ZIP, server itemdata, repository metadata or development tools included.
 * Note: existing Render service must explicitly set publish directory to dist-public.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const base=path.resolve(__dirname,'..'),dist=path.join(base,'dist-public');
const allowed=[
 ['publikus.html','index.html'],
 ['publikus.html','publikus.html'],
 ['ikon-helyreallitas.html','ikon-helyreallitas.html'],
 ['visszajelzes.html','visszajelzes.html'],
 ['assets/icons/manifest.js','assets/icons/manifest.js'],
 ['assets/icons/local-pack.js','assets/icons/local-pack.js']
];
const REVISION_PLACEHOLDER='<span id="buildVersion" data-build-commit="unavailable" style="display:inline-block;white-space:nowrap;opacity:.78" title="Telepített Git-verzió">Build: nincs adat</span>';
function buildCommit(env=process.env){
 const fromRender=String(env.RENDER_GIT_COMMIT||'').trim();
 if(/^[0-9a-f]{40}$/i.test(fromRender))return fromRender.toLowerCase();
 try{
  const fromGit=execFileSync('git',['rev-parse','--verify','HEAD'],{
   cwd:base,encoding:'utf8',stdio:['ignore','pipe','ignore']
  }).trim();
  if(/^[0-9a-f]{40}$/i.test(fromGit))return fromGit.toLowerCase();
 }catch(_){}
 return null;
}
function build(){
 fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
 const commit=buildCommit(),shortCommit=commit?commit.slice(0,8):'ismeretlen';
 for(const [source,target] of allowed){
  let bytes=fs.readFileSync(path.join(base,source));
  if(source==='publikus.html'){
   const sourceHtml=bytes.toString('utf8');
   assert(sourceHtml.includes(REVISION_PLACEHOLDER),'public revision marker not present');
   const version='<span id="buildVersion" data-build-commit="'+(commit||'unavailable')+
    '" style="display:inline-block;white-space:nowrap;opacity:.78" title="Telepített Git-verzió">Build: '+shortCommit+'</span>';
   bytes=Buffer.from(sourceHtml.replace(REVISION_PLACEHOLDER,version),'utf8');
  }
  const destination=path.join(dist,target);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,bytes);
  if(source==='publikus.html'&&target==='index.html')assert(bytes.includes('EMERALD · PUBLIC'));
 }
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const p=path.join(dir,entry.name);
  return entry.isDirectory()?walk(p):[path.relative(dist,p).replaceAll(path.sep,'/')];
 });
 const list=walk(dist).sort(),expected=allowed.map(pair=>pair[1]).sort();
 assert.deepEqual(list,expected,'no extra files may leak into the public deployment');
 for(const file of ['index.html','publikus.html']){
  const html=fs.readFileSync(path.join(dist,file),'utf8');
  assert(!/id="localIconZip"|data-custom-icon=|EMERALD v5 ADMIN PREVIEW|href="bemutato\.html"/.test(html));
  assert(/id="buildVersion" data-build-commit="(?:[a-f0-9]{40}|unavailable)"/.test(html),
   'a real build SHA or explicit unknown state must be present');
 }
 const recovery=fs.readFileSync(path.join(dist,'ikon-helyreallitas.html'),'utf8');
 assert(recovery.includes('id="iconPack"')&&recovery.includes('assets/icons/local-pack.js'),'recovery imports images locally in browser');
 assert(!/id="localIconZip"|data-custom-icon=|ADMIN PREVIEW/.test(recovery),'no admin icon manager in recovery page');
 console.log('PUBLIC BUILD: '+list.join(', '));
 console.log('PUBLIC BUILD SOURCE: '+(commit||'unavailable'));
 console.log('PUBLIC BUILD PASS — admin preview and client artwork excluded');
 return list;
}
if(require.main===module)build();
module.exports={build,buildCommit};
