import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace, Vector2 } from 'three';
import type { Subject } from '../types';

const surfaces = {
  S: { top: '#d4e4e5', edge: '#426b74', ink: '#6c929d' },
  T: { top: '#a8c2bf', edge: '#315953', ink: '#537e77' },
  E: { top: '#dec8a6', edge: '#806745', ink: '#998362' },
  A: { top: '#ebd9d2', edge: '#896c70', ink: '#ae8987' },
  M: { top: '#dddfea', edge: '#686d8d', ink: '#9196ac' },
  B: { top: '#d9e5d0', edge: '#607b67', ink: '#869b7e' },
  G: { top: '#dfd9bc', edge: '#697d77', ink: '#9b9f85' },
  H: { top: '#e0cbb7', edge: '#876f60', ink: '#b2927e' },
} satisfies Record<Subject,{top:string;edge:string;ink:string}>;

// The map is circular in world space. Its marks are studio alignment aids, not physical units.
function faceTexture(subject: Subject) {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=512;
  const c=canvas.getContext('2d');
  if(!c) return null;
  const {top,ink}=surfaces[subject];
  c.fillStyle=top; c.fillRect(0,0,512,512);
  c.strokeStyle=c.fillStyle=ink; c.lineWidth=1;
  const line=(x:number,y:number,xx:number,yy:number)=>{
    c.beginPath(); c.moveTo(x,y); c.lineTo(xx,yy); c.stroke();
  };
  if(subject==='M' || subject==='E' || subject==='G') {
    const pitch=subject==='M'?32:subject==='E'?24:64;
    c.globalAlpha=subject==='E'?.19:.24;
    for(let x=0;x<=512;x+=pitch) {
      line(x+.5,0,x+.5,512); line(0,x+.5,512,x+.5);
    }
    if(subject==='G') {
      for(let y=32;y<512;y+=64)for(let x=32;x<512;x+=64) {
        line(x-3,y,x+3,y); line(x,y-3,x,y+3);
      }
    }
  } else if(subject==='T') {
    c.globalAlpha=.4;
    for(let y=8;y<512;y+=20)for(let x=8;x<512;x+=20) {
      c.beginPath(); c.arc(x,y,1.45,0,Math.PI*2); c.fill();
    }
  } else if(subject==='H') {
    c.globalAlpha=.10;
    for(let i=0;i<512;i+=3) { line(i,0,i,512);line(0,i,512,i); }
  } else if(subject==='A') {
    c.globalAlpha=.55;
    for(const x of [98,414])for(const y of [98,414]) {
      line(x-12,y,x+12,y); line(x,y-12,x,y+12);
    }
  }
  c.translate(256,256);
  c.globalAlpha=.54;
  c.beginPath(); c.arc(0,0,245,0,Math.PI*2); c.stroke();
  if(subject==='S'||subject==='M') {
    const divisions=subject==='S'?48:16;
    for(let i=0;i<divisions;i++) {
      const angle=Math.PI*2*i/divisions;
      const end=i%4===0?225:235;
      line(Math.cos(angle)*244,Math.sin(angle)*244,Math.cos(angle)*end,Math.sin(angle)*end);
    }
  } else if(subject==='B') {
    c.lineWidth=4;
    for(let i=0;i<3;i++) { c.beginPath(); c.arc(0,0,234,i*2*Math.PI/3+.2,i*2*Math.PI/3+1.7);c.stroke(); }
  }
  const map=new CanvasTexture(canvas);
  map.colorSpace=SRGBColorSpace;
  map.anisotropy=4;
  return map;
}

export default function LessonBase({subject,radius}:{subject:Subject;radius:number}) {
  const map=useMemo(()=>faceTexture(subject),[subject]);
  useEffect(()=>()=>{map?.dispose();},[map]);
  const profile=useMemo(()=>[
    new Vector2(radius-.15,-.344),new Vector2(radius-.08,-.335),
    new Vector2(radius-.035,-.30),new Vector2(radius-.01,-.27),
    new Vector2(radius,-.22),new Vector2(radius,-.17),
    new Vector2(radius-.022,-.15),new Vector2(radius-.022,-.13),
    new Vector2(radius,-.115),new Vector2(radius-.02,-.082),
    new Vector2(radius-.055,-.061),new Vector2(radius-.09,-.052),
  ],[radius]);
  return <group>
    <mesh receiveShadow castShadow><latheGeometry args={[profile,96]}/>
      <meshStandardMaterial color={surfaces[subject].edge} roughness={.57} metalness={.22}/>
    </mesh>
    <mesh receiveShadow position={[0,-.052,0]} rotation={[-Math.PI/2,0,0]}>
      <circleGeometry args={[radius-.088,96]}/>
      <meshStandardMaterial map={map} color={map?'white':surfaces[subject].top} roughness={.87} metalness={.035}/>
    </mesh>
  </group>;
}
