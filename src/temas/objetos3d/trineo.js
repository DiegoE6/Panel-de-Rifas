/**
 * Trineo con regalos, patines dorados y luces a los costados.
 * Geometría procedural: ni texturas ni modelos externos.
 */

export function trineo ({ THREE, V, mat, add, group, roundedBox, gift, bulbString }) {
  const root = group(null, 'trineo_con_regalos');
  const s = new THREE.Shape();
  s.moveTo(-0.62, 0.28); s.lineTo(0.42, 0.28);
  s.quadraticCurveTo(0.72, 0.28, 0.74, 0.58);
  s.quadraticCurveTo(0.75, 0.75, 0.62, 0.73);
  s.quadraticCurveTo(0.52, 0.71, 0.5, 0.61);
  s.quadraticCurveTo(0.46, 0.5, 0.3, 0.5);
  s.lineTo(-0.38, 0.5);
  s.quadraticCurveTo(-0.44, 0.5, -0.46, 0.62);
  s.lineTo(-0.5, 0.86);
  s.quadraticCurveTo(-0.52, 0.97, -0.62, 0.95);
  s.quadraticCurveTo(-0.72, 0.93, -0.7, 0.8);
  s.lineTo(-0.62, 0.28);
  const body = new THREE.ExtrudeGeometry(s, { depth: 0.64, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 5, curveSegments: 28 });
  body.translate(0, 0, -0.32);
  add(root, 'carroceria', body, mat.rojo);
  [-1, 1].forEach((side, i) => {
    const z = side * 0.362;
    add(root, `franja_${i + 1}`, roundedBox(1.0, 0.05, 0.016, 0.006), mat.dorado, [-0.06, 0.38, z + side * 0.003]);
    add(root, `voluta_${i + 1}`, new THREE.TorusGeometry(0.065, 0.016, 12, 40), mat.dorado, [0.63, 0.63, z + side * 0.004]);
    add(root, `voluta_tras_${i + 1}`, new THREE.TorusGeometry(0.05, 0.014, 12, 40), mat.dorado, [-0.6, 0.86, z + side * 0.004]);
    const rz = side * 0.3;
    const curve = new THREE.CatmullRomCurve3([V(-0.76, 0.09, rz), V(-0.7, 0.032, rz), V(-0.5, 0.026, rz), V(0.5, 0.026, rz),
      V(0.76, 0.06, rz), V(0.92, 0.2, rz), V(0.88, 0.34, rz), V(0.77, 0.32, rz)]);
    add(root, `patin_${i + 1}`, new THREE.TubeGeometry(curve, 120, 0.026, 16), mat.dorado);
    [-0.45, 0.3].forEach((x, j) => add(root, `soporte_${i + 1}_${j + 1}`, new THREE.CylinderGeometry(0.02, 0.02, 0.26, 16), mat.dorado, [x, 0.16, rz]));
    const pts = [];
    for (let k = 0; k <= 40; k++) { const u = k / 40, x = -0.58 + u * 1.1; pts.push(V(x, 0.47 - Math.abs(Math.sin(u * Math.PI * 3)) * 0.05, z + side * 0.03)); }
    bulbString(root, `luces_lado_${i + 1}`, pts, 4, 1.1);
  });
  add(root, 'cojin', roundedBox(0.66, 0.06, 0.62, 0.025), mat.salvia, [-0.04, 0.565, 0]);
  const y0 = 0.595;
  gift(root, 'regalo_1', 0.3, 0.26, 0.3, [-0.2, y0, -0.12], 0.25, mat.salvia, mat.crema);
  gift(root, 'regalo_2', 0.24, 0.2, 0.24, [0.12, y0, 0.14], -0.3, mat.crema, mat.rojo);
  gift(root, 'regalo_3', 0.2, 0.32, 0.2, [-0.24, y0, 0.2], 0.1, mat.dorado, mat.rojo);
  gift(root, 'regalo_4', 0.2, 0.17, 0.2, [-0.18, y0 + 0.26, -0.1], 0.7, mat.terracota, mat.crema);
  gift(root, 'regalo_5', 0.16, 0.14, 0.16, [0.12, y0, -0.17], 0.4, mat.rojo, mat.dorado);
  return root;
}
