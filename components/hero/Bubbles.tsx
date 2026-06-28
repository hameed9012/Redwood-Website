'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, BufferGeometry, Float32BufferAttribute, PointsMaterial } from 'three';

interface BubblesProps {
  count: number;
}

export function Bubbles({ count }: BubblesProps) {
  const ref = useRef<Points>(null);

  const { geometry, material, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = -1 - Math.random() * 10;
      speeds[i] = 0.15 + Math.random() * 0.4;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      size: 0.04,
      color: '#cfe8e6',
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    return { geometry, material, speeds };
  }, [count]);

  useFrame((_, delta) => {
    const pos = geometry.getAttribute('position') as Float32BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + speeds[i] * delta;
      if (y > 4) y = -4; // recycle to the bottom
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}
