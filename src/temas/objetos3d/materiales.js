/**
 * Materiales y helpers compartidos por los objetos 3D.
 *
 * Es una fábrica y no un módulo con materiales sueltos a propósito: la escena
 * se destruye al salir de la rifa (dispose de geometrías y materiales) y se
 * vuelve a armar al entrar. Si los materiales vivieran a nivel de módulo, la
 * segunda sesión heredaría materiales ya liberados.
 */
import * as THREE from 'three'

export function crearKit () {
  const V = (x, y, z) => new THREE.Vector3(x, y, z)
  const M = (name, color, roughness = 0.5, metalness = 0, extra = {}) =>
    Object.assign(new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra }), { name })

  const mat = {
    rojo: M('rojo', 0xc8352e, 0.42),
    terracota: M('terracota', 0xc67139, 0.55),
    salvia: M('salvia', 0x8a9c68, 0.6),
    pino: M('verde_pino', 0x3f6a3e, 0.7),
    crema: M('crema', 0xf7f0e3, 0.55),
    madera: M('madera', 0x8f5a33, 0.75),
    dorado: M('dorado', 0xe2ad45, 0.32, 0.35),
    jengibre: M('jengibre', 0xb8743e, 0.8),
    chocolate: M('chocolate', 0x5a3522, 0.6),
    carbon: M('carbon', 0x2a2522, 0.5),
    zanahoria: M('zanahoria', 0xe8792a, 0.5),
    nieve: M('nieve', 0xfbf8f2, 0.85),
    cable: M('cable', 0x2f4a2c, 0.6)
  }

  // Focos emisivos: la escena los hace parpadear cambiando emissiveIntensity
  const luces = [
    M('luz_amarilla', 0xffc94d, 0.3, 0, { emissive: 0xffb321 }),
    M('luz_roja', 0xff5b4a, 0.3, 0, { emissive: 0xff2a1a }),
    M('luz_verde', 0x9ee06b, 0.3, 0, { emissive: 0x5cc23a }),
    M('luz_blanca', 0xfff4dc, 0.3, 0, { emissive: 0xffe6b0 })
  ]

  function add (parent, name, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scale) {
    const mesh = new THREE.Mesh(geo, m)
    mesh.name = name; mesh.position.set(...pos); mesh.rotation.set(...rot)
    if (scale) mesh.scale.set(...scale)
    parent.add(mesh); return mesh
  }

  function group (parent, name, pos = [0, 0, 0], rot = [0, 0, 0]) {
    const g = new THREE.Group(); g.name = name; g.position.set(...pos); g.rotation.set(...rot)
    parent && parent.add(g); return g
  }

  function roundedBox (w, h, d, r) {
    const iw = w - 2 * r, ih = h - 2 * r, c = Math.min(iw, ih) * 0.25, s = new THREE.Shape()
    const x = -iw / 2, y = -ih / 2
    s.moveTo(x + c, y); s.lineTo(x + iw - c, y); s.quadraticCurveTo(x + iw, y, x + iw, y + c)
    s.lineTo(x + iw, y + ih - c); s.quadraticCurveTo(x + iw, y + ih, x + iw - c, y + ih)
    s.lineTo(x + c, y + ih); s.quadraticCurveTo(x, y + ih, x, y + ih - c)
    s.lineTo(x, y + c); s.quadraticCurveTo(x, y, x + c, y)
    const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 4, curveSegments: 6 })
    return g.center()
  }

  function gift (parent, name, w, h, d, pos, ry, box, ribbon) {
    const g = group(parent, name, pos, [0, ry, 0])
    add(g, `${name}_caja`, roundedBox(w, h, d, 0.018), box, [0, h / 2, 0])
    add(g, `${name}_cinta_a`, new THREE.BoxGeometry(w + 0.006, h + 0.006, 0.035), ribbon, [0, h / 2, 0])
    add(g, `${name}_cinta_b`, new THREE.BoxGeometry(0.035, h + 0.006, d + 0.006), ribbon, [0, h / 2, 0])
    const k = Math.min(w, d) / 0.26
    ;[-1, 1].forEach((s, i) => add(g, `${name}_lazo_${i + 1}`, new THREE.TorusGeometry(0.045 * k, 0.014 * k, 12, 32), ribbon,
      [s * 0.04 * k, h + 0.03 * k, 0], [0, 0, s * 0.55]))
    add(g, `${name}_nudo`, new THREE.SphereGeometry(0.022 * k, 16, 12), ribbon, [0, h + 0.012, 0])
    return g
  }

  const bulbGeo = new THREE.SphereGeometry(0.022, 20, 14)
  function bulbString (parent, name, pts, every, size = 1, wire = true) {
    const g = group(parent, name)
    if (wire) add(g, `${name}_cable`, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 4, 0.0045, 6), mat.cable)
    let n = 0
    for (let i = 0; i < pts.length; i += every) {
      const p = pts[i]
      add(g, `${name}_foco_${++n}`, bulbGeo, luces[n % luces.length], [p.x, p.y - 0.012 * size, p.z], [0, 0, 0], [size, size * 1.35, size])
    }
    return g
  }

  // Pseudoaleatorio determinista: la corona sale igual en cada montaje
  const rnd = (i, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x) }

  return { THREE, V, M, mat, luces, add, group, roundedBox, gift, bulbString, rnd }
}
