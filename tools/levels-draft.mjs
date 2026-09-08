// Draft circuits authored as polygons: [x, z, radius, y]. Each vertex is filleted with an arc of that radius,
// arcs are sampled every ~14°, straights every ~110 m, so the Catmull-Rom curve follows the intended radii.
// Iterate with `node tools/track-check.mjs draft`, view with tools/shapes.html?draft, then bake into levels.js.
export function rounded(verts,scale=1,rScale=1){
  const n=verts.length,pts=[];
  const P=verts.map(v=>({x:v[0]*scale,z:v[1]*scale,r:v[2]*rScale,y:v[3]??2}));
  // fillet geometry per vertex
  const F=P.map((v,i)=>{const a=P[(i-1+n)%n],b=P[(i+1)%n];
    const ux=a.x-v.x,uz=a.z-v.z,lu=Math.hypot(ux,uz),wx=b.x-v.x,wz=b.z-v.z,lw=Math.hypot(wx,wz);
    const u=[ux/lu,uz/lu],w=[wx/lw,wz/lw];const cosT=u[0]*w[0]+u[1]*w[1],theta=Math.acos(Math.max(-1,Math.min(1,cosT)));
    const tan=v.r/Math.tan(theta/2);
    const p1=[v.x+u[0]*tan,v.z+u[1]*tan],p2=[v.x+w[0]*tan,v.z+w[1]*tan];
    const bis=[u[0]+w[0],u[1]+w[1]],lb=Math.hypot(...bis),c=[v.x+bis[0]/lb*(v.r/Math.sin(theta/2)),v.z+bis[1]/lb*(v.r/Math.sin(theta/2))];
    return{p1,p2,c,tan,theta,v};
  });
  for(let i=0;i<n;i++){const f=F[i],g=F[(i+1)%n];
    // arc at vertex i from p1 to p2 around c
    const a1=Math.atan2(f.p1[1]-f.c[1],f.p1[0]-f.c[0]),a2=Math.atan2(f.p2[1]-f.c[1],f.p2[0]-f.c[0]);let da=a2-a1;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
    const steps=Math.max(2,Math.round(Math.abs(da)/(14*Math.PI/180)));
    for(let s=0;s<=steps;s++){const a=a1+da*s/steps;pts.push([f.c[0]+Math.cos(a)*f.v.r,f.v.y,f.c[1]+Math.sin(a)*f.v.r])}
    // straight from f.p2 to g.p1
    const sx=g.p1[0]-f.p2[0],sz=g.p1[1]-f.p2[1],L=Math.hypot(sx,sz),segs=Math.max(1,Math.round(L/110));
    for(let s=1;s<segs;s++){const k=s/segs;pts.push([f.p2[0]+sx*k,f.v.y+(g.v.y-f.v.y)*k,f.p2[1]+sz*k])}
  }
  return pts.map(p=>p.map(v=>+v.toFixed(1)));
}
// FLOODLINE — storm-city canal grid. Harbour straight north, two street corners east, chicane past the floodgate, pumping-station hairpin west.
const floodlineVerts=[[-380,520,140,2],[300,560,120,2],[600,420,42,3],[560,150,36,2],[380,60,42,2],[420,-180,95,2],[520,-400,42,3],[300,-560,42,2],[-40,-500,70,1],[-120,-260,36,2],[-300,-140,36,2],[-560,-250,42,3],[-640,60,150,4],[-540,340,110,3]];
// SKYLINE — vertical city. Switchback climb, summit skyway plateau, long descent sweep.
const skylineVerts=[[-300,480,150,4],[240,540,140,8],[560,420,42,18],[520,180,36,30],[300,120,36,40],[240,-80,36,48],[440,-200,36,56],[380,-420,42,62],[120,-540,140,60],[-200,-480,110,52],[-320,-260,36,44],[-200,-100,36,38],[-420,-40,36,30],[-620,-220,42,22],[-660,80,160,12],[-520,360,140,6]];
// BLACKOUT — core-city grid. Right-angle blocks, the long grid boulevard, a stadium loop, a tight underpass pair.
const blackoutVerts=[[-300,540,110,3],[420,580,42,3],[680,400,42,4],[680,140,42,5],[500,80,36,4],[500,-160,36,4],[680,-320,42,4],[560,-560,42,3],[160,-600,120,2],[-80,-440,42,2],[-80,-220,36,2],[-320,-180,36,3],[-480,-400,42,3],[-720,-300,62,4],[-720,-20,42,4],[-560,120,36,4],[-680,320,42,4],[-520,500,80,3]];
// SOLARA — desert. Two long flowing arcs, the aqueduct S, the canyon hairpin, the mesa climb.
const solaraVerts=[[-300,480,220,4],[300,540,200,6],[660,380,120,10],[720,80,110,14],[560,-140,70,18],[360,-160,62,20],[300,-400,42,24],[60,-560,36,26],[-180,-460,42,24],[-100,-240,36,20],[-360,-160,42,18],[-620,-280,42,14],[-720,0,150,10],[-620,300,180,6]];
export const drafts={floodline:rounded(floodlineVerts,.9),skyline:rounded(skylineVerts,.88),blackout:rounded(blackoutVerts,.8),solara:rounded(solaraVerts,.88)};
export const verts={floodline:floodlineVerts,skyline:skylineVerts,blackout:blackoutVerts,solara:solaraVerts};
