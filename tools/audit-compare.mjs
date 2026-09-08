// node tools/audit-compare.mjs  -> distinctness report: track-shape correlation, prop vocabulary uniqueness, audit hit totals.
import * as THREE from '../three.module.js';
import {circuits} from '../levels.js';
import {readFileSync,existsSync} from 'node:fs';
const N=720;
function shape(level){
  const curve=new THREE.CatmullRomCurve3(level.control.map(p=>new THREE.Vector3(...p)),true,'centripetal'),len=curve.getLength();
  const yaw=u=>{const v=curve.getTangentAt(((u%1)+1)%1);return Math.atan2(v.x,v.z)};
  const turn=[],hist=new Array(12).fill(0);
  for(let i=0;i<N;i++){const t=i/N;let d=yaw(t+.008)-yaw(t-.008);d=Math.atan2(Math.sin(d),Math.cos(d));turn.push(d);const R=(.016*len)/Math.max(1e-4,Math.abs(d));const bin=Math.min(11,Math.floor(Math.log2(Math.max(20,R)/20)*2));hist[bin]++}
  const ys=Array.from({length:N},(_,i)=>curve.getPointAt(i/N).y),rise=Math.max(...ys)-Math.min(...ys);
  const seq=[];let cur=0,run=0;for(const d of turn){const s=Math.abs(d)<.02?0:Math.sign(d);if(s!==cur){if(cur!==0&&run>6)seq.push(cur>0?'L':'R');cur=s;run=0}run++}
  return{len,hist:hist.map(v=>v/N),turn,rise,seq:seq.join(''),corners:seq.length};
}
const corr=(a,b)=>{const ma=a.reduce((x,y)=>x+y,0)/a.length,mb=b.reduce((x,y)=>x+y,0)/b.length;let n=0,da=0,db=0;for(let i=0;i<a.length;i++){n+=(a[i]-ma)*(b[i]-mb);da+=(a[i]-ma)**2;db+=(b[i]-mb)**2}return n/Math.sqrt(da*db||1)};
// best circular-shift correlation of |turn| profiles (same track wearing different paint would score high)
function shiftCorr(a,b){let best=-1;const A=a.map(Math.abs),B=b.map(Math.abs);for(let s=0;s<N;s+=6){const Bs=B.map((_,i)=>B[(i+s)%N]);best=Math.max(best,corr(A,Bs))}return best}
const S=Object.fromEntries(circuits.map(c=>[c.id,shape(c)]));
console.log('## Track shape');console.log('| circuit | length | corners | rise | turn sequence |');console.log('|---|---|---|---|---|');
for(const c of circuits)console.log(`| ${c.id} | ${S[c.id].len.toFixed(0)} m | ${S[c.id].corners} | ${S[c.id].rise.toFixed(0)} m | ${S[c.id].seq} |`);
console.log('\n## Shape similarity (radius histogram corr / best-shift |turn| corr) — above 0.9 is a paint swap');
console.log('| | '+circuits.map(c=>c.id).join(' | ')+' |');console.log('|---|'+circuits.map(()=>'---').join('|')+'|');
for(const a of circuits)console.log(`| ${a.id} | `+circuits.map(b=>a.id===b.id?'—':`${corr(S[a.id].hist,S[b.id].hist).toFixed(2)} / ${shiftCorr(S[a.id].turn,S[b.id].turn).toFixed(2)}`).join(' | ')+' |');
// vocabulary from audit reports
const audits=circuits.map(c=>{const p=`tools/reports/audit-${c.id}.json`;return existsSync(p)?JSON.parse(readFileSync(p,'utf8')):null});
if(audits.every(Boolean)){
  const kindSets=audits.map(a=>new Set(a.vocab.map(v=>v.kind)));
  console.log('\n## Prop vocabulary and audit hits');console.log('| circuit | solids | kinds | unique kinds | unsupported | buried | road clip | collider w/o mesh |');console.log('|---|---|---|---|---|---|---|---|');
  audits.forEach((a,i)=>{const unique=[...kindSets[i]].filter(k=>!kindSets.some((s,j)=>j!==i&&s.has(k)));const sum=l=>l.reduce((x,y)=>x+y.count,0);
    console.log(`| ${a.level} | ${a.solids} | ${a.kinds} | ${unique.length} | ${sum(a.unsupported)} | ${sum(a.buried)} | ${sum(a.roadClip)} | ${a.colliderNoMesh.length} |`)});
  console.log('\n## Unsupported (floating with nothing under them) by circuit');
  for(const a of audits){console.log(`\n### ${a.level}`);for(const g of a.unsupported.slice(0,15))console.log(`- ${g.count}× ${g.kind} size ${g.first[0].size.join('×')} gap ${g.first[0].gap} m @ t=${g.first.map(f=>f.t).join(', ')}`);
    if(a.roadClip.length){console.log('  road clip:');for(const g of a.roadClip.slice(0,8))console.log(`  - ${g.count}× ${g.kind} @ t=${g.first.map(f=>f.t).join(', ')} d=${g.first[0].d}`)}
    if(a.buried.length){console.log('  buried:');for(const g of a.buried.slice(0,8))console.log(`  - ${g.count}× ${g.kind} @ t=${g.first.map(f=>f.t).join(', ')}`)}
    if(a.colliderNoMesh.length)console.log('  colliders without mesh: '+a.colliderNoMesh.map(c=>c.label+'@'+c.t).join(', '))}
}else console.log('\n(audit reports incomplete: run ?audit=1&chain=1 first)');
