/**
 * Muñeco de nieve con bufanda, sombrero de copa y luces.
 * Geometría procedural: ni texturas ni modelos externos.
 */

export function muneco ({ THREE, V, mat, add, group, roundedBox, bulbString }) {
  const root = group(null, 'muneco_de_nieve');
  add(root, 'cuerpo_base', new THREE.SphereGeometry(0.32, 48, 32), mat.nieve, [0, 0.3, 0], [0, 0, 0], [1, 0.94, 1]);
  add(root, 'cuerpo_medio', new THREE.SphereGeometry(0.23, 48, 32), mat.nieve, [0, 0.76, 0]);
  add(root, 'cabeza', new THREE.SphereGeometry(0.17, 48, 32), mat.nieve, [0, 1.11, 0]);
  const onSphere = (c, r, ay, ax, out = 0) => {
    const d = V(Math.sin(ay) * Math.cos(ax), Math.sin(ax), Math.cos(ay) * Math.cos(ax));
    return [c[0] + d.x * (r + out), c[1] + d.y * (r + out), c[2] + d.z * (r + out)];
  };
  const head = [0, 1.11, 0];
  [-1, 1].forEach((s, i) => add(root, `ojo_${i + 1}`, new THREE.SphereGeometry(0.022, 16, 12), mat.carbon, onSphere(head, 0.17, s * 0.38, 0.22, -0.004)));
  add(root, 'nariz', new THREE.ConeGeometry(0.026, 0.15, 24), mat.zanahoria, [0, 1.1, 0.24], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 5; i++) add(root, `boca_${i + 1}`, new THREE.SphereGeometry(0.012, 12, 8), mat.carbon, onSphere(head, 0.17, (i - 2) * 0.2, -0.28 - Math.cos((i - 2) * 0.5) * 0.06 + 0.06));
  [0.3, 0.12, -0.08].forEach((ax, i) => add(root, `boton_${i + 1}`, new THREE.SphereGeometry(0.024, 16, 12), mat.carbon, onSphere([0, 0.76, 0], 0.23, 0, ax, -0.004)));
  add(root, 'bufanda', new THREE.TorusGeometry(0.15, 0.045, 16, 48), mat.rojo, [0, 0.96, 0], [Math.PI / 2, 0, 0]);
  add(root, 'bufanda_punta', roundedBox(0.09, 0.26, 0.04, 0.015), mat.rojo, [0.1, 0.84, 0.17], [0.25, 0, 0.18]);
  [0, 1, 2].forEach(k => add(root, `bufanda_raya_${k + 1}`, new THREE.BoxGeometry(0.095, 0.018, 0.045), mat.crema, [0.1 - k * 0.012, 0.77 + k * 0.05, 0.19 - k * 0.012], [0.25, 0, 0.18]));
  add(root, 'sombrero_ala', new THREE.CylinderGeometry(0.2, 0.2, 0.025, 48), mat.carbon, [0, 1.255, 0]);
  add(root, 'sombrero_copa', new THREE.CylinderGeometry(0.12, 0.125, 0.2, 48), mat.carbon, [0, 1.365, 0]);
  add(root, 'sombrero_banda', new THREE.CylinderGeometry(0.128, 0.128, 0.04, 48), mat.salvia, [0, 1.29, 0]);
  add(root, 'acebo_hoja_1', new THREE.SphereGeometry(0.03, 16, 10), mat.pino, [0.07, 1.3, 0.11], [0, 0, 0.6], [1.6, 0.6, 0.4]);
  add(root, 'acebo_hoja_2', new THREE.SphereGeometry(0.03, 16, 10), mat.pino, [0.02, 1.31, 0.125], [0, 0, -0.5], [1.6, 0.6, 0.4]);
  add(root, 'acebo_baya', new THREE.SphereGeometry(0.016, 12, 8), mat.rojo, [0.045, 1.3, 0.132]);
  [-1, 1].forEach((s, i) => {
    const arm = group(root, `brazo_${i + 1}`, [s * 0.2, 0.82, 0], [0, 0, -s * 1.0]);
    add(arm, `brazo_${i + 1}_rama`, new THREE.CylinderGeometry(0.012, 0.018, 0.42, 10), mat.madera, [0, 0.21, 0]);
    add(arm, `brazo_${i + 1}_dedo_1`, new THREE.CylinderGeometry(0.008, 0.01, 0.1, 8), mat.madera, [s * 0.03, 0.4, 0], [0, 0, -s * 0.6]);
    add(arm, `brazo_${i + 1}_dedo_2`, new THREE.CylinderGeometry(0.008, 0.01, 0.1, 8), mat.madera, [-s * 0.03, 0.38, 0], [0, 0, s * 0.6]);
  });
  const pts = [];
  for (let i = 0; i <= 120; i++) { const u = i / 120, a = u * Math.PI * 2 * 1.5 + 0.4, y = 0.16 + u * 0.32; pts.push(V(Math.sin(a) * 0.335 * Math.sqrt(1 - ((y - 0.3) / 0.32) ** 2) + 0.0, y, Math.cos(a) * 0.335 * Math.sqrt(1 - ((y - 0.3) / 0.32) ** 2))); }
  bulbString(root, 'luces', pts, 8, 1.2);
  return root;
}
