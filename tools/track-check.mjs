// node tools/track-check.mjs [draft]  -> per-circuit geometry metrics (from levels.js, or from tools/levels-draft.mjs overrides when 'draft' given)
import * as THREE from '../three.module.js';
import {circuits} from '../levels.js';
const useDraft=process.argv[2]==='draft';
const drafts=useDraft?(await import('./levels-draft.mjs')).drafts:{};
export function metrics(control,topSpeed=66,grip=1){
  const curve=new THREE.CatmullRomCurve3(control.map(p=>new THREE.Vector3(...p)),true,'centripetal'),len=curve.getLength(),N=1200;
  const yaw=u=>{const v=curve.getTangentAt(((u%1)+1)%1);return Math.atan2(v.x,v.z)};
  const rate=(1.72-Math.min(topSpeed,80)*.009)*(1.06+(1-grip)*.25),turnR=topSpeed/rate;
  let minR=1e9,minT=0,brake=0,lift=0,inCorner=false,corners=[],maxGrade=0,minSep=1e9,sepT=0;
  const pts=Array.from({length:N},(_,i)=>curve.getPointAt(i/N));
  for(let i=0;i<N;i++){const t=i/N;let d=yaw(t+.005)-yaw(t-.005);d=Math.atan2(Math.sin(d),Math.cos(d));const R=(.010*len)/Math.max(1e-4,Math.abs(d));
    if(R<minR){minR=R;minT=t}
    const isBrake=R<turnR*.95;if(isBrake&&!inCorner){corners.push({t:+t.toFixed(3),R:Math.round(R),dir:d>0?'L':'R'})}if(isBrake)brake++;else if(R<turnR*1.8)lift++;inCorner=isBrake;
    // refine corner min radius
    if(isBrake&&corners.length)corners[corners.length-1].R=Math.min(corners[corners.length-1].R,Math.round(R));
    const a=pts[i],b=pts[(i+1)%N],hz=Math.hypot(b.x-a.x,b.z-a.z);maxGrade=Math.max(maxGrade,Math.abs(b.y-a.y)/Math.max(.01,hz));
  }
  for(let i=0;i<N;i+=4)for(let j=i+80;j<N;j+=4){const cyc=Math.min(j-i,N-(j-i));if(cyc<80)continue;const s=pts[i].distanceTo(pts[j]);if(s<minSep){minSep=s;sepT=i/N}}
  return{len,turnR,minR,minT,corners,brakePct:100*brake/N,liftPct:100*lift/N,maxGrade,minSep,sepT};
}
for(const c of circuits){
  const control=drafts[c.id]||c.control,m=metrics(control,c.topSpeed,c.grip),flag=[];
  if(m.len<3300)flag.push('SHORT');if(m.maxGrade>.18)flag.push('GRADE');if(m.minSep<34)flag.push('CLEARANCE@'+m.sepT.toFixed(2));
  console.log(`${c.id.padEnd(9)}${drafts[c.id]?'*':' '} ${m.len.toFixed(0)}m turnR ${m.turnR.toFixed(0)} minR ${m.minR.toFixed(0)}@${m.minT.toFixed(2)} brake ${m.brakePct.toFixed(0)}% lift ${m.liftPct.toFixed(0)}% grade ${(m.maxGrade*100).toFixed(1)}% sep ${m.minSep.toFixed(0)}m corners ${m.corners.length} [${m.corners.map(k=>k.dir+k.R+'@'+k.t.toFixed(2)).join(' ')}] ${flag.join(' ')}`);
}
