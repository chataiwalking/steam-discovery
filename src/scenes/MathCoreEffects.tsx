import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, Color, DoubleSide, type Group, type Mesh, type ShaderMaterial } from 'three';
import { useSceneClock, type SceneProps } from './shared';

export const easeMotion = (progress: number) => {
  const p = Math.max(0, Math.min(1, progress));
  return p * p * (3 - 2 * p);
};
export const damping = (delta: number, speed = 12) => 1 - Math.exp(-Math.min(delta, .08) * speed);

const planeVertex = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const ringFragment = `uniform vec3 uColor;uniform float uStrength;uniform float uTime;varying vec2 vUv;
void main(){float r=length(vUv-.5)*2.;float ring=1.-smoothstep(.025,.11,abs(r-.77));
float aura=(1.-smoothstep(.05,.23,abs(r-.77)))*.18;
float alpha=(ring+aura)*uStrength*(.72+.12*sin(uTime*3.));
gl_FragColor=vec4(uColor*1.25,alpha);}`;

/** Feedback remains local to a picked object; it never changes learning evidence. */
export function FocusTarget({ children, radius = .45, color = '#8ad5df', position, rotation, ringPlane = 'floor', ringPosition, onActivate, paused = false, enabled = true }: {
  children: ReactNode; radius?: number; color?: string; position?: [number, number, number];
  rotation?: [number, number, number]; ringPlane?:'floor'|'front';ringPosition?:[number,number,number];onActivate?: () => void; paused?: boolean; enabled?: boolean;
}) {
  const ring = useRef<Mesh>(null), material = useRef<ShaderMaterial>(null);
  const hover = useRef(false), pulse = useRef(0), strength = useRef(0), clock = useRef(0);
  const invalidate=useThree(state=>state.invalidate);
  const uniforms = useMemo(() => ({uColor:{value:new Color(color)},uStrength:{value:0},uTime:{value:0}}), [color]);
  const syncPointerFeedback=()=>{
    if(paused){
      strength.current=enabled?Math.max(hover.current?.82:0,pulse.current):0;
      if(ring.current)ring.current.visible=strength.current>.006;
      if(material.current)material.current.uniforms.uStrength.value=strength.current;
    }
    invalidate();
  };
  useLayoutEffect(()=>{
    if(!enabled){if(hover.current)document.body.style.cursor='';hover.current=false;pulse.current=0;strength.current=0;if(ring.current)ring.current.visible=false;if(material.current)material.current.uniforms.uStrength.value=0;invalidate();}
  },[enabled,invalidate]);
  useEffect(() => () => { if (hover.current) document.body.style.cursor = ''; }, []);
  useFrame((_, delta) => {
    if (!paused) { clock.current += Math.min(delta, .08); pulse.current = Math.max(0, pulse.current - delta * 1.4); }
    if(!paused)strength.current += ((enabled ? Math.max(hover.current ? .82 : 0, pulse.current) : 0) - strength.current) * damping(delta);
    if (ring.current) ring.current.visible = strength.current > .006;
    if (material.current) {material.current.uniforms.uStrength.value = strength.current;material.current.uniforms.uTime.value = clock.current;}
  });
  return <group position={position} rotation={rotation}
    onPointerOver={event => {if(!enabled)return;event.stopPropagation();hover.current=true;document.body.style.cursor='pointer';syncPointerFeedback();}}
    onPointerOut={() => {hover.current=false;if(paused)pulse.current=0;document.body.style.cursor='';syncPointerFeedback();}}
    onClick={event => {if(!enabled)return;event.stopPropagation();pulse.current=1;syncPointerFeedback();onActivate?.();}}>
    {children}
    <mesh ref={ring} visible={false} rotation={ringPlane==='floor'?[-Math.PI/2,0,0]:[0,0,0]} position={ringPosition??(ringPlane==='floor'?[0,.014,0]:[0,0,.36])} raycast={() => null}>
      <planeGeometry args={[radius*2.5,radius*2.5]}/>
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={planeVertex} fragmentShader={ringFragment}
        transparent depthWrite={false} side={DoubleSide} blending={AdditiveBlending} toneMapped={false}/>
    </mesh>
  </group>;
}

/** Thin optical ripples overlay the physically shaded water; no geometry changes. */
export function WaterRipples({ props, position, scale = [1,1,1], rain = false }: {
  props: SceneProps; position: [number,number,number]; scale?: [number,number,number]; rain?: boolean;
}) {
  const time = useSceneClock(props), material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({uTime:{value:0},uRain:{value:0}}), []);
  useFrame((_, delta) => {if(material.current){material.current.uniforms.uTime.value=time.current;if(!props.paused)material.current.uniforms.uRain.value+=(Number(rain)-material.current.uniforms.uRain.value)*damping(delta,5);}});
  return <mesh position={position} scale={scale} rotation={[-Math.PI/2,0,0]} raycast={() => null}>
    <planeGeometry args={[2,2]}/>
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={planeVertex}
      fragmentShader={`uniform float uTime;uniform float uRain;varying vec2 vUv;
        void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float edge=1.-smoothstep(.8,1.,r);
        float wave=pow(max(0.,sin(r*27.-uTime*2.8)),10.);
        float secondary=pow(max(0.,sin(length(p-vec2(.3,-.18))*34.-uTime*5.)),13.);
        gl_FragColor=vec4(vec3(.5,.82,.9),(wave*.055+secondary*.07*uRain)*edge);}`}
      transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false}/>
  </mesh>;
}

/** Surface-normal Fresnel glow, kept thin so the daylight terminator stays visible. */
export function Atmosphere({ radius = 1.43, color = '#3b9eff', strength = .22 }: {radius?: number;color?:string;strength?:number}) {
  const uniforms=useMemo(()=>({uColor:{value:new Color(color)},uStrength:{value:strength}}),[color,strength]);
  return <mesh raycast={() => null}>
    <sphereGeometry args={[radius,48,32]}/>
    <shaderMaterial uniforms={uniforms} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false}
      vertexShader={`varying vec3 vNormal;varying vec3 vView;
        void main(){vec4 p=modelViewMatrix*vec4(position,1.);vView=-p.xyz;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*p;}`}
      fragmentShader={`uniform vec3 uColor;uniform float uStrength;varying vec3 vNormal;varying vec3 vView;
        void main(){float rim=pow(1.-max(0.,dot(normalize(vNormal),normalize(vView))),3.5);
        gl_FragColor=vec4(uColor,rim*uStrength);}`}/>
  </mesh>;
}

/** Visible tooth marker helps track direction and turns without extra lights. */
export function GearMarker({ radius, color = '#f3d799' }: {radius:number;color?:string}) {
  return <mesh position={[0,radius*.74,.32]} raycast={() => null}>
    <sphereGeometry args={[.055,12,8]}/><meshBasicMaterial color={color} toneMapped={false}/>
  </mesh>;
}

export function LiftOnHover({children,hovered,paused}:{children:ReactNode;hovered:boolean;paused:boolean}) {
  const group=useRef<Group>(null),previousHover=useRef(hovered),invalidate=useThree(state=>state.invalidate);
  useLayoutEffect(()=>{const changed=previousHover.current!==hovered;previousHover.current=hovered;if(changed&&paused&&group.current){group.current.position.y=hovered?.045:0;invalidate();}},[hovered,paused,invalidate]);
  useFrame((_,delta)=>{if(group.current&&!paused)group.current.position.y+=((hovered?.045:0)-group.current.position.y)*damping(delta,10);});
  return <group ref={group}>{children}</group>;
}

export function HoverAura({active,radius,paused}:{active:boolean;radius:number;paused:boolean}) {
  const material=useRef<ShaderMaterial>(null),mesh=useRef<Mesh>(null),phase=useRef(0);
  const previousActive=useRef(active),invalidate=useThree(state=>state.invalidate);
  const uniforms=useMemo(()=>({uColor:{value:new Color('#80c5cb')},uStrength:{value:0},uTime:{value:0}}),[]);
  useLayoutEffect(()=>{const changed=previousActive.current!==active;previousActive.current=active;if(changed&&paused&&material.current){material.current.uniforms.uStrength.value=Number(active);if(mesh.current)mesh.current.visible=active;invalidate();}},[active,paused,invalidate]);
  useFrame((_,delta)=>{if(material.current){if(!paused){phase.current+=Math.min(delta,.08);material.current.uniforms.uStrength.value+=(Number(active)-material.current.uniforms.uStrength.value)*damping(delta);}material.current.uniforms.uTime.value=phase.current;if(mesh.current)mesh.current.visible=material.current.uniforms.uStrength.value>.006;}});
  return <mesh ref={mesh} visible={false} position={[0,.2,0]} rotation={[-Math.PI/2,0,0]} raycast={()=>null}>
    <planeGeometry args={[radius*2.5,radius*2.5]}/><shaderMaterial ref={material} uniforms={uniforms} vertexShader={planeVertex} fragmentShader={ringFragment} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false}/>
  </mesh>;
}
