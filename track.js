import * as THREE from './three.module.js';
export const wrap=t=>((t%1)+1)%1;
export const HALF_WIDTH=13;
const control=[[-65,3,180],[60,3,180],[175,6,150],[260,18,55],[270,26,-80],[190,23,-165],[95,14,-145],[25,6,-215],[-80,3,-260],[-205,4,-330],[-350,7,-300],[-425,9,-205],[-405,8,-85],[-330,6,-15],[-250,5,45],[-315,12,125],[-300,18,240],[-190,12,285],[-90,5,245]];
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
export const districts=[{from:0,name:'01 / NEON MARKET',hint:'Open straight · build speed',color:0xff3c91},{from:.16,name:'02 / SKYWAY',hint:'Elevated sweep · hold your line',color:0x5bfff1},{from:.31,name:'03 / UNDERPASS',hint:'S-bends · brake and drift',color:0x9d80ff},{from:.46,name:'04 / GLASSHOUSE',hint:'Open atrium · thread the columns',color:0xe7fbff},{from:.66,name:'05 / MAGLEV SPINE',hint:'Rail chase · link the sweepers',color:0x56e3d3},{from:.84,name:'06 / DOCKSIDE',hint:'Final hairpin · bank the chain',color:0xffad5c}];
export function district(t){return [...districts].reverse().find(d=>wrap(t)>=d.from)||districts[0]}
export const driftZones=[.08,.235,.39,.555,.735,.91];
