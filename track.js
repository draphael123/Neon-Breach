import * as THREE from './three.module.js';
import {level} from './levels.js';
export const TRACK_HALF_WIDTH=16;
export const wrap=t=>((t%1)+1)%1;
export const HALF_WIDTH=TRACK_HALF_WIDTH;
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

// Route geometry: risk routes (side lines authored as lane/height offsets from the main line), chokes, banks, jumps.
export const riskRoutes=(level.risks||[]).map(r=>{const pts=[];const n=Math.max(8,Math.round((r.to-r.from)*LENGTH/30));for(let i=0;i<=n;i++){const u=i/n,tt=r.from+(r.to-r.from)*u,blend=Math.min(1,u/.22,(1-u)/.22),p=at(tt,r.lane*blend);p.y+=(r.dy||0)*blend;pts.push(p)}const curve=new THREE.CatmullRomCurve3(pts,false,'centripetal');const S=Array.from({length:161},(_,i)=>curve.getPointAt(i/160));return{...r,curve,samples:S,length:curve.getLength()}});
export function riskNearest(r,p){let best=Infinity,index=0;for(let i=0;i<r.samples.length;i++){const v=r.samples[i],d=(v.x-p.x)**2+(v.z-p.z)**2;if(d<best){best=d;index=i}}return{u:index/(r.samples.length-1),d:Math.sqrt(best)}}
export function riskAt(r,u){return r.curve.getPointAt(Math.max(0,Math.min(1,u)))}
export function riskYaw(r,u){const v=r.curve.getTangentAt(Math.max(0,Math.min(1,u)));return Math.atan2(v.x,v.z)}
export const clearSamples=[...samples,...riskRoutes.flatMap(r=>r.samples)];
export const chokes=level.chokes||[],banks=level.banks||[],jumps=level.jumps||[];
export function bankRoll(u){u=wrap(u);for(const b of banks){if(u>=b.from&&u<=b.to){const e=Math.min(1,(u-b.from)/.012,(b.to-u)/.012);return b.roll*e}}return 0}
export function chokeHalf(u){u=wrap(u);for(const c of chokes)if(u>=c.from&&u<=c.to)return c.half;return TRACK_HALF_WIDTH}
