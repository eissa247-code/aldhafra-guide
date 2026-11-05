// ink.js — أدوات رسم «المجسّمات الورقية بالحبر»: خطوط متعرجة بخط اليد + أسطح ورقية + لافتات نصية
import * as THREE from 'three';
import { LineSegments2 } from './vendor/lines/LineSegments2.js';
import { LineSegmentsGeometry } from './vendor/lines/LineSegmentsGeometry.js';
import { LineMaterial } from './vendor/lines/LineMaterial.js';

export const C = {
  ink: 0x1d2735, paper: 0xf6efe0, lemon: 0xf4c430, leaf: 0x7cb85f, sky: 0x62a8dc,
  coral: 0xe66a50, plum: 0x8f6cb8, teal: 0x2f9d94, orange: 0xf2902f, cream: 0xfff6d8,
};

// ---------- عشوائية ثابتة (حتى لا تتغير الرسمة بين الفتحات) ----------
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- مواد الخطوط (تُحدَّث دقتها عند تغيير حجم النافذة) ----------
const lineMats = new Set();
let RES = new THREE.Vector2(1280, 720);
export function setInkResolution(w, h) {
  RES.set(w, h);
  lineMats.forEach((m) => m.resolution.set(w, h));
}

function inkMaterial(color, width, opacity) {
  const m = new LineMaterial({ color, linewidth: width, transparent: true, opacity, worldUnits: false, depthWrite: false });
  m.resolution.copy(RES);
  lineMats.add(m);
  return m;
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();

// يحوّل زوج نقطتين إلى مقاطع متعرجة (عدة تمريرات = أثر القلم المكرر)
function sketchEdge(a, b, rnd, j, passes, out) {
  _d.subVectors(b, a);
  const len = _d.length();
  if (len < 1e-5) return;
  const pieces = Math.max(1, Math.round(len / 1.4));
  for (let p = 0; p < passes; p++) {
    const amp = j * (p === 0 ? 0.55 : 1) * Math.min(1, 0.35 + len * 0.5);
    const ov = p === 0 ? 0.004 : rnd() * 0.03;
    let prev = null;
    for (let k = 0; k <= pieces; k++) {
      const t = k / pieces;
      const pt = new THREE.Vector3().lerpVectors(a, b, t);
      if (k === 0) pt.addScaledVector(_d, -ov);
      if (k === pieces) pt.addScaledVector(_d, ov + (p ? 0.01 : 0));
      const edgeFade = k === 0 || k === pieces ? 0.4 : 1;
      pt.x += (rnd() - 0.5) * 2 * amp * edgeFade;
      pt.y += (rnd() - 0.5) * 2 * amp * edgeFade;
      pt.z += (rnd() - 0.5) * 2 * amp * edgeFade;
      if (prev) out.push(prev.x, prev.y, prev.z, pt.x, pt.y, pt.z);
      prev = pt;
    }
  }
}

function toLine(positions, { color = C.ink, width = 2.1, opacity = 1 } = {}) {
  const g = new LineSegmentsGeometry();
  g.setPositions(positions);
  const line = new LineSegments2(g, inkMaterial(color, width, opacity));
  line.userData.total = g.instanceCount;
  line.userData.isInk = true;
  line.frustumCulled = false;
  line.renderOrder = 2;
  return line;
}

// حبر من حواف مجسم
export function inkEdges(geom, { j = 0.012, passes = 2, seed = 7, threshold = 20, ...style } = {}) {
  const eg = new THREE.EdgesGeometry(geom, threshold);
  const p = eg.attributes.position.array;
  const rnd = rng(seed);
  const out = [];
  for (let i = 0; i < p.length; i += 6) {
    _a.set(p[i], p[i + 1], p[i + 2]);
    _b.set(p[i + 3], p[i + 4], p[i + 5]);
    sketchEdge(_a.clone(), _b.clone(), rnd, j, passes, out);
  }
  eg.dispose();
  return toLine(out, style);
}

// حبر من خط متعدد النقاط
export function inkPath(points, { j = 0.01, passes = 2, seed = 3, closed = false, ...style } = {}) {
  const rnd = rng(seed);
  const out = [];
  const n = points.length;
  for (let i = 0; i < n - (closed ? 0 : 1); i++) {
    sketchEdge(points[i], points[(i + 1) % n], rnd, j, passes, out);
  }
  return toLine(out, style);
}

// خط متقطع
export function inkDashed(a, b, { dash = 0.14, gap = 0.1, ...style } = {}) {
  const len = a.distanceTo(b);
  const out = [];
  const dir = b.clone().sub(a).normalize();
  for (let s = 0; s < len; s += dash + gap) {
    const e = Math.min(s + dash, len);
    const p = a.clone().addScaledVector(dir, s), q = a.clone().addScaledVector(dir, e);
    out.push(p.x, p.y, p.z, q.x, q.y, q.z);
  }
  return toLine(out, style);
}

// ---------- أسطح ورقية ملوّنة تلقي ظلاً ----------
export function fillMat(color, opacity = 0.92) {
  const m = new THREE.MeshStandardMaterial({
    color, roughness: 0.92, metalness: 0, transparent: true, opacity,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  m.userData.baseOpacity = opacity;
  return m;
}

// صندوق قاعدته على y=0، مع حبر وإمكانية اللمس
export function block(w, h, d, { fill = C.lemon, op = 0.92, id, seed = 1, j = 0.011, passes = 2, width = 2 } = {}) {
  const g = new THREE.Group();
  const geom = new THREE.BoxGeometry(w, h, d);
  geom.translate(0, h / 2, 0);
  const mesh = new THREE.Mesh(geom, fillMat(fill, op));
  mesh.castShadow = true;
  const edges = inkEdges(geom, { j, passes, seed, width });
  g.add(mesh, edges);
  mesh.userData.id = id;
  mesh.userData.group = g;
  g.userData = { mesh, edges, id, w, h, d };
  g.userData.setFill = (c) => mesh.material.color.set(c);
  return g;
}

// أسطوانة (عجلات، أكواب…)
export function cylinder(rt, rb, h, { fill = C.sky, op = 0.92, seg = 14, id, seed = 4, axis = 'y' } = {}) {
  const g = new THREE.Group();
  const geom = new THREE.CylinderGeometry(rt, rb, h, seg);
  if (axis === 'x') geom.rotateZ(Math.PI / 2);
  if (axis === 'z') geom.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geom, fillMat(fill, op));
  mesh.castShadow = true;
  mesh.userData.id = id; mesh.userData.group = g;
  g.add(mesh, inkEdges(geom, { j: 0.008, passes: 2, seed, threshold: 25 }));
  g.userData = { mesh, id };
  return g;
}

// ---------- لافتات نصية (Sprite) ----------
const hasArabic = (s) => /[؀-ۿ]/.test(s);

function drawLabel(sprite, text, o) {
  const px = 64;
  const lines = String(text).split('\n');
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const font = `${o.weight} ${px}px "Aref Ruqaa", "Amiri", serif`;
  ctx.font = font;
  const wmax = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const padX = o.chip ? px * 0.55 : px * 0.25, padY = o.chip ? px * 0.32 : px * 0.15;
  const lh = px * 1.3;
  c.width = Math.ceil(wmax + padX * 2);
  c.height = Math.ceil(lines.length * lh + padY * 2);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (o.chip) {
    const r = px * 0.4, w = c.width - 6, h = c.height - 6;
    ctx.beginPath();
    ctx.roundRect(3, 3, w, h, r);
    ctx.fillStyle = o.chipColor;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1d2735';
    ctx.stroke();
  }
  ctx.fillStyle = o.color;
  lines.forEach((l, i) => {
    ctx.direction = hasArabic(l) ? 'rtl' : 'ltr';
    ctx.fillText(l, c.width / 2, padY + lh * (i + 0.5) + 2);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  if (sprite.material.map) sprite.material.map.dispose();
  sprite.material.map = tex;
  sprite.material.needsUpdate = true;
  sprite.scale.set((c.width / px) * o.size, (c.height / px) * o.size, 1);
}

export function label(text, opts = {}) {
  const o = { size: 0.42, color: '#1d2735', weight: 700, chip: false, chipColor: '#fff6d8', ...opts };
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false }));
  sprite.renderOrder = 10;
  drawLabel(sprite, text, o);
  sprite.userData.setText = (t, patch) => drawLabel(sprite, t, Object.assign(o, patch));
  sprite.userData.opts = o;
  return sprite;
}

// زر مجسّم يظهر على الصفحة (لافتة ملوّنة قابلة للمس)
export function button(text, id, { color = '#ffe9a8', size = 0.44 } = {}) {
  const s = label(text, { chip: true, chipColor: color, size, weight: 700 });
  s.userData.id = id;
  s.userData.isButton = true;
  return s;
}

// ---------- قاعدة الورق التي «تنبثق» منها المجسمات ----------
export function stage(w, d, { fill = 0xfffaf0 } = {}) {
  const g = new THREE.Group();
  const geom = new THREE.BoxGeometry(w, 0.05, d);
  geom.translate(0, 0.025, 0);
  const mesh = new THREE.Mesh(geom, fillMat(fill, 1));
  mesh.receiveShadow = true;
  g.add(mesh);
  const hw = w / 2, hd = d / 2, y = 0.06;
  const c = [new THREE.Vector3(-hw, y, -hd), new THREE.Vector3(hw, y, -hd), new THREE.Vector3(hw, y, hd), new THREE.Vector3(-hw, y, hd)];
  for (let i = 0; i < 4; i++) g.add(inkDashed(c[i], c[(i + 1) % 4], { dash: 0.18, gap: 0.12, width: 1.4, opacity: 0.55 }));
  return g;
}

// ---------- أدوات الحركة ----------
export const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// نموذج ثلاثي الأبعاد لدرس واحد
export class Model {
  constructor() {
    this.group = new THREE.Group();
    this.hits = [];
    this.inks = [];
    this.tweens = [];
    this.f = 0; // تقدّم الظهور 0..1
    this.hover = null;
    this.onTap = () => {};
    this.updaters = [];
  }
  add(obj, parent = this.group) {
    parent.add(obj);
    obj.traverse((o) => {
      if (o.userData?.isInk) { o.userData.order = this.inks.length; this.inks.push(o); }
      if ((o.isMesh && o.userData.id) || (o.isSprite && o.userData.isButton)) this.hits.push(o);
    });
    return obj;
  }
  // حركة انسيابية لخاصية موضع/مقياس
  to(obj, { pos, scale, rotY, speed = 9 } = {}) {
    const t = this.tweens.find((x) => x.obj === obj) || (this.tweens.push({ obj }), this.tweens[this.tweens.length - 1]);
    if (pos) t.pos = pos;
    if (scale) t.scale = scale;
    if (rotY !== undefined) t.rotY = rotY;
    t.speed = speed;
  }
  setReveal(f) {
    this.f = f;
    const e = easeOutBack(Math.min(1, f));
    this.group.scale.y = Math.max(0.001, e);
    const total = this.inks.length || 1;
    for (const ink of this.inks) {
      const delay = (ink.userData.order / total) * 0.45;
      const p = THREE.MathUtils.clamp((f - delay) / 0.55, 0, 1);
      ink.geometry.instanceCount = Math.floor(ink.userData.total * p);
      ink.visible = p > 0;
    }
    const a = THREE.MathUtils.clamp(f * 1.6 - 0.2, 0, 1);
    this.group.traverse((o) => {
      if (o.isMesh && o.material.userData?.baseOpacity !== undefined) o.material.opacity = o.material.userData.baseOpacity * a;
      if (o.isSprite) o.material.opacity = a;
    });
  }
  update(dt, t) {
    for (const tw of this.tweens) {
      const k = 1 - Math.exp(-tw.speed * dt);
      if (tw.pos) tw.obj.position.lerp(tw.pos, k);
      if (tw.scale) tw.obj.scale.lerp(tw.scale, k);
      if (tw.rotY !== undefined) tw.obj.rotation.y += (tw.rotY - tw.obj.rotation.y) * k;
    }
    for (const u of this.updaters) u(dt, t);
  }
  remove(obj) {
    const set = new Set();
    obj.traverse((o) => set.add(o));
    obj.parent?.remove(obj);
    this.inks = this.inks.filter((o) => !set.has(o));
    this.hits = this.hits.filter((o) => !set.has(o));
    if (set.has(this.hover)) this.hover = null;
    this.tweens = this.tweens.filter((t) => !set.has(t.obj));
    obj.traverse((o) => {
      o.geometry?.dispose?.();
      if (o.material) { lineMats.delete(o.material); o.material.map?.dispose?.(); o.material.dispose(); }
    });
  }
  setHover(mesh) {
    if (this.hover === mesh) return;
    const apply = (m, on) => {
      const mat = m?.material;
      if (mat && mat.emissive) { mat.emissive.setHex(on ? 0x553a00 : 0x000000); }
      if (m?.isSprite) m.scale.multiplyScalar(on ? 1.06 : 1 / 1.06);
    };
    apply(this.hover, false);
    this.hover = mesh;
    apply(mesh, true);
  }
  dispose() {
    this.group.traverse((o) => {
      o.geometry?.dispose?.();
      if (o.material) {
        const arr = Array.isArray(o.material) ? o.material : [o.material];
        arr.forEach((m) => { lineMats.delete(m); m.map?.dispose?.(); m.dispose(); });
      }
    });
  }
}
