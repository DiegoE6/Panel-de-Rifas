/**
 * Árbol de Navidad en maceta, con esferas, serie de luces y estrella.
 * Geometría procedural: ni texturas ni modelos externos.
 */

export function arbol ({ THREE, V, M, mat, add, group, gift, bulbString }) {
  const root = group(null, 'arbol_de_navidad');
  const pot = [[0, 0], [0.16, 0], [0.2, 0.22], [0.23, 0.22], [0.23, 0.27], [0, 0.27]].map(p => new THREE.Vector2(...p));
  add(root, 'maceta', new THREE.LatheGeometry(pot, 48), mat.terracota);
  add(root, 'tronco', new THREE.CylinderGeometry(0.06, 0.07, 0.3, 24), mat.madera, [0, 0.38, 0]);
  const tiers = [{ r: 0.6, h: 0.55, y: 0.45 }, { r: 0.48, h: 0.5, y: 0.8 }, { r: 0.36, h: 0.45, y: 1.1 }, { r: 0.24, h: 0.38, y: 1.37 }];
  tiers.forEach((t, i) => {
    add(root, `copa_${i + 1}`, new THREE.ConeGeometry(t.r, t.h, 48), i % 2 ? mat.salvia : mat.pino, [0, t.y + t.h / 2, 0]);
    add(root, `copa_${i + 1}_borde`, new THREE.TorusGeometry(t.r - 0.015, 0.03, 12, 48), i % 2 ? mat.salvia : mat.pino, [0, t.y + 0.015, 0], [Math.PI / 2, 0, 0]);
  });
  let n = 0;
  tiers.forEach((t, i) => {
    const count = [8, 6, 5, 3][i];
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2 + i * 0.7, r = 0.04 - i * 0.004, rr = t.r + r * 0.6;
      const g = group(root, `esfera_${++n}`);
      add(g, `esfera_${n}_bola`, new THREE.SphereGeometry(r, 32, 16), [mat.rojo, mat.dorado, mat.crema][(k + i) % 3], [Math.cos(a) * rr, t.y - r * 0.6, Math.sin(a) * rr]);
      add(g, `esfera_${n}_tapa`, new THREE.CylinderGeometry(r * 0.3, r * 0.3, r * 0.35, 12), mat.dorado, [Math.cos(a) * rr, t.y + r * 0.35, Math.sin(a) * rr]);
    }
  });
  const pts = [];
  for (let i = 0; i <= 260; i++) {
    const u = i / 260, y = 0.55 + u * 1.12;
    const r = Math.max(0, ...tiers.filter(t => y >= t.y && y <= t.y + t.h).map(t => t.r * (1 - (y - t.y) / t.h))) + 0.02;
    const a = u * Math.PI * 2 * 4;
    pts.push(V(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  bulbString(root, 'luces', pts, 7, 1.1);
  const st = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.055 : 0.13, a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const sg = new THREE.ExtrudeGeometry(st, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 4 }).center();
  add(root, 'estrella', sg, M('estrella', 0xffd166, 0.3, 0, { emissive: 0xffb321, emissiveIntensity: 0.6 }), [0, 1.86, 0]);
  gift(root, 'regalo_1', 0.26, 0.22, 0.26, [0.45, 0, 0.25], 0.3, mat.rojo, mat.crema);
  gift(root, 'regalo_2', 0.2, 0.15, 0.2, [0.1, 0, 0.5], -0.2, mat.salvia, mat.dorado);
  return root;
}
