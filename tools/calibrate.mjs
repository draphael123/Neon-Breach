// node tools/calibrate.mjs <tag> [margin=1.035]
// Reads tools/reports/<tag>-<level>-normal.json (a `clean` cell run with rubber=0) and rewrites each circuit's aiPace/refLap in levels.js
// so that the rivals' lap equals the clean bot's lap × margin at normal difficulty.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import * as THREE from '../three.module.js';
import {circuits} from '../levels.js';
const tag=process.argv[2]||'cal',margin=+(process.argv[3]||1.035);
let s=readFileSync('levels.js','utf8');
for(const c of circuits){
  const file=`tools/reports/${tag}-${c.id}-normal.json`;
  if(!existsSync(file)){console.log(c.id.padEnd(9),'no report, skipped');continue}
  const m=JSON.parse(readFileSync(file,'utf8')),cl=m.cells.clean.laps,ref=cl.reduce((a,b)=>a+b.time,0)/cl.length,rl=m.cells.clean.rivalLaps.flat(),rlap=rl.reduce((a,b)=>a+b,0)/rl.length;
  const curve=new THREE.CatmullRomCurve3(c.control.map(p=>new THREE.Vector3(...p)),true,'centripetal'),L=curve.getLength();
  const aiPace=+((c.aiPace||48)+L/(ref*margin)-L/rlap).toFixed(2);
  const re=new RegExp(`(id:'${c.id}',)(?:aiPace:[\\d.]+,refLap:[\\d.]+,)?`);
  if(!re.test(s))throw new Error('anchor missing for '+c.id);
  s=s.replace(re,`$1aiPace:${aiPace},refLap:${ref.toFixed(1)},`);
  console.log(c.id.padEnd(9),'clean',ref.toFixed(1),'rivals',rlap.toFixed(1),'->',aiPace,'target',(ref*margin).toFixed(1));
}
writeFileSync('levels.js',s);console.log('levels.js updated');
