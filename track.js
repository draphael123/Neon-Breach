import * as THREE from './three.module.js';
export const wrap=t=>((t%1)+1)%1;
export const HALF_WIDTH=13;
const control=[[-65,3,180],[60,3,180],[175,6,150],[240,18,55],[245,26,-70],[165,23,-145],[90,14,-120],[40,6,-185],[-65,3,-205],[-150,3,-175],[-205,3,-95],[-135,3,-45],[-115,3,35],[-225,3,90],[-225,3,165],[-145,3,185]];
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
export const districts=[{from:0,name:'01 / NEON MARKET',hint:'Open straight · build speed',color:0xff3c91},{from:.22,name:'02 / SKYWAY',hint:'Elevated sweep · hold your line',color:0x5bfff1},{from:.44,name:'03 / UNDERPASS',hint:'S-bends · brake and drift',color:0x9d80ff},{from:.70,name:'04 / DOCKSIDE',hint:'Hairpin · brake early',color:0xffad5c}];
export function district(t){return [...districts].reverse().find(d=>wrap(t)>=d.from)||districts[0]}
export const driftZones=[.105,.33,.625,.90];
