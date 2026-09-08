import * as THREE from './three.module.js';
import {level} from './levels.js';
export const wrap=t=>((t%1)+1)%1;
export const HALF_WIDTH=13;
const control=level.control;
export const curve=new THREE.CatmullRomCurve3(control.map(p=>new THREE.Vector3(...p)),true,'centripetal');
export const LENGTH=curve.getLength(),N=1200;
export const samples=Array.from({length:N},(_,i)=>curve.getPointAt(i/N));
export function at(t,lane=0){t=wrap(t);const p=curve.getPointAt(t),v=curve.getTangentAt(t);const n=Math.hypot(v.x,v.z);p.x+=v.z/n*lane;p.z-=v.x/n*lane;return p}
export function yaw(t){const v=curve.getTangentAt(wrap(t));return Math.atan2(v.x,v.z)}
export function angle(a){return Math.atan2(Math.sin(a),Math.cos(a))}
export function curvature(t){return Math.abs(angle(yaw(t+.008)-yaw(t-.008)))}
export function nearest(p,reference){let best=Infinity,index=0;const center=Math.round(wrap(reference??0)*N);const radius=reference===undefined?N:65;for(let j=reference===undefined?0:-radius;j<(reference===undefined?N:radius+1);j++){const i=reference===undefined?j:(center+j+N)%N;const v=samples[i];const d=(v.x-p.x)**2+(v.z-p.z)**2;if(d<best){best=d;index=i}}return {t:index/N,d:Math.sqrt(best)}}
export function advance(previous,current){let d=current-previous;if(d<-.5)d++;if(d>.5)d--;return Math.abs(d)<.08?d:0}
export function circularDistance(a,b){const d=Math.abs(wrap(a)-wrap(b));return Math.min(d,1-d)}
const districtColors=[level.edgeA,level.edgeB,0xa983ff,0xe7fbff,level.edgeB,0xffad5c];
export const districts=level.districts.map((d,i)=>({from:i/6,name:String(i+1).padStart(2,'0')+' / '+d[0],hint:d[1],color:districtColors[i]}));
export function district(t){return [...districts].reverse().find(d=>wrap(t)>=d.from)||districts[0]}
export const driftZones=level.driftZones;
