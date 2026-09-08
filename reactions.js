// Reactions: crowds that flinch, verge traffic that pulls aside, marshals and boards that answer the race, camera drones.
export function buildReactions(W){
  const {THREE,scene,box,material,onTrack,at,yaw,wrap,level,cyan,pink,amber,dark,white,worldEvents,LENGTH,TRACK_HALF_WIDTH,driftZones,brakeCorners,chokes,signMeshes}=W;
  const glow=(c,i)=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:i,roughness:.5});
  const dist=(a,b)=>{let d=b-a;d-=Math.round(d);return d};
  const dummy=new THREE.Object3D();
  // ---- crowds: one cluster per apex zone and per brake corner, on the outside of the bend ----
  const crowdSpots=[...driftZones.map(t=>({t,side:1})),...brakeCorners.map(c=>({t:c.t,side:c.dir>0?1:-1}))];
  const skin=[0xf1c9a5,0xc68642,0x8d5524,0xffdbb4],tunic=[level.edgeA,level.edgeB,0xffc265,0xffffff,0x8a7dff];
  const crowds=crowdSpots.map((sp,ci)=>{
    const n=22,lane=sp.side*(TRACK_HALF_WIDTH+4+Math.random()*3),g=onTrack(sp.t,lane),bodies=new THREE.InstancedMesh(new THREE.BoxGeometry(.5,1.1,.35),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.8}),n),heads=new THREE.InstancedMesh(new THREE.BoxGeometry(.32,.32,.32),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.8}),n);
    const base=[];for(let i=0;i<n;i++){const x=(i%6-2.5)*1.1+(Math.random()-.5)*.4,z=Math.floor(i/6)*1.2-2+(Math.random()-.5)*.4,h=.9+Math.random()*.3;base.push({x,z,h,phase:Math.random()*6,arm:Math.random()>.6});bodies.setColorAt(i,new THREE.Color(tunic[i%tunic.length]));heads.setColorAt(i,new THREE.Color(skin[i%skin.length]))}
    g.add(bodies);g.add(heads);const flashes=Array.from({length:4},(_,i)=>box(.25,.25,.25,(i-1.5)*2,1.9,-1,glow(0xffffff,4),g));flashes.forEach(f=>f.visible=false);
    // a low barrier in front of them
    box(8,1,.3,0,.5,2.4,material(0x2a2f3a),g);box(8,.12,.34,0,1.02,2.4,sp.side>0?cyan:pink,g);
    return{t:sp.t,g,bodies,heads,base,flashes,lean:0,pose(now,lean){for(let i=0;i<n;i++){const b=base[i];const bob=Math.sin(now*.004+b.phase)*.04;dummy.position.set(b.x,b.h*.55+bob,b.z);dummy.rotation.set(-lean*.5,0,0);dummy.scale.set(1,b.h,1);dummy.updateMatrix();bodies.setMatrixAt(i,dummy.matrix);dummy.position.set(b.x,b.h*1.1+.2+bob+(b.arm?lean*.25:0),b.z-lean*.2);dummy.rotation.set(-lean*.5,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix)}bodies.instanceMatrix.needsUpdate=true;heads.instanceMatrix.needsUpdate=true}};
  });
  crowds.forEach(c=>c.pose(0,0));
  // ---- verge traffic: slow vehicles on the verge that pull aside when the player comes ----
  const vans=Array.from({length:level.family==='city'?6:3},(_,i)=>{const g=new THREE.Group();box(2.4,1.6,5.5,0,1.1,0,material([0x2b3f4c,0x3a2f45,0x1d3340,0x4a3a2a][i%4]),g);box(2.2,.9,2.4,0,2.3,-.6,material(0x1a2230),g);box(.4,.3,.3,-.8,1,2.8,glow(0xffffff,2),g);box(.4,.3,.3,.8,1,2.8,glow(0xffffff,2),g);box(.4,.2,.2,-.8,1,-2.8,glow(0xff3b3b,2),g);box(.4,.2,.2,.8,1,-2.8,glow(0xff3b3b,2),g);scene.add(g);return{g,t:i/6+.07,lane:(i%2?1:-1)*(TRACK_HALF_WIDTH+9),side:i%2?1:-1,offset:0,speed:9+i%3*2}});
  // ---- marshals: at every choke and brake corner, flag turns yellow after contact, waved when the player is near ----
  const marshalSpots=[...chokes.map(c=>({t:c.from-.012,side:1})),...brakeCorners.map(c=>({t:c.t-.02,side:c.dir>0?-1:1}))];
  const marshals=marshalSpots.map((sp,i)=>{const g=onTrack(sp.t,sp.side*(TRACK_HALF_WIDTH+2.6));box(.5,1.1,.35,0,.6,0,material(0xffffff),g);box(.32,.32,.32,0,1.35,0,material(skin[i%skin.length]),g);box(.5,.5,.5,0,1.6,0,material(0xffb95c),g);const pole=new THREE.Group();pole.position.set(sp.side>0?-.45:.45,1.2,0);g.add(pole);box(.06,1.2,.06,0,.6,0,dark,pole);const flag=box(.9,.6,.04,sp.side>0?-.5:.5,1.05,0,glow(0x5bff8a,1.2),pole);return{g,pole,flag,t:sp.t}});
  // ---- boards: gantries at quarter laps read position and chain ----
  const boards=[.25,.5,.75].map(t=>{const cv=document.createElement('canvas');cv.width=512;cv.height=128;const ctx=cv.getContext('2d');const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const g=onTrack(t-.004);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(14,3.5),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,toneMapped:false}));mesh.position.set(0,14.4,-.8);mesh.rotation.y=Math.PI;g.add(mesh);return{t,cv,ctx,tex,last:'',draw(text,color){if(text===this.last)return;this.last=text;ctx.fillStyle='#05070c';ctx.fillRect(0,0,512,128);ctx.fillStyle=color;ctx.font='bold 64px monospace';ctx.textAlign='center';ctx.fillText(text,256,88);tex.needsUpdate=true}}});
  boards.forEach(b=>b.draw('NEON BREACH',level.accent));
  // ---- camera drones: two hover near the player, lights blinking ----
  const drones=[0,1].map(i=>{const g=new THREE.Group();box(1.2,.3,1.2,0,0,0,material(0x1a2230),g);[[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]].forEach(([x,z])=>box(.5,.08,.5,x,.2,z,material(0x8a8f9a),g));box(.3,.3,.3,0,-.2,.4,glow(i?0xff3b3b:0x5bff8a,3),g);scene.add(g);return{g,i}});
  // ---- signs flicker when a drifting car passes ----
  const signs=signMeshes||[];
  return{
    crowds,vans,marshals,boards,drones,
    update(now,ctx){if(!ctx)return;
      // crowds: only the two nearest do work
      crowds.forEach(c=>{const d=Math.abs(dist(ctx.t,c.t))*LENGTH;c.near=d<45});
      crowds.filter(c=>c.near).slice(0,2).forEach(c=>{const want=ctx.isDrifting?1:.3;c.lean+=(want-c.lean)*.15;c.pose(now,c.lean*(.6+Math.sin(now*.01)*.2));c.flashes.forEach(f=>f.visible=ctx.isDrifting&&Math.random()>.85)});
      crowds.filter(c=>!c.near&&c.lean>.01).forEach(c=>{c.lean=0;c.pose(now,0);c.flashes.forEach(f=>f.visible=false)});
      // vans
      for(const v of vans){v.t=wrap(v.t+v.speed/LENGTH/60);const ahead=dist(ctx.t,v.t)*LENGTH;const threat=ahead>-6&&ahead<34;v.offset+=((threat?7:0)-v.offset)*.05;const lane=v.lane+v.side*v.offset;const p=at(v.t,lane);v.g.position.set(p.x,p.y-.08,p.z);v.g.rotation.y=yaw(v.t)+(threat?v.side*.12:0);if(threat&&!v.honked&&ahead<12&&ctx.speed>30){v.honked=true;if(Math.random()>.5)worldEvents.push({text:'HORN',beep:260})}if(!threat)v.honked=false}
      // marshals
      for(const m of marshals){const d=Math.abs(dist(ctx.t,m.t))*LENGTH;const yellow=ctx.lastHit>-3;m.flag.material.emissive.setHex(yellow?0xffe05f:0x5bff8a);m.flag.material.color.setHex(yellow?0xffe05f:0x5bff8a);m.pole.rotation.z=d<50?Math.sin(now*(yellow?.02:.008))*.6:0}
      // boards
      for(const b of boards){const ahead=dist(ctx.t,b.t)*LENGTH;if(ahead>0&&ahead<160)b.draw(`P${ctx.place}  ×${ctx.combo.toFixed(1)}  ${ctx.chain.toLocaleString()}`,ctx.place===1?'#5bff8a':level.accent)}
      // drones
      drones.forEach((d,i)=>{const side=i?1:-1,p=at(ctx.t+.006,side*12);d.g.position.set(p.x,p.y+7+Math.sin(now*.003+i)*.6,p.z);d.g.rotation.y=yaw(ctx.t)+Math.PI;d.g.children[5].visible=Math.sin(now*.01+i*3)>0});
      // signs
      for(const s of signs){if(!s.userData.t)continue;const d=Math.abs(dist(ctx.t,s.userData.t))*LENGTH;s.material.opacity=ctx.isDrifting&&d<24?.6+Math.random()*.4:1;s.material.transparent=true}
    }
  };
}
