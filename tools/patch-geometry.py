# Axis 1: route geometry primitives (jumps, banks, chokes, risk routes) in track/game/world + per-circuit authoring in levels.
import io,sys,re
sys.stdout=io.TextIOWrapper(sys.stdout.buffer,encoding='utf-8')
def patch(path,pairs):
    s=open(path,encoding='utf-8').read()
    for old,new in pairs:
        assert s.count(old)==1,(path,old[:90])
        s=s.replace(old,new)
    open(path,'w',encoding='utf-8',newline='\n').write(s);print('patched',path,len(pairs))

# ---------------- track.js ----------------
track_add=("\n// Route geometry: risk routes (side lines authored as lane/height offsets from the main line), chokes, banks, jumps.\n"
"export const riskRoutes=(level.risks||[]).map(r=>{const pts=[];const n=Math.max(8,Math.round((r.to-r.from)*LENGTH/30));for(let i=0;i<=n;i++){const u=i/n,tt=r.from+(r.to-r.from)*u,blend=Math.min(1,u/.22,(1-u)/.22),p=at(tt,r.lane*blend);p.y+=(r.dy||0)*blend;pts.push(p)}const curve=new THREE.CatmullRomCurve3(pts,false,'centripetal');const S=Array.from({length:161},(_,i)=>curve.getPointAt(i/160));return{...r,curve,samples:S,length:curve.getLength()}});\n"
"export function riskNearest(r,p){let best=Infinity,index=0;for(let i=0;i<r.samples.length;i++){const v=r.samples[i],d=(v.x-p.x)**2+(v.z-p.z)**2;if(d<best){best=d;index=i}}return{u:index/(r.samples.length-1),d:Math.sqrt(best)}}\n"
"export function riskAt(r,u){return r.curve.getPointAt(Math.max(0,Math.min(1,u)))}\n"
"export function riskYaw(r,u){const v=r.curve.getTangentAt(Math.max(0,Math.min(1,u)));return Math.atan2(v.x,v.z)}\n"
"export const clearSamples=[...samples,...riskRoutes.flatMap(r=>r.samples)];\n"
"export const chokes=level.chokes||[],banks=level.banks||[],jumps=level.jumps||[];\n"
"export function bankRoll(u){u=wrap(u);for(const b of banks){if(u>=b.from&&u<=b.to){const e=Math.min(1,(u-b.from)/.012,(b.to-u)/.012);return b.roll*e}}return 0}\n"
"export function chokeHalf(u){u=wrap(u);for(const c of chokes)if(u>=c.from&&u<=c.to)return c.half;return TRACK_HALF_WIDTH}\n")
s=open('track.js',encoding='utf-8').read()
if 'riskRoutes' not in s:
    s=s.rstrip('\n')+'\n'+track_add;open('track.js','w',encoding='utf-8',newline='\n').write(s);print('track.js extended')

# ---------------- game.js ----------------
patch('game.js',[
 ("import {at,yaw,angle,curvature,nearest,advance,wrap,LENGTH,samples,district,districts,driftZones,circularDistance,TRACK_HALF_WIDTH} from './track.js';",
  "import {at,yaw,angle,curvature,nearest,advance,wrap,LENGTH,samples,district,districts,driftZones,circularDistance,TRACK_HALF_WIDTH,riskRoutes,riskNearest,riskAt,riskYaw,bankRoll,chokeHalf,jumps} from './track.js';"),
 ("aiMistake=[0,0,0],aiCooldown=[6,9,12],aiSeed=7,heat=0,iced=false,",
  "aiMistake=[0,0,0],aiCooldown=[6,9,12],aiSeed=7,heat=0,iced=false,onRisk=null,riskU=0,airborne=false,vy=0,airY=0,jumpArmed=true,"),
 ("aiMistake=[0,0,0];aiCooldown=[6,9,12];aiSeed=7;heat=0;iced=false;",
  "aiMistake=[0,0,0];aiCooldown=[6,9,12];aiSeed=7;heat=0;iced=false;onRisk=null;riskU=0;airborne=false;vy=0;jumpArmed=true;"),
 ("const driftNow=!!(driftButton&&Math.abs(steer)>.12&&speed>16),",
  "const driftNow=!!(driftButton&&Math.abs(steer)>.12&&speed>16&&!airborne),"),
 ("const surfaceGrip=level.grip*(flooded?.68:1)*(iced?.62:1)*(overheated?.8:1),",
  "const surfaceGrip=level.grip*(flooded?.68:1)*(iced?.62:1)*(overheated?.8:1)*(bankRoll(t)?1.25:1)*(onRisk?.grip||1),"),
 ("heading+=steer*steerRate*dt*Math.min(speed/8,1);",
  "if(!airborne)heading+=steer*steerRate*dt*Math.min(speed/8,1);"),
 ("chainScore+=speed*driftAngle*13*combo*(countersteering?1.12:1)*dt;",
  "chainScore+=speed*driftAngle*13*combo*(countersteering?1.12:1)*(onRisk?onRisk.mult:1)*dt;"),
 # risk routes + choke wall limit
 ("const near=nearest(player.position,t),wallLimit=TRACK_HALF_WIDTH-1.65;offTrack=near.d>TRACK_HALF_WIDTH-3.8;if(near.d>wallLimit){",
  "const near=nearest(player.position,t),wallLimit=chokeHalf(t)-1.65;"
  "{let cand=null,cn=null;const lt=wrap(t);for(const r of riskRoutes){if(lt<r.from-.03||lt>r.to+.03)continue;const rn=riskNearest(r,player.position);if(onRisk===r){if(rn.d>r.half+1.5||rn.u>.985){onRisk=null;toast('BACK ON THE LINE')}else{cand=r;cn=rn}}else if(rn.d<r.half-1&&near.d>7&&rn.u>.03&&rn.u<.9){cand=r;cn=rn}}"
  "if(cand&&onRisk!==cand){onRisk=cand;stats.risks=(stats.risks||0)+1;toast(cand.label+' · DRIFT ×'+cand.mult.toFixed(1));beep(700,.1)}"
  "if(onRisk&&cn){riskU=cn.u;const p=riskAt(onRisk,riskU),lim=onRisk.half-1.4;if(cn.d>lim){const dx=player.position.x-p.x,dz=player.position.z-p.z,d=Math.hypot(dx,dz);player.position.x=p.x+dx/d*lim;player.position.z=p.z+dz/d*lim;speed*=Math.exp(-2.2*dt);const rh=riskYaw(onRisk,riskU);if(Math.abs(angle(rh-heading))<1.7){heading+=angle(rh-heading)*dt*2;velocityHeading=heading}if(lastHit<=0){speed*=.82;impact();beep(60,.1);shake=.25;lastHit=.35;juice('impact');rumble(.7,140);loseChain('WALL HIT · CHAIN LOST')}cleanTime=0}else cleanTime+=dt}}"
  "offTrack=!onRisk&&near.d>TRACK_HALF_WIDTH-3.8;if(!onRisk&&near.d>wallLimit){"),
 ("cleanTime=0}else cleanTime+=dt;","cleanTime=0}else if(!onRisk)cleanTime+=dt;"),
 ("if(isDrifting&&near.d>TRACK_HALF_WIDTH-4.5&&near.d<wallLimit-.3&&riskCooldown<=0){","if(!onRisk&&isDrifting&&near.d>wallLimit-2.85&&near.d<wallLimit-.3&&riskCooldown<=0){"),
 # progress, road height, jumps, banking
 ("progress+=advance(t,near.t);t=near.t;player.position.y=at(t).y;player.rotation.y=heading;player.userData.body.rotation.x=THREE.MathUtils.lerp(player.userData.body.rotation.x,curveSlope(t),dt*9);player.userData.body.rotation.z=THREE.MathUtils.lerp(player.userData.body.rotation.z,-steer*speed*.0018,dt*8);",
  "let roadY;if(onRisk){const te=onRisk.from+(onRisk.to-onRisk.from)*riskU;progress+=advance(t,te);t=te;roadY=riskAt(onRisk,riskU).y}else{progress+=advance(t,near.t);t=near.t;roadY=at(t).y+signedLane(player.position,t)*Math.tan(bankRoll(t))}"
  "{const lt=wrap(t);if(!airborne&&jumpArmed){for(const j of jumps){if(lt>=j.t&&lt<=j.t+j.len&&speed>30){airborne=true;vy=speed*(j.angle||.2);airY=roadY;jumpArmed=false;stats.jumps=(stats.jumps||0)+1;toast('AIR');beep(880,.12);rumble(.3,80);break}}}"
  "if(!jumpArmed&&!jumps.some(j=>lt>=j.t-.01&&lt<=j.t+j.len+.03))jumpArmed=true;"
  "if(airborne){airY+=vy*dt;vy-=24*dt;if(airY<=roadY){airborne=false;player.position.y=roadY;shake=.22;emit(settings.reducedMotion?0:8,level.edgeB);rumble(.4,90);if(isDrifting){chainScore+=150;toast('DRIFT LANDING +150')}}else player.position.y=airY}else player.position.y=roadY}"
  "player.rotation.y=heading;player.userData.body.rotation.x=THREE.MathUtils.lerp(player.userData.body.rotation.x,airborne?-vy*.025:curveSlope(t),dt*9);player.userData.body.rotation.z=THREE.MathUtils.lerp(player.userData.body.rotation.z,-steer*speed*.0018+(onRisk?0:bankRoll(t)),dt*8);"),
 # rivals follow the bank
 ("alignCar(rivals[i],ai[i],aiLanes[i]);const aiTurn=","alignCar(rivals[i],ai[i],aiLanes[i]);rivals[i].position.y+=aiLanes[i]*Math.tan(bankRoll(ai[i]));const aiTurn="),
 # snapshot
 ("isDrifting,isBoosting,offTrack,heat,iced,brake:brakeActive,","isDrifting,isBoosting,offTrack,heat,iced,onRisk:onRisk?onRisk.label:null,airborne,brake:brakeActive,"),
])

# ---------------- world.js ----------------
s=open('world.js',encoding='utf-8').read()
assert s.count("from './track.js';")==1
s=re.sub(r"import \{([^}]*)\} from './track.js';",lambda m:"import {"+m.group(1)+",riskRoutes,riskAt,riskYaw,bankRoll,chokes,jumps,clearSamples} from './track.js';",s,count=1)
s=s.replace('samples.some(','clearSamples.some(')
open('world.js','w',encoding='utf-8',newline='\n').write(s)
geom=(
"// Risk routes, ramps, chokes and banked ribbons.\n"
"function riskRibbon(r,width,m,raise=0,mark=true){const vertices=[],indices=[],S=r.samples;for(let i=0;i<S.length;i++){const p=S[i],q=S[Math.min(S.length-1,i+1)],o=S[Math.max(0,i-1)],vx=q.x-o.x,vz=q.z-o.z,n=Math.hypot(vx,vz)||1,rx=vz/n,rz=-vx/n;for(const side of [-1,1])vertices.push(p.x+rx*side*width/2,p.y+raise,p.z+rz*side*width/2);if(i<S.length-1){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const mesh=new THREE.Mesh(g,m);mesh.userData.road=mark;scene.add(mesh);return mesh}\n"
"for(const r of riskRoutes){const wet=r.grip&&r.grip<1;riskRibbon(r,r.half*2+2,material(wet?0x0d1c2a:level.road),-.02);riskRibbon(r,r.half*2,wet?new THREE.MeshStandardMaterial({color:0x0b2230,emissive:0x0e3a4a,emissiveIntensity:.2,roughness:.1,metalness:.3}):wetRoad,.02);"
"for(const side of [-1,1]){const S=r.samples;for(let i=2;i<S.length-2;i+=4){const p=S[i],q=S[i+1],vx=q.x-p.x,vz=q.z-p.z,n=Math.hypot(vx,vz)||1,rx=vz/n,rz=-vx/n;const w=box(.5,1.6,3.2,p.x+rx*side*(r.half+.6),p.y+.8,p.z+rz*side*(r.half+.6),side>0?cyan:pink);w.rotation.y=Math.atan2(vx,vz);w.userData.road=true}}"
"if((r.dy||0)>2){const S=r.samples;for(let i=8;i<S.length-8;i+=10){const p=S[i],base=at(r.from+(r.to-r.from)*i/(S.length-1)).y-.1;box(1.8,p.y-base,1.8,p.x,(p.y+base)/2,p.z,dark);box(r.half*2+2,.9,2.2,p.x,p.y-.45,p.z,material(0x1a2338))}}}\n"
"for(const j of jumps){const len=j.len*LENGTH,g=onTrack(j.t+j.len/2),a=j.angle||.2,ramp=box(TRACK_HALF_WIDTH*2-4,.6,len,0,Math.sin(a)*len/2+.15,0,material(level.id==='solara'?0x7a4a36:0x22304a),g);ramp.rotation.x=-a;ramp.userData.road=true;const lip=box(TRACK_HALF_WIDTH*2-4,.2,.8,0,Math.sin(a)*len+.3,len/2,amber,g);lip.userData.road=true;for(const side of [-1,1]){const s=box(.4,3,.4,side*(TRACK_HALF_WIDTH+.8),1.5,-len/2-4,dark,g);box(.9,.5,.9,side*(TRACK_HALF_WIDTH+.8),3.2,-len/2-4,amber,g)}}\n"
"for(const c of chokes){const n=Math.max(2,Math.round((c.to-c.from)*LENGTH/12));for(let i=0;i<=n;i++){const t=c.from+(c.to-c.from)*i/n,g=onTrack(t);for(const side of [-1,1]){const w=box(1,2.4,12.2,side*(c.half+.5),1.2,0,dark,g);w.userData.road=true;const l=box(.2,.25,12.2,side*(c.half-.05),2.3,0,i%2?cyan:pink,g);l.userData.road=true}if(c.roof){box(c.half*2+6,1.4,12.4,0,7.6,0,material(0x161a26),g);for(const side of [-1,1])box(1.6,7,1.6,side*(c.half+2),3.5,0,dark,g)}}}\n")
patch('world.js',[
 ("const movers=[];\n","const movers=[];\n"+geom),
 # banked ribbons: road, edges, verge, skirt, rails
 ("function roadMesh(offset,width,m,raise=0){const vertices=[],indices=[];for(let i=0;i<=N;i++){for(const side of [-1,1]){const p=at(i/N,offset+side*width/2);vertices.push(p.x,p.y+raise,p.z)}",
  "function roadMesh(offset,width,m,raise=0){const vertices=[],indices=[];for(let i=0;i<=N;i++){for(const side of [-1,1]){const lane=offset+side*width/2,p=at(i/N,lane);vertices.push(p.x,p.y+raise+lane*Math.tan(bankRoll(i/N)),p.z)}"),
 ("function skirtMesh(lane,m){const vertices=[],indices=[];for(let i=0;i<=N;i++){const p=at(i/N,lane);vertices.push(p.x,p.y-.08,p.z,p.x,-4.55,p.z);",
  "function skirtMesh(lane,m){const vertices=[],indices=[];for(let i=0;i<=N;i++){const p=at(i/N,lane);vertices.push(p.x,p.y-.08+lane*Math.tan(bankRoll(i/N)),p.z,p.x,-4.55,p.z);"),
 ("function railMesh(lane,y0,y1,m){const vertices=[],indices=[];for(let i=0;i<=N;i++){const p=at(i/N,lane);vertices.push(p.x,p.y+y0,p.z,p.x,p.y+y1,p.z);",
  "function railMesh(lane,y0,y1,m){const vertices=[],indices=[];for(let i=0;i<=N;i++){const p=at(i/N,lane),b=lane*Math.tan(bankRoll(i/N));vertices.push(p.x,p.y+y0+b,p.z,p.x,p.y+y1+b,p.z);"),
 # onTrack groups follow the bank at their lane
 ("t,lane=0){const g=new THREE.Group();g.userData.t=t;g.userData.lane=lane;g.position.copy(at(t,lane));",
  "t,lane=0){const g=new THREE.Group();g.userData.t=t;g.userData.lane=lane;g.position.copy(at(t,lane));g.position.y+=lane*Math.tan(bankRoll(t));"),
])

# ---------------- levels.js authoring ----------------
feat={
 'midnight':"risks:[{label:'SERVICE ALLEY',from:.095,to:.175,lane:-27,half:6.5,mult:1.6}],jumps:[{t:.215,len:.005,angle:.2}],chokes:[{from:.318,to:.432,half:13.6,label:'TUNNEL'}],",
 'floodline':"banks:[{from:.235,to:.29,roll:.14}],chokes:[{from:.43,to:.475,half:11,label:'FLOODGATE'}],risks:[{label:'CANAL BED',from:.545,to:.64,lane:-30,half:7,mult:1.5,grip:.7}],",
 'skyline':"jumps:[{t:.485,len:.006,angle:.24}],risks:[{label:'ROOFTOP LINE',from:.29,to:.39,lane:28,half:6,mult:1.6,dy:12}],chokes:[{from:.4,to:.43,half:10,label:'HELIPAD CHICANE'}],",
 'blackout':"chokes:[{from:.6,to:.665,half:10.5,label:'UNDERPASS',roof:true}],risks:[{label:'SUBSTATION CUT',from:.11,to:.19,lane:34,half:6,mult:1.5}],banks:[{from:.27,to:.33,roll:.13}],",
 'solara':"jumps:[{t:.2,len:.007,angle:.18},{t:.8,len:.007,angle:.18}],risks:[{label:'AQUEDUCT TOP',from:.425,to:.535,lane:24,half:6,mult:1.7,dy:14}],chokes:[{from:.46,to:.5,half:11,label:'CANYON'}],",
 'cryoline':"risks:[{label:'CREVASSE',from:.29,to:.38,lane:-28,half:6.5,mult:1.6,grip:.6}],jumps:[{t:.7,len:.006,angle:.16}],chokes:[{from:.51,to:.62,half:12.5,label:'ICE VAULT'}],",
}
s=open('levels.js',encoding='utf-8').read()
for lid,txt in feat.items():
    anchor="id:'"+lid+"',";assert s.count(anchor)==1,lid
    if 'risks:' in s[s.find(anchor):s.find(anchor)+400]:continue
    s=s.replace(anchor,anchor+txt)
open('levels.js','w',encoding='utf-8',newline='\n').write(s);print('levels authored')
print('geometry axis written')
