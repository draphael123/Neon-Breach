import * as THREE from './three.module.js';
import {circuits} from './levels.js';
import {readFileSync} from 'node:fs';

const failures=[];
for(const level of circuits){
  const curve=new THREE.CatmullRomCurve3(level.control.map(p=>new THREE.Vector3(...p)),true,'centripetal');
  const count=900,samples=Array.from({length:count},(_,i)=>curve.getPointAt(i/count));
  let maxGrade=0,minRemoteSeparation=Infinity;
  for(let i=0;i<count;i++){
    const a=samples[i],b=samples[(i+1)%count],horizontal=Math.hypot(b.x-a.x,b.z-a.z);
    maxGrade=Math.max(maxGrade,Math.abs(b.y-a.y)/Math.max(.01,horizontal));
    for(let j=i+60;j<count-60;j+=6){
      const cyclic=Math.min(j-i,count-(j-i));
      if(cyclic>=60)minRemoteSeparation=Math.min(minRemoteSeparation,a.distanceTo(samples[j]));
    }
  }
  const length=curve.getLength();
  if(length<1500)failures.push(`${level.id}: circuit is too short (${length.toFixed(0)}m)`);
  if(maxGrade>.18)failures.push(`${level.id}: grade exceeds 18% (${(maxGrade*100).toFixed(1)}%)`);
  if(minRemoteSeparation<34)failures.push(`${level.id}: remote track segments approach within ${minRemoteSeparation.toFixed(1)}m`);
  if(level.districts.length!==6)failures.push(`${level.id}: expected six districts`);
  if(level.driftZones.length!==6||level.driftZones.some(v=>v<=0||v>=1))failures.push(`${level.id}: invalid drift zones`);
  console.log(`${level.name.padEnd(18)} ${length.toFixed(0).padStart(4)}m  grade ${(maxGrade*100).toFixed(1).padStart(4)}%  clearance ${minRemoteSeparation.toFixed(1).padStart(5)}m`);
}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}else console.log('All circuit geometry checks passed.');

const gameSource=readFileSync(new URL('./game.js',import.meta.url),'utf8');
const htmlSource=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const referencedIds=[...gameSource.matchAll(/\$\('([^']+)'\)/g)].map(match=>match[1]);
const htmlIds=new Set([...htmlSource.matchAll(/id="([^"]+)"/g)].map(match=>match[1]));
const missingIds=[...new Set(referencedIds.filter(id=>!htmlIds.has(id)))];
if(missingIds.length){console.error(`Missing HTML ids: ${missingIds.join(', ')}`);process.exitCode=1}
else console.log(`All ${new Set(referencedIds).size} game UI references resolve.`);
