'use client';

import { useMemo, Suspense, Component, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, PointsMaterial, Points, type Group } from 'three';
import { useGLTF } from '@react-three/drei';
import { useAssetPresence, shouldRenderGlb } from '../objects/useOptionalGLTF';

const GLB_PATH = '/models/tanker.glb';

class GlbBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function TruckGlb() {
  const { scene } = useGLTF(GLB_PATH) as unknown as { scene: Group };
  return <primitive object={scene} />;
}

function TruckBlock() {
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[3.2, 1.2, 1.4]} />
        <meshStandardMaterial color="#2a2f33" roughness={0.7} />
      </mesh>
      <mesh position={[1.9, 0.7, 0]}>
        <boxGeometry args={[1.1, 1.0, 1.4]} />
        <meshStandardMaterial color="#3a0f12" roughness={0.6} />
      </mesh>
    </group>
  );
}

function PourStream() {
  const points = useMemo(() => {
    const n = 40;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i*3] = (Math.random()-0.5)*0.2; pos[i*3+1] = -Math.random()*3; pos[i*3+2] = (Math.random()-0.5)*0.2; }
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    const m = new PointsMaterial({ size: 0.08, color: '#3f6f6a', transparent: true, opacity: 0.7 });
    return new Points(g, m);
  }, []);
  useFrame((_, dt) => {
    const p = points.geometry.getAttribute('position') as Float32BufferAttribute;
    for (let i = 0; i < p.count; i++) { let y = p.getY(i) - dt * 2.5; if (y < -3) y = 0; p.setY(i, y); }
    p.needsUpdate = true;
  });
  return <primitive object={points} />;
}

/** Far-distance shoreline + tanker pouring into the water (easter egg, spec §6.11). */
export function Tanker() {
  const status = useAssetPresence(GLB_PATH);
  const truck = shouldRenderGlb(status)
    ? <GlbBoundary fallback={<TruckBlock />}><Suspense fallback={<TruckBlock />}><TruckGlb /></Suspense></GlbBoundary>
    : <TruckBlock />;

  return (
    <group position={[-22, 0, -26]} rotation={[0, 0.5, 0]}>
      <mesh rotation={[-Math.PI / 2 + 0.35, 0, 0]} position={[0, 1.5, -4]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#15110d" roughness={1} />
      </mesh>
      <group position={[0, 1.6, 1]}>{truck}</group>
      <group position={[1.4, 0.2, 1]}><PourStream /></group>
    </group>
  );
}
