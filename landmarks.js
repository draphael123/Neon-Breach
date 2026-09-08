// Landmarks: a legible silhouette on the outside of every brake corner, with a moving light so you brake because you saw it.
export function buildLandmarks(W){
  const {THREE,scene,box,material,at,yaw,level,cyan,pink,amber,dark,white,brakeCorners,TRACK_HALF_WIDTH}=W;
  const glow=(c,i)=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:i,roughness:.5});
  const fog=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,side:THREE.DoubleSide});
  const marks=[];
  brakeCorners.forEach((c,i)=>{
    const lane=(c.dir>0?1:-1)*(TRACK_HALF_WIDTH+1.5+34+14),p=at(c.t,lane),g=new THREE.Group();g.position.set(p.x,-4.5,p.z);g.rotation.y=yaw(c.t);scene.add(g);
    let update=()=>{};
    if(level.id==='midnight'){box(6,44,6,0,22,0,dark,g);const panel=box(7,26,.6,0,30,3.4,glow(i%2?0xff408c:0x50fff1,1.6),g);const ring=box(9,1,9,0,45,0,glow(0xffffff,1),g);update=now=>{panel.material.emissiveIntensity=1.2+Math.max(0,Math.sin(now*.003+i))*1.4;ring.rotation.y=now*.001}}
    else if(level.id==='floodline'){box(5,30,5,0,15,0,material(0xd9e4ea),g);box(6,2,6,0,31,0,material(0x2b3f4c),g);const lamp=box(2.5,2.5,2.5,0,33,0,glow(0xffe9a8,3),g);const beam=box(.6,.6,140,0,33,70,fog(0xffe9a8,.16),g);update=now=>{beam.rotation.y=now*.0012+i;beam.position.set(Math.sin(beam.rotation.y)*70,33,Math.cos(beam.rotation.y)*70)}}
    else if(level.id==='skyline'){box(2.5,70,2.5,0,35,0,dark,g);const arm=box(40,1.5,1.5,12,70,0,material(0xffc265),g);const hook=box(.6,10,.6,30,64,0,dark,g);const strobe=box(1,1,1,32,71,0,glow(0xff5b5b,3),g);update=now=>{g.rotation.y=yaw(c.t)+Math.sin(now*.0002+i)*.5;strobe.visible=Math.sin(now*.007+i)>.3}}
    else if(level.id==='blackout'){const t1=box(18,44,18,0,22,0,material(0x1a161c),g),t2=box(13,10,13,0,49,0,material(0x2a2530),g);const lamp=box(1.6,.8,1.6,0,55,0,glow(0xff2d2d,3),g);const steam=box(9,12,9,0,60,0,fog(0x8a8f9a,.14),g);update=now=>{lamp.visible=Math.sin(now*.004+i)>0;steam.scale.y=1+Math.sin(now*.002+i)*.3;steam.position.y=60+steam.scale.y*3}}
    else if(level.id==='solara'){box(10,34,10,-12,17,0,material(0x8d4c35),g);box(10,30,10,12,15,0,material(0xa95e3b),g);box(36,6,10,0,36,0,material(0x6f382e),g);const beacon=box(2,2,2,0,41,0,glow(0xffd166,3),g);update=now=>{beacon.material.emissiveIntensity=2+Math.sin(now*.005+i)*1.5}}
    else{box(2.5,30,2.5,0,15,0,material(0x9bb8c8),g);const dish=box(16,.8,16,0,30,0,material(0xe8fbff),g);dish.rotation.x=-.8;const feed=box(.5,7,.5,0,34,3,dark,g);const lamp=box(.8,.8,.8,0,38,4,glow(0xff5b5b,3),g);update=now=>{g.rotation.y=now*.0004+i;lamp.visible=Math.sin(now*.006+i)>.5}}
    marks.push({t:c.t,g,update});
  });
  return{marks,update(now){for(const m of marks)m.update(now)}};
}
