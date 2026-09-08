import * as THREE from './three.module.js';
import {circuits} from './levels.js';
import {earnedLicense,licenseTitle} from './progression.js';
import {boostFromBank,spendBoost} from './boost.js';
import {existsSync,readFileSync} from 'node:fs';

const failures=[];
if(new Set(circuits.map(level=>level.id)).size!==circuits.length)failures.push('Circuit ids must be unique');
if(new Set(circuits.map(level=>level.record)).size!==circuits.length)failures.push('Circuit record namespaces must be unique');
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
  if(length<3300)failures.push(`${level.id}: circuit is too short (${length.toFixed(0)}m)`);
  if(maxGrade>.18)failures.push(`${level.id}: grade exceeds 18% (${(maxGrade*100).toFixed(1)}%)`);
  if(minRemoteSeparation<34)failures.push(`${level.id}: remote track segments approach within ${minRemoteSeparation.toFixed(1)}m`);
  if(level.districts.length!==6)failures.push(`${level.id}: expected six districts`);
  if(level.driftZones.length!==6||level.driftZones.some(v=>v<=0||v>=1))failures.push(`${level.id}: invalid drift zones`);
  if(level.rankBands.length!==3||level.rankBands.some((v,i,a)=>v<=0||i&&v<=a[i-1]))failures.push(`${level.id}: invalid rank bands`);
  if(level.grip<.65||level.grip>1.1)failures.push(`${level.id}: grip tune is outside the supported range`);
  if(level.topSpeed<=54*level.pace+5)failures.push(`${level.id}: expert rival pace leaves insufficient player headroom`);
  console.log(`${level.name.padEnd(18)} ${length.toFixed(0).padStart(4)}m  grade ${(maxGrade*100).toFixed(1).padStart(4)}%  clearance ${minRemoteSeparation.toFixed(1).padStart(5)}m`);
}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}else console.log('All circuit geometry checks passed.');

const gameSource=readFileSync(new URL('./game.js',import.meta.url),'utf8');
const htmlSource=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const worldSource=readFileSync(new URL('./world.js',import.meta.url),'utf8');
const referencedIds=[...gameSource.matchAll(/\$\('([^']+)'\)/g)].map(match=>match[1]);
const htmlIds=new Set([...htmlSource.matchAll(/id="([^"]+)"/g)].map(match=>match[1]));
const dynamicSettingIds=['volume','musicVolume','quality','difficulty','effects','ghosts','touch','reducedMotion'];
const missingIds=[...new Set([...referencedIds,...dynamicSettingIds].filter(id=>!htmlIds.has(id)))];
if(missingIds.length){console.error(`Missing HTML ids: ${missingIds.join(', ')}`);process.exitCode=1}
else console.log(`All ${new Set(referencedIds).size} game UI references resolve.`);

const artworkPaths=[...new Set([...worldSource.matchAll(/['"](\.\/assets\/[^'"]+)['"]/g)].map(match=>match[1]))];
const missingArtwork=artworkPaths.filter(path=>!existsSync(new URL(path,import.meta.url)));
if(missingArtwork.length){console.error(`Missing artwork assets: ${missingArtwork.join(', ')}`);process.exitCode=1}
else console.log(`All ${artworkPaths.length} local artwork assets resolve.`);

const licenseCases=[['C',4,1],['B',4,1],['B',3,2],['A',2,2],['A',1,3],['S',4,3]];
for(const [rank,place,expected] of licenseCases)if(earnedLicense(rank,place)!==expected){console.error(`License rule failed for rank ${rank}, place ${place}`);process.exitCode=1}
if(licenseTitle([3,3,3,3,3,3])!=='BREACH MASTER'||licenseTitle([1,0,2,0,0,0])!=='2/6 CLASSIFIED'){console.error('License summary rule failed');process.exitCode=1}
else console.log('All circuit license rules passed.');

if(boostFromBank(0)!==0||boostFromBank(10000)!==32||spendBoost(15,1)!==0||spendBoost(50,.5)!==42.5){console.error('Drift-to-boost economy rules failed');process.exitCode=1}
else console.log('Drift-to-boost economy rules passed.');
