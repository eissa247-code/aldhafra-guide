// book.js — الكتاب المفتوح على المكتب: الهندسة، الإضاءة، الكاميرا، قلب الصفحات
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from './vendor/CSS3DRenderer.js';
import { t } from './i18n.js';
import { setInkResolution, rng, easeInOut } from './ink.js';

export const PW = 6, PH = 8, STACK = 0.34, COVER = 0.14, BASE = COVER + STACK;
export const pageY = (d) => BASE - 0.2 * Math.exp(-((d / 0.85) ** 2));
export const PAGE_PX = { w: 720, h: 960 };

// ---------------- خامات إجرائية ----------------
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, { repeat, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

function woodTexture() {
  const c = canvas(2048, 1024), x = c.getContext('2d'), r = rng(5);
  const planks = 6, ph = c.height / planks;
  for (let p = 0; p < planks; p++) {
    const hue = 28 + r() * 6, l = 28 + r() * 8;
    x.fillStyle = `hsl(${hue} 38% ${l}%)`;
    x.fillRect(0, p * ph, c.width, ph);
    for (let i = 0; i < 160; i++) {
      const y0 = p * ph + r() * ph, amp = 1 + r() * 4, f = 0.002 + r() * 0.004, ph0 = r() * 6;
      x.strokeStyle = `rgba(${r() > 0.5 ? '30,15,5' : '200,150,90'},${0.04 + r() * 0.07})`;
      x.lineWidth = 0.6 + r() * 1.6;
      x.beginPath();
      for (let xx = 0; xx <= c.width; xx += 24) { const yy = y0 + Math.sin(xx * f + ph0) * amp; xx ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
      x.stroke();
    }
    x.fillStyle = 'rgba(20,10,0,0.55)'; x.fillRect(0, p * ph, c.width, 3);
    for (let s = 0; s < 3; s++) { const sx = r() * c.width; x.fillStyle = 'rgba(20,10,0,0.4)'; x.fillRect(sx, p * ph + 1, 2, ph - 2); }
  }
  const img = x.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < img.data.length; i += 4) { const n = (r() - 0.5) * 12; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
  x.putImageData(img, 0, 0);
  return tex(c);
}

function clothTexture() {
  const c = canvas(256, 256), x = c.getContext('2d'), r = rng(9);
  x.fillStyle = '#f0bf30'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 3) {
    x.fillStyle = `rgba(120,70,0,${0.06 + r() * 0.06})`; x.fillRect(i, 0, 1, 256);
    x.fillStyle = `rgba(255,230,140,${0.05 + r() * 0.06})`; x.fillRect(0, i, 256, 1);
  }
  for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(90,50,0,${r() * 0.12})`; x.fillRect(r() * 256, r() * 256, 1, 1); }
  return tex(c, { repeat: [6, 6] });
}

function paperBase(w, h, side, seed = 3) {
  const c = canvas(w, h), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = '#f5edd9'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '120,90,40' : '255,255,255'},${r() * 0.07})`; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1); }
  for (let i = 0; i < 260; i++) {
    x.strokeStyle = `rgba(140,110,60,${0.04 + r() * 0.05})`; x.lineWidth = 1; x.beginPath();
    const px = r() * w, py = r() * h; x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 30, py + (r() - 0.5) * 30); x.stroke();
  }
  // ظل المنتصف (الكعب) وحافة الصفحة
  const spineX = side > 0 ? 0 : w;
  const g = x.createLinearGradient(spineX, 0, spineX + (side > 0 ? 1 : -1) * w * 0.2, 0);
  g.addColorStop(0, 'rgba(70,45,15,0.5)'); g.addColorStop(0.45, 'rgba(70,45,15,0.12)'); g.addColorStop(1, 'rgba(70,45,15,0)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  const e = x.createLinearGradient(side > 0 ? w : 0, 0, side > 0 ? w * 0.96 : w * 0.04, 0);
  e.addColorStop(0, 'rgba(80,60,30,0.14)'); e.addColorStop(1, 'rgba(80,60,30,0)');
  x.fillStyle = e; x.fillRect(0, 0, w, h);
  return c;
}

function handRect(x, ctx, x0, y0, x1, y1, rd, seed) {
  const r = rng(seed);
  for (let p = 0; p < 2; p++) {
    ctx.beginPath();
    const j = () => (r() - 0.5) * 5;
    ctx.moveTo(x0 + rd + j(), y0 + j());
    ctx.lineTo(x1 - rd + j(), y0 + j()); ctx.quadraticCurveTo(x1 + j(), y0 + j(), x1 + j(), y0 + rd);
    ctx.lineTo(x1 + j(), y1 - rd); ctx.quadraticCurveTo(x1 + j(), y1 + j(), x1 - rd, y1 + j());
    ctx.lineTo(x0 + rd, y1 + j()); ctx.quadraticCurveTo(x0 + j(), y1 + j(), x0 + j(), y1 - rd);
    ctx.lineTo(x0 + j(), y0 + rd); ctx.quadraticCurveTo(x0 + j(), y0 + j(), x0 + rd, y0 + j());
    ctx.stroke();
  }
}

function leftPageCanvas(pageNo) {
  const c = paperBase(1024, 1365, -1, 11), x = c.getContext('2d');
  x.fillStyle = 'rgba(29,39,53,0.45)'; x.font = '700 30px "Amiri", serif'; x.textAlign = 'center';
  x.fillText(String(pageNo), 512, 1330);
  return c;
}

export function rightPageCanvas(lesson) {
  const c = paperBase(1024, 1365, 1, 17), x = c.getContext('2d');
  x.strokeStyle = 'rgba(29,39,53,0.45)'; x.lineWidth = 3;
  handRect(x, x, 120, 70, 960, 1290, 36, 4);
  x.setLineDash([10, 12]); x.strokeStyle = 'rgba(29,39,53,0.22)'; x.lineWidth = 2;
  handRect(x, x, 145, 95, 935, 1265, 28, 8);
  x.setLineDash([]);
  if (lesson) {
    x.fillStyle = 'rgba(29,39,53,0.6)'; x.textAlign = 'center';
    x.font = '700 36px "Aref Ruqaa", "Amiri", serif';
    x.fillText(`${t('الشكل','Figure')} ${lesson.id}`, 540, 1228);
    x.font = '400 28px "Amiri", serif';
    x.fillText(lesson.en, 540, 1262);
  }
  return c;
}

function blindsTexture() {
  const c = canvas(512, 512), x = c.getContext('2d');
  x.fillStyle = '#2a2a2a'; x.fillRect(0, 0, 512, 512);
  const slats = 8, h = 512 / slats;
  for (let i = 0; i < slats; i++) {
    const g = x.createLinearGradient(0, i * h, 0, i * h + h);
    g.addColorStop(0, '#2a2a2a'); g.addColorStop(0.18, '#ffffff'); g.addColorStop(0.72, '#ffffff'); g.addColorStop(0.9, '#2a2a2a');
    x.fillStyle = g; x.fillRect(0, i * h, 512, h);
  }
  const vg = x.createRadialGradient(256, 256, 120, 256, 256, 290);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.95)');
  x.fillStyle = vg; x.fillRect(0, 0, 512, 512);
  const t = tex(c);
  return t;
}

// ---------------- الكتاب ----------------
export class BookScene {
  constructor(container) {
    this.container = container;
    const w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.className = 'gl';

    this.css = new CSS3DRenderer();
    this.css.setSize(w, h);
    this.css.domElement.className = 'css3d';
    container.appendChild(this.css.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2b2118);
    this.camera = new THREE.PerspectiveCamera(35, w / h, 0.5, 200);
    this.raycaster = new THREE.Raycaster();
    this.model = null;
    this.hitsExtra = [];
    this.cam = { tx: 0, ty: 0.3, tz: 0.3, dist: 14, pitch: 1.05, yaw: 0 };
    this.goal = { ...this.cam };
    this.orbit = { yaw: 0, pitch: 0, zoom: 1 };
    this.viewName = 'all';
    this.flipping = false;

    this.buildLights();
    this.buildDesk();
    this.buildBook();
    this.buildRibbon();
    this.buildProps();
    this.buildFlipSheet();
    setInkResolution(w, h);
    this.setView('all', true);
    this.resize();
  }

  buildLights() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0xffe9cf, 0x4a3524, 0.75));
    const sun = new THREE.SpotLight(0xffd9a3, 5200, 0, 0.48, 0.55, 2);
    sun.position.set(-13, 21, -9);
    sun.target.position.set(0.5, 0, 0.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 10; sun.shadow.camera.far = 50;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    sun.map = blindsTexture();
    s.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(0xbcd2ff, 0.55);
    fill.position.set(6, 10, 14);
    s.add(fill);
  }

  buildDesk() {
    const t = woodTexture(); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(90, 45), new THREE.MeshStandardMaterial({ map: t, roughness: 0.88 }));
    desk.rotation.x = -Math.PI / 2;
    desk.receiveShadow = true;
    this.scene.add(desk);
  }

  stackGeometry(sign) {
    const pts = [[0, COVER], [PW, COVER], [PW, pageY(PW) - 0.004]];
    for (let i = 24; i >= 0; i--) { const d = (i / 24) * PW; pts.push([d, pageY(d) - 0.004]); }
    const arr = sign > 0 ? pts : pts.map(([d, y]) => [-d, y]).reverse();
    const shape = new THREE.Shape(arr.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: PH, bevelEnabled: false, steps: 1 });
    g.translate(0, 0, -PH / 2);
    return g;
  }

  pageGeometry(sign) {
    const g = new THREE.PlaneGeometry(PW, PH, 60, 1);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const xl = p.getX(i);
      const d = sign > 0 ? xl + PW / 2 : PW / 2 - xl;
      p.setX(i, sign > 0 ? d : -d);
      p.setY(i, pageY(d) + 0.002);
    }
    g.computeVertexNormals();
    return g;
  }

  buildBook() {
    const book = (this.book = new THREE.Group());
    this.scene.add(book);
    const cloth = new THREE.MeshStandardMaterial({ map: clothTexture(), roughness: 0.95, color: 0xffffff });
    for (const s of [-1, 1]) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(PW + 0.4, COVER, PH + 0.45), cloth);
      board.position.set(s * (PW + 0.4) / 2 + s * 0.04, COVER / 2, 0);
      board.castShadow = board.receiveShadow = true;
      book.add(board);
    }
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, PH + 0.45), cloth);
    spine.position.set(0, 0.045, 0); spine.receiveShadow = true; book.add(spine);

    // حزمة الورق (يمين/يسار) مع خطوط الطبقات على الحواف
    const stackMat = new THREE.MeshStandardMaterial({ color: 0xece0c4, roughness: 1 });
    const lineMat = new THREE.LineBasicMaterial({ color: 0x8c7a55, transparent: true, opacity: 0.55 });
    for (const s of [-1, 1]) {
      const st = new THREE.Mesh(this.stackGeometry(s), stackMat);
      st.castShadow = st.receiveShadow = true;
      book.add(st);
      const pts = [];
      const K = 12;
      for (let k = 1; k <= K; k++) {
        const y = COVER + (k / (K + 1)) * STACK;
        for (const z of [PH / 2 + 0.002, -PH / 2 - 0.002]) {
          let prev = null;
          for (let i = 0; i <= 24; i++) {
            const d = (i / 24) * PW;
            if (y > pageY(d) - 0.01) { prev = null; continue; }
            const p = new THREE.Vector3(s * d, y, z);
            if (prev) pts.push(prev, p);
            prev = p;
          }
        }
        pts.push(new THREE.Vector3(s * (PW + 0.002), y, -PH / 2), new THREE.Vector3(s * (PW + 0.002), y, PH / 2));
      }
      book.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    }

    // الصفحتان العلويتان
    this.leftTex = tex(leftPageCanvas(0));
    this.rightTex = tex(rightPageCanvas(null));
    const pm = (t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
    this.leftMat = pm(this.leftTex);
    this.rightMat = pm(this.rightTex);
    this.leftPage = new THREE.Mesh(this.pageGeometry(-1), this.leftMat);
    this.rightPage = new THREE.Mesh(this.pageGeometry(1), this.rightMat);
    for (const p of [this.leftPage, this.rightPage]) { p.receiveShadow = true; p.castShadow = false; book.add(p); }
    // لوح الصفحة الأيسر في أبعاد CSS3D
    this.modelRoot = new THREE.Group();
    this.modelRoot.position.set(3.3, BASE + 0.004, 0.1);
    this.scene.add(this.modelRoot);
  }

  buildRibbon() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.16, pageY(0.2) + 0.03, PH / 2 - 0.6),
      new THREE.Vector3(-0.2, pageY(0.2) + 0.04, PH / 2 + 0.1),
      new THREE.Vector3(-0.3, BASE - 0.2, PH / 2 + 0.55),
      new THREE.Vector3(-0.45, COVER + 0.02, PH / 2 + 1.1),
      new THREE.Vector3(-0.7, 0.03, PH / 2 + 1.75),
      new THREE.Vector3(-0.95, 0.025, PH / 2 + 2.55),
    ]);
    const N = 60, w = 0.16, pos = [], idx = [], uv = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, p = curve.getPoint(t), tg = curve.getTangent(t);
      const side = new THREE.Vector3(0, 1, 0).cross(tg).normalize().multiplyScalar(w / 2);
      pos.push(p.x + side.x, p.y + side.y, p.z + side.z, p.x - side.x, p.y - side.y, p.z - side.z);
      uv.push(0, t, 1, t);
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    // طرف الشريط بشكل V
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const rm = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x2f6fc4, roughness: 0.7, side: THREE.DoubleSide }));
    rm.castShadow = true; rm.receiveShadow = true;
    rm.userData.id = 'ribbon';
    this.ribbon = rm;
    this.book.add(rm);
    this.hitsExtra.push(rm);
  }

  buildProps() {
    const g = new THREE.Group();
    const yel = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 4.2, 6), yel);
    body.rotation.z = Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.35, 6), new THREE.MeshStandardMaterial({ color: 0xe6c79a, roughness: 0.9 }));
    tip.rotation.z = Math.PI / 2; tip.position.x = -2.27;
    const lead = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0x2b2b2b }));
    lead.rotation.z = Math.PI / 2; lead.position.x = -2.5;
    const fer = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0xb9bcc2, metalness: 0.8, roughness: 0.35 }));
    fer.rotation.z = Math.PI / 2; fer.position.x = 2.2;
    const er = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0xe88aa0, roughness: 0.9 }));
    er.rotation.z = Math.PI / 2; er.position.x = 2.4;
    g.add(body, tip, lead, fer, er);
    g.children.forEach((c) => { c.castShadow = true; });
    g.position.set(8.2, 0.12, 3.2); g.rotation.y = -0.45;
    this.scene.add(g);
    const eraser = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.45), new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.95 }));
    eraser.position.set(8.6, 0.15, 1.2); eraser.rotation.y = 0.5; eraser.castShadow = true;
    this.scene.add(eraser);
  }

  buildFlipSheet() {
    const g = new THREE.PlaneGeometry(PW, PH, 48, 1);
    this.sheetGeo = g;
    this.frontMat = new THREE.MeshStandardMaterial({ map: this.rightTex, roughness: 0.95, side: THREE.FrontSide });
    this.backMat = new THREE.MeshStandardMaterial({ map: this.leftTex.clone(), roughness: 0.95, side: THREE.BackSide });
    this.backMat.map.repeat.set(-1, 1); this.backMat.map.offset.set(1, 0);
    this.sheetFront = new THREE.Mesh(g, this.frontMat);
    this.sheetBack = new THREE.Mesh(g, this.backMat);
    for (const m of [this.sheetFront, this.sheetBack]) { m.castShadow = true; m.receiveShadow = true; m.visible = false; m.frustumCulled = false; this.scene.add(m); }
    this.sheetFront.customDepthMaterial = this.sheetBack.customDepthMaterial = new THREE.MeshDepthMaterial({ side: THREE.DoubleSide });
    this.poseSheet(0);
  }

  // t: 0 = مسطّحة على اليمين ، 1 = مسطّحة على اليسار
  poseSheet(t) {
    const p = this.sheetGeo.attributes.position;
    const cols = 49, base = pageY(0) + 0.012;
    let x = 0, y = base, prevD = 0;
    const a = t * Math.PI, blend = THREE.MathUtils.smoothstep(Math.min(t, 1 - t), 0, 0.22);
    const lift = Math.sin(a) * 0.18;
    for (let i = 0; i < cols; i++) {
      const d = (i / (cols - 1)) * PW;
      const phi = a - Math.sin(a) * 0.95 * (d / PW);
      if (i > 0) { const dd = d - prevD; x += Math.cos(phi) * dd; y += Math.sin(phi) * dd; }
      prevD = d;
      const yy = y + (pageY(d) - pageY(0)) * (1 - blend) + lift * Math.sin(Math.PI * d / PW) * 0.3;
      for (const row of [0, 1]) {
        const idx = row * cols + i;
        p.setXYZ(idx, x, yy, row === 0 ? -PH / 2 : PH / 2);
      }
    }
    p.needsUpdate = true;
    this.sheetGeo.computeVertexNormals();
    this.sheetGeo.computeBoundingSphere();
  }

  // ----------- واجهة الصفحة اليسرى HTML -----------
  mountLeftUI(el) {
    // عنصر حامل بحجم صفري: إزاحة translate(-50%) في CSS3D تُحسب بالبكسل لا بوحدات العالم
    const holder = document.createElement('div');
    holder.className = 'page-holder';
    el.style.width = PAGE_PX.w + 'px'; el.style.height = PAGE_PX.h + 'px';
    el.style.left = -PAGE_PX.w / 2 + 'px'; el.style.top = -PAGE_PX.h / 2 + 'px';
    holder.appendChild(el);
    const obj = new CSS3DObject(holder);
    obj.position.set(-PW / 2, BASE + 0.012, 0);
    obj.rotation.x = -Math.PI / 2;
    obj.scale.setScalar(PW / PAGE_PX.w);
    this.scene.add(obj);
    this.leftUI = obj;
  }

  setPageNumbers(n) {
    const c = leftPageCanvas(n);
    this.leftTex.image = c; this.leftTex.needsUpdate = true;
    this.backMat.map.image = c; this.backMat.map.needsUpdate = true;
  }

  setRightLesson(lesson) {
    const c = rightPageCanvas(lesson);
    this.rightTex.image = c; this.rightTex.needsUpdate = true;
  }

  // ----------- مجسّم الدرس -----------
  mountModel(model) {
    this.unmountModel();
    this.model = model;
    this.modelRoot.add(model.group);
    model.setReveal(0);
  }
  unmountModel() {
    if (!this.model) return;
    this.modelRoot.remove(this.model.group);
    this.model.dispose();
    this.model = null;
  }

  // ----------- قلب الصفحة -----------
  flip(dir, nextLesson, onMid) {
    return new Promise((resolve) => {
      this.flipping = true;
      const dur = 1050, t0 = performance.now();
      let midDone = false;
      const prev = dir < 0;
      // نسخة بنسيج الوجه الأمامي
      if (prev) {
        this.frontMat.map = new THREE.CanvasTexture(rightPageCanvas(nextLesson));
        this.frontMat.map.colorSpace = THREE.SRGBColorSpace;
      } else {
        this.frontMat.map = new THREE.CanvasTexture(this.rightTex.image);
        this.frontMat.map.colorSpace = THREE.SRGBColorSpace;
        this.setRightLesson(nextLesson);
      }
      this.frontMat.needsUpdate = true;
      this.sheetFront.visible = this.sheetBack.visible = true;
      const step = () => {
        const p = Math.min(1, (performance.now() - t0) / dur);
        const e = easeInOut(p);
        this.poseSheet(prev ? 1 - e : e);
        if (!midDone && p >= 0.5) { midDone = true; onMid?.(); }
        if (p < 1) requestAnimationFrame(step);
        else {
          if (prev) this.setRightLesson(nextLesson);
          this.sheetFront.visible = this.sheetBack.visible = false;
          this.flipping = false;
          resolve();
        }
      };
      step();
    });
  }

  // ----------- الكاميرا -----------
  fit(fitW, pitch, extra = 1.2) {
    const vf = THREE.MathUtils.degToRad(this.camera.fov);
    const hf = 2 * Math.atan(Math.tan(vf / 2) * this.camera.aspect);
    const dW = fitW / 2 / Math.tan(hf / 2);
    const dV = (PH * 1.08 * Math.sin(pitch) + extra) / 2 / Math.tan(vf / 2);
    return Math.max(dW, dV);
  }
  setView(name, instant = false) {
    this.viewName = name;
    const portrait = this.camera.aspect < 0.85;
    const V = {
      all: { tx: 0, ty: 0.3, tz: 0.35, fitW: 14.6, pitch: 1.03, extra: 1.2 },
      read: { tx: -3, ty: 0.3, tz: 0.35, fitW: 8.6, pitch: 1.0, extra: 1.2 },
      play: { tx: 3.2, ty: 0.9, tz: -0.2, fitW: 8.8, pitch: 0.98, extra: 4.6 },
    };
    const v = V[name] || V.all;
    this.goal = { tx: v.tx, ty: v.ty, tz: v.tz, pitch: v.pitch, yaw: 0, dist: this.fit(v.fitW, v.pitch, v.extra) };
    this.orbit = { yaw: 0, pitch: 0, zoom: 1 };
    if (instant) this.cam = { ...this.goal };
    void portrait;
  }
  nudge(dx, dy) {
    this.orbit.yaw = THREE.MathUtils.clamp(this.orbit.yaw - dx * 0.004, -0.6, 0.6);
    this.orbit.pitch = THREE.MathUtils.clamp(this.orbit.pitch + dy * 0.003, -0.35, 0.3);
  }
  zoom(d) { this.orbit.zoom = THREE.MathUtils.clamp(this.orbit.zoom * (1 + d * 0.0012), 0.55, 1.5); }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.css.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    setInkResolution(w, h);
    this.setView(this.viewName, true);
  }

  // ----------- لمس المجسّمات -----------
  pick(clientX, clientY) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    this.raycaster.camera = this.camera;
    const list = [...(this.model?.hits || []), ...this.hitsExtra].filter((o) => {
      for (let p = o; p; p = p.parent) if (!p.visible) return false;
      return true;
    });
    const hits = this.raycaster.intersectObjects(list, false);
    for (const h of hits) {
      const id = h.object.userData.id;
      if (id) return { id, object: h.object };
    }
    return null;
  }

  frame(dt, time) {
    const k = 1 - Math.exp(-5 * dt);
    for (const key of ['tx', 'ty', 'tz', 'dist', 'pitch', 'yaw']) this.cam[key] += (this.goal[key] - this.cam[key]) * k;
    const yaw = this.cam.yaw + this.orbit.yaw, pitch = this.cam.pitch + this.orbit.pitch, dist = this.cam.dist * this.orbit.zoom;
    this.camera.position.set(
      this.cam.tx + Math.sin(yaw) * Math.cos(pitch) * dist,
      this.cam.ty + Math.sin(pitch) * dist,
      this.cam.tz + Math.cos(yaw) * Math.cos(pitch) * dist,
    );
    this.camera.lookAt(this.cam.tx, this.cam.ty, this.cam.tz);
    this.model?.update(dt, time);
    this.renderer.render(this.scene, this.camera);
    this.css.render(this.scene, this.camera);
  }
}
