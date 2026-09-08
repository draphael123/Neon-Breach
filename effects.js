import * as THREE from './three.module.js';

// A small optional post-processing chain. Battery saver renders directly.
export function createPostFX(renderer){
  const postScene=new THREE.Scene(),postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial());postScene.add(mesh);
  const options={type:THREE.HalfFloatType,depthBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter};
  const supported=renderer.extensions?.has('EXT_color_buffer_float');
  if(!supported)options.type=THREE.UnsignedByteType;
  const sceneTarget=new THREE.WebGLRenderTarget(1,1,{...options,depthBuffer:true}),a=new THREE.WebGLRenderTarget(1,1,options),b=new THREE.WebGLRenderTarget(1,1,options);
  const vertex=`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
  const bright=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{source:{value:null}},vertexShader:vertex,fragmentShader:`uniform sampler2D source;varying vec2 vUv;void main(){vec3 c=texture2D(source,vUv).rgb;float l=max(max(c.r,c.g),c.b);float k=smoothstep(0.78,1.8,l);gl_FragColor=vec4(c*k,1.0);}`});
  const blur=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{source:{value:null},direction:{value:new THREE.Vector2()}},vertexShader:vertex,fragmentShader:`uniform sampler2D source;uniform vec2 direction;varying vec2 vUv;void main(){vec3 c=texture2D(source,vUv).rgb*0.227027;c+=texture2D(source,vUv+direction*1.384615).rgb*0.316216;c+=texture2D(source,vUv-direction*1.384615).rgb*0.316216;c+=texture2D(source,vUv+direction*3.230769).rgb*0.070270;c+=texture2D(source,vUv-direction*3.230769).rgb*0.070270;gl_FragColor=vec4(c,1.0);}`});
  const composite=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{base:{value:sceneTarget.texture},glow:{value:a.texture},boost:{value:0},clock:{value:0}},vertexShader:vertex,fragmentShader:`uniform sampler2D base;uniform sampler2D glow;uniform float boost;uniform float clock;varying vec2 vUv;void main(){vec2 v=vUv-0.5;float edge=dot(v,v);vec2 aberration=v*edge*0.0022*boost;vec3 color=texture2D(base,vUv).rgb;color.r=mix(color.r,texture2D(base,vUv+aberration).r,boost);color.b=mix(color.b,texture2D(base,vUv-aberration).b,boost);color+=texture2D(glow,vUv).rgb*0.18;color*=1.0-smoothstep(0.10,0.55,edge)*0.18;gl_FragColor=vec4(color,1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
  let width=1,height=1;
  function resize(w,h){width=Math.max(1,Math.round(w));height=Math.max(1,Math.round(h));sceneTarget.setSize(width,height);a.setSize(Math.max(1,width>>2),Math.max(1,height>>2));b.setSize(Math.max(1,width>>2),Math.max(1,height>>2))}
  function pass(material,target){mesh.material=material;renderer.setRenderTarget(target);renderer.render(postScene,postCamera)}
  function render(scene,camera,enabled,boost,now){if(!enabled){renderer.setRenderTarget(null);renderer.render(scene,camera);return}renderer.setRenderTarget(sceneTarget);renderer.render(scene,camera);bright.uniforms.source.value=sceneTarget.texture;pass(bright,a);blur.uniforms.source.value=a.texture;blur.uniforms.direction.value.set(1/a.width,0);pass(blur,b);blur.uniforms.source.value=b.texture;blur.uniforms.direction.value.set(0,1/b.height);pass(blur,a);composite.uniforms.boost.value=boost?1:0;composite.uniforms.clock.value=now;pass(composite,null)}
  return {resize,render};
}

export function createAtmosphere(scene,theme={id:'midnight'}){
  const count=420,positions=new Float32Array(count*6),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));const W={midnight:{color:0x8cc5e4,op:.19,base:.13},floodline:{color:0xa9e8ff,op:.34,base:.24},skyline:{color:0xc9c0ff,op:.10,base:.06},blackout:{color:0xffa14a,op:.16,base:.10},solara:{color:0xf3ae70,op:.19,base:.13},cryoline:{color:0xd9f7ff,op:.32,base:.22}}[theme.id]||{color:0x8cc5e4,op:.19,base:.13};const color=W.color,material=new THREE.LineBasicMaterial({color,transparent:true,opacity:W.op,depthWrite:false});const rain=new THREE.LineSegments(geometry,material);rain.frustumCulled=false;scene.add(rain);
  const seeds=Array.from({length:count},()=>[Math.random(),Math.random(),Math.random()]);
  function update(camera,now,visible,quality,speedRatio=0){rain.visible=visible;if(!visible)return;const rush=.65+Math.max(0,Math.min(1,speedRatio))*1.15,n=quality==='high'?count:160;material.opacity=W.base+rush*.07;geometry.setDrawRange(0,n*2);for(let i=0;i<n;i++){const s=seeds[i];let x=camera.position.x+(s[0]-.5)*70,y=camera.position.y+((s[1]*36-now*(theme.id==='cryoline'?.006:.018))%36+36)%36-10,z=camera.position.z+(s[2]-.5)*70,dx=-.2*rush,dy=-1.4*rush,dz=.12*rush;if(theme.id==='solara'){y=camera.position.y-2+s[1]*8;dx=2.4*rush;dy=.08;dz=.5*rush}else if(theme.id==='cryoline'){dx=.45*rush;dy=-.45*rush;dz=.2*rush}else if(theme.id==='floodline'){dx=-.9*rush;dy=-2.4*rush;dz=.3*rush}else if(theme.id==='skyline'){if(i%3){positions.set([0,-999,0,0,-999,0],i*6);continue}y=camera.position.y+4+s[1]*30;dx=3.2*rush;dy=.03;dz=.9*rush}else if(theme.id==='blackout'){if(i%4){positions.set([0,-999,0,0,-999,0],i*6);continue}y=camera.position.y-3+s[1]*14;dx=.3*rush;dy=.35;dz=.1*rush}positions.set([x,y,z,x+dx,y+dy,z+dz],i*6)}geometry.attributes.position.needsUpdate=true}
  return {update};
}

export function createSkidMarks(scene){
  const capacity=280,mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(.23,1),new THREE.MeshBasicMaterial({color:0x02050b,transparent:true,opacity:.46,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),capacity);
  mesh.frustumCulled=false;const dummy=new THREE.Object3D();dummy.scale.set(0,0,0);dummy.updateMatrix();for(let i=0;i<capacity;i++)mesh.setMatrixAt(i,dummy.matrix);scene.add(mesh);let index=0,previous=null;
  function update(position,heading,active){if(!active){previous=null;return}if(previous&&previous.distanceTo(position)>.18){const distance=Math.min(previous.distanceTo(position),2.5);for(const side of [-1,1]){dummy.position.copy(position).add(previous).multiplyScalar(.5);dummy.position.x+=Math.cos(heading)*side*.96;dummy.position.z-=Math.sin(heading)*side*.96;dummy.position.y+=.065;dummy.rotation.set(-Math.PI/2,0,-heading);dummy.scale.set(1,distance,1);dummy.updateMatrix();mesh.setMatrixAt(index++%capacity,dummy.matrix)}mesh.instanceMatrix.needsUpdate=true}previous=position.clone()}
  function clear(){dummy.scale.set(0,0,0);dummy.updateMatrix();for(let i=0;i<capacity;i++)mesh.setMatrixAt(i,dummy.matrix);mesh.instanceMatrix.needsUpdate=true;previous=null}
  return {update,clear};
}
