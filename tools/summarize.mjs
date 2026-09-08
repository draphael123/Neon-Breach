// node tools/summarize.mjs <tag>  -> markdown table from tools/reports/<tag>-*.json
import {readdirSync,readFileSync} from 'node:fs';
const tag=process.argv[2]||'run';
const files=readdirSync('tools/reports').filter(f=>f.startsWith(tag+'-')&&f.endsWith('.json')).sort();
const avg=(l,k)=>l.length?l.reduce((a,b)=>a+b[k],0)/l.length:0;
console.log('| circuit | profile | best lap | avg lap | at cap | brake s | drift s | contacts/lap | finish | gap P2 | rival lap | violations |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
for(const f of files){
  const m=JSON.parse(readFileSync('tools/reports/'+f,'utf8'));
  for(const [p,c] of Object.entries(m.cells)){
    const l=c.laps,v=c.violations.length+(c.violations[0]?' '+c.violations[0].kind:'');
    if(!l.length){console.log(`| ${m.level} | ${p} | - | - | - | - | - | - | ${c.finish?.state} | - | - | ${v} |`);continue}
    const rl=c.rivalLaps.flat();
    console.log(`| ${m.level} | ${p} | ${Math.min(...l.map(x=>x.time)).toFixed(1)} | ${avg(l,'time').toFixed(1)} | ${avg(l,'capPct').toFixed(0)}% | ${avg(l,'brakeS').toFixed(1)} | ${avg(l,'driftS').toFixed(1)} | ${avg(l,'contacts').toFixed(1)} | P${c.finish.place} | ${l.at(-1).gapToP2S}s | ${rl.length?(rl.reduce((a,b)=>a+b,0)/rl.length).toFixed(1):'-'} | ${v} |`);
  }
}
