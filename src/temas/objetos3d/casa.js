/**
 * Casa de jengibre con glaseado, gomitas y bastones.
 * Geometría procedural: ni texturas ni modelos externos.
 */

export function casa ({ THREE, V, mat, luces, add, group, roundedBox, bulbString }) {
  const root = group(null, 'casa_de_jengibre');
  add(root, 'base_nieve', new THREE.CylinderGeometry(0.56, 0.58, 0.05, 64), mat.nieve, [0, 0.025, 0]);
  add(root, 'muros', roundedBox(0.6, 0.42, 0.5, 0.015), mat.jengibre, [0, 0.26, 0]);
  const tri = new THREE.Shape(); tri.moveTo(-0.25, 0); tri.lineTo(0.25, 0); tri.lineTo(0, 0.24); tri.lineTo(-0.25, 0);
  const attic = new THREE.ExtrudeGeometry(tri, { depth: 0.58, bevelEnabled: false }); attic.translate(0, 0, -0.29);
  add(root, 'atico', attic, mat.jengibre, [0, 0.469, 0], [0, Math.PI / 2, 0]);
  const th = Math.atan2(0.24, 0.25), half = 0.24;
  [-1, 1].forEach((s, i) => {
    const cy = 0.47 + 0.12 + 0.03, cz = s * 0.125;
    add(root, `techo_${i + 1}`, roundedBox(0.74, 0.05, 2 * half, 0.018), mat.chocolate, [0, cy, cz + s * 0.02], [s * th, 0, 0]);
    const ey = cy - Math.sin(th) * half - 0.005, ez = cz + s * (Math.cos(th) * half + 0.02);
    add(root, `glaseado_alero_${i + 1}`, new THREE.CylinderGeometry(0.02, 0.02, 0.76, 16), mat.crema, [0, ey, ez], [0, 0, Math.PI / 2]);
    for (let k = 0; k < 9; k++) add(root, `glaseado_gota_${i + 1}_${k + 1}`, new THREE.SphereGeometry(0.018, 14, 10), mat.crema, [-0.34 + k * 0.085, ey - 0.02, ez], [0, 0, 0], [1, 1.4, 1]);
    for (let k = 0; k < 4; k++) add(root, `glaseado_teja_${i + 1}_${k + 1}`, new THREE.CylinderGeometry(0.008, 0.008, 0.72, 8), mat.crema,
      [0, cy - (-0.12 + k * 0.08) * Math.sin(th) + 0.028 * Math.cos(th), cz + s * 0.02 + s * (-0.12 + k * 0.08) * Math.cos(th) + s * 0.028 * Math.sin(th)], [0, 0, Math.PI / 2]);
    const pts = [];
    for (let k = 0; k <= 40; k++) { const u = k / 40; pts.push(V(-0.36 + u * 0.72, ey - 0.04 - Math.abs(Math.sin(u * Math.PI * 4)) * 0.03, ez + s * 0.01)); }
    bulbString(root, `luces_alero_${i + 1}`, pts, 5, 1);
  });
  for (let k = 0; k < 6; k++) add(root, `gomita_${k + 1}`, new THREE.SphereGeometry(0.03, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), [mat.rojo, mat.salvia, mat.terracota][k % 3], [-0.3 + k * 0.12, 0.74, 0]);
  add(root, 'chimenea', roundedBox(0.1, 0.2, 0.1, 0.01), mat.terracota, [0.17, 0.72, -0.12]);
  add(root, 'chimenea_nieve', roundedBox(0.12, 0.03, 0.12, 0.012), mat.nieve, [0.17, 0.83, -0.12]);
  add(root, 'puerta', roundedBox(0.14, 0.22, 0.03, 0.01), mat.chocolate, [0, 0.16, 0.255]);
  add(root, 'puerta_marco', new THREE.TorusGeometry(0.07, 0.012, 10, 32, Math.PI), mat.crema, [0, 0.2, 0.268]);
  add(root, 'puerta_perilla', new THREE.SphereGeometry(0.012, 12, 8), mat.dorado, [0.04, 0.15, 0.272]);
  [-1, 1].forEach((s, i) => {
    add(root, `ventana_${i + 1}`, roundedBox(0.11, 0.11, 0.02, 0.008), luces[0], [s * 0.19, 0.3, 0.252]);
    add(root, `ventana_${i + 1}_cruz_v`, new THREE.BoxGeometry(0.012, 0.12, 0.012), mat.crema, [s * 0.19, 0.3, 0.264]);
    add(root, `ventana_${i + 1}_cruz_h`, new THREE.BoxGeometry(0.12, 0.012, 0.012), mat.crema, [s * 0.19, 0.3, 0.264]);
    add(root, `ventana_lat_${i + 1}`, roundedBox(0.02, 0.12, 0.12, 0.008), luces[0], [s * 0.302, 0.3, 0]);
    const cane = group(root, `baston_${i + 1}`, [s * 0.13, 0.05, 0.33]);
    add(cane, `baston_${i + 1}_palo`, new THREE.CylinderGeometry(0.014, 0.014, 0.2, 16), mat.crema, [0, 0.1, 0]);
    for (let k = 0; k < 4; k++) add(cane, `baston_${i + 1}_raya_${k + 1}`, new THREE.TorusGeometry(0.0145, 0.004, 6, 20), mat.rojo, [0, 0.03 + k * 0.045, 0], [Math.PI / 2 + 0.4, 0, 0]);
    add(cane, `baston_${i + 1}_curva`, new THREE.TorusGeometry(0.035, 0.014, 12, 24, Math.PI), mat.rojo, [s * -0.035, 0.2, 0], [0, 0, 0]);
  });
  return root;
}
