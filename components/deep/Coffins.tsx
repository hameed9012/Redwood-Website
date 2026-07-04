'use client';

/**
 * A few dark boxes settled on the bed near the sunken logo (spec §3). Dim,
 * tilted, deliberately off-centre — visible if you look, never the subject.
 * No light is called to them; they read as silhouettes in the deep fog.
 */
const COFFINS: { p: [number, number, number]; r: [number, number, number]; s: [number, number, number] }[] = [
  { p: [-6, -9.6, -3], r: [0.05, 0.4, 0.08], s: [1.1, 0.5, 2.6] },
  { p: [5, -9.5, -8], r: [-0.06, -0.7, 0.12], s: [1.0, 0.45, 2.4] },
  { p: [-3, -9.7, -12], r: [0.03, 1.1, -0.05], s: [1.15, 0.5, 2.7] },
  { p: [9, -9.6, 1], r: [0.0, 0.2, 0.1], s: [1.0, 0.45, 2.3] },
];

export function Coffins() {
  return (
    <group>
      {COFFINS.map((c, i) => (
        <mesh key={i} position={c.p} rotation={c.r}>
          <boxGeometry args={c.s} />
          <meshStandardMaterial color="#0a0f10" roughness={0.95} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}
