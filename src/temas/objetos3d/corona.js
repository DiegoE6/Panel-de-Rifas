/**
 * Corona de pino con bayas, luces y moño.
 * Geometría procedural: ni texturas ni modelos externos.
 */

export function corona ({ THREE, V, mat, add, group, roundedBox, bulbString, rnd }) {
  const root = group(null, 'corona_navidena');
  const R = 0.32;
  add(root, 'aro', new THREE.TorusGeometry(R, 0.085, 24, 72), mat.pino, [0, 0, 0]);
  for (let i = 0; i < 54; i++) {
    const a = (i / 54) * Math.PI * 2, rr = R + (rnd(i) - 0.5) * 0.11, z = (rnd(i, 2) - 0.3) * 0.08;
    add(root, `hoja_${i + 1}`, new THREE.SphereGeometry(0.06, 20, 12), i % 3 ? mat.pino : mat.salvia,
      [Math.cos(a) * rr, Math.sin(a) * rr, z], [rnd(i, 3) * 3, rnd(i, 4) * 3, a], [1.5, 0.75, 0.6]);
  }
  for (let c = 0; c < 7; c++) {
    const a = -Math.PI / 2 + ((c + 0.5) / 7) * Math.PI * 2 * 0.86 + 0.45;
    for (let b = 0; b < 3; b++) {
      const o = b * 2.1;
      add(root, `baya_${c + 1}_${b + 1}`, new THREE.SphereGeometry(0.024, 16, 10), mat.rojo, [Math.cos(a) * R + Math.cos(o) * 0.026, Math.sin(a) * R + Math.sin(o) * 0.026, 0.1]);
    }
  }
  const pts = [];
  for (let i = 0; i <= 200; i++) { const a = (i / 200) * Math.PI * 2, w = Math.sin(a * 9) * 0.06; pts.push(V(Math.cos(a) * (R + w), Math.sin(a) * (R + w), 0.095 + Math.cos(a * 9) * 0.02)); }
  bulbString(root, 'luces', pts, 10, 1.15, false);
  const bow = group(root, 'mono', [0, -R - 0.02, 0.12]);
  [-1, 1].forEach((s, i) => {
    add(bow, `mono_lazo_${i + 1}`, new THREE.TorusGeometry(0.07, 0.028, 14, 36), mat.rojo, [s * 0.075, 0.02, 0], [0, s * 0.3, s * 0.35], [1.25, 0.8, 1]);
    add(bow, `mono_cola_${i + 1}`, roundedBox(0.05, 0.16, 0.018, 0.007), mat.rojo, [s * 0.05, -0.1, -0.01], [0, 0, s * 0.35]);
  });
  add(bow, 'mono_nudo', new THREE.SphereGeometry(0.036, 20, 14), mat.rojo, [0, 0.02, 0.01], [0, 0, 0], [1, 1, 0.8]);
  return root;
}
