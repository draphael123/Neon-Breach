// Draft circuits authored as polygons: [x, z, radius, y]. Each vertex is filleted with an arc of that radius,
// arcs are sampled every ~14°, straights every ~110 m, so the Catmull-Rom curve follows the intended radii.
// Iterate with `node tools/track-check.mjs draft`, view with tools/shapes.html?draft, then bake into levels.js.
export function rounded(verts,scale=1,rScale=1){
  const n=verts.length,pts=[];
  const P=verts.map(v=>({x:v[0]*scale,z:v[1]*scale,r:v[2]*rScale,y:v[3]??2}));
  // shrink radii so neighbouring fillets never overlap along a shared edge
  const tanLen=(i)=>{const v=P[i],a=P[(i-1+n)%n],b=P[(i+1)%n];const u=[a.x-v.x,a.z-v.z],w=[b.x-v.x,b.z-v.z],lu=Math.hypot(...u),lw=Math.hypot(...w);const th=Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(lu*lw))));return v.r/Math.tan(th/2)};
  for(let pass=0;pass<4;pass++)for(let i=0;i<n;i++){const j=(i+1)%n,L=Math.hypot(P[j].x-P[i].x,P[j].z-P[i].z),need=tanLen(i)+tanLen(j);if(need>L*.92){const k=L*.92/need;P[i].r*=k;P[j].r*=k}}
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
    const ks=new Set();if(L>50){ks.add(18/L);ks.add(1-18/L)}for(let s=1;s<segs;s++)ks.add(s/segs);
    for(const k of [...ks].sort((a,b)=>a-b)){pts.push([f.p2[0]+sx*k,f.v.y+(g.v.y-f.v.y)*k,f.p2[1]+sz*k])}
  }
  // heights: interpolate by distance along the loop between arc midpoints, so grade is constant per segment
  const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][2]-pts[i-1][2]));
  const total=cum[cum.length-1]+Math.hypot(pts[0][0]-pts[pts.length-1][0],pts[0][2]-pts[pts.length-1][2]);
  const apex=[];for(const f of F){const mx=(f.p1[0]+f.p2[0])/2,mz=(f.p1[1]+f.p2[1])/2;let best=0,bd=1e9;pts.forEach((p,i)=>{const d=Math.hypot(p[0]-mx,p[2]-mz);if(d<bd){bd=d;best=i}});apex.push([cum[best],f.v.y])}
  apex.sort((a,b)=>a[0]-b[0]);
  for(let i=0;i<pts.length;i++){const d=cum[i];let a=apex[apex.length-1],b=apex[0],da=a[0]-total,db=b[0];for(let k=0;k<apex.length;k++){if(apex[k][0]<=d){a=apex[k];da=a[0];b=apex[(k+1)%apex.length];db=k+1<apex.length?b[0]:b[0]+total}}const u=db>da?(d-da)/(db-da):0;pts[i][1]=a[1]+(b[1]-a[1])*u}
  return pts.map(p=>p.map(v=>+v.toFixed(1)));
}
// FLOODLINE — storm-city canal grid. Harbour straight north, two street corners east, chicane past the floodgate, pumping-station hairpin west.
const floodlineVerts=[[-380,520,150,2],[300,560,130,2],[600,420,44,3],[560,150,44,2],[380,60,44,2],[420,-180,100,2],[520,-400,44,3],[300,-560,44,2],[-40,-500,80,1],[-120,-260,44,2],[-300,-140,44,2],[-560,-250,44,3],[-640,60,160,4],[-540,340,120,3]];
// SKYLINE — vertical city. Switchback climb, summit skyway plateau, long descent sweep.
const skylineVerts=[[-300,480,160,4],[240,540,150,8],[560,420,48,18],[520,180,32,30],[300,120,32,40],[240,-80,32,48],[440,-200,32,56],[380,-420,48,62],[120,-540,150,60],[-200,-480,120,52],[-320,-260,34,44],[-200,-100,34,38],[-420,-40,34,30],[-620,-220,48,22],[-660,80,170,12],[-520,360,150,6]];
// BLACKOUT — core-city grid. Right-angle blocks, the long grid boulevard, a stadium loop, a tight underpass pair.
const blackoutVerts=[[-300,540,120,3],[420,580,58,3],[680,400,56,4],[680,140,50,5],[500,80,44,4],[500,-160,44,4],[680,-320,58,4],[560,-560,56,3],[160,-600,130,2],[-80,-440,54,2],[-80,-220,52,2],[-320,-180,44,3],[-480,-400,58,3],[-720,-300,64,4],[-720,-20,60,4],[-560,120,52,4],[-680,320,58,4],[-520,500,90,3]];
// SOLARA — desert. Two long flowing arcs, the aqueduct S, the canyon hairpin, the mesa climb.
const solaraVerts=[[-300,480,220,4],[300,540,200,6],[660,380,130,10],[720,80,120,14],[560,-140,90,18],[400,-180,80,20],[440,-470,40,23],[140,-380,110,25],[-180,-460,60,24],[-100,-240,58,20],[-360,-160,96,18],[-620,-280,84,14],[-720,0,160,10],[-620,300,190,6]];
export const drafts={floodline:rounded(floodlineVerts,.9),skyline:rounded(skylineVerts,.88),blackout:rounded(blackoutVerts,.8),solara:rounded(solaraVerts,.88)};
export const verts={floodline:floodlineVerts,skyline:skylineVerts,blackout:blackoutVerts,solara:solaraVerts};
