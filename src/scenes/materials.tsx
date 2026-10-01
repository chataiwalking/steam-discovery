import { DataTexture, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat, SRGBColorSpace } from 'three';

export type MaterialKind = 'wood' | 'metal' | 'stone' | 'ground' | 'water' | 'glass' | 'paint';

// Small, deterministic procedural surface maps. Shared across every exhibit;
// no third-party texture request is made by the running application.
const textures = new Map<string, DataTexture>();
function noise(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function smoothNoise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  return (noise(ix, iy) * (1 - fx) + noise(ix + 1, iy) * fx) * (1 - fy)
    + (noise(ix, iy + 1) * (1 - fx) + noise(ix + 1, iy + 1) * fx) * fy;
}
export function surfaceTexture(kind: MaterialKind) {
  const cached = textures.get(kind);
  if (cached) return cached;
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const broad = smoothNoise(x / 28, y / 28);
    const fine = noise(x, y);
    let value = .8;
    if (kind === 'wood') {
      const grain = Math.sin(x * .6 + smoothNoise(x / 55, y / 120) * 12 + Math.sin(y / 40) * 1.6);
      value = .65 + grain * .1 + smoothNoise(x / 3, y / 90) * .14 + fine * .05;
    } else if (kind === 'metal') value = .88 + smoothNoise(x / 75, y * 3) * .08 + fine * .04;
    else if (kind === 'stone' || kind === 'ground') value = .55 + broad * .28 + smoothNoise(x / 5, y / 5) * .12 + fine * .05;
    else if (kind === 'water') value = .5 + Math.sin(x * .2 + broad * 4) * .12 + Math.cos(y * .25 + x * .08) * .09;
    const p = (y * size + x) * 4;
    data[p] = data[p + 1] = data[p + 2] = value * 255; data[p + 3] = 255;
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(kind === 'wood' ? 2 : 3, kind === 'wood' ? 1 : 3);
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  textures.set(kind, texture);
  return texture;
}

export function cloudTexture() {
  const cached = textures.get('cloud');
  if (cached) return cached;
  const size = 128, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const nx = (x / size - .5) * 2, ny = (y / size - .5) * 2;
    const edge = Math.max(0, 1 - nx * nx - ny * ny);
    const n = smoothNoise(x / 20, y / 20) * .6 + smoothNoise(x / 7, y / 7) * .3;
    const p = (y * size + x) * 4;
    data[p] = data[p + 1] = data[p + 2] = 255;
    data[p + 3] = Math.min(1, Math.pow(edge, 1.6) * (.25 + n) * 1.5) * 255;
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  textures.set('cloud', texture);
  return texture;
}

export function PhysicalMaterial({ kind = 'paint', color, roughness }: {
  kind?: MaterialKind; color?: string; roughness?: number;
}) {
  const defaults = {
    wood: ['#a37b4c', .55, 0], metal: ['#9faab1', .26, .94],
    stone: ['#b2b0a8', .83, 0], ground: ['#6c7156', .94, 0],
    water: ['#376e7b', .15, .15], glass: ['#b2ced2', .12, .12],
    paint: ['#c8ced0', .36, .08],
  } as const;
  const [base, defaultRoughness, metalness] = defaults[kind];
  const textured = kind !== 'glass' && kind !== 'paint';
  const texture = textured ? surfaceTexture(kind) : undefined;
  return <meshPhysicalMaterial
    color={color ?? base} roughness={roughness ?? defaultRoughness} metalness={metalness}
    map={kind === 'wood' || kind === 'stone' || kind === 'ground' ? texture : undefined}
    bumpMap={texture} bumpScale={kind === 'metal' ? .006 : kind === 'water' ? .032 : .035}
    clearcoat={kind === 'paint' ? .42 : kind === 'wood' ? .15 : kind === 'water' ? 1 : .05}
    clearcoatRoughness={kind === 'water' ? .1 : .3}
    envMapIntensity={kind === 'metal' ? 1.15 : kind === 'water' || kind === 'glass' ? 1 : .45}
    transparent={kind === 'glass'} opacity={kind === 'glass' ? .45 : 1}
    depthWrite={kind !== 'glass'}
  />;
}
