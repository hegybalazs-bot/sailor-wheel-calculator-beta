'use strict';
/* Protected, read-only developer preview for a SEPARATE Render Web Service.
 * Fail closed when PRIVATE_PREVIEW_USER/PASSWORD are absent or weak.
 * No API, no game credentials, no admin privileges over other users.
 * This code intentionally serves only explicitly allowlisted files.
 * Production must be accessed via Render's HTTPS ingress.
 */
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {createHash,timingSafeEqual}=require('node:crypto');

const ALLOWED=new Map([
 ['/','index.html'],
 ['/index.html','index.html'],
 ['/bemutato.html','bemutato.html'],
 ['/publikus.html','publikus.html'],
 ['/visszajelzes.html','visszajelzes.html'],
 ['/ikon-helyreallitas.html','ikon-helyreallitas.html'],
 ['/assets/icons/manifest.js','assets/icons/manifest.js'],
 ['/assets/icons/local-pack.js','assets/icons/local-pack.js']
]);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const STANDARD_HEADERS={
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Frame-Options':'DENY',
 'X-Robots-Tag':'noindex, nofollow, noarchive',
 'Cache-Control':'no-store, max-age=0',
 'Content-Security-Policy':"frame-ancestors 'none'; base-uri 'none'",
 'Permissions-Policy':'camera=(), microphone=(), geolocation=()'
};
function hash(value){return createHash('sha256').update(value,'utf8').digest();}
function equal(a,b){return timingSafeEqual(hash(a),hash(b));}
function credentialsValid(header,user,password){
 if(typeof header!=='string'||header.length>2048||!/^Basic\s+[A-Za-z0-9+/=]+$/i.test(header))
  return false;
 const encoded=header.replace(/^Basic\s+/i,'');
 let plain;
 try{plain=Buffer.from(encoded,'base64').toString('utf8');}catch(_){return false;}
 const colon=plain.indexOf(':');
 if(colon<=0)return false;
 const suppliedUser=plain.slice(0,colon),suppliedPassword=plain.slice(colon+1);
 return equal(suppliedUser,user)&&equal(suppliedPassword,password);
}
function createPrivatePreviewServer({user,password,root=path.resolve(__dirname,'..')}={}){
 if(typeof user!=='string'||!/^[-._@a-zA-Z0-9]{3,80}$/.test(user)||
  typeof password!=='string'||password.length<24||password.length>256)
  throw Error('Private preview needs PRIVATE_PREVIEW_USER and strong (24+ characters) PRIVATE_PREVIEW_PASSWORD.');
 const directory=path.resolve(root);
 return http.createServer((req,res)=>{
  const reply=(status,headers={},body='')=>{
   const all={...STANDARD_HEADERS,...headers};
   if(body&&req.method!=='HEAD')all['Content-Length']=Buffer.byteLength(body);
   res.writeHead(status,all);
   res.end(req.method==='HEAD'?'':body);
  };
  const parsed=(()=>{try{return new URL(req.url||'/','http://localhost');}catch(_){return null;}})();
  // Render health checks learn only readiness; no file access or login bypass.
  if(parsed?.pathname==='/__health'){
   if(req.method!=='GET'&&req.method!=='HEAD')return reply(405,{},'Method not allowed');
   return reply(200,{'Content-Type':'text/plain; charset=utf-8'},'ready');
  }
  if(!credentialsValid(req.headers.authorization,user,password)){
   return reply(401,{'WWW-Authenticate':'Basic realm="Wheel Developer", charset="UTF-8"',
    'Content-Type':'text/plain; charset=utf-8'},'Authentication required');
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return reply(405,{'Allow':'GET, HEAD'},'Method not allowed');
  const target=parsed?.pathname;
  if(!ALLOWED.has(target))return reply(404,{},'Not found');
  const filename=path.resolve(directory,ALLOWED.get(target));
  if(!filename.startsWith(directory+path.sep))return reply(404,{},'Not found');
  let data;
  try{data=fs.readFileSync(filename);}catch(_){return reply(404,{},'Not found');}
  res.writeHead(200,{...STANDARD_HEADERS,
   'Content-Type':MIME[path.extname(filename)]||'application/octet-stream',
   'Content-Length':data.length});
  res.end(req.method==='HEAD'?undefined:data);
 });
}
if(require.main===module){
 try{
  const server=createPrivatePreviewServer({
   user:process.env.PRIVATE_PREVIEW_USER,
   password:process.env.PRIVATE_PREVIEW_PASSWORD
  });
  const port=Number(process.env.PORT||10000);
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid PORT');
  server.listen(port,'0.0.0.0',()=>console.log('Private Wheel preview server accepting authenticated requests on port '+port));
 }catch(err){
  console.error('Protected preview unavailable: '+err.message);
  process.exitCode=1;
 }
}
module.exports={ALLOWED,credentialsValid,createPrivatePreviewServer};
