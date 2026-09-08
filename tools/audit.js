// NEON BREACH scene audit. Loaded by ?audit=1[&sheet=1][&chain=1][&post=0].
// Uses window.__auditMeshes (per-mesh world boxes captured in world.js before batching) and the dev seam api.
const NB=window.__nb,A=NB.api,q=new URLSearchParams(location.search),M=window.__auditMeshes||[];
const HALF=A.TRACK_HALF_WIDTH,GROUND=-4.5,WATER_TOP=-2.95;
const cx=m=>(m.min[0]+m.max[0])/2,cz=m=>(m.min[2]+m.max[2])/2,w=m=>m.max[0]-m.min[0],h=m=>m.max[1]-m.min[1],d=m=>m.max[2]-m.min[2];
function roadInfo(x,z){const n=A.nearest({x,z});return{t:n.t,d:n.d,y:A.at(n.t).y}}
const VERGE=HALF+1.5+34;function groundAt(x,z){const r=roadInfo(x,z);if(r.d<HALF+2)return{y:r.y,kind:'road',t:r.t,d:r.d};if(r.d<VERGE)return{y:r.y-.08,kind:'verge',t:r.t,d:r.d};
  // ground plane; water box top is higher than the plane where it exists (x 180..440, z -380..240 by default placement)
  return{y:GROUND,kind:'ground',t:r.t,d:r.d}}
function overlapXZ(a,b,pad=0.3){return a.min[0]-pad<b.max[0]&&a.max[0]+pad>b.min[0]&&a.min[2]-pad<b.max[2]&&a.max[2]+pad>b.min[2]}
export function analyse(){
  const solids=M.filter(m=>!m.road&&!m.transparent);
  const floating=[],unsupported=[],buried=[],roadClip=[],kinds=new Map();
  for(const m of solids){
    const k=m.kind;kinds.set(k,(kinds.get(k)||0)+1);
    const g=groundAt(cx(m),cz(m)),gap=m.min[1]-g.y;
    if(m.max[1]<g.y-0.3)buried.push({kind:k,t:+g.t.toFixed(3),y:m.max[1],ground:g.y});
    if(gap>0.6){
      // supported if some other solid overlaps its footprint, reaches from near ground up to within 0.5 m of its underside (2 levels)
      const grounded=o=>o.min[1]-groundAt(cx(o),cz(o)).y<=0.6;
      const supported=(o,depth)=>depth>4?false:grounded(o)||solids.some(p=>p!==o&&overlapXZ(o,p)&&p.max[1]>=o.min[1]-0.5&&p.min[1]<o.min[1]&&supported(p,depth+1));
      const ok=supported(m,0);
      const hung=solids.some(o=>o!==m&&overlapXZ(m,o)&&o.min[1]<=m.max[1]+0.5&&o.max[1]>m.max[1]&&(o.min[1]-groundAt(cx(o),cz(o)).y<=0.6||solids.some(p=>p!==o&&overlapXZ(o,p)&&p.max[1]>=o.min[1]-0.5&&p.min[1]<o.min[1]&&grounded(p))));
      (ok||hung?floating:unsupported).push({kind:k,t:+g.t.toFixed(3),lane:m.lane,gap:+gap.toFixed(1),y:m.min[1],size:[+w(m).toFixed(1),+h(m).toFixed(1),+d(m).toFixed(1)]});
    }
    // solid geometry standing on the road ribbon without a collider
    if(g.kind==='road'&&g.d<HALF-1.8&&h(m)>0.3&&m.min[1]<g.y+2.5&&m.max[1]>g.y+0.6){
      const hasCollider=A.collisionBodies.some(b=>Math.hypot(b.x-cx(m),b.z-cz(m))<b.radius+Math.max(w(m),d(m))/2+0.5);
      if(!hasCollider)roadClip.push({kind:k,t:+g.t.toFixed(3),d:+g.d.toFixed(1),size:[+w(m).toFixed(1),+h(m).toFixed(1),+d(m).toFixed(1)]});
    }
  }
  const chokeHalfAt=t=>{for(const c of A.level.chokes||[])if(t>=c.from&&t<=c.to)return c.half;return HALF};const wedgeRisk=A.collisionBodies.filter(b=>Math.abs(b.lane)+b.radius+1.55>chokeHalfAt(b.t)-1.65&&Math.abs(b.lane)<chokeHalfAt(b.t)).map(b=>({label:b.label,t:+b.t.toFixed(3),lane:b.lane,limit:+(chokeHalfAt(b.t)-1.65).toFixed(2)}));
  const colliderNoMesh=A.collisionBodies.filter(b=>!solids.some(m=>Math.hypot(b.x-cx(m),b.z-cz(m))<b.radius+Math.max(w(m),d(m))/2+0.5)).map(b=>({label:b.label,t:+b.t.toFixed(3),lane:b.lane}));
  const group=list=>{const g=new Map();for(const e of list){const a=g.get(e.kind)||{kind:e.kind,count:0,first:[]};a.count++;if(a.first.length<3)a.first.push(e);g.set(e.kind,a)}return [...g.values()].sort((a,b)=>b.count-a.count)};
  return{level:A.level.id,meshes:M.length,solids:solids.length,kinds:kinds.size,vocab:[...kinds.entries()].map(([k,n])=>({kind:k,n})),unsupported:group(unsupported),floatingSupported:group(floating).length,buried:group(buried),roadClip:group(roadClip),colliderNoMesh,wedgeRisk,colliders:A.collisionBodies.length};
}
// Contact sheet: 8 chase-cam stations at t=k/8 plus optional extra t's; draws into a 2D canvas overlay.
export function contactSheet(extra=[]){
  const stations=[...Array.from({length:8},(_,k)=>k/8),...extra];
  const r=A.renderer(),src=r.domElement,W=src.width,H=src.height,cols=4,rows=Math.ceil(stations.length/cols),cw=Math.round(W/2),ch=Math.round(H/2);
  const sheet=document.createElement('canvas');sheet.width=cw*cols;sheet.height=ch*rows;const ctx=sheet.getContext('2d');
  const cam=A.camera,p=A.player;
  stations.forEach((t,i)=>{
    const pos=A.at(t),yaw=A.yaw(t);p.position.copy(pos);p.position.y=pos.y;p.rotation.y=yaw;
    cam.position.set(pos.x-Math.sin(yaw)*11,pos.y+5.3,pos.z-Math.cos(yaw)*11);
    const look=A.at(t+.004);cam.lookAt(look.x,look.y+1.6,look.z);
    A.render();ctx.drawImage(src,0,0,W,H,(i%cols)*cw,Math.floor(i/cols)*ch,cw,ch);
    ctx.fillStyle='#0009';ctx.fillRect((i%cols)*cw,Math.floor(i/cols)*ch,150,22);ctx.fillStyle='#fff';ctx.font='14px monospace';ctx.fillText(`${A.level.id} t=${t.toFixed(3)}`,(i%cols)*cw+6,Math.floor(i/cols)*ch+16);
  });
  let img=document.getElementById('auditSheet');if(!img){img=document.createElement('img');img.id='auditSheet';img.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;z-index:9998';document.body.appendChild(img)}
  img.src=sheet.toDataURL('image/jpeg',.8);if(q.get('post')!=='0')fetch('/shot?name=sheet-'+A.level.id,{method:'POST',headers:{'Content-Type':'text/plain'},body:img.src}).catch(()=>{});return sheet;
}
async function post(name,data){if(q.get('post')==='0')return;try{await fetch('/report?name='+encodeURIComponent(name),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})}catch(e){console.warn('post failed',e)}}
(async()=>{
  window.__audit={analyse,contactSheet,meshes:M};
  await new Promise(r=>setTimeout(r,600));
  const rep=analyse();window.__auditResult=rep;
  const worst=rep.unsupported.slice(0,2).map(g=>g.first[0].t);
  if(q.get('sheet')==='1'){for(const id of ['menu','brief'])document.getElementById(id)?.classList.add('hidden');contactSheet(worst)}
  const el=document.createElement('pre');el.id='auditReport';el.style.cssText='position:fixed;right:8px;top:8px;z-index:9999;background:#000c;color:#fd9;font:11px/1.4 monospace;padding:8px;max-height:90vh;overflow:auto;max-width:48vw';
  el.textContent=`${rep.level}: ${rep.solids} solids, ${rep.kinds} kinds, ${rep.colliders} colliders\nUNSUPPORTED ${rep.unsupported.reduce((a,b)=>a+b.count,0)} | buried ${rep.buried.reduce((a,b)=>a+b.count,0)} | roadClip ${rep.roadClip.reduce((a,b)=>a+b.count,0)} | colliderNoMesh ${rep.colliderNoMesh.length}\n | wedgeRisk ${rep.wedgeRisk.length}`+rep.unsupported.slice(0,12).map(g=>`${g.count}x ${g.kind} @t=${g.first.map(f=>f.t).join(',')} gap ${g.first[0].gap}`).join('\n');
  document.body.appendChild(el);
  await post(`audit-${rep.level}`,rep);window.__auditDone=true;
  if(q.get('chain')==='1'){const ids=A.circuits.map(c=>c.id),i=ids.indexOf(A.level.id);if(i<ids.length-1){const u=new URL(location.href);u.searchParams.set('level',ids[i+1]);setTimeout(()=>location.href=u.toString(),400)}else{window.__chainDone=true;document.title='AUDIT CHAIN DONE'}}
})();
