// NEON BREACH test bot. Loaded by ?bot=<profile|all>[&laps=N][&difficulty=casual|normal|expert][&post=0][&tag=name].
// Drives the sim through window.__nb (dev seam in game.js). Never touches game state except via botInput.
const NB=window.__nb,A=NB.api,q=new URLSearchParams(location.search);
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const PROFILES={
  clean:{lookS:.55,gain:3.2,damp:.12,laneGain:1,brakeLook:.05,margin:.92,drift:false,boost:false},
  drifter:{lookS:.55,gain:3.2,damp:.12,laneGain:1,brakeLook:.05,margin:.92,drift:true,driftBend:.11,boost:true},
  drifternb:{lookS:.55,gain:3.2,damp:.12,laneGain:1,brakeLook:.05,margin:.92,drift:true,driftBend:.11,boost:false},
  wallrider:{lookS:.22,gain:2.2,damp:0,laneGain:0,brakeLook:0,margin:9,drift:false,boost:false},
  idle:{lookS:.55,gain:3.2,damp:.12,laneGain:1,brakeLook:0,margin:9,drift:false,boost:false,idleAfter:3},
  risky:{lookS:.5,gain:3.2,damp:.12,laneGain:1,brakeLook:.05,margin:.95,drift:true,driftBend:.1,boost:true,takeRisks:true}
};
// Max speed the car can hold through radius R given steer authority (heading rate = (1.72-.009v)*grip term).
function safeSpeed(R,level){const g=(1.06+(1-level.grip)*.25),k=.009;return Math.max(12,(1.72*g*R)/(1+k*g*R))}
function bendRadius(t){const b=A.curvature(t);return b<1e-4?1e6:(.016*A.LENGTH)/b}
export function driverInput(profile,s,level){
  const P=PROFILES[profile],inp=NB.input;inp.active=true;
  if(P.idleAfter!==undefined&&s.time>P.idleAfter){inp.steer=0;inp.throttle=1;inp.brake=0;inp.drift=false;inp.boost=false;return}
  // Pure pursuit on the centreline point ahead (distance scales with speed), plus yaw-rate damping.
  const lookDist=Math.max(14,Math.min(48,s.speed*P.lookS));let tgt;const entry=P.takeRisks&&!s.onRisk&&A.riskRoutes.find(r=>s.t>=r.from-.012&&s.t<=r.from+.012);if(s.onRisk){const r=A.riskRoutes.find(x=>x.label===s.onRisk);tgt=A.riskAt(r,s.riskU+lookDist/r.length)}else if(entry)tgt=A.riskAt(entry,.14);else tgt=A.at(s.t+lookDist/A.LENGTH,P.laneGain?0:s.lane*.6);const want=Math.atan2(tgt.x-s.x,tgt.z-s.z);
  const err=angle(want-s.heading),yawRate=angle(s.heading-(inp._h??s.heading))*60;inp._h=s.heading;
  inp.steer=Math.max(-1,Math.min(1,err*P.gain-yawRate*P.damp));
  let minR=1e6;if(P.brakeLook){for(let u=.004;u<=P.brakeLook;u+=.004)minR=Math.min(minR,bendRadius(s.t+u))}
  const vSafe=P.brakeLook?safeSpeed(minR,level)*P.margin:1e6;
  const over=s.speed>vSafe;inp.brake=over?1:0;inp.throttle=over?0:1;
  const bendNow=A.curvature(s.t+.02);
  inp.drift=!!(P.drift&&bendNow>P.driftBend&&s.speed>22);
  inp.boost=!!(P.boost&&bendNow<.05&&s.boostCharge>25&&!s.isDrifting);
  inp.handbrake=false;
}
function lapStats(){return{frames:0,vMin:1e9,vSum:0,vMax:0,atCap:0,braking:0,drifting:0,offTrack:0,backwards:0}}
function gapSeconds(s,toLeader){const all=[s.progress,...s.ai.map(v=>v-1)].sort((a,b)=>b-a);const mine=s.progress;const ref=toLeader?all[0]:(all[0]===mine?all[1]:all[0]);return +(((ref-mine)*A.LENGTH)/Math.max(20,s.speed)).toFixed(1)}
export async function runCell(profile,laps=7,difficulty='normal'){
  const level=A.level,top=level.topSpeed;NB.fast=true;
  A.settings.aiRubber=q.get('rubber')!=='0';
  let s=NB.start({difficulty,skipCountdown:true});
  const report={profile,level:level.id,difficulty,laps:[],rivalLaps:[[],[],[]],violations:[],finish:null,totalFrames:0};
  const rivalLapStart=[0,0,0],rivalLapIdx=[0,0,0];
  let L=lapStats(),lapNo=0,lapT0=0,lastProgress=s.progress,lastAi=s.ai.slice(),prevContacts=0,frames=0;
  const maxFrames=laps*60*140,clock0=performance.now();
  while(s.state==='race'&&frames<maxFrames){
    driverInput(profile,s,level);
    NB.tick(clock0+frames*1000/60);
    s=NB.snap();frames++;
    if(![s.t,s.speed,s.heading,s.progress,s.x,s.z].every(Number.isFinite)){report.violations.push({frame:frames,kind:'NaN',s:{t:s.t,speed:s.speed,heading:s.heading,progress:s.progress}});break}
    for(const b of A.collisionBodies){if(Math.hypot(b.x-s.x,b.z-s.z)<b.radius-.4){report.violations.push({frame:frames,kind:'inside-collider',label:b.label,t:+s.t.toFixed(3)});break}}
    if(!s.onRisk&&s.d>A.TRACK_HALF_WIDTH+.5)report.violations.push({frame:frames,kind:'outside-road',d:+s.d.toFixed(2),t:+s.t.toFixed(3)});
    for(let i=0;i<3;i++){
      if(s.ai[i]<lastAi[i]-1e-9)report.violations.push({frame:frames,kind:'rival-backwards',i,t:+s.t.toFixed(3)});
      const lapIdx=Math.floor(s.ai[i]-1);
      if(lapIdx>rivalLapIdx[i]&&lapIdx>=1){report.rivalLaps[i].push(+(s.time-rivalLapStart[i]).toFixed(2));rivalLapStart[i]=s.time;rivalLapIdx[i]=lapIdx}
    }
    lastAi=s.ai.slice();
    if(s.progress<lastProgress-1e-6)L.backwards++;lastProgress=s.progress;
    if(report.violations.length>50)break;
    L.frames++;L.vMin=Math.min(L.vMin,s.speed);L.vMax=Math.max(L.vMax,s.speed);L.vSum+=s.speed;
    if(s.speed>=top*.97)L.atCap++;if(s.brake)L.braking++;if(s.isDrifting)L.drifting++;if(s.offTrack)L.offTrack++;
    const lapNow=Math.floor(Math.max(0,s.progress));
    if(lapNow>lapNo||s.state!=='race'){
      const lapTime=s.laps[lapNo]??(s.time-lapT0);
      report.laps.push({lap:lapNo+1,time:+lapTime.toFixed(2),vMin:+L.vMin.toFixed(1),vAvg:+(L.vSum/Math.max(1,L.frames)).toFixed(1),vMax:+L.vMax.toFixed(1),capPct:+(100*L.atCap/Math.max(1,L.frames)).toFixed(0),brakeS:+(L.braking/60).toFixed(1),driftS:+(L.drifting/60).toFixed(1),offTrackS:+(L.offTrack/60).toFixed(1),contacts:s.stats.contacts-prevContacts,backwards:L.backwards,score:s.totalScore+Math.round(s.chainScore),boosts:s.stats.boostsUsed,place:s.place,gapToLeaderS:gapSeconds(s,true),gapToP2S:gapSeconds(s,false)});
      prevContacts=s.stats.contacts;lapNo=lapNow;lapT0=s.time;L=lapStats();
      if(lapNo>=laps&&s.state==='race')break;
    }
    if(frames%3000===0)await new Promise(r=>setTimeout(r,0));
  }
  report.totalFrames=frames;
  report.finish={state:s.state,place:s.place,time:+s.time.toFixed(2),score:s.totalScore,contacts:s.stats.contacts,risks:s.stats.risks||0,jumps:s.stats.jumps||0,ai:s.ai.map(v=>+v.toFixed(3)),progress:+s.progress.toFixed(3)};
  NB.input.active=false;NB.fast=false;A.updateHud();
  return report;
}
export async function runCellRaces(profile,laps,difficulty){
  const races=Math.max(1,Math.ceil(laps/3));let merged=null;
  for(let r=0;r<races;r++){const c=await runCell(profile,3,difficulty);if(!merged){merged=c;merged.races=[c.finish]}else{merged.laps.push(...c.laps.map(l=>({...l,lap:l.lap+r*3})));merged.rivalLaps.forEach((a,i)=>a.push(...c.rivalLaps[i]));merged.violations.push(...c.violations);merged.races.push(c.finish);merged.totalFrames+=c.totalFrames}}
  return merged;
}
export async function runMatrix(profiles,laps,difficulty){
  const out={level:A.level.id,difficulty,laps,when:new Date().toISOString(),cells:{}};
  for(const p of profiles){out.cells[p]=await runCellRaces(p,laps,difficulty);console.log('[bot]',A.level.id,p,'done',JSON.stringify(out.cells[p].finish))}
  return out;
}
export function summarize(m){
  const rows=[];
  for(const [p,c] of Object.entries(m.cells)){
    const l=c.laps;if(!l.length){rows.push(p+' no laps '+JSON.stringify(c.violations[0]||c.finish));continue}
    const avg=k=>l.reduce((a,b)=>a+b[k],0)/l.length,best=Math.min(...l.map(x=>x.time)),rl=c.rivalLaps.flat();
    const places=(c.races||[c.finish]).map(f=>'P'+f.place).join('');
    rows.push(`${p.padEnd(9)} best ${best.toFixed(1)}s avg ${avg('time').toFixed(1)}s cap ${avg('capPct').toFixed(0)}% brake ${avg('brakeS').toFixed(1)}s drift ${avg('driftS').toFixed(1)}s contacts ${avg('contacts').toFixed(1)}/lap ${places} gapP2 ${l.at(-1).gapToP2S}s rivals ${rl.length?(rl.reduce((a,b)=>a+b,0)/rl.length).toFixed(1):'-'}s viol ${c.violations.length}`);
  }
  return rows.join('\n');
}
async function post(name,data){if(q.get('post')==='0')return;try{await fetch('/report?name='+encodeURIComponent(name),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})}catch(e){console.warn('report post failed',e)}}
(async()=>{
  window.__bot={runCell,runMatrix,PROFILES,driverInput,summarize};
  const what=q.get('bot');if(!what||what==='manual')return;
  const laps=+(q.get('laps')||7),difficulty=q.get('difficulty')||'normal';
  const profiles=what==='all'?Object.keys(PROFILES):what.split(',');
  await new Promise(r=>setTimeout(r,800));
  const m=await runMatrix(profiles,laps,difficulty);m.summary=summarize(m);
  window.__botResult=m;
  const el=document.createElement('pre');el.id='botReport';el.style.cssText='position:fixed;left:8px;bottom:8px;z-index:9999;background:#000c;color:#9ff;font:11px/1.4 monospace;padding:8px;white-space:pre;max-width:95vw;overflow:auto';
  el.textContent=`${m.level} ${difficulty} ${laps} laps\n`+m.summary;document.body.appendChild(el);
  await post(`${q.get('tag')||'run'}-${m.level}-${difficulty}`,m);
  window.__botDone=true;
  if(q.get('chain')==='1'){const ids=A.circuits.map(c=>c.id),i=ids.indexOf(A.level.id);if(i>=0&&i<ids.length-1){const u=new URL(location.href);u.searchParams.set('level',ids[i+1]);location.href=u.toString()}else{document.title='BOT CHAIN DONE';window.__chainDone=true}}
})();
